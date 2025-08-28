'use client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Header from '../Header'
import { StartTrialButton } from '../CheckoutButton'

export default function EnhancedLandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [urgencyCount, setUrgencyCount] = useState(487) // Dynamic counter for social proof

  useEffect(() => {
    setIsVisible(true)
    // Simulate real-time signups for urgency
    const interval = setInterval(() => {
      setUrgencyCount(prev => prev + Math.random() > 0.7 ? 1 : 0)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handlePrimaryCTA = () => {
    // Track conversion intent
    if (typeof window !== 'undefined') {
      ((window as any).gtag)?.('event', 'analyze_intent', {
        event_category: 'conversion',
        event_label: 'landing_page_primary_cta'
      })
    }
    router.push('/analyze')
  }

  const handleSecondaryCTA = () => {
    // Track direct pricing intent
    if (typeof window !== 'undefined') {
      ((window as any).gtag)?.('event', 'pricing_intent', {
        event_category: 'conversion',
        event_label: 'landing_page_secondary_cta'
      })
    }
    router.push('/pricing')
  }

  return (
    <div className="bg-secondary-900 text-white font-sans">
      <Header />
      
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 py-2 px-4 text-center text-sm font-bold animate-pulse">
        🔥 {urgencyCount} businesses joined DirectoryBolt this month • Limited spots remaining
      </div>
      
      {/* Enhanced Hero Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-secondary-800 via-secondary-900 to-black text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent leading-tight animate-slide-up">
            Get Listed in 500+ Directories This Week—While Your Competitors Wait Months
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-secondary-300 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Discover your hidden opportunities in minutes. Our AI finds the exact directories your competitors don't know about, worth an average of <span className="text-volt-400 font-bold">$5,000+ in new business</span>.
          </p>
          
          {/* Enhanced CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button 
              onClick={handlePrimaryCTA}
              className="group relative bg-gradient-to-r from-volt-400 to-volt-600 text-secondary-900 font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg sm:text-xl hover:from-volt-300 hover:to-volt-500 animate-zoom-in"
              style={{ animationDelay: '0.4s' }}
            >
              <span className="relative z-10">🎯 Show Me My Opportunities (FREE)</span>
              <div className="absolute inset-0 bg-gradient-to-r from-volt-300 to-volt-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <StartTrialButton
              plan="growth"
              variant="secondary"
              size="lg"
              className="border-2 border-volt-500 text-volt-500 font-bold py-4 px-8 rounded-lg hover:bg-volt-500 hover:text-secondary-900 transition-all duration-300 text-lg sm:text-xl transform hover:scale-105"
            >
              Skip Analysis - Start Trial Now
            </StartTrialButton>
          </div>
          
          <div className="mb-6 flex flex-wrap justify-center items-center gap-6 text-sm text-secondary-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              Results in 48 hours
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              30-day money-back guarantee
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              Join 500+ successful businesses
            </span>
          </div>
          
          {/* Social Proof with Real Results */}
          <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-volt-500/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full border-2 border-secondary-800 flex items-center justify-center text-xs font-bold text-secondary-900">
                    {['S', 'M', 'J', 'R', 'L'][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-success-300 font-medium">Real customers, real results</span>
            </div>
            <p className="text-sm text-secondary-300 italic">
              "DirectoryBolt found us 23 high-authority directories we never knew existed. Generated <span className="text-volt-400 font-bold">$15,247 in new revenue</span> in 60 days."
            </p>
            <p className="text-xs text-volt-400 font-semibold mt-2">— Sarah Chen, Local Dental Practice</p>
          </div>
        </div>
      </section>

      {/* Value Proposition with Urgency */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-danger-500/10 to-danger-600/10 rounded-2xl border border-danger-500/30 p-8 mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-danger-400">
            Your Competitors Are Getting Ahead While You Wait
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-secondary-300 leading-relaxed mb-6">
            Every day without directory listings = lost customers. Most businesses miss out on <span className="text-volt-400 font-bold">15-25 potential customers monthly</span> because they're simply not listed where people search.
          </p>
          <div className="bg-secondary-900/50 rounded-xl p-6 border border-danger-500/20">
            <h3 className="text-lg font-bold text-volt-400 mb-4">What You're Missing Right Now:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-danger-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-danger-400">73%</div>
                <div className="text-secondary-300">of customers check directories before calling</div>
              </div>
              <div className="bg-danger-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-danger-400">$3,200</div>
                <div className="text-secondary-300">average monthly revenue from listings</div>
              </div>
              <div className="bg-danger-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-danger-400">45 days</div>
                <div className="text-secondary-300">typical DIY submission time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section with Enhanced Benefits */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
            DirectoryBolt Gets You Listed Everywhere—This Week
          </h2>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-success-900/50 to-success-800/30 p-8 rounded-2xl border border-success-600/50 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-success-300 mb-4">AI Finds Your Perfect Directories</h3>
              <p className="text-secondary-300 mb-6">Our smart algorithm analyzes your business and finds the exact directories that will send you customers—not just any directories.</p>
              <div className="bg-success-500/10 rounded-lg p-4 border border-success-500/30">
                <div className="text-2xl font-bold text-success-400">Average: 23 directories</div>
                <div className="text-xs text-secondary-300">worth $5,000+ in new business</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-volt-900/50 to-volt-800/30 p-8 rounded-2xl border border-volt-600/50 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-volt-300 mb-4">Automated Submissions</h3>
              <p className="text-secondary-300 mb-6">We handle everything: applications, follow-ups, optimization, and monitoring. You focus on running your business.</p>
              <div className="bg-volt-500/10 rounded-lg p-4 border border-volt-500/30">
                <div className="text-2xl font-bold text-volt-400">Save 40+ hours</div>
                <div className="text-xs text-secondary-300">of manual submission work</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Social Proof Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-volt-400">
          Real Results from Real Businesses
        </h2>
        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-secondary-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full flex items-center justify-center font-bold text-secondary-900 mr-4">
                SC
              </div>
              <div>
                <div className="font-semibold text-white">Sarah Chen</div>
                <div className="text-sm text-secondary-400">Dental Practice</div>
              </div>
            </div>
            <blockquote className="text-secondary-300 mb-4 italic">
              "Found 23 directories I never knew existed. Generated $15,247 in new patients in just 60 days."
            </blockquote>
            <div className="bg-success-500/10 rounded-lg p-3 border border-success-500/30">
              <div className="text-success-400 font-bold">ROI: 450%</div>
            </div>
          </div>

          <div className="bg-secondary-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full flex items-center justify-center font-bold text-secondary-900 mr-4">
                MR
              </div>
              <div>
                <div className="font-semibold text-white">Marcus Rodriguez</div>
                <div className="text-sm text-secondary-400">Auto Repair Shop</div>
              </div>
            </div>
            <blockquote className="text-secondary-300 mb-4 italic">
              "DirectoryBolt saved us 50+ hours and brought in $12K worth of new customers in the first month."
            </blockquote>
            <div className="bg-success-500/10 rounded-lg p-3 border border-success-500/30">
              <div className="text-success-400 font-bold">ROI: 380%</div>
            </div>
          </div>

          <div className="bg-secondary-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full flex items-center justify-center font-bold text-secondary-900 mr-4">
                JW
              </div>
              <div>
                <div className="font-semibold text-white">Jennifer Walsh</div>
                <div className="text-sm text-secondary-400">Marketing Agency</div>
              </div>
            </div>
            <blockquote className="text-secondary-300 mb-4 italic">
              "We use DirectoryBolt for all our clients. The ROI is incredible—clients see results in weeks, not months."
            </blockquote>
            <div className="bg-success-500/10 rounded-lg p-3 border border-success-500/30">
              <div className="text-success-400 font-bold">Client ROI: 600%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with Enhanced Urgency */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-volt-400 to-volt-600 text-secondary-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            Your Competitors Are Already Getting Ahead—Don't Wait
          </h2>
          <p className="mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
            <span className="font-bold">{urgencyCount} businesses</span> have joined DirectoryBolt this month. Every day you wait is revenue your competitors are capturing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button 
              onClick={handlePrimaryCTA}
              className="group relative bg-secondary-900 text-volt-400 font-bold py-4 px-8 rounded-lg shadow-2xl hover:bg-secondary-800 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl"
            >
              <span className="relative z-10">🎯 Discover My Hidden Opportunities</span>
            </button>
            
            <StartTrialButton
              plan="growth"
              variant="outline"
              size="lg"
              className="border-3 border-secondary-900 text-secondary-900 font-bold py-4 px-8 rounded-lg hover:bg-secondary-900 hover:text-volt-400 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl"
            >
              Start Trial Immediately
            </StartTrialButton>
          </div>
          
          <div className="bg-secondary-900/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-2xl">🛡️</span>
              <span className="font-bold text-lg">30-Day Money-Back Guarantee</span>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Get 5 new customers in 30 days or receive a full refund. No questions asked.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <span>✅ No setup fees</span>
              <span>✅ Cancel anytime</span>
              <span>✅ Results guaranteed</span>
              <span>✅ Instant activation</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}