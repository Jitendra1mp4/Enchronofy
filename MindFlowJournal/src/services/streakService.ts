import { Journal } from '../types';
import { differenceInDays, startOfDay, parseISO } from 'date-fns';

/**
 * Calculate the current streak of consecutive days with journal entries
 */
export const calculateCurrentStreak = (journals: Journal[]): number => {
  if (journals.length === 0) return 0;

  // Sort journals by date (newest first)
  const sortedJournals = [...journals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get unique dates (in case multiple entries on same day)
  const uniqueDates = Array.from(
    new Set(
      sortedJournals.map(j => {
        const dateStr = startOfDay(parseISO(j.date)).toISOString();
        console.log('Journal date:', j.date, '-> Start of day:', dateStr); // DEBUG
        return dateStr;
      })
    )
  ).map(dateStr => parseISO(dateStr));

  console.log('Unique dates count:', uniqueDates.length); // DEBUG

  const today = startOfDay(new Date());
  const mostRecentEntry = startOfDay(parseISO(sortedJournals[0].date));

  // Check if the most recent entry is today or yesterday
  const daysDiff = differenceInDays(today, mostRecentEntry);
  console.log('Days difference from today:', daysDiff); // DEBUG
  
  if (daysDiff > 1) {
    // Streak is broken
    console.log('Streak broken - more than 1 day gap'); // DEBUG
    return 0;
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = uniqueDates[i];
    const previousDate = uniqueDates[i - 1];
    const diff = differenceInDays(previousDate, currentDate);

    console.log(`Comparing day ${i}: diff = ${diff}`); // DEBUG

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  console.log('Final streak:', streak); // DEBUG
  return streak;
};

/**
 * Get dates with journal entries for calendar marking
 */
export const getMarkedDates = (
  journals: Journal[]
): { [key: string]: { marked: boolean; dotColor: string } } => {
  const marked: { [key: string]: { marked: boolean; dotColor: string } } = {};

  journals.forEach(journal => {
    try {
      const dateKey = startOfDay(parseISO(journal.date))
        .toISOString()
        .split('T')[0];
      marked[dateKey] = {
        marked: true,
        dotColor: '#6200EE',
      };
      console.log('Marked date:', dateKey); // DEBUG
    } catch (error) {
      console.error('Error parsing journal date:', journal.date, error);
    }
  });

  console.log('Total marked dates:', Object.keys(marked).length); // DEBUG
  return marked;
};
