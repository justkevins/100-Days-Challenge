import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_ACTIVITIES_DB, MOCK_USERS } from '../services/mockData';
import { processUserActivities } from '../services/processor';
import { StatCard } from '../components/StatCard';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { formatDistance } from '../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  const user = MOCK_USERS.find(u => u.id === userId);
  const rawActivities = userId ? MOCK_ACTIVITIES_DB[userId] : [];

  const stats = useMemo(() => {
    if (!user || !rawActivities) return null;
    return processUserActivities(user.id, user.name, user.avatar, rawActivities);
  }, [user, rawActivities]);

  if (!stats) {
    return <div className="text-center py-20 text-slate-500">User not found</div>;
  }

  // Prepare chart data
  const chartData = Object.values(stats.dailyRecords)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(record => {
      const [y, m, d] = record.date.split('-').map(Number);
      // Construct date string manually MM/dd
      const dateLabel = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
      
      return {
        date: dateLabel,
        distance: parseFloat((record.totalDistance / 1000).toFixed(2)),
        completed: record.isCompleted
      };
    });

  return (
    <div className="space-y-8 animate-fade-in">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
            ← Back to Leaderboard
        </Link>

        <div className="flex items-center gap-6">
            <img src={stats.avatarUrl} alt={stats.name} className="w-20 h-20 rounded-full border-4 border-white shadow-md" />
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{stats.name}</h1>
                <p className="text-slate-500">Participant Status: {stats.currentStreak > 0 ? 'Active 🔥' : 'Resting'}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Distance" value={formatDistance(stats.totalDistance)} subValue="Kilometers" />
            <StatCard label="Days Completed" value={stats.completedDays} subValue="Consistency" />
            <StatCard label="Current Streak" value={stats.currentStreak} subValue="Consecutive Days" />
            <StatCard label="Longest Streak" value={stats.longestStreak} subValue="All time best" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Daily Progress</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.completed ? '#22c55e' : '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">Bars are green when daily target (1km) is met.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-900 mb-6">Consistency Heatmap</h3>
             <ActivityCalendar dailyRecords={stats.dailyRecords} />
        </div>
    </div>
  );
};