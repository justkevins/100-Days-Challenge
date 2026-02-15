import React from 'react';
import { MIN_DISTANCE_METERS } from '../constants';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">About the Challenge</h1>
        <p className="text-slate-600 leading-relaxed">
          The Stride100 challenge is a community event designed to build consistency and healthy habits. 
          The goal is simple: Move your body every single day for 100 days.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">The Rules</h2>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">1</div>
            <p className="text-slate-600">Run, Walk, or Hike a minimum of <strong>{MIN_DISTANCE_METERS / 1000} km</strong> per day.</p>
          </li>
          <li className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">2</div>
            <p className="text-slate-600">Sync your activity to Strava. Manual entries are discouraged but allowed if GPS fails.</p>
          </li>
          <li className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">3</div>
            <p className="text-slate-600">Consistency is key. The leaderboard is sorted by days completed first, then total distance.</p>
          </li>
        </ul>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">How it works</h2>
        <p className="text-slate-600 mb-4">
            This application connects to Strava to fetch your activities. We check the local date of your activity 
            to ensure timezone fairness. Multiple short walks in one day count towards your daily total!
        </p>
        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500">
            <strong>Privacy Note:</strong> We only read your activity type, distance, and date. We do not access heart rate, location maps, or private notes.
        </div>
      </div>
    </div>
  );
};
