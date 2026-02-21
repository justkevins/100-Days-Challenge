import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { initiateStravaAuth, getLoggedInUser, logout } from '../services/stravaAuth';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getLoggedInUser());
  }, []);

  const isActive = (route: string) => path === route ? "text-orange-600 font-bold" : "text-slate-600 hover:text-orange-500";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
                Stride<span className="text-orange-600">100</span>
              </Link>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <Link to="/" className={isActive('/')}>Leaderboard</Link>
              <Link to="/about" className={isActive('/about')}>About & Rules</Link>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-slate-900">{user.firstname} {user.lastname}</div>
                    <button onClick={logout} className="text-xs text-red-500 hover:underline">Log Out</button>
                  </div>
                  <img src={user.profile} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
                </div>
              ) : (
                <div className="hidden md:block">
                   <button 
                     onClick={initiateStravaAuth}
                     className="bg-[#fc4c02] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#e34402] transition-colors shadow-sm flex items-center gap-2"
                   >
                     Connect Strava
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
         <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
            <p>Built for the Running Community.</p>
            <p className="mt-2">Not officially affiliated with Strava.</p>
            <div className="mt-4 flex justify-center gap-4 text-sm text-slate-400">
              <Link to="/about" className="hover:text-orange-600 transition-colors">About</Link>
              <span>•</span>
              <Link to="/admin" className="hover:text-orange-600 transition-colors">Admin</Link>
            </div>
         </div>
      </footer>
    </div>
  );
};
