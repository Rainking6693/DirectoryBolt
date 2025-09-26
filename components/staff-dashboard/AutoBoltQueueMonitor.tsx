// AutoBolt Queue Monitor Component
// Displays real-time AutoBolt processing queue and extension status

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import CustomerValidation from './CustomerValidation'
import BatchProcessingMonitor from './BatchProcessingMonitor'

type QueueStatus = 'pending' | 'in_progress' | 'complete' | 'failed' | 'cancelled'

interface QueueItem {
  id: string
  customerId: string
  businessName: string | null
  email: string | null
  packageSize: number
  priorityLevel: number
  status: QueueStatus
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  errorMessage?: string | null
  directoriesTotal: number
  directoriesCompleted: number
  directoriesFailed: number
  progressPercentage: number
}

interface QueueStats {
  totalJobs: number
  pendingJobs: number
  inProgressJobs: number
  completedJobs: number
  failedJobs: number
  totalDirectories: number
  completedDirectories: number
  failedDirectories: number
  successRate: number
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

interface WorkerStatus {
  worker_id: string
  status: 'online' | 'offline' | 'processing' | 'error' | 'idle'
  last_heartbeat: string
  current_job_id?: string
  jobs_processed: number
  jobs_failed: number
  proxy_enabled: boolean
  captcha_credits: number
  error_message?: string
  uptime_seconds: number
}

function formatPackage(size: number) {
  switch (size) {
    case 50:
      return 'Starter (50)'
    case 100:
      return 'Growth (100)'
    case 300:
      return 'Professional (300)'
    case 500:
      return 'Enterprise (500)'
    default:
      return `Custom (${size})`
  }
}

function formatStatus(status: QueueStatus) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'in_progress':
      return 'In Progress'
    case 'complete':
      return 'Complete'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

export default function AutoBoltQueueMonitor() {
  const router = useRouter()
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus[]>([])
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filteredStatus, setFilteredStatus] = useState<QueueStatus | 'all'>('all')
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set())
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [showExtensionComponents, setShowExtensionComponents] = useState(true)

  useEffect(() => {
    fetchQueueData()
    // Increase frequency for real-time updates during development
    const interval = setInterval(fetchQueueData, 3000)
    return () => clearInterval(interval)
  }, [])

  // Real-time status updates via Server-Sent Events (optional enhancement)
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://directorybolt.netlify.app'
    let eventSource: EventSource | null = null
    
    try {
      eventSource = new EventSource(`${baseUrl}/api/autobolt/stream`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'queue_update') {
            fetchQueueData()
          } else if (data.type === 'worker_status') {
            setWorkerStatus(data.workers || [])
          }
        } catch (error) {
          console.error('SSE parsing error:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.warn('SSE connection error (non-critical):', error)
        // SSE is optional, don't impact main functionality
        if (eventSource) {
          eventSource.close()
        }
      }
    } catch (sseError) {
      console.warn('SSE initialization failed (non-critical):', sseError)
      // SSE is an enhancement, don't fail if unavailable
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  const fetchQueueData = async () => {
    try {
      // Validate authentication with server first
      const authResponse = await fetch('/api/staff/auth-check')
      if (!authResponse.ok) {
        throw new Error('Staff authentication expired or invalid')
      }

      const authData = await authResponse.json()
      if (!authData.isAuthenticated) {
        throw new Error('Staff authentication required')
      }

      const headers = {
        'Content-Type': 'application/json'
        // Server validates via session cookies, no need for Bearer token
      }

      // Use production backend API URLs
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://directorybolt.netlify.app'
      
      // Fetch queue data with production endpoint
      const queueResponse = await fetch(`${baseUrl}/api/staff/autobolt-queue`, { 
        headers,
        method: 'GET',
        cache: 'no-store'
      })
      
      if (!queueResponse.ok) {
        const errorText = await queueResponse.text()
        throw new Error(`Queue API Error: ${queueResponse.status} - ${errorText}`)
      }

      const queueResult = await queueResponse.json()
      if (queueResult.success) {
        const items: QueueItem[] = (queueResult.data?.queueItems || []).map((item: any) => ({
          id: item.id,
          customerId: item.customerId,
          businessName: item.businessName || null,
          email: item.email || null,
          packageSize: item.packageSize,
          priorityLevel: item.priorityLevel,
          status: item.status,
          createdAt: item.createdAt,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
          errorMessage: item.errorMessage,
          directoriesTotal: item.directoriesTotal,
          directoriesCompleted: item.directoriesCompleted,
          directoriesFailed: item.directoriesFailed,
          progressPercentage: item.progressPercentage
        }))

        setQueueItems(items)

        if (queueResult.data?.stats) {
          const stats = queueResult.data.stats
          setQueueStats({
            totalJobs: stats.total_jobs ?? stats.totalJobs ?? 0,
            pendingJobs: stats.total_queued ?? stats.pendingJobs ?? 0,
            inProgressJobs: stats.total_processing ?? stats.inProgressJobs ?? 0,
            completedJobs: stats.total_completed ?? stats.completedJobs ?? 0,
            failedJobs: stats.total_failed ?? stats.failedJobs ?? 0,
            totalDirectories: stats.total_directories ?? 0,
            completedDirectories: stats.completed_directories ?? stats.completedDirectories ?? 0,
            failedDirectories: stats.failed_directories ?? stats.failedDirectories ?? 0,
            successRate: stats.success_rate ?? stats.successRate ?? 0
          })
        }
      }

      // Fetch backend worker status (replaces extension functionality)
      try {
        const workerResponse = await fetch(`${baseUrl}/api/autobolt-status`, { 
          headers,
          method: 'GET',
          cache: 'no-store'
        })
        
        if (workerResponse.ok) {
          const workerResult = await workerResponse.json()
          if (workerResult.success && workerResult.data) {
            setWorkerStatus(workerResult.data.workers || [])
          }
        }
      } catch (workerError) {
        console.warn('Worker status fetch failed:', workerError)
        // Don't fail the entire operation if worker status fails
      }

      // Legacy extension status (will be phased out)
      try {
        const extensionResponse = await fetch('/api/staff/autobolt-extensions', { headers })
        if (extensionResponse.ok) {
          const extensionResult = await extensionResponse.json()
          if (extensionResult.success) {
            setExtensionStatus(extensionResult.data?.extensions || [])
          }
        }
      } catch (extensionError) {
        console.warn('Extension status fetch failed:', extensionError)
        // Extensions are legacy, don't fail if unavailable
        setExtensionStatus([])
      }

      setLastUpdated(new Date())
      setLoading(false)
      setError(null)
    } catch (fetchError) {
      console.error('Failed to load AutoBolt queue:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load queue data')
      setLoading(false)
    }
  }

  const filteredItems = filteredStatus === 'all'
    ? queueItems
    : queueItems.filter(item => item.status === filteredStatus)

  const retryFailedJobs = async () => {
    try {
      const failedJobs = queueItems.filter(item => item.status === 'failed')
      if (failedJobs.length === 0) {
        setError('No failed jobs to retry')
        return
      }

      // Validate authentication with server
      const authResponse = await fetch('/api/staff/auth-check')
      if (!authResponse.ok) {
        throw new Error('Staff authentication expired')
      }

      const headers = {
        'Content-Type': 'application/json'
      }

      setRetryingJobs(new Set(failedJobs.map(job => job.id)))

      // Use production backend API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://directorybolt.netlify.app'
      const response = await fetch(`${baseUrl}/api/autobolt/jobs/retry`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobIds: failedJobs.map(job => job.id)
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Retry API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      if (result.success) {
        // Refresh queue data to show updated statuses
        await fetchQueueData()
        setError(null)
        
        // Show success message
        console.log(`Successfully queued ${result.data?.retriedJobsCount || failedJobs.length} jobs for retry`)
      } else {
        throw new Error(result.error || 'Failed to retry jobs')
      }
    } catch (retryError) {
      console.error('Failed to retry jobs:', retryError)
      setError(retryError instanceof Error ? retryError.message : 'Failed to retry jobs')
    } finally {
      setRetryingJobs(new Set())
    }
  }

  const retrySpecificJob = async (jobId: string) => {
    try {
      // Validate authentication with server
      const authResponse = await fetch('/api/staff/auth-check')
      if (!authResponse.ok) {
        throw new Error('Staff authentication expired')
      }

      const headers = {
        'Content-Type': 'application/json'
      }

      setRetryingJobs(prev => new Set([...prev, jobId]))

      // Use production backend API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://directorybolt.netlify.app'
      const response = await fetch(`${baseUrl}/api/autobolt/jobs/retry`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobIds: [jobId]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Retry API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      if (result.success) {
        // Refresh queue data to show updated status
        await fetchQueueData()
        setError(null)
        
        // Log success
        console.log(`Successfully queued job ${jobId} for retry`)
      } else {
        throw new Error(result.error || 'Failed to retry job')
      }
    } catch (retryError) {
      console.error('Failed to retry job:', retryError)
      setError(retryError instanceof Error ? retryError.message : 'Failed to retry job')
    } finally {
      setRetryingJobs(prev => {
        const updated = new Set(prev)
        updated.delete(jobId)
        return updated
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="bg-secondary-900/40 border border-secondary-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                workerStatus.some(w => w.status === 'online') || extensionStatus.some(e => e.status === 'online')
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-red-400'
              }`}></div>
              <span className="text-secondary-200 font-medium">
                {workerStatus.some(w => w.status === 'online') || extensionStatus.some(e => e.status === 'online')
                  ? 'AutoBolt Active' 
                  : 'AutoBolt Offline'}
              </span>
            </div>
            <div className="text-secondary-400 text-sm">
              {workerStatus.length > 0 && `${workerStatus.length} backend workers`}
              {extensionStatus.length > 0 && ` • ${extensionStatus.length} legacy extensions`}
              {error && (
                <span className="text-red-300 ml-2">
                  • Backend Connection Issue
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Backend Connection Status */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-xs text-secondary-300">
                {error ? 'Backend Disconnected' : 'Backend Connected'}
              </span>
            </div>
            <button
              onClick={() => setShowExtensionComponents(!showExtensionComponents)}
              className="px-3 py-1 text-xs bg-secondary-700 hover:bg-secondary-600 rounded text-secondary-200"
            >
              {showExtensionComponents ? 'Hide Tools' : 'Show Tools'}
            </button>
          </div>
        </div>
      </div>

      {/* Extension Migration Components */}
      {showExtensionComponents && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CustomerValidation />
          <BatchProcessingMonitor 
            customerId={selectedCustomerId}
            onBatchStart={() => console.log('Batch started')}
            onBatchComplete={() => fetchQueueData()}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AutoBolt Queue</h2>
          <p className="text-secondary-400 text-sm">
            Real-time job queue and worker status monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-secondary-400 text-sm">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Awaiting updates...'}
          </div>
          <button
            onClick={fetchQueueData}
            disabled={loading}
            className="px-4 py-2 text-sm bg-secondary-800 hover:bg-secondary-700 disabled:opacity-50 rounded-md text-secondary-100"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {queueItems.some(item => item.status === 'failed') && (
            <button
              onClick={retryFailedJobs}
              disabled={retryingJobs.size > 0}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md text-white font-medium"
            >
              {retryingJobs.size > 0 ? 'Retrying...' : `Retry ${queueItems.filter(item => item.status === 'failed').length} Failed Jobs`}
            </button>
          )}
          <button
            onClick={() => router.push('/staff-dashboard')}
            className="px-4 py-2 text-sm bg-volt-500/10 border border-volt-500/40 text-volt-300 rounded-md hover:bg-volt-500/15"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-md">
          {error}
        </div>
      )}

      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Pending Jobs" value={queueStats.pendingJobs} status="pending" />
          <StatCard label="In Progress" value={queueStats.inProgressJobs} status="in_progress" />
          <StatCard label="Completed" value={queueStats.completedJobs} status="completed" />
          <StatCard label="Failed" value={queueStats.failedJobs} status="failed" />
        </div>
      )}

      <div className="bg-secondary-900/60 border border-secondary-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-secondary-800 flex items-center gap-4">
          <span className="text-sm text-secondary-400">Filter status:</span>
          <select
            value={filteredStatus}
            onChange={(event) => setFilteredStatus(event.target.value as QueueStatus | 'all')}
            className="bg-secondary-800 text-secondary-100 text-sm px-3 py-2 rounded-md border border-secondary-700"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-800">
            <thead className="bg-secondary-900/80">
              <tr>
                <Th>Customer</Th>
                <Th>Email</Th>
                <Th>Package</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Completed</Th>
                <Th>Failed</Th>
                <Th>Priority</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-secondary-400">
                    Loading queue data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-secondary-400">
                    No jobs match the current filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-800/40 transition-colors">
                    <Td>
                      <div className="font-medium text-secondary-100">{item.businessName || 'Unknown Business'}</div>
                      <div className="text-xs text-secondary-500">{item.customerId}</div>
                    </Td>
                    <Td>
                      <span className="text-secondary-300 text-sm">{item.email || 'N/A'}</span>
                    </Td>
                    <Td>
                      <span className="text-secondary-200 text-sm">{formatPackage(item.packageSize)}</span>
                    </Td>
                    <Td>
                      <StatusPill status={item.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${item.status === 'complete' ? 'bg-green-400' : 'bg-volt-400'}`}
                            style={{ width: `${item.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-secondary-300 text-xs w-12">{item.progressPercentage}%</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-secondary-200 text-sm">{item.directoriesCompleted}/{item.directoriesTotal}</span>
                    </Td>
                    <Td>
                      <span className="text-red-300 text-sm">{item.directoriesFailed}</span>
                    </Td>
                    <Td>
                      <span className="text-secondary-300 text-sm">{item.priorityLevel}</span>
                    </Td>
                    <Td>
                      <div className="text-secondary-300 text-xs">
                        <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
                        {item.startedAt && <div>Started: {new Date(item.startedAt).toLocaleString()}</div>}
                        {item.completedAt && <div>Completed: {new Date(item.completedAt).toLocaleString()}</div>}
                        {item.errorMessage && <div className="text-red-300">Error: {item.errorMessage}</div>}
                      </div>
                    </Td>
                    <Td>
                      {item.status === 'failed' && (
                        <button
                          onClick={() => retrySpecificJob(item.id)}
                          disabled={retryingJobs.has(item.id)}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-white font-medium"
                        >
                          {retryingJobs.has(item.id) ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Status - New Backend Architecture */}
      <div className="bg-secondary-900/60 border border-secondary-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-secondary-800">
          <h3 className="text-secondary-200 font-medium">Worker Status</h3>
          <p className="text-secondary-500 text-sm">Backend worker heartbeat monitoring and performance metrics</p>
        </div>
        <div className="divide-y divide-secondary-800">
          {workerStatus.length === 0 ? (
            <div className="p-4 text-secondary-400 text-sm">
              No active workers detected. Backend workers will appear here once deployed.
            </div>
          ) : (
            workerStatus.map((worker) => (
              <div key={worker.worker_id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-secondary-100 font-medium">Worker {worker.worker_id}</div>
                    <div className="text-secondary-400 text-xs">
                      Last heartbeat: {new Date(worker.last_heartbeat).toLocaleString()}
                      {worker.current_job_id && ` | Processing job: ${worker.current_job_id}`}
                    </div>
                    {worker.error_message && (
                      <div className="text-red-300 text-xs mt-1">Error: {worker.error_message}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-secondary-200 text-sm">Uptime</div>
                      <div className="text-secondary-400 text-xs">
                        {Math.floor(worker.uptime_seconds / 3600)}h {Math.floor((worker.uptime_seconds % 3600) / 60)}m
                      </div>
                    </div>
                    <WorkerStatusBadge status={worker.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-secondary-800/40 rounded p-2">
                    <div className="text-secondary-400">Jobs Processed</div>
                    <div className="text-secondary-200 font-medium">{worker.jobs_processed}</div>
                  </div>
                  <div className="bg-secondary-800/40 rounded p-2">
                    <div className="text-secondary-400">Jobs Failed</div>
                    <div className="text-red-300 font-medium">{worker.jobs_failed}</div>
                  </div>
                  <div className="bg-secondary-800/40 rounded p-2">
                    <div className="text-secondary-400">Proxy</div>
                    <div className={`font-medium ${worker.proxy_enabled ? 'text-green-300' : 'text-secondary-300'}`}>
                      {worker.proxy_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="bg-secondary-800/40 rounded p-2">
                    <div className="text-secondary-400">Captcha Credits</div>
                    <div className="text-secondary-200 font-medium">{worker.captcha_credits}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legacy Extension Status - Will be removed after migration */}
      <div className="bg-secondary-900/60 border border-secondary-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-secondary-800">
          <h3 className="text-secondary-200 font-medium">Extension Status (Legacy)</h3>
          <p className="text-secondary-500 text-sm">Chrome extension instances - will be deprecated after backend migration</p>
        </div>
        <div className="divide-y divide-secondary-800">
          {extensionStatus.length === 0 ? (
            <div className="p-4 text-secondary-400 text-sm">
              No active AutoBolt extension heartbeats detected.
            </div>
          ) : (
            extensionStatus.map((extension) => (
              <div key={extension.extension_id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-secondary-100 font-medium">Extension {extension.extension_id}</div>
                  <div className="text-secondary-400 text-xs">Last heartbeat: {new Date(extension.last_heartbeat).toLocaleString()}</div>
                  {extension.error_message && (
                    <div className="text-red-300 text-xs mt-1">Error: {extension.error_message}</div>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-secondary-200 text-sm">Processing</div>
                    <div className="text-secondary-400 text-xs">{extension.directories_processed} directories</div>
                  </div>
                  <div>
                    <div className="text-secondary-200 text-sm">Failed</div>
                    <div className="text-red-300 text-xs">{extension.directories_failed}</div>
                  </div>
                  <StatusBadge status={extension.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type StatusBadgeStatus = ExtensionStatus['status']
type WorkerStatusBadgeStatus = WorkerStatus['status']
type StatusPillStatus = QueueStatus

function StatusBadge({ status }: { status: StatusBadgeStatus }) {
  const colors: Record<StatusBadgeStatus, string> = {
    online: 'bg-green-500/20 text-green-300 border-green-400/40',
    offline: 'bg-secondary-800 text-secondary-300 border-secondary-700',
    processing: 'bg-volt-500/10 text-volt-300 border-volt-500/40',
    error: 'bg-red-500/10 text-red-300 border-red-500/40'
  }

  const labels: Record<StatusBadgeStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    processing: 'Processing',
    error: 'Error'
  }

  return (
    <span className={`px-3 py-1 text-xs rounded-full border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function WorkerStatusBadge({ status }: { status: WorkerStatusBadgeStatus }) {
  const colors: Record<WorkerStatusBadgeStatus, string> = {
    online: 'bg-green-500/20 text-green-300 border-green-400/40',
    offline: 'bg-secondary-800 text-secondary-300 border-secondary-700',
    idle: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    processing: 'bg-volt-500/10 text-volt-300 border-volt-500/40',
    error: 'bg-red-500/10 text-red-300 border-red-500/40'
  }

  const labels: Record<WorkerStatusBadgeStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    idle: 'Idle',
    processing: 'Processing',
    error: 'Error'
  }

  return (
    <span className={`px-3 py-1 text-xs rounded-full border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function StatusPill({ status }: { status: StatusPillStatus }) {
  const colors: Record<StatusPillStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    in_progress: 'bg-volt-500/10 text-volt-300 border-volt-500/40',
    completed: 'bg-green-500/10 text-green-300 border-green-500/40',
    failed: 'bg-red-500/10 text-red-300 border-red-500/40',
    cancelled: 'bg-secondary-700 text-secondary-200 border-secondary-500/40'
  }

  return (
    <span className={`px-3 py-1 text-xs rounded-full border ${colors[status]}`}>
      {formatStatus(status)}
    </span>
  )
}

function StatCard({ label, value, status }: { label: string; value: number; status: QueueStatus }) {
  return (
    <div className="bg-secondary-900/60 border border-secondary-800 rounded-lg p-4">
      <div className="text-secondary-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold text-secondary-100 mt-2">{value}</div>
      <div className="text-xs text-secondary-400 mt-1">Status: {formatStatus(status)}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 whitespace-nowrap align-top">
      {children}
    </td>
  )
}




