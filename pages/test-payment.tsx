// Test Payment Integration Page - For testing and debugging payment flow
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../components/layout/Layout'
import CheckoutButton, { StartTrialButton, UpgradeButton } from '../components/CheckoutButton'
import { PaymentStatusDisplay, PaymentStatusBadge } from '../components/ui/PaymentStatusDisplay'
import { useStripeConfig } from '../lib/hooks/useStripeConfig'
import { getStripeClientConfig, logStripeClientConfig } from '../lib/utils/stripe-client-config'

export default function TestPaymentPage() {
  const { config, isConfigured, isLoading, configurationMessage, refreshConfig, logConfig } = useStripeConfig()
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    // Enable debug mode for this test page
    setDebugMode(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('directorybolt_debug', 'true')
    }
  }, [])

  const handleTestLog = () => {
    console.group('🧪 Payment Integration Test')
    console.log('Stripe Config:', getStripeClientConfig())
    console.log('Environment Variables:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...'
    })
    logStripeClientConfig()
    console.groupEnd()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-4xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold text-white mb-2">Loading Payment Configuration...</h1>
            <p className="text-secondary-400">Validating Stripe integration</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 py-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              🧪 Payment Integration Test
            </h1>
            <p className="text-secondary-300 text-lg">
              Testing and debugging the payment system integration
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <PaymentStatusBadge />
              <button
                onClick={handleTestLog}
                className="px-4 py-2 bg-info-500/20 text-info-400 rounded border border-info-500/30 hover:bg-info-500/30 transition-colors"
              >
                🔍 Log Config
              </button>
              <button
                onClick={refreshConfig}
                className="px-4 py-2 bg-volt-500/20 text-volt-400 rounded border border-volt-500/30 hover:bg-volt-500/30 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Configuration Status</h2>
            <PaymentStatusDisplay 
              showDebugInfo={true}
              className="mb-6"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary-800/50 p-4 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Environment</h3>
                <div className="space-y-1 text-sm text-secondary-300">
                  <div>NODE_ENV: <span className="font-mono">{process.env.NODE_ENV}</span></div>
                  <div>Configured: <span className={isConfigured ? 'text-success-400' : 'text-danger-400'}>{isConfigured ? 'Yes' : 'No'}</span></div>
                  <div>Test Mode: <span className="text-warning-400">{config?.isTestMode ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
              
              <div className="bg-secondary-800/50 p-4 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Keys</h3>
                <div className="space-y-1 text-sm text-secondary-300">
                  <div>
                    Publishable Key: 
                    <span className="font-mono ml-2">
                      {config?.publishableKey ? config.publishableKey.substring(0, 12) + '...' : 'Not set'}
                    </span>
                  </div>
                  <div>
                    Errors: 
                    <span className={`ml-2 ${config?.configurationErrors.length ? 'text-danger-400' : 'text-success-400'}`}>
                      {config?.configurationErrors.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Test Payment Buttons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Free Plan */}
              <div className="bg-secondary-800/50 p-6 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Free Plan</h3>
                <p className="text-secondary-400 text-sm mb-4">Should redirect to analysis page</p>
                <CheckoutButton
                  plan="free"
                  variant="outline"
                  size="md"
                  showDebugInfo={true}
                  className="w-full"
                >
                  Get Started Free
                </CheckoutButton>
              </div>

              {/* Starter Plan */}
              <div className="bg-secondary-800/50 p-6 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Starter Plan</h3>
                <p className="text-secondary-400 text-sm mb-4">Should create checkout session</p>
                <CheckoutButton
                  plan="starter"
                  variant="primary"
                  size="md"
                  showDebugInfo={true}
                  className="w-full"
                >
                  Start Trial
                </CheckoutButton>
              </div>

              {/* Growth Plan */}
              <div className="bg-secondary-800/50 p-6 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Growth Plan</h3>
                <p className="text-secondary-400 text-sm mb-4">Should create checkout session</p>
                <StartTrialButton 
                  plan="growth"
                  showDebugInfo={true}
                  className="w-full"
                />
              </div>

              {/* Professional Plan */}
              <div className="bg-secondary-800/50 p-6 rounded-lg border border-secondary-600/30">
                <h3 className="font-medium text-white mb-2">Professional Plan</h3>
                <p className="text-secondary-400 text-sm mb-4">Should create checkout session</p>
                <UpgradeButton
                  plan="professional"
                  showDebugInfo={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Configuration Errors */}
          {config?.configurationErrors && config.configurationErrors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Configuration Issues</h2>
              <div className="bg-warning-900/20 border border-warning-500/30 p-4 rounded-lg">
                <ul className="text-warning-300 space-y-2">
                  {config.configurationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-warning-400 mt-1">⚠️</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Debug Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Debug Information</h2>
            <div className="bg-secondary-800/50 p-4 rounded-lg border border-secondary-600/30">
              <pre className="text-secondary-300 text-sm overflow-auto max-h-64">
{JSON.stringify({
  config,
  configurationMessage,
  environment: {
    NODE_ENV: process.env.NODE_ENV,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyPreview: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A'
  }
}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Testing Instructions</h2>
            <div className="text-left max-w-2xl mx-auto bg-secondary-800/50 p-6 rounded-lg border border-secondary-600/30">
              <ol className="text-secondary-300 space-y-2">
                <li>1. <strong>Check configuration status</strong> - Should show current Stripe setup</li>
                <li>2. <strong>Test Free Plan</strong> - Should redirect without Stripe interaction</li>
                <li>3. <strong>Test Paid Plans</strong> - Should show appropriate error/success messages</li>
                <li>4. <strong>Check Console</strong> - Debug logs should show detailed information</li>
                <li>5. <strong>Verify Errors</strong> - Configuration issues should be clearly displayed</li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-volt-500/20 text-volt-400 rounded-lg border border-volt-500/30 hover:bg-volt-500/30 transition-colors"
            >
              ← Back to Pricing Page
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}