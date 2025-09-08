import Head from 'next/head'
import { directoryBoltSchema } from '../lib/seo/enhanced-schema'

export default function DirectorySubmissionService() {
  const serviceSchema = directoryBoltSchema.generateServiceSchema()
  const faqSchema = directoryBoltSchema.generateFAQSchema()
  const organizationSchema = directoryBoltSchema.generateOrganizationSchema()

  return (
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>Directory Submission Service | AI-Powered Business Listings | DirectoryBolt</title>
        <meta 
          name="description" 
          content="Professional directory submission service that submits your business to 200+ directories automatically. AI-powered optimization ensures maximum approval rates. Starting at $49." 
        />
        
        {/* Keyword-Rich Meta Tags */}
        <meta name="keywords" content="directory submission service, business directory submission, online directory submission, local directory submission, automated directory listings, business listing service" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="AI-Powered Directory Submission Service | DirectoryBolt" />
        <meta property="og:description" content="Submit your business to 200+ directories automatically with AI optimization. Boost local SEO and online visibility. Professional directory submission service starting at $49." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/directory-submission-service" />
        <meta property="og:image" content="https://directorybolt.com/images/directory-submission-og.jpg" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI-Powered Directory Submission Service | DirectoryBolt" />
        <meta name="twitter:description" content="Submit your business to 200+ directories automatically with AI optimization. Professional directory submission service starting at $49." />
        <meta name="twitter:image" content="https://directorybolt.com/images/directory-submission-twitter.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://directorybolt.com/directory-submission-service" />
        
        {/* Schema Markup */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section - Optimized for "directory submission service" */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Professional Directory Submission Service
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                Submit your business to <strong>200+ high-authority directories</strong> automatically with our AI-powered directory submission service. Boost your local SEO and online visibility starting at just $49.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start Directory Submissions
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                  View Pricing Plans
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - Keyword Rich */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Directory Submission Service?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI-powered business directory submission service delivers superior results compared to manual submissions or outdated tools.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Optimization</h3>
                <p className="text-gray-600">
                  Our artificial intelligence analyzes your business and optimizes submissions for maximum approval rates across all directory platforms.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">200+ Premium Directories</h3>
                <p className="text-gray-600">
                  Submit to Google Business Profile, Yelp, Yellow Pages, Bing Places, and 200+ other high-authority business directories.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Detailed Analytics</h3>
                <p className="text-gray-600">
                  Receive comprehensive reports showing submission status, approval rates, and recommendations for improved local SEO performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Our Directory Submission Service Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our streamlined process makes business directory submission simple and effective.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="text-lg font-semibold mb-2">Provide Business Info</h3>
                <p className="text-gray-600">Share your business name, address, phone, website, and category details.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-600">Our AI analyzes your website and optimizes your business information for directories.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="text-lg font-semibold mb-2">Automated Submission</h3>
                <p className="text-gray-600">We submit your business to 200+ directories within 24-48 hours.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h3 className="text-lg font-semibold mb-2">Detailed Report</h3>
                <p className="text-gray-600">Receive a comprehensive report with submission status and SEO recommendations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Directory Submission Service Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect directory submission package for your business needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter Package */}
              <div className="border-2 border-gray-200 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Starter Package</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$49</div>
                <p className="text-gray-600 mb-6">Perfect for new businesses</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    50 Directory Submissions
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI-Powered Optimization
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Detailed Report
                  </li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </div>

              {/* Growth Package */}
              <div className="border-2 border-blue-500 rounded-lg p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-4">Growth Package</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$89</div>
                <p className="text-gray-600 mb-6">Best for growing businesses</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    100 Directory Submissions
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced AI Optimization
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority Support
                  </li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </div>

              {/* Professional Package */}
              <div className="border-2 border-gray-200 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Professional Package</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$159</div>
                <p className="text-gray-600 mb-6">For established businesses</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    200+ Directory Submissions
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Premium AI Analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Dedicated Account Manager
                  </li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Directory Submission Service FAQ
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about our business directory submission service.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How many directories does DirectoryBolt submit to?</h3>
                <p className="text-gray-600">
                  DirectoryBolt submits your business to 200+ high-authority directories including Google Business Profile, Yelp, Yellow Pages, Bing Places, and industry-specific directories relevant to your business.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How long does directory submission take?</h3>
                <p className="text-gray-600">
                  Our AI-powered system completes most directory submissions within 24-48 hours. You'll receive a detailed report showing all completed submissions and their status.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What information do I need to provide?</h3>
                <p className="text-gray-600">
                  You need basic business information: business name, address, phone number, website URL, business category, and a brief description. Our AI analyzes your website to optimize submissions automatically.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do you guarantee directory approval?</h3>
                <p className="text-gray-600">
                  While we cannot guarantee approval from every directory (as each has its own criteria), our AI optimization significantly improves approval rates. We provide detailed reports on all submission attempts and their outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Boost Your Online Visibility?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your directory submission campaign today and see results within 48 hours.
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Directory Submissions Now
            </button>
          </div>
        </section>
      </div>
    </>
  )
}