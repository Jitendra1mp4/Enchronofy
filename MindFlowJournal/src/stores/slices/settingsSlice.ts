// src/stores/slices/settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';

// src/stores/slices/settingsSlice.ts
const initialState: AppSettings = {
  theme: 'auto',
  notificationsEnabled: false,
  notificationTime: '20:00',
  // Updated default to 1 minutes
  autoLockTimeout: 1 * 60 * 1000, // 1 minutes default
  instantLockOnBackground: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<AppSettings['theme']>) {
      state.theme = action.payload;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    setNotificationTime(state, action: PayloadAction<string>) {
      state.notificationTime = action.payload;
    },
    // New Reducers
    setAutoLockTimeout(state, action: PayloadAction<number>) {
      state.autoLockTimeout = action.payload;
    },
    setInstantLockOnBackground(state, action: PayloadAction<boolean>) {
      state.instantLockOnBackground = action.payload;
    },
    updateSettings(state, action: PayloadAction<Partial<AppSettings>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const { 
  setTheme, 
  setNotificationsEnabled, 
  setNotificationTime, 
  setAutoLockTimeout,
  setInstantLockOnBackground,
  updateSettings 
} = settingsSlice.actions;

export default settingsSlice.reducer;
