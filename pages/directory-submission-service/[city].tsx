import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/layout/Layout'
import { directoryBoltSchema } from '../../lib/seo/enhanced-schema'

interface CityData {
  name: string
  state: string
  stateCode: string
  population: number
  businessCount: number
  topDirectories: string[]
  localChamber: string
  coordinates: { lat: number, lng: number }
  majorIndustries: string[]
  nearbyAreas: string[]
  zipCodes: string[]
}

interface CityPageProps {
  city: CityData
  slug: string
}

export default function CityDirectorySubmissionPage({ city, slug }: CityPageProps) {
  const pageTitle = `Directory Submission Service in ${city.name}, ${city.stateCode} | DirectoryBolt`
  const pageDescription = `Professional directory submission service for businesses in ${city.name}, ${city.state}. Get listed on 480+ local and national directories. Boost your local SEO today.`
  
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`directory submission ${city.name}, local SEO ${city.name}, business listings ${city.state}, ${city.name} business directory, ${city.name} local marketing`} />
        <link rel="canonical" href={`https://directorybolt.com/directory-submission-service/${slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://directorybolt.com/directory-submission-service/${slug}`} />
        <meta property="og:image" content={`https://directorybolt.com/images/cities/${slug}-directory-service.jpg`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`https://directorybolt.com/images/cities/${slug}-directory-service.jpg`} />
        
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": `Directory Submission Service in ${city.name}`,
              "description": `Professional directory submission service for businesses in ${city.name}, ${city.state}. Get listed on 480+ directories for increased local visibility.`,
              "provider": {
                "@type": "LocalBusiness",
                "@id": "https://directorybolt.com/#organization",
                "name": "DirectoryBolt",
                "areaServed": {
                  "@type": "City",
                  "name": city.name,
                  "containedInPlace": {
                    "@type": "State",
                    "name": city.state
                  }
                }
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": city.coordinates.lat,
                "longitude": city.coordinates.lng
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "price": "149",
                "priceRange": "$149-$799",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "127"
              }
            })
          }}
        />
        
        {/* Local Area Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Place",
              "name": city.name,
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": city.coordinates.lat,
                "longitude": city.coordinates.lng
              },
              "containedInPlace": {
                "@type": "State",
                "name": city.state
              },
              "description": `${city.name} is a major business hub in ${city.state} with over ${city.businessCount.toLocaleString()} local businesses across various industries.`
            })
          }}
        />
        
        {/* Breadcrumb Schema */}
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
                  "name": "Directory Submission Service",
                  "item": "https://directorybolt.com/directory-submission-service"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": `${city.name}, ${city.stateCode}`,
                  "item": `https://directorybolt.com/directory-submission-service/${slug}`
                }
              ]
            })
          }}
        />
        
        {/* FAQ Schema for City Page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": `How many directories will my ${city.name} business be submitted to?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `We submit your ${city.name} business to 480+ directories including local ${city.name} directories, ${city.state} state directories, and national platforms relevant to your industry.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `Do you include ${city.name}-specific directories?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Yes, we include ${city.name} Chamber of Commerce, local business associations, and ${city.name}-specific directories to maximize your local visibility.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `How long does directory submission take for ${city.name} businesses?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Most ${city.name} directory submissions are completed within 24-48 hours. Directory approval times vary, but most approve listings within 1-4 weeks.`
                  }
                }
              ]
            })
          }}
        />
      </Head>

      <Layout>
        <div className="min-h-screen">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-volt-500/10 backdrop-blur-sm border border-volt-500/20 rounded-lg px-4 py-2 mb-6">
                  <span className="text-volt-400 mr-2">📍</span>
                  <span className="text-secondary-300">Local Directory Service</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Directory Submission Service in
                  <span className="block text-volt-400">{city.name}, {city.stateCode}</span>
                </h1>
                <p className="text-xl text-secondary-300 max-w-3xl mx-auto mb-8">
                  Help your {city.name} business get discovered by more customers. Our AI-powered directory submission service gets you listed on 480+ local and national directories for maximum visibility.
                </p>
                
                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
                  <div className="bg-secondary-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-volt-400">{city.businessCount.toLocaleString()}+</div>
                    <div className="text-sm text-secondary-300">Local Businesses</div>
                  </div>
                  <div className="bg-secondary-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-volt-400">480+</div>
                    <div className="text-sm text-secondary-300">Directory Listings</div>
                  </div>
                  <div className="bg-secondary-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-volt-400">48hrs</div>
                    <div className="text-sm text-secondary-300">Avg Completion</div>
                  </div>
                  <div className="bg-secondary-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-volt-400">94%</div>
                    <div className="text-sm text-secondary-300">Approval Rate</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/analyze" className="bg-volt-500 text-secondary-900 font-bold px-8 py-4 rounded-xl hover:bg-volt-400 transition-colors inline-flex items-center justify-center">
                    🚀 Start Free Analysis
                  </Link>
                  <Link href="/pricing" className="border-2 border-volt-500 text-volt-500 font-bold px-8 py-4 rounded-xl hover:bg-volt-500 hover:text-secondary-900 transition-colors inline-flex items-center justify-center">
                    View Pricing Plans
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Local Benefits Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why {city.name} Businesses Choose DirectoryBolt
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-volt-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Local Market Knowledge</h3>
                  <p className="text-gray-600">
                    We understand the {city.name} market and know which local directories matter most for businesses in {city.majorIndustries.join(', ')} and other key industries.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-volt-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Targeted Local Submissions</h3>
                  <p className="text-gray-600">
                    Get listed on {city.name}-specific directories, {city.localChamber}, and regional business networks that {city.name} customers actually use.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-volt-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Local SEO Boost</h3>
                  <p className="text-gray-600">
                    Improve your rankings for "{city.name} [your service]" searches and attract more local customers from {city.nearbyAreas.join(', ')} and surrounding areas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Local Directories Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Top Directories for {city.name} Businesses
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {city.topDirectories.map((directory, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-lg mb-2">{directory}</h3>
                    <p className="text-gray-600 text-sm">
                      High-authority directory popular with {city.name} consumers and businesses
                    </p>
                    <div className="mt-3 text-xs text-volt-600 font-medium">
                      ✓ Included in all plans
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <p className="text-gray-600 mb-4">
                  Plus 470+ additional directories including national platforms, industry-specific sites, and regional networks.
                </p>
                <Link href="/pricing" className="text-volt-600 font-semibold hover:text-volt-700">
                  View Complete Directory List →
                </Link>
              </div>
            </div>
          </section>

          {/* Industry Focus Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Serving All {city.name} Industries
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {city.majorIndustries.map((industry, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 text-center hover:bg-volt-50 transition-colors">
                    <h3 className="font-semibold text-lg mb-2">{industry}</h3>
                    <p className="text-gray-600 text-sm">
                      Specialized directory submissions for {city.name} {industry.toLowerCase()} businesses
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Don't see your industry? We work with businesses across all sectors in {city.name}.
                </p>
              </div>
            </div>
          </section>

          {/* Local Success Stories */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                {city.name} Business Success Stories
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-volt-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">JM</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Johnson Marketing</h4>
                      <p className="text-gray-600 text-sm">{city.name} Marketing Agency</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "DirectoryBolt helped us get listed on 200+ directories in just 2 weeks. Our local {city.name} visibility increased by 300%!"
                  </p>
                  <div className="flex text-volt-500">
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-volt-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">TC</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">TechCorp Solutions</h4>
                      <p className="text-gray-600 text-sm">{city.name} IT Services</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "The AI-powered optimization is incredible. We started getting calls from {city.name} customers within 48 hours."
                  </p>
                  <div className="flex text-volt-500">
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-volt-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">LR</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Local Restaurant</h4>
                      <p className="text-gray-600 text-sm">{city.name} Dining</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Best investment we made for our {city.name} restaurant. The dashboard makes tracking our listings so easy."
                  </p>
                  <div className="flex text-volt-500">
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Directory Submission Plans for {city.name} Businesses
              </h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-volt-600 mb-4">$149</div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>50+ Directory Submissions</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Local {city.name} Directories</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Basic Optimization</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Progress Tracking</li>
                  </ul>
                  <Link href="/pricing" className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors block text-center">
                    Get Started
                  </Link>
                </div>
                
                <div className="bg-volt-50 rounded-xl p-6 border-2 border-volt-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-volt-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-bold mb-2">Growth</h3>
                  <div className="text-3xl font-bold text-volt-600 mb-4">$299</div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>150+ Directory Submissions</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>All {city.name} Local Directories</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>AI-Powered Optimization</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Priority Support</li>
                  </ul>
                  <Link href="/pricing" className="w-full bg-volt-500 text-white py-3 rounded-lg font-semibold hover:bg-volt-600 transition-colors block text-center">
                    Get Started
                  </Link>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <div className="text-3xl font-bold text-volt-600 mb-4">$499</div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>300+ Directory Submissions</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Premium {city.name} Networks</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Advanced Analytics</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Monthly Reports</li>
                  </ul>
                  <Link href="/pricing" className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors block text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked Questions - {city.name}
              </h2>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold mb-3">How many directories will my {city.name} business be submitted to?</h3>
                  <p className="text-gray-700">
                    We submit your {city.name} business to 480+ directories including local {city.name} directories, {city.state} state directories, and national platforms relevant to your industry. The exact number depends on your chosen plan and business type.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold mb-3">Do you include {city.name}-specific directories?</h3>
                  <p className="text-gray-700">
                    Yes, we include {city.localChamber}, local business associations, and {city.name}-specific directories to maximize your local visibility. We also submit to directories covering {city.nearbyAreas.join(', ')} and the greater {city.name} area.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold mb-3">How long does directory submission take for {city.name} businesses?</h3>
                  <p className="text-gray-700">
                    Most {city.name} directory submissions are completed within 24-48 hours. Directory approval times vary by platform, but most approve listings within 1-4 weeks. You'll receive real-time updates through our dashboard.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold mb-3">Will this help my {city.name} business rank better in Google?</h3>
                  <p className="text-gray-700">
                    Yes! Directory submissions improve your local SEO by building citations and increasing your online presence. This helps your business rank better for "{city.name} [your service]" searches and appear in Google's local pack results.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-volt-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">
                Ready to Dominate {city.name} Local Search?
              </h2>
              <p className="text-xl text-secondary-800 mb-8">
                Join hundreds of {city.name} businesses that have boosted their online visibility with DirectoryBolt. Get started with a free analysis of your current online presence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/analyze" className="bg-secondary-900 text-volt-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-secondary-800 transition-colors">
                  🚀 Start Free Analysis
                </Link>
                <Link href="/pricing" className="border-2 border-secondary-700 text-secondary-700 px-8 py-4 rounded-lg font-bold text-lg hover:border-secondary-800 hover:bg-secondary-800 hover:text-volt-400 transition-colors">
                  View Pricing Plans
                </Link>
              </div>
              
              <div className="mt-8 text-secondary-700">
                <p className="text-sm">
                  ✓ No setup fees ✓ 30-day money-back guarantee ✓ Results in 48 hours
                </p>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Major US cities for directory submission services
  const cities = [
    'new-york', 'los-angeles', 'chicago', 'houston', 'phoenix',
    'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'san-jose',
    'austin', 'jacksonville', 'fort-worth', 'columbus', 'charlotte',
    'san-francisco', 'indianapolis', 'seattle', 'denver', 'washington-dc',
    'boston', 'el-paso', 'nashville', 'detroit', 'oklahoma-city',
    'portland', 'las-vegas', 'memphis', 'louisville', 'baltimore',
    'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento',
    'kansas-city', 'mesa', 'atlanta', 'omaha', 'colorado-springs',
    'raleigh', 'miami', 'virginia-beach', 'oakland', 'minneapolis',
    'tulsa', 'arlington', 'new-orleans', 'wichita', 'cleveland'
  ]
  
  const paths = cities.map(city => ({
    params: { city }
  }))
  
  return {
    paths,
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // City data - in a real implementation, this would come from a database
  const cityData: Record<string, CityData> = {
    'new-york': {
      name: 'New York',
      state: 'New York',
      stateCode: 'NY',
      population: 8336817,
      businessCount: 215000,
      topDirectories: [
        'NYC.gov Business Directory',
        'Manhattan Chamber of Commerce',
        'Brooklyn Chamber of Commerce',
        'Queens Chamber of Commerce',
        'NYC Business Portal',
        'Time Out New York',
        'NYC & Company',
        'New York Business Journal',
        'Crain\'s New York Business'
      ],
      localChamber: 'New York City Chamber of Commerce',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      majorIndustries: ['Finance', 'Technology', 'Real Estate', 'Healthcare', 'Retail', 'Hospitality'],
      nearbyAreas: ['Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Jersey City', 'Newark'],
      zipCodes: ['10001', '10002', '10003', '10004', '10005']
    },
    'los-angeles': {
      name: 'Los Angeles',
      state: 'California',
      stateCode: 'CA',
      population: 3898747,
      businessCount: 185000,
      topDirectories: [
        'LA Chamber of Commerce',
        'Los Angeles Business Journal',
        'LA.gov Business Portal',
        'Hollywood Chamber of Commerce',
        'Beverly Hills Chamber',
        'Santa Monica Chamber',
        'LA County Business Directory',
        'California Business Directory',
        'LA Tourism & Convention Board'
      ],
      localChamber: 'Los Angeles Area Chamber of Commerce',
      coordinates: { lat: 34.0522, lng: -118.2437 },
      majorIndustries: ['Entertainment', 'Technology', 'Fashion', 'Tourism', 'Manufacturing', 'Healthcare'],
      nearbyAreas: ['Hollywood', 'Beverly Hills', 'Santa Monica', 'Pasadena', 'Long Beach', 'Glendale'],
      zipCodes: ['90001', '90002', '90003', '90004', '90005']
    },
    'chicago': {
      name: 'Chicago',
      state: 'Illinois',
      stateCode: 'IL',
      population: 2693976,
      businessCount: 145000,
      topDirectories: [
        'Chicagoland Chamber of Commerce',
        'Chicago Business Journal',
        'City of Chicago Business Portal',
        'Illinois Chamber of Commerce',
        'Chicago Association of Commerce',
        'Choose Chicago',
        'Chicago Tribune Business',
        'Crain\'s Chicago Business',
        'Chicago Economic Development'
      ],
      localChamber: 'Chicagoland Chamber of Commerce',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      majorIndustries: ['Finance', 'Manufacturing', 'Technology', 'Transportation', 'Healthcare', 'Food Processing'],
      nearbyAreas: ['Evanston', 'Oak Park', 'Cicero', 'Skokie', 'Naperville', 'Aurora'],
      zipCodes: ['60601', '60602', '60603', '60604', '60605']
    }
    // Add more cities as needed
  }
  
  const slug = params?.city as string
  const city = cityData[slug]
  
  if (!city) {
    return { notFound: true }
  }
  
  return {
    props: { 
      city,
      slug
    },
    revalidate: 86400 // Revalidate daily
  }
}