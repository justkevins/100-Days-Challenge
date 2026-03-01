import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { processUserActivities } from "../services/processor";
import { StatCard } from "../components/StatCard";
import { ActivityCalendar } from "../components/ActivityCalendar";
import { formatDistance } from "../utils/dateUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getLoggedInUser, logout } from "../services/stravaAuth";
import { fetchAthleteActivities } from "../services/stravaApi";
import { UserStats } from "../types";

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/leaderboard");
        if (response.ok) {
          const allStats: UserStats[] = await response.json();
          const user = allStats.find((u) => u.userId === userId);
          if (user) {
            setStats(user);
          } else {
            console.error("User not found");
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [userId]);

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Athlete Stats...
      </div>
    );
  if (!stats)
    return (
      <div className="text-center py-20 text-slate-500">User not found</div>
    );

  // Prepare chart data
  const chartData = Object.values(stats.dailyRecords || {})
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => {
      const [y, m, d] = record.date.split("-").map(Number);
      const dateLabel = `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;

      return {
        date: dateLabel,
        distance: parseFloat((record.totalDistance / 1000).toFixed(2)),
        completed: record.isCompleted,
      };
    });

  return (
    <div className="space-y-8 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to Leaderboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img
            src={stats.avatarUrl}
            alt={stats.name}
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stats.name)}&background=f97316&color=fff`;
            }}
            className="w-20 h-20 rounded-full border-4 border-white shadow-md"
          />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{stats.name}</h1>
            <p className="text-slate-500">
              Participant Status:{" "}
              {stats.currentStreak > 0 ? "Active 🔥" : "Resting"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Distance"
          value={formatDistance(stats.totalDistance)}
          subValue="Kilometers"
        />
        <StatCard
          label="Days Completed"
          value={stats.completedDays}
          subValue="Consistency"
        />
        <StatCard
          label="Current Streak"
          value={stats.currentStreak}
          subValue="Consecutive Days"
        />
        <StatCard
          label="Consistency"
          value={`${stats.completionRate.toFixed(0)}%`}
          subValue="Completion Rate"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Daily Progress
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.completed ? "#22c55e" : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Bars are green when daily target (1km) is met.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Consistency Heatmap
        </h3>
        <ActivityCalendar dailyRecords={stats.dailyRecords} />
      </div>
    </div>
  );
};
