'use client'
import { useState, useEffect } from 'react'
import { InteractiveDemo } from './InteractiveDemo'
import { WebsiteAnalyzer } from './WebsiteAnalyzer'
import { DirectorySelector } from './DirectorySelector'

export default function LandingPage() {
  const [currentStep, setCurrentStep] = useState<'hero' | 'demo' | 'analyzer' | 'selector'>('hero')
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
                <p className="text-sm text-secondary-300">Paying for ads while missing FREE directory traffic that converts</p>
              </div>
              
              <div className="bg-gradient-to-br from-danger-900/50 to-danger-800/30 p-6 rounded-xl border border-danger-700/50 backdrop-blur-sm">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-bold text-danger-300 mb-2">Zero Local Presence</h3>
                <p className="text-sm text-secondary-300">Not listed in the directories where customers actually search</p>
              </div>
            </div>
          </div>

          {/* Transformation Promise */}
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-8 rounded-2xl border border-volt-500/50 backdrop-blur-sm mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">
                  ⚡ Get Listed EVERYWHERE
                </span>
              </h2>
              <p className="text-lg md:text-xl text-secondary-200">
                Submit your business to <strong className="text-volt-400">500+ directories</strong> in minutes, not months
              </p>
            </div>
          </div>

          {/* CTA Buttons - VOLT YELLOW ENERGY */}
          <div className="animate-zoom-in" style={{ animationDelay: '0.9s' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setCurrentStep('demo')}
                className="group relative px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow"
              >
                <span className="relative z-10">🚀 See The Demo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-volt-400 to-volt-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button 
                onClick={() => setCurrentStep('analyzer')}
                className="px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
              >
                ⚡ Analyze My Website
              </button>
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          onClick={() => setCurrentStep('hero')}
          className="w-12 h-12 bg-volt-500 hover:bg-volt-400 text-secondary-900 rounded-full shadow-lg hover:shadow-volt-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold"
        >
          🏠
        </button>
        
        <button 
          onClick={() => setCurrentStep('analyzer')}
          className="w-12 h-12 bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-secondary-900 rounded-full shadow-lg hover:shadow-volt-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold animate-pulse-volt"
        >
          ⚡
        </button>
      </div>
    </div>
  )
}