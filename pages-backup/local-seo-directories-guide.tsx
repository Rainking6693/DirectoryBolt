import Head from 'next/head'
import { directoryBoltSchema } from '../lib/seo/enhanced-schema'
import Header from '../components/Header'

export default function LocalSEODirectoriesGuide() {
  const serviceSchema = directoryBoltSchema.generateServiceSchema()
  const howToSchema = directoryBoltSchema.generateHowToSchema()
  const organizationSchema = directoryBoltSchema.generateOrganizationSchema()

  return (
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>Local SEO Directories Guide: 200+ Directories for Local Business</title>
        <meta 
          name="description" 
          content="Complete guide to local SEO directories. Get listed on 200+ local directories to boost your Google My Business rankings and local search visibility." 
        />
        
        {/* Keyword-Rich Meta Tags */}
        <meta name="keywords" content="local seo directories, local business directories, local directory submission, local seo citations, google my business optimization, local search directories, local business listings" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Local SEO Directories Guide: 200+ Directories for Local Business" />
        <meta property="og:description" content="Complete guide to local SEO directories. Get listed on 200+ local directories to boost your Google My Business rankings and local search visibility." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://directorybolt.com/local-seo-directories-guide" />
        <meta property="og:image" content="https://directorybolt.com/images/local-seo-directories-guide-og.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://directorybolt.com/local-seo-directories-guide" />
        
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
        
        {/* BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://directorybolt.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Local SEO Directories Guide",
                  "item": "https://directorybolt.com/local-seo-directories-guide"
                }
              ]
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-secondary-900 text-white">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
              Local SEO Directories: Complete Guide to 200+ Local Business Directories
            </h1>
            <p className="text-xl text-secondary-300 mb-8">
              Boost your local search rankings and Google My Business visibility with strategic directory submissions to 200+ local SEO directories.
            </p>
            <div className="bg-volt-500/10 border border-volt-500/30 rounded-lg p-6 mb-8">
              <p className="text-volt-400 font-semibold">
                🎯 Local directory listings can increase your local search visibility by up to 300% and drive 15+ more leads per month.
              </p>
            </div>
          </section>

          {/* Why Local Directories Matter */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Why Local Directory Listings Matter for SEO</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-volt-500/30">
                <h3 className="text-xl font-bold text-volt-400 mb-4">🚀 SEO Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">📈</span>
                    <span>Improve Google My Business rankings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">🔍</span>
                    <span>Increase local search visibility</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">🏆</span>
                    <span>Build local authority and trust</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">🎯</span>
                    <span>Target local customers effectively</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-success-500/30">
                <h3 className="text-xl font-bold text-success-400 mb-4">💰 Business Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-success-400 mr-2">📞</span>
                    <span>Generate more local leads</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-success-400 mr-2">🏪</span>
                    <span>Increase foot traffic to your business</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-success-400 mr-2">⭐</span>
                    <span>Build online reputation and reviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-success-400 mr-2">📱</span>
                    <span>Improve mobile search presence</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Top Local SEO Directories */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Top Local SEO Directories by Category</h2>
            
            {/* General Business Directories */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-volt-400 mb-4">🌐 General Business Directories</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Essential Directories</h4>
                  <ul className="space-y-2">
                    <li>• Google My Business (Free)</li>
                    <li>• Yelp (Free)</li>
                    <li>• Yellow Pages (Free)</li>
                    <li>• Better Business Bureau (Free)</li>
                    <li>• Foursquare (Free)</li>
                    <li>• Bing Places (Free)</li>
                  </ul>
                </div>
                
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">High-Authority Directories</h4>
                  <ul className="space-y-2">
                    <li>• Manta (Free)</li>
                    <li>• Local.com (Free)</li>
                    <li>• Citysearch (Free)</li>
                    <li>• MerchantCircle (Free)</li>
                    <li>• Hotfrog (Free)</li>
                    <li>• Brownbook (Free)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Industry-Specific Directories */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-volt-400 mb-4">🏥 Industry-Specific Directories</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Healthcare</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Healthgrades</li>
                    <li>• Vitals</li>
                    <li>• WebMD</li>
                    <li>• Zocdoc</li>
                    <li>• RateMDs</li>
                  </ul>
                </div>
                
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Real Estate</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Zillow</li>
                    <li>• Realtor.com</li>
                    <li>• Trulia</li>
                    <li>• Redfin</li>
                    <li>• Homes.com</li>
                  </ul>
                </div>
                
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Restaurants</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• OpenTable</li>
                    <li>• TripAdvisor</li>
                    <li>• Zagat</li>
                    <li>• MenuPages</li>
                    <li>• Grubhub</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Local Search Directories */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-volt-400 mb-4">📍 Local Search Directories</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Regional Directories</h4>
                  <ul className="space-y-2">
                    <li>• Local.com</li>
                    <li>• Citysearch</li>
                    <li>• Local.yahoo.com</li>
                    <li>• Superpages</li>
                    <li>• Whitepages</li>
                  </ul>
                </div>
                
                <div className="bg-secondary-800/50 rounded-lg p-6 border border-secondary-700">
                  <h4 className="font-bold text-lg mb-3">Community Directories</h4>
                  <ul className="space-y-2">
                    <li>• Nextdoor</li>
                    <li>• Patch.com</li>
                    <li>• Craigslist</li>
                    <li>• Angie's List</li>
                    <li>• HomeAdvisor</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Local SEO Best Practices */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Local SEO Directory Best Practices</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-volt-500/30">
                <h3 className="text-xl font-bold text-volt-400 mb-4">✅ Do's</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">📝</span>
                    <span>Keep NAP (Name, Address, Phone) consistent across all directories</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">🖼️</span>
                    <span>Use high-quality, professional photos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">📝</span>
                    <span>Write unique, keyword-rich descriptions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">⭐</span>
                    <span>Encourage and respond to customer reviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-volt-400 mr-2">🔄</span>
                    <span>Regularly update your business information</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-danger-500/30">
                <h3 className="text-xl font-bold text-danger-400 mb-4">❌ Don'ts</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-danger-400 mr-2">❌</span>
                    <span>Don't use duplicate content across directories</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-danger-400 mr-2">❌</span>
                    <span>Don't submit to low-quality or spam directories</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-danger-400 mr-2">❌</span>
                    <span>Don't ignore negative reviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-danger-400 mr-2">❌</span>
                    <span>Don't use fake or misleading information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-danger-400 mr-2">❌</span>
                    <span>Don't submit to directories that don't match your business</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Local SEO Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Local SEO Directory Submission Checklist</h2>
            
            <div className="bg-secondary-800/50 rounded-lg p-8 border border-volt-500/30">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-volt-400 mb-4">📋 Pre-Submission Checklist</h3>
                  <ul className="space-y-2">
                    <li>☐ Business name is consistent</li>
                    <li>☐ Complete address with ZIP code</li>
                    <li>☐ Phone number with area code</li>
                    <li>☐ Business email address</li>
                    <li>☐ Website URL</li>
                    <li>☐ Business hours</li>
                    <li>☐ Business description (100-200 words)</li>
                    <li>☐ High-quality business photos</li>
                    <li>☐ Business category selection</li>
                    <li>☐ Service area definition</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-volt-400 mb-4">🎯 Submission Strategy</h3>
                  <ul className="space-y-2">
                    <li>☐ Start with Google My Business</li>
                    <li>☐ Submit to top 10 general directories</li>
                    <li>☐ Target industry-specific directories</li>
                    <li>☐ Submit to local/regional directories</li>
                    <li>☐ Monitor submission status</li>
                    <li>☐ Verify listings after submission</li>
                    <li>☐ Update information as needed</li>
                    <li>☐ Track ranking improvements</li>
                    <li>☐ Monitor review mentions</li>
                    <li>☐ Regular maintenance and updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Local SEO Results Timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Expected Results Timeline</h2>
            
            <div className="space-y-6">
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-volt-500/30">
                <h3 className="text-xl font-bold text-volt-400 mb-2">Week 1-2: Initial Setup</h3>
                <p className="text-secondary-300">Complete Google My Business optimization and submit to top 20 directories. Expect to see initial indexing and basic listing visibility.</p>
              </div>
              
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-success-500/30">
                <h3 className="text-xl font-bold text-success-400 mb-2">Month 1: Early Results</h3>
                <p className="text-secondary-300">Directory listings start appearing in search results. Local search visibility begins to improve. First reviews may start coming in.</p>
              </div>
              
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-volt-500/30">
                <h3 className="text-xl font-bold text-volt-400 mb-2">Month 2-3: Momentum Building</h3>
                <p className="text-secondary-300">Significant improvement in local search rankings. Increased website traffic from directory referrals. More customer reviews and engagement.</p>
              </div>
              
              <div className="bg-secondary-800/50 rounded-lg p-6 border border-success-500/30">
                <h3 className="text-xl font-bold text-success-400 mb-2">Month 4-6: Full Impact</h3>
                <p className="text-secondary-300">Maximum local SEO benefits realized. Consistent top 3 rankings for local searches. 15+ new leads per month from directory listings.</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Dominate Local Search?</h2>
            <p className="text-xl text-secondary-300 mb-8">
              Get listed on 200+ local SEO directories with our automated directory submission service. 
              Save 95% of your time and boost your local search rankings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/pricing" 
                className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold px-8 py-4 rounded-xl hover:from-volt-400 hover:to-volt-500 transition-all duration-300 transform hover:scale-105"
              >
                Start Directory Submissions
              </a>
              <a 
                href="/analyze" 
                className="border-2 border-volt-500 text-volt-500 font-bold px-8 py-4 rounded-xl hover:bg-volt-500 hover:text-secondary-900 transition-all duration-300"
              >
                Get Free Local SEO Analysis
              </a>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

// Generate static props for better SEO
export async function getStaticProps() {
  return {
    props: {
      lastModified: new Date().toISOString(),
    },
    revalidate: 86400, // Revalidate daily
  }
}
