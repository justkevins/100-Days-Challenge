# Stride100 Challenge App - Architecture & Guide

This document accompanies the codebase to explain the system design for a beginner.

## 1. High-Level System Architecture

Since you want a "Simple but reliable" solution, I recommend **React (Frontend)** + **Supabase (Backend)**.

### Why Supabase?
It acts as a database (like a spreadsheet) but handles Authentication and APIs automatically. It's much easier than writing a custom server.

### The Flow:
1.  **Auth:** User clicks "Connect Strava".
2.  **Redirect:** Strava asks for permission.
3.  **Callback:** Strava sends a code back to your app.
4.  **Exchange:** Your backend exchanges this code for an `access_token` and `refresh_token`.
5.  **Storage:** Store the tokens in the `users` table.
6.  **Fetch:** When user clicks "Sync", the backend uses the token to call Strava API, gets activities, and saves them to the `activities` table.
7.  **Display:** The React app reads the `activities` table to calculate streaks.

## 2. Data Models (Database Schema)

If using Supabase (PostgreSQL), here is the SQL structure you need:

**Table: `users`**
- `id` (Primary Key, string) - Strava Athlete ID
- `firstname` (string)
- `lastname` (string)
- `avatar_url` (string)
- `access_token` (string) - *Keep secure*
- `refresh_token` (string) - *Crucial for long-term access*
- `token_expires_at` (timestamp)

**Table: `activities`**
- `id` (Primary Key) - Strava Activity ID
- `user_id` (Foreign Key -> users.id)
- `start_date_local` (timestamp) - *The local time the run started*
- `distance` (float) - Meters
- `type` (string) - 'Run' or 'Walk'
- `moving_time` (int) - Seconds

## 3. Logic Implementation

### Daily Completion (The 1km Rule)
1.  Filter activities for a specific `user_id`.
2.  Group them by `start_date_local` (formatted as YYYY-MM-DD).
3.  Sum `distance` for each day.
4.  If `sum >= 1000`, Mark as **Completed**.

### Streak Calculation
1.  Sort completed days descending (Newest to Oldest).
2.  Start from "Today" (or Yesterday if Today isn't done yet).
3.  Count backwards strictly. If a day is missing, stop counting.

## 4. Implementation Plan (Step-by-Step)

1.  **Setup Supabase:** Create a project, create the tables above.
2.  **Strava API Setup:** Go to Strava settings -> My API Application. Get `Client ID` and `Client Secret`. Set "Authorization Callback Domain" to `localhost` (for dev) or your production domain.
3.  **Frontend Logic (This Codebase):** I have built the frontend for you. It uses `services/mockData.ts`.
4.  **Connect Backend:** Replace `mockData.ts` with real calls to Supabase.
5.  **Deploy:** Deploy Frontend to Vercel/Netlify.

## 5. Scope Control (What NOT to build in V1)
-   **Webhooks:** Don't try to make Strava push data to you instantly. It's hard to debug. Just add a big "Sync Now" button.
-   **Social Feeds:** No commenting or liking. Stick to the leaderboard.
-   **Strict Anti-Cheat:** Don't worry about people editing GPX files. It's a fun challenge.

## 6. Common Mistakes & Pitfalls
-   **Timezones:** **NEVER** convert `start_date_local` to UTC or Javascript `Date` objects for grouping. If Strava says "2023-10-05T18:00:00", strictly extract "2023-10-05". If you convert to UTC, a run at 11 PM might count for the next day.
-   **Token Expiry:** Strava tokens expire every 6 hours. You must use the `refresh_token` to get a new one before every sync.
-   **Rate Limits:** Strava allows 100 requests every 15 minutes. Cache data in your database. Do not call Strava every time a user loads the page.

*Note: The code provided uses a "Mock Service" pattern. This allows you to run and visualize the app immediately without needing valid API keys right now.*
