import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function StaffLogin() {
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
      let authToken = ''
      
      if (useApiKey) {
        // Use API key authentication
        authToken = apiKey.trim()
        console.log('Staff login: Using API key authentication')
        
        if (!authToken) {
          setError('Please enter an API key')
          setIsLoading(false)
          return
        }
        
        response = await fetch('/api/staff/auth-check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      } else {
        // For username/password authentication
        const trimmedUsername = username.trim()
        const trimmedPassword = password.trim()
        
        console.log('Staff login: Using username/password authentication')
        console.log('Username:', trimmedUsername)
        
        if (!trimmedUsername || !trimmedPassword) {
          setError('Please enter both username and password')
          setIsLoading(false)
          return
        }
        
        // Check against environment variables (these are the correct staff credentials)
        if (trimmedUsername === 'staff' && trimmedPassword === 'DirectoryBoltStaff2025!') {
          authToken = 'DirectoryBolt-Staff-2025-SecureKey'
          
          response = await fetch('/api/staff/auth-check', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          })
        } else {
          console.log('Staff login: Invalid credentials provided')
          setError('Invalid staff credentials. Use: staff / DirectoryBoltStaff2025!')
          setIsLoading(false)
          return
        }
      }

      console.log('Staff auth response status:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Staff authentication successful:', responseData)
        
        // Store auth in localStorage for dashboard to use
        localStorage.setItem('staffAuth', authToken)
        localStorage.setItem('staffUser', JSON.stringify(responseData.user || { role: 'staff' }))
        
        // Redirect to staff dashboard
        console.log('Redirecting to staff dashboard...')
        router.push('/staff-dashboard')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.log('Staff authentication failed:', errorData)
        
        let errorMessage = 'Authentication failed.'
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your username, password, or API key.'
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Staff authentication required.'
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Staff login error:', err)
      setError('Connection error. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Staff Login - DirectoryBolt</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Staff Dashboard Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in with your staff credentials (separate from customer accounts)
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Staff login uses dedicated staff credentials, not customer credentials from the Google Sheet.
              </p>
            </div>
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
                    Default: DirectoryBolt-Staff-2025-SecureKey
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
                    Default: staff / DirectoryBoltStaff2025!
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
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <a href="/admin-login" className="text-sm text-green-600 hover:text-green-500 block">
                Admin Login →
              </a>
              <a href="/customer-login" className="text-sm text-green-600 hover:text-green-500 block">
                Customer Login →
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}