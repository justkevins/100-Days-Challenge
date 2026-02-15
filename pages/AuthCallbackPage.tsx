import React, { useEffect, useState } from 'react';
import { handleAuthCallback } from '../services/stravaAuth';

interface Props {
  code: string;
  onSuccess: () => void;
}

export const AuthCallbackPage: React.FC<Props> = ({ code, onSuccess }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const exchangeToken = async () => {
      try {
        await handleAuthCallback(code);
        setStatus('success');
        // Clear the query string to keep URL clean
        window.history.replaceState({}, document.title, window.location.pathname);
        onSuccess();
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setErrorMsg(err.message || 'Unknown authentication error');
      }
    };

    exchangeToken();
  }, [code, onSuccess]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <a href="/" className="text-blue-600 hover:underline">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-700">Connecting to Strava...</h2>
        <p className="text-slate-500 mt-2">Please wait while we secure your tokens.</p>
      </div>
    </div>
  );
};
