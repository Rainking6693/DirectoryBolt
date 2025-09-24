import Head from 'next/head'
import { directoryBoltSchema } from '../lib/seo/enhanced-schema'

export default function LocalSEODirectories() {
  const serviceSchema = directoryBoltSchema.generateServiceSchema()
  const howToSchema = directoryBoltSchema.generateHowToSchema()
  const organizationSchema = directoryBoltSchema.generateOrganizationSchema()

  return (
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>Local SEO Directories | Boost Local Rankings with Directory Submissions</title>
        <meta 
          name="description" 
          content="Improve local SEO rankings with strategic directory submissions. Get listed in 200+ local directories that boost your Google My Business and local search visibility." 
        />
        
        {/* Keyword-Rich Meta Tags */}
        <meta name="keywords" content="local seo directories, local directory submission, local business seo, local citations, local search optimization, google my business optimization" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Local SEO Directories | Boost Local Rankings" />
        <meta property="og:description" content="Improve local SEO with strategic directory submissions to 200+ local directories. Boost Google My Business rankings and local search visibility." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/local-seo-directories" />
        <meta property="og:image" content="https://directorybolt.com/images/local-seo-og.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://directorybolt.com/local-seo-directories" />
        
        {/* Schema Markup */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Local SEO Directories That Drive Rankings
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                Boost your local search rankings with strategic submissions to <strong>200+ local SEO directories</strong>. Improve Google My Business visibility and dominate local search results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
                  Boost Local SEO Now
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors">
                  Free Local SEO Audit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Local SEO Factors Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Local SEO Directories Are Critical
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Local directory citations are one of the top ranking factors for local search results.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Pack Rankings</h3>
                <p className="text-gray-600">
                  Directory citations directly influence your Google My Business rankings in the local 3-pack results.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">NAP Consistency</h3>
                <p className="text-gray-600">
                  Consistent Name, Address, Phone across directories builds trust and authority with search engines.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Search Visibility</h3>
                <p className="text-gray-600">
                  Multiple directory listings increase your chances of appearing in local search results across platforms.
                </p>
              </div>
            </div>

            {/* Local SEO Statistics */}
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-center mb-8">Local SEO Directory Impact</h3>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">73%</div>
                  <p className="text-gray-600">of consumers trust businesses with consistent directory listings</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">46%</div>
                  <p className="text-gray-600">of Google searches have local intent</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">88%</div>
                  <p className="text-gray-600">of consumers read local business reviews</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">76%</div>
                  <p className="text-gray-600">visit a business within 24 hours of local search</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Types Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Essential Local SEO Directory Categories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We target the most impactful directories for local SEO success across all major categories.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Primary Directories</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Google Business Profile</li>
                  <li>✓ Bing Places for Business</li>
                  <li>✓ Apple Maps Connect</li>
                  <li>✓ Yelp for Business</li>
                  <li>✓ Facebook Business</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> High authority, direct ranking influence
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Citation Directories</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Yellow Pages</li>
                  <li>✓ White Pages</li>
                  <li>✓ Superpages</li>
                  <li>✓ Local.com</li>
                  <li>✓ CitySearch</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> NAP consistency, citation building
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Review Platforms</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ TripAdvisor</li>
                  <li>✓ Foursquare</li>
                  <li>✓ Better Business Bureau</li>
                  <li>✓ Angie's List</li>
                  <li>✓ Trustpilot</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> Trust signals, review generation
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Local Chambers</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Chamber of Commerce</li>
                  <li>✓ Local business associations</li>
                  <li>✓ Economic development councils</li>
                  <li>✓ Tourism boards</li>
                  <li>✓ Municipal websites</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> Local authority, community trust
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Industry-Specific</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Healthcare directories</li>
                  <li>✓ Legal directories</li>
                  <li>✓ Restaurant platforms</li>
                  <li>✓ Professional services</li>
                  <li>✓ Trade associations</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> Niche authority, targeted traffic
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Data Aggregators</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Acxiom</li>
                  <li>✓ Infogroup</li>
                  <li>✓ Localeze</li>
                  <li>✓ Factual</li>
                  <li>✓ Neustar</li>
                </ul>
                <div className="mt-4 text-sm text-gray-500">
                  <strong>Impact:</strong> Data distribution, wide reach
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Local SEO Directory Process
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Strategic, data-driven approach to maximize your local search rankings.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="text-lg font-semibold mb-2">Local SEO Audit</h3>
                <p className="text-gray-600">Analyze current directory presence and identify optimization opportunities.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="text-lg font-semibold mb-2">NAP Optimization</h3>
                <p className="text-gray-600">Ensure consistent Name, Address, Phone across all directory submissions.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="text-lg font-semibold mb-2">Strategic Submission</h3>
                <p className="text-gray-600">Submit to high-impact directories prioritized for local SEO value.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
                <p className="text-gray-600">Monitor local rankings and provide detailed performance reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Dominate Local Search?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Boost your local SEO rankings with strategic directory submissions to 200+ local directories.
            </p>
            <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Local SEO Campaign
            </button>
          </div>
        </section>
      </div>
    </>
  )
}