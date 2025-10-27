import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { List, Switch, useTheme, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../../stores/hooks';
import {
  setTheme,
  setNotificationsEnabled,
  setNotificationTime,
} from '../../stores/slices/settingsSlice';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelAllNotifications,
} from '../../services/notificationService';
import { Alert } from '../../utils/alert';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const [timeHour, setTimeHour] = useState('20');
  const [timeMinute, setTimeMinute] = useState('00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Parse stored time
    const [hour, minute] = settings.notificationTime.split(':');
    setTimeHour(hour);
    setTimeMinute(minute);
  }, [settings.notificationTime]);

  const handleNotificationToggle = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Notifications are not supported on web browsers'
      );
      return;
    }

    if (value) {
      // Request permissions
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings'
        );
        return;
      }

      // Schedule notification
      const hour = parseInt(timeHour);
      const minute = parseInt(timeMinute);
      await scheduleDailyReminder(hour, minute);

      dispatch(setNotificationsEnabled(true));
      Alert.alert('Success', 'Daily reminder has been set!');
    } else {
      // Cancel notifications
      await cancelAllNotifications();
      dispatch(setNotificationsEnabled(false));
    }
  };

  const handleTimeUpdate = async () => {
    const hour = parseInt(timeHour);
    const minute = parseInt(timeMinute);

    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('Invalid Time', 'Hour must be between 0 and 23');
      return;
    }

    if (isNaN(minute) || minute < 0 || minute > 59) {
      Alert.alert('Invalid Time', 'Minute must be between 0 and 59');
      return;
    }

    const timeString = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
    dispatch(setNotificationTime(timeString));

    // Reschedule if notifications are enabled
    if (settings.notificationsEnabled && Platform.OS !== 'web') {
      await scheduleDailyReminder(hour, minute);
      Alert.alert('Updated', 'Reminder time has been updated!');
    }

    setShowTimePicker(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description={`Current: ${settings.theme}`}
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={settings.theme === 'dark'}
                onValueChange={value =>
                  dispatch(setTheme(value ? 'dark' : 'light'))
                }
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          {Platform.OS === 'web' && (
            <List.Item
              title="Not Available on Web"
              description="Notifications only work on mobile devices"
              left={props => <List.Icon {...props} icon="alert-circle" />}
            />
          )}
          {Platform.OS !== 'web' && (
            <>
              <List.Item
                title="Daily Reminders"
                description="Get reminded to journal daily"
                left={props => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <Switch
                    value={settings.notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                  />
                )}
              />
              {settings.notificationsEnabled && (
                <List.Item
                  title="Reminder Time"
                  description={`${timeHour}:${timeMinute}`}
                  left={props => <List.Icon {...props} icon="clock-outline" />}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                />
              )}
              {showTimePicker && (
                <View style={styles.timePicker}>
                  <View style={styles.timeInputRow}>
                    <TextInput
                      label="Hour (0-23)"
                      value={timeHour}
                      onChangeText={setTimeHour}
                      keyboardType="number-pad"
                      mode="outlined"
                      style={styles.timeInput}
                      maxLength={2}
                    />
                    <TextInput
                      label="Minute (0-59)"
                      value={timeMinute}
                      onChangeText={setTimeMinute}
                      keyboardType="number-pad"
                      mode="outlined"
                      style={styles.timeInput}
                      maxLength={2}
                    />
                  </View>
                  <Button mode="contained" onPress={handleTimeUpdate}>
                    Update Time
                  </Button>
                </View>
              )}
            </>
          )}
        </List.Section>

        <List.Section>
          <List.Subheader>Security</List.Subheader>
          <List.Item
            title="Change Password"
            description="Coming in Sprint 6"
            left={props => <List.Icon {...props} icon="lock" />}
            disabled
          />
          <List.Item
            title="Security Questions"
            description="Coming in Sprint 6"
            left={props => <List.Icon {...props} icon="help-circle" />}
            disabled
          />
        </List.Section>

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0 (Sprint 5)"
            left={props => <List.Icon {...props} icon="information" />}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timePicker: {
    padding: 16,
    paddingTop: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default SettingsScreen;
