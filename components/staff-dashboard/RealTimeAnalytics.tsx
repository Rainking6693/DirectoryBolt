// Real-Time Analytics Component for Staff Dashboard
// Displays live data from Supabase database

import React, { useState, useEffect } from 'react'

interface AnalyticsData {
  overview: {
    total_customers: number
    active_customers: number
    pending_customers: number
    completed_customers: number
    total_submissions: number
    success_rate: number
  }
  submissions: {
    total: number
    pending: number
    submitted: number
    approved: number
    rejected: number
    success_rate: number
  }
  directories: {
    total_allocated: number
    total_submitted: number
    total_failed: number
    completion_rate: number
  }
  performance: {
    avg_processing_time_seconds: number
    today_submissions: number
    this_week_submissions: number
    this_month_submissions: number
  }
  package_distribution: Record<string, number>
  recent_activity: {
    newCustomers: number
    completedSubmissions: number
    failedSubmissions: number
  }
  top_directories: Array<{
    name: string
    total: number
    approved: number
    rejected: number
    success_rate: number
  }>
  trends: {
    daily_submissions: Array<{
      date: string
      submissions: number
    }>
    weekly_customers: Array<{
      week: string
      customers: number
    }>
  }
}

export default function RealTimeAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/staff/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        throw new Error(result.message || 'Failed to load analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500"></div>
      </div>
    )
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
    )
  }

  if (!analytics) {
    return (
      <div className="text-center text-secondary-400">
        No analytics data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Real-Time Analytics</h2>
        <div className="flex items-center space-x-2 text-secondary-300">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Live'}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-white">{analytics.overview.total_customers}</p>
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
              <p className="text-3xl font-bold text-green-400">{analytics.overview.active_customers}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-400 text-sm">Total Submissions</p>
              <p className="text-3xl font-bold text-volt-400">{analytics.overview.total_submissions}</p>
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
              <p className="text-3xl font-bold text-green-400">{analytics.overview.success_rate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Status */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Submission Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{analytics.submissions.pending}</p>
            <p className="text-secondary-400 text-sm">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{analytics.submissions.submitted}</p>
            <p className="text-secondary-400 text-sm">Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{analytics.submissions.approved}</p>
            <p className="text-secondary-400 text-sm">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{analytics.submissions.rejected}</p>
            <p className="text-secondary-400 text-sm">Rejected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-volt-400">{analytics.submissions.success_rate}%</p>
            <p className="text-secondary-400 text-sm">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Directory Performance */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Directory Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-secondary-400 text-sm">Total Allocated</p>
            <p className="text-2xl font-bold text-white">{analytics.directories.total_allocated.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Total Submitted</p>
            <p className="text-2xl font-bold text-green-400">{analytics.directories.total_submitted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Completion Rate</p>
            <p className="text-2xl font-bold text-volt-400">{analytics.directories.completion_rate}%</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-secondary-400 mb-2">
            <span>Progress</span>
            <span>{analytics.directories.completion_rate}%</span>
          </div>
          <div className="w-full bg-secondary-700 rounded-full h-2">
            <div 
              className="bg-volt-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analytics.directories.completion_rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Package Distribution */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Package Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.package_distribution).map(([packageType, count]) => (
            <div key={packageType} className="text-center">
              <p className="text-2xl font-bold text-volt-400">{count}</p>
              <p className="text-secondary-400 text-sm capitalize">{packageType}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity (24h)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{analytics.recent_activity.newCustomers}</p>
            <p className="text-secondary-400 text-sm">New Customers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{analytics.recent_activity.completedSubmissions}</p>
            <p className="text-secondary-400 text-sm">Completed Submissions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{analytics.recent_activity.failedSubmissions}</p>
            <p className="text-secondary-400 text-sm">Failed Submissions</p>
          </div>
        </div>
      </div>

      {/* Top Performing Directories */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Top Performing Directories</h3>
        <div className="space-y-3">
          {analytics.top_directories.slice(0, 5).map((directory, index) => (
            <div key={directory.name} className="flex items-center justify-between p-3 bg-secondary-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-volt-400 font-bold">#{index + 1}</span>
                <span className="text-white font-medium">{directory.name}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-secondary-400">{directory.total} total</span>
                <span className="text-green-400">{directory.approved} approved</span>
                <span className="text-volt-400 font-bold">{directory.success_rate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-secondary-400 text-sm">Avg Processing Time</p>
            <p className="text-2xl font-bold text-white">{Math.round(analytics.performance.avg_processing_time_seconds / 60)}m</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Today's Submissions</p>
            <p className="text-2xl font-bold text-volt-400">{analytics.performance.today_submissions}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">This Week</p>
            <p className="text-2xl font-bold text-blue-400">{analytics.performance.this_week_submissions}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">This Month</p>
            <p className="text-2xl font-bold text-green-400">{analytics.performance.this_month_submissions}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
