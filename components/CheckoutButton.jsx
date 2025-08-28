'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useCheckout } from '../lib/hooks/useApiCall'
import { ErrorDisplay } from './ui/ErrorDisplay'
import { SuccessState } from './ui/SuccessState'

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
  ...props
}) => {
  const router = useRouter()
  const { createCheckoutSession, loading: isLoading, error, reset } = useCheckout()
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleCheckout = async () => {
    if (disabled || isLoading) return

    // Reset any previous errors
    reset()
    setShowError(false)
    setShowSuccess(false)

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
      const data = await createCheckoutSession(plan, {
        user_email: `user@example.com`, // In real app, get from auth
        user_id: `user_${Date.now()}`, // In real app, get from auth
        success_url: successUrl || `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${window.location.origin}/pricing?cancelled=true`
      })
      
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

      {/* Error Display */}
      {showError && error && (
        <div className="mt-4">
          <ErrorDisplay
            error={error}
            onRetry={handleRetryCheckout}
            onDismiss={handleDismissError}
            compact={true}
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

export default CheckoutButton