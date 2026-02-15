export enum ActivityType {
  Run = 'Run',
  Walk = 'Walk',
  Hike = 'Hike', // Often grouped with Walk in challenges
  Other = 'Other'
}

export interface StravaActivity {
  id: string;
  name: string;
  distance: number; // in meters
  type: ActivityType;
  start_date_local: string; // ISO String "2023-10-27T08:00:00Z"
  moving_time: number; // seconds
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  totalDistance: number; // meters
  activities: StravaActivity[];
  isCompleted: boolean; // >= 1km
}

export interface UserStats {
  userId: string;
  name: string;
  avatarUrl: string;
  totalDistance: number; // meters
  completedDays: number; // count
  currentStreak: number;
  longestStreak: number;
  missedDays: number;
  completionRate: number; // percentage
  dailyRecords: Record<string, DailyRecord>; // Map date -> record
}

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  profile: string;
}

// OAuth Types
export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile: string; // URL to avatar
  };
}
