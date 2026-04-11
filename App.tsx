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
import { getLoggedInUser } from "./services/stravaAuth";
import { isWhitelistedAdminAthlete } from "./utils/admin";

const App: React.FC = () => {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getLoggedInUser()); 

  const canAccessAdmin = isAdmin || isWhitelistedAdminAthlete(currentUser?.id);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = getLoggedInUser();
      setCurrentUser(user);                                    
      setIsAdmin(isWhitelistedAdminAthlete(user?.id));

      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        if (res.ok) setIsAdmin(true);
      } catch {
        // ignore
      }
    };

    checkAdmin();
  }, []); 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setAuthCode(code);
  }, []); 

  const handleAuthSuccess = () => {
    const user = getLoggedInUser();
    setCurrentUser(user);
    setIsAdmin(isWhitelistedAdminAthlete(user?.id));
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
            element={canAccessAdmin ? <AdminPage /> : <Navigate to="/" />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};


export default App;
