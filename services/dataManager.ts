import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { UserStats, DailyRecord } from '../types';

const DB_PATH = path.join(process.cwd(), 'db');
const DB_FILE = path.join(DB_PATH, 'leaderboard.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH);
}

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

export const getLeaderboardData = (): UserStats[] => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
};

export const saveLeaderboardData = (data: UserStats[]) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export const parseExcelFile = (buffer: Buffer): UserStats[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  // Expected Excel Format:
  // Name | Day 1 | Day 2 | ... | Day 100
  // Values are distances in KM.

  const users: UserStats[] = [];

  jsonData.forEach((row: any, index: number) => {
    const userName = row['Name'] || `User ${index + 1}`;
    // Prefer ID from Excel if it exists (to update existing users), else generate one
    const userId = row['User ID'] ? String(row['User ID']) : `user-${index + 1}`; 
    
    let totalDistanceKm = 0;
    let daysCompleted = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const dailyRecords: Record<string, DailyRecord> = {};
    
    // Iterate through keys to find "Day X" columns
    Object.keys(row).forEach(key => {
      if (key.startsWith('Day ')) {
        const dayNum = parseInt(key.replace('Day ', ''));
        const distance = parseFloat(row[key]);
        
        // Calculate date for Day X
        // Assuming Day 1 is 2026-01-01 for this example
        const startDate = new Date('2026-01-01'); 
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (dayNum - 1));
        const dateStr = date.toISOString().split('T')[0];

        const isCompleted = !isNaN(distance) && distance >= 1.0;

        if (isCompleted) {
          totalDistanceKm += distance;
          daysCompleted++;
          tempStreak++;
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          tempStreak = 0;
        }

        // Populate daily record
        dailyRecords[dateStr] = {
            date: dateStr,
            totalDistance: (distance || 0) * 1000,
            activities: [], 
            isCompleted: isCompleted
        };
      }
    });
    if (tempStreak > maxStreak) maxStreak = tempStreak;

    users.push({
      userId,
      name: userName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      totalDistance: totalDistanceKm * 1000,
      completedDays: daysCompleted,
      currentStreak: tempStreak,
      longestStreak: maxStreak,
      missedDays: 100 - daysCompleted, // Approx
      completionRate: (daysCompleted / 100) * 100,
      dailyRecords: dailyRecords
    });
  });

  return users;
};

export const generateExcelTemplate = (data: UserStats[] = []): Buffer => {
  const wb = XLSX.utils.book_new();
  const headers = ['User ID', 'Name'];
  // Generate headers for Day 1 to 100
  for (let i = 1; i <= 100; i++) {
    headers.push(`Day ${i}`);
  }
  
  const wsData = [headers];

  // Populate rows from data
  data.forEach(user => {
    const row: any[] = [user.userId, user.name];
    
    // We need to map dates back to "Day X". 
    // Assuming Day 1 = 2026-01-01 (Must match the import logic!)
    // Ideally, we should store the challenge start date in a config or pass it in.
    const startDate = new Date('2026-01-01');

    for (let i = 1; i <= 100; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (i - 1));
      const dateStr = date.toISOString().split('T')[0];
      
      const record = user.dailyRecords[dateStr];
      if (record) {
        // Export distance in KM
        row.push(record.totalDistance / 1000);
      } else {
        row.push(0);
      }
    }
    wsData.push(row);
  });
  
  // If no data, add a dummy example row so the admin sees the format
  if (data.length === 0) {
     const exampleRow = ['user-example', 'Example User'];
     for(let i=0; i<100; i++) exampleRow.push(0);
     wsData.push(exampleRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Challenge Data');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
