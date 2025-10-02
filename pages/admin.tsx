import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/layout/Layout'

interface AdminUser {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  permissions: Record<string, boolean>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const apiKey = localStorage.getItem('admin_api_key')
      
      if (!apiKey) {
        router.push('/admin-login')
        return
      }

      const response = await fetch('/api/admin/auth-check', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.user)
        } else {
          localStorage.removeItem('admin_api_key')
          router.push('/admin-login')
        }
      } else {
        localStorage.removeItem('admin_api_key')
        router.push('/admin-login')
      }
    } catch (err) {
      console.error('Admin auth check error:', err)
      setError('Failed to verify authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_api_key')
    router.push('/admin-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500 mx-auto mb-4"></div>
          <p className="text-secondary-300">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin-login')}
            className="bg-volt-500 text-secondary-900 px-4 py-2 rounded-md hover:bg-volt-400"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - DirectoryBolt</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout title="Admin Dashboard - DirectoryBolt" description="Admin dashboard for DirectoryBolt">
        <div className="min-h-screen bg-secondary-900">
          {/* Header */}
          <header className="bg-secondary-800 border-b border-secondary-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-white flex items-center">
                  🔒 Admin Dashboard
                </h1>
                <div className="flex items-center space-x-4">
                  <span className="text-secondary-300">Welcome, {user?.first_name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-secondary-400 hover:text-red-400 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System Status */}
              <div className="bg-secondary-800 border border-secondary-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🖥️ System Status</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-secondary-300">Status:</span>
                    <span className="text-green-400 font-bold">Operational</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-300">Uptime:</span>
                    <span className="text-white">99.9%</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-secondary-800 border border-secondary-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
                <div className="space-y-2">
                  <a href="/api/admin/config-check" target="_blank" className="block text-volt-400 hover:text-volt-300">
                    → Config Check
                  </a>
                  <a href="/staff-dashboard" className="block text-volt-400 hover:text-volt-300">
                    → Staff Dashboard
                  </a>
                  <a href="/api/health/comprehensive" target="_blank" className="block text-volt-400 hover:text-volt-300">
                    → Health Check
                  </a>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-secondary-800 border border-secondary-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">👤 Admin Info</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-secondary-300">Role:</span>
                    <span className="text-volt-400 font-bold">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-300">Email:</span>
                    <span className="text-white text-sm">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {user?.permissions && (
              <div className="mt-6 bg-secondary-800 border border-secondary-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🔑 Permissions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(user.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className={value ? 'text-green-400' : 'text-red-400'}>
                        {value ? '✅' : '❌'}
                      </span>
                      <span className="text-secondary-300 capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notice */}
            <div className="mt-6 bg-volt-500/10 border border-volt-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-volt-400 mb-2">📋 Admin Dashboard</h3>
              <p className="text-secondary-300">
                This is the admin dashboard. More features coming soon:
              </p>
              <ul className="mt-4 space-y-2 text-secondary-400">
                <li>• User management</li>
                <li>• System configuration</li>
                <li>• Analytics and reporting</li>
                <li>• API key management</li>
                <li>• Audit logs</li>
              </ul>
              <p className="mt-4 text-sm text-secondary-500">
                For now, use the <a href="/staff-dashboard" className="text-volt-400 hover:underline">Staff Dashboard</a> for queue and processing management.
              </p>
            </div>
          </main>
        </div>
      </Layout>
    </>
  )
}

