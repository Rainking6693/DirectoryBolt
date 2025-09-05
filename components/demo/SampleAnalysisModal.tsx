'use client'
import { useState, useEffect } from 'react'
import { sampleAnalyses, SampleAnalysisData, industryCategories } from '../../lib/data/sample-analysis-data'
import { createPortal } from 'react-dom'

interface SampleAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  initialBusinessType?: 'localRestaurant' | 'saasCompany' | 'ecommerce' | 'professionalServices'
}

export default function SampleAnalysisModal({
  isOpen,
  onClose,
  initialBusinessType = 'localRestaurant'
}: SampleAnalysisModalProps) {
  const [selectedBusinessType, setSelectedBusinessType] = useState<keyof typeof sampleAnalyses>(initialBusinessType)
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'insights' | 'competitors'>('overview')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const currentAnalysis = sampleAnalyses[selectedBusinessType]

  const businessTypeLabels = {
    localRestaurant: "Local Restaurant",
    saasCompany: "SaaS Company", 
    ecommerce: "E-commerce Store",
    professionalServices: "Professional Services"
  }

  const handleDownloadPDF = () => {
    // This would integrate with a PDF generation service
    const filename = `${currentAnalysis.businessProfile.name.replace(/\s+/g, '_')}_Analysis_Report.pdf`
    console.log('Downloading PDF:', filename)
    // For demo purposes, we'll just show an alert
    alert(`PDF download would start: ${filename}\n\nThis demo shows what the full analysis includes!`)
  }

  const handleStartRealAnalysis = () => {
    onClose()
    // Navigate to analysis page
    window.location.href = '/analyze'
  }

  const modal = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-secondary-900 rounded-2xl max-w-6xl w-full my-8 border border-secondary-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Sample AI Analysis Report
            </h2>
            <p className="text-secondary-300">
              See exactly what our $2,600+ AI analysis delivers for your business
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Business Type Selector */}
        <div className="px-6 py-4 bg-secondary-800/50 border-b border-secondary-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(businessTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedBusinessType(key as keyof typeof sampleAnalyses)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBusinessType === key
                    ? 'bg-volt-500 text-secondary-900'
                    : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Business Profile Summary */}
        <div className="p-6 bg-gradient-to-r from-volt-500/10 to-success-500/10 border-b border-secondary-700">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {currentAnalysis.businessProfile.name}
              </h3>
              <p className="text-secondary-300 mb-4">
                {currentAnalysis.businessProfile.description}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-volt-400">🏢</span>
                  <span className="text-secondary-300">{currentAnalysis.businessProfile.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-volt-400">📍</span>
                  <span className="text-secondary-300">
                    {currentAnalysis.businessProfile.location.city}, {currentAnalysis.businessProfile.location.region}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-volt-400">🎯</span>
                  <span className="text-secondary-300">{currentAnalysis.businessProfile.industry}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-400 mb-1">
                {currentAnalysis.confidence}%
              </div>
              <div className="text-sm text-secondary-300">
                AI Confidence
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4 border-b border-secondary-700">
          <div className="flex gap-6">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '📊' },
              { id: 'recommendations' as const, label: 'Directory Matches', icon: '🎯' },
              { id: 'insights' as const, label: 'Strategic Insights', icon: '💡' },
              { id: 'competitors' as const, label: 'Competition', icon: '⚔️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-volt-500/20 text-volt-300 border border-volt-500/50'
                    : 'text-secondary-400 hover:text-secondary-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-secondary-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-volt-400 mb-1">
                    {currentAnalysis.recommendations.length}
                  </div>
                  <div className="text-sm text-secondary-300">
                    Directory Matches
                  </div>
                </div>
                <div className="bg-secondary-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-success-400 mb-1">
                    +{currentAnalysis.projectedResults.monthlyTrafficIncrease.toLocaleString()}
                  </div>
                  <div className="text-sm text-secondary-300">
                    Monthly Traffic
                  </div>
                </div>
                <div className="bg-secondary-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-info-400 mb-1">
                    ${currentAnalysis.projectedResults.revenueProjection.toLocaleString()}
                  </div>
                  <div className="text-sm text-secondary-300">
                    Revenue Potential
                  </div>
                </div>
                <div className="bg-secondary-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-warning-400 mb-1">
                    {currentAnalysis.projectedResults.roi}%
                  </div>
                  <div className="text-sm text-secondary-300">
                    Expected ROI
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Target Audience Analysis</h4>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.businessProfile.targetAudience.map((audience, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-volt-500/20 text-volt-300 rounded-full text-sm"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">SEO Keywords Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.businessProfile.keywords.slice(0, 8).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-success-500/20 text-success-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-white">
                  Top Directory Recommendations
                </h4>
                <div className="text-sm text-secondary-300">
                  Showing {currentAnalysis.recommendations.length} matches
                </div>
              </div>

              {currentAnalysis.recommendations.slice(0, 5).map((rec, index) => (
                <div
                  key={rec.directoryId}
                  className="bg-secondary-800 rounded-xl p-6 border border-secondary-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h5 className="text-xl font-semibold text-white mb-2">
                        #{index + 1} {rec.name}
                      </h5>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-success-300">
                          <span>🎯</span>
                          {rec.relevanceScore}% match
                        </span>
                        <span className="flex items-center gap-1 text-volt-300">
                          <span>📈</span>
                          {rec.successProbability}% success
                        </span>
                        <span className="flex items-center gap-1 text-info-300">
                          <span>👥</span>
                          {rec.estimatedTraffic.toLocaleString()} monthly visitors
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-success-500/20 text-success-300' :
                      rec.priority === 'medium' ? 'bg-warning-500/20 text-warning-300' :
                      'bg-secondary-600 text-secondary-300'
                    }`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>

                  <p className="text-secondary-300 mb-4">
                    {rec.reasoning}
                  </p>

                  <div className="bg-secondary-700 rounded-lg p-4 mb-4">
                    <h6 className="text-sm font-semibold text-volt-300 mb-2">
                      Optimized Description:
                    </h6>
                    <p className="text-sm text-secondary-200">
                      "{rec.optimizedDescription}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rec.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-volt-500/10 text-volt-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Market Position */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Market Position</h4>
                <p className="text-secondary-300 bg-secondary-800 rounded-lg p-4">
                  {currentAnalysis.insights.marketPosition}
                </p>
              </div>

              {/* Competitive Advantages */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Competitive Advantages</h4>
                <div className="space-y-2">
                  {currentAnalysis.insights.competitiveAdvantages.map((advantage, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-success-500/10 rounded-lg border border-success-500/20"
                    >
                      <span className="text-success-400 mt-1">✓</span>
                      <span className="text-secondary-200">{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Suggestions */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Improvement Suggestions</h4>
                <div className="space-y-2">
                  {currentAnalysis.insights.improvementSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-warning-500/10 rounded-lg border border-warning-500/20"
                    >
                      <span className="text-warning-400 mt-1">💡</span>
                      <span className="text-secondary-200">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competitors' && (
            <div className="space-y-6">
              {/* Competitor Analysis */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Competitor Analysis</h4>
                <div className="space-y-4">
                  {currentAnalysis.competitorAnalysis.competitors.map((competitor, index) => (
                    <div
                      key={index}
                      className="bg-secondary-800 rounded-xl p-6"
                    >
                      <h5 className="text-lg font-semibold text-white mb-3">
                        {competitor.name}
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h6 className="text-sm font-semibold text-volt-300 mb-2">Similarities</h6>
                          <ul className="space-y-1">
                            {competitor.similarities.map((similarity, simIndex) => (
                              <li key={simIndex} className="text-sm text-secondary-300">
                                • {similarity}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-semibold text-info-300 mb-2">Directory Presence</h6>
                          <ul className="space-y-1">
                            {competitor.directoryPresence.map((directory, dirIndex) => (
                              <li key={dirIndex} className="text-sm text-secondary-300">
                                • {directory}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-semibold text-warning-300 mb-2">Advantages</h6>
                          <ul className="space-y-1">
                            {competitor.marketAdvantages.map((advantage, advIndex) => (
                              <li key={advIndex} className="text-sm text-secondary-300">
                                • {advantage}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Gaps */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Market Opportunities</h4>
                <div className="space-y-2">
                  {currentAnalysis.competitorAnalysis.marketGaps.map((gap, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-success-500/10 rounded-lg border border-success-500/20"
                    >
                      <span className="text-success-400 mt-1">🎯</span>
                      <span className="text-secondary-200">{gap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positioning Advice */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Strategic Positioning</h4>
                <div className="bg-volt-500/10 rounded-lg p-4 border border-volt-500/20">
                  <p className="text-secondary-200">
                    {currentAnalysis.competitorAnalysis.positioningAdvice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-secondary-800/50 border-t border-secondary-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-secondary-300 text-center sm:text-left">
              <strong className="text-volt-400">Demo Report Value:</strong> This analysis would typically cost $2,600+ from consulting firms
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary px-4 py-2 text-sm"
              >
                📄 Download Sample PDF
              </button>
              <button
                onClick={handleStartRealAnalysis}
                className="btn-primary px-6 py-3"
              >
                🚀 Get My Real Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}