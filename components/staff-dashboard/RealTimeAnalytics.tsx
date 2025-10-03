// Fixed Real-Time Analytics Component for Staff Dashboard
// Displays live data from Supabase database

import React, { useState, useEffect } from "react";

interface AnalyticsData {
  overview: {
    total_customers: number;
    active_customers: number;
    pending_customers: number;
    completed_customers: number;
    recent_activity: number;
  };
  package_breakdown: Record<string, number>;
  directory_stats: {
    total_allocated: number;
    total_submitted: number;
    total_failed: number;
    completion_rate: number;
    success_rate: number;
  };
  performance_metrics: {
    avg_directories_per_customer: number;
    processing_efficiency: number;
    customer_satisfaction: number;
  };
  trends: {
    daily_submissions: Array<{
      date: string;
      customers_updated: number;
      directories_submitted: number;
    }>;
    package_performance: Record<
      string,
      {
        total_customers: number;
        total_directories_allocated: number;
        total_directories_submitted: number;
        total_directories_failed: number;
        completion_rate: number;
      }
    >;
  };
}

export default function RealTimeAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/staff/analytics", { credentials: 'include' });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please sign in to the Staff Portal');
        }
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(result.message || "Failed to load analytics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500"></div>
        <p className="ml-4 text-secondary-300">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 font-medium">Failed to load analytics</p>
        <p className="text-red-300 text-sm mt-2">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-secondary-400 p-8">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Real-Time Analytics</h2>
        <div className="flex items-center space-x-2 text-secondary-300">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Live"}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-white">
                {analytics.overview.total_customers}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Active Customers</p>
              <p className="text-3xl font-bold text-green-400">
                {analytics.overview.active_customers}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Completed</p>
              <p className="text-3xl font-bold text-volt-400">
                {analytics.overview.completed_customers}
              </p>
            </div>
            <div className="w-12 h-12 bg-volt-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-400">
                {analytics.directory_stats.success_rate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Statistics */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Directory Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {analytics.directory_stats.total_allocated.toLocaleString()}
            </p>
            <p className="text-secondary-400 text-sm">Total Allocated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {analytics.directory_stats.total_submitted.toLocaleString()}
            </p>
            <p className="text-secondary-400 text-sm">Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">
              {analytics.directory_stats.total_failed.toLocaleString()}
            </p>
            <p className="text-secondary-400 text-sm">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-volt-400">
              {analytics.directory_stats.completion_rate}%
            </p>
            <p className="text-secondary-400 text-sm">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Package Breakdown */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Package Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.package_breakdown).map(
            ([packageType, count]) => (
              <div key={packageType} className="text-center">
                <p className="text-2xl font-bold text-volt-400">
                  {count as number}
                </p>
                <p className="text-secondary-400 text-sm capitalize">
                  {packageType}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {analytics.overview.recent_activity}
            </p>
            <p className="text-secondary-400 text-sm">Recent Updates (24h)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {analytics.performance_metrics.avg_directories_per_customer}
            </p>
            <p className="text-secondary-400 text-sm">
              Avg Directories/Customer
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-volt-400">
              {analytics.performance_metrics.customer_satisfaction}%
            </p>
            <p className="text-secondary-400 text-sm">Customer Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}
