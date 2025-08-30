'use client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Header from './Header'
import { StartTrialButton } from './CheckoutButton'

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="bg-secondary-900 text-white font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-secondary-800 via-secondary-900 to-black text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent leading-tight animate-slide-up">
            Submit Your Business to 500+ Directories — This Week
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-secondary-300 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Stop losing customers to competitors. Get discovered instantly with automated directory submissions to 500+ high-authority platforms. <span className="text-volt-400 font-bold">Results guaranteed in 48 hours.</span>
          </p>
          <StartTrialButton
            plan="growth"
            className="animate-zoom-in"
            style={{ animationDelay: '0.4s' }}
            successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=growth`}
            cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=growth`}
          >
            Start Your Free Trial Today
          </StartTrialButton>
          <p className="mt-4 text-sm sm:text-base text-secondary-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>Risk-free 14 days | Results in 48 hours | Cancel anytime</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-volt-400">Still Invisible Online—Even After Running Ads?</h2>
        <p className="text-base sm:text-lg lg:text-xl text-secondary-300 leading-relaxed">
          Most businesses miss out on leads because they're simply not listed where customers are searching. Manual submissions are tedious. Freelancers charge a premium. And DIY? It just doesn't scale.
        </p>
      </section>

      {/* Solution Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
            DirectoryBolt Automates Everything
          </h2>
          <ul className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8 max-w-4xl mx-auto text-left">
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Submit your business to <strong className="text-volt-400">500+ high-authority directories</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">AI-powered optimization = <strong className="text-volt-400">more visibility, better consistency</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Setup in <strong className="text-volt-400">under 2 minutes</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Plans from <strong className="text-volt-400">$49-$159</strong> | <strong className="text-volt-400">Free 14-day trial</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base"><strong className="text-volt-400">Cancel anytime</strong>. 30-day money-back guarantee</span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base"><strong className="text-volt-400">Trusted by 500+ businesses</strong> | ⭐ 4.9/5 rating</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-volt-400">Choose Your Growth Plan</h2>
        <p className="text-center text-secondary-300 mb-12 max-w-3xl mx-auto">
          Get listed in hundreds of directories with our proven system. Start your free trial today and see results in 48 hours.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {/* Starter Plan */}
          <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <div className="text-3xl font-black text-volt-400 mb-2">$49</div>
              <p className="text-sm text-secondary-300 mb-4">50 directories</p>
              <ul className="text-xs text-secondary-400 space-y-1 mb-6">
                <li>• Product Hunt, Crunchbase</li>
                <li>• Basic analytics</li>
                <li>• Email support</li>
                <li>• 85%+ approval rates</li>
              </ul>
              <StartTrialButton
                plan="starter"
                className="w-full py-2 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors"
                successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=starter`}
                cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=starter`}
              >
                Start Trial
              </StartTrialButton>
            </div>
          </div>

          {/* Growth Plan - Most Popular */}
          <div className="bg-gradient-to-br from-volt-500/20 to-volt-600/10 rounded-2xl p-6 border-2 border-volt-500 backdrop-blur-sm transform scale-105 shadow-2xl shadow-volt-500/20 hover:scale-110 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black px-4 py-2 rounded-full text-xs shadow-lg">
                🔥 MOST POPULAR
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-volt-300 mb-2">Growth</h3>
              <div className="text-3xl font-black text-volt-400 mb-2">$89</div>
              <p className="text-sm text-secondary-300 mb-4">100 directories</p>
              <ul className="text-xs text-secondary-400 space-y-1 mb-6">
                <li>• Hacker News, AlternativeTo</li>
                <li>• AI optimization</li>
                <li>• Priority support</li>
                <li>• 400-600% ROI</li>
              </ul>
              <StartTrialButton
                plan="growth"
                className="w-full py-2 text-sm bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold rounded-lg hover:from-volt-400 hover:to-volt-500 transition-all"
                successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=growth`}
                cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=growth`}
              >
                Start Trial
              </StartTrialButton>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-3xl font-black text-volt-400 mb-2">$159</div>
              <p className="text-sm text-secondary-300 mb-4">200 directories</p>
              <ul className="text-xs text-secondary-400 space-y-1 mb-6">
                <li>• API access</li>
                <li>• White-label reports</li>
                <li>• Phone support</li>
                <li>• 600-800% ROI</li>
              </ul>
              <StartTrialButton
                plan="pro"
                className="w-full py-2 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors"
                successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=pro`}
                cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=pro`}
              >
                Start Trial
              </StartTrialButton>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="bg-gradient-to-br from-success-900/50 to-success-800/30 rounded-2xl p-6 border border-success-600/50 backdrop-blur-sm hover:border-success-500/70 transition-all duration-300 transform hover:scale-105">
            <div className="text-center">
              <h3 className="text-xl font-bold text-success-300 mb-2">Subscription</h3>
              <div className="text-3xl font-black text-volt-400 mb-2">$49</div>
              <p className="text-sm text-secondary-300 mb-4">Monthly updates</p>
              <ul className="text-xs text-secondary-400 space-y-1 mb-6">
                <li>• Auto resubmissions</li>
                <li>• Monthly reports</li>
                <li>• Profile optimization</li>
                <li>• Ongoing ROI</li>
              </ul>
              <StartTrialButton
                plan="subscription"
                className="w-full py-2 text-sm bg-gradient-to-r from-success-500 to-success-600 text-white font-bold rounded-lg hover:from-success-400 hover:to-success-500 transition-all"
                successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=subscription`}
                cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=subscription`}
              >
                Start Trial
              </StartTrialButton>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => typeof window !== 'undefined' && (window.location.href = '/pricing')}
            className="text-volt-400 hover:text-volt-300 font-medium text-lg underline underline-offset-4 hover:underline-offset-8 transition-all duration-300"
          >
            View Full Pricing Details & Features →
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-6xl mx-auto bg-secondary-800">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-volt-400">What You'll Love</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">AI-Optimized Listings</h3>
            <p className="text-secondary-300 text-sm sm:text-base">We don't just submit—we optimize for visibility in every directory.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Multi-Platform Reach</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Google Business, Yelp, Apple Maps, Yellow Pages, and 500+ more.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Centralized Dashboard</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Track, update, and manage all listings from one clean interface.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Auto-Sync Updates</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Changed your info? We update every listing automatically.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-volt-400">What 500+ Businesses Are Saying</h2>
          
          {/* Social proof numbers */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-volt-400">500+</div>
              <div className="text-xs sm:text-sm text-secondary-400">Happy Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-volt-400">4.9⭐</div>
              <div className="text-xs sm:text-sm text-secondary-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-volt-400">98%</div>
              <div className="text-xs sm:text-sm text-secondary-400">Success Rate</div>
            </div>
          </div>
          <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
            <blockquote className="italic text-secondary-300 bg-secondary-700 p-4 sm:p-6 lg:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10 group hover:border-volt-500/30">
              <p className="text-sm sm:text-base lg:text-lg mb-4 group-hover:text-secondary-200 transition-colors">"DirectoryBolt found us 23 high-authority directories we never knew existed. Generated <span className="text-volt-400 font-bold">$15,247 in new revenue</span> in 60 days."</p>
              <cite className="text-volt-400 font-medium not-italic group-hover:text-volt-300 transition-colors">— Sarah Chen, Local Dental Practice</cite>
              <div className="mt-2 text-xs text-success-400 font-bold">ROI: 450%</div>
            </blockquote>
            <blockquote className="italic text-secondary-300 bg-secondary-700 p-4 sm:p-6 lg:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10 group hover:border-volt-500/30">
              <p className="text-sm sm:text-base lg:text-lg mb-4 group-hover:text-secondary-200 transition-colors">"We use DirectoryBolt for all our clients. The ROI is incredible—clients see results in weeks, not months."</p>
              <cite className="text-volt-400 font-medium not-italic group-hover:text-volt-300 transition-colors">— Jennifer Walsh, Marketing Agency CEO</cite>
              <div className="mt-2 text-xs text-success-400 font-bold">Client ROI: 600%</div>
            </blockquote>
            <div className="bg-volt-500/10 border border-volt-500/30 rounded-xl p-4 sm:p-6 mt-8 max-w-2xl mx-auto">
              <p className="font-semibold text-volt-400 text-base sm:text-lg mb-2">⭐ Rated 4.9/5 — Trusted by 500+ businesses</p>
              <p className="text-xs sm:text-sm text-secondary-300">Join the businesses already dominating their local markets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-volt-400 to-volt-600 text-secondary-900 relative overflow-hidden">
        
        {/* Background animation */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-volt-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-volt-300 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Urgency banner */}
          <div className="inline-flex items-center gap-2 bg-secondary-900/20 border border-secondary-900/30 px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-secondary-900 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-danger-500 rounded-full animate-ping"></div>
            487 businesses joined DirectoryBolt this month
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Let's Get You Found — Before Your Competitors</h2>
          <p className="mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">Stop being invisible. Start showing up where your ideal customers are searching. <span className="font-bold">Results guaranteed in 48 hours.</span></p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <StartTrialButton
              plan="growth"
              className="w-full sm:w-auto bg-secondary-900 text-volt-400 font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-secondary-800 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl border-2 border-volt-500 hover:border-volt-400 min-h-[56px] flex items-center justify-center"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=growth`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=growth`}
            >
              🚀 Start My Free Trial Today
            </StartTrialButton>
            
            <button
              onClick={() => typeof window !== 'undefined' && (window.location.href = '/analyze')}
              className="w-full sm:w-auto px-6 py-4 border-2 border-secondary-700 text-secondary-700 font-bold rounded-lg hover:border-secondary-800 hover:bg-secondary-800 hover:text-volt-400 transition-all duration-300 transform hover:scale-105 min-h-[56px] flex items-center justify-center"
            >
              🔍 Free Analysis First
            </button>
          </div>
          
          {/* Guarantee */}
          <div className="mt-8 bg-secondary-900/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-2xl mx-auto border border-secondary-900/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-secondary-900 text-xl sm:text-2xl">🛡️</span>
              <span className="font-bold text-base sm:text-lg">30-Day Money-Back Guarantee</span>
            </div>
            <p className="text-sm sm:text-base opacity-90">
              Get 5 new customers in 30 days or receive a full refund. No questions asked.
            </p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm opacity-90">
            <span>✅ No setup fees</span>
            <span>✅ Cancel anytime</span>
            <span>✅ Results guaranteed</span>
            <span>✅ Instant activation</span>
          </div>
        </div>
      </section>
    </div>
  )
}