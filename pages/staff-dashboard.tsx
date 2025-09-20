import React, { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import RealTimeQueue from '../components/staff-dashboard/RealTimeQueue'
import RealTimeAnalytics from '../components/staff-dashboard/RealTimeAnalytics'
import AutoBoltQueueMonitor from '../components/staff-dashboard/AutoBoltQueueMonitor'
import { useRouter } from 'next/router'

export default function StaffDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'autobolt'>('queue')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // SECURITY FIX: Check staff authentication
  useEffect(() => {
    const checkStaffAuth = async () => {
      try {
        // Check for staff session cookie first
        const staffSession = document.cookie
          .split('; ')
          .find(row => row.startsWith('staff-session='))
          ?.split('=')[1]

        // Check for stored auth from localStorage
        const storedAuth = localStorage.getItem('staffAuth')
        
        // If no authentication found, redirect to login
        if (!staffSession && !storedAuth) {
          console.log('No staff authentication found, redirecting to login')
          router.push('/staff-login')
          setIsAuthLoading(false)
          return
        }

        // Try to authenticate with available credentials
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        if (storedAuth) {
          headers['Authorization'] = `Bearer ${storedAuth}`
        }
        if (staffSession) {
          headers['Cookie'] = `staff-session=${staffSession}`
        }

        const response = await fetch('/api/staff/auth-check', {
          method: 'GET',
          headers,
          credentials: 'include'
        })

        if (response.ok) {
          const authData = await response.json()
          console.log('✅ Staff authenticated:', authData.user?.username)
          setIsAuthenticated(true)
        } else {
          console.warn('❌ Staff authentication failed')
          // Clear invalid auth and redirect to login
          localStorage.removeItem('staffAuth')
          document.cookie = 'staff-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          router.push('/staff-login')
        }
      } catch (error) {
        console.error('❌ Staff auth check failed:', error)
        localStorage.removeItem('staffAuth')
        document.cookie = 'staff-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        router.push('/staff-login')
      } finally {
        setIsAuthLoading(false)
      }
    }

    checkStaffAuth()
  }, [router])

  // SECURITY: Show authentication loading or access denied
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking staff access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need staff privileges to access this dashboard.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Authentication Methods:</strong><br/>
              • API Key: Add x-staff-key header<br/>
              • Session Cookie: staff-session<br/>
              • Basic Auth: staff / DirectoryBoltStaff2025!
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
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
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-secondary-300 text-sm">Live Data</span>
                </div>
              </div>

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-2 sm:space-x-8 -mb-px overflow-x-auto">
                    {[
                      { key: 'queue', label: 'Queue', fullLabel: 'Customer Queue', icon: '📋' },
                      { key: 'analytics', label: 'Analytics', fullLabel: 'Real-Time Analytics', icon: '📈' },
                      { key: 'autobolt', label: 'AutoBolt', fullLabel: 'AutoBolt Monitor', icon: '🤖' }
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
          </div>
        </header>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {activeTab === 'queue' && <RealTimeQueue />}
              {activeTab === 'analytics' && <RealTimeAnalytics />}
              {activeTab === 'autobolt' && <AutoBoltQueueMonitor />}
            </main>
      </div>
    </Layout>
  )
}