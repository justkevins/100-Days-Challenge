import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</h3>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {subValue && <div className="text-sm text-slate-500 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};
