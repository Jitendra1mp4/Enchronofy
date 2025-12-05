export type Journal = {
  id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  text: string;
  mood?: string;
  images?: string[]; // Now stores base64 strings instead of file paths
};

export type SecurityQuestion = {
  questionId: string;
  question: string;
  answerHash: string;
};

export type UserAuth = {
  isAuthenticated: boolean;
  salt?: string;
  securityQuestions?: SecurityQuestion[];
};

export type AppSettings = {
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  notificationTime: string;
  // New Security Settings
  autoLockTimeout: number; // in milliseconds (e.g., 300000 for 5 mins)
  instantLockOnBackground: boolean; // If true, locks immediately when app backgrounds
};


export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  JournalList: undefined;
  JournalEditor: { journalId?: string; selectedDate?: string };
  JournalDetail: { journalId: string };
  DateJournalList: { selectedDate: string };
  Calendar: undefined;
  Export: undefined;
  Settings: undefined;
};

