import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import JournalListScreen from '../screens/Journal/JournalListScreen';
import JournalEditorScreen from '../screens/Journal/JournalEditorScreen';
import JournalDetailScreen from '../screens/Journal/JournalDetailScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import ExportScreen from '../screens/Export/ExportScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Stack = createNativeStackNavigator();

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'MindFlow Journal' }}
      />
      <Stack.Screen
        name="JournalList"
        component={JournalListScreen}
        options={{ title: 'My Journals' }}
      />
      <Stack.Screen
        name="JournalEditor"
        component={JournalEditorScreen}
        options={{ title: 'Write Journal' }}
      />
      <Stack.Screen
        name="JournalDetail"
        component={JournalDetailScreen}
        options={{ title: 'Journal Entry' }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{ title: 'Export Journals' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};
