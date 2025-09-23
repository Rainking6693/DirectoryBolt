import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface ActiveJob {
  job_id: string
  customer_id: string
  customer_name: string
  package_type: string
  directory_limit: number
  status: string
  started_at: string
  progress_percentage: number
  directories_completed: number
  directories_failed: number
  directories_pending: number
  current_directory?: string
  estimated_completion?: string
  processing_time_minutes: number
  last_activity: string
}

interface ExtensionStatus {
  extension_id: string
  status: string
  last_heartbeat: string
  current_customer_id?: string
  current_queue_id?: string
  directories_processed: number
  directories_failed: number
  is_active: boolean
}

interface QueueSummary {
  total_queued: number
  total_processing: number
  total_completed_today: number
  total_failed_today: number
  average_processing_time_minutes: number
}

interface MonitoringData {
  active_jobs: ActiveJob[]
  extension_status: ExtensionStatus[]
  queue_summary: QueueSummary
  last_updated: string
}

interface DirectorySubmission {
  submission_id: string
  directory_name: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  attempts: number
  last_attempt: string
  error_message?: string
  screenshot_url?: string
  processing_time_seconds?: number
}

interface SubmissionLog {
  log_id: string
  customer_id: string
  directory_name: string
  action: 'form_fill' | 'submit' | 'captcha' | 'verify' | 'error'
  timestamp: string
  details: string
  screenshot_url?: string
  success: boolean
}

export default function AutoBoltMonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [submissionLogs, setSubmissionLogs] = useState<SubmissionLog[]>([])
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch('/api/autobolt/real-time-status', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_AUTOBOLT_API_KEY || ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setMonitoringData(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch monitoring data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSubmissionLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/autobolt/submission-logs', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_AUTOBOLT_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSubmissionLogs(data.logs || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch submission logs:', err)
    }
  }, [])

  useEffect(() => {
    fetchMonitoringData()
    fetchSubmissionLogs()
  }, [fetchMonitoringData, fetchSubmissionLogs])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoringData()
      fetchSubmissionLogs()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchMonitoringData, fetchSubmissionLogs, refreshInterval])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-500'
      case 'queued': return 'bg-yellow-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'paused': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getExtensionStatusColor = (isActive: boolean, status: string) => {
    if (!isActive) return 'bg-red-500'
    switch (status) {
      case 'processing': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading AutoBolt monitoring data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Monitoring Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <Button 
          onClick={fetchMonitoringData}
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!monitoringData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium">No monitoring data available</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AutoBolt Live Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time visibility into directory submission automation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              Last updated: {formatTimestamp(monitoringData.last_updated)}
            </span>
          </div>
          <select 
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value={1000}>1s refresh</option>
            <option value={5000}>5s refresh</option>
            <option value={10000}>10s refresh</option>
            <option value={30000}>30s refresh</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {monitoringData.queue_summary.total_processing}
            </div>
            <p className="text-xs text-gray-500">Processing now</p>
            <div className="text-sm text-gray-700 mt-1">
              {monitoringData.queue_summary.total_queued} waiting
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitoringData.queue_summary.total_completed_today}
            </div>
            <p className="text-xs text-gray-500">Completed</p>
            <div className="text-sm text-red-600 mt-1">
              {monitoringData.queue_summary.total_failed_today} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processing Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(monitoringData.queue_summary.average_processing_time_minutes)}m
            </div>
            <p className="text-xs text-gray-500">Avg time per job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Extensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitoringData.extension_status.filter(ext => ext.is_active).length}
            </div>
            <p className="text-xs text-gray-500">Active extensions</p>
            <div className="text-sm text-gray-700 mt-1">
              of {monitoringData.extension_status.length} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="active-jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="active-jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="submission-logs">Live Logs</TabsTrigger>
          <TabsTrigger value="queue-analysis">Queue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="active-jobs" className="space-y-4">
          <div className="grid gap-4">
            {monitoringData.active_jobs.length > 0 ? (
              monitoringData.active_jobs.map((job) => (
                <Card key={job.job_id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.customer_name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {job.package_type} • {job.directory_limit} directories
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDuration(job.processing_time_minutes)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress_percentage}%</span>
                        </div>
                        <Progress value={job.progress_percentage} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {job.directories_completed}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-600">
                            {job.directories_pending}
                          </div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">
                            {job.directories_failed}
                          </div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                      </div>

                      {job.current_directory && (
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm font-medium">Currently processing:</div>
                          <div className="text-blue-700">{job.current_directory}</div>
                        </div>
                      )}

                      {job.estimated_completion && (
                        <div className="text-sm text-gray-600">
                          Estimated completion: {formatTimestamp(job.estimated_completion)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-medium">No active jobs</h3>
                <p className="text-sm mt-2">All customers are processed or queue is empty</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-4">
          <div className="grid gap-4">
            {monitoringData.extension_status.map((ext) => (
              <Card key={ext.extension_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Extension {ext.extension_id}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getExtensionStatusColor(ext.is_active, ext.status)}`}></div>
                      <Badge variant={ext.is_active ? "default" : "secondary"}>
                        {ext.is_active ? 'Active' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className="font-medium">{ext.status}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Heartbeat</div>
                      <div className="font-medium">{formatTimestamp(ext.last_heartbeat)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Processed Today</div>
                      <div className="font-medium text-green-600">{ext.directories_processed}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Failed Today</div>
                      <div className="font-medium text-red-600">{ext.directories_failed}</div>
                    </div>
                  </div>
                  
                  {ext.current_customer_id && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <div className="text-sm font-medium">Currently processing:</div>
                      <div className="text-blue-700">Customer {ext.current_customer_id}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submission-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Submission Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {submissionLogs.length > 0 ? (
                    submissionLogs.map((log) => (
                      <div 
                        key={log.log_id}
                        className={`p-3 rounded border-l-4 ${
                          log.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{log.action}</span>
                            <span className="text-xs text-gray-500">{log.directory_name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{log.details}</div>
                        {log.screenshot_url && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => window.open(log.screenshot_url, '_blank')}
                          >
                            View Screenshot
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📋</div>
                      <p>No recent submission activity</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue-analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Queue Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Processing Time</span>
                    <span className="font-medium">
                      {formatDuration(monitoringData.queue_summary.average_processing_time_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate Today</span>
                    <span className="font-medium text-green-600">
                      {monitoringData.queue_summary.total_completed_today > 0 ? 
                        Math.round((monitoringData.queue_summary.total_completed_today / 
                        (monitoringData.queue_summary.total_completed_today + monitoringData.queue_summary.total_failed_today)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Throughput</span>
                    <span className="font-medium">
                      {monitoringData.queue_summary.total_processing} jobs/min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Extensions</span>
                    <span className="font-medium text-green-600">
                      {monitoringData.extension_status.filter(ext => ext.is_active).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Backlog</span>
                    <span className={`font-medium ${
                      monitoringData.queue_summary.total_queued > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {monitoringData.queue_summary.total_queued} customers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Status</span>
                    <Badge className="bg-green-500">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}