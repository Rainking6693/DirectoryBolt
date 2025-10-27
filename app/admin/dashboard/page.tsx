'use client';

/**
 * Admin Dashboard Home Page
 * Real-time metrics, charts, and system monitoring
 * Load time target: <2s
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface DashboardMetrics {
  totalCustomers: number;
  activeJobs: number;
  completedJobs: number;
  pendingSubmissions: number;
  successRate: number;
  revenue: number;
}

interface JobStatusData {
  name: string;
  value: number;
  color: string;
}

interface RevenueData {
  date: string;
  revenue: number;
}

const COLORS = {
  pending: '#FFA500',
  in_progress: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingSubmissions: 0,
    successRate: 0,
    revenue: 0,
  });

  const [jobStatusData, setJobStatusData] = useState<JobStatusData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /**
   * Fetch dashboard metrics
   */
  const fetchMetrics = async () => {
    try {
      setError(null);

      // Fetch total customers
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customerError) throw customerError;

      // Fetch job statistics
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('status, package_type');

      if (jobsError) throw jobsError;

      // Calculate job metrics
      const activeJobs = jobs?.filter((j) => j.status === 'in_progress').length || 0;
      const completedJobs = jobs?.filter((j) => j.status === 'completed').length || 0;
      const failedJobs = jobs?.filter((j) => j.status === 'failed').length || 0;
      const totalJobs = jobs?.length || 0;

      // Fetch submission statistics
      const { count: pendingCount, error: submissionError } = await supabase
        .from('directory_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (submissionError) throw submissionError;

      // Calculate success rate
      const successRate =
        totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0';

      // Update metrics
      setMetrics({
        totalCustomers: customerCount || 0,
        activeJobs,
        completedJobs,
        pendingSubmissions: pendingCount || 0,
        successRate: parseFloat(successRate),
        revenue: 0, // Would be calculated from Stripe data
      });

      // Update job status chart data
      const statusData: JobStatusData[] = [
        {
          name: 'Pending',
          value: jobs?.filter((j) => j.status === 'pending').length || 0,
          color: COLORS.pending,
        },
        {
          name: 'In Progress',
          value: activeJobs,
          color: COLORS.in_progress,
        },
        {
          name: 'Completed',
          value: completedJobs,
          color: COLORS.completed,
        },
        {
          name: 'Failed',
          value: failedJobs,
          color: COLORS.failed,
        },
      ];

      setJobStatusData(statusData.filter((d) => d.value > 0));

      // Generate mock revenue data (would come from Stripe in production)
      const mockRevenueData: RevenueData[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.floor(Math.random() * 5000) + 1000,
        };
      });

      setRevenueData(mockRevenueData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      setLoading(false);
    }
  };

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Set up real-time subscription for jobs
    const jobsSubscription = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    // Set up polling fallback (every 30 seconds)
    const pollInterval = setInterval(fetchMetrics, 30000);

    // Cleanup
    return () => {
      jobsSubscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  /**
   * Refresh metrics manually
   */
  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
  };

  if (loading && metrics.totalCustomers === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Jobs"
          value={metrics.activeJobs}
          icon="⚡"
          color="yellow"
        />
        <MetricCard
          title="Completed Jobs"
          value={metrics.completedJobs}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Job Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend (7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            href="/admin/customers"
            icon="👥"
            title="Manage Customers"
            description="View and manage customer accounts"
          />
          <ActionButton
            href="/admin/jobs"
            icon="📋"
            title="Monitor Jobs"
            description="Track job progress and submissions"
          />
          <ActionButton
            href="/admin/settings"
            icon="⚙️"
            title="Settings"
            description="Configure system settings"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function ActionButton({ href, icon, title, description }: ActionButtonProps) {
  return (
    <a
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start space-x-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
