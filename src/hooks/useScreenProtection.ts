import { useNavigation } from '@react-navigation/native';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';

/**
 * Custom hook to manage screen security.
 * * Usage: Call this hook in the root component of any Navigation Stack
 * or Screen that requires privacy.
 * * Behavior:
 * - Mount: Prevents screen recording and screenshots.
 * - Unmount: Re-enables screen recording and screenshots.
 * * Android: Sets FLAG_SECURE (Black screen in Recents, no screenshots).
 * iOS: Prevents screen recording (Black screen during recording).
 * Note: For iOS "Blur in Recents", native implementation is often required
 * alongside this, as Apple limits JS control over the multitasking snapshot.
 */
export const useScreenProtection = () => {
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;

    const enableProtection = async () => {
      try {
        // Prevent screen capture (Android: FLAG_SECURE, iOS: Protect content)
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        if (isMounted) {
          console.warn('[ScreenProtection] Failed to enable protection:', error);
        }
      }
    };

    const disableProtection = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
      } catch (error) {
        if (isMounted) {
          console.warn('[ScreenProtection] Failed to disable protection:', error);
        }
      }
    };

    // 1. Enable immediately on mount
    enableProtection();

    // 2. Add listener for focus (Optional extra safety)
    // Ensures protection re-applies if the app state or navigation behaves unexpectedly
    const unsubscribe = navigation.addListener('focus', () => {
      enableProtection();
    });

    // 3. Cleanup on unmount
    return () => {
      isMounted = false;
      unsubscribe();
      disableProtection();
    };
  }, [navigation]);
};