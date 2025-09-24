import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [useApiKey, setUseApiKey] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let response
      
      if (useApiKey) {
        // Use API key authentication
        response = await fetch('/api/admin/auth-check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        })
      } else {
        // Use basic authentication
        const credentials = btoa(`${username}:${password}`)
        response = await fetch('/api/admin/auth-check', {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        })
      }

      if (response.ok) {
        // Store auth method in localStorage for dashboard to use
        if (useApiKey) {
          localStorage.setItem('adminAuth', apiKey)
          localStorage.setItem('adminAuthMethod', 'bearer')
        } else {
          localStorage.setItem('adminAuth', btoa(`${username}:${password}`))
          localStorage.setItem('adminAuthMethod', 'basic')
        }
        
        // Redirect to admin dashboard
        router.push('/admin-dashboard')
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login - DirectoryBolt</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Dashboard Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in with your admin credentials
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useApiKey}
                    onChange={(e) => setUseApiKey(e.target.checked)}
                    className="mr-2"
                  />
                  Use API Key instead
                </label>
              </div>

              {useApiKey ? (
                <div>
                  <label htmlFor="api-key" className="sr-only">API Key</label>
                  <input
                    id="api-key"
                    name="api-key"
                    type="password"
                    required
                    className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Default: DirectoryBolt-Admin-2025-SecureKey
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Default: admin / DirectoryBolt2025!
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <a href="/staff-login" className="text-sm text-indigo-600 hover:text-indigo-500 block">
                Staff Login →
              </a>
              <a href="/customer-login" className="text-sm text-indigo-600 hover:text-indigo-500 block">
                Customer Login →
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}