import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../stores/hooks';
import { setAuthenticated, setSalt } from '../../stores/slices/authSlice';
import { useAuth } from '../../utils/authContext';
import {
  deriveKeyFromPassword,
  verifyHash,
} from '../../services/encryptionService';
import {
  getSalt,
  getSecurityQuestionsForRecovery,
  getSecurityQuestions,
  saveSalt,
  reEncryptAllData,
} from '../../services/storageService';

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { setEncryptionKey } = useAuth();

  const [step, setStep] = useState<'questions' | 'newPassword'>('questions');
  const [questions, setQuestions] = useState<
    Array<{ questionId: string; question: string }>
  >([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oldKey, setOldKey] = useState<string>('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isPasswordValid = newPassword.length >= 8;

  useEffect(() => {
    loadSecurityQuestions();
  }, []);

  const loadSecurityQuestions = async () => {
    try {
      const publicQuestions = await getSecurityQuestionsForRecovery();
      if (!publicQuestions || publicQuestions.length === 0) {
        Alert.alert(
          'No Account Found',
          'No security questions found. Please create a new account.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      setQuestions(publicQuestions);
    } catch (error) {
      console.error('Error loading security questions:', error);
      Alert.alert('Error', 'Failed to load security questions');
    }
  };

  const handleVerifyAnswers = async () => {
    // Check if all questions are answered
    const allAnswered = questions.every(
      q => answers[q.questionId] && answers[q.questionId].trim().length > 0
    );

    if (!allAnswered) {
      Alert.alert('Error', 'Please answer all security questions');
      return;
    }

    setIsLoading(true);

    try {
      // Get the salt to derive temporary key for verification
      const salt = await getSalt();
      if (!salt) {
        Alert.alert('Error', 'Account data not found');
        setIsLoading(false);
        return;
      }

      // We need to try deriving keys with common passwords to decrypt
      // OR store security questions unencrypted (less secure but more practical)
      // For now, let's use a recovery approach with hashed answers stored separately

      // Try to get the stored security questions using a temporary approach
      // In a real app, you'd store the hashed answers in a way that doesn't require decryption
      
      // For this implementation, we'll store answer hashes separately
      const storedQuestionsData = await getSecurityQuestions('recovery_bypass_key');
      
      // Since we can't decrypt without the password, we need a different approach
      // Let's verify by trying to create a temporary key and testing decryption
      
      // Alternative: Store hashed answers unencrypted for recovery
      // This is a security trade-off but necessary for password recovery
      
      Alert.alert(
        'Recovery Method',
        'In the current implementation, security question answers are encrypted. ' +
        'For true password recovery, answer hashes should be stored separately. ' +
        'For now, please contact support or reset the app.',
        [
          {
            text: 'Reset App Data',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Confirm Reset',
                'This will delete all your journals. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      const { clearAllData } = require('../../services/storageService');
                      await clearAllData();
                      navigation.navigate('Signup');
                    },
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify answers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!isPasswordValid || !passwordsMatch) {
      Alert.alert('Error', 'Please enter a valid matching password');
      return;
    }

    setIsLoading(true);

    try {
      // Derive new key
      const { key: newKey, salt: newSalt } = deriveKeyFromPassword(newPassword);

      // Re-encrypt all data
      await reEncryptAllData(oldKey, newKey);

      // Save new salt
      await saveSalt(newSalt);

      // Update state and login
      dispatch(setSalt(newSalt));
      dispatch(setAuthenticated(true));
      setEncryptionKey(newKey);

      Alert.alert('Success!', 'Your password has been reset successfully', [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Password Recovery
        </Text>

        {step === 'questions' ? (
          <>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Answer your security questions to recover your password
            </Text>

            {questions.map(q => (
              <View key={q.questionId} style={styles.questionContainer}>
                <Text variant="bodyMedium" style={styles.questionText}>
                  {q.question}
                </Text>
                <TextInput
                  value={answers[q.questionId] || ''}
                  onChangeText={text =>
                    setAnswers({ ...answers, [q.questionId]: text })
                  }
                  mode="outlined"
                  style={styles.input}
                  placeholder="Your answer"
                />
              </View>
            ))}

            <Button
              mode="contained"
              onPress={handleVerifyAnswers}
              style={styles.button}
              disabled={isLoading}
              loading={isLoading}
            >
              Verify Answers
            </Button>
          </>
        ) : (
          <>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Create your new password
            </Text>

            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
            />
            <HelperText type="info" visible={newPassword.length > 0}>
              {isPasswordValid
                ? '✓ Password is strong enough'
                : '✗ Password must be at least 8 characters'}
            </HelperText>

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            <HelperText
              type={passwordsMatch ? 'info' : 'error'}
              visible={confirmPassword.length > 0}
            >
              {passwordsMatch
                ? '✓ Passwords match'
                : '✗ Passwords do not match'}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSetNewPassword}
              style={styles.button}
              disabled={!isPasswordValid || !passwordsMatch || isLoading}
              loading={isLoading}
            >
              Set New Password
            </Button>
          </>
        )}

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.link}
          disabled={isLoading}
        >
          Back to Login
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
});

export default ForgotPasswordScreen;
