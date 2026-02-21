import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { StatCard } from '../components/StatCard';
import { Link } from 'react-router-dom';
import { formatDistance } from '../utils/dateUtils';
import { getLoggedInUser, logout } from '../services/stravaAuth';
import { fetchAthleteActivities } from '../services/stravaApi';
import { processUserActivities } from '../services/processor';

export const LeaderboardPage: React.FC = () => {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'consistency' | 'distance'>('consistency');
  const [syncing, setSyncing] = useState(false);

  // Get current user to highlight them in the list
  const loggedInUser = getLoggedInUser();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/leaderboard');
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
    const token = localStorage.getItem('strava_access_token');
    if (!loggedInUser || !token) return;

    setSyncing(true);
    try {
      const realActivities = await fetchAthleteActivities(token);
      const updatedUserStats = processUserActivities(
        String(loggedInUser.id),
        `${loggedInUser.firstname} ${loggedInUser.lastname}`,
        loggedInUser.profile,
        realActivities
      );

      // Send to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUserStats)
      });

      if (response.ok) {
        // Refresh local list
        setStats(prevStats => {
          const others = prevStats.filter(s => s.userId !== String(loggedInUser.id));
          return [...others, updatedUserStats];
        });
      } else {
        console.error("Server sync failed");
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

  const sortedStats = [...stats].sort((a, b) => {
    if (sortBy === 'consistency') {
      // Primary: Completed Days, Secondary: Total Distance
      if (b.completedDays !== a.completedDays) return b.completedDays - a.completedDays;
      return b.totalDistance - a.totalDistance;
    } else {
      // Primary: Total Distance
      return b.totalDistance - a.totalDistance;
    }
  });

  const totalCommunityKm = stats.reduce((acc, curr) => acc + curr.totalDistance, 0);
  const totalCompletedDays = stats.reduce((acc, curr) => acc + curr.completedDays, 0);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading Leaderboard...</div>;
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
            <p className="text-sm text-slate-500">Day 14 of 100</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {loggedInUser && (
              <button 
                onClick={handleManualSync}
                disabled={syncing}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${syncing ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-orange-200 hover:text-orange-600'}`}
              >
                {syncing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Data
                  </>
                )}
              </button>
            )}

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setSortBy('consistency')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'consistency' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Consistency
              </button>
              <button 
                onClick={() => setSortBy('distance')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'distance' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
                <tr key={stat.userId} className={`hover:bg-slate-50 transition-colors ${getLoggedInUser()?.id == stat.userId ? 'bg-orange-50/50' : ''}`}>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={stat.avatarUrl} alt={stat.name} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <div className="font-semibold text-slate-900">
                            {stat.name} 
                            {getLoggedInUser()?.id == stat.userId && <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">You</span>}
                        </div>
                        <div className="text-xs text-slate-500">{Math.round(stat.completionRate)}% Success Rate</div>
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
                       <span className="text-orange-600 font-bold">🔥 {stat.currentStreak}</span>
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
