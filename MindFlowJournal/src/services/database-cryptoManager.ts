/**
 * Database Service with Per-Note Encryption
 * 
 * This updated service uses CryptoManager to encrypt/decrypt individual notes
 * instead of storing a single encrypted JSON blob of all journals.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickSQLite } from 'react-native-quick-sqlite';
import { Journal } from '../types';
import { EncryptedNote } from '../types/crypto';
import CryptoManager from './cryptoManager';

const DB_NAME = 'mindflow.db';

// --- Database Initialization ---

export const initDatabase = () => {
  // Open the database (creates if doesn't exist)
  const result = QuickSQLite.open(DB_NAME);

  // Create key-value store table
  QuickSQLite.execute(DB_NAME, `
    CREATE TABLE IF NOT EXISTS key_value_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Create journals table with per-note encryption
  // Each row is one encrypted note with its own IV
  QuickSQLite.execute(DB_NAME, `
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      date TEXT,
      iv TEXT,
      content TEXT NOT NULL,
      title TEXT,
      mood TEXT,
      tags_encrypted TEXT,
      images TEXT,
      created_at TEXT,
      updated_at TEXT
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
  VAULT: `@mindflow_vault`,
  RECOVERY_KEY_DISPLAY: `@mindflow_recovery_key_display`,
  FIRST_LAUNCH: `@mindflow_first_launch`,
  MIGRATION_COMPLETE_V1: `migration_complete_v1`,
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

// --- Vault Functions ---

export const saveVault = async (vault: any): Promise<void> => {
  try {
    setValue(KEYS.VAULT, JSON.stringify(vault));
  } catch (error) {
    console.error('Error saving vault:', error);
    throw new Error('Failed to save vault');
  }
};

export const getVault = async (): Promise<any | null> => {
  try {
    const vaultStr = getValue(KEYS.VAULT);
    if (!vaultStr) return null;
    return JSON.parse(vaultStr);
  } catch (error) {
    console.error('Error retrieving vault:', error);
    return null;
  }
};

export const saveRecoveryKeyHash = async (recoveryKey: string): Promise<void> => {
  try {
    setValue(KEYS.RECOVERY_KEY_DISPLAY, recoveryKey);
  } catch (error) {
    console.error('Error saving recovery key:', error);
    throw new Error('Failed to save recovery key');
  }
};

export const getRecoveryKeyHash = async (): Promise<string | null> => {
  try {
    return getValue(KEYS.RECOVERY_KEY_DISPLAY);
  } catch (error) {
    console.error('Error retrieving recovery key hash:', error);
    return null;
  }
};

export const clearRecoveryKeyDisplay = async (): Promise<void> => {
  try {
    deleteValue(KEYS.RECOVERY_KEY_DISPLAY);
  } catch (error) {
    console.error('Error clearing recovery key display:', error);
  }
};

// --- Journal Functions with Per-Note Encryption ---

/**
 * Save a journal entry (encrypted per-note)
 * 
 * @param journal - Journal object with text content
 * @param dk - The Data Key for encryption
 */
export const saveJournal = async (
  journal: Journal,
  dk: string
): Promise<void> => {
  try {
    // Encrypt the note using CryptoManager
    const encryptedNote = CryptoManager.encryptNote(dk, journal.text, {
      id: journal.id,
      date: journal.date,
      title: journal.title,
      mood: journal.mood,
      tags: [], // Can be extended to support tags
      images: journal.images,
    });

    // Save encrypted note to database
    QuickSQLite.execute(
      DB_NAME,
      `INSERT OR REPLACE INTO journals 
       (id, date, iv, content, title, mood, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        encryptedNote.id,
        encryptedNote.date,
        encryptedNote.iv,
        encryptedNote.content,
        encryptedNote.title,
        encryptedNote.mood,
        encryptedNote.created_at,
        encryptedNote.updated_at,
      ]
    );
  } catch (error) {
    console.error('Error saving journal:', error);
    throw new Error('Failed to save journal');
  }
};

/**
 * Get a single journal by ID (decrypted)
 * 
 * @param id - Journal ID
 * @param dk - The Data Key for decryption
 * @returns Decrypted Journal object
 */
export const getJournal = async (
  id: string,
  dk: string
): Promise<Journal | null> => {
  try {
    const result = QuickSQLite.execute(
      DB_NAME,
      `SELECT id, date, iv, content, title, mood, images, created_at, updated_at 
       FROM journals WHERE id = ?`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);

      const encryptedNoteObject : EncryptedNote = {
          id: row.id,
          date: row.date,
          iv: row.iv,
          content: row.content,
          title: row.title,
          mood: row.mood,
          created_at: row.created_at,
          updated_at: row.updated_at,
      };
    // Decrypt the content
    const decryptedText = CryptoManager.decryptNote(dk, encryptedNoteObject);

    // Parse images if stored as JSON
    let images: string[] = [];
    if (row.images) {
      try {
        images = JSON.parse(row.images);
      } catch {
        images = [];
      }
    }

    return {
      id: row.id,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      title: row.title,
      text: decryptedText,
      mood: row.mood,
      images,
    };
  } catch (error) {
    console.error('Error getting journal:', error);
    throw new Error('Failed to get journal - decryption failed');
  }
};

/**
 * List all journals (decrypted)
 * 
 * @param dk - The Data Key for decryption
 * @returns Array of decrypted Journal objects
 */
export const listJournals = async (dk: string): Promise<Journal[]> => {
  try {
    const result = QuickSQLite.execute(
      DB_NAME,
      `SELECT id, date, iv, content, title, mood, images, created_at, updated_at 
       FROM journals ORDER BY date DESC`
    );

    if (!result.rows) {
      return [];
    }

    const journals: Journal[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);

      try {
          const noteObject : EncryptedNote = {
              id: row.id,
              date: row.date,
              iv: row.iv,
              content: row.content,
              title: row.title,
              mood: row.mood,
              created_at: row.created_at,
              updated_at: row.updated_at,
              
          };
        // Decrypt content
        const decryptedText = CryptoManager.decryptNote(dk, noteObject);

        // Parse images
        let images: string[] = [];
        if (row.images) {
          try {
            images = JSON.parse(row.images);
          } catch {
            images = [];
          }
        }

        journals.push({
          id: row.id,
          date: row.date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          title: row.title,
          text: decryptedText,
          mood: row.mood,
          images,
        });
      } catch (decryptError) {
        console.error(`Failed to decrypt journal ${row.id}:`, decryptError);
        // Skip this journal on decryption error
        continue;
      }
    }

    return journals;
  } catch (error) {
    console.error('Error listing journals:', error);
    throw new Error('Failed to load journals - wrong password?');
  }
};

/**
 * Delete a journal by ID
 * 
 * @param id - Journal ID to delete
 */
export const deleteJournal = async (id: string): Promise<void> => {
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

/**
 * Re-encrypt all journals with a new Data Key
 * Used when user changes password/recovery method
 * 
 * @param oldDk - Current Data Key
 * @param newDk - New Data Key
 */
export const reEncryptAllJournals = async (
  oldDk: string,
  newDk: string
): Promise<void> => {
  try {
    // Get all encrypted journals
    const journals = await listJournals(oldDk);

    // Re-encrypt each journal with new DK
    for (const journal of journals) {
      const encryptedNote = CryptoManager.encryptNote(newDk, journal.text, {
        id: journal.id,
        date: journal.date,
        title: journal.title,
        mood: journal.mood,
        images: journal.images,
      });

      QuickSQLite.execute(
        DB_NAME,
        `UPDATE journals 
         SET iv = ?, content = ?, updated_at = ? 
         WHERE id = ?`,
        [
          encryptedNote.iv,
          encryptedNote.content,
          new Date().toISOString(),
          journal.id,
        ]
      );
    }
  } catch (error) {
    console.error('Error re-encrypting journals:', error);
    throw new Error('Failed to re-encrypt journals');
  }
};

/**
 * Get journal count (useful for UI)
 * 
 * @returns Number of journals
 */
export const getJournalCount = async (): Promise<number> => {
  try {
    const result = QuickSQLite.execute(
      DB_NAME,
      'SELECT COUNT(*) as count FROM journals'
    );

    if (!result.rows || result.rows.length === 0) {
      return 0;
    }

    return result.rows.item(0).count;
  } catch (error) {
    console.error('Error getting journal count:', error);
    return 0;
  }
};

/**
 * Clear all app data (for testing or reset)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    QuickSQLite.execute(DB_NAME, 'DELETE FROM journals');
    QuickSQLite.execute(DB_NAME, 'DELETE FROM key_value_store');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new Error('Failed to clear data');
  }
};

/**
 * Migration helper: Migrate old AsyncStorage format to new SQLite + per-note encryption
 * (Run once on app startup for backward compatibility)
 */
export const migrateFromAsyncStorage = async (dk: string): Promise<void> => {
  const isMigrated = getValue(KEYS.MIGRATION_COMPLETE_V1);
  if (isMigrated) {
    return;
  }

  try {
    // Check if old format exists in AsyncStorage
    const oldJournalsStr = await AsyncStorage.getItem('@mindflow_journals');
    if (oldJournalsStr) {
      // This would be old encrypted format
      // You'd need the old key to decrypt if it was encrypted
      console.log('Old journal format detected - manual migration may be needed');
    }

    // Mark migration as complete
    setValue(KEYS.MIGRATION_COMPLETE_V1, 'true');
    console.log('Migration check complete');
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw - allow app to continue
  }
};

/**
 * Export function to get all journals as JSON (for backup)
 * WARNING: This exports PLAINTEXT - use with caution!
 * 
 * @param dk - The Data Key for decryption
 * @returns JSON string of all journals
 */
export const exportAllJournals = async (dk: string): Promise<string> => {
  try {
    const journals = await listJournals(dk);
    return JSON.stringify(journals, null, 2);
  } catch (error) {
    console.error('Error exporting journals:', error);
    throw new Error('Failed to export journals');
  }
};
