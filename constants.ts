export const CHALLENGE_START_DATE = '2023-10-01'; // Example start date
export const CHALLENGE_DURATION_DAYS = 100;
export const MIN_DISTANCE_METERS = 1000; // 1km requirement
export const ALLOWED_TYPES = ['Run', 'Walk', 'Hike'];

// Mock Images for UI
export const AVATAR_URLS = [
  'https://picsum.photos/200/200?random=1',
  'https://picsum.photos/200/200?random=2',
  'https://picsum.photos/200/200?random=3',
  'https://picsum.photos/200/200?random=4',
];

// --- STRAVA API CONFIG ---
// TODO: Replace these with your actual values from https://www.strava.com/settings/api
export const STRAVA_CLIENT_ID = '202848'; 
export const STRAVA_CLIENT_SECRET = '226ca07bec6a5e85e32296eb0ccf9dfc6a81fd73'; 

// We redirect back to the root of the application
export const STRAVA_REDIRECT_URI = window.location.origin; 
