import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { IconButton, useTheme } from "react-native-paper";
import APP_CONFIG from "../config/appConfig";
import ExportScreen from "../screens/Export/ExportScreen";
import HomeScreen from "../screens/Home/HomeScreen";
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

  const commonHeaderOptions = {
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.onSurface,   
    headerRight: () => (
       <IconButton
        icon="lock-outline"
        onPress={() => dispatch(logout())}
        iconColor={theme.colors.primary}
      />
    ),
  };

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
        options={{ ...commonHeaderOptions, title: APP_CONFIG.displayName }}
      />
      <Stack.Screen
        name="JournalList"
        component={JournalListScreen}
        options={{ ...commonHeaderOptions, title: "📖 My Journals" }}
      />
      <Stack.Screen
        name="JournalEditor"
        component={JournalEditorScreen}
        options={{ ...commonHeaderOptions, title: "✍️ New Journal" }}
      />
      <Stack.Screen
        name="JournalDetail"
        component={JournalDetailScreen}
        options={{ ...commonHeaderOptions, title: "📄 Journal" }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{ ...commonHeaderOptions, title: "📤 Export" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ ...commonHeaderOptions, title: "⚙️ Settings" }}
      />
    </Stack.Navigator>
  );
};
