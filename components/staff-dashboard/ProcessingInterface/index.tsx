import React, { useState, useEffect } from 'react'
import ProcessNextCard from './ProcessNextCard'
import ActiveProcessing from './ActiveProcessing'
import { ProcessingJob } from '../types/processing.types'

export default function ProcessingInterface() {
  const [nextCustomer, setNextCustomer] = useState<any>(null)
  const [activeJobs, setActiveJobs] = useState<ProcessingJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch processing data
  useEffect(() => {
    fetchProcessingData()
  }, [])

  const fetchProcessingData = async () => {
    try {
      // Fetch queue status to get next customer
      const queueResponse = await fetch('/api/autobolt/queue-status')
      const queueResult = await queueResponse.json()
      
      if (queueResult.success) {
        setNextCustomer(queueResult.data.nextCustomer)
        setIsProcessing(queueResult.data.isProcessing)
      }

      // For now, mock active jobs since we don't have a dedicated API endpoint yet
      // In a real implementation, you'd fetch this from an API
      setActiveJobs([
        // Mock active processing job
        ...(queueResult.data.isProcessing ? [{
          customerId: 'DIR-2025-001234',
          businessName: 'TechStart Inc',
          packageType: 'PRO' as const,
          status: 'processing' as const,
          progress: 67,
          startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 minutes ago
          elapsedTime: 12.5,
          currentActivity: 'Submitting to Google My Business...',
          directoriesTotal: 200,
          directoriesCompleted: 134,
          directoriesSuccessful: 121,
          directoriesFailed: 13,
          directoriesRemaining: 66
        }] : [])
      ])

    } catch (error) {
      console.error('Failed to fetch processing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartProcessing = async (customerId: string, priorityMode = false) => {
    try {
      const url = priorityMode 
        ? `/api/autobolt/process-queue?customerId=${customerId}&priority=true`
        : `/api/autobolt/process-queue?customerId=${customerId}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start processing')
      }

      // Refresh data after starting processing
      await fetchProcessingData()
      
      console.log('Processing started:', result.data)
      
    } catch (error) {
      console.error('Failed to start processing:', error)
      // You might want to show a toast notification here
      throw error // Re-throw to let the component handle the error display
    }
  }

  const handleEmergencyStop = async (customerId: string) => {
    if (!confirm('Are you sure you want to emergency stop this processing? This action cannot be undone.')) {
      return
    }

    try {
      // In a real implementation, you'd have an emergency stop API endpoint
      console.log('Emergency stop requested for:', customerId)
      
      // For now, just remove from active jobs
      setActiveJobs(prev => prev.filter(job => job.customerId !== customerId))
      
    } catch (error) {
      console.error('Failed to stop processing:', error)
    }
  }

  const handleViewLiveLog = (customerId: string) => {
    console.log('Opening live log for:', customerId)
    // In a real implementation, this would open a modal or navigate to a log view
  }

  const handleViewDetails = (customerId: string) => {
    console.log('Opening details for:', customerId)
    // In a real implementation, this would open a detailed view
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Processing Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            🔄 Active Processing ({activeJobs.length})
          </h3>
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <ActiveProcessing
                key={job.customerId}
                job={job}
                onEmergencyStop={handleEmergencyStop}
                onViewLiveLog={handleViewLiveLog}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Process Next Customer Card */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          {isProcessing ? '⏸️ Queue Processing Active' : '🚀 Ready to Process'}
        </h3>
        
        <ProcessNextCard
          nextCustomer={nextCustomer ? {
            customerId: nextCustomer.customerId,
            businessName: nextCustomer.businessName,
            packageType: nextCustomer.packageType,
            directoryLimit: nextCustomer.directoryLimit,
            waitTime: calculateWaitTime(nextCustomer.createdAt)
          } : null}
          isProcessing={isProcessing}
          onStartProcessing={handleStartProcessing}
        />
      </div>

      {/* Processing Instructions */}
      {!isProcessing && !activeJobs.length && (
        <div className="bg-secondary-800/50 border border-secondary-700 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-3 flex items-center">
            ℹ️ Processing Instructions
          </h4>
          <div className="space-y-2 text-secondary-300">
            <p>• Click "Process Now" to start processing the next customer in queue</p>
            <p>• Priority processing is available for PRO customers only</p>
            <p>• Processing cannot be stopped once started - use emergency stop only if necessary</p>
            <p>• Monitor progress in real-time using the Live Processing dashboard</p>
            <p>• Failed directories will trigger manual intervention alerts</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to calculate wait time
function calculateWaitTime(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return Math.round(diffHours * 10) / 10
}