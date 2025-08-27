'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FeatureTooltip from './ui/FeatureTooltip'

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
    annualPrice: 39,
    description: 'Perfect for small businesses getting started',
    directories: 100,
    support: 'Email support',
    features: [
      '100 premium directory submissions',
      'Basic website analysis',
      'Standard listing optimization',
      'Monthly progress reports',
      'Email support',
      'Basic analytics dashboard'
    ],
    roi: {
      timesSaved: '20+ hours/month',
      visibilityIncrease: '+25% search visibility',
      newCustomers: '5-8 new customers/month'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-secondary-700 hover:bg-secondary-600 text-white'
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    annualPrice: 63,
    description: 'Most popular choice for growing businesses',
    directories: 250,
    support: 'Priority email & chat',
    highlighted: true,
    popular: true,
    badge: 'MOST POPULAR',
    features: [
      '250+ premium directory submissions',
      'AI-powered listing optimization',
      'Advanced competitor analysis',
      'Bi-weekly progress reports',
      'Priority email & chat support',
      'Advanced analytics dashboard',
      'Local SEO recommendations',
      'Review monitoring alerts'
    ],
    roi: {
      timesSaved: '40+ hours/month',
      visibilityIncrease: '+45% search visibility',
      newCustomers: '12-18 new customers/month',
      roiPercentage: '400-600%'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-secondary-900 font-black'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    annualPrice: 119,
    description: 'Advanced features for established businesses',
    directories: 500,
    support: 'Phone & priority support',
    features: [
      '500+ premium directory submissions',
      'AI content generation for listings',
      'Advanced success rate predictions',
      'Weekly detailed reports',
      'Phone & priority support',
      'White-label reporting',
      'Custom branded analytics',
      'API access for integrations',
      'Dedicated account manager'
    ],
    roi: {
      timesSaved: '60+ hours/month',
      visibilityIncrease: '+65% search visibility',
      newCustomers: '25-35 new customers/month',
      roiPercentage: '600-800%'
    },
    buttonText: 'Start Free Trial',
    buttonStyle: 'bg-secondary-700 hover:bg-secondary-600 text-white'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    annualPrice: 239,
    description: 'Complete solution for agencies & large businesses',
    directories: 1000,
    support: 'Dedicated account manager',
    features: [
      'Unlimited directory submissions',
      'Multi-location management',
      'White-label client dashboards',
      'Custom integrations & API',
      'Dedicated account manager',
      'Team collaboration tools',
      'Advanced reporting suite',
      'Priority feature requests',
      'Custom training sessions',
      'SLA guarantee'
    ],
    roi: {
      timesSaved: '100+ hours/month',
      visibilityIncrease: '+80% search visibility',
      newCustomers: '50+ new customers/month',
      roiPercentage: '800-1200%'
    },
    buttonText: 'Contact Sales',
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

  const handleCTAClick = (tier: PricingTier) => {
    if (tier.id === 'enterprise') {
      // Contact sales for enterprise
      window.open('mailto:sales@directorybolt.com?subject=Enterprise Plan Inquiry', '_blank')
    } else {
      router.push(`/analyze?plan=${tier.id}&billing=${isAnnual ? 'annual' : 'monthly'}`)
    }
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
          <div className="animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto" style={{ animationDelay: '0.3s' }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            {pricingTiers.map((tier, index) => {
              const roi = calculateROI(tier)
              return (
                <div
                  key={tier.id}
                  className={`relative transform transition-all duration-500 hover:scale-105 ${
                    tier.highlighted ? 'scale-105' : ''
                  } animate-slide-up`}
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

                  <div className={`h-full bg-gradient-to-br backdrop-blur-sm rounded-2xl p-8 ${
                    tier.highlighted
                      ? 'from-volt-500/20 to-volt-600/10 border-2 border-volt-500 shadow-2xl shadow-volt-500/20'
                      : 'from-secondary-800/80 to-secondary-900/60 border border-secondary-600'
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

                    {/* CTA Button */}
                    <button
                      onClick={() => handleCTAClick(tier)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${tier.buttonStyle}`}
                    >
                      {tier.buttonText}
                      {tier.id !== 'enterprise' && (
                        <span className="block text-sm opacity-80 font-normal">14-day free trial</span>
                      )}
                    </button>

                    {/* Directory Count */}
                    <div className="text-center mt-4 text-sm text-secondary-400">
                      Up to <span className="text-volt-400 font-bold">{tier.directories}+</span> directories
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Calculate Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> ROI</span>
            </h2>
            <p className="text-xl text-secondary-300">
              See exactly how much DirectoryBolt could be worth to your business
            </p>
          </div>

          <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-8 rounded-2xl border border-secondary-600 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-bold text-secondary-300 mb-2">
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
                <label className="block text-sm font-bold text-secondary-300 mb-2">
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Join 500+ Businesses
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Crushing It</span>
            </h2>
            <p className="text-xl text-secondary-300">
              See what real customers are saying about their results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-6 rounded-2xl border border-secondary-600 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-volt-400 text-xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-secondary-200 mb-4 italic">
                  "{testimonial.content}"
                </blockquote>
                <div className="border-t border-secondary-600 pt-4">
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-secondary-400">{testimonial.role}</div>
                  <div className="text-sm text-secondary-400">{testimonial.company}</div>
                  <div className="text-volt-400 font-bold text-sm mt-2">
                    Result: {testimonial.results}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 mb-8 text-secondary-400">
              <div className="flex items-center gap-2">
                <span className="text-success-400 text-xl">🔒</span>
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success-400 text-xl">🏆</span>
                <span>SOC 2 Type II Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success-400 text-xl">⭐</span>
                <span>4.9/5 Average Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success-400 text-xl">🚀</span>
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-12 rounded-2xl border border-volt-500/30 backdrop-blur-sm">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Ready to Dominate
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Local Search?</span>
            </h2>
            <p className="text-xl text-secondary-300 mb-8">
              Join 500+ businesses already getting more customers with DirectoryBolt
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <button
                onClick={() => router.push('/analyze?plan=growth&billing=annual')}
                className="group px-10 py-5 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-xl rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow"
              >
                <span className="relative z-10">🚀 Start 14-Day Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-volt-400 to-volt-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={() => router.push('/analyze')}
                className="px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
              >
                ⚡ Free Analysis First
              </button>
            </div>

            {/* Guarantee */}
            <div className="bg-success-900/30 border border-success-600/30 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-success-400 text-2xl">🛡️</span>
                <span className="text-xl font-bold text-success-400">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-secondary-300">
                See results in 30 days or get a full refund. No questions asked.
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-secondary-400">
              <span>✅ No setup fees</span>
              <span>✅ Cancel anytime</span>
              <span>✅ 14-day free trial</span>
              <span>✅ Instant activation</span>
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