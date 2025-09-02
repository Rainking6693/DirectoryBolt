'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FeatureTooltip from './ui/FeatureTooltip'
import CheckoutButton from './CheckoutButton'

interface PricingTier {
  id: string
  name: string
  price: number
  annualPrice: number
  description: string
  features: string[]
  highlighted?: boolean
  popular?: boolean
  badge?: string
  buttonText: string
  buttonStyle: string
  roi: {
    timesSaved: string
    visibilityIncrease: string
    newCustomers: string
    roiPercentage?: string
  }
  directories: number
  support: string
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    annualPrice: 49,
    description: '50 directory submissions - Perfect for testing ROI',
    directories: 50,
    support: 'Email support',
    features: [
      '🚀 50 high-authority directories',
      '⭐ Product Hunt, Crunchbase, G2.com access',
      '✅ 85%+ approval rates guaranteed',
      '⚡ Easy-to-medium difficulty only',
      '📊 Basic analytics dashboard',
      '📧 Email support',
      '🎯 Focus on easiest high-value wins'
    ],
    roi: {
      timesSaved: '8-12 hours total submission time',
      visibilityIncrease: '+35% search visibility',
      newCustomers: '5-8 new customers/month'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-secondary-700 hover:bg-secondary-600 text-white'
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 89,
    annualPrice: 89,
    description: '100 directory submissions - Most popular choice',
    directories: 100,
    support: 'Priority email & chat',
    highlighted: true,
    popular: true,
    badge: 'MOST POPULAR',
    features: [
      '🎯 100 premium directories',
      '🔥 Hacker News, AlternativeTo, GetApp access',
      '🤖 AI-powered listing optimization',
      '📈 Advanced competitor analysis',
      '💬 Priority email & chat support',
      '📊 Advanced analytics dashboard',
      '🎨 All AI-specific directories included',
      '⚡ 40-93 DA range coverage'
    ],
    roi: {
      timesSaved: '15-25 hours total submission time',
      visibilityIncrease: '+55% search visibility',
      newCustomers: '12-18 new customers/month',
      roiPercentage: '400-600%'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-secondary-900 font-black'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 159,
    annualPrice: 159,
    description: '200 directory submissions + pro features',
    directories: 200,
    support: 'Phone & priority support',
    features: [
      '🚀 200 premium directories',
      '📊 Custom branded analytics',
      '🔧 API access for integrations',
      '📞 Phone & priority support',
      '📈 White-label reporting',
      '👤 Dedicated account manager',
      '🎯 30-93 DA range coverage',
      '⚡ Professional features unlocked'
    ],
    roi: {
      timesSaved: '35-50 hours total submission time',
      visibilityIncrease: '+75% search visibility',
      newCustomers: '25-35 new customers/month',
      roiPercentage: '600-800%'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-secondary-700 hover:bg-secondary-600 text-white'
  },
  {
    id: 'subscription',
    name: 'Subscription',
    price: 49,
    annualPrice: 49,
    description: 'Monthly automatic updates and resubmissions',
    directories: 0,
    support: 'Priority support',
    features: [
      '🔄 Monthly automatic updates',
      '🚀 Automatic resubmissions',
      '📊 Monthly performance reports',
      '💬 Priority support',
      '🔧 Profile optimization',
      '📈 Performance tracking',
      '🛡️ Listing protection',
      '⚡ Quick response time'
    ],
    roi: {
      timesSaved: 'Ongoing time savings',
      visibilityIncrease: 'Maintained visibility',
      newCustomers: 'Consistent lead flow',
      roiPercentage: 'Ongoing ROI'
    },
    buttonText: 'Subscribe Monthly',
    buttonStyle: 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-400 hover:to-success-500 text-white font-black'
  }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    company: 'Local Dental Practice',
    role: 'Practice Owner',
    content: 'DirectoryBolt increased our online visibility by 400%. We now get 3-4 new patients per week from local searches.',
    rating: 5,
    results: '+400% online visibility'
  },
  {
    name: 'Marcus Rodriguez',
    company: 'Rodriguez Auto Repair',
    role: 'Owner',
    content: 'Best investment we made. Saved us 50+ hours of manual work and brought in $15K in new business in 60 days.',
    rating: 5,
    results: '$15K new revenue'
  },
  {
    name: 'Jennifer Walsh',
    company: 'Walsh Marketing Agency',
    role: 'CEO',
    content: 'We use DirectoryBolt for all our clients. The ROI is incredible - clients see results in weeks, not months.',
    rating: 5,
    results: '600% client ROI'
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showROICalculator, setShowROICalculator] = useState(false)
  
  // ROI Calculator State
  const [currentRevenue, setCurrentRevenue] = useState(10000)
  const [newCustomersWorth, setNewCustomersWorth] = useState(500)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // This function now just determines where to route, actual checkout is handled by CheckoutButton
  const getSuccessUrl = (planId: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&billing=${isAnnual ? 'annual' : 'monthly'}`
  }

  const getCancelUrl = (planId: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=${planId}&billing=${isAnnual ? 'annual' : 'monthly'}`
  }

  const calculateROI = (tier: PricingTier) => {
    const monthlyInvestment = isAnnual ? tier.annualPrice : tier.price
    const estimatedNewCustomers = parseInt(tier.roi.newCustomers.split('-')[0])
    const monthlyReturn = estimatedNewCustomers * newCustomersWorth
    const roiPercentage = ((monthlyReturn - monthlyInvestment) / monthlyInvestment) * 100
    
    return {
      monthlyReturn,
      roiPercentage: Math.round(roiPercentage),
      annualReturn: monthlyReturn * 12,
      annualInvestment: monthlyInvestment * 12
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white">
      {/* Header Section */}
      <section className={`relative pt-20 pb-16 px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500 rounded-full blur-3xl opacity-10 animate-pulse-volt"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-volt-400 rounded-full blur-3xl opacity-10 animate-pulse-volt" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Main Header */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Choose Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600 animate-glow">
                Growth Plan
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-secondary-300 mb-8 max-w-4xl mx-auto">
              Stop losing customers to competitors. Get listed in 500+ directories and 
              <span className="text-volt-400 font-bold"> dominate local search results</span>
            </p>
          </div>

          {/* Value Proposition Cards */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">
              Why Choose DirectoryBolt
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-success-900/50 to-success-800/30 p-6 rounded-xl border border-success-600/50 backdrop-blur-sm">
                <div className="text-4xl mb-4">⏱️</div>
                <h3 className="text-lg font-bold text-success-300 mb-2">Save 40+ Hours Monthly</h3>
              <p className="text-sm text-secondary-300">Automated directory submissions vs manual work</p>
            </div>
            
            <div className="bg-gradient-to-br from-volt-900/50 to-volt-800/30 p-6 rounded-xl border border-volt-600/50 backdrop-blur-sm">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-bold text-volt-300 mb-2">Proven ROI: 400-800%</h3>
              <p className="text-sm text-secondary-300">Average client return on investment</p>
            </div>
            
            <div className="bg-gradient-to-br from-success-900/50 to-success-800/30 p-6 rounded-xl border border-success-600/50 backdrop-blur-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-success-300 mb-2">Results in 30 Days</h3>
              <p className="text-sm text-secondary-300">Or your money back - guaranteed</p>
            </div>
            </div>
          </div>

          {/* Annual/Monthly Toggle */}
          <div className="animate-slide-up flex items-center justify-center gap-4 mb-12" style={{ animationDelay: '0.6s' }}>
            <span className={`text-lg ${!isAnnual ? 'text-white font-bold' : 'text-secondary-400'}`}>
              Monthly
            </span>
            <div className="relative">
              <input
                type="checkbox"
                id="annual-toggle"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="annual-toggle"
                className={`flex items-center cursor-pointer w-16 h-8 rounded-full transition-colors duration-300 ${
                  isAnnual ? 'bg-volt-500' : 'bg-secondary-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  isAnnual ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </label>
            </div>
            <div className="flex flex-col items-start">
              <span className={`text-lg ${isAnnual ? 'text-white font-bold' : 'text-secondary-400'}`}>
                Annual
              </span>
              <span className="text-volt-400 text-sm font-bold">Save 2 months!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 mb-16">
            {pricingTiers.map((tier, index) => {
              const roi = calculateROI(tier)
              return (
                <div
                  key={tier.id}
                  className={`relative transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-volt-500/20 ${
                    tier.highlighted ? 'scale-105' : ''
                  } animate-slide-up group`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black px-6 py-2 rounded-full text-sm shadow-lg">
                        🔥 {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className={`h-full bg-gradient-to-br backdrop-blur-sm rounded-2xl p-6 sm:p-8 transition-all duration-300 group-hover:bg-gradient-to-br ${
                    tier.highlighted
                      ? 'from-volt-500/20 to-volt-600/10 border-2 border-volt-500 shadow-2xl shadow-volt-500/20 group-hover:from-volt-500/30 group-hover:to-volt-600/20'
                      : 'from-secondary-800/80 to-secondary-900/60 border border-secondary-600 group-hover:from-secondary-700/90 group-hover:to-secondary-800/70 group-hover:border-volt-500/50'
                  }`}>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? 'text-volt-300' : 'text-white'}`}>
                        {tier.name}
                      </h3>
                      <div className="mb-4">
                        <div className="text-5xl font-black mb-2">
                          <span className={tier.highlighted ? 'text-volt-400' : 'text-volt-400'}>
                            ${isAnnual ? tier.annualPrice : tier.price}
                          </span>
                          <span className="text-lg text-secondary-400">/month</span>
                        </div>
                        {isAnnual && tier.price !== tier.annualPrice && (
                          <div className="text-sm text-volt-400 font-bold">
                            Save ${(tier.price - tier.annualPrice) * 12}/year
                          </div>
                        )}
                      </div>
                      <p className="text-secondary-300 text-sm">{tier.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3 text-sm">
                          <span className={`${tier.highlighted ? 'text-volt-400' : 'text-success-400'} text-lg flex-shrink-0 mt-0.5`}>
                            ✅
                          </span>
                          <span className="text-secondary-200">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* ROI Box */}
                    <div className={`p-4 rounded-lg mb-6 ${
                      tier.highlighted
                        ? 'bg-volt-500/10 border border-volt-500/30'
                        : 'bg-secondary-700/50 border border-secondary-600/50'
                    }`}>
                      <div className={`text-sm font-bold mb-2 ${tier.highlighted ? 'text-volt-400' : 'text-volt-400'}`}>
                        💰 ROI Projection:
                      </div>
                      <div className="text-xs text-secondary-300 space-y-1">
                        <div>• {tier.roi.timesSaved}</div>
                        <div>• {tier.roi.visibilityIncrease}</div>
                        <div>• {tier.roi.newCustomers}</div>
                        {tier.roi.roiPercentage && (
                          <div className="font-bold text-success-400">• ROI: {tier.roi.roiPercentage}</div>
                        )}
                      </div>
                    </div>

                    {/* CTA Button - Enhanced for mobile responsiveness */}
                    <div className="w-full space-y-3">
                      <CheckoutButton
                        plan={tier.id}
                        variant={tier.highlighted ? 'primary' : tier.id === 'enterprise' ? 'outline' : 'secondary'}
                        size="lg"
                        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg group-hover:shadow-2xl ${tier.buttonStyle} min-h-[48px] sm:min-h-[56px] flex items-center justify-center`}
                        successUrl={getSuccessUrl(tier.id)}
                        cancelUrl={getCancelUrl(tier.id)}
                        customerEmail=""
                        onSuccess={(data: any) => {
                          console.log('Checkout success:', data)
                          // Track conversion event
                          if (typeof window !== 'undefined' && (window as any).gtag) {
                            (window as any).gtag('event', 'purchase_initiated', {
                              plan: tier.id,
                              billing: isAnnual ? 'annual' : 'monthly',
                              value: isAnnual ? tier.annualPrice : tier.price
                            })
                          }
                        }}
                        onError={(error: any) => {
                          console.error('Checkout error for plan:', tier.id, error)
                          // Enhanced mobile error handling
                          const errorMessage = error?.message || 'Checkout temporarily unavailable';
                          if (typeof window !== 'undefined') {
                            if (window.innerWidth < 768) {
                              // Mobile-specific fallback
                              alert(`${errorMessage}. Redirecting to manual setup...`);
                            }
                            router.push(`/analyze?recommended_plan=${tier.id}&billing=${isAnnual ? 'annual' : 'monthly'}&error=checkout_failed`);
                          }
                        }}
                      >
                        {tier.buttonText}
                      </CheckoutButton>
                      {tier.id !== 'enterprise' && (
                        <div className="text-center text-xs sm:text-sm text-secondary-400 group-hover:text-secondary-300 transition-colors px-2">
                          <span className="inline-flex items-center gap-1">
                            <span>🔒</span>
                            <span>14-day free trial • Cancel anytime</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Directory Examples */}
                    <div className="text-center mt-4 p-3 bg-secondary-900/30 rounded-lg border border-secondary-600/30 group-hover:bg-secondary-900/50 group-hover:border-secondary-500/50 transition-all duration-300">
                      <div className="text-xs font-bold text-secondary-300 mb-2">
                        {tier.id === 'subscription' ? '🔄 Monthly Service' : `🎯 ${tier.directories} Premium Directories`}
                      </div>
                      <div className="text-xs text-secondary-400 space-y-1">
                        {tier.id === 'starter' && (
                          <>
                            <div>• Product Hunt (DA 91)</div>
                            <div>• Crunchbase (DA 91)</div>
                            <div>• G2.com (DA 80)</div>
                            <div>• F6S (DA 72) + 46 more</div>
                          </>
                        )}
                        {tier.id === 'growth' && (
                          <>
                            <div>• All Starter directories PLUS:</div>
                            <div>• Hacker News (DA 89)</div>
                            <div>• AlternativeTo (DA 87)</div>
                            <div>• GetApp (DA 91) + 47 more</div>
                          </>
                        )}
                        {tier.id === 'pro' && (
                          <>
                            <div>• All Growth directories PLUS:</div>
                            <div>• 100 additional premium sites</div>
                            <div>• Industry-specific directories</div>
                            <div>• Regional platforms</div>
                          </>
                        )}
                        {tier.id === 'subscription' && (
                          <>
                            <div>• Keep all listings updated</div>
                            <div>• Automatic resubmissions</div>
                            <div>• Monthly reports</div>
                            <div>• Profile optimization</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
              Enhance Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Package</span>
            </h2>
            <p className="text-lg sm:text-xl text-secondary-300">
              Add powerful extras to accelerate your results
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-4 sm:p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 hover:from-secondary-700/90 hover:to-secondary-800/70 transition-all duration-300 transform hover:scale-105 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 group-hover:text-volt-300 transition-colors">
                    <span>⚡</span> Fast-Track Submission
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-300 group-hover:text-secondary-200 transition-colors">Priority processing within 24 hours</p>
                </div>
                <div className="text-volt-400 font-black text-lg sm:text-xl group-hover:text-volt-300 transition-colors">+$25</div>
              </div>
              <div className="text-xs text-secondary-400 group-hover:text-secondary-300 transition-colors">
                Skip the queue and get your submissions processed first
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-4 sm:p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 hover:from-secondary-700/90 hover:to-secondary-800/70 transition-all duration-300 transform hover:scale-105 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 group-hover:text-volt-300 transition-colors">
                    <span>👑</span> Premium Directories Only
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-300 group-hover:text-secondary-200 transition-colors">Focus on high-authority directories</p>
                </div>
                <div className="text-volt-400 font-black text-lg sm:text-xl group-hover:text-volt-300 transition-colors">+$15</div>
              </div>
              <div className="text-xs text-secondary-400 group-hover:text-secondary-300 transition-colors">
                Target only directories with DA 70+ for maximum impact
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-4 sm:p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 hover:from-secondary-700/90 hover:to-secondary-800/70 transition-all duration-300 transform hover:scale-105 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 group-hover:text-volt-300 transition-colors">
                    <span>🔍</span> Manual QA Review
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-300 group-hover:text-secondary-200 transition-colors">Human verification of all submissions</p>
                </div>
                <div className="text-volt-400 font-black text-lg sm:text-xl group-hover:text-volt-300 transition-colors">+$10</div>
              </div>
              <div className="text-xs text-secondary-400 group-hover:text-secondary-300 transition-colors">
                Expert review to ensure perfect listing quality
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-4 sm:p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 hover:from-secondary-700/90 hover:to-secondary-800/70 transition-all duration-300 transform hover:scale-105 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 group-hover:text-volt-300 transition-colors">
                    <span>📊</span> CSV Export
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary-300 group-hover:text-secondary-200 transition-colors">Export submission results to CSV</p>
                </div>
                <div className="text-volt-400 font-black text-lg sm:text-xl group-hover:text-volt-300 transition-colors">+$9</div>
              </div>
              <div className="text-xs text-secondary-400 group-hover:text-secondary-300 transition-colors">
                Download your complete listing data for analysis
              </div>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-secondary-400">
              Add-ons can be selected during checkout for any plan
            </p>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
              Calculate Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> ROI</span>
            </h2>
            <p className="text-lg sm:text-xl text-secondary-300">
              See exactly how much DirectoryBolt could be worth to your business
            </p>
          </div>

          <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-6 sm:p-8 rounded-2xl border border-secondary-600 backdrop-blur-sm hover:border-volt-500/30 hover:from-secondary-700/90 hover:to-secondary-800/70 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-secondary-300 mb-2">
                  Current Monthly Revenue
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={currentRevenue}
                  onChange={(e) => setCurrentRevenue(parseInt(e.target.value))}
                  className="w-full h-3 bg-secondary-700 rounded-lg appearance-none cursor-pointer range-slider"
                />
                <div className="text-2xl font-bold text-volt-400 mt-2">
                  ${currentRevenue.toLocaleString()}/month
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-secondary-300 mb-2">
                  Average Customer Value
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={newCustomersWorth}
                  onChange={(e) => setNewCustomersWorth(parseInt(e.target.value))}
                  className="w-full h-3 bg-secondary-700 rounded-lg appearance-none cursor-pointer range-slider"
                />
                <div className="text-2xl font-bold text-volt-400 mt-2">
                  ${newCustomersWorth}/customer
                </div>
              </div>
            </div>

            {/* ROI Results */}
            <div className="border-t border-secondary-600 pt-6">
              <h3 className="text-xl font-bold mb-4 text-center">
                Your Potential ROI with Growth Plan:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const growthTier = pricingTiers.find(t => t.id === 'growth')!
                  const roi = calculateROI(growthTier)
                  return (
                    <>
                      <div className="text-center p-4 bg-success-900/30 rounded-lg border border-success-600/30">
                        <div className="text-2xl font-black text-success-400">
                          +${roi.monthlyReturn.toLocaleString()}
                        </div>
                        <div className="text-sm text-secondary-300">Monthly Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-volt-900/30 rounded-lg border border-volt-600/30">
                        <div className="text-2xl font-black text-volt-400">
                          {roi.roiPercentage}% ROI
                        </div>
                        <div className="text-sm text-secondary-300">Return on Investment</div>
                      </div>
                      <div className="text-center p-4 bg-success-900/30 rounded-lg border border-success-600/30">
                        <div className="text-2xl font-black text-success-400">
                          ${roi.annualReturn.toLocaleString()}
                        </div>
                        <div className="text-sm text-secondary-300">Annual Revenue</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
              Join 500+ Businesses
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Crushing It</span>
            </h2>
            <p className="text-lg sm:text-xl text-secondary-300">
              See what real customers are saying about their results
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-4 sm:p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm animate-slide-up hover:border-volt-500/50 hover:from-secondary-700/90 hover:to-secondary-800/70 hover:scale-105 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-volt-400 text-lg sm:text-xl group-hover:text-volt-300 transition-colors">⭐</span>
                  ))}
                </div>
                <blockquote className="text-secondary-200 mb-4 italic text-sm sm:text-base group-hover:text-secondary-100 transition-colors">
                  "{testimonial.content}"
                </blockquote>
                <div className="border-t border-secondary-600 pt-4 group-hover:border-secondary-500 transition-colors">
                  <div className="font-bold text-white text-sm sm:text-base group-hover:text-volt-300 transition-colors">{testimonial.name}</div>
                  <div className="text-xs sm:text-sm text-secondary-400 group-hover:text-secondary-300 transition-colors">{testimonial.role}</div>
                  <div className="text-xs sm:text-sm text-secondary-400 group-hover:text-secondary-300 transition-colors">{testimonial.company}</div>
                  <div className="text-volt-400 font-bold text-xs sm:text-sm mt-2 group-hover:text-volt-300 transition-colors">
                    Result: {testimonial.results}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 mb-8 text-secondary-400">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-success-400 text-lg sm:text-xl">🔒</span>
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-success-400 text-lg sm:text-xl">🏆</span>
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-success-400 text-lg sm:text-xl">⭐</span>
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-success-400 text-lg sm:text-xl">🚀</span>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-6 sm:p-8 lg:p-12 rounded-2xl border border-volt-500/30 backdrop-blur-sm hover:from-volt-500/30 hover:to-volt-600/30 hover:border-volt-500/50 transition-all duration-500 group">
            
            {/* Urgency indicator */}
            <div className="inline-flex items-center gap-2 bg-danger-500/20 border border-danger-500/30 px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-danger-300 mb-6 animate-pulse">
              <div className="w-2 h-2 bg-danger-400 rounded-full animate-ping"></div>
              487 businesses joined this month • Limited spots remaining
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6">
              Ready to Dominate
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Local Search?</span>
            </h2>
            <p className="text-lg sm:text-xl text-secondary-300 mb-8">
              Join 500+ businesses already getting more customers with DirectoryBolt
            </p>
            
            {/* Enhanced mobile-first button layout */}
            <div className="flex flex-col gap-4 justify-center items-center mb-8 sm:flex-row sm:gap-6">
              <CheckoutButton
                plan="growth"
                variant="primary"
                size="xl"
                className="group w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-base sm:text-xl rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow min-h-[56px] sm:min-h-[64px] max-w-sm sm:max-w-none"
                successUrl={getSuccessUrl('growth')}
                cancelUrl={getCancelUrl('growth')}
                customerEmail=""
                onSuccess={(data: any) => {
                  console.log('Final CTA checkout success:', data)
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'purchase_initiated', {
                      plan: 'growth',
                      billing: isAnnual ? 'annual' : 'monthly',
                      value: isAnnual ? 63 : 79,
                      source: 'final_cta'
                    })
                  }
                }}
                onError={(error: any) => {
                  console.error('Final CTA checkout error:', error)
                  // Mobile-friendly error handling
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    const shortError = error?.message?.substring(0, 50) || 'Checkout error';
                    alert(`${shortError}... Redirecting to alternative signup.`);
                  }
                }}
              >
                🚀 Start 14-Day Free Trial
              </CheckoutButton>
              
              <button
                onClick={() => router.push('/analyze')}
                className="w-full sm:w-auto px-6 sm:px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-base sm:text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300 min-h-[56px] sm:min-h-[64px] flex items-center justify-center max-w-sm sm:max-w-none"
              >
                ⚡ Free Analysis First
              </button>
            </div>

            {/* Guarantee */}
            <div className="bg-success-900/30 border border-success-600/30 p-4 sm:p-6 rounded-xl mb-6 group-hover:bg-success-900/50 group-hover:border-success-600/50 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
                <span className="text-success-400 text-xl sm:text-2xl">🛡️</span>
                <span className="text-lg sm:text-xl font-bold text-success-400 text-center sm:text-left">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-sm sm:text-base text-secondary-300 text-center">
                See results in 30 days or get a full refund. No questions asked.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-secondary-400">
              <span className="flex items-center gap-1"><span>✅</span> No setup fees</span>
              <span className="flex items-center gap-1"><span>✅</span> Cancel anytime</span>
              <span className="flex items-center gap-1"><span>✅</span> 14-day free trial</span>
              <span className="flex items-center gap-1"><span>✅</span> Instant activation</span>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        
        .range-slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
      `}</style>
    </div>
  )
}