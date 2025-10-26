import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { getJournal, saveJournal } from '../../services/storageService';
import { useAppDispatch } from '../../stores/hooks';
import { addJournal, updateJournal } from '../../stores/slices/journalsSlice';
import { Journal } from '../../types';
import { Alert } from '../../utils/alert';
import { useAuth } from '../../utils/authContext';

const JournalEditorScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { encryptionKey } = useAuth();

  const journalId = route.params?.journalId;
  const isEditing = !!journalId;

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadJournal();
    }
  }, [journalId]);

  useEffect(() => {
    // Set up auto-save on back button
    navigation.setOptions({
      headerLeft: () => null, // We'll handle back ourselves
    });
  }, [navigation]);

  const loadJournal = async () => {
    if (!encryptionKey) return;

    setIsLoading(true);
    try {
      const journal = await getJournal(journalId, encryptionKey);
      if (journal) {
        setTitle(journal.title || '');
        setText(journal.text);
      }
    } catch (error) {
      console.error('Error loading journal:', error);
      Alert.alert('Error', 'Failed to load journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (showAlert: boolean = true) => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please write something before saving');
      return false;
    }

    if (!encryptionKey) {
      Alert.alert('Error', 'Encryption key not found. Please log in again.');
      return false;
    }

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      
      const journal: Journal = {
        id: journalId || uuidv4(),
        date: journalId ? (await getJournal(journalId, encryptionKey))?.date || now : now,
        createdAt: journalId ? (await getJournal(journalId, encryptionKey))?.createdAt || now : now,
        updatedAt: now,
        title: title.trim() || undefined,
        text: text.trim(),
        mood: undefined, // Will add mood selector later
        images: undefined, // Will add in Sprint 4
      };

      // Save to encrypted storage
      await saveJournal(journal, encryptionKey);

      // Update Redux state
      if (isEditing) {
        dispatch(updateJournal(journal));
      } else {
        dispatch(addJournal(journal));
      }

      if (showAlert) {
        Alert.alert('Success', 'Journal entry saved!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Failed to save journal entry');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    // Auto-save if there's content
    if (text.trim()) {
      const saved = await handleSave(false);
      if (saved) {
        navigation.goBack();
      }
    } else {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <HelperText type="info">Loading...</HelperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            label="Title (optional)"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.titleInput}
            placeholder="Give your entry a title..."
          />

          <TextInput
            label="What's on your mind?"
            value={text}
            onChangeText={setText}
            mode="outlined"
            multiline
            numberOfLines={20}
            style={styles.textInput}
            placeholder="Start writing..."
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleBack}
              style={[styles.button, styles.backButton]}
              disabled={isSaving}
            >
              Back
            </Button>
            
            <Button
              mode="contained"
              onPress={() => handleSave(true)}
              style={[styles.button, styles.saveButton]}
              disabled={isSaving || !text.trim()}
              loading={isSaving}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInput: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
    minHeight: 300,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
});

export default JournalEditorScreen;
