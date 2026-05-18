'use client';

import { StatsDashboard } from "@/components/stats/StatsDashboard";

export default function DashboardPage() {
  return (
    <div className="w-full ">
      {/* Welcome Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">AnimalClick Dashboard</h1>
          <p className="text-gray-500">Manage your animal platform</p>
        </div>
      </div>

      <StatsDashboard />
    </div>
  );
}
