import Head from 'next/head'
import { directoryBoltSchema } from '../lib/seo/enhanced-schema'

export default function DirectorySubmissionServiceNewYork() {
  const serviceSchema = directoryBoltSchema.generateServiceSchema()
  const localBusinessSchema = directoryBoltSchema.generateLocalBusinessSchema({
    name: 'DirectoryBolt - New York',
    description: 'Professional directory submission service in New York. Get your NYC business listed in 200+ directories.',
    website: 'https://directorybolt.com/directory-submission-service-new-york',
    phone: '+1-555-DIRECTORY',
    address: 'New York, NY',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    latitude: 40.7128,
    longitude: -74.0060,
    hours: 'Mo-Fr 09:00-17:00',
    priceRange: '$$'
  })

  return (
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>Directory Submission Service New York | NYC Business Listings | DirectoryBolt</title>
        <meta 
          name="description" 
          content="Professional directory submission service in New York. Get your NYC business listed in 200+ directories automatically. Local SEO optimization for New York businesses." 
        />
        
        {/* Keyword-Rich Meta Tags */}
        <meta name="keywords" content="directory submission service new york, nyc business listings, new york directory submission, business directory new york, local seo new york, nyc business directories" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Directory Submission Service New York | NYC Business Listings" />
        <meta property="og:description" content="Get your New York business listed in 200+ directories automatically. Professional directory submission service for NYC businesses." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/directory-submission-service-new-york" />
        <meta property="og:image" content="https://directorybolt.com/images/new-york-directory-og.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://directorybolt.com/directory-submission-service-new-york" />
        
        {/* Schema Markup */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Directory Submission Service in New York
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                Get your <strong>New York business listed in 200+ directories</strong> automatically. Professional directory submission service for NYC businesses with AI-powered optimization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Listed in NYC Directories
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                  Free NYC SEO Audit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* NYC-Specific Benefits */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why NYC Businesses Choose DirectoryBolt
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Specialized directory submission service for New York's competitive business landscape.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">NYC Local SEO Focus</h3>
                <p className="text-gray-600">
                  Specialized optimization for New York's five boroughs with targeted local directory submissions.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Manhattan Business Directories</h3>
                <p className="text-gray-600">
                  Access to exclusive Manhattan business directories and NYC Chamber of Commerce listings.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Competitive Advantage</h3>
                <p className="text-gray-600">
                  Stand out in NYC's competitive market with comprehensive directory coverage and optimization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NYC Directory Categories */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                New York Business Directory Coverage
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive directory submissions across all NYC boroughs and business categories.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">NYC Local Directories</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• NYC.gov Business Directory</li>
                  <li>• Manhattan Chamber of Commerce</li>
                  <li>• Brooklyn Business Directory</li>
                  <li>• Queens Business Network</li>
                  <li>• Bronx Business Directory</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Industry-Specific NYC</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• NYC Restaurant Directories</li>
                  <li>• Manhattan Legal Directory</li>
                  <li>• NYC Healthcare Providers</li>
                  <li>• Financial District Businesses</li>
                  <li>• NYC Tech Company Directory</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Tourism & Lifestyle</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• NYC Tourism Board</li>
                  <li>• Time Out New York</li>
                  <li>• NYC Event Directories</li>
                  <li>• Manhattan Lifestyle Guides</li>
                  <li>• NYC Shopping Directories</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* NYC Success Stories */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                NYC Business Success Stories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Real results from New York businesses using our directory submission service.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-8">
                <blockquote className="text-lg text-gray-700 mb-6">
                  "DirectoryBolt got our Manhattan restaurant listed in 150+ directories in just 48 hours. We went from page 3 to the top 3 Google results for 'Italian restaurant Manhattan' within 6 weeks."
                </blockquote>
                <div className="flex items-center">
                  <div>
                    <div className="font-semibold">Tony Rossi</div>
                    <div className="text-gray-600">Owner, Bella Vista Restaurant, Manhattan</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <blockquote className="text-lg text-gray-700 mb-6">
                  "Our Brooklyn law firm saw a 73% increase in local search visibility after DirectoryBolt's directory submissions. The NYC-specific optimization made all the difference."
                </blockquote>
                <div className="flex items-center">
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-gray-600">Partner, Chen & Associates Law, Brooklyn</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Dominate NYC Search Results?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get your New York business listed in 200+ directories and start seeing results within 48 hours.
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start NYC Directory Campaign
            </button>
          </div>
        </section>
      </div>
    </>
  )
}