import { ActivityType, StravaActivity } from '../types';
import { AVATAR_URLS } from '../constants';

const USERS = [
  { id: '1', name: 'Alex Runner', avatar: AVATAR_URLS[0] },
  { id: '2', name: 'Sam Walker', avatar: AVATAR_URLS[1] },
  { id: '3', name: 'Jordan Hiker', avatar: AVATAR_URLS[2] },
  { id: '4', name: 'Casey Sprinter', avatar: AVATAR_URLS[3] },
];

const generateActivitiesForUser = (userId: string): StravaActivity[] => {
  const activities: StravaActivity[] = [];
  const today = new Date();
  
  // Create ~20 days of history + some future gaps
  const daysToGenerate = 20;

  for (let i = 0; i < daysToGenerate; i++) {
    // subDays logic
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // format 'yyyy-MM-dd'
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isRestDay = Math.random() > 0.8; // 20% chance of rest day
    
    if (!isRestDay) {
        // Sometimes two activities in one day
        const numActivities = Math.random() > 0.9 ? 2 : 1;

        for(let j=0; j<numActivities; j++) {
            const distance = Math.floor(Math.random() * 5000) + 500; // 500m to 5.5km
            activities.push({
                id: `${userId}-${dateStr}-${j}`,
                name: j === 0 ? 'Morning Run' : 'Evening Walk',
                distance: distance,
                type: Math.random() > 0.5 ? ActivityType.Run : ActivityType.Walk,
                start_date_local: `${dateStr}T08:00:00Z`,
                moving_time: distance * 0.5, // rough estimate
            });
        }
    }
  }
  return activities;
};

export const MOCK_ACTIVITIES_DB: Record<string, StravaActivity[]> = {
    '1': generateActivitiesForUser('1'),
    '2': generateActivitiesForUser('2'),
    '3': generateActivitiesForUser('3'),
    '4': generateActivitiesForUser('4'),
};

export const MOCK_USERS = USERS;