import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// Import the API response types for consistency
interface DirectoryRecommendation {
  name: string
  authority: number
  estimatedTraffic: number
  submissionDifficulty: string
  cost: number
}

interface ApiAnalysisResponse {
  url: string
  title: string
  description: string
  currentListings: number
  missedOpportunities: number
  competitorAdvantage: number
  potentialLeads: number
  visibility: number
  seoScore: number
  issues: Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    description: string
    impact: string
    priority: number
  }>
  recommendations: Array<{
    action: string
    impact: string
    effort: 'low' | 'medium' | 'high'
  }>
  directoryOpportunities: DirectoryRecommendation[]
  aiAnalysis?: {
    businessProfile?: {
      name: string
      category: string
      industry: string
      targetAudience: string[]
      businessModel: string
    }
    smartRecommendations?: Array<{
      directory: string
      reasoning: string
      successProbability: number
      optimizedDescription: string
    }>
    insights?: {
      marketPosition: string
      competitiveAdvantages: string[]
      improvementSuggestions: string[]
      successFactors: string[]
    }
    confidence?: number
  }
}

interface StoredAnalysisResult {
  url: string
  data: ApiAnalysisResponse
  timestamp: number
}

export default function ResultsPage() {
  const router = useRouter()
  const { url } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<ApiAnalysisResponse | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadResults = async () => {
    try {
      // Try to load from sessionStorage first (from the analyze page)
      const storedResults = sessionStorage.getItem('analysisResults')
      if (storedResults) {
        const parsed: StoredAnalysisResult = JSON.parse(storedResults)
        
        // Check if results are still fresh (within 1 hour)
        if (Date.now() - parsed.timestamp < 3600000) {
          setResults(parsed.data)
          setIsLoading(false)
          return
        }
      }

      // If no stored results or they're stale, and we have a URL from query params, try to analyze
      if (url && typeof url === 'string') {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url,
            options: {
              deep: true,
              includeCompetitors: true,
              checkDirectories: true
            }
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const analysisResult = await response.json()
        if (analysisResult.success && analysisResult.data) {
          setResults(analysisResult.data)
          
          // Store results for potential reuse
          sessionStorage.setItem('analysisResults', JSON.stringify({
            url,
            data: analysisResult.data,
            timestamp: Date.now()
          }))
        } else {
          throw new Error('Analysis returned no data')
        }
      } else {
        throw new Error('No analysis data available. Please run an analysis first.')
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load results:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analysis results')
      setIsLoading(false)
    }
  }

  const getBusinessNameFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      return domain.replace('www.', '').split('.')[0]
        .replace(/[^a-zA-Z]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    } catch {
      return 'Your Business'
    }
  }

  const handleUpgrade = () => {
    // In a real app, this would redirect to a payment flow
    setShowUpgrade(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">🤖</div>
          <h1 className="text-2xl text-white font-bold mb-4">Finalizing Results...</h1>
          <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl text-white font-bold mb-4">Analysis Failed</h1>
          <p className="text-secondary-300 mb-6">{error || 'No analysis data available'}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/analyze')}
              className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 px-6 py-3 rounded-xl font-bold hover:from-volt-400 hover:to-volt-500 transition-all"
            >
              Start New Analysis
            </button>
            <button 
              onClick={() => router.push('/')}
              className="border-2 border-volt-500 text-volt-500 px-6 py-3 rounded-xl font-bold hover:bg-volt-500 hover:text-secondary-900 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Analysis Results - DirectoryBolt</title>
        <meta name="description" content="Your personalized directory recommendations and business analysis results." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
        {/* Volt Yellow Lightning Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500 rounded-full blur-3xl opacity-10 animate-pulse-volt"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-volt-400 rounded-full blur-3xl opacity-10 animate-pulse-volt" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Header */}
        <nav className="relative z-20 bg-secondary-900/80 backdrop-blur-sm border-b border-volt-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent animate-glow">
                  ⚡ DirectoryBolt
                </span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-secondary-300 hover:text-volt-400 transition-colors font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              Analysis Complete! 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600 animate-glow">
                🎉
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary-200 mb-6 max-w-3xl mx-auto font-medium">
              Here are your personalized directory recommendations for 
              <span className="text-volt-400 font-bold"> {results.aiAnalysis?.businessProfile?.name || results.title || 'Your Business'}</span>
            </p>
            
            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{results.visibility}%</div>
                <div className="text-sm text-secondary-300 font-medium">Visibility Score</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-success-500/30 p-6 hover:shadow-lg hover:shadow-success-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-success-400 mb-2">{results.seoScore}%</div>
                <div className="text-sm text-secondary-300 font-medium">SEO Score</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{results.directoryOpportunities?.length || 0}</div>
                <div className="text-sm text-secondary-300 font-medium">Directory Opportunities</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{results.potentialLeads}</div>
                <div className="text-sm text-secondary-300 font-medium">Potential Monthly Leads</div>
              </div>
            </div>

            {/* Business Profile Section */}
            {results.aiAnalysis?.businessProfile && (
              <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-2xl border border-volt-500/30 p-6 mb-8 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-volt-400 mb-4">🎯 Business Profile Detected</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-400">Industry:</span>
                    <div className="text-white font-semibold">{results.aiAnalysis.businessProfile.industry}</div>
                  </div>
                  <div>
                    <span className="text-secondary-400">Category:</span>
                    <div className="text-white font-semibold">{results.aiAnalysis.businessProfile.category}</div>
                  </div>
                  <div>
                    <span className="text-secondary-400">Business Model:</span>
                    <div className="text-white font-semibold">{results.aiAnalysis.businessProfile.businessModel}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Directory Opportunities */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-4xl font-black text-white">
                🎯 Top Directory Opportunities
                <span className="block text-lg font-medium text-secondary-300 mt-2">
                  Based on your website analysis and industry
                </span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {results.directoryOpportunities?.slice(0, 5).map((dir, index) => (
                <div 
                  key={index}
                  className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{index + 1}. {dir.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          dir.submissionDifficulty.toLowerCase() === 'easy' ? 'bg-success-500/20 text-success-300' :
                          dir.submissionDifficulty.toLowerCase() === 'medium' ? 'bg-volt-500/20 text-volt-300' :
                          'bg-danger-500/20 text-danger-300'
                        }`}>
                          {dir.submissionDifficulty}
                        </span>
                        <span className="px-3 py-1 bg-volt-500/20 text-volt-300 rounded-full text-xs font-bold">
                          Authority: {dir.authority}/100
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Est. Monthly Traffic:</span>
                          <div className="text-white font-semibold">{dir.estimatedTraffic.toLocaleString()}</div>
                        </div>
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Authority Score:</span>
                          <div className="text-white font-semibold">{dir.authority}/100</div>
                        </div>
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Submission Cost:</span>
                          <div className="text-white font-semibold">{dir.cost === 0 ? 'FREE' : `$${dir.cost}`}</div>
                        </div>
                      </div>

                      {/* AI Smart Recommendations */}
                      {results.aiAnalysis?.smartRecommendations && 
                       results.aiAnalysis.smartRecommendations.find(rec => rec.directory.toLowerCase().includes(dir.name.toLowerCase())) && (
                        <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-lg p-4 mt-4 border border-volt-500/20">
                          <h4 className="text-sm font-bold text-volt-400 mb-2">🤖 AI Insight:</h4>
                          <p className="text-sm text-secondary-200">
                            {results.aiAnalysis.smartRecommendations.find(rec => 
                              rec.directory.toLowerCase().includes(dir.name.toLowerCase())
                            )?.reasoning}
                          </p>
                          <div className="mt-2 text-xs text-volt-300">
                            Success Probability: {results.aiAnalysis.smartRecommendations.find(rec => 
                              rec.directory.toLowerCase().includes(dir.name.toLowerCase())
                            )?.successProbability}%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 lg:w-48">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ${
                        dir.cost === 0 
                          ? 'bg-success-500/20 text-success-400 border-success-500/30' 
                          : 'bg-volt-500/20 text-volt-400 border-volt-500/30'
                      }`}>
                        {dir.cost === 0 ? '🎯' : '💎'}
                      </div>
                      <span className={`font-bold text-sm ${
                        dir.cost === 0 ? 'text-success-400' : 'text-volt-400'
                      }`}>
                        {dir.cost === 0 ? 'FREE' : 'PREMIUM'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues and Recommendations */}
          {(results.issues?.length > 0 || results.recommendations?.length > 0) && (
            <div className="mb-12">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-6">
                📊 Analysis Insights
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Issues */}
                {results.issues?.length > 0 && (
                  <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-danger-500/30 p-6">
                    <h3 className="text-xl font-bold text-danger-400 mb-4">⚠️ Issues Found</h3>
                    <div className="space-y-3">
                      {results.issues.slice(0, 3).map((issue, index) => (
                        <div key={index} className="bg-danger-500/10 rounded-lg p-3 border border-danger-500/20">
                          <div className="flex items-start gap-3">
                            <span className={`text-lg ${
                              issue.type === 'critical' ? 'text-danger-400' :
                              issue.type === 'warning' ? 'text-volt-400' :
                              'text-secondary-400'
                            }`}>
                              {issue.type === 'critical' ? '🔥' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-sm">{issue.title}</h4>
                              <p className="text-xs text-secondary-300 mt-1">{issue.description}</p>
                              <span className="text-xs text-volt-300 font-medium">Impact: {issue.impact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {results.recommendations?.length > 0 && (
                  <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-success-500/30 p-6">
                    <h3 className="text-xl font-bold text-success-400 mb-4">✅ Recommended Actions</h3>
                    <div className="space-y-3">
                      {results.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="bg-success-500/10 rounded-lg p-3 border border-success-500/20">
                          <div className="flex items-start gap-3">
                            <span className={`text-lg ${
                              rec.effort === 'low' ? 'text-success-400' :
                              rec.effort === 'medium' ? 'text-volt-400' :
                              'text-danger-400'
                            }`}>
                              {rec.effort === 'low' ? '🎯' : rec.effort === 'medium' ? '⚡' : '🚀'}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-sm">{rec.action}</h4>
                              <p className="text-xs text-secondary-300 mt-1">Impact: {rec.impact}</p>
                              <span className="text-xs text-volt-300 font-medium">Effort: {rec.effort}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Upgrade Prompt with Volt Theme */}
          <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-2xl border border-volt-500/30 p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🚀</div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Want <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">ALL</span> Premium Recommendations?
            </h2>
            <p className="text-lg md:text-xl text-secondary-200 mb-8 max-w-3xl mx-auto font-medium">
              Unlock AI-powered descriptions, competitor analysis, and success probability scoring for 
              <span className="text-volt-400 font-bold"> maximum results</span>.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">{results.directoryOpportunities?.length || 100}+</div>
                <div className="text-sm text-secondary-300 font-medium">Premium Directories</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-success-400 mb-2">10x</div>
                <div className="text-sm text-secondary-300 font-medium">AI-Generated Descriptions</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">300%</div>
                <div className="text-sm text-secondary-300 font-medium">Higher Success Rate</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleUpgrade}
                className="group relative bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black py-4 px-8 text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-volt-500/50 animate-glow"
              >
                <span className="relative z-10">🚀 Upgrade to Pro - $149/mo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-volt-400 to-volt-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => router.push('/')}
                className="border-2 border-volt-500 text-volt-500 font-bold py-4 px-8 text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transition-all duration-300 transform hover:scale-105"
              >
                Maybe Later
              </button>
            </div>
            
            <div className="mt-6 text-sm text-secondary-300">
              💰 <strong className="text-volt-400">30-day money-back guarantee</strong> • Cancel anytime • <strong className="text-volt-400">Results guaranteed</strong>
            </div>

            {/* Social Proof */}
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 bg-success-500/10 border border-success-500/30 rounded-full px-4 py-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full border-2 border-secondary-800"></div>
                  ))}
                </div>
                <span className="text-sm text-success-300 font-medium">500+ businesses already upgraded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Upgrade Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-secondary-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-secondary-800/90 backdrop-blur-md rounded-2xl border border-volt-500/30 p-8 max-w-md w-full shadow-2xl animate-zoom-in">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h3 className="text-2xl font-black text-white mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">
                    Coming Soon!
                  </span>
                </h3>
                <p className="text-secondary-200 mb-6 font-medium">
                  We're putting the finishing touches on our Pro features. Join the waitlist to be first in line for 
                  <span className="text-volt-400 font-bold"> exclusive early access!</span>
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black py-3 px-6 rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105"
                  >
                    Join Waitlist
                  </button>
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 border-2 border-secondary-600 text-secondary-300 font-bold py-3 px-6 rounded-xl hover:bg-secondary-600 hover:text-white transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}