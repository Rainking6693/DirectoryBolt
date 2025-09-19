// Real-Time Customer Queue Component for Staff Dashboard
// Displays live customer processing data from Supabase

import React, { useState, useEffect } from 'react'

interface CustomerQueueData {
  id: string
  customer_id: string
  business_name: string
  email: string
  package_type: string
  status: string
  priority_level: number
  directories_allocated: number
  directories_submitted: number
  directories_failed: number
  progress_percentage: number
  estimated_completion: string | null
  created_at: string
  updated_at: string
  recent_activity: Array<{
    id: string
    action: string
    directories_processed: number
    directories_failed: number
    timestamp: string
  }>
  current_submissions: Array<{
    id: string
    directory_name: string
    submission_status: string
    created_at: string
  }>
}

interface QueueData {
  stats: {
    pending: number
    processing: number
    completed: number
    failed: number
    total: number
    completedToday: number
  }
  queue: CustomerQueueData[]
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    customer_id: string
    priority: 'high' | 'medium' | 'low'
  }>
  recent_activity: Array<{
    id: string
    customer_id: string
    action: string
    directories_processed: number
    directories_failed: number
    timestamp: string
  }>
  processing_summary: {
    total_directories_allocated: number
    total_directories_submitted: number
    total_directories_failed: number
    overall_completion_rate: number
  }
}

export default function RealTimeQueue() {
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerQueueData | null>(null)

  useEffect(() => {
    fetchQueueData()
    const interval = setInterval(fetchQueueData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchQueueData = async () => {
    try {
      // Get stored staff auth from localStorage
      const storedAuth = localStorage.getItem('staffAuth')
      
      const headers: HeadersInit = {}
      if (storedAuth) {
        headers['Authorization'] = `Bearer ${storedAuth}`
      } else {
        // Fallback to API key if no stored auth
        headers['x-staff-key'] = 'DirectoryBolt-Staff-2025-SecureKey'
      }

      const response = await fetch('/api/staff/queue', {
        headers
      })
      if (!response.ok) {
        throw new Error('Failed to fetch queue data')
      }
      
      const result = await response.json()
      if (result.success) {
        setQueueData(result.data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        throw new Error(result.message || 'Failed to load queue data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Queue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'in-progress': return 'text-blue-400 bg-blue-400/20'
      case 'completed': return 'text-green-400 bg-green-400/20'
      case 'failed': return 'text-red-400 bg-red-400/20'
      default: return 'text-secondary-400 bg-secondary-400/20'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-400 bg-red-400/20'
      case 2: return 'text-orange-400 bg-orange-400/20'
      case 3: return 'text-yellow-400 bg-yellow-400/20'
      default: return 'text-secondary-400 bg-secondary-400/20'
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
        <p className="text-red-400 font-medium">Failed to load queue data</p>
        <p className="text-red-300 text-sm mt-2">{error}</p>
        <button 
          onClick={fetchQueueData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!queueData) {
    return (
      <div className="text-center text-secondary-400">
        No queue data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Customer Queue</h2>
        <div className="flex items-center space-x-2 text-secondary-300">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Live'}
          </span>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-yellow-400">{queueData.stats.pending}</p>
          <p className="text-secondary-400 text-sm">Pending</p>
        </div>
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-blue-400">{queueData.stats.processing}</p>
          <p className="text-secondary-400 text-sm">Processing</p>
        </div>
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-green-400">{queueData.stats.completed}</p>
          <p className="text-secondary-400 text-sm">Completed</p>
        </div>
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-red-400">{queueData.stats.failed}</p>
          <p className="text-secondary-400 text-sm">Failed</p>
        </div>
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-white">{queueData.stats.total}</p>
          <p className="text-secondary-400 text-sm">Total</p>
        </div>
        <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
          <p className="text-2xl font-bold text-volt-400">{queueData.stats.completedToday}</p>
          <p className="text-secondary-400 text-sm">Today</p>
        </div>
      </div>

      {/* Alerts */}
      {queueData.alerts.length > 0 && (
        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <h3 className="text-xl font-bold text-white mb-4">⚠️ Alerts</h3>
          <div className="space-y-3">
            {queueData.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                alert.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{alert.title}</p>
                    <p className="text-secondary-300 text-sm">{alert.message}</p>
                    <p className="text-secondary-400 text-xs mt-1">Customer: {alert.customer_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Queue */}
      <div className="bg-secondary-800 rounded-xl border border-secondary-700">
        <div className="p-6 border-b border-secondary-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Customer Processing Queue</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-secondary-300">P1 (Enterprise/Pro)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-secondary-300">P2 (Professional)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-secondary-300">P3 (Growth)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-secondary-300">P4 (Starter)</span>
              </div>
            </div>
          </div>
          <p className="text-secondary-400 text-sm mt-2">Click on any customer row to view detailed information</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-700">
              {queueData.queue.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-secondary-700/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{customer.business_name}</div>
                      <div className="text-sm text-secondary-400">{customer.email}</div>
                      <div className="text-xs text-secondary-500">{customer.customer_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-volt-500/20 text-volt-400 rounded-full">
                      {customer.package_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(customer.priority_level)}`}>
                      P{customer.priority_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-secondary-600 rounded-full h-2 mr-2">
                        <div 
                          className="bg-volt-500 h-2 rounded-full"
                          style={{ width: `${customer.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-secondary-300">
                        {customer.directories_submitted}/{customer.directories_allocated}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                    {customer.estimated_completion ? 
                      new Date(customer.estimated_completion).toLocaleString() : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-volt-400 hover:text-volt-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing Summary */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">Processing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-secondary-400 text-sm">Total Allocated</p>
            <p className="text-2xl font-bold text-white">{queueData.processing_summary.total_directories_allocated.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Total Submitted</p>
            <p className="text-2xl font-bold text-green-400">{queueData.processing_summary.total_directories_submitted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Total Failed</p>
            <p className="text-2xl font-bold text-red-400">{queueData.processing_summary.total_directories_failed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Overall Completion</p>
            <p className="text-2xl font-bold text-volt-400">{queueData.processing_summary.overall_completion_rate}%</p>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-secondary-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">Business Information</h4>
                <p className="text-secondary-300">{selectedCustomer.business_name}</p>
                <p className="text-secondary-400 text-sm">{selectedCustomer.email}</p>
                <p className="text-secondary-500 text-xs">{selectedCustomer.customer_id}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Processing Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-secondary-400 text-sm">Package</p>
                    <p className="text-white">{selectedCustomer.package_type}</p>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Status</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Progress</p>
                    <p className="text-white">{selectedCustomer.directories_submitted}/{selectedCustomer.directories_allocated}</p>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Failed</p>
                    <p className="text-red-400">{selectedCustomer.directories_failed}</p>
                  </div>
                </div>
              </div>
              
              {selectedCustomer.current_submissions.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Current Submissions</h4>
                  <div className="space-y-2">
                    {selectedCustomer.current_submissions.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-2 bg-secondary-700 rounded">
                        <span className="text-white text-sm">{submission.directory_name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(submission.submission_status)}`}>
                          {submission.submission_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
