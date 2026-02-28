import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { UserDetailPage } from "./pages/UserDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";

import { AdminPage } from "./pages/AdminPage";
import AuthCallback from "./pages/AuthCallback";
import { Support } from "./pages/Support";

const App: React.FC = () => {
  // Check if we are in the callback phase (Strava redirected with ?code=...)
  // We handle this outside the HashRouter because the query params come before the hash
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
        });

        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAuthCode(code);
    }
  }, []);

  const handleAuthSuccess = () => {
    setAuthCode(null);
  };

  if (authCode) {
    return <AuthCallbackPage code={authCode} onSuccess={handleAuthSuccess} />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LeaderboardPage />} />
          <Route path="/user/:userId" element={<UserDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/admin"
            element={isAdmin ? <AdminPage /> : <Navigate to="/" />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
