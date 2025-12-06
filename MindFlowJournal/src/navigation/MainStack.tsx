import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Chip, useTheme } from "react-native-paper";
import APP_CONFIG from "../config/appConfig";
import CalendarScreen from "../screens/Calendar/CalendarScreen";
import ExportScreen from "../screens/Export/ExportScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import DateJournalListScreen from "../screens/Journal/DateJournalListScreen";
import JournalDetailScreen from "../screens/Journal/JournalDetailScreen";
import JournalEditorScreen from "../screens/Journal/JournalEditorScreen";
import JournalListScreen from "../screens/Journal/JournalListScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import { useAppDispatch } from "../stores/hooks";
import { logout } from "../stores/slices/authSlice";

const Stack = createNativeStackNavigator();

export const MainStack: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
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
        options={{
          title: APP_CONFIG.displayName,
          headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ),
        }}
      />
      <Stack.Screen
        name="JournalList"
        component={JournalListScreen}
        options={{ title: "My Journals" ,  headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ),}}
      />
      <Stack.Screen
        name="JournalEditor"
        component={JournalEditorScreen}
        options={{ title: "Write Journal",  headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ), }}
      />
      <Stack.Screen
        name="JournalDetail"
        component={JournalDetailScreen}
        options={{ title: "Journal Entry",  headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ), }}
      />
      <Stack.Screen
        name="DateJournalList"
        component={DateJournalListScreen}
        options={{ title: "Journals" ,  headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ), }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: "Calendar" }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{ title: "Export Journals" , headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ), }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings",  headerRight: () => (
            <Chip
              mode="outlined"
              onPress={() => dispatch(logout())}
              icon="lock"
            >
              Lock
            </Chip>
          ), }}
      />
    </Stack.Navigator>
  );
};
