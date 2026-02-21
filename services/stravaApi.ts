import { StravaActivity, ActivityType } from '../types';
import { CHALLENGE_START_DATE } from '../constants';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export const fetchAthleteActivities = async (accessToken: string): Promise<StravaActivity[]> => {
  // Convert challenge start date (YYYY-MM-DD) to Unix Timestamp (seconds)
  const startDate = new Date(CHALLENGE_START_DATE);
  const afterTimestamp = Math.floor(startDate.getTime() / 1000);

  // Fetch activities after the challenge start date
  // per_page=200 is the max. If you have more, you'd need pagination, but this covers most 100-day challenges.
  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?after=${afterTimestamp}&per_page=200`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized"); // Token expired or invalid
    }
    throw new Error('Failed to fetch activities from Strava');
  }

  const data = await response.json();

  // Normalize raw Strava data to our app's interface
  return data.map((item: any) => {
      // Map Strava types to our Enum
      let type = ActivityType.Other;
      if (item.type === 'Run') type = ActivityType.Run;
      if (item.type === 'Walk') type = ActivityType.Walk;
      if (item.type === 'Hike') type = ActivityType.Hike;

      return {
        id: item.id.toString(),
        name: item.name,
        distance: item.distance, // already in meters
        type: type,
        start_date_local: item.start_date_local,
        moving_time: item.moving_time
      };
  });
};
