import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  initiateStravaAuth,
  getLoggedInUser,
  logout,
} from "../services/stravaAuth";
import { isWhitelistedAdminAthlete } from "../utils/admin";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const path = location.pathname;
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const currentUser = getLoggedInUser();
    setUser(currentUser);
    setIsAdmin(isWhitelistedAdminAthlete(currentUser?.id));

    if (!currentUser) return;

    fetch("/api/admin/me", {
      credentials: "include",
    }).then((res) => {
      if (res.ok) setIsAdmin(true);
    });
  }, []);

  const isActive = (route: string) =>
    path === route
      ? "text-orange-600 font-bold"
      : "text-slate-600 hover:text-orange-500";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col justify-center gap-3 py-3 md:h-16 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-0 md:py-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <Link
                to="/"
                className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
              >
                Stride<span className="text-orange-600">100</span>
              </Link>
              </div>

              <div className="flex items-center gap-3 md:hidden shrink-0">
                {user ? (
                  <img
                    src={user.profile}
                    alt="Profile"
                    className="w-9 h-9 rounded-full border border-slate-200"
                  />
                ) : (
                  <button
                    onClick={initiateStravaAuth}
                    className="bg-[#fc4c02] text-white px-3 py-2 rounded-full text-xs font-medium hover:bg-[#e34402] transition-colors shadow-sm whitespace-nowrap"
                  >
                    Connect Strava
                  </button>
                )}
              </div>
            </div>

            <div className="hidden md:flex space-x-8">
              <Link to="/" className={isActive("/")}>
                Leaderboard
              </Link>
              <Link to="/about" className={isActive("/about")}>
                About & Rules
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-slate-900">
                      {user.firstname} {user.lastname}
                    </div>
                    <button
                      onClick={logout}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Log Out
                    </button>
                  </div>
                  <img
                    src={user.profile}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                </div>
              ) : (
                <button
                  onClick={initiateStravaAuth}
                  className="bg-[#fc4c02] text-white px-3 py-2 md:px-4 rounded-full text-xs md:text-sm font-medium hover:bg-[#e34402] transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  Connect Strava
                </button>
              )}
            </div>

            <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1">
              <Link
                to="/"
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                  path === "/"
                    ? "bg-orange-100 text-orange-700 font-semibold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Leaderboard
              </Link>
              <Link
                to="/about"
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                  path === "/about"
                    ? "bg-orange-100 text-orange-700 font-semibold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                About & Rules
              </Link>
              {user && (
                <button
                  onClick={logout}
                  className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap bg-red-50 text-red-600"
                >
                  Log Out
                </button>
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
          <p className="mt-2 text-slate-400">
            Built by AI. Kevin handled the consequences.
          </p>
          <div className="mt-4 flex justify-center items-center gap-3 text-sm text-slate-400">
            <Link
              to="/about"
              className="hover:text-orange-600 transition-colors"
            >
              About
            </Link>

            <span>•</span>

            <Link
              to="/support"
              className="hover:text-orange-600 transition-colors"
            >
              Support
            </Link>

            {isAdmin && (
              <>
                <span>•</span>
                <Link
                  to="/admin"
                  className="hover:text-orange-600 transition-colors"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
