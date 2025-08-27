import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface DirectoryRecommendation {
  id: number
  name: string
  category: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedTraffic: string
  successRate: number
  submissionTips: string[]
  pricing: 'Free' | 'Paid' | 'Freemium'
  timeToApproval: string
}

interface AnalysisResult {
  businessName: string
  industry: string
  websiteHealth: number
  seoScore: number
  recommendations: DirectoryRecommendation[]
  totalDirectories: number
  freeRecommendations: number
  proRecommendations: number
}

export default function ResultsPage() {
  const router = useRouter()
  const { url } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (url) {
      loadResults()
    }
  }, [url])

  const loadResults = async () => {
    try {
      // Simulate API call with realistic data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResults: AnalysisResult = {
        businessName: getBusinessNameFromUrl(url as string),
        industry: 'Technology',
        websiteHealth: 78,
        seoScore: 82,
        totalDirectories: 147,
        freeRecommendations: 3,
        proRecommendations: 15,
        recommendations: [
          {
            id: 1,
            name: 'Google My Business',
            category: 'Local Search',
            description: 'Essential for local visibility and customer reviews',
            difficulty: 'Easy',
            estimatedTraffic: '500-2,000/month',
            successRate: 95,
            submissionTips: ['Verify business address', 'Add photos', 'Complete all fields'],
            pricing: 'Free',
            timeToApproval: '1-3 days'
          },
          {
            id: 2,
            name: 'Yelp Business',
            category: 'Reviews',
            description: 'Critical for customer reviews and local search',
            difficulty: 'Easy',
            estimatedTraffic: '200-800/month',
            successRate: 88,
            submissionTips: ['Claim existing listing', 'Add business hours', 'Respond to reviews'],
            pricing: 'Free',
            timeToApproval: '1-2 days'
          },
          {
            id: 3,
            name: 'Product Hunt',
            category: 'Tech',
            description: 'Perfect for SaaS and tech startups launching new products',
            difficulty: 'Medium',
            estimatedTraffic: '1,000-5,000/month',
            successRate: 72,
            submissionTips: ['Prepare launch assets', 'Build email list', 'Time launch carefully'],
            pricing: 'Free',
            timeToApproval: '1-2 weeks'
          }
        ]
      }
      
      setResults(mockResults)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load results:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="text-2xl text-white font-bold mb-4">Finalizing Results...</h1>
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl text-white font-bold mb-4">Analysis Failed</h1>
          <button 
            onClick={() => router.push('/analyze')}
            className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold"
          >
            Try Again
          </button>
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  ⚡ DirectoryBolt
                </span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Analysis Complete! 🎉
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Here are your personalized directory recommendations for <span className="text-yellow-400 font-semibold">{results.businessName}</span>
            </p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="text-2xl font-bold text-yellow-400">{results.websiteHealth}</div>
                <div className="text-sm text-gray-400">Website Health</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="text-2xl font-bold text-green-400">{results.seoScore}</div>
                <div className="text-sm text-gray-400">SEO Score</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="text-2xl font-bold text-blue-400">{results.totalDirectories}</div>
                <div className="text-sm text-gray-400">Total Directories</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="text-2xl font-bold text-purple-400">{results.industry}</div>
                <div className="text-sm text-gray-400">Industry</div>
              </div>
            </div>
          </div>

          {/* Free Recommendations */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                🎯 Top {results.freeRecommendations} Directories (Free Preview)
              </h2>
            </div>
            
            <div className="space-y-6">
              {results.recommendations.map((rec, index) => (
                <div 
                  key={rec.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{index + 1}. {rec.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rec.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                          rec.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {rec.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold">
                          {rec.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{rec.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-400">Est. Traffic:</span>
                          <div className="text-white font-semibold">{rec.estimatedTraffic}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Success Rate:</span>
                          <div className="text-white font-semibold">{rec.successRate}%</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Approval Time:</span>
                          <div className="text-white font-semibold">{rec.timeToApproval}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm text-gray-400">Quick Tips:</span>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {rec.submissionTips.map((tip, tipIndex) => (
                            <li key={tipIndex}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 lg:w-48">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                        rec.pricing === 'Free' ? 'bg-green-500/20 text-green-400' :
                        rec.pricing === 'Paid' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {rec.pricing === 'Free' ? '🎯' : rec.pricing === 'Paid' ? '💎' : '⚡'}
                      </div>
                      <span className={`font-bold text-sm ${
                        rec.pricing === 'Free' ? 'text-green-400' :
                        rec.pricing === 'Paid' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {rec.pricing}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Prompt */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-2xl border border-yellow-400/20 p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Want All {results.proRecommendations} Premium Recommendations?
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              Unlock AI-powered descriptions, competitor analysis, and success probability scoring for maximum results.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{results.proRecommendations}</div>
                <div className="text-sm text-gray-400">Premium Directories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">10x</div>
                <div className="text-sm text-gray-400">AI-Generated Descriptions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">40%</div>
                <div className="text-sm text-gray-400">Higher Success Rate</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 text-lg rounded-xl hover:shadow-lg hover:shadow-yellow-400/25 transition-all transform hover:scale-105"
              >
                🚀 Upgrade to Pro - $149/mo
              </button>
              <button
                onClick={() => router.push('/')}
                className="border-2 border-yellow-400 text-yellow-400 font-bold py-4 px-8 text-lg rounded-xl hover:bg-yellow-400 hover:text-black transition-all"
              >
                Maybe Later
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              💰 30-day money-back guarantee • Cancel anytime
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Coming Soon!
                </h3>
                <p className="text-gray-300 mb-6">
                  We're putting the finishing touches on our Pro features. Join the waitlist to be first in line!
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg"
                  >
                    Join Waitlist
                  </button>
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 border border-gray-600 text-gray-300 font-bold py-3 px-6 rounded-lg"
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