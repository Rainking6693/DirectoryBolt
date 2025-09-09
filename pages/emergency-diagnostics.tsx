import { useState, useEffect } from 'react'
import Head from 'next/head'

interface SystemStatus {
  timestamp: string
  environment: string
  environment_variables: {
    stripe: {
      secret_key: boolean
      secret_key_format: boolean
      publishable_key: boolean
      webhook_secret: boolean
      starter_price: boolean
      growth_price: boolean
      professional_price: boolean
      enterprise_price: boolean
    }
    airtable: {
      access_token: boolean
      api_key: boolean
      base_id: boolean
      table_name: boolean
    }
    ai: {
      openai_key: boolean
      anthropic_key: boolean
    }
    urls: {
      nextauth_url: string
      base_url: string
      app_url: string
    }
  }
  api_endpoints: {
    payment_configured: boolean
    extension_validation: boolean
    airtable_connection: boolean
  }
  critical_issues: string[]
  warnings: string[]
  recommendations: string[]
}

export default function EmergencyDiagnostics() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system-status')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testPaymentSystem = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'starter',
          successUrl: 'https://directorybolt.com/success',
          cancelUrl: 'https://directorybolt.com/cancel'
        })
      })
      
      const data = await response.json()
      alert(`Payment Test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      alert(`Payment Test FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const testExtensionAuth = async () => {
    try {
      const response = await fetch('/api/extension/validate-fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'DB-2025-TEST01',
          extensionVersion: '1.0.0',
          timestamp: Date.now()
        })
      })
      
      const data = await response.json()
      alert(`Extension Test: ${response.ok && data.valid ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      alert(`Extension Test FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const createTestCustomers = async () => {
    try {
      const response = await fetch('/api/extension/create-test-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      alert(`Test Customers: ${response.ok && data.success ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      alert(`Test Customers FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading system diagnostics...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>🚨 DirectoryBolt Emergency Diagnostics</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              🚨 DirectoryBolt Emergency Diagnostics
            </h1>
            <p className="text-gray-300">
              Critical system status and configuration diagnostics
            </p>
            <button
              onClick={fetchSystemStatus}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Refresh Status
            </button>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-red-400 mb-2">System Status Check Failed</h2>
              <p className="text-red-300">{error}</p>
              <p className="text-gray-400 mt-2">
                This indicates a critical deployment issue. The system status API is not responding.
              </p>
            </div>
          )}

          {status && (
            <>
              {/* Critical Issues */}
              {status.critical_issues.length > 0 && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Critical Issues</h2>
                  <ul className="space-y-2">
                    {status.critical_issues.map((issue, index) => (
                      <li key={index} className="text-red-300">❌ {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {status.warnings.length > 0 && (
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Warnings</h2>
                  <ul className="space-y-2">
                    {status.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-300">⚠️ {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* System Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-lg border ${
                  status.api_endpoints.payment_configured 
                    ? 'bg-green-900 border-green-700' 
                    : 'bg-red-900 border-red-700'
                }`}>
                  <h3 className="text-lg font-bold mb-2">Payment System</h3>
                  <p className={status.api_endpoints.payment_configured ? 'text-green-300' : 'text-red-300'}>
                    {status.api_endpoints.payment_configured ? '✅ Configured' : '❌ Not Configured'}
                  </p>
                  <button
                    onClick={testPaymentSystem}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    Test Payment
                  </button>
                </div>

                <div className={`p-6 rounded-lg border ${
                  status.api_endpoints.extension_validation 
                    ? 'bg-green-900 border-green-700' 
                    : 'bg-red-900 border-red-700'
                }`}>
                  <h3 className="text-lg font-bold mb-2">Extension Auth</h3>
                  <p className={status.api_endpoints.extension_validation ? 'text-green-300' : 'text-red-300'}>
                    {status.api_endpoints.extension_validation ? '✅ Working' : '❌ Broken'}
                  </p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={createTestCustomers}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                    >
                      Create Test Data
                    </button>
                    <button
                      onClick={testExtensionAuth}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Test Auth
                    </button>
                  </div>
                </div>

                <div className={`p-6 rounded-lg border ${
                  status.api_endpoints.airtable_connection 
                    ? 'bg-green-900 border-green-700' 
                    : 'bg-red-900 border-red-700'
                }`}>
                  <h3 className="text-lg font-bold mb-2">Database</h3>
                  <p className={status.api_endpoints.airtable_connection ? 'text-green-300' : 'text-red-300'}>
                    {status.api_endpoints.airtable_connection ? '✅ Connected' : '❌ Disconnected'}
                  </p>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-300 mb-4">Environment Variables</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Stripe Configuration</h3>
                    <ul className="space-y-1 text-sm">
                      <li className={status.environment_variables.stripe.secret_key ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.stripe.secret_key ? '✅' : '❌'} Secret Key
                      </li>
                      <li className={status.environment_variables.stripe.secret_key_format ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.stripe.secret_key_format ? '✅' : '❌'} Valid Format
                      </li>
                      <li className={status.environment_variables.stripe.starter_price ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.stripe.starter_price ? '✅' : '❌'} Starter Price
                      </li>
                      <li className={status.environment_variables.stripe.growth_price ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.stripe.growth_price ? '✅' : '❌'} Growth Price
                      </li>
                      <li className={status.environment_variables.stripe.professional_price ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.stripe.professional_price ? '✅' : '❌'} Professional Price
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">Airtable Configuration</h3>
                    <ul className="space-y-1 text-sm">
                      <li className={status.environment_variables.airtable.access_token ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.airtable.access_token ? '✅' : '❌'} Access Token
                      </li>
                      <li className={status.environment_variables.airtable.base_id ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.airtable.base_id ? '✅' : '❌'} Base ID
                      </li>
                      <li className={status.environment_variables.airtable.table_name ? 'text-green-400' : 'text-red-400'}>
                        {status.environment_variables.airtable.table_name ? '✅' : '❌'} Table Name
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {status.recommendations.length > 0 && (
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-blue-400 mb-4">🔧 Immediate Actions Required</h2>
                  <ol className="space-y-2 list-decimal list-inside">
                    {status.recommendations.map((rec, index) => (
                      <li key={index} className="text-blue-300">{rec}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          {/* Manual Tests */}
          <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Manual System Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={testPaymentSystem}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Test Payment System
              </button>
              <button
                onClick={createTestCustomers}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
              >
                Create Test Customers
              </button>
              <button
                onClick={testExtensionAuth}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Test Extension Auth
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            Last updated: {status?.timestamp || 'Unknown'}
          </div>
        </div>
      </div>
    </>
  )
}