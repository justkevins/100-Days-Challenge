import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { AboutPage } from './pages/AboutPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

import { AdminPage } from './pages/AdminPage';
import AuthCallback from './pages/AuthCallback';

const App: React.FC = () => {
  // Check if we are in the callback phase (Strava redirected with ?code=...)
  // We handle this outside the HashRouter because the query params come before the hash
  const [authCode, setAuthCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setAuthCode(code);
    }
  }, []);

  const handleAuthSuccess = () => {
    setAuthCode(null);
    // Force a re-render/reload logic if needed, or just let state clear
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
