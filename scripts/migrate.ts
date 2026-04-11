// scripts/migrate.ts
import fs from 'fs';
import path from 'path';
import { saveLeaderboardData, getSyncMeta, saveSyncMeta } from '../services/dataManager';

const OLD_DB = path.join(process.cwd(), 'db', 'leaderboard.json');
const OLD_SYNC = path.join(process.cwd(), 'db', 'sync-meta.json');

if (fs.existsSync(OLD_DB)) {
  const users = JSON.parse(fs.readFileSync(OLD_DB, 'utf-8'));
  saveLeaderboardData(users);
  console.log(`✅ Migrated ${users.length} users`);
} else {
  console.log('No leaderboard.json found, skipping');
}

if (fs.existsSync(OLD_SYNC)) {
  const meta = JSON.parse(fs.readFileSync(OLD_SYNC, 'utf-8'));
  saveSyncMeta(meta);
  console.log(`✅ Migrated sync meta for ${Object.keys(meta).length} users`);
}

console.log('Done. You can now delete leaderboard.json and sync-meta.json');