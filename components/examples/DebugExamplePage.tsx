'use client'
import { useState } from 'react'
import CheckoutButton from '../CheckoutButton'
import { DebugDashboard } from '../ui/DebugDashboard'
import { useDebugMode } from '../../lib/hooks/useDebugMode'
import { apiDebugger } from '../../lib/utils/api-debugger'

/**
 * Example page demonstrating all frontend debugging features
 * This component shows how to integrate debugging tools in a real application
 * 
 * Access this page with ?debug=true to see all debugging features
 * Example: http://localhost:3000/debug-example?debug=true
 */
export function DebugExamplePage() {
  const { 
    isDebugMode, 
    toggleDebugMode, 
    environmentValidation, 
    validatePaymentEnvironment 
  } = useDebugMode()
  
  const [selectedPlan, setSelectedPlan] = useState('growth')
  const [lastError, setLastError] = useState(null)
  const [lastSuccess, setLastSuccess] = useState(null)

  const handlePaymentSuccess = (data: any) => {
    setLastSuccess(data)
    setLastError(null)
    console.log('✅ Payment Success:', data)
    
    if (isDebugMode) {
      console.log('🔍 Debug Info:', {
        requestId: data._debug?.requestId,
        developmentMode: data.development_mode,
        sessionId: data.checkout_session?.id
      })
    }
  }

  const handlePaymentError = (error: any) => {
    setLastError(error)
    setLastSuccess(null)
    console.error('❌ Payment Error:', error)
    
    if (isDebugMode) {
      console.log('🔍 Error Debug Info:', {
        requestId: error.requestId,
        stripeCode: error.stripeCode,
        configurationErrors: error.configurationErrors,
        environmentIssues: error.environmentIssues
      })
    }
  }

  const testError = async () => {
    // Simulate an error for testing
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'invalid_plan', // This will cause a validation error
          user_email: 'test@example.com',
          user_id: 'test_user'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Test error')
      }
    } catch (error) {
      handlePaymentError(error)
    }
  }

  const runEnvironmentCheck = () => {
    const env = apiDebugger.validateEnvironment()
    const payment = validatePaymentEnvironment()
    
    console.group('🌍 Environment Check Results')
    console.log('General Environment:', env)
    console.log('Payment Environment:', payment)
    console.groupEnd()
    
    if (!env.isValid || !payment.isValid) {
      alert('Environment issues detected! Check console for details.')
    } else {
      alert('Environment validation passed!')
    }
  }

  const exportDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      environment: environmentValidation,
      apiLogs: apiDebugger.getDebugLogs(),
      summary: apiDebugger.getSummary(),
      paymentValidation: validatePaymentEnvironment(),
      lastError,
      lastSuccess,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-example-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔍 DirectoryBolt Debug Example
          </h1>
          <p className="text-secondary-400 text-lg">
            Comprehensive frontend debugging system demonstration
          </p>
          
          {/* Debug Mode Toggle */}
          <div className="mt-4">
            <button
              onClick={toggleDebugMode}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isDebugMode
                  ? 'bg-danger-500 text-white hover:bg-danger-400'
                  : 'bg-volt-500 text-secondary-900 hover:bg-volt-400'
              }`}
            >
              {isDebugMode ? '🔴 Disable Debug Mode' : '🟢 Enable Debug Mode'}
            </button>
          </div>
        </div>

        {/* Debug Dashboard */}
        {isDebugMode && (
          <DebugDashboard 
            className="mb-8"
            compact={false}
            autoHide={false}
          />
        )}

        {/* Environment Status */}
        <div className="bg-secondary-800/50 border border-secondary-600 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🌍 Environment Status</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-3">General Environment</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-400">Environment:</span>
                  <span className={`font-bold ${
                    environmentValidation.environment === 'development' 
                      ? 'text-warning-400' : 'text-success-400'
                  }`}>
                    {environmentValidation.environment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Valid:</span>
                  <span className={`font-bold ${
                    environmentValidation.isValid ? 'text-success-400' : 'text-danger-400'
                  }`}>
                    {environmentValidation.isValid ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Issues:</span>
                  <span className="text-secondary-300">
                    {environmentValidation.issues.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-400">Warnings:</span>
                  <span className="text-secondary-300">
                    {environmentValidation.warnings.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={runEnvironmentCheck}
                  className="w-full px-4 py-2 bg-info-500/20 text-info-400 border border-info-500/30 rounded hover:bg-info-500/30 transition-colors"
                >
                  🔍 Run Full Environment Check
                </button>
                <button
                  onClick={exportDebugInfo}
                  className="w-full px-4 py-2 bg-volt-500/20 text-volt-400 border border-volt-500/30 rounded hover:bg-volt-500/30 transition-colors"
                >
                  📥 Export Debug Data
                </button>
                <button
                  onClick={() => apiDebugger.clearLogs()}
                  className="w-full px-4 py-2 bg-danger-500/20 text-danger-400 border border-danger-500/30 rounded hover:bg-danger-500/30 transition-colors"
                >
                  🗑️ Clear API Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Testing */}
        <div className="bg-secondary-800/50 border border-secondary-600 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">💳 Payment Testing</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-3">Plan Selection</h3>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full p-3 bg-secondary-700 border border-secondary-600 rounded text-white focus:border-volt-500 focus:outline-none"
              >
                <option value="free">Free Plan</option>
                <option value="starter">Starter ($49/mo)</option>
                <option value="growth">Growth ($79/mo)</option>
                <option value="professional">Professional ($129/mo)</option>
                <option value="enterprise">Enterprise ($299/mo)</option>
              </select>
              
              <div className="mt-4 space-y-3">
                <CheckoutButton
                  plan={selectedPlan}
                  variant="primary"
                  size="lg"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  showDebugInfo={isDebugMode}
                  className="w-full"
                  successUrl="/success"
                  cancelUrl="/cancel"
                  children={`🚀 Test Checkout - ${selectedPlan}`}
                />
                
                <button
                  onClick={testError}
                  className="w-full px-4 py-3 bg-warning-500/20 text-warning-400 border border-warning-500/30 rounded hover:bg-warning-500/30 transition-colors font-bold"
                >
                  ⚠️ Test Error Handling
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-3">Last Result</h3>
              
              {lastSuccess && (
                <div className="bg-success-900/20 border border-success-500/30 p-4 rounded">
                  <h4 className="text-success-400 font-bold mb-2">✅ Last Success</h4>
                  <pre className="text-success-300 text-xs overflow-auto max-h-32">
                    {JSON.stringify(lastSuccess, null, 2)}
                  </pre>
                </div>
              )}
              
              {lastError && (
                <div className="bg-danger-900/20 border border-danger-500/30 p-4 rounded">
                  <h4 className="text-danger-400 font-bold mb-2">❌ Last Error</h4>
                  <div className="text-danger-300 text-sm space-y-1">
                    <div><strong>Message:</strong> {(lastError as any)?.message || 'Unknown error'}</div>
                    <div><strong>Type:</strong> {(lastError as any)?.type || 'Unknown type'}</div>
                    {(lastError as any)?.stripeCode && (
                      <div><strong>Stripe Code:</strong> {(lastError as any).stripeCode}</div>
                    )}
                    {(lastError as any)?.requestId && (
                      <div><strong>Request ID:</strong> {(lastError as any).requestId}</div>
                    )}
                  </div>
                  
                  {isDebugMode && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-danger-400 font-medium">
                        Full Error Object
                      </summary>
                      <pre className="text-danger-300 text-xs overflow-auto max-h-32 mt-2">
                        {JSON.stringify(lastError, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {!lastSuccess && !lastError && (
                <div className="bg-secondary-700/30 border border-secondary-600/30 p-4 rounded text-center">
                  <span className="text-secondary-400">No recent results</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Instructions */}
        <div className="bg-secondary-800/50 border border-secondary-600 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📚 Debug Instructions</h2>
          
          <div className="space-y-4 text-secondary-300">
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-2">How to Use This Demo</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Enable debug mode using the toggle above</li>
                <li>Open browser developer console (F12)</li>
                <li>Select a plan and click "Test Checkout"</li>
                <li>Observe debug logs in console and debug dashboard</li>
                <li>Try "Test Error Handling" to see error debugging</li>
                <li>Export debug data for support tickets</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-2">Console Commands</h3>
              <div className="bg-secondary-900/50 p-3 rounded font-mono text-xs space-y-1">
                <div className="text-volt-400">apiDebugger.getSummary()</div>
                <div className="text-secondary-400">// View API call statistics</div>
                
                <div className="text-volt-400">apiDebugger.getDebugLogs()</div>
                <div className="text-secondary-400">// View all logged API calls</div>
                
                <div className="text-volt-400">apiDebugger.exportLogs()</div>
                <div className="text-secondary-400">// Export logs as JSON string</div>
                
                <div className="text-volt-400">apiDebugger.validateEnvironment()</div>
                <div className="text-secondary-400">// Check environment configuration</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-200 mb-2">Expected Behaviors</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Development Mode:</strong> Mock responses, detailed logging</li>
                <li><strong>Free/Enterprise Plans:</strong> Special handling (no Stripe checkout)</li>
                <li><strong>Paid Plans:</strong> Full Stripe integration with debug info</li>
                <li><strong>Error Testing:</strong> Demonstrates enhanced error parsing</li>
                <li><strong>Environment Issues:</strong> Warnings about HTTPS, debug mode, etc.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-secondary-500 text-sm">
          <p>
            This is a demonstration of DirectoryBolt's comprehensive frontend debugging system.
            <br />
            For more information, see <code>FRONTEND_DEBUGGING_GUIDE.md</code>
          </p>
        </div>
        
      </div>
    </div>
  )
}

export default DebugExamplePage