import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import {
  getLeaderboardData,
  saveLeaderboardData,
  parseExcelFile,
  generateExcelTemplate,
} from "./services/dataManager";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("CLIENT ID:", process.env.STRAVA_CLIENT_ID);
  console.log("SECRET EXISTS:", !!process.env.STRAVA_CLIENT_SECRET);
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/leaderboard", (req, res) => {
    const data = getLeaderboardData();
    res.json(data);
  });

  app.post("/api/sync", (req, res) => {
    const userStats = req.body;
    if (!userStats || !userStats.userId) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const currentData = getLeaderboardData();
    const index = currentData.findIndex((u) => u.userId === userStats.userId);

    if (index >= 0) {
      // Update existing user
      currentData[index] = { ...currentData[index], ...userStats };
    } else {
      // Add new user
      currentData.push(userStats);
    }

    saveLeaderboardData(currentData);
    res.json({ success: true });
  });

  app.post("/api/auth/exchange", async (req, res) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    try {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        return res.status(400).json({
          error: "Strava token exchange failed",
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Token exchange failed" });
    }
  });

  app.post("/api/admin/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // We need to merge the uploaded data with existing data to preserve avatars/metadata if missing in Excel
      // But the requirement says Admin "changes" data.
      // Strategy: Parse Excel -> Update matching users in DB.
      const currentData = getLeaderboardData();
      const newData = parseExcelFile(req.file.buffer);

      // Create a map of current data for quick lookup
      const currentMap = new Map(currentData.map((u) => [u.userId, u]));

      newData.forEach((newUser) => {
        if (currentMap.has(newUser.userId)) {
          // Merge: Keep existing avatar if new one is generic/empty, overwrite stats
          const existing = currentMap.get(newUser.userId)!;
          currentMap.set(newUser.userId, {
            ...existing,
            ...newUser,
            avatarUrl: existing.avatarUrl || newUser.avatarUrl, // Prefer existing avatar if available
          });
        } else {
          currentMap.set(newUser.userId, newUser);
        }
      });

      const mergedData = Array.from(currentMap.values());
      saveLeaderboardData(mergedData);
      res.json({
        message: "Leaderboard updated successfully",
        count: mergedData.length,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  app.get("/api/admin/export", (req, res) => {
    try {
      const currentData = getLeaderboardData();
      const buffer = generateExcelTemplate(currentData); // Now passes actual data
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="leaderboard_data.xlsx"',
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error generating export:", error);
      res.status(500).json({ error: "Failed to generate export" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
