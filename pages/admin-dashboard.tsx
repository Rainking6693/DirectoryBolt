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
        // Get stored auth from localStorage
        const storedAuth = localStorage.getItem('adminAuth')
        const authMethod = localStorage.getItem('adminAuthMethod')
        
        if (!storedAuth) {
          router.push('/admin-login')
          return
        }

        // Check if user has admin access
        let headers: any = {}
        if (authMethod === 'bearer') {
          headers['Authorization'] = `Bearer ${storedAuth}`
        } else {
          headers['Authorization'] = `Basic ${storedAuth}`
        }
        
        const response = await fetch('/api/admin/auth-check', {
          method: 'GET',
          headers
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          // Clear invalid auth and redirect to login
          localStorage.removeItem('adminAuth')
          localStorage.removeItem('adminAuthMethod')
          router.push('/admin-login')
        }
      } catch (error) {
        console.error('Admin auth check failed:', error)
        // Always require proper authentication - NO BYPASSES
        router.push('/admin-login')
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
            onClick={() => router.push('/customer-login?redirect=/admin-dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return <AdminMonitoringDashboard />
}