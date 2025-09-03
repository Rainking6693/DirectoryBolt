import React from 'react'
import { QueueData, QueueItemActions } from '../types/queue.types'
import QueueHeader from './QueueHeader'
import QueueStats from './QueueStats'
import QueueList from './QueueList'

interface QueueInterfaceProps {
  data: QueueData | null
}

export default function QueueInterface({ data }: QueueInterfaceProps) {
  const actions: QueueItemActions = {
    onProcessNow: async (customerId: string) => {
      console.log('Processing customer:', customerId)
      
      try {
        const response = await fetch(`/api/autobolt/process-queue?customerId=${customerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to start processing')
        }

        // Show success notification or update UI
        console.log('Processing started successfully:', result.data)
        
        // In a real app, you might want to show a toast notification here
        // or update the queue data to reflect the processing state
        
      } catch (error) {
        console.error('Failed to process customer:', error)
        // Show error notification
        alert('Failed to start processing. Please try again.')
      }
    },

    onViewDetails: (customerId: string) => {
      console.log('Viewing details for customer:', customerId)
      // In a real app, this might open a modal or navigate to a detailed view
      // For now, we'll just log it
    },

    onContact: (customerId: string) => {
      console.log('Contacting customer:', customerId)
      // In a real app, this might open an email client or contact form
      // For now, we'll just log it
    }
  }

  if (!data) {
    return (
      <div className="bg-secondary-800 rounded-xl border border-secondary-700 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500 mx-auto mb-4"></div>
        <p className="text-secondary-300">Loading queue data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Queue Header */}
      <div className="bg-secondary-800 rounded-xl border border-secondary-700">
        <QueueHeader stats={data.stats} isConnected={true} />
      </div>

      {/* Quick Stats Grid */}
      <QueueStats stats={data.stats} />

      {/* Queue List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Queue List ({data.customers.length} customers)
          </h3>
          <div className="text-sm text-secondary-300">
            Sorted by priority • Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
        
        <QueueList 
          customers={data.customers}
          actions={actions}
          isLoading={false}
        />
      </div>
    </div>
  )
}