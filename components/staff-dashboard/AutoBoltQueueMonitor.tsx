// AutoBolt Queue Monitor Component
// Displays real-time AutoBolt processing queue and extension status

import React, { useState, useEffect } from 'react'

interface QueueItem {
  id: string
  customer_id: string
  business_name: string
  email: string
  package_type: string
  directory_limit: number
  priority_level: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

interface ExtensionStatus {
  extension_id: string
  status: 'online' | 'offline' | 'processing' | 'error'
  last_heartbeat: string
  current_customer_id?: string
  directories_processed: number
  directories_failed: number
  error_message?: string
}

interface QueueStats {
  total_queued: number
  total_processing: number
  total_completed: number
  total_failed: number
}

export default function AutoBoltQueueMonitor() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchQueueData()
    const interval = setInterval(fetchQueueData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchQueueData = async () => {
    try {
      const storedAuth = localStorage.getItem('staffAuth')
      
      if (!storedAuth) {
        throw new Error('Staff authentication required')
      }
      
      const headers = {
        'Authorization': `Bearer ${storedAuth}`
      }

      // Fetch queue items
      const queueResponse = await fetch('/api/staff/autobolt-queue', { headers })
      if (!queueResponse.ok) {
        throw new Error('Failed to fetch queue data')
      }
      
      const queueResult = await queueResponse.json()
      if (queueResult.success) {
        setQueueItems(queueResult.data.queue_items || [])
        setQueueStats(queueResult.data.stats || null)
      }

      // Fetch extension status
      const extensionResponse = await fetch('/api/staff/autobolt-extensions', { headers })
      if (extensionResponse.ok) {
        const extensionResult = await extensionResponse.json()
        if (extensionResult.success) {
          setExtensionStatus(extensionResult.data || [])
        }
      }

      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('AutoBolt queue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-yellow-400 bg-yellow-400/20'
      case 'processing': return 'text-blue-400 bg-blue-400/20'
      case 'completed': return 'text-green-400 bg-green-400/20'
      case 'failed': return 'text-red-400 bg-red-400/20'
      case 'paused': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getExtensionStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-400/20'
      case 'processing': return 'text-blue-400 bg-blue-400/20'
      case 'offline': return 'text-gray-400 bg-gray-400/20'
      case 'error': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
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
        <p className="text-red-400 font-medium">Failed to load AutoBolt queue</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">AutoBolt Processing Queue</h2>
        <div className="flex items-center space-x-2 text-secondary-300">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Live'}
          </span>
        </div>
      </div>

      {/* Queue Statistics */}
      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
            <p className="text-2xl font-bold text-yellow-400">{queueStats.total_queued}</p>
            <p className="text-secondary-400 text-sm">Queued</p>
          </div>
          <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
            <p className="text-2xl font-bold text-blue-400">{queueStats.total_processing}</p>
            <p className="text-secondary-400 text-sm">Processing</p>
          </div>
          <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
            <p className="text-2xl font-bold text-green-400">{queueStats.total_completed}</p>
            <p className="text-secondary-400 text-sm">Completed</p>
          </div>
          <div className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center">
            <p className="text-2xl font-bold text-red-400">{queueStats.total_failed}</p>
            <p className="text-secondary-400 text-sm">Failed</p>
          </div>
        </div>
      )}

      {/* Extension Status */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">AutoBolt Extensions</h3>
        {extensionStatus.length > 0 ? (
          <div className="space-y-3">
            {extensionStatus.map((extension) => (
              <div key={extension.extension_id} className="flex items-center justify-between p-3 bg-secondary-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExtensionStatusColor(extension.status)}`}>
                    {extension.status}
                  </span>
                  <span className="text-white font-medium">{extension.extension_id}</span>
                  {extension.current_customer_id && (
                    <span className="text-secondary-300 text-sm">
                      Processing: {extension.current_customer_id}
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-secondary-300">
                  <div>Processed: {extension.directories_processed}</div>
                  <div>Failed: {extension.directories_failed}</div>
                  <div>Last seen: {formatTimeAgo(extension.last_heartbeat)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary-400 text-center py-4">No AutoBolt extensions connected</p>
        )}
      </div>

      {/* Processing Queue */}
      <div className="bg-secondary-800 rounded-xl border border-secondary-700">
        <div className="p-6 border-b border-secondary-700">
          <h3 className="text-xl font-bold text-white">Processing Queue</h3>
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
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-700">
              {queueItems.length > 0 ? (
                queueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{item.business_name}</div>
                        <div className="text-sm text-secondary-400">{item.email}</div>
                        <div className="text-xs text-secondary-500">{item.customer_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-volt-500/20 text-volt-400 rounded-full">
                        {item.package_type} ({item.directory_limit})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority_level)}`}>
                        P{item.priority_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                      {item.started_at ? formatTimeAgo(item.started_at) : 'Not started'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                      {item.started_at && !item.completed_at ? 
                        formatTimeAgo(item.started_at) : 
                        item.completed_at ? 'Completed' : 'N/A'
                      }
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-secondary-400">
                    No items in AutoBolt processing queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function getPriorityColor(priority: number) {
  switch (priority) {
    case 1: return 'text-red-400 bg-red-400/20'
    case 2: return 'text-orange-400 bg-orange-400/20'
    case 3: return 'text-yellow-400 bg-yellow-400/20'
    case 4: return 'text-gray-400 bg-gray-400/20'
    default: return 'text-gray-400 bg-gray-400/20'
  }
}
