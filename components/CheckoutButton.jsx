'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCheckout } from '../lib/hooks/useApiCall'
import { ErrorDisplay } from './ui/ErrorDisplay'
import { StripeErrorDisplay } from './ui/StripeErrorDisplay'
import { SuccessState } from './ui/SuccessState'
import { PaymentStatusDisplay } from './ui/PaymentStatusDisplay'
import { apiDebugger } from '../lib/utils/api-debugger'
import { getStripeClientConfig, isStripeConfigured, getStripeConfigurationMessage } from '../lib/utils/stripe-client-config'

const CheckoutButton = ({
  plan = 'starter',
  children = 'Start Free Trial',
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  successUrl,
  cancelUrl,
  onSuccess,
  onError,
  showDebugInfo = false,
  ...props
}) => {
  const router = useRouter()
  const { createCheckoutSession, loading: isLoading, error, reset } = useCheckout()
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [requestPayload, setRequestPayload] = useState(null)
  const [responseData, setResponseData] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [stripeConfigured, setStripeConfigured] = useState(null)
  const [configurationStatus, setConfigurationStatus] = useState(null)
  
  // Check for debug mode and Stripe configuration on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const debugParam = urlParams.get('debug')
      const debugStorage = localStorage.getItem('directorybolt_debug')
      setDebugMode(debugParam === 'true' || debugStorage === 'true' || apiDebugger.isDebugMode())
      
      // Check Stripe configuration
      const configured = isStripeConfigured()
      const status = getStripeConfigurationMessage()
      setStripeConfigured(configured)
      setConfigurationStatus(status)
      
      if (debugMode) {
        console.log('🔒 Stripe Configuration Check:', {
          configured,
          status,
          config: getStripeClientConfig()
        })
      }
    }
  }, [debugMode])

  const handleCheckout = async () => {
    if (disabled || isLoading) return

    // Reset any previous errors and debug data
    reset()
    setShowError(false)
    setShowSuccess(false)
    setValidationErrors([])
    setRequestPayload(null)
    setResponseData(null)
    
    // Client-side validation
    const validation = validateCheckoutRequest(plan, stripeConfigured, configurationStatus)
    if (validation.errors.length > 0) {
      setValidationErrors(validation.errors)
      setShowError(true)
      return
    }
    
    if (debugMode) {
      console.group('🔍 DirectoryBolt Checkout Debug')
      console.log('Plan:', plan)
      console.log('Environment Check:', apiDebugger.validateEnvironment())
      console.log('Debug Mode:', debugMode)
      console.groupEnd()
    }

    // Handle free plan - redirect to analysis
    if (plan === 'free') {
      router.push('/analyze')
      return
    }

    // Handle enterprise plan - open email
    if (plan === 'enterprise') {
      window.open('mailto:sales@directorybolt.com?subject=Enterprise Plan Inquiry', '_blank')
      return
    }

    try {
      const checkoutPayload = {
        user_email: `user@example.com`, // In real app, get from auth
        user_id: `user_${Date.now()}`, // In real app, get from auth
        success_url: successUrl || `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${window.location.origin}/pricing?cancelled=true`
      }
      
      // Store payload for debugging
      setRequestPayload(checkoutPayload)
      
      if (debugMode) {
        console.log('🚀 Starting checkout session creation...', {
          plan,
          payload: checkoutPayload,
          timestamp: new Date().toISOString()
        })
      }
      
      const data = await createCheckoutSession(plan, checkoutPayload)
      
      // Store response for debugging
      setResponseData(data)
      
      if (debugMode) {
        console.log('✅ Checkout session created successfully:', {
          sessionId: data.checkout_session?.id,
          hasUrl: !!data.checkout_session?.url,
          developmentMode: data.development_mode,
          requestId: data._debug?.requestId
        })
      }
      
      if (data?.checkout_session?.url) {
        // Show success state briefly before redirect
        setShowSuccess(true)
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data)
        }
        
        // Small delay to show success state, then redirect
        setTimeout(() => {
          window.location.href = data.checkout_session.url
        }, 1500)
      } else {
        throw new Error('Invalid checkout session response')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      
      // Store error response data for debugging
      if (err.responseData) {
        setResponseData(err.responseData)
      }
      
      if (debugMode) {
        console.group('❌ Checkout Error Debug')
        console.error('Error:', err)
        console.log('Request ID:', err.requestId)
        console.log('Request Payload:', requestPayload)
        console.log('Response Data:', err.responseData)
        console.log('Status Code:', err.statusCode)
        console.groupEnd()
      }
      
      setShowError(true)
      
      // Call error callback if provided
      if (onError) {
        onError(error || err)
      }
    }
  }

  const handleRetryCheckout = () => {
    setShowError(false)
    handleCheckout()
  }

  const handleDismissError = () => {
    setShowError(false)
    reset()
  }

  // Define button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-volt-500 focus:ring-offset-2 focus:ring-offset-secondary-900'
    
    const variants = {
      primary: 'bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 hover:from-volt-400 hover:to-volt-500 shadow-2xl hover:shadow-volt-500/50 animate-glow',
      secondary: 'border-2 border-volt-500 text-volt-500 bg-transparent hover:bg-volt-500 hover:text-secondary-900',
      outline: 'border border-secondary-600 text-white bg-secondary-800 hover:bg-secondary-700 hover:border-secondary-500',
      ghost: 'text-volt-400 hover:text-volt-300 hover:bg-volt-500/10',
      danger: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-400 hover:to-danger-500'
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl'
    }
    
    const disabledStyles = disabled || isLoading 
      ? 'opacity-75 cursor-not-allowed transform-none hover:scale-100' 
      : ''
    
    return `${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`
  }

  // Show success state
  if (showSuccess) {
    return (
      <SuccessState
        title="Checkout Session Created!"
        message="Redirecting you to secure payment..."
        icon="🚀"
        compact={true}
        className="animate-zoom-in"
      />
    )
  }

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={disabled || isLoading}
        className={getButtonStyles()}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
            <span>Creating checkout...</span>
          </div>
        ) : (
          <>
            {children}
            {plan !== 'free' && plan !== 'enterprise' && (
              <span className="ml-2">🚀</span>
            )}
          </>
        )}
      </button>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4">
          <div className="bg-warning-900/20 border border-warning-500/30 p-3 rounded-lg">
            <h4 className="text-warning-400 font-medium mb-2">⚠️ Validation Issues</h4>
            <ul className="text-warning-300 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {showError && error && (
        <div className="mt-4">
          {/* Use StripeErrorDisplay for payment errors, fallback to regular ErrorDisplay */}
          {error.type === 'payment' || error.requestId ? (
            <StripeErrorDisplay
              error={error}
              onRetry={handleRetryCheckout}
              onDismiss={handleDismissError}
              compact={true}
              showDebugInfo={debugMode || showDebugInfo}
              requestPayload={requestPayload}
              responseData={responseData}
            />
          ) : (
            <ErrorDisplay
              error={error}
              onRetry={handleRetryCheckout}
              onDismiss={handleDismissError}
              compact={true}
            />
          )}
        </div>
      )}
      
      {/* Payment Configuration Status */}
      {configurationStatus && !configurationStatus.isConfigured && (
        <div className="mt-4">
          <PaymentStatusDisplay
            showDebugInfo={debugMode || showDebugInfo}
            compact={false}
          />
        </div>
      )}
      
      {/* Debug Panel */}
      {debugMode && (
        <div className="mt-4">
          <DebugPanel 
            plan={plan}
            requestPayload={requestPayload}
            responseData={responseData}
            error={error}
            apiLogs={apiDebugger.getDebugLogs({ url: 'create-checkout-session' }).slice(0, 3)}
          />
        </div>
      )}
    </>
  )
}

