'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { InteractiveDemo } from './InteractiveDemo'
import { WebsiteAnalyzer } from './WebsiteAnalyzer'
import { DirectorySelector } from './DirectorySelector'

export default function LandingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'hero' | 'pricing' | 'demo' | 'analyzer' | 'selector'>('hero')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white overflow-hidden">
      {/* Hero Section - Problem/Agitation */}
      <section className={`relative min-h-screen flex items-center justify-center px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Volt Yellow Lightning Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500 rounded-full blur-3xl opacity-10 animate-pulse-volt"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-volt-400 rounded-full blur-3xl opacity-10 animate-pulse-volt" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-volt-600 rounded-full blur-3xl opacity-5 animate-float"></div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Problem Headline - HIGH IMPACT */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              Your Business Is
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600 animate-glow">
                INVISIBLE ONLINE
              </span>
            </h1>
            
            <div className="text-xl md:text-2xl lg:text-3xl text-danger-400 font-bold mb-8 animate-shake">
              📉 While competitors dominate search results
            </div>
          </div>

          {/* Agitation - Pain Points */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-danger-900/50 to-danger-800/30 p-6 rounded-xl border border-danger-700/50 backdrop-blur-sm">
                <div className="text-4xl mb-4">😱</div>
                <h3 className="text-lg font-bold text-danger-300 mb-2">Lost Customers</h3>
                <p className="text-sm text-secondary-300">Potential clients can&apos;t find your business when they&apos;re ready to buy</p>
              </div>
              
              <div className="bg-gradient-to-br from-danger-900/50 to-danger-800/30 p-6 rounded-xl border border-danger-700/50 backdrop-blur-sm">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-lg font-bold text-danger-300 mb-2">Wasted Ad Spend</h3>
                <p className="text-sm text-secondary-300">Paying for clicks while competitors get found organically</p>
              </div>
              
              <div className="bg-gradient-to-br from-danger-900/50 to-danger-800/30 p-6 rounded-xl border border-danger-700/50 backdrop-blur-sm">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="text-lg font-bold text-danger-300 mb-2">Time Drain</h3>
                <p className="text-sm text-secondary-300">Hours wasted on manual directory submissions that don&apos;t work</p>
              </div>
            </div>
          </div>

          {/* Solution Hook */}
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="bg-gradient-to-r from-success-900/50 to-success-800/30 p-8 rounded-2xl border border-success-600/50 backdrop-blur-sm mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                <span className="text-success-400">✅</span> The Solution: Get Listed in 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600 font-black">
                  500+ Directories
                </span>
              </h2>
              <p className="text-lg md:text-xl text-secondary-200">
                Submit your business to <strong className="text-volt-400">500+ directories</strong> in minutes, not months
              </p>
            </div>
          </div>

          {/* UPDATED CTA Buttons - Commercial Focus */}
          <div className="animate-zoom-in" style={{ animationDelay: '0.9s' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => router.push('/analyze')}
                className="group relative px-10 py-5 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-xl rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow"
              >
                <span className="relative z-10">🚀 Start Free Trial - $49/mo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-volt-400 to-volt-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/analyze')}
                className="px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
              >
                ⚡ Free Analysis First
              </button>
            </div>
            
            {/* Money-back guarantee */}
            <div className="mt-4 text-sm text-secondary-300">
              💰 <strong className="text-volt-400">30-day money-back guarantee</strong> • Cancel anytime
            </div>
          </div>

          {/* Social Proof */}
          <div className="animate-fade-in mt-12" style={{ animationDelay: '1.2s' }}>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full border-2 border-secondary-800"></div>
                  ))}
                </div>
                <span className="text-sm">500+ businesses boosted</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-volt-400">⭐⭐⭐⭐⭐</div>
                <span className="text-sm">4.9/5 rating</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-volt-400">⚡</div>
                <span className="text-sm">2-minute setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="w-6 h-10 border-2 border-volt-500 rounded-full p-1">
            <div className="w-1 h-3 bg-volt-500 rounded-full animate-pulse-volt"></div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION - CRITICAL FOR CONVERSION */}
      {currentStep === 'pricing' && (
        <section className="min-h-screen flex items-center justify-center px-4 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Pricing Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black mb-6">
                Choose Your 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">
                  Growth Plan
                </span>
              </h2>
              <p className="text-xl text-secondary-300 mb-8">
                Stop losing customers to competitors. Get listed everywhere that matters.
              </p>
              <div className="inline-flex bg-secondary-800 p-1 rounded-full">
                <span className="px-4 py-2 bg-volt-500 text-secondary-900 font-bold rounded-full text-sm">
                  💰 Save 20% with annual billing
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              
              {/* Basic Plan */}
              <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-8 rounded-2xl border border-secondary-600 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Basic</h3>
                  <div className="text-4xl font-black mb-4">
                    <span className="text-volt-400">$49</span>
                    <span className="text-lg text-secondary-400">/month</span>
                  </div>
                  <p className="text-secondary-300 mb-6">Perfect for small businesses getting started</p>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">✅</span>
                      <span>25 premium directories</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">✅</span>
                      <span>Basic website analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">✅</span>
                      <span>Email support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">✅</span>
                      <span>Monthly reporting</span>
                    </li>
                  </ul>

                  <div className="bg-secondary-700 p-4 rounded-lg mb-6">
                    <div className="text-sm text-volt-400 font-bold mb-2">💰 ROI Projection:</div>
                    <div className="text-sm text-secondary-300">
                      • Save 20+ hours/month<br/>
                      • +15% local search visibility<br/>
                      • Avg. 3-5 new customers/month
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/analyze')}
                    className="w-full py-3 bg-secondary-700 text-white font-bold rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Start Free Trial
                  </button>
                </div>
              </div>

              {/* Pro Plan - MOST POPULAR */}
              <div className="bg-gradient-to-br from-volt-500/20 to-volt-600/10 p-8 rounded-2xl border-2 border-volt-500 backdrop-blur-sm transform scale-105 hover:scale-110 transition-all duration-300 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-volt-500 text-secondary-900 font-black px-6 py-2 rounded-full text-sm">
                    🔥 MOST POPULAR
                  </span>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-2">Pro</h3>
                  <div className="text-5xl font-black mb-4">
                    <span className="text-volt-400">$149</span>
                    <span className="text-lg text-secondary-400">/month</span>
                  </div>
                  <p className="text-secondary-300 mb-6">AI-powered optimization for serious growth</p>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">🚀</span>
                      <span><strong>100+ premium directories</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">🤖</span>
                      <span><strong>AI-powered optimization</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">📈</span>
                      <span>Success rate predictions</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">✨</span>
                      <span>10 optimized descriptions per directory</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">🎯</span>
                      <span>Competitor analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-volt-400">📞</span>
                      <span>Priority phone support</span>
                    </li>
                  </ul>

                  <div className="bg-volt-500/10 border border-volt-500/30 p-4 rounded-lg mb-6">
                    <div className="text-sm text-volt-400 font-bold mb-2">🎯 ROI Projection:</div>
                    <div className="text-sm text-secondary-300">
                      • Save 50+ hours/month<br/>
                      • +40% search visibility increase<br/>
                      • Avg. 15-25 new customers/month<br/>
                      • <strong className="text-volt-400">ROI: 300-500%</strong>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/analyze')}
                    className="w-full py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-lg hover:from-volt-400 hover:to-volt-500 transition-all"
                  >
                    Start Pro Trial 🚀
                  </button>
                </div>
              </div>

              {/* Agency Plan */}
              <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 p-8 rounded-2xl border border-secondary-600 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Agency</h3>
                  <div className="text-4xl font-black mb-4">
                    <span className="text-volt-400">$399</span>
                    <span className="text-lg text-secondary-400">/month</span>
                  </div>
                  <p className="text-secondary-300 mb-6">White-label solution for agencies & consultants</p>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">♾️</span>
                      <span><strong>Unlimited websites</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">🏷️</span>
                      <span><strong>White-label branding</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">👥</span>
                      <span>Team collaboration tools</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">📊</span>
                      <span>Advanced analytics dashboard</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">🔧</span>
                      <span>API access</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-success-400">📞</span>
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>

                  <div className="bg-secondary-700 p-4 rounded-lg mb-6">
                    <div className="text-sm text-volt-400 font-bold mb-2">💼 Agency Value:</div>
                    <div className="text-sm text-secondary-300">
                      • Serve unlimited clients<br/>
                      • Charge $500-2000/client<br/>
                      • Complete automation<br/>
                      • <strong className="text-volt-400">Revenue: $10K+/month</strong>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/analyze')}
                    className="w-full py-3 bg-secondary-700 text-white font-bold rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom CTA and Guarantee */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-8 rounded-2xl border border-volt-500/30 mb-8">
                <h3 className="text-2xl font-bold mb-4">
                  🚀 Ready to dominate local search?
                </h3>
                <p className="text-lg text-secondary-300 mb-6">
                  Join 500+ businesses already crushing their competition
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button 
                    onClick={() => router.push('/analyze')}
                    className="px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300"
                  >
                    Start Free Analysis
                  </button>
                  <span className="text-secondary-400">or</span>
                  <button 
                    onClick={() => setCurrentStep('demo')}
                    className="px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
                  >
                    See Live Demo
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-secondary-400">
                <span>✅ 30-day money-back guarantee</span>
                <span>✅ Cancel anytime</span>
                <span>✅ No setup fees</span>
                <span>✅ Results in 30 days or refund</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Demo Section */}
      {currentStep === 'demo' && (
        <section className="min-h-screen">
          <InteractiveDemo onNext={() => setCurrentStep('analyzer')} />
        </section>
      )}

      {/* Website Analyzer Section */}
      {currentStep === 'analyzer' && (
        <section className="min-h-screen">
          <WebsiteAnalyzer onNext={() => setCurrentStep('selector')} />
        </section>
      )}

      {/* Directory Selector Section */}
      {currentStep === 'selector' && (
        <section className="min-h-screen">
          <DirectorySelector />
        </section>
      )}

      {/* Enhanced Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          onClick={() => setCurrentStep('pricing')}
          className="w-14 h-14 bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-secondary-900 rounded-full shadow-lg hover:shadow-volt-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold animate-pulse-volt"
          title="View Pricing"
        >
          💰
        </button>
        
        <button 
          onClick={() => setCurrentStep('hero')}
          className="w-12 h-12 bg-volt-500 hover:bg-volt-400 text-secondary-900 rounded-full shadow-lg hover:shadow-volt-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold"
          title="Back to Home"
        >
          🏠
        </button>
        
        <button 
          onClick={() => router.push('/analyze')}
          className="w-12 h-12 bg-secondary-700 hover:bg-secondary-600 text-volt-400 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold"
          title="Free Analysis"
        >
          ⚡
        </button>
      </div>
    </div>
  )
}