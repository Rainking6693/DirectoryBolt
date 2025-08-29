'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// Checkout step components
import { PackageSelection } from './PackageSelection'
import { AddOnsSelection } from './AddOnsSelection'
import { SubscriptionOption } from './SubscriptionOption'
import { OrderSummary } from './OrderSummary'
import { CheckoutProcessing } from './CheckoutProcessing'

// DirectoryBolt Package Definitions (Your Exact Pricing)
export const DIRECTORYBOLT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    directories: 50,
    description: 'Perfect for small businesses getting started',
    features: [
      '50 premium directory submissions',
      'Business profile optimization',
      'Email support',
      '30-day completion guarantee',
      'Basic analytics dashboard'
    ],
    popular: false
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 89,
    directories: 100,
    description: 'Most popular choice for growing businesses',
    features: [
      '100 premium directory submissions',
      'Advanced profile optimization',
      'Priority email support',
      '30-day completion guarantee',
      'Detailed analytics dashboard',
      'Competitor analysis report'
    ],
    popular: true
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 159,
    directories: 200,
    description: 'Complete solution for established businesses',
    features: [
      '200 premium directory submissions',
      'Expert profile optimization',
      'Phone & email support',
      '30-day completion guarantee',
      'Premium analytics dashboard',
      'Competitor analysis report',
      'Monthly performance reviews',
      'API access for integrations'
    ],
    popular: false
  }
}

export const DIRECTORYBOLT_ADD_ONS = {
  fast_track: {
    id: 'fast_track',
    name: 'Fast-track Submission',
    price: 25,
    description: 'Complete your submissions in 1-2 business days instead of 5-7 days',
    icon: '⚡'
  },
  premium_directories: {
    id: 'premium_directories',
    name: 'Premium Directories Only',
    price: 15,
    description: 'Submit only to high-authority, premium directories (DA 70+)',
    icon: '👑'
  },
  manual_qa: {
    id: 'manual_qa',
    name: 'Manual QA Review',
    price: 10,
    description: 'Human quality assurance review of all submissions before going live',
    icon: '🔍'
  },
  csv_export: {
    id: 'csv_export',
    name: 'CSV Export',
    price: 9,
    description: 'Download detailed CSV report of all submissions and results',
    icon: '📊'
  }
}

export const SUBSCRIPTION_SERVICE = {
  id: 'auto_update',
  name: 'Auto Update & Resubmission',
  price: 49,
  billing: 'monthly',
  description: 'Automatically monitor and resubmit to directories that remove your listing',
  features: [
    'Automatic directory monitoring',
    'Profile updates when business info changes',
    'Resubmission to directories that remove listings',
    'Monthly performance reports',
    'Priority support',
    'Cancel anytime'
  ]
}

interface CheckoutState {
  step: 'package' | 'addons' | 'subscription' | 'summary' | 'processing'
  selectedPackage: string | null
  selectedAddOns: string[]
  wantsSubscription: boolean
  customerInfo: {
    email: string
    name: string
    businessName: string
    businessWebsite: string
  }
  pricing: {
    packagePrice: number
    addOnsPrice: number
    subscriptionPrice: number
    totalOneTime: number
    monthlyRecurring: number
  }
}

