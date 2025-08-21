"use client";

import { useEffect, useState } from "react";

interface AdminStats {
  today: {
    date: string;
    freeCreditsUsed: number;
    freeCreditsValue: number;
    uniqueUsers: number;
    remainingFreeValue: number;
  };
  last7Days: Array<{
    date: string;
    freeCreditsUsed: number;
    freeCreditsValue: number;
    uniqueUsers: number;
  }>;
  users: {
    total: number;
    withCredits: number;
    completedProfiles: number;
  };
  generations: {
    total: number;
    successful: number;
    successRate: string;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(async (r) => {
      if (r.ok) {
        setStats(await r.json());
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center page-bg">
        <div className="text-center">Loading admin stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center page-bg">
        <div className="text-center">Failed to load stats</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-8 page-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight mb-8" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>
          Admin Dashboard
        </h1>

        {/* Today's Usage */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-green-600">${stats.today.freeCreditsValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Today's Free Cost</div>
            <div className="text-xs text-gray-500 mt-1">
              ${stats.today.remainingFreeValue.toFixed(2)} remaining
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.today.freeCreditsUsed}</div>
            <div className="text-sm text-gray-600">Free Credits Used</div>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.today.uniqueUsers}</div>
            <div className="text-sm text-gray-600">Active Users Today</div>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-2xl font-bold text-orange-600">{stats.generations.successRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.generations.successful}/{stats.generations.total}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>
            User Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.users.total}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.users.withCredits}</div>
              <div className="text-sm text-gray-600">Users with Credits</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.users.completedProfiles}</div>
              <div className="text-sm text-gray-600">Completed Profiles</div>
            </div>
          </div>
        </div>

        {/* 7-Day Trend */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>
            Last 7 Days Usage
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Free Credits</th>
                  <th className="text-left py-2">Cost</th>
                  <th className="text-left py-2">Users</th>
                </tr>
              </thead>
              <tbody>
                {stats.last7Days.map((day) => (
                  <tr key={day.date} className="border-b border-gray-100">
                    <td className="py-2">{day.date}</td>
                    <td className="py-2">{day.freeCreditsUsed}</td>
                    <td className="py-2">${day.freeCreditsValue.toFixed(2)}</td>
                    <td className="py-2">{day.uniqueUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>⚠️ This is a development admin panel. In production, add proper authentication.</p>
        </div>
      </div>
    </div>
  );
}
