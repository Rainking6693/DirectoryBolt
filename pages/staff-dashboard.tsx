import React, { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import QueueInterface from '../components/staff-dashboard/QueueInterface'
import ProcessingInterface from '../components/staff-dashboard/ProcessingInterface'
import ProgressTracking from '../components/staff-dashboard/ProgressTracking'
import CompletionReports from '../components/staff-dashboard/CompletionReports'
import ManualIntervention from '../components/staff-dashboard/ManualIntervention'
import { useWebSocket } from '../hooks/useWebSocket'
import { useQueueData } from '../hooks/useQueueData'
import { AlertProvider } from '../contexts/AlertContext'

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'processing' | 'analytics' | 'alerts'>('queue')
  const { isConnected, data: wsData } = useWebSocket('/api/ws/staff-dashboard')
  const { queueData, isLoading, error, refreshData } = useQueueData()

  // Auto-refresh every 10 seconds (as specified in requirements)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [refreshData])

  return (
    <AlertProvider>
      <Layout 
        title="Staff Dashboard - DirectoryBolt" 
        description="Staff dashboard for managing customer queue and monitoring processing"
      >
        <div className="min-h-screen bg-secondary-900">
          {/* Dashboard Header */}
          <header className="bg-secondary-800 border-b border-secondary-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:h-20 space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h1 className="text-xl lg:text-2xl font-black text-white flex items-center">
                    📊 Staff Dashboard
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-secondary-300 text-sm">
                      {isConnected ? 'Live' : 'Reconnecting...'}
                    </span>
                  </div>
                </div>

                {/* Auto-refresh Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-secondary-300 text-sm hidden sm:inline">🔄 Auto-refresh:</span>
                    <div className="bg-volt-500 px-3 py-1 rounded-full text-secondary-900 text-sm font-bold">
                      🔄 ON
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="text-secondary-300 text-sm">
                    {queueData && (
                      <div className="flex flex-col sm:flex-row sm:space-x-2">
                        <span>{queueData.stats.pending} pending</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{queueData.stats.processing} in progress</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{queueData.stats.completedToday} completed today</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex space-x-2 sm:space-x-8 -mb-px overflow-x-auto">
                {[
                  { key: 'queue', label: 'Queue', fullLabel: 'Customer Queue', icon: '📋' },
                  { key: 'processing', label: 'Processing', fullLabel: 'Live Processing', icon: '🔄' },
                  { key: 'analytics', label: 'Analytics', fullLabel: 'Analytics', icon: '📈' },
                  { key: 'alerts', label: 'Alerts', fullLabel: 'Alerts', icon: '🚨' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center space-x-2 px-3 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-volt-500 text-volt-400'
                        : 'border-transparent text-secondary-400 hover:text-secondary-300 hover:border-secondary-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.fullLabel}</span>
                    <span className="sm:hidden">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-6 text-center">
                <p className="text-red-400 font-medium">Failed to load dashboard data</p>
                <button 
                  onClick={refreshData}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'queue' && <QueueInterface data={queueData} />}
                {activeTab === 'processing' && <ProcessingInterface />}
                {activeTab === 'analytics' && <CompletionReports />}
                {activeTab === 'alerts' && <ManualIntervention />}
              </>
            )}
          </main>
        </div>
      </Layout>
    </AlertProvider>
  )
}