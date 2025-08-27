'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'

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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    if (disabled || isLoading) return

    // Handle free plan
    if (plan === 'free') {
      router.push('/analyze')
      return
    }

    // Handle enterprise plan
    if (plan === 'enterprise') {
      window.open('mailto:sales@directorybolt.com?subject=Enterprise Plan Inquiry', '_blank')
      return
    }

    setIsLoading(true)

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package: plan,
          success_url: successUrl || `${window.location.origin}/success`,
          cancel_url: cancelUrl || `${window.location.origin}/pricing`
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data.checkout_session.url) {
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data)
        }
        
        // Redirect to Stripe Checkout
        window.location.href = data.data.checkout_session.url
      } else {
        throw new Error(data.error?.message || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      
      // Call error callback if provided
      if (onError) {
        onError(error)
      } else {
        // Default error handling
        alert('Payment setup failed. Please try again or contact support.')
      }
    } finally {
      setIsLoading(false)
    }
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

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={getButtonStyles()}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
          <span>Processing...</span>
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
  )
}

// Preset button components for common use cases
export const StartTrialButton = ({ plan = 'starter', ...props }) => (
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