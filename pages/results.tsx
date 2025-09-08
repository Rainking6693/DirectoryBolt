import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import CheckoutButton from '../components/CheckoutButton'
import { generatePDFReport, generateCSVExport } from '../lib/utils/export-utils'

// Disable static generation to avoid NextRouter SSG errors
export async function getServerSideProps() {
  return {
    props: {}
  }
}

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
  tier?: string
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
  const [mounted, setMounted] = useState(false)
  const [url, setUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<ApiAnalysisResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const urlFromQuery = router.query.url as string
      setUrl(urlFromQuery || '')
      loadResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

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
        
        if (analysisResult.success) {
          // Handle both direct analysis data and structured response data
          const analysisData = analysisResult.data || analysisResult
          
          // If this is a progress response (status: 'initiated'), handle it differently
          if (analysisData.status === 'initiated') {
            // This is a progress-based response, we need to poll for results
            await pollForResults(analysisData.analysisId)
            return
          }
          
          // Transform the data to ensure consistent structure
          const normalizedData = normalizeAnalysisData(analysisData)
          setResults(normalizedData)
          
          // Store results for potential reuse
          sessionStorage.setItem('analysisResults', JSON.stringify({
            url,
            data: normalizedData,
            timestamp: Date.now()
          }))
        } else {
          throw new Error(analysisResult.error || 'Analysis returned no data')
        }
      } else {
        throw new Error('No analysis data available. Please run an analysis first.')
      }
      
      setIsLoading(false)
    } catch (error) {
      // Error handling - logged in API layer
      setError(error instanceof Error ? error.message : 'Failed to load analysis results')
      setIsLoading(false)
    }
  }

  const normalizeAnalysisData = (data: any): ApiAnalysisResponse => {
    // Handle both old and new response formats
    return {
      url: data.url || data.website?.url || '',
      title: data.title || data.website?.title || 'Unknown Website',
      description: data.description || data.website?.description || 'No description available',
      currentListings: Array.isArray(data.currentListings) ? data.currentListings.length : (data.directories?.currentListings?.length || 0),
      missedOpportunities: data.missedOpportunities || (data.directoryOpportunities?.filter((d: any) => !d.listed)?.length || 0),
      competitorAdvantage: data.competitorAdvantage || 0,
      potentialLeads: data.potentialLeads || 0,
      visibility: data.visibility || data.metrics?.visibilityScore || 0,
      seoScore: data.seoScore || data.seo?.score || 0,
      issues: data.issues || [],
      recommendations: data.recommendations || [],
      directoryOpportunities: data.directoryOpportunities || data.directories?.opportunities || [],
      aiAnalysis: data.aiAnalysis || data.ai
    }
  }

  const pollForResults = async (requestId: string): Promise<void> => {
    const maxAttempts = 30 // 5 minutes max (10 seconds * 30)
    let attempts = 0
    
    const poll = async (): Promise<void> => {
      try {
        attempts++
        const response = await fetch(`/api/analyze/progress?requestId=${requestId}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          if (result.data.status === 'completed') {
            // Analysis is complete, get the final results
            const normalizedData = normalizeAnalysisData(result.data.result || result.data)
            setResults(normalizedData)
            
            // Store results for potential reuse
            sessionStorage.setItem('analysisResults', JSON.stringify({
              url: result.data.url,
              data: normalizedData,
              timestamp: Date.now()
            }))
            return
          } else if (result.data.status === 'failed') {
            throw new Error(result.data.error || 'Analysis failed')
          }
          
          // Continue polling if still in progress
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000) // Poll every 10 seconds
          } else {
            throw new Error('Analysis timed out')
          }
        } else {
          throw new Error('Failed to get analysis progress')
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Retry after 10 seconds
        } else {
          throw error
        }
      }
    }
    
    // Start polling
    poll()
  }

  const _getBusinessNameFromUrl = (url: string): string => {
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

  const getSuccessUrl = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=professional&source=results`
  }

  const getCancelUrl = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/results?cancelled=true&plan=professional`
  }

  const handlePDFExport = async () => {
    if (!results) return
    
    setIsExporting(true)
    try {
      const businessName = results.aiAnalysis?.businessProfile?.name || results.title || 'Business'
      await generatePDFReport(results, businessName)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCSVExport = () => {
    if (!results) return
    
    setIsExporting(true)
    try {
      const businessName = results.aiAnalysis?.businessProfile?.name || results.title || 'Business'
      generateCSVExport(results, businessName)
    } catch (error) {
      console.error('CSV export failed:', error)
      alert('CSV export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">🤖</div>
          <h1 className="text-2xl text-white font-bold mb-4">{!mounted ? 'Loading...' : 'Finalizing Results...'}</h1>
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
              onClick={() => mounted && router.push('/analyze')}
              className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 px-6 py-3 rounded-xl font-bold hover:from-volt-400 hover:to-volt-500 transition-all"
            >
              Start New Analysis
            </button>
            <button 
              onClick={() => mounted && router.push('/')}
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
        <title>Website Analysis Results - DirectoryBolt | Personalized Directory Recommendations</title>
        <meta name="description" content="Your personalized directory recommendations and business analysis results. Discover the best directories for your business with AI-powered insights and optimization suggestions." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://directorybolt.com/results" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="analysis results, directory recommendations, business analysis results, website audit results, SEO analysis results, directory opportunities, business visibility report" />
        <meta name="author" content="DirectoryBolt" />
        <meta name="publisher" content="DirectoryBolt" />
        <meta name="copyright" content="DirectoryBolt" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Website Analysis Results - Personalized Directory Recommendations" />
        <meta property="og:description" content="Get your personalized directory recommendations and business analysis results with AI-powered insights." />
        <meta property="og:image" content="https://directorybolt.com/images/results-og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://directorybolt.com/results" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="DirectoryBolt" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Website Analysis Results - DirectoryBolt" />
        <meta name="twitter:description" content="Your personalized directory recommendations and business analysis results." />
        <meta name="twitter:image" content="https://directorybolt.com/images/results-twitter-card.jpg" />
        <meta name="twitter:creator" content="@DirectoryBolt" />
        <meta name="twitter:site" content="@DirectoryBolt" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        
        {/* Dynamic Structured Data based on results */}
        {results && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org/",
                "@type": "WebPage",
                "name": "Analysis Results - DirectoryBolt",
                "description": "Personalized directory recommendations and business analysis results.",
                "url": "https://directorybolt.com/results",
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "https://directorybolt.com/"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Analyze",
                      "item": "https://directorybolt.com/analyze"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "Results",
                      "item": "https://directorybolt.com/results"
                    }
                  ]
                },
                "mainEntity": {
                  "@type": "AnalysisReport",
                  "name": `Analysis Report for ${results.aiAnalysis?.businessProfile?.name || results.title || 'Business'}`,
                  "description": "Comprehensive website analysis report with directory recommendations",
                  "author": {
                    "@type": "Organization",
                    "name": "DirectoryBolt"
                  },
                  "datePublished": new Date().toISOString(),
                  "about": {
                    "@type": "WebSite",
                    "name": results.aiAnalysis?.businessProfile?.name || results.title || 'Business Website',
                    "url": results.url
                  }
                }
              })
            }}
          />
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
        {/* Volt Yellow Lightning Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500 rounded-full blur-3xl opacity-10 animate-pulse-volt"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-volt-400 rounded-full blur-3xl opacity-10 animate-pulse-volt" style={{ animationDelay: '1s' }}></div>
        </div>

        <Header showBackButton={true} />

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
            
            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handlePDFExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-danger-500 to-danger-600 text-white font-bold px-6 py-3 rounded-xl hover:from-danger-400 hover:to-danger-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📄</span>
                )}
                Export PDF Report
              </button>
              <button
                onClick={handleCSVExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-success-500 to-success-600 text-white font-bold px-6 py-3 rounded-xl hover:from-success-400 hover:to-success-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📊</span>
                )}
                Export CSV Data
              </button>
            </div>

            {/* Tier Status Banner */}
            {results.tier === 'Free Analysis' && (
              <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/10 border border-volt-500/30 rounded-xl p-6 mb-8 text-center">
                <h3 className="text-xl font-bold text-volt-400 mb-2">🔓 Free Analysis Results</h3>
                <p className="text-secondary-200 mb-4">
                  You're seeing limited results. Upgrade to unlock the full $4,300 worth of business intelligence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <CheckoutButton
                    plan="growth"
                    className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold px-6 py-3 rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300"
                    successUrl={getSuccessUrl()}
                    cancelUrl={getCancelUrl()}
                  >
                    🚀 Unlock Full Analysis - $299
                  </CheckoutButton>
                </div>
              </div>
            )}

            {/* Enhanced Key Metrics */}
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">
              Your Website Metrics {results.tier !== 'Free Analysis' && <span className="text-volt-400">✨ Enhanced</span>}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{Math.round(results.visibility || 0)}%</div>
                <div className="text-sm text-secondary-300 font-medium">Visibility Score</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-success-500/30 p-6 hover:shadow-lg hover:shadow-success-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-success-400 mb-2">{Math.round(results.seoScore || 0)}%</div>
                <div className="text-sm text-secondary-300 font-medium">SEO Score</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{results.directoryOpportunities?.length || results.missedOpportunities || 0}</div>
                <div className="text-sm text-secondary-300 font-medium">Directory Opportunities</div>
              </div>
              <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300">
                <div className="text-3xl font-black text-volt-400 mb-2">{(results.potentialLeads || 0).toLocaleString()}{results.potentialLeads && results.potentialLeads > 1000 ? '+' : ''}</div>
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
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-white">
                Directory Opportunities
                {results.tier === 'Free Analysis' && (
                  <span className="text-sm font-normal text-volt-400 block mt-2">
                    Showing {results.directoryOpportunities?.length || 0} of 250+ available
                  </span>
                )}
              </h2>
              <p className="text-center text-secondary-300 mb-8 max-w-2xl mx-auto">
                {results.tier === 'Free Analysis' 
                  ? 'Preview of AI-selected directories. Upgrade to see all opportunities with success probabilities.'
                  : 'AI-selected directories with the highest success probability for your business'
                }
              </p>
            <div className="space-y-6">
              {results.directoryOpportunities?.slice(0, 8).map((dir, index) => (
                <div 
                  key={index}
                  className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{index + 1}. {dir.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          dir.submissionDifficulty?.toLowerCase() === 'easy' ? 'bg-success-500/20 text-success-300' :
                          dir.submissionDifficulty?.toLowerCase() === 'medium' ? 'bg-volt-500/20 text-volt-300' :
                          'bg-danger-500/20 text-danger-300'
                        }`}>
                          {dir.submissionDifficulty || 'Medium'}
                        </span>
                        <span className="px-3 py-1 bg-volt-500/20 text-volt-300 rounded-full text-xs font-bold">
                          Authority: {dir.authority || 0}/100
                        </span>
                        {dir.cost !== undefined && (
                          <span className="px-3 py-1 bg-secondary-700/50 text-secondary-300 rounded-full text-xs font-bold">
                            {dir.cost === 0 ? 'FREE' : `$${dir.cost}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Est. Monthly Traffic:</span>
                          <div className="text-white font-semibold">{(dir.estimatedTraffic || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Authority Score:</span>
                          <div className="text-white font-semibold">{dir.authority || 0}/100</div>
                        </div>
                        <div className="bg-secondary-900/30 rounded-lg p-3">
                          <span className="text-sm text-secondary-400">Submission Cost:</span>
                          <div className="text-white font-semibold">{(dir.cost === 0 || dir.cost === undefined) ? 'FREE' : `$${dir.cost}`}</div>
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
                        (dir.cost === 0 || dir.cost === undefined)
                          ? 'bg-success-500/20 text-success-400 border-success-500/30' 
                          : 'bg-volt-500/20 text-volt-400 border-volt-500/30'
                      }`}>
                        {(dir.cost === 0 || dir.cost === undefined) ? '🎯' : '💎'}
                      </div>
                      <span className={`font-bold text-sm ${
                        (dir.cost === 0 || dir.cost === undefined) ? 'text-success-400' : 'text-volt-400'
                      }`}>
                        {(dir.cost === 0 || dir.cost === undefined) ? 'FREE' : 'PREMIUM'}
                      </span>
                      
                      {/* Priority Indicator */}
                      <div className="text-xs text-center">
                        <div className={`px-2 py-1 rounded-full ${
                          index < 3 ? 'bg-success-500/20 text-success-400' :
                          index < 6 ? 'bg-volt-500/20 text-volt-400' :
                          'bg-secondary-700/50 text-secondary-400'
                        }`}>
                          {index < 3 ? 'High Priority' : index < 6 ? 'Medium Priority' : 'Consider Later'}
                        </div>
                      </div>
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
            
            <h3 className="text-xl font-bold text-center mb-6 text-volt-400">
              Premium Features Include
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">{Math.max(results.directoryOpportunities?.length || 15, 50)}+</div>
                <div className="text-sm text-secondary-300 font-medium">Premium Directories</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-success-400 mb-2">10x</div>
                <div className="text-sm text-secondary-300 font-medium">AI-Generated Descriptions</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">{Math.min(500, Math.max(200, (results.directoryOpportunities?.length || 15) * 20))}%</div>
                <div className="text-sm text-secondary-300 font-medium">Higher Success Rate</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <CheckoutButton
                plan="professional"
                variant="primary"
                size="xl"
                className="group relative bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black py-4 px-8 text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-volt-500/50 animate-glow"
                successUrl={getSuccessUrl()}
                cancelUrl={getCancelUrl()}
                customerEmail=""
                onSuccess={(data: any) => {
                  console.log('Professional plan checkout success:', data)
                  // Track conversion event
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'purchase_initiated', {
                      plan: 'professional',
                      source: 'results_page',
                      value: 129
                    })
                  }
                }}
                onError={(error: any) => {
                  console.error('Professional plan checkout error:', error)
                  // Fallback to pricing page if checkout fails
                  if (mounted) {
                    router.push('/pricing?recommended_plan=professional')
                  }
                }}
              >
                🚀 Start Free Trial - Professional Plan
              </CheckoutButton>
              <button
                onClick={() => mounted && router.push('/')}
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

      </div>
    </>
  )
}