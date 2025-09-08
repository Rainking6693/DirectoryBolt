import { useState } from 'react'
import Head from 'next/head'

export default function ExtensionTest() {
  const [createResult, setCreateResult] = useState<any>(null)
  const [validateResult, setValidateResult] = useState<any>(null)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [customerId, setCustomerId] = useState('DB-2025-TEST01')
  const [loading, setLoading] = useState<string | null>(null)

  const createTestCustomers = async () => {
    setLoading('create')
    try {
      const response = await fetch('/api/extension/create-test-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setCreateResult(data)
    } catch (error) {
      setCreateResult({ error: error instanceof Error ? error.message : String(error) })
    }
    setLoading(null)
  }

  const testValidation = async () => {
    setLoading('validate')
    try {
      const response = await fetch('/api/extension/validate-fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          extensionVersion: '1.0.0',
          timestamp: Date.now()
        })
      })
      const data = await response.json()
      setValidateResult(data)
    } catch (error) {
      setValidateResult({ error: error instanceof Error ? error.message : String(error) })
    }
    setLoading(null)
  }

  const testDebug = async () => {
    setLoading('debug')
    try {
      const response = await fetch('/api/extension/debug-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId })
      })
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({ error: error instanceof Error ? error.message : String(error) })
    }
    setLoading(null)
  }

  return (
    <>
      <Head>
        <title>DirectoryBolt Extension Testing</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              🧪 DirectoryBolt Extension Testing
            </h1>
            
            <div className="space-y-8">
              {/* Step 1: Create Test Customers */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Step 1: Create Test Customers</h2>
                <p className="text-gray-600 mb-4">
                  Create test customers with DB prefixes in the database.
                </p>
                <button
                  onClick={createTestCustomers}
                  disabled={loading === 'create'}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading === 'create' ? 'Creating...' : 'Create Test Customers'}
                </button>
                
                {createResult && (
                  <div className="mt-4 p-4 bg-gray-100 rounded">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(createResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Step 2: Test Validation */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Step 2: Test Validation API</h2>
                <p className="text-gray-600 mb-4">
                  Test the validation API with different customer ID formats.
                </p>
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    placeholder="Customer ID"
                  />
                  <button
                    onClick={testValidation}
                    disabled={loading === 'validate'}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading === 'validate' ? 'Testing...' : 'Test Validation'}
                  </button>
                </div>
                
                {validateResult && (
                  <div className={`mt-4 p-4 rounded ${
                    validateResult.valid ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                  }`}>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(validateResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Step 3: Debug Information */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Step 3: Debug Information</h2>
                <p className="text-gray-600 mb-4">
                  Get detailed debugging information about the validation process.
                </p>
                <button
                  onClick={testDebug}
                  disabled={loading === 'debug'}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading === 'debug' ? 'Getting Debug Info...' : 'Get Debug Info'}
                </button>
                
                {debugResult && (
                  <div className="mt-4 p-4 bg-gray-100 rounded">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(debugResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Extension Instructions */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-900">
                  🔧 Extension Testing Instructions
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li><strong>Install Extension:</strong> Load the DirectoryBolt extension in Chrome</li>
                  <li><strong>Open Extension:</strong> Click the extension icon in Chrome toolbar</li>
                  <li><strong>Enter Customer ID:</strong> Use <code className="bg-blue-200 px-1 rounded">DB-2025-TEST01</code> or <code className="bg-blue-200 px-1 rounded">db-2025-test01</code></li>
                  <li><strong>Click Authenticate:</strong> Should show "DB Test Business" and "Growth" package</li>
                  <li><strong>Check Console:</strong> Open Chrome DevTools to see detailed logs</li>
                </ol>
              </div>

              {/* Test Variations */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Test Customer ID Variations</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'DB-2025-TEST01',
                    'db-2025-test01',
                    ' DB-2025-TEST01 ',
                    'DB-2025-TEST02',
                    'DIR-2025-TEST03'
                  ].map((id) => (
                    <button
                      key={id}
                      onClick={() => setCustomerId(id)}
                      className="text-left p-3 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <code className="text-sm">{id}</code>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}