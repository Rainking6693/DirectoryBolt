import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import OnboardingFlow from '../components/OnboardingFlow'
import Header from '../components/Header'

interface CustomerData {
  firstName: string
  lastName: string
  businessName: string
  businessEmail: string
  businessWebsite: string
  businessDescription: string
  phoneNumber?: string
  selectedPackage: string
  directoryCategories: string[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const [startingStep, setStartingStep] = useState(1)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    // Handle URL parameters
    const { step, cancelled: cancelledParam } = router.query
    
    if (step && typeof step === 'string') {
      const stepNumber = parseInt(step)
      if (stepNumber >= 1 && stepNumber <= 3) {
        setStartingStep(stepNumber)
      }
    }

    if (cancelledParam === 'true') {
      setCancelled(true)
      // Clear the cancelled parameter after showing the message
      setTimeout(() => setCancelled(false), 5000)
    }
  }, [router.query])

  const handleOnboardingComplete = (data: CustomerData & { sessionId?: string; queueId?: string }) => {
    console.log('Onboarding completed:', data)
    
    // Track completion event (analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_complete', {
        package: data.selectedPackage,
        business_name: data.businessName,
        queue_id: data.queueId
      })
    }

    // Redirect to success page with queue information
    router.push(`/success?session_id=${data.sessionId}&queue_id=${data.queueId}&onboarding=complete`)
  }

  const handleStepChange = (step: number) => {
    // Update URL to reflect current step
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('step', step.toString())
    window.history.replaceState({}, '', currentUrl.toString())
  }

  return (
    <>
      <Head>
        <title>Get Started - DirectoryBolt Onboarding</title>
        <meta name="description" content="Complete your DirectoryBolt setup in minutes. Enter your business information, choose a plan, and start getting listed in 480+ directories today." />
        <meta name="robots" content="noindex, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DirectoryBolt Onboarding - Get Started Today" />
        <meta property="og:description" content="Quick setup process to get your business listed in 480+ directories" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/onboarding" />
        
        {/* Structured Data for Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "WebPage",
              "name": "DirectoryBolt Onboarding",
              "description": "Complete your DirectoryBolt setup and start getting listed in directories",
              "url": "https://directorybolt.com/onboarding",
              "mainEntity": {
                "@type": "Service",
                "name": "DirectoryBolt Setup Process",
                "description": "Three-step onboarding process to get your business listed in 480+ directories",
                "provider": {
                  "@type": "Organization",
                  "name": "DirectoryBolt"
                }
              }
            })
          }}
        />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </Head>

      <div className="min-h-screen bg-secondary-900 text-white">
        <Header />
        
        {/* Cancelled Payment Notice */}
        {cancelled && (
          <div className="bg-warning-900/20 border-l-4 border-warning-500 p-4 mb-6">
            <div className="flex items-center max-w-6xl mx-auto px-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-warning-200">
                  Payment was cancelled. You can continue where you left off or choose a different package.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setCancelled(false)}
                  className="text-warning-400 hover:text-warning-300"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <OnboardingFlow
            startingStep={startingStep}
            onComplete={handleOnboardingComplete}
            onStepChange={handleStepChange}
          />
        </main>

        {/* Trust Indicators */}
        <section className="py-12 border-t border-secondary-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-volt-400 mb-4">Trusted by 500+ Businesses</h2>
              <div className="flex flex-wrap justify-center items-center gap-8 text-secondary-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Money-Back Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span className="text-sm">Results in 48 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}