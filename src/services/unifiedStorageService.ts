/**
 * Unified Storage Service
 * 
 * Automatically selects the appropriate backend:
 * - Web: AsyncStorage (from storageService)
 * - Native (iOS/Android): SQLite (from database-cryptoManager)
 * 
 * This abstraction ensures the app works seamlessly across all platforms
 */

import { Platform } from 'react-native';
import { AppSettings, Journal } from '../types';
import type { Vault } from '../types/crypto';
import AsyncStorePreferencesStorage from './impl/asyncStorePreferenceStorageService';
import AsyncStoreStorageProvider from './impl/asyncStoreStorageService';
import SQLiteStorageProvider from './impl/sqliteDatabaseStorageService';
import SQLiteStorePreferencesStorage from './impl/sqlitePreferenceStorageService';

// Detect if we're on web or native
const IS_WEB = Platform.OS === 'web';

console.log(`[Storage] Detected platform: ${Platform.OS} (IS_WEB: ${IS_WEB})`);

/**
 * Storage provider interface
 */
export interface VaultStorageProvider {
    // Vault operations
  saveVault: (vault: Vault | Record<string, any>) => Promise<void>;
  getVault: () => Promise<Vault | Record<string, any> | null>

  // Journal operations
  saveJournal: (journal: Journal, encryptionKey: string) => Promise<void>;
  getJournal: (id: string, encryptionKey: string) => Promise<Journal | null>;
  listJournals: (encryptionKey: string) => Promise<Journal[]>;
  deleteJournal: (id: string,key? : string) => Promise<void>;
  getJournalCount: () => Promise<number>;

  // Metadata operations
  isFirstLaunch: () => Promise<boolean>;
  markAsLaunched: () => Promise<void>;
  saveRecoveryKeyHash: (hash: string) => Promise<void>;
  getRecoveryKeyHash: () => Promise<string | null>;
  clearRecoveryKeyDisplay: () => Promise<void>;

  // Data management
  clearAllData: () => Promise<void>;
  initializeStorage: () => Promise<void>;
}


export const getVaultStorageProvider = (): VaultStorageProvider => {
  if (IS_WEB) {
    console.log('[Storage] Using AsyncStorage backend for web');
    return AsyncStoreStorageProvider.getObject();
  } else {
    console.log('[Storage] Using SQLite backend for native');
    return SQLiteStorageProvider.getObject();
  }
};



export default interface PreferenceStorageProvider {
  // initializeStorage: () => Promise<void>;
  saveSettings : (settings: AppSettings) => Promise<void> 
  getSettings : () => Promise<AppSettings | null>
  clearSettings : () => Promise<void> 
}

export const getPreferenceStorageProvider  = ():PreferenceStorageProvider => {
  if (IS_WEB) {
    console.log('[Storage] Using AsyncStorage backend for web');
    return AsyncStorePreferencesStorage.getObject();
  } else {
    console.log('[Storage] Using SQLite backend for native');
    return SQLiteStorePreferencesStorage.getObject();
  }
} 
