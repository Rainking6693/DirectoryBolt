// Batch Processing Monitor Component
// Converts extension batch processing UI to React dashboard component

import React, { useState, useEffect } from 'react'

interface BatchProgress {
  totalRecords: number
  processedRecords: number
  failedRecords: number
  currentRecord?: string
  isRunning: boolean
  progressPercentage: number
  estimatedTimeRemaining?: number
}

interface BatchLogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

interface BatchProcessingMonitorProps {
  customerId?: string
  onBatchStart?: () => void
  onBatchComplete?: () => void
}

export default function BatchProcessingMonitor({ 
  customerId, 
  onBatchStart, 
  onBatchComplete 
}: BatchProcessingMonitorProps) {
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    isRunning: false,
    progressPercentage: 0
  })
  
  const [batchLog, setBatchLog] = useState<BatchLogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Simulate batch processing (would connect to real API in production)
  const startBatchProcessing = async () => {
    if (!customerId) {
      addLogEntry('error', 'Customer ID required to start batch processing')
      return
    }

    setIsProcessing(true)
    onBatchStart?.()

    try {
      const storedAuth = localStorage.getItem('staffAuth')
      if (!storedAuth) {
        throw new Error('Staff authentication required')
      }

      const response = await fetch('/api/autobolt/start-batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId })
      })

      if (!response.ok) {
        throw new Error('Failed to start batch processing')
      }

      const result = await response.json()
      if (result.success) {
        setBatchProgress({
          ...batchProgress,
          isRunning: true,
          totalRecords: result.data.totalDirectories || 0
        })
        addLogEntry('info', `Batch processing started for ${customerId}`)
        addLogEntry('info', `Processing ${result.data.totalDirectories || 0} directories`)
        
        // Start monitoring progress
        monitorBatchProgress()
      } else {
        throw new Error(result.error || 'Failed to start batch processing')
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      addLogEntry('error', error instanceof Error ? error.message : 'Failed to start batch processing')
      setIsProcessing(false)
    }
  }

  const stopBatchProcessing = async () => {
    try {
      const storedAuth = localStorage.getItem('staffAuth')
      if (!storedAuth) {
        throw new Error('Staff authentication required')
      }

      const response = await fetch('/api/autobolt/stop-batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId })
      })

      if (response.ok) {
        setBatchProgress(prev => ({ ...prev, isRunning: false }))
        addLogEntry('warning', 'Batch processing stopped by user')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Stop batch error:', error)
      addLogEntry('error', 'Failed to stop batch processing')
    }
  }

  const monitorBatchProgress = () => {
    const interval = setInterval(async () => {
      try {
        const storedAuth = localStorage.getItem('staffAuth')
        if (!storedAuth) return

        const response = await fetch(`/api/autobolt/batch-progress?customerId=${encodeURIComponent(customerId || '')}`, {
          headers: {
            Authorization: `Bearer ${storedAuth}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const progress = result.data
            setBatchProgress({
              totalRecords: progress.totalDirectories || 0,
              processedRecords: progress.processedDirectories || 0,
              failedRecords: progress.failedDirectories || 0,
              currentRecord: progress.currentDirectory,
              isRunning: progress.isActive,
              progressPercentage: Math.round(((progress.processedDirectories || 0) / (progress.totalDirectories || 1)) * 100),
              estimatedTimeRemaining: progress.estimatedTimeRemaining
            })

            // Add progress log entries
            if (progress.recentActivity) {
              progress.recentActivity.forEach((activity: any) => {
                addLogEntry(activity.success ? 'success' : 'error', activity.message)
              })
            }

            // Check if batch is complete
            if (!progress.isActive && (progress.processedDirectories + progress.failedDirectories) >= progress.totalDirectories) {
              clearInterval(interval)
              setIsProcessing(false)
              onBatchComplete?.()
              addLogEntry('success', `Batch processing complete: ${progress.processedDirectories} processed, ${progress.failedDirectories} failed`)
            }
          }
        }
      } catch (error) {
        console.error('Progress monitoring error:', error)
      }
    }, 2000) // Check every 2 seconds

    // Clean up interval after 5 minutes if still running
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000)
  }

  const addLogEntry = (level: BatchLogEntry['level'], message: string) => {
    const entry: BatchLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    }

    setBatchLog(prev => [...prev.slice(-49), entry]) // Keep last 50 entries
  }

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return 'Calculating...'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  return (
    <div className="bg-secondary-900/60 border border-secondary-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-secondary-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-secondary-200 font-medium">Batch Processing</h3>
            <p className="text-secondary-500 text-sm">
              Directory submission processing for {customerId || 'selected customer'}
            </p>
          </div>
          <div className="flex gap-2">
            {!batchProgress.isRunning ? (
              <button
                onClick={startBatchProcessing}
                disabled={!customerId || isProcessing}
                className="px-4 py-2 bg-volt-600 hover:bg-volt-700 disabled:bg-secondary-700 
                           disabled:text-secondary-500 text-white text-sm font-medium rounded-md 
                           transition-colors duration-200"
              >
                Start Processing
              </button>
            ) : (
              <button
                onClick={stopBatchProcessing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm 
                           font-medium rounded-md transition-colors duration-200"
              >
                Stop Processing
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-secondary-300">Progress</span>
            <span className="text-secondary-300">{batchProgress.progressPercentage}%</span>
          </div>
          <div className="w-full bg-secondary-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-volt-500 to-volt-400 transition-all duration-500 ease-out"
              style={{ width: `${batchProgress.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary-800/40 rounded-lg p-3">
            <div className="text-secondary-400 text-xs font-medium">TOTAL</div>
            <div className="text-secondary-100 text-lg font-semibold">{batchProgress.totalRecords}</div>
          </div>
          <div className="bg-secondary-800/40 rounded-lg p-3">
            <div className="text-secondary-400 text-xs font-medium">PROCESSED</div>
            <div className="text-green-300 text-lg font-semibold">{batchProgress.processedRecords}</div>
          </div>
          <div className="bg-secondary-800/40 rounded-lg p-3">
            <div className="text-secondary-400 text-xs font-medium">FAILED</div>
            <div className="text-red-300 text-lg font-semibold">{batchProgress.failedRecords}</div>
          </div>
        </div>

        {/* Current Status */}
        {batchProgress.isRunning && (
          <div className="bg-volt-500/10 border border-volt-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-volt-300 text-sm font-medium">Currently Processing</div>
                <div className="text-secondary-300 text-xs mt-1">
                  {batchProgress.currentRecord || 'Preparing next directory...'}
                </div>
              </div>
              {batchProgress.estimatedTimeRemaining && (
                <div className="text-right">
                  <div className="text-secondary-400 text-xs">ETA</div>
                  <div className="text-volt-300 text-sm font-medium">
                    {formatTimeRemaining(batchProgress.estimatedTimeRemaining)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="border border-secondary-700 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-secondary-800/60 border-b border-secondary-700">
            <div className="text-secondary-300 text-sm font-medium">Activity Log</div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {batchLog.length === 0 ? (
              <div className="p-3 text-secondary-500 text-sm text-center">
                No activity yet. Start batch processing to see logs.
              </div>
            ) : (
              <div className="divide-y divide-secondary-800">
                {batchLog.slice(-10).reverse().map((entry, index) => (
                  <div key={index} className="px-3 py-2 flex items-start gap-3">
                    <span className="text-secondary-500 text-xs font-mono min-w-[65px]">
                      {entry.timestamp}
                    </span>
                    <span className={`text-xs ${
                      entry.level === 'success' ? 'text-green-300' :
                      entry.level === 'error' ? 'text-red-300' :
                      entry.level === 'warning' ? 'text-yellow-300' :
                      'text-secondary-300'
                    }`}>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}