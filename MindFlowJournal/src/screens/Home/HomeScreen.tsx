import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listJournals } from '../../services/storageService';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { setJournals } from '../../stores/slices/journalsSlice';
import { useAuth } from '../../utils/authContext';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { encryptionKey } = useAuth();
  
  const currentStreak = useAppSelector(state => state.journals.currentStreak);
  const journals = useAppSelector(state => state.journals.journals);

  useEffect(() => {
    loadJournals();
  }, [encryptionKey]);

  const loadJournals = async () => {
    if (!encryptionKey) return;

    try {
      const loadedJournals = await listJournals(encryptionKey);
      dispatch(setJournals(loadedJournals));
    } catch (error) {
      console.error('Error loading journals:', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium">🔥 Current Streak</Text>
            <Text variant="displayMedium" style={styles.streakNumber}>
              {currentStreak}
            </Text>
            <Text variant="bodyMedium">days in a row</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Your Journals
            </Text>
            <Text variant="bodyLarge" style={styles.statNumber}>
              {journals.length}
            </Text>
            <Text variant="bodyMedium">total entries</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Quick Actions
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('JournalEditor')}
              style={styles.actionButton}
              icon="pencil"
            >
              New Journal Entry
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('JournalList')}
              style={styles.actionButton}
              icon="book-open-variant"
            >
              View All Journals
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Calendar')}
              style={styles.actionButton}
              icon="calendar"
            >
              Calendar View
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomNav}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Export')}
            icon="export"
          >
            Export
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Settings')}
            icon="cog"
          >
            Settings
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  streakNumber: {
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: 'bold',
  },
  statNumber: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
});

export default HomeScreen;
