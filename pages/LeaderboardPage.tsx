import React, { useState, useMemo } from 'react';
import { MOCK_ACTIVITIES_DB, MOCK_USERS } from '../services/mockData';
import { processUserActivities } from '../services/processor';
import { UserStats } from '../types';
import { StatCard } from '../components/StatCard';
import { Link } from 'react-router-dom';
import { formatDistance } from '../utils/dateUtils';

export const LeaderboardPage: React.FC = () => {
  // Simulating fetching and processing data
  const allStats: UserStats[] = useMemo(() => {
    return MOCK_USERS.map(user => 
      processUserActivities(user.id, user.name, user.avatar, MOCK_ACTIVITIES_DB[user.id])
    );
  }, []);

  const [sortBy, setSortBy] = useState<'consistency' | 'distance'>('consistency');

  const sortedStats = [...allStats].sort((a, b) => {
    if (sortBy === 'consistency') {
      // Primary: Completed Days, Secondary: Total Distance
      if (b.completedDays !== a.completedDays) return b.completedDays - a.completedDays;
      return b.totalDistance - a.totalDistance;
    } else {
      // Primary: Total Distance
      return b.totalDistance - a.totalDistance;
    }
  });

  const totalCommunityKm = allStats.reduce((acc, curr) => acc + curr.totalDistance, 0);
  const totalCompletedDays = allStats.reduce((acc, curr) => acc + curr.completedDays, 0);

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
          value={allStats.length}
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
          
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
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
                <tr key={stat.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={stat.avatarUrl} alt={stat.name} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <div className="font-semibold text-slate-900">{stat.name}</div>
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
