import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout/Layout'

export default function Success() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const { session_id } = router.query
    
    if (session_id) {
      // Fetch session details from Stripe
      fetchSessionDetails(session_id)
    } else {
      setIsLoading(false)
      setError('No session ID provided')
    }
  }, [router.query])

  const fetchSessionDetails = async (_sessionId) => {
    try {
      // In a real implementation, you'd call your API to get session details
      // For now, we'll simulate the success state
      
      setTimeout(() => {
        setSessionData({
          customer_email: 'customer@example.com',
          plan_name: 'Growth Plan',
          amount_total: 7900, // $79.00 in cents
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          next_billing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        })
        setIsLoading(false)
      }, 1000)
      
    } catch (err) {
      // Error logged in API layer
      setError('Failed to load subscription details')
      setIsLoading(false)
    }
  }

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <>
      <Head>
        <title>Welcome to DirectoryBolt! | Subscription Activated</title>
        <meta name="description" content="Your DirectoryBolt subscription is now active! Start getting listed in 500+ directories today." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-16">
          <div className="container mx-auto max-w-4xl px-4">
            
            {isLoading ? (
              // Loading State
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-volt-500 border-t-transparent mx-auto mb-8"></div>
                <h2 className="text-2xl font-bold text-volt-400 mb-4">Processing your subscription...</h2>
                <p className="text-secondary-300">Please wait while we set up your account.</p>
              </div>
            ) : error ? (
              // Error State
              <div className="text-center py-20">
                <div className="text-6xl mb-8">❌</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4">Something went wrong</h2>
                <p className="text-secondary-300 mb-8">{error}</p>
                <Link 
                  href="/pricing"
                  className="inline-block px-8 py-4 bg-volt-500 text-secondary-900 font-bold text-lg rounded-xl hover:bg-volt-400 transform hover:scale-105 transition-all duration-300"
                >
                  Back to Pricing
                </Link>
              </div>
            ) : (
              // Success State
              <div className="text-center">
                {/* Success Animation */}
                <div className="relative mb-12">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-volt-500 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <div className="relative text-8xl mb-4 animate-bounce">🎉</div>
                  <div className="relative">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600 animate-glow">
                        Welcome to DirectoryBolt!
                      </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-secondary-300 mb-8">
                      Your subscription is now active and ready to boost your business!
                    </p>
                  </div>
                </div>

                {/* Subscription Details Card */}
                {sessionData && (
                  <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-secondary-600 p-8 mb-12 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-volt-400 mb-6">Subscription Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div>
                        <span className="text-secondary-400 text-sm">Plan</span>
                        <p className="text-white font-semibold text-lg">{sessionData.plan_name}</p>
                      </div>
                      
                      <div>
                        <span className="text-secondary-400 text-sm">Monthly Price</span>
                        <p className="text-white font-semibold text-lg">{formatCurrency(sessionData.amount_total)}</p>
                      </div>
                      
                      <div>
                        <span className="text-secondary-400 text-sm">Free Trial Ends</span>
                        <p className="text-white font-semibold text-lg">{formatDate(sessionData.trial_end)}</p>
                      </div>
                      
                      <div>
                        <span className="text-secondary-400 text-sm">Next Billing Date</span>
                        <p className="text-white font-semibold text-lg">{formatDate(sessionData.next_billing_date)}</p>
                      </div>
                    </div>

                    {/* Trial Notice */}
                    <div className="mt-8 p-4 bg-volt-500/10 border border-volt-500/30 rounded-xl">
                      <p className="text-volt-400 font-semibold mb-2">🎁 Your 14-Day Free Trial is Active!</p>
                      <p className="text-secondary-300 text-sm">
                        You won't be charged until {formatDate(sessionData.next_billing_date)}. 
                        Cancel anytime before then to avoid any charges.
                      </p>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-volt-500/20 to-volt-600/20 p-8 rounded-2xl border border-volt-500/30 mb-12">
                  <h3 className="text-3xl font-bold mb-8">🚀 What's Next?</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📊</div>
                      <h4 className="text-xl font-bold text-volt-400 mb-2">Analyze Your Website</h4>
                      <p className="text-secondary-300 text-sm mb-4">
                        Get insights on your current visibility and discover opportunities
                      </p>
                      <Link 
                        href="/analyze"
                        className="inline-block px-6 py-3 bg-volt-500 text-secondary-900 font-bold rounded-lg hover:bg-volt-400 transform hover:scale-105 transition-all duration-300"
                      >
                        Start Analysis
                      </Link>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎯</div>
                      <h4 className="text-xl font-bold text-volt-400 mb-2">Submit to Directories</h4>
                      <p className="text-secondary-300 text-sm mb-4">
                        Begin submitting to high-authority directories in your industry
                      </p>
                      <Link 
                        href="/dashboard"
                        className="inline-block px-6 py-3 bg-secondary-700 text-white font-bold rounded-lg hover:bg-secondary-600 transform hover:scale-105 transition-all duration-300"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-4">📧</div>
                      <h4 className="text-xl font-bold text-volt-400 mb-2">Check Your Email</h4>
                      <p className="text-secondary-300 text-sm mb-4">
                        We've sent you a welcome guide with tips for maximum results
                      </p>
                      <button 
                        onClick={() => window.open(`mailto:${sessionData?.customer_email || ''}`, '_blank')}
                        className="inline-block px-6 py-3 bg-secondary-700 text-white font-bold rounded-lg hover:bg-secondary-600 transform hover:scale-105 transition-all duration-300"
                      >
                        Open Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Support & Resources */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">Need Help Getting Started?</h3>
                  <p className="text-secondary-300 mb-8">
                    Our team is here to help you maximize your directory listings and grow your business.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/support"
                      className="px-8 py-4 bg-secondary-700 text-white font-bold text-lg rounded-xl hover:bg-secondary-600 transform hover:scale-105 transition-all duration-300"
                    >
                      Contact Support
                    </Link>
                    <Link 
                      href="/docs"
                      className="px-8 py-4 border-2 border-volt-500 text-volt-500 font-bold text-lg rounded-xl hover:bg-volt-500 hover:text-secondary-900 transform hover:scale-105 transition-all duration-300"
                    >
                      View Documentation
                    </Link>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-secondary-400 mt-12">
                  <span>✅ 30-day money-back guarantee</span>
                  <span>✅ Cancel anytime</span>
                  <span>✅ 24/7 customer support</span>
                  <span>✅ Secure & encrypted</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}