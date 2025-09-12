import React from 'react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AdminMonitoringDashboard from '../components/admin/AdminMonitoringDashboard'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple admin authentication check
    const checkAdminAuth = async () => {
      try {
        // Check if user has admin access
        const response = await fetch('/api/admin/auth-check', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          // Redirect to login or show access denied
          router.push('/login?redirect=/admin-dashboard')
        }
      } catch (error) {
        console.error('Admin auth check failed:', error)
        // Always require proper authentication - NO BYPASSES
        router.push('/login?redirect=/admin-dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this dashboard.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <AdminMonitoringDashboard />
}