import Head from 'next/head'
import { directoryBoltSchema } from '../lib/seo/enhanced-schema'

export default function BusinessDirectoryListings() {
  const serviceSchema = directoryBoltSchema.generateServiceSchema()
  const faqSchema = directoryBoltSchema.generateFAQSchema()
  const organizationSchema = directoryBoltSchema.generateOrganizationSchema()

  return (
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>Business Directory Listings | Get Listed in 200+ Directories | DirectoryBolt</title>
        <meta 
          name="description" 
          content="Get your business listed in 200+ high-authority directories automatically. Boost local SEO with comprehensive business directory listings. AI-powered optimization included." 
        />
        
        {/* Keyword-Rich Meta Tags */}
        <meta name="keywords" content="business directory listings, local business directories, online business listings, directory marketing, local directory listings, business listing service" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Business Directory Listings | Get Listed in 200+ Directories" />
        <meta property="og:description" content="Boost your local SEO with comprehensive business directory listings across 200+ platforms. AI-powered optimization ensures maximum visibility." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/business-directory-listings" />
        <meta property="og:image" content="https://directorybolt.com/images/business-listings-og.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://directorybolt.com/business-directory-listings" />
        
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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Business Directory Listings That Drive Results
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                Get your business listed in <strong>200+ high-authority directories</strong> including Google Business Profile, Yelp, Yellow Pages, and industry-specific platforms. Boost your local SEO and online visibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
                  Get Listed Today
                </button>
                <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors">
                  View Directory List
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Categories Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Business Directory Coverage
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We submit your business to the most important directories across all major categories and industries.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Major Search Engines</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Google Business Profile</li>
                  <li>• Bing Places for Business</li>
                  <li>• Yahoo Local</li>
                  <li>• Apple Maps Connect</li>
                  <li>• DuckDuckGo</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Review Platforms</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Yelp Business</li>
                  <li>• TripAdvisor</li>
                  <li>• Foursquare</li>
                  <li>• Better Business Bureau</li>
                  <li>• Trustpilot</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Local Directories</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Yellow Pages</li>
                  <li>• White Pages</li>
                  <li>• Superpages</li>
                  <li>• Local.com</li>
                  <li>• CitySearch</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Industry-Specific</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Healthcare directories</li>
                  <li>• Legal directories</li>
                  <li>• Restaurant platforms</li>
                  <li>• Professional services</li>
                  <li>• E-commerce platforms</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Social Platforms</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Facebook Business</li>
                  <li>• LinkedIn Company</li>
                  <li>• Instagram Business</li>
                  <li>• Twitter Business</li>
                  <li>• Pinterest Business</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Niche Directories</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Chamber of Commerce</li>
                  <li>• Trade associations</li>
                  <li>• Local business groups</li>
                  <li>• Regional directories</li>
                  <li>• Specialty platforms</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Business Directory Listings Matter
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Strategic directory listings are essential for local SEO success and online visibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">Boost Your Local SEO Rankings</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Improve Local Search Rankings</h4>
                      <p className="text-gray-600">Consistent NAP (Name, Address, Phone) citations across directories signal authority to search engines.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Increase Online Visibility</h4>
                      <p className="text-gray-600">Appear in more search results and reach customers across multiple platforms and directories.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Build Trust and Credibility</h4>
                      <p className="text-gray-600">Listings on authoritative directories enhance your business credibility and customer trust.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Directory Listing Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Local Search Visibility</span>
                    <span className="font-bold text-green-600">+73%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Website Traffic</span>
                    <span className="font-bold text-green-600">+45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phone Calls</span>
                    <span className="font-bold text-green-600">+38%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Reviews</span>
                    <span className="font-bold text-green-600">+52%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">*Based on average results from 500+ DirectoryBolt clients</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-green-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Dominate Local Search Results?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Get your business listed in 200+ directories and start seeing results within 48 hours.
            </p>
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Your Directory Listings
            </button>
          </div>
        </section>
      </div>
    </>
  )
}