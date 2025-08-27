import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface AnalysisProgress {
  step: number
  total: number
  message: string
  completed: boolean
}

export default function AnalyzePage() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<AnalysisProgress>({
    step: 0,
    total: 5,
    message: '',
    completed: false
  })
  const [error, setError] = useState('')
  const router = useRouter()

  const analysisSteps = [
    'Fetching website content...',
    'Analyzing business profile...',
    'AI-powered industry categorization...',
    'Finding optimal directories...',
    'Generating recommendations...'
  ]

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const url = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const simulateProgress = async () => {
    for (let i = 0; i < analysisSteps.length; i++) {
      setProgress({
        step: i + 1,
        total: analysisSteps.length,
        message: analysisSteps[i],
        completed: false
      })
      // Realistic timing for each step
      const delays = [2000, 3000, 2500, 2000, 1500]
      await new Promise(resolve => setTimeout(resolve, delays[i]))
    }
    
    setProgress(prev => ({ ...prev, completed: true, message: 'Analysis complete!' }))
    
    // Redirect to results after brief delay
    setTimeout(() => {
      router.push(`/results?url=${encodeURIComponent(url)}`)
    }, 1000)
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Please enter a website URL')
      return
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid website URL')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Start the visual progress simulation
      await simulateProgress()
      
      // Perform actual analysis in the background
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      // Results page will handle the response
    } catch (err) {
      setError('Analysis failed. Please try again.')
      setIsAnalyzing(false)
      setProgress({ step: 0, total: 5, message: '', completed: false })
    }
  }

  return (
    <>
      <Head>
        <title>Analyze Your Website - DirectoryBolt</title>
        <meta name="description" content="Get AI-powered directory recommendations for your website. Analyze your business profile and discover the best directories for maximum visibility." />
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

        <div className="max-w-4xl mx-auto px-4 py-16">
          {!isAnalyzing ? (
            // Analysis Form
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Analyze Your Website
              </h1>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Get AI-powered recommendations for the best directories to boost your online visibility
              </p>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-2xl mx-auto">
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div>
                    <label htmlFor="url" className="block text-left text-lg font-medium text-white mb-3">
                      Website URL
                    </label>
                    <input
                      type="text"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-website.com"
                      className="w-full px-6 py-4 text-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                      disabled={isAnalyzing}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 text-lg rounded-xl hover:shadow-lg hover:shadow-yellow-400/25 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    🚀 Start Analysis
                  </button>
                </form>

                <div className="mt-8 text-sm text-gray-400 space-y-2">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">✅ AI-Powered Analysis</span>
                    <span className="flex items-center">⚡ 30-Second Results</span>
                    <span className="flex items-center">🎯 Personalized Recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Progress Indicator
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-6">
                Analyzing Your Website
              </h1>
              <p className="text-xl text-gray-300 mb-12">
                Our AI is working hard to find the perfect directories for your business
              </p>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-2xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{progress.step}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(progress.step / progress.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                <div className="text-center mb-8">
                  <div className="text-2xl mb-2">
                    {progress.completed ? '🎉' : '🤖'}
                  </div>
                  <p className="text-lg text-white font-medium">
                    {progress.message || 'Initializing...'}
                  </p>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {analysisSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        index < progress.step
                          ? 'bg-green-500/20 text-green-300'
                          : index === progress.step - 1
                          ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                          : 'bg-gray-800/30 text-gray-500'
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        {index < progress.step ? (
                          <span className="text-green-400">✅</span>
                        ) : index === progress.step - 1 ? (
                          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-gray-600">⏳</span>
                        )}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {progress.completed && (
                  <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-200">
                    <p>Analysis complete! Redirecting to results...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}