export default function DirectoryBoltCheckout() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: 'package',
    selectedPackage: null,
    selectedAddOns: [],
    wantsSubscription: false,
    customerInfo: {
      email: '',
      name: '',
      businessName: '',
      businessWebsite: ''
    },
    pricing: {
      packagePrice: 0,
      addOnsPrice: 0,
      subscriptionPrice: 0,
      totalOneTime: 0,
      monthlyRecurring: 0
    }
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Calculate pricing whenever selections change
  useEffect(() => {
    const packagePrice = checkoutState.selectedPackage 
      ? DIRECTORYBOLT_PACKAGES[checkoutState.selectedPackage]?.price || 0 
      : 0

    const addOnsPrice = checkoutState.selectedAddOns.reduce((total, addOnId) => {
      return total + (DIRECTORYBOLT_ADD_ONS[addOnId]?.price || 0)
    }, 0)

    const subscriptionPrice = checkoutState.wantsSubscription ? SUBSCRIPTION_SERVICE.price : 0

    setCheckoutState(prev => ({
      ...prev,
      pricing: {
        packagePrice,
        addOnsPrice,
        subscriptionPrice,
        totalOneTime: packagePrice + addOnsPrice,
        monthlyRecurring: subscriptionPrice
      }
    }))
  }, [checkoutState.selectedPackage, checkoutState.selectedAddOns, checkoutState.wantsSubscription])

  const handlePackageSelect = (packageId: string) => {
    setCheckoutState(prev => ({
      ...prev,
      selectedPackage: packageId,
      step: 'addons'
    }))
  }

  const handleAddOnsComplete = (selectedAddOns: string[]) => {
    setCheckoutState(prev => ({
      ...prev,
      selectedAddOns,
      step: 'subscription'
    }))
  }

  const handleSubscriptionComplete = (wantsSubscription: boolean) => {
    setCheckoutState(prev => ({
      ...prev,
      wantsSubscription,
      step: 'summary'
    }))
  }

  const handleCustomerInfoUpdate = (customerInfo: CheckoutState['customerInfo']) => {
    setCheckoutState(prev => ({
      ...prev,
      customerInfo
    }))
  }

  const handleCheckout = async () => {
    setCheckoutState(prev => ({ ...prev, step: 'processing' }))
    
    try {
      // Create one-time payment checkout session
      const checkoutResponse = await fetch('/api/create-checkout-session-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package: checkoutState.selectedPackage,
          addOns: checkoutState.selectedAddOns,
          customer_email: checkoutState.customerInfo.email,
          customer_name: checkoutState.customerInfo.name,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&type=package`,
          cancel_url: `${window.location.origin}/checkout?cancelled=true`,
          metadata: {
            business_name: checkoutState.customerInfo.businessName,
            business_website: checkoutState.customerInfo.businessWebsite,
            wants_subscription: checkoutState.wantsSubscription.toString()
          }
        })
      })

      const checkoutData = await checkoutResponse.json()

      if (checkoutData.success && checkoutData.data?.checkout_session?.url) {
        // If they want subscription, we'll handle that on the success page
        // For now, redirect to main checkout
        window.location.href = checkoutData.data.checkout_session.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutState(prev => ({ ...prev, step: 'summary' }))
      alert('There was an error processing your checkout. Please try again.')
    }
  }

  const handleGoBack = () => {
    const stepOrder = ['package', 'addons', 'subscription', 'summary']
    const currentIndex = stepOrder.indexOf(checkoutState.step)
    if (currentIndex > 0) {
      setCheckoutState(prev => ({
        ...prev,
        step: stepOrder[currentIndex - 1] as CheckoutState['step']
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
      {/* Header */}
      <div className={`relative pt-8 pb-6 px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              DirectoryBolt Checkout
            </h1>
            <p className="text-secondary-300">
              Get your business listed in hundreds of directories
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[
              { key: 'package', label: 'Package', icon: '📦' },
              { key: 'addons', label: 'Add-ons', icon: '⚡' },
              { key: 'subscription', label: 'Subscription', icon: '🔄' },
              { key: 'summary', label: 'Review', icon: '✅' }
            ].map((stepInfo, index) => {
              const isActive = checkoutState.step === stepInfo.key
              const isCompleted = ['package', 'addons', 'subscription', 'summary'].indexOf(checkoutState.step) > index
              
              return (
                <div key={stepInfo.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-volt-500 border-volt-500 text-secondary-900' 
                      : isCompleted 
                        ? 'bg-success-500 border-success-500 text-white'
                        : 'bg-secondary-800 border-secondary-600 text-secondary-400'
                  }`}>
                    <span className="text-sm font-bold">{stepInfo.icon}</span>
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-volt-400' : isCompleted ? 'text-success-400' : 'text-secondary-400'
                  }`}>
                    {stepInfo.label}
                  </span>
                  {index < 3 && (
                    <div className={`ml-4 w-8 h-0.5 ${
                      isCompleted ? 'bg-success-500' : 'bg-secondary-600'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Package Selection */}
          {checkoutState.step === 'package' && (
            <PackageSelection
              packages={DIRECTORYBOLT_PACKAGES}
              selectedPackage={checkoutState.selectedPackage}
              onPackageSelect={handlePackageSelect}
            />
          )}

          {/* Step 2: Add-Ons Selection */}
          {checkoutState.step === 'addons' && (
            <AddOnsSelection
              addOns={DIRECTORYBOLT_ADD_ONS}
              selectedAddOns={checkoutState.selectedAddOns}
              onComplete={handleAddOnsComplete}
              onGoBack={handleGoBack}
              selectedPackage={DIRECTORYBOLT_PACKAGES[checkoutState.selectedPackage!]}
            />
          )}

          {/* Step 3: Subscription Option */}
          {checkoutState.step === 'subscription' && (
            <SubscriptionOption
              subscription={SUBSCRIPTION_SERVICE}
              wantsSubscription={checkoutState.wantsSubscription}
              onComplete={handleSubscriptionComplete}
              onGoBack={handleGoBack}
            />
          )}

          {/* Step 4: Order Summary & Checkout */}
          {checkoutState.step === 'summary' && (
            <OrderSummary
              checkoutState={checkoutState}
              packages={DIRECTORYBOLT_PACKAGES}
              addOns={DIRECTORYBOLT_ADD_ONS}
              subscription={SUBSCRIPTION_SERVICE}
              onCustomerInfoUpdate={handleCustomerInfoUpdate}
              onCheckout={handleCheckout}
              onGoBack={handleGoBack}
            />
          )}

          {/* Step 5: Processing */}
          {checkoutState.step === 'processing' && (
            <CheckoutProcessing />
          )}
        </div>
      </div>
    </div>
  )
}