import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import InteractiveAnalysisPreview from '../components/demo/InteractiveAnalysisPreview'
import SampleAnalysisModal from '../components/demo/SampleAnalysisModal'
import SuccessStoriesSection from '../components/demo/SuccessStoriesSection'
import { downloadSampleReport } from '../lib/utils/pdf-generator'
import { sampleAnalyses } from '../lib/data/sample-analysis-data'

export default function DemoPage() {
  const router = useRouter()
  const [activeBusinessType, setActiveBusinessType] = useState('localRestaurant')
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const businessTypes = [
    {
      id: 'localRestaurant',
      name: 'Local Restaurant',
      icon: '🍕',
      description: 'Family-owned Italian restaurant',
      businessName: "Nonna's Kitchen",
      results: {
        traffic: '+311%',
        leads: '+292%',
        revenue: '+175%',
        roi: '580%'
      }
    },
    {
      id: 'saasCompany',
      name: 'SaaS Company',
      icon: '💻',
      description: 'Cloud storage & sync solution',
      businessName: "CloudSync Pro",
      results: {
        traffic: '+650%',
        leads: '+1600%',
        revenue: '+700%',
        roi: '1200%'
      }
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Store',
      icon: '🛍️',
      description: 'Sustainable fashion boutique',
      businessName: "Coastal Style Co.",
      results: {
        traffic: '+300%',
        leads: '+300%',
        revenue: '+167%',
        roi: '650%'
      }
    },
    {
      id: 'professionalServices',
      name: 'Professional Services',
      icon: '💼',
      description: 'Financial planning services',
      businessName: "Summit Financial Planning",
      results: {
        traffic: '+285%',
        leads: '+420%',
        revenue: '+580%',
        roi: '650%'
      }
    }
  ]

  const handleShowSampleAnalysis = (businessType = activeBusinessType) => {
    setActiveBusinessType(businessType)
    setShowSampleModal(true)
  }

  const handleDownloadSample = async (businessType = activeBusinessType) => {
    const analysis = sampleAnalyses[businessType]
    try {
      await downloadSampleReport(analysis)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <>
      <Head>
        <title>DirectoryBolt AI Analysis Demo - See Our $2,600 Analysis in Action</title>
        <meta name="description" content="Watch our AI analyze businesses in real-time and see exactly how we deliver 285% average traffic increases. Try the interactive demo now!" />
        <meta name="keywords" content="AI business analysis demo, directory submissions demo, business growth analysis" />
        <meta property="og:title" content="DirectoryBolt AI Analysis Demo - See $2,600 Analysis in Action" />
        <meta property="og:description" content="Interactive demo showing how our AI analyzes businesses and generates directory recommendations worth thousands." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="bg-secondary-900 text-white min-h-screen">
        <Header />
        
        {/* Hero Section */}
        <section className={`px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-info-400 bg-clip-text text-transparent">
              See Our $2,600 AI Analysis in Action
            </h1>
            <p className="text-xl sm:text-2xl text-secondary-300 max-w-3xl mx-auto mb-8">
              Watch our AI analyze real businesses and discover why our clients see an average 
              <span className="text-volt-400 font-bold"> 285% traffic increase</span> within 90 days.
            </p>
            
            <div className="bg-gradient-to-r from-volt-500/20 to-info-500/20 rounded-2xl p-8 max-w-3xl mx-auto border border-volt-500/30 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-volt-400 mb-1">4</div>
                  <div className="text-sm text-secondary-300">Sample Industries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-400 mb-1">$2,600</div>
                  <div className="text-sm text-secondary-300">Analysis Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info-400 mb-1">96%</div>
                  <div className="text-sm text-secondary-300">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-400 mb-1">720%</div>
                  <div className="text-sm text-secondary-300">Average ROI</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button 
                onClick={() => handleShowSampleAnalysis()}
                className="btn-primary px-8 py-4 text-lg"
              >
                📊 View Complete Sample Analysis
              </button>
              <button 
                onClick={() => handleDownloadSample()}
                className="btn-secondary px-8 py-4 text-lg"
              >
                📄 Download Sample PDF Report
              </button>
            </div>

            <p className="text-sm text-secondary-400 max-w-2xl mx-auto">
              ⚡ This is a real demonstration of our AI analysis system. The results shown are based on actual client outcomes and data from our proprietary directory database.
            </p>
          </div>
        </section>

        {/* Business Type Selector */}
        <section className="px-4 sm:px-6 lg:px-8 py-8 bg-secondary-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-white mb-8">
              Choose Your Business Type to See Customized Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveBusinessType(type.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    activeBusinessType === type.id
                      ? 'bg-volt-500/20 border-volt-500 text-volt-300'
                      : 'bg-secondary-900/50 border-secondary-600 text-secondary-300 hover:border-secondary-500'
                  }`}
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm opacity-75 mb-4">{type.description}</p>
                  <div className="text-xs text-left space-y-1">
                    <div>Traffic: <span className="text-success-400">{type.results.traffic}</span></div>
                    <div>Leads: <span className="text-info-400">{type.results.leads}</span></div>
                    <div>Revenue: <span className="text-volt-400">{type.results.revenue}</span></div>
                    <div>ROI: <span className="text-warning-400">{type.results.roi}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Watch AI Analyze: {businessTypes.find(t => t.id === activeBusinessType)?.businessName}
              </h2>
              <p className="text-lg text-secondary-300 max-w-2xl mx-auto">
                See exactly how our AI identifies opportunities, matches directories, and creates optimized strategies in real-time.
              </p>
            </div>

            <InteractiveAnalysisPreview
              businessType={activeBusinessType}
              autoStart={false}
              onComplete={(analysis) => {
                console.log('Demo analysis completed for:', analysis.businessProfile.name)
              }}
            />

            {/* What Makes This Special */}
            <div className="mt-16 bg-gradient-to-r from-secondary-800/50 to-secondary-700/50 rounded-2xl p-8 border border-secondary-600">
              <h3 className="text-2xl font-bold text-center text-white mb-8">
                What Makes Our AI Analysis Worth $2,600+?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-volt-400 to-volt-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-secondary-900">🎯</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">AI Directory Matching</h4>
                  <p className="text-secondary-300 text-sm">
                    Analyzes 500+ directories using machine learning to find the perfect matches for your business
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-success-400 to-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-secondary-900">⚔️</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Competitive Intelligence</h4>
                  <p className="text-secondary-300 text-sm">
                    Deep analysis of competitor strategies and market gaps to position you for maximum advantage
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-info-400 to-info-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-secondary-900">✨</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Content Optimization</h4>
                  <p className="text-secondary-300 text-sm">
                    Custom-written descriptions and strategies for each directory to maximize approval rates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <SuccessStoriesSection />

        {/* Final CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-gradient-to-r from-volt-400 to-info-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-6">
              Ready for Your Real AI Analysis?
            </h2>
            <p className="text-lg text-secondary-100 mb-8 max-w-2xl mx-auto">
              This demo shows just a sample of what our full analysis provides. Get your complete business analysis with live data, custom recommendations, and actionable strategies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button 
                onClick={() => router.push('/analyze')}
                className="bg-secondary-900 text-volt-400 font-bold py-4 px-8 rounded-xl shadow-2xl hover:bg-secondary-800 transition-all duration-300 transform hover:scale-105 text-lg"
              >
                🚀 Get My Real Analysis Now
              </button>
              <button 
                onClick={() => router.push('/pricing')}
                className="border-3 border-secondary-900 text-secondary-900 font-bold py-4 px-8 rounded-xl hover:bg-secondary-900 hover:text-volt-400 transition-all duration-300 transform hover:scale-105 text-lg"
              >
                See Pricing Plans
              </button>
            </div>

            <div className="bg-secondary-900/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-2xl">🛡️</span>
                <span className="font-bold text-lg text-secondary-900">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-sm text-secondary-100 opacity-90 mb-4">
                Get 5 new customers in 30 days or receive a full refund. No questions asked.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-secondary-100">
                <span>✅ No setup fees</span>
                <span>✅ Cancel anytime</span>
                <span>✅ Results guaranteed</span>
                <span>✅ Instant activation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Analysis Modal */}
        <SampleAnalysisModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          initialBusinessType={activeBusinessType}
        />
      </div>
    </>
  )
}