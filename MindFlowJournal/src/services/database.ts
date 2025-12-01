import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickSQLite } from 'react-native-quick-sqlite';
import { Journal, SecurityQuestion } from '../types';
import { decryptJSON, encryptJSON } from './encryptionService';

const DB_NAME = 'mindflow.db';

// --- Database Initialization ---

export const initDatabase = () => {
  // Open the database (creates if doesn't exist)
  const result = QuickSQLite.open(DB_NAME);
  
  // if (result.status ) {
  //   throw new Error('Failed to open database');
  // }

  // Create tables
  QuickSQLite.execute(DB_NAME, `
    CREATE TABLE IF NOT EXISTS key_value_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  QuickSQLite.execute(DB_NAME, `
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      created_at INTEGER, 
      updated_at INTEGER,
      encrypted_data TEXT NOT NULL
    );
  `);
};

// Call this when app starts
initDatabase();

// --- Helper for Key-Value Store ---

const setValue = (key: string, value: string) => {
  QuickSQLite.execute(
    DB_NAME,
    'INSERT OR REPLACE INTO key_value_store (key, value) VALUES (?, ?)',
    [key, value]
  );
};

const getValue = (key: string): string | null => {
  const result = QuickSQLite.execute(
    DB_NAME,
    'SELECT value FROM key_value_store WHERE key = ?',
    [key]
  );
  
  if (result.rows && result.rows.length > 0) {
    return result.rows.item(0).value;
  }
  return null;
};

const deleteValue = (key: string) => {
  QuickSQLite.execute(
    DB_NAME,
    'DELETE FROM key_value_store WHERE key = ?',
    [key]
  );
};

// --- Storage Keys ---
const KEYS = {
  SALT: 'mindflow_salt',
  SECURITY_QUESTIONS: 'mindflow_security_questions',
  SECURITY_ANSWERS_HASH: 'mindflow_security_answers_hash',
  VERIFICATION_TOKEN: 'mindflow_verification_token',
  FIRST_LAUNCH: 'mindflow_first_launch',
  PUBLIC_QUESTIONS: 'mindflow_public_questions',
};

// --- Core Functions ---

export const isFirstLaunch = async (): Promise<boolean> => {
  try {
    const value = getValue(KEYS.FIRST_LAUNCH);
    return value === null;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
};

export const markAsLaunched = async (): Promise<void> => {
  try {
    setValue(KEYS.FIRST_LAUNCH, 'true');
  } catch (error) {
    console.error('Error marking as launched:', error);
  }
};

export const saveSalt = async (salt: string): Promise<void> => {
  try {
    setValue(KEYS.SALT, salt);
  } catch (error) {
    console.error('Error saving salt:', error);
    throw new Error('Failed to save encryption salt');
  }
};

export const getSalt = async (): Promise<string | null> => {
  try {
    return getValue(KEYS.SALT);
  } catch (error) {
    console.error('Error getting salt:', error);
    return null;
  }
};

// --- Security Questions ---

export const saveSecurityQuestions = async (
  questions: SecurityQuestion[],
  key: string
): Promise<void> => {
  try {
    const encrypted = encryptJSON(key, questions);
    setValue(KEYS.SECURITY_QUESTIONS, encrypted);
  } catch (error) {
    console.error('Error saving security questions:', error);
    throw new Error('Failed to save security questions');
  }
};

export const getSecurityQuestions = async (
  key: string
): Promise<SecurityQuestion[] | null> => {
  try {
    const encrypted = getValue(KEYS.SECURITY_QUESTIONS);
    if (!encrypted) return null;
    return decryptJSON(key, encrypted) as SecurityQuestion[];
  } catch (error) {
    console.error('Error getting security questions:', error);
    return null;
  }
};

export const saveSecurityAnswerHashes = async (
  answerHashes: Array<{ questionId: string; answerHash: string }>
): Promise<void> => {
  try {
    setValue(KEYS.SECURITY_ANSWERS_HASH, JSON.stringify(answerHashes));
  } catch (error) {
    console.error('Error saving answer hashes:', error);
    throw new Error('Failed to save security answer hashes');
  }
};

export const getSecurityAnswerHashes = async (): Promise<
  Array<{ questionId: string; answerHash: string }> | null
> => {
  try {
    const data = getValue(KEYS.SECURITY_ANSWERS_HASH);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting answer hashes:', error);
    return null;
  }
};

export const savePublicSecurityQuestions = async (
  questions: Array<{ questionId: string; question: string }>
): Promise<void> => {
  try {
    setValue(KEYS.PUBLIC_QUESTIONS, JSON.stringify(questions));
  } catch (error) {
    console.error('Error saving public security questions:', error);
    throw new Error('Failed to save security questions');
  }
};

export const getSecurityQuestionsForRecovery = async (): Promise<
  Array<{ questionId: string; question: string }> | null
> => {
  try {
    const data = getValue(KEYS.PUBLIC_QUESTIONS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting security questions for recovery:', error);
    return null;
  }
};

// --- Journal Functions ---

export const saveJournal = async (
  journal: Journal,
  key: string
): Promise<void> => {
  try {
    const encryptedData = encryptJSON(key, journal);
    
    // Assuming Journal has a date field - adjust based on your type
    const createdAt = new Date(journal.date || Date.now()).getTime();
    const updatedAt = Date.now();

    QuickSQLite.execute(
      DB_NAME,
      'INSERT OR REPLACE INTO journals (id, created_at, updated_at, encrypted_data) VALUES (?, ?, ?, ?)',
      [journal.id, createdAt, updatedAt, encryptedData]
    );
  } catch (error) {
    console.error('Error saving journal:', error);
    throw new Error('Failed to save journal');
  }
};

export const getJournal = async (
  id: string,
  key: string
): Promise<Journal | null> => {
  try {
    const result = QuickSQLite.execute(
      DB_NAME,
      'SELECT encrypted_data FROM journals WHERE id = ?',
      [id]
    );
    
    if (!result.rows || result.rows.length === 0) return null;
    
    const encrypted = result.rows.item(0).encrypted_data;
    return decryptJSON(key, encrypted) as Journal;
  } catch (error) {
    console.error('Error getting journal:', error);
    return null;
  }
};

export const listJournals = async (key: string): Promise<Journal[]> => {
  try {
    const result = QuickSQLite.execute(
      DB_NAME,
      'SELECT encrypted_data FROM journals ORDER BY created_at DESC'
    );
    
    if (!result.rows) return [];

    const journals: Journal[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const encrypted = result.rows.item(i).encrypted_data;
      const journal = decryptJSON(key, encrypted) as Journal;
      if (journal) journals.push(journal);
    }
    
    return journals;
  } catch (error) {
    console.error('Error listing journals:', error);
    throw new Error('Failed to load journals - wrong password?');
  }
};

export const deleteJournal = async (
  id: string,
  key: string
): Promise<void> => {
  try {
    QuickSQLite.execute(
      DB_NAME,
      'DELETE FROM journals WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Error deleting journal:', error);
    throw new Error('Failed to delete journal');
  }
};

// --- Re-encryption ---

export const reEncryptAllData = async (
  oldKey: string,
  newKey: string
): Promise<void> => {
  try {
    const journals = await listJournals(oldKey);
    
    for (const journal of journals) {
      await saveJournal(journal, newKey);
    }

    const questions = await getSecurityQuestions(oldKey);
    if (questions) {
      await saveSecurityQuestions(questions, newKey);
    }
    
    await saveVerificationToken(newKey);
    
  } catch (error) {
    console.error('Error re-encrypting data:', error);
    throw new Error('Failed to re-encrypt data - please try again');
  }
};

// --- Verification ---

export const saveVerificationToken = async (key: string): Promise<void> => {
  try {
    const verificationData = {
      timestamp: new Date().toISOString(),
      verified: true,
    };
    const encrypted = encryptJSON(key, verificationData);
    setValue(KEYS.VERIFICATION_TOKEN, encrypted);
  } catch (error) {
    console.error('Error saving verification token:', error);
    throw new Error('Failed to save verification token');
  }
};

export const verifyPassword = async (key: string): Promise<boolean> => {
  try {
    const encrypted = getValue(KEYS.VERIFICATION_TOKEN);
    if (!encrypted) return true;
    
    const decrypted = decryptJSON(key, encrypted);
    return decrypted && decrypted.verified === true;
  } catch (error) {
    return false;
  }
};

// --- Clear Data ---

export const clearAllData = async (): Promise<void> => {
  try {
    QuickSQLite.execute(DB_NAME, 'DELETE FROM journals');
    QuickSQLite.execute(DB_NAME, 'DELETE FROM key_value_store');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new Error('Failed to clear data');
  }
};

// --- Migration ---

export const migrateFromAsyncStorage = async (key: string): Promise<void> => {
  const isMigrated = getValue('MIGRATION_COMPLETE_V1');
  if (isMigrated) return;

  try {
    const oldJournalsStr = await AsyncStorage.getItem('@mindflow_journals');
    if (oldJournalsStr) {
      const journals = decryptJSON(key, oldJournalsStr) as Journal[];
      if (journals && journals.length) {
        for (const journal of journals) {
          await saveJournal(journal, key);
        }
      }
    }

    const salt = await AsyncStorage.getItem('@mindflow_salt');
    if (salt) setValue(KEYS.SALT, salt);

    setValue('MIGRATION_COMPLETE_V1', 'true');
    console.log('Migration to SQLite successful');
    
  } catch (e) {
    console.error('Migration failed', e);
  }
};
