import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import PostPaymentBusinessForm from '../components/PostPaymentBusinessForm'

interface CollectInfoPageProps {}

interface BusinessFormData {
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  website: string
  description: string
  facebook: string
  instagram: string
  linkedin: string
  logo: File | null
}

export default function CollectInfoPage({}: CollectInfoPageProps) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>('')
  const [packageType, setPackageType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && router.query) {
      // Get session ID and package type from URL params
      const { session_id, plan, package: pkg } = router.query
      
      if (session_id && typeof session_id === 'string') {
        setSessionId(session_id)
      }
      
      if (plan && typeof plan === 'string') {
        setPackageType(plan)
      } else if (pkg && typeof pkg === 'string') {
        setPackageType(pkg)
      }
    }
  }, [mounted, router.query])

  const handleFormSubmit = async (formData: BusinessFormData) => {
    setLoading(true)
    setError('')

    try {
      // Prepare form data for submission
      const submitData = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'logo' && value) {
          submitData.append('logo', value)
        } else if (value && typeof value === 'string') {
          submitData.append(key, value)
        }
      })
      
      // Add session metadata
      if (sessionId) {
        submitData.append('sessionId', sessionId)
      }
      if (packageType) {
        submitData.append('packageType', packageType)
      }
      
      submitData.append('submissionStatus', 'pending')
      submitData.append('purchaseDate', new Date().toISOString())

      // Submit to API endpoint (will be created by Shane for Airtable integration)
      const response = await fetch('/api/business-info/submit', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save business information')
      }

      const result = await response.json()
      
      // Track completion event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'business_info_complete', {
          package: packageType,
          business_name: formData.businessName,
          session_id: sessionId
        })
      }

      // Redirect to success page with completion message
      router.push(`/success?session_id=${sessionId}&info_collected=true&customer_id=${result.customerId}`)
      
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-secondary-900 text-white flex items-center justify-center">
        <div className="animate-pulse text-2xl text-secondary-400">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Complete Your Business Profile - DirectoryBolt</title>
        <meta name="description" content="Provide your business information to optimize your directory submissions. Fast and secure setup." />
        <meta name="robots" content="noindex, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DirectoryBolt - Complete Business Profile" />
        <meta property="og:description" content="Final step to optimize your directory submissions" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/collect-info" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "WebPage",
              "name": "DirectoryBolt Business Information Collection",
              "description": "Complete your business profile for optimized directory submissions",
              "url": "https://directorybolt.com/collect-info",
              "mainEntity": {
                "@type": "WebForm",
                "name": "Business Information Form",
                "description": "Collect comprehensive business information for directory optimization"
              }
            })
          }}
        />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="min-h-screen bg-secondary-900 text-white">
        <Header />
        
        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-success-400 font-semibold">Payment Confirmed</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
              Let's Optimize Your Directory Listings
            </h1>
            <p className="text-lg text-secondary-300 max-w-3xl mx-auto">
              We need some additional information to ensure your business gets listed accurately across all directories.
              This will take just a few minutes and significantly improve your results.
            </p>
          </div>

          <main className="py-8">
            <PostPaymentBusinessForm
              sessionId={sessionId}
              packageType={packageType}
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
            />
          </main>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 border-t border-secondary-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-volt-400 mb-4">Your Information is Safe</h2>
              <div className="flex flex-wrap justify-center items-center gap-8 text-secondary-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Never Sold or Shared</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">24/7 Support Available</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Happens Next */}
        <section className="py-12 bg-secondary-800/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">What Happens Next?</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-volt-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-volt-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3m0 2v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Information Processing</h3>
                <p className="text-secondary-300 text-sm">
                  We'll optimize your information for each directory's specific requirements
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-volt-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-volt-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Automated Submissions</h3>
                <p className="text-secondary-300 text-sm">
                  Our system will begin submitting to directories within 24 hours
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-volt-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-volt-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Results Tracking</h3>
                <p className="text-secondary-300 text-sm">
                  You'll receive detailed reports on all successful submissions
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}