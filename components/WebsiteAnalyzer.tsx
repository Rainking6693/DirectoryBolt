'use client'
import { useState, useEffect } from 'react'

interface WebsiteAnalyzerProps {
  onNext: () => void
}

interface AnalysisResult {
  currentListings: number
  missedOpportunities: number
  competitorAdvantage: number
  potentialLeads: number
  visibility: number
  issues: Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    description: string
    impact: string
  }>
}

export function WebsiteAnalyzer({ onNext }: WebsiteAnalyzerProps) {
  const [website, setWebsite] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const analysisSteps = [
    'Scanning your website...',
    'Checking directory listings...',
    'Analyzing competitor presence...',
    'Calculating missed opportunities...',
    'Generating optimization report...'
  ]

  const analyzeWebsite = async () => {
    if (!website) return

    setIsAnalyzing(true)
    setProgress(0)
    setResults(null)
    setShowResults(false)

    // Simulate comprehensive analysis with smooth progress
    for (let i = 0; i < analysisSteps.length; i++) {
      setCurrentStep(analysisSteps[i])
      
      // Smooth progress animation
      const stepProgress = ((i + 1) / analysisSteps.length) * 100
      let currentProgress = progress
      
      const progressInterval = setInterval(() => {
        currentProgress += 2
        if (currentProgress >= stepProgress) {
          setProgress(stepProgress)
          clearInterval(progressInterval)
        } else {
          setProgress(currentProgress)
        }
      }, 50)
      
      // Wait for step completion
      await new Promise(resolve => setTimeout(resolve, 1500))
      clearInterval(progressInterval)
      setProgress(stepProgress)
    }

    // Generate realistic results based on website
    const mockResults: AnalysisResult = {
      currentListings: Math.floor(Math.random() * 15) + 3,
      missedOpportunities: Math.floor(Math.random() * 400) + 200,
      competitorAdvantage: Math.floor(Math.random() * 300) + 100,
      potentialLeads: Math.floor(Math.random() * 80) + 40,
      visibility: Math.floor(Math.random() * 30) + 10,
      issues: [
        {
          type: 'critical',
          title: 'Missing from 89% of Key Directories',
          description: 'Your business is not listed in major directories where customers search daily',
          impact: 'Losing 150+ potential customers per month'
        },
        {
          type: 'critical',
          title: 'Competitors Dominate Local Search',
          description: 'Competitors have 5x more directory listings than your business',
          impact: 'They capture 80% of local search traffic'
        },
        {
          type: 'warning',
          title: 'Inconsistent Business Information',
          description: 'Your NAP (Name, Address, Phone) varies across existing listings',
          impact: 'Confuses search engines and customers'
        },
        {
          type: 'info',
          title: 'Zero Reviews in Most Directories',
          description: 'Missing reviews in 47+ directories where customers make decisions',
          impact: 'Lower trust and conversion rates'
        }
      ]
    }

    setResults(mockResults)
    setIsAnalyzing(false)
    
    // Show results with animation delay
    setTimeout(() => setShowResults(true), 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    analyzeWebsite()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12 animate-slide-down">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">
              🔍 Website Analysis
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-secondary-300">
            See exactly where you&apos;re losing customers to competitors
          </p>
        </div>

        {!isAnalyzing && !results && (
          <div className="animate-zoom-in">
            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="bg-secondary-800 p-8 rounded-2xl border border-secondary-700 backdrop-blur-sm">
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-secondary-200 mb-4">
                    Enter your website URL for instant analysis:
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-6 py-4 bg-secondary-900 border-2 border-secondary-600 rounded-xl text-white text-lg focus:border-volt-500 focus:outline-none transition-all duration-300"
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-volt-500">
                      🌐
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!website}
                  className="group relative px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 disabled:opacity-50 disabled:cursor-not-allowed animate-glow"
                >
                  <span className="relative z-10">⚡ Analyze My Website FREE</span>
                </button>
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-700">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-bold text-volt-400 mb-2">100% Secure</h3>
                <p className="text-sm text-secondary-400">We never store your data or spam you</p>
              </div>
              
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-700">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-bold text-volt-400 mb-2">Instant Results</h3>
                <p className="text-sm text-secondary-400">Complete analysis in under 30 seconds</p>
              </div>
              
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-700">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold text-volt-400 mb-2">Action Plan Included</h3>
                <p className="text-sm text-secondary-400">Get specific steps to dominate your market</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="animate-zoom-in">
            <div className="bg-secondary-800 p-8 rounded-2xl border border-secondary-700 backdrop-blur-sm">
              <div className="mb-6">
                <div className="text-2xl font-bold text-volt-400 mb-4">{currentStep}</div>
                
                {/* Progress Bar */}
                <div className="bg-secondary-700 rounded-full h-3 mb-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-volt-500 to-volt-600 transition-all duration-500 rounded-full animate-glow"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="text-lg text-secondary-300">{Math.round(progress)}% Complete</div>
              </div>
              
              {/* Scanning Animation */}
              <div className="flex justify-center items-center space-x-2">
                <div className="w-4 h-4 bg-volt-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-4 h-4 bg-volt-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-4 h-4 bg-volt-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {results && showResults && (
          <div className="animate-slide-up space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-danger-900/30 to-danger-800/20 p-4 rounded-xl border border-danger-500/30">
                <div className="text-2xl font-bold text-danger-400">{results.currentListings}</div>
                <div className="text-sm text-secondary-400">Current Listings</div>
              </div>
              
              <div className="bg-gradient-to-br from-volt-900/30 to-volt-800/20 p-4 rounded-xl border border-volt-500/30">
                <div className="text-2xl font-bold text-volt-400">{results.missedOpportunities}</div>
                <div className="text-sm text-secondary-400">Missed Opportunities</div>
              </div>
              
              <div className="bg-gradient-to-br from-danger-900/30 to-danger-800/20 p-4 rounded-xl border border-danger-500/30">
                <div className="text-2xl font-bold text-danger-400">{results.competitorAdvantage}%</div>
                <div className="text-sm text-secondary-400">Competitor Advantage</div>
              </div>
              
              <div className="bg-gradient-to-br from-success-900/30 to-success-800/20 p-4 rounded-xl border border-success-500/30">
                <div className="text-2xl font-bold text-success-400">+{results.potentialLeads}</div>
                <div className="text-sm text-secondary-400">Potential Monthly Leads</div>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="bg-secondary-800 p-6 rounded-xl border border-secondary-700">
              <h3 className="text-2xl font-bold text-danger-400 mb-6 flex items-center gap-3">
                🚨 Critical Issues Found
              </h3>
              
              <div className="space-y-4">
                {results.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      issue.type === 'critical' 
                        ? 'bg-danger-900/20 border-danger-500/30' 
                        : issue.type === 'warning'
                        ? 'bg-yellow-900/20 border-yellow-500/30'
                        : 'bg-secondary-700/30 border-secondary-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {issue.type === 'critical' ? '🔥' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-2">{issue.title}</h4>
                        <p className="text-secondary-300 mb-2">{issue.description}</p>
                        <div className="text-sm text-danger-400 font-semibold">💸 Impact: {issue.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution CTA */}
            <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-8 rounded-xl border border-volt-500/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-volt-400 mb-4">
                ⚡ Ready to Fix These Issues?
              </h3>
              <p className="text-lg text-secondary-200 mb-6">
                We&apos;ll list your business in 500+ directories and fix all these problems automatically
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={onNext}
                  className="group relative px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow"
                >
                  <span className="relative z-10">🚀 Show Me The Directories</span>
                </button>
                
                <button 
                  onClick={() => {
                    setResults(null)
                    setShowResults(false)
                    setWebsite('')
                  }}
                  className="px-6 py-3 border-2 border-volt-500 text-volt-500 font-bold rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
                >
                  🔄 Analyze Another Site
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}