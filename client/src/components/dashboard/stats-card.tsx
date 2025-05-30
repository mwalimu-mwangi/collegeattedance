import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({ icon, title, value, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
