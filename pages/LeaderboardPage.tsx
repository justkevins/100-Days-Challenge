import React, { useState, useEffect } from "react";
import { UserStats } from "../types";
import { StatCard } from "../components/StatCard";
import { Link } from "react-router-dom";
import { formatDistance } from "../utils/dateUtils";
import {
  CHALLENGE_START_DATE,
  CHALLENGE_DURATION_DAYS,
  SYNC_COOLDOWN_MS,
} from "../constants";
import { getLoggedInUser, logout } from "../services/stravaAuth";
import { fetchAthleteActivities } from "../services/stravaApi";
import { processUserActivities } from "../services/processor";

interface SyncStatus {
  canSync: boolean;
  lastSyncedAt: string | null;
  nextAllowedAt: string | null;
  retryAfterMs: number;
  reason: string;
}

const getSyncStorageKey = (userId: string | number) => `sync_status_${userId}`;

const readStoredSyncStatus = (userId: string | number): SyncStatus | null => {
  try {
    const raw = localStorage.getItem(getSyncStorageKey(userId));
    if (!raw) return null;

    return JSON.parse(raw) as SyncStatus;
  } catch {
    return null;
  }
};

const persistSyncStatus = (
  userId: string | number,
  status: SyncStatus | null,
) => {
  if (!status) {
    localStorage.removeItem(getSyncStorageKey(userId));
    return;
  }

  localStorage.setItem(getSyncStorageKey(userId), JSON.stringify(status));
};

