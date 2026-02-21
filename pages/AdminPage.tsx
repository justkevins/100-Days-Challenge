import React, { useState } from 'react';

export const AdminPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple hardcoded password for club use
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: `Success! Updated ${data.count} users.` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload file. Please check the format.' });
    } finally {
      setUploading(false);
    }
  };

  const downloadData = () => {
    window.location.href = '/api/admin/export';
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter admin password"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>
      
      <div className="space-y-8">
        {/* Section 1: Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h2 className="font-semibold text-blue-900 mb-2">How to update the leaderboard</h2>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Download the current data (Excel) below.</li>
            <li>Edit the file to fix any incorrect data.</li>
            <li>Keep the "User ID" column unchanged to update existing users.</li>
            <li>Upload the file back here to update the site.</li>
          </ol>
        </div>

        {/* Section 2: Download Template */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-3">1. Export Data</h3>
          <button 
            onClick={downloadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Current Leaderboard (Excel)
          </button>
        </div>

        {/* Section 3: Upload */}
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-3">2. Upload Corrections</h3>
          <div className="flex gap-4 items-start">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100
              "
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Update Leaderboard'}
            </button>
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
