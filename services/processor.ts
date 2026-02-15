import { StravaActivity, DailyRecord, UserStats } from '../types';
import { getLocalDateString, generateChallengeDates } from '../utils/dateUtils';
import { CHALLENGE_START_DATE, CHALLENGE_DURATION_DAYS, MIN_DISTANCE_METERS, ALLOWED_TYPES } from '../constants';

// 1. Normalize Activities into Daily Records
export const processUserActivities = (
  userId: string,
  userName: string,
  userAvatar: string,
  rawActivities: StravaActivity[]
): UserStats => {
  
  const challengeDates = generateChallengeDates(CHALLENGE_START_DATE, CHALLENGE_DURATION_DAYS);
  const dailyMap: Record<string, DailyRecord> = {};
  const todayStr = getLocalDateString(new Date().toISOString());
  
  // Create a date object for "tomorrow" to filter future challenge dates
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

  // Initialize all challenge days as empty
  challengeDates.forEach(date => {
    // Optimization: Don't process future dates beyond today
    // Parse date string (YYYY-MM-DD)
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (dateObj < tomorrow) {
        dailyMap[date] = {
            date,
            totalDistance: 0,
            activities: [],
            isCompleted: false
        };
    }
  });

  // Aggregate Strava Activities
  rawActivities.forEach(act => {
    // Filter by allowed types
    if (!ALLOWED_TYPES.includes(act.type)) return;

    const dateKey = getLocalDateString(act.start_date_local);
    
    // Only count if within challenge range and already initialized
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].activities.push(act);
      dailyMap[dateKey].totalDistance += act.distance;
    }
  });

  // Calculate Status (The 1km Rule)
  Object.values(dailyMap).forEach(record => {
    record.isCompleted = record.totalDistance >= MIN_DISTANCE_METERS;
  });

  // Calculate Stats
  let totalDist = 0;
  let completedCount = 0;
  let missedCount = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Iterate chronologically to calculate streaks
  // We filter keys to ensure we are only looking at valid initialized days up to today
  const sortedDates = Object.keys(dailyMap).sort().filter(d => d <= todayStr);

  sortedDates.forEach(date => {
    const record = dailyMap[date];
    totalDist += record.totalDistance;

    if (record.isCompleted) {
      completedCount++;
      tempStreak++;
    } else {
      missedCount++;
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  });
  
  // Final check for longest streak if ending on a win
  longestStreak = Math.max(longestStreak, tempStreak);

  // Current Streak Calculation (Backwards from today)
  // If today is not done yet, we check yesterday.
  let streak = 0;
  let checkIndex = sortedDates.length - 1;
  
  // If we have data
  if (checkIndex >= 0) {
      // Check today first
      if (dailyMap[sortedDates[checkIndex]].isCompleted) {
          streak++;
          checkIndex--;
          // count backwards
          while(checkIndex >= 0 && dailyMap[sortedDates[checkIndex]].isCompleted) {
              streak++;
              checkIndex--;
          }
      } else {
          // Today is not done. Did we do yesterday?
          checkIndex--;
          while(checkIndex >= 0 && dailyMap[sortedDates[checkIndex]].isCompleted) {
              streak++;
              checkIndex--;
          }
      }
  }
  
  currentStreak = streak;

  return {
    userId,
    name: userName,
    avatarUrl: userAvatar,
    totalDistance: totalDist,
    completedDays: completedCount,
    missedDays: missedCount,
    currentStreak,
    longestStreak,
    completionRate: sortedDates.length > 0 ? (completedCount / sortedDates.length) * 100 : 0,
    dailyRecords: dailyMap
  };
};