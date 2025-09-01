import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout/Layout'

// Disable static generation to avoid NextRouter SSG errors
export async function getServerSideProps() {
  return {
    props: {}
  }
}

export default function Cancel() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsVisible(true)
  }, [])

  const handleTryAgain = () => {
    // Track that user returned from cancel page
    if (typeof window !== 'undefined') {
      localStorage.setItem('returning_from_cancel', 'true');
    }
    if (mounted) {
      router.push('/pricing');
    }
  }

  const handleContactSupport = () => {
    window.open('mailto:support@directorybolt.com?subject=Payment Issue - Need Help&body=Hi, I was trying to sign up for DirectoryBolt but encountered an issue during checkout. Please help me resolve this.', '_blank');
  }

  const handleScheduleDemo = () => {
    window.open('https://calendly.com/directorybolt/demo', '_blank');
  }

  // Show loading state during SSR/initial mount
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Payment Cancelled | DirectoryBolt</title>
          <meta name="description" content="Your payment was cancelled. No charges were made to your account. Try again or contact support for help." />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-6 animate-bounce">⏸️</div>
              <h1 className="text-2xl text-white font-bold mb-4">Loading...</h1>
              <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Payment Cancelled | DirectoryBolt</title>
        <meta name="description" content="Your payment was cancelled. No charges were made to your account. Try again or contact support for help." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-16">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500 rounded-full blur-3xl opacity-5 animate-pulse-volt"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-volt-400 rounded-full blur-3xl opacity-5 animate-pulse-volt" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className={`relative z-10 container mx-auto max-w-4xl px-4 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Cancel Icon Animation */}
            <div className="relative mb-12">
              <div className="text-8xl mb-8 animate-pulse">⏸️</div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                Payment
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Cancelled
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-secondary-300 mb-8 max-w-2xl mx-auto">
                No worries! Your payment was cancelled and no charges were made to your account.
              </p>
            </div>

            {/* Main Content Card */}
            <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-secondary-600 p-8 mb-12 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-orange-400 mb-6">What happened?</h3>
              
              <div className="text-left space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span className="text-secondary-300">
                    You closed the payment window or clicked "Back to DirectoryBolt"
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span className="text-secondary-300">
                    No payment information was processed or stored
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span className="text-secondary-300">
                    Your account remains unchanged
                  </span>
                </div>
              </div>

              {/* Reassurance */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
                <p className="text-green-400 font-semibold mb-2">✅ Your information is safe</p>
                <p className="text-secondary-300 text-sm">
                  We use Stripe's secure payment processing. No payment details are stored on our servers.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-8">What would you like to do next?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Try Again */}
                <div className="bg-gradient-to-br from-volt-500/20 to-volt-600/10 border border-volt-500/30 rounded-xl p-6 hover:scale-105 transform transition-all duration-300">
                  <div className="text-4xl mb-4">💳</div>
                  <h4 className="text-xl font-bold text-volt-400 mb-3">Try Again</h4>
                  <p className="text-secondary-300 text-sm mb-6">
                    Ready to get started? Complete your subscription and begin growing your business.
                  </p>
                  <button
                    onClick={handleTryAgain}
                    disabled={!mounted}
                    className="w-full px-6 py-3 bg-volt-500 text-secondary-900 font-bold rounded-lg hover:bg-volt-400 transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  >
                    Choose Plan
                  </button>
                </div>

                {/* Free Analysis */}
                <div className="bg-gradient-to-br from-secondary-700/50 to-secondary-800/30 border border-secondary-600 rounded-xl p-6 hover:scale-105 transform transition-all duration-300">
                  <div className="text-4xl mb-4">🔍</div>
                  <h4 className="text-xl font-bold text-secondary-200 mb-3">Free Analysis</h4>
                  <p className="text-secondary-300 text-sm mb-6">
                    Not ready to subscribe? Start with our free website analysis to see the opportunities.
                  </p>
                  <Link 
                    href="/analyze"
                    className="block w-full px-6 py-3 bg-secondary-600 text-white font-bold rounded-lg hover:bg-secondary-500 transform hover:scale-105 transition-all duration-300 text-center"
                  >
                    Start Free Analysis
                  </Link>
                </div>

                {/* Schedule Demo */}
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 hover:scale-105 transform transition-all duration-300">
                  <div className="text-4xl mb-4">📞</div>
                  <h4 className="text-xl font-bold text-blue-400 mb-3">Schedule Demo</h4>
                  <p className="text-secondary-300 text-sm mb-6">
                    See DirectoryBolt in action with a personalized demo. Perfect if you have questions.
                  </p>
                  <button
                    onClick={handleScheduleDemo}
                    className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transform hover:scale-105 transition-all duration-300"
                  >
                    Book Demo Call
                  </button>
                </div>
              </div>
            </div>

            {/* Special Offer */}
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 p-8 rounded-2xl border border-green-500/30 mb-12">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold mb-4">Wait! Don't leave empty-handed</h3>
                <p className="text-secondary-300 mb-6">Since you came this far, here's an exclusive offer just for you:</p>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <h4 className="text-xl font-bold text-green-400 mb-2">🚀 Extended Trial Offer</h4>
                  <p className="text-secondary-300 text-sm mb-4">
                    Get <strong className="text-green-400">21 days free</strong> instead of 14 days, plus:
                  </p>
                  <ul className="text-left text-sm text-secondary-300 space-y-1">
                    <li>• Personal onboarding call</li>
                    <li>• Custom directory recommendations</li>
                    <li>• Priority support during trial</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleTryAgain}
                  disabled={!mounted}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl hover:from-green-400 hover:to-green-500 transform hover:scale-105 transition-all duration-300 shadow-xl disabled:opacity-50"
                >
                  Claim Extended Trial
                </button>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-gradient-to-r from-volt-500/10 to-volt-600/10 p-8 rounded-2xl border border-volt-500/20 mb-12">
              <h3 className="text-2xl font-bold mb-6">Still not sure? Here's what our customers say:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <blockquote className="bg-secondary-800/50 p-4 rounded-lg border border-secondary-600">
                  <p className="text-secondary-300 text-sm mb-3">
                    "DirectoryBolt helped us get listed everywhere that matters. We saw a 40% increase in local search traffic within 60 days!"
                  </p>
                  <footer className="text-volt-400 text-xs font-semibold">
                    — Sarah M., Local Restaurant Owner
                  </footer>
                </blockquote>
                
                <blockquote className="bg-secondary-800/50 p-4 rounded-lg border border-secondary-600">
                  <p className="text-secondary-300 text-sm mb-3">
                    "The ROI was incredible. We generated over $10K in new business from directory listings in just 3 months."
                  </p>
                  <footer className="text-volt-400 text-xs font-semibold">
                    — Mike R., Professional Service Provider
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <p className="text-secondary-400 mb-6">
                Questions? We're here to help Monday-Friday, 9am-6pm EST
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleTryAgain}
                  disabled={!mounted}
                  className="px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 disabled:opacity-50"
                >
                  Choose Your Plan
                </button>
                <button
                  onClick={handleContactSupport}
                  className="px-8 py-4 border-2 border-secondary-600 text-secondary-300 font-bold text-lg rounded-xl hover:bg-secondary-600 hover:text-white transform hover:scale-105 transition-all duration-300"
                >
                  Email Support
                </button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-secondary-400 mt-12">
              <span>✅ 30-day money-back guarantee</span>
              <span>✅ No hidden fees</span>
              <span>✅ Cancel anytime</span>
              <span>✅ Secure payments via Stripe</span>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}