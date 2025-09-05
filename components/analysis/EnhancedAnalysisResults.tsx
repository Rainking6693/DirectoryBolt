'use client'
import React, { useState, useMemo } from 'react'
import { ErrorBoundary } from '../ui/ErrorBoundary'

// Enhanced Analysis Results Interface - Phase 2.3 DirectoryBolt AI-Enhanced plan
// Displays $2,600+ AI analysis results with premium value demonstration

interface BusinessProfile {
  name: string
  description: string
  category: string
  subcategory?: string
  industry: string
  location?: {
    city?: string
    country?: string
    region?: string
  }
  targetAudience: string[]
  keywords: string[]
  businessModel: string
  size: 'startup' | 'small' | 'medium' | 'enterprise'
  stage: 'idea' | 'early' | 'growth' | 'mature'
}

interface DirectoryOpportunity {
  id: string
  name: string
  category: string
  authority: number
  estimatedTraffic: number
  submissionDifficulty: string
  cost: number
  relevanceScore: number
  successProbability: number
  priority: 'high' | 'medium' | 'low'
  reasoning: string
  optimizedDescription: string
  tags: string[]
  submissionTips: string[]
  isPremium?: boolean
}

interface CompetitorInsight {
  name: string
  similarities: string[]
  directoryPresence: string[]
  marketAdvantages: string[]
}

interface MarketGap {
  opportunity: string
  impact: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedValue: number
  description: string
}

interface EnhancedAnalysisData {
  url: string
  businessProfile: BusinessProfile
  directoryOpportunities: DirectoryOpportunity[]
  competitorAnalysis: {
    competitors: CompetitorInsight[]
    marketGaps: MarketGap[]
    positioningAdvice: string
  }
  insights: {
    marketPosition: string
    competitiveAdvantages: string[]
    improvementSuggestions: string[]
    successFactors: string[]
  }
  aiMetrics: {
    confidence: number
    opportunitiesFound: number
    potentialMonthlyLeads: number
    estimatedROI: number
    marketPenetration: number
  }
  tier: 'free' | 'professional' | 'enterprise'
}

interface Props {
  data: EnhancedAnalysisData
  onUpgrade?: () => void
  onExport?: (format: 'pdf' | 'csv') => void
}

export function EnhancedAnalysisResults({ data, onUpgrade, onExport }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'competitors' | 'insights'>('overview')
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null)
  const [showDescriptionPreview, setShowDescriptionPreview] = useState<string | null>(null)

  // Calculate tier-specific data limits
  const tierLimits = useMemo(() => {
    switch (data.tier) {
      case 'free':
        return { opportunities: 5, competitors: 2, insights: 3, descriptions: 1 }
      case 'professional':
        return { opportunities: 25, competitors: 8, insights: 10, descriptions: 5 }
      case 'enterprise':
        return { opportunities: 100, competitors: 20, insights: 25, descriptions: 10 }
      default:
        return { opportunities: 5, competitors: 2, insights: 3, descriptions: 1 }
    }
  }, [data.tier])

  const visibleOpportunities = data.directoryOpportunities.slice(0, tierLimits.opportunities)
  const hiddenOpportunitiesCount = Math.max(0, data.directoryOpportunities.length - tierLimits.opportunities)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-success-500/20 text-success-300 border-success-500/30'
      case 'medium': return 'bg-volt-500/20 text-volt-300 border-volt-500/30'
      case 'low': return 'bg-secondary-500/20 text-secondary-300 border-secondary-500/30'
      default: return 'bg-secondary-500/20 text-secondary-300 border-secondary-500/30'
    }
  }

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-success-400'
    if (probability >= 60) return 'text-volt-400'
    if (probability >= 40) return 'text-orange-400'
    return 'text-danger-400'
  }

  const BusinessIntelligenceDashboard = () => (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-2xl border border-volt-500/30 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
              Business Intelligence Summary
            </h2>
            <p className="text-lg text-secondary-200 mb-6">
              AI-powered analysis for <span className="text-volt-400 font-bold">{data.businessProfile.name}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-volt-400">{data.aiMetrics.confidence}%</div>
                <div className="text-sm text-secondary-300">AI Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-success-400">{data.aiMetrics.opportunitiesFound}</div>
                <div className="text-sm text-secondary-300">Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-volt-400">{data.aiMetrics.potentialMonthlyLeads.toLocaleString()}</div>
                <div className="text-sm text-secondary-300">Monthly Leads</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-success-400">{data.aiMetrics.estimatedROI}%</div>
                <div className="text-sm text-secondary-300">Est. ROI</div>
              </div>
            </div>
          </div>
          <div className="lg:w-64">
            <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
              <h3 className="text-lg font-bold text-volt-400 mb-4">Business Profile</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-secondary-400">Industry:</span> <span className="text-white">{data.businessProfile.industry}</span></div>
                <div><span className="text-secondary-400">Category:</span> <span className="text-white">{data.businessProfile.category}</span></div>
                <div><span className="text-secondary-400">Stage:</span> <span className="text-white capitalize">{data.businessProfile.stage}</span></div>
                <div><span className="text-secondary-400">Size:</span> <span className="text-white capitalize">{data.businessProfile.size}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Position Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-success-500/30 p-6">
          <h3 className="text-xl font-bold text-success-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> Market Position
          </h3>
          <p className="text-secondary-200 text-sm leading-relaxed">{data.insights.marketPosition}</p>
          
          <div className="mt-4">
            <h4 className="font-semibold text-white mb-2">Competitive Advantages:</h4>
            <div className="space-y-2">
              {data.insights.competitiveAdvantages.slice(0, tierLimits.insights).map((advantage, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-success-400 mt-1">✓</span>
                  <span className="text-secondary-300 text-sm">{advantage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6">
          <h3 className="text-xl font-bold text-volt-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span> Growth Opportunities
          </h3>
          <div className="space-y-3">
            {data.insights.improvementSuggestions.slice(0, tierLimits.insights).map((suggestion, index) => (
              <div key={index} className="bg-volt-500/10 rounded-lg p-3 border border-volt-500/20">
                <div className="flex items-start gap-3">
                  <span className="text-volt-400 text-lg">💡</span>
                  <span className="text-secondary-200 text-sm">{suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const DirectoryOpportunityGrid = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Directory Opportunities</h2>
          <p className="text-secondary-300 mt-1">AI-ranked by success probability and business relevance</p>
        </div>
        <div className="flex items-center gap-3">
          {data.tier !== 'enterprise' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-sm bg-volt-500/20 hover:bg-volt-500/30 text-volt-400 px-4 py-2 rounded-lg border border-volt-500/30 transition-all"
            >
              Unlock All {data.directoryOpportunities.length} Opportunities
            </button>
          )}
          {onExport && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('pdf')}
                className="text-sm bg-secondary-700 hover:bg-secondary-600 text-white px-3 py-2 rounded-lg transition-all"
              >
                Export PDF
              </button>
              <button
                onClick={() => onExport('csv')}
                className="text-sm bg-secondary-700 hover:bg-secondary-600 text-white px-3 py-2 rounded-lg transition-all"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {visibleOpportunities.map((opportunity, index) => (
          <div
            key={opportunity.id}
            className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-volt-500/30 p-6 hover:shadow-lg hover:shadow-volt-500/20 transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-white">{index + 1}. {opportunity.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(opportunity.priority)}`}>
                    {opportunity.priority} Priority
                  </span>
                  <span className="px-3 py-1 bg-volt-500/20 text-volt-300 rounded-full text-xs font-bold">
                    Authority: {opportunity.authority}/100
                  </span>
                  {opportunity.cost !== undefined && (
                    <span className="px-3 py-1 bg-secondary-700/50 text-secondary-300 rounded-full text-xs font-bold">
                      {opportunity.cost === 0 ? 'FREE' : `$${opportunity.cost}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-secondary-900/30 rounded-lg p-3">
                    <span className="text-sm text-secondary-400">Success Rate:</span>
                    <div className={`text-lg font-bold ${getSuccessProbabilityColor(opportunity.successProbability)}`}>
                      {opportunity.successProbability}%
                    </div>
                  </div>
                  <div className="bg-secondary-900/30 rounded-lg p-3">
                    <span className="text-sm text-secondary-400">Monthly Traffic:</span>
                    <div className="text-white font-semibold">{opportunity.estimatedTraffic.toLocaleString()}</div>
                  </div>
                  <div className="bg-secondary-900/30 rounded-lg p-3">
                    <span className="text-sm text-secondary-400">Relevance:</span>
                    <div className="text-white font-semibold">{opportunity.relevanceScore}/100</div>
                  </div>
                  <div className="bg-secondary-900/30 rounded-lg p-3">
                    <span className="text-sm text-secondary-400">Difficulty:</span>
                    <div className="text-white font-semibold capitalize">{opportunity.submissionDifficulty}</div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-lg p-4 mb-4 border border-volt-500/20">
                  <h4 className="text-sm font-bold text-volt-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🤖</span> AI Analysis:
                  </h4>
                  <p className="text-sm text-secondary-200">{opportunity.reasoning}</p>
                </div>

                {/* Optimized Description Preview */}
                <div className="bg-success-500/10 rounded-lg p-4 border border-success-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-success-400">AI-Optimized Description:</h4>
                    {data.tier === 'free' && (
                      <button
                        onClick={onUpgrade}
                        className="text-xs bg-volt-500/20 text-volt-400 px-2 py-1 rounded border border-volt-500/30"
                      >
                        Unlock More
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-secondary-200 mb-2">
                    {data.tier === 'free' 
                      ? `${opportunity.optimizedDescription.substring(0, 100)}...` 
                      : opportunity.optimizedDescription
                    }
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {opportunity.tags.slice(0, data.tier === 'free' ? 3 : opportunity.tags.length).map((tag, idx) => (
                      <span key={idx} className="text-xs bg-success-500/20 text-success-300 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:w-32 flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ${
                  opportunity.successProbability >= 80 
                    ? 'bg-success-500/20 text-success-400 border-success-500/30' 
                    : opportunity.successProbability >= 60
                    ? 'bg-volt-500/20 text-volt-400 border-volt-500/30'
                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }`}>
                  {opportunity.successProbability >= 80 ? '🎯' : opportunity.successProbability >= 60 ? '⚡' : '💡'}
                </div>
                <div className="text-center">
                  <div className={`font-bold text-sm ${getSuccessProbabilityColor(opportunity.successProbability)}`}>
                    {opportunity.successProbability}%
                  </div>
                  <div className="text-xs text-secondary-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hiddenOpportunitiesCount > 0 && (
          <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-xl border border-volt-500/30 p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {hiddenOpportunitiesCount} More Premium Opportunities
            </h3>
            <p className="text-secondary-200 mb-4">
              Unlock advanced directories with higher success rates and exclusive opportunities
            </p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold py-3 px-6 rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105"
              >
                Upgrade to See All {data.directoryOpportunities.length} Opportunities
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const CompetitiveAnalysis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Competitive Intelligence</h2>
          <p className="text-secondary-300 mt-1">AI-powered competitor analysis and market positioning</p>
        </div>
      </div>

      {data.competitorAnalysis.competitors.length > 0 ? (
        <div className="grid gap-6">
          {data.competitorAnalysis.competitors.slice(0, tierLimits.competitors).map((competitor, index) => (
            <div key={index} className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-danger-500/30 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-danger-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">{competitor.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-danger-400 mb-2">Similarities:</h4>
                      <ul className="space-y-1">
                        {competitor.similarities.map((similarity, idx) => (
                          <li key={idx} className="text-sm text-secondary-300 flex items-start gap-2">
                            <span className="text-danger-400 mt-1">•</span>
                            {similarity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-volt-400 mb-2">Directory Presence:</h4>
                      <ul className="space-y-1">
                        {competitor.directoryPresence.map((directory, idx) => (
                          <li key={idx} className="text-sm text-secondary-300 flex items-start gap-2">
                            <span className="text-volt-400 mt-1">📍</span>
                            {directory}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-success-400 mb-2">Their Advantages:</h4>
                      <ul className="space-y-1">
                        {competitor.marketAdvantages.map((advantage, idx) => (
                          <li key={idx} className="text-sm text-secondary-300 flex items-start gap-2">
                            <span className="text-success-400 mt-1">⭐</span>
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.competitorAnalysis.competitors.length > tierLimits.competitors && data.tier === 'free' && (
            <div className="bg-gradient-to-r from-danger-500/10 to-danger-600/10 rounded-xl border border-danger-500/30 p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">
                {data.competitorAnalysis.competitors.length - tierLimits.competitors} More Competitor Analysis
              </h3>
              <p className="text-secondary-200 mb-4">
                Get comprehensive competitive intelligence and strategic positioning advice
              </p>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="bg-gradient-to-r from-danger-500 to-danger-600 text-white font-bold py-3 px-6 rounded-xl hover:from-danger-400 hover:to-danger-500 transition-all duration-300 transform hover:scale-105"
                >
                  Unlock Full Competitive Analysis
                </button>
              )}
            </div>
          )}

          {/* Market Positioning Advice */}
          <div className="bg-gradient-to-r from-success-500/10 to-success-600/10 rounded-xl border border-success-500/30 p-6">
            <h3 className="text-xl font-bold text-success-400 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span> Strategic Positioning Advice
            </h3>
            <p className="text-secondary-200">{data.competitorAnalysis.positioningAdvice}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">Competitive Analysis In Progress</h3>
          <p className="text-secondary-300">
            Our AI is analyzing your competitive landscape. This premium feature provides deep insights into your market position.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1 bg-secondary-800/50 rounded-xl">
          {[
            { id: 'overview', label: 'Business Intelligence', icon: '📊' },
            { id: 'opportunities', label: 'Directory Opportunities', icon: '🎯' },
            { id: 'competitors', label: 'Competitive Analysis', icon: '🏢' },
            { id: 'insights', label: 'Strategic Insights', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-volt-500/20 text-volt-400 border border-volt-500/30'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && <BusinessIntelligenceDashboard />}
          {activeTab === 'opportunities' && <DirectoryOpportunityGrid />}
          {activeTab === 'competitors' && <CompetitiveAnalysis />}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-white">Strategic Insights</h2>
              <div className="grid gap-6">
                <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-success-500/30 p-6">
                  <h3 className="text-xl font-bold text-success-400 mb-4">Success Factors</h3>
                  <div className="space-y-3">
                    {data.insights.successFactors.slice(0, tierLimits.insights).map((factor, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-success-400 text-lg">⭐</span>
                        <span className="text-secondary-200">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade CTA for Free Tier */}
        {data.tier === 'free' && onUpgrade && (
          <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 rounded-2xl border border-volt-500/30 p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🚀</div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Unlock the Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600">$2,600+ AI Analysis</span>
            </h2>
            <p className="text-lg md:text-xl text-secondary-200 mb-8 max-w-3xl mx-auto font-medium">
              Get unlimited directory opportunities, competitive intelligence, and AI-optimized descriptions that drive results.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">{data.directoryOpportunities.length}+</div>
                <div className="text-sm text-secondary-300 font-medium">Total Directory Opportunities</div>
                <div className="text-xs text-volt-300 mt-1">Currently showing: {tierLimits.opportunities}</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-success-400 mb-2">AI</div>
                <div className="text-sm text-secondary-300 font-medium">Optimized Descriptions</div>
                <div className="text-xs text-volt-300 mt-1">Multiple variations per directory</div>
              </div>
              <div className="bg-secondary-800/30 rounded-xl p-6 border border-volt-500/20">
                <div className="text-4xl font-black text-volt-400 mb-2">{data.aiMetrics.estimatedROI}%</div>
                <div className="text-sm text-secondary-300 font-medium">Higher Success Rate</div>
                <div className="text-xs text-volt-300 mt-1">vs manual submissions</div>
              </div>
            </div>
            
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black py-4 px-8 text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-volt-500/50"
            >
              Upgrade to Professional Plan
            </button>
            
            <div className="mt-6 text-sm text-secondary-300">
              💰 <strong className="text-volt-400">30-day money-back guarantee</strong> • Cancel anytime • <strong className="text-volt-400">Results guaranteed</strong>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}