const formatCooldown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const LeaderboardPage: React.FC = () => {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"consistency" | "distance">(
    "consistency",
  );
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [now, setNow] = useState(Date.now());

  // Get current user to highlight them in the list
  const loggedInUser = getLoggedInUser();

  useEffect(() => {
    if (!loggedInUser) {
      setSyncStatus(null);
      return;
    }

    const storedStatus = readStoredSyncStatus(loggedInUser.id);
    if (storedStatus) {
      setSyncStatus(storedStatus);
    }

    const loadSyncStatus = async () => {
      try {
        const response = await fetch(`/api/sync-status/${loggedInUser.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch sync status");
        }

        const data = await response.json();
        setSyncStatus(data);
        persistSyncStatus(loggedInUser.id, data);
      } catch (error) {
        console.error("Error loading sync status:", error);
      }
    };

    loadSyncStatus();
  }, [loggedInUser?.id]);

  useEffect(() => {
    if (!syncStatus?.nextAllowedAt) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [syncStatus?.nextAllowedAt]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch leaderboard data");
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleManualSync = async () => {
    const token = localStorage.getItem("strava_access_token");
    if (!loggedInUser || !token) return;

    setSyncing(true);
    try {
      const realActivities = await fetchAthleteActivities(token);
      const updatedUserStats = processUserActivities(
        String(loggedInUser.id),
        `${loggedInUser.firstname} ${loggedInUser.lastname}`,
        loggedInUser.profile,
        realActivities,
      );

      // Send to server
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserStats),
      });

      if (response.ok) {
        const result = await response.json();
        const syncedAt = result.syncedAt ?? new Date().toISOString();
        const nextAllowedAt =
          result.nextAllowedAt ??
          new Date(Date.now() + SYNC_COOLDOWN_MS).toISOString();
        const nextStatus = {
          canSync: false,
          lastSyncedAt: syncedAt,
          nextAllowedAt,
          retryAfterMs: Math.max(
            0,
            new Date(nextAllowedAt).getTime() - Date.now(),
          ),
          reason:
            result.reason ??
            "You can sync once every 15 minutes to avoid duplicate updates and unnecessary Strava API requests.",
        };
        // Refresh local list
        setStats((prevStats) => {
          const others = prevStats.filter(
            (s) => s.userId !== String(loggedInUser.id),
          );
          return [...others, updatedUserStats];
        });
        setSyncStatus(nextStatus);
        persistSyncStatus(loggedInUser.id, nextStatus);
      } else if (response.status === 429) {
        const data = await response.json();
        const nextStatus = {
          canSync: false,
          lastSyncedAt: data.lastSyncedAt ?? null,
          nextAllowedAt: data.nextAllowedAt ?? null,
          retryAfterMs: data.retryAfterMs ?? SYNC_COOLDOWN_MS,
          reason: data.reason,
        };
        setSyncStatus(nextStatus);
        persistSyncStatus(loggedInUser.id, nextStatus);
      } else {
        console.error("Server sync failed");
        alert("Server sync failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Sync failed", error);
      if (error.message === "Unauthorized") {
        alert("Your Strava connection has expired. Please reconnect.");
        logout();
      } else {
        alert("Failed to sync activities. Please try again.");
      }
    } finally {
      setSyncing(false);
    }
  };

  const remainingSyncMs = syncStatus?.nextAllowedAt
    ? Math.max(0, new Date(syncStatus.nextAllowedAt).getTime() - now)
    : 0;
  const isCooldownActive = !!loggedInUser && remainingSyncMs > 0;

  useEffect(() => {
    if (!loggedInUser || !syncStatus) return;

    if (!syncStatus.nextAllowedAt || remainingSyncMs > 0) {
      persistSyncStatus(loggedInUser.id, syncStatus);
      return;
    }

    const cooledDownStatus = {
      ...syncStatus,
      canSync: true,
      retryAfterMs: 0,
    };
    setSyncStatus(cooledDownStatus);
    persistSyncStatus(loggedInUser.id, cooledDownStatus);
  }, [loggedInUser, remainingSyncMs, syncStatus]);

  const syncDisabled = syncing || isCooldownActive;
  const syncHelperText = syncing
    ? "Fetching your latest activities from Strava..."
    : isCooldownActive
      ? `Sync available in ${formatCooldown(remainingSyncMs)}. ${syncStatus?.reason ?? "Please wait before syncing again."}`
      : syncStatus?.lastSyncedAt
        ? "You can sync again now. The 15-minute cooldown has finished."
        : "Sync pulls your latest Strava activities. A 15-minute cooldown prevents repeated duplicate requests.";

  const sortedStats = [...stats].sort((a, b) => {
    if (sortBy === "consistency") {
      // Primary: Completed Days, Secondary: Total Distance
      if (b.completedDays !== a.completedDays)
        return b.completedDays - a.completedDays;
      return b.totalDistance - a.totalDistance;
    } else {
      // Primary: Total Distance
      return b.totalDistance - a.totalDistance;
    }
  });

  const totalCommunityKm = stats.reduce(
    (acc, curr) => acc + curr.totalDistance,
    0,
  );
  const totalCompletedDays = stats.reduce(
    (acc, curr) => acc + curr.completedDays,
    0,
  );

  // Compute current challenge day display (handles pre-start and post-end)
  const getChallengeDayDisplay = (): string => {
    const start = new Date(CHALLENGE_START_DATE);
    const today = new Date();

    const startUtc = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const todayUtc = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const diffDays = Math.floor((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
    const dayNumber = diffDays + 1;

    if (diffDays < 0) {
      const daysUntil = Math.abs(diffDays);
      return `Starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
    }

    if (dayNumber > CHALLENGE_DURATION_DAYS) {
      return `Day ${CHALLENGE_DURATION_DAYS} of ${CHALLENGE_DURATION_DAYS} (Completed)`;
    }

    return `Day ${dayNumber} of ${CHALLENGE_DURATION_DAYS}`;
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Leaderboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Community Distance"
          value={`${formatDistance(totalCommunityKm)} km`}
          subValue="Total distance covered together"
        />
        <StatCard
          label="Total Active Days"
          value={totalCompletedDays}
          subValue="Combined consistency"
        />
        <StatCard
          label="Participants"
          value={stats.length}
          subValue="Runners & Walkers"
        />
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
            <p className="text-sm text-slate-500">{getChallengeDayDisplay()}</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {loggedInUser && (
              <div className="group relative flex flex-col items-start gap-1">
                <button
                  onClick={handleManualSync}
                  disabled={syncDisabled}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${syncDisabled ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-700 border-slate-200 hover:border-orange-200 hover:text-orange-600"}`}
                >
                  {syncing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      Syncing...
                    </>
                  ) : isCooldownActive ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Sync in {formatCooldown(remainingSyncMs)}
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Sync Data
                    </>
                  )}
                </button>
                {syncDisabled && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-72 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-lg group-hover:block">
                    {syncHelperText}
                  </div>
                )}
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSortBy("consistency")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === "consistency" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Consistency
              </button>
              <button
                onClick={() => setSortBy("distance")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === "distance" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Distance
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="px-6 py-4 w-16">Rank</th>
                <th className="px-6 py-4">Participant</th>
                <th className="px-6 py-4 text-center">Completed Days</th>
                <th className="px-6 py-4 text-right">Total Km</th>
                <th className="px-6 py-4 text-center">Streak</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStats.map((stat, index) => (
                <tr
                  key={stat.userId}
                  className={`hover:bg-slate-50 transition-colors ${getLoggedInUser()?.id == stat.userId ? "bg-orange-50/50" : ""}`}
                >
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={stat.avatarUrl}
                        alt={stat.name}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stat.name)}&background=f97316&color=fff`;
                        }}
                        className="w-10 h-10 rounded-full border border-slate-200"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {stat.name}
                          {getLoggedInUser()?.id == stat.userId && (
                            <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.round(stat.completionRate)}% Success Rate
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {stat.completedDays}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">
                    {formatDistance(stat.totalDistance)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stat.currentStreak > 2 && (
                      <span className="text-orange-600 font-bold">
                        🔥 {stat.currentStreak}
                      </span>
                    )}
                    {stat.currentStreak <= 2 && (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/user/${stat.userId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
