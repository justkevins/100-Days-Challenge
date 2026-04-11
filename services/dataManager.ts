// services/dataManager.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { UserStats, DailyRecord } from '../types';
import { CHALLENGE_START_DATE, CHALLENGE_DURATION_DAYS } from '../constants';

// ── DB Setup ──────────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), 'db');
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);

const db = new Database(path.join(DB_PATH, 'stride100.db'));

// WAL mode = multiple readers + one writer, no full-file locks
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    avatar_url  TEXT,
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS daily_records (
    user_id      TEXT NOT NULL,
    date         TEXT NOT NULL,
    distance     REAL DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    activities   TEXT DEFAULT '[]',
    PRIMARY KEY (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    user_id     TEXT PRIMARY KEY,
    last_sync   TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );
`);

// ── Prepared Statements ───────────────────────────────────────────────────────

const stmtUpsertUser = db.prepare(`
  INSERT INTO users (user_id, name, avatar_url, updated_at)
  VALUES (@userId, @name, @avatarUrl, unixepoch())
  ON CONFLICT(user_id) DO UPDATE SET
    name       = excluded.name,
    avatar_url = COALESCE(NULLIF(excluded.avatar_url, ''), users.avatar_url),
    updated_at = unixepoch()
`);

const stmtUpsertRecord = db.prepare(`
  INSERT INTO daily_records (user_id, date, distance, is_completed, activities)
  VALUES (@userId, @date, @distance, @isCompleted, @activities)
  ON CONFLICT(user_id, date) DO UPDATE SET
    distance     = excluded.distance,
    is_completed = excluded.is_completed,
    activities   = excluded.activities
`);

const stmtUpsertSyncMeta = db.prepare(`
  INSERT INTO sync_meta (user_id, last_sync)
  VALUES (@userId, @lastSync)
  ON CONFLICT(user_id) DO UPDATE SET last_sync = excluded.last_sync
`);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Converts flat DB rows back into the UserStats shape your React app expects
const rowsToUserStats = (users: any[], records: any[]): UserStats[] => {
  const recordMap: Record<string, Record<string, DailyRecord>> = {};

  records.forEach(r => {
    if (!recordMap[r.user_id]) recordMap[r.user_id] = {};
    recordMap[r.user_id][r.date] = {
      date: r.date,
      totalDistance: r.distance,
      isCompleted: r.is_completed === 1,
      activities: JSON.parse(r.activities || '[]'),
    };
  });

  return users.map(u => {
    const dailyRecords = recordMap[u.user_id] || {};
    const days = Object.values(dailyRecords);
    const sortedDates = Object.keys(dailyRecords).sort();

    const completedDays = days.filter(d => d.isCompleted).length;
    const missedDays = days.filter(d => !d.isCompleted).length;
    const totalDistance = days.reduce((sum, d) => sum + d.totalDistance, 0);

    // Longest streak
    let longestStreak = 0, tempStreak = 0;
    sortedDates.forEach(date => {
      if (dailyRecords[date].isCompleted) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // Current streak (backwards from today)
    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDates = sortedDates.filter(d => d <= todayStr).reverse();
    for (const date of pastDates) {
      if (dailyRecords[date].isCompleted) currentStreak++;
      else break;
    }

    return {
      userId: u.user_id,
      name: u.name,
      avatarUrl: u.avatar_url,
      totalDistance,
      completedDays,
      missedDays,
      currentStreak,
      longestStreak,
      completionRate: sortedDates.length > 0 ? (completedDays / sortedDates.length) * 100 : 0,
      dailyRecords,
    };
  });
};

// ── Public API (same shape as before — server.ts needs zero changes) ──────────

export const getLeaderboardData = (): UserStats[] => {
  const users = db.prepare('SELECT * FROM users').all();
  const records = db.prepare('SELECT * FROM daily_records').all();
  return rowsToUserStats(users, records);
};

// Atomic transaction — the fix for the race condition
export const saveLeaderboardData = db.transaction((data: UserStats[]) => {
  for (const user of data) {
    stmtUpsertUser.run({
      userId: user.userId,
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
    });

    for (const [date, record] of Object.entries(user.dailyRecords)) {
      stmtUpsertRecord.run({
        userId: user.userId,
        date,
        distance: record.totalDistance,
        isCompleted: record.isCompleted ? 1 : 0,
        activities: JSON.stringify(record.activities ?? []),
      });
    }
  }
});

export type SyncMetaRecord = Record<string, string>;

export const getSyncMeta = (): SyncMetaRecord => {
  const rows = db.prepare('SELECT user_id, last_sync FROM sync_meta').all() as any[];
  return Object.fromEntries(rows.map(r => [r.user_id, r.last_sync]));
};

export const saveSyncMeta = (data: SyncMetaRecord) => {
  const upsertMany = db.transaction((entries: [string, string][]) => {
    for (const [userId, lastSync] of entries) {
      stmtUpsertSyncMeta.run({ userId, lastSync });
    }
  });
  upsertMany(Object.entries(data));
};

// ── Excel import/export (unchanged logic, just wired to SQLite now) ───────────

export const parseExcelFile = (buffer: Buffer): UserStats[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  return (jsonData as any[]).map((row, index) => {
    const userName = row['Name'] || `User ${index + 1}`;
    const userId = row['User ID'] ? String(row['User ID']) : `user-${index + 1}`;
    const dailyRecords: Record<string, DailyRecord> = {};

    let daysCompleted = 0, totalDistanceKm = 0, tempStreak = 0, maxStreak = 0;

    Object.keys(row).forEach(key => {
      if (!key.startsWith('Day ')) return;
      const dayNum = parseInt(key.replace('Day ', ''));
      const distance = parseFloat(row[key]);
      const startDate = new Date(CHALLENGE_START_DATE);
      startDate.setDate(startDate.getDate() + (dayNum - 1));
      const dateStr = startDate.toISOString().split('T')[0];
      const isCompleted = !isNaN(distance) && distance >= 1.0;

      if (isCompleted) { totalDistanceKm += distance; daysCompleted++; tempStreak++; }
      else { maxStreak = Math.max(maxStreak, tempStreak); tempStreak = 0; }

      dailyRecords[dateStr] = {
        date: dateStr,
        totalDistance: (distance || 0) * 1000,
        activities: [],
        isCompleted,
      };
    });

    maxStreak = Math.max(maxStreak, tempStreak);

    return {
      userId, name: userName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      totalDistance: totalDistanceKm * 1000,
      completedDays: daysCompleted,
      currentStreak: tempStreak,
      longestStreak: maxStreak,
      missedDays: 100 - daysCompleted,
      completionRate: (daysCompleted / 100) * 100,
      dailyRecords,
    };
  });
};

export const generateExcelTemplate = (data: UserStats[] = []): Buffer => {
  const headers = ['User ID', 'Name', ...Array.from({ length: 100 }, (_, i) => `Day ${i + 1}`)];
  const wsData = [headers];
  const startDate = new Date(CHALLENGE_START_DATE);

  (data.length ? data : [{ userId: 'user-example', name: 'Example User', dailyRecords: {} } as any]).forEach(user => {
    const row: any[] = [user.userId, user.name];
    for (let i = 1; i <= 100; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + (i - 1));
      const dateStr = d.toISOString().split('T')[0];
      const record = user.dailyRecords[dateStr];
      row.push(record ? record.totalDistance / 1000 : 0);
    }
    wsData.push(row);
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), 'Challenge Data');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};