// Preset button components for common use cases
export const StartTrialButton = ({ plan = 'growth', ...props }) => (
  <CheckoutButton
    plan={plan}
    variant="primary"
    size="lg"
    {...props}
  >
    Start Free Trial
  </CheckoutButton>
)

export const UpgradeButton = ({ plan = 'professional', size = 'md', ...props }) => (
  <CheckoutButton
    plan={plan}
    variant="primary"
    size={size}
    {...props}
  >
    Upgrade Now
  </CheckoutButton>
)

export const GetStartedButton = ({ plan = 'free', ...props }) => (
  <CheckoutButton
    plan={plan}
    variant="secondary"
    size="lg"
    {...props}
  >
    Get Started Free
  </CheckoutButton>
)

export const ContactSalesButton = ({ ...props }) => (
  <CheckoutButton
    plan="enterprise"
    variant="outline"
    size="md"
    {...props}
  >
    Contact Sales
  </CheckoutButton>
)

// Upgrade prompt button with built-in messaging
export const UpgradePromptButton = ({ 
  currentPlan = 'free',
  requiredPlan = 'starter',
  feature = 'this feature',
  ...props 
}) => {
  const getUpgradeMessage = () => {
    if (currentPlan === 'free') {
      return `Upgrade to ${requiredPlan} to unlock ${feature}`
    }
    return `Upgrade to ${requiredPlan} for ${feature}`
  }

  return (
    <div className="text-center py-4">
      <p className="text-secondary-400 text-sm mb-4">
        {getUpgradeMessage()}
      </p>
      <CheckoutButton
        plan={requiredPlan}
        variant="primary"
        size="sm"
        {...props}
      >
        Upgrade to {requiredPlan}
      </CheckoutButton>
    </div>
  )
}

// Client-side validation function
function validateCheckoutRequest(plan, stripeConfigured, configurationStatus) {
  const errors = []
  
  const validPlans = ['free', 'starter', 'growth', 'professional', 'enterprise']
  if (!validPlans.includes(plan)) {
    errors.push(`Invalid plan "${plan}". Valid plans are: ${validPlans.join(', ')}`)
  }
  
  // Skip Stripe validation for free and enterprise plans
  if (plan === 'free' || plan === 'enterprise') {
    return { errors }
  }
  
  // Stripe configuration validation
  if (stripeConfigured === false && configurationStatus) {
    if (configurationStatus.type === 'error') {
      errors.push(configurationStatus.message)
    } else if (configurationStatus.type === 'warning' && process.env.NODE_ENV === 'production') {
      errors.push('Payment system is not properly configured for production')
    }
  }
  
  // Environment validations
  if (typeof window !== 'undefined') {
    // Check if running on localhost without HTTPS (for production builds)
    if (window.location.protocol !== 'https:' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
      errors.push('Checkout requires HTTPS in production')
    }
  }
  
  return { errors }
}

// Debug Panel Component
function DebugPanel({ plan, requestPayload, responseData, error, apiLogs }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-secondary-800/50 border border-secondary-600/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left flex items-center justify-between text-secondary-300 hover:text-secondary-200"
      >
        <span className="font-medium flex items-center gap-2">
          🔍 Debug Information
          <span className="text-xs bg-volt-500/20 text-volt-400 px-2 py-1 rounded">DEV</span>
        </span>
        <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Environment Info */}
          <div>
            <h5 className="text-xs font-medium text-secondary-400 mb-1">Environment:</h5>
            <div className="text-xs bg-secondary-900/50 p-2 rounded">
              <div className="grid grid-cols-2 gap-2 text-secondary-300">
                <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                <div>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
                <div>Debug Mode: {apiDebugger.isDebugMode() ? 'Enabled' : 'Disabled'}</div>
                <div>Plan: {plan}</div>
              </div>
            </div>
          </div>
          
          {/* Request Payload */}
          {requestPayload && (
            <div>
              <h5 className="text-xs font-medium text-secondary-400 mb-1">Request Payload:</h5>
              <pre className="text-xs bg-secondary-900/50 p-2 rounded font-mono text-secondary-300 overflow-auto max-h-32">
                {JSON.stringify(requestPayload, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Response Data */}
          {responseData && (
            <div>
              <h5 className="text-xs font-medium text-secondary-400 mb-1">Response Data:</h5>
              <pre className="text-xs bg-secondary-900/50 p-2 rounded font-mono text-secondary-300 overflow-auto max-h-32">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Error Details */}
          {error && (
            <div>
              <h5 className="text-xs font-medium text-danger-400 mb-1">Error Details:</h5>
              <pre className="text-xs bg-secondary-900/50 p-2 rounded font-mono text-danger-300 overflow-auto max-h-32">
                {JSON.stringify({
                  message: error.message,
                  type: error.type,
                  stripeCode: error.stripeCode,
                  requestId: error.requestId,
                  statusCode: error.statusCode
                }, null, 2)}
              </pre>
            </div>
          )}
          
          {/* API Logs */}
          {apiLogs && apiLogs.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-secondary-400 mb-1">Recent API Calls:</h5>
              <div className="space-y-1">
                {apiLogs.map((log, index) => (
                  <div key={index} className="text-xs bg-secondary-900/50 p-2 rounded">
                    <div className="flex justify-between items-center text-secondary-300">
                      <span>{log.method} {log.url}</span>
                      <span className={log.error ? 'text-danger-400' : 'text-success-400'}>
                        {log.responseStatus || (log.error ? 'ERROR' : 'PENDING')}
                      </span>
                    </div>
                    {log.timing.duration && (
                      <div className="text-secondary-400 mt-1">
                        {log.timing.duration.toFixed(2)}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const logs = apiDebugger.exportLogs()
                const blob = new Blob([logs], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `directorybolt-debug-${new Date().toISOString().slice(0, 19)}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className="text-xs px-2 py-1 bg-volt-500/20 text-volt-400 rounded hover:bg-volt-500/30 transition-colors"
            >
              Export Logs
            </button>
            <button
              onClick={() => apiDebugger.clearLogs()}
              className="text-xs px-2 py-1 bg-danger-500/20 text-danger-400 rounded hover:bg-danger-500/30 transition-colors"
            >
              Clear Logs
            </button>
            <button
              onClick={() => {
                console.log('API Debug Summary:', apiDebugger.getSummary())
                console.log('Environment Validation:', apiDebugger.validateEnvironment())
              }}
              className="text-xs px-2 py-1 bg-info-500/20 text-info-400 rounded hover:bg-info-500/30 transition-colors"
            >
              Log Summary
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutButton