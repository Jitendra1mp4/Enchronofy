import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/stores';
import { ThemeProvider } from './src/components/common/ThemeProvider';
import { AuthProvider } from './src/utils/authContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
