# DirectoryBolt Local SEO Enhancement Strategy

## 1. Local Business Schema Implementation

### Enhanced LocalBusiness Schema
```javascript
// lib/seo/local-business-schema.js
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://directorybolt.com/#organization",
  "name": "DirectoryBolt",
  "alternateName": "Directory Bolt",
  "description": "AI-powered business directory submission service helping local businesses increase online visibility through strategic directory listings.",
  "url": "https://directorybolt.com",
  "telephone": "+1-555-DIRECTORY",
  "email": "support@directorybolt.com",
  
  // Business Address
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Business District",
    "addressLocality": "New York",
    "addressRegion": "NY",
    "postalCode": "10001",
    "addressCountry": "US"
  },
  
  // Geographic Coordinates
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.7128",
    "longitude": "-74.0060"
  },
  
  // Service Areas
  "areaServed": [
    {
      "@type": "State",
      "name": "New York"
    },
    {
      "@type": "State", 
      "name": "California"
    },
    {
      "@type": "State",
      "name": "Texas"
    },
    {
      "@type": "State",
      "name": "Florida"
    },
    {
      "@type": "Country",
      "name": "United States"
    }
  ],
  
  // Business Hours
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification", 
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "16:00"
    }
  ],
  
  // Services Offered
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Directory Submission Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Local Directory Submissions",
          "description": "Submit your business to local directories and chambers of commerce"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "Industry Directory Submissions",
          "description": "Targeted submissions to industry-specific directories"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service", 
          "name": "Citation Building",
          "description": "Build consistent NAP citations across the web"
        }
      }
    ]
  },
  
  // Reviews and Ratings
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  
  // Social Media Profiles
  "sameAs": [
    "https://www.facebook.com/directorybolt",
    "https://www.linkedin.com/company/directorybolt",
    "https://twitter.com/directorybolt",
    "https://www.instagram.com/directorybolt"
  ],
  
  // Logo and Images
  "logo": {
    "@type": "ImageObject",
    "url": "https://directorybolt.com/images/logo.png",
    "width": 512,
    "height": 512
  },
  
  "image": [
    {
      "@type": "ImageObject",
      "url": "https://directorybolt.com/images/office-exterior.jpg",
      "caption": "DirectoryBolt Office Building"
    },
    {
      "@type": "ImageObject", 
      "url": "https://directorybolt.com/images/team-photo.jpg",
      "caption": "DirectoryBolt Team"
    }
  ]
}
```

## 2. Location-Specific Landing Pages

### A. City-Specific Pages Structure
```
/directory-submission-service/
├── new-york/
├── los-angeles/
├── chicago/
├── houston/
├── phoenix/
├── philadelphia/
├── san-antonio/
├── san-diego/
├── dallas/
└── san-jose/
```

### B. City Page Template
```javascript
// pages/directory-submission-service/[city].tsx
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'

interface CityPageProps {
  city: {
    name: string
    state: string
    population: number
    businessCount: number
    topDirectories: string[]
    localChamber: string
    coordinates: { lat: number, lng: number }
  }
}

export default function CityDirectorySubmissionPage({ city }: CityPageProps) {
  const pageTitle = `Directory Submission Service in ${city.name}, ${city.state} | DirectoryBolt`
  const pageDescription = `Professional directory submission service for businesses in ${city.name}, ${city.state}. Get listed on 200+ local and national directories. Boost your local SEO today.`
  
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`directory submission ${city.name}, local SEO ${city.name}, business listings ${city.state}, ${city.name} business directory`} />
        <link rel="canonical" href={`https://directorybolt.com/directory-submission-service/${city.name.toLowerCase().replace(' ', '-')}`} />
        
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": `Directory Submission Service in ${city.name}`,
              "description": `Professional directory submission service for businesses in ${city.name}, ${city.state}`,
              "provider": {
                "@type": "LocalBusiness",
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
              }
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-secondary-900 to-secondary-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Directory Submission Service in
                <span className="block text-volt-400">{city.name}, {city.state}</span>
              </h1>
              <p className="text-xl text-secondary-300 max-w-3xl mx-auto mb-8">
                Help your {city.name} business get discovered by more customers. Our AI-powered directory submission service gets you listed on 200+ local and national directories.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-secondary-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-volt-400">{city.businessCount.toLocaleString()}+</div>
                  <div className="text-sm text-secondary-300">Local Businesses</div>
                </div>
                <div className="bg-secondary-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-volt-400">200+</div>
                  <div className="text-sm text-secondary-300">Directory Listings</div>
                </div>
                <div className="bg-secondary-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-volt-400">48hrs</div>
                  <div className="text-sm text-secondary-300">Average Completion</div>
                </div>
                <div className="bg-secondary-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-volt-400">94%</div>
                  <div className="text-sm text-secondary-300">Approval Rate</div>
                </div>
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
                  We understand the {city.name} market and know which local directories matter most for your business visibility.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-volt-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Targeted Submissions</h3>
                <p className="text-gray-600">
                  Get listed on {city.name}-specific directories, local chambers of commerce, and regional business networks.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-volt-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Local SEO Boost</h3>
                <p className="text-gray-600">
                  Improve your rankings for "{city.name} [your service]" searches and attract more local customers.
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
                <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="font-semibold text-lg mb-2">{directory}</h3>
                  <p className="text-gray-600 text-sm">
                    High-authority directory popular with {city.name} consumers
                  </p>
                </div>
              ))}
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
              Join hundreds of {city.name} businesses that have boosted their online visibility with DirectoryBolt.
            </p>
            <button className="bg-secondary-900 text-volt-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-secondary-800 transition-colors">
              Start Your {city.name} Directory Campaign
            </button>
          </div>
        </section>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const cities = [
    'new-york', 'los-angeles', 'chicago', 'houston', 'phoenix',
    'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'san-jose'
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
  // City data would come from a database or API
  const cityData = {
    'new-york': {
      name: 'New York',
      state: 'NY',
      population: 8336817,
      businessCount: 215000,
      topDirectories: [
        'NYC.gov Business Directory',
        'Manhattan Chamber of Commerce',
        'Brooklyn Chamber of Commerce',
        'Queens Chamber of Commerce',
        'NYC Business Portal',
        'Time Out New York'
      ],
      localChamber: 'New York City Chamber of Commerce',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    }
    // Add other cities...
  }
  
  const city = cityData[params?.city as string]
  
  if (!city) {
    return { notFound: true }
  }
  
  return {
    props: { city },
    revalidate: 86400 // Revalidate daily
  }
}
```

## 3. Local Citation Building Strategy

### A. Primary Citation Sources
```javascript
// lib/local-seo/citation-sources.js
export const primaryCitationSources = [
  {
    name: 'Google Business Profile',
    url: 'https://business.google.com',
    priority: 'critical',
    category: 'search_engine'
  },
  {
    name: 'Bing Places for Business',
    url: 'https://www.bingplaces.com',
    priority: 'high',
    category: 'search_engine'
  },
  {
    name: 'Apple Maps Connect',
    url: 'https://mapsconnect.apple.com',
    priority: 'high',
    category: 'search_engine'
  },
  {
    name: 'Yelp for Business',
    url: 'https://biz.yelp.com',
    priority: 'high',
    category: 'review_platform'
  },
  {
    name: 'Facebook Business',
    url: 'https://business.facebook.com',
    priority: 'high',
    category: 'social_media'
  }
]

export const localCitationSources = [
  {
    name: 'Yellow Pages',
    url: 'https://www.yellowpages.com',
    priority: 'medium',
    category: 'general_directory'
  },
  {
    name: 'White Pages',
    url: 'https://www.whitepages.com',
    priority: 'medium',
    category: 'general_directory'
  },
  {
    name: 'Superpages',
    url: 'https://www.superpages.com',
    priority: 'medium',
    category: 'general_directory'
  },
  {
    name: 'Local.com',
    url: 'https://www.local.com',
    priority: 'medium',
    category: 'local_directory'
  }
]
```

### B. NAP Consistency Checker
```javascript
// lib/local-seo/nap-checker.js
export class NAPConsistencyChecker {
  constructor(businessData) {
    this.businessData = businessData
  }
  
  async checkConsistency(citationSources) {
    const results = []
    
    for (const source of citationSources) {
      try {
        const listing = await this.fetchListing(source.url, this.businessData.name)
        const consistency = this.compareNAP(listing, this.businessData)
        
        results.push({
          source: source.name,
          url: source.url,
          found: !!listing,
          consistency: consistency,
          issues: this.identifyIssues(listing, this.businessData)
        })
      } catch (error) {
        results.push({
          source: source.name,
          url: source.url,
          found: false,
          error: error.message
        })
      }
    }
    
    return results
  }
  
  compareNAP(listing, businessData) {
    if (!listing) return null
    
    const nameMatch = this.normalizeText(listing.name) === this.normalizeText(businessData.name)
    const addressMatch = this.normalizeAddress(listing.address) === this.normalizeAddress(businessData.address)
    const phoneMatch = this.normalizePhone(listing.phone) === this.normalizePhone(businessData.phone)
    
    return {
      name: nameMatch,
      address: addressMatch,
      phone: phoneMatch,
      overall: nameMatch && addressMatch && phoneMatch
    }
  }
  
  normalizeText(text) {
    return text?.toLowerCase().replace(/[^\w\s]/g, '').trim()
  }
  
  normalizeAddress(address) {
    return address?.toLowerCase()
      .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct|place|pl)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  normalizePhone(phone) {
    return phone?.replace(/\D/g, '')
  }
  
  identifyIssues(listing, businessData) {
    const issues = []
    
    if (listing.name !== businessData.name) {
      issues.push(`Name mismatch: "${listing.name}" vs "${businessData.name}"`)
    }
    
    if (this.normalizeAddress(listing.address) !== this.normalizeAddress(businessData.address)) {
      issues.push(`Address mismatch: "${listing.address}" vs "${businessData.address}"`)
    }
    
    if (this.normalizePhone(listing.phone) !== this.normalizePhone(businessData.phone)) {
      issues.push(`Phone mismatch: "${listing.phone}" vs "${businessData.phone}"`)
    }
    
    return issues
  }
}
```

## 4. Local Review Management

### A. Review Schema Implementation
```javascript
// lib/local-seo/review-schema.js
export const generateReviewSchema = (reviews) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DirectoryBolt",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": calculateAverageRating(reviews),
      "reviewCount": reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.authorName
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": review.text,
      "datePublished": review.date
    }))
  }
}

function calculateAverageRating(reviews) {
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return (sum / reviews.length).toFixed(1)
}
```

### B. Review Monitoring System
```javascript
// lib/local-seo/review-monitor.js
export class ReviewMonitor {
  constructor(apiKeys) {
    this.googlePlacesAPI = apiKeys.googlePlaces
    this.yelpAPI = apiKeys.yelp
    this.facebookAPI = apiKeys.facebook
  }
  
  async monitorAllPlatforms(businessId) {
    const platforms = [
      { name: 'Google', method: this.getGoogleReviews },
      { name: 'Yelp', method: this.getYelpReviews },
      { name: 'Facebook', method: this.getFacebookReviews }
    ]
    
    const results = await Promise.allSettled(
      platforms.map(platform => 
        platform.method.call(this, businessId)
      )
    )
    
    return platforms.map((platform, index) => ({
      platform: platform.name,
      status: results[index].status,
      reviews: results[index].status === 'fulfilled' ? results[index].value : [],
      error: results[index].status === 'rejected' ? results[index].reason : null
    }))
  }
  
  async getGoogleReviews(placeId) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${this.googlePlacesAPI}`
    )
    const data = await response.json()
    return data.result?.reviews || []
  }
  
  async getYelpReviews(businessId) {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/${businessId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${this.yelpAPI}`
        }
      }
    )
    const data = await response.json()
    return data.reviews || []
  }
  
  async getFacebookReviews(pageId) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/ratings?access_token=${this.facebookAPI}`
    )
    const data = await response.json()
    return data.data || []
  }
}
```

## 5. Local SEO Performance Tracking

### A. Local Ranking Tracker
```javascript
// lib/local-seo/ranking-tracker.js
export class LocalRankingTracker {
  constructor(apiKey) {
    this.apiKey = apiKey
  }
  
  async trackLocalRankings(keywords, location, businessName) {
    const results = []
    
    for (const keyword of keywords) {
      try {
        const ranking = await this.getLocalRanking(keyword, location, businessName)
        results.push({
          keyword,
          location,
          position: ranking.position,
          url: ranking.url,
          snippet: ranking.snippet,
          date: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          keyword,
          location,
          error: error.message,
          date: new Date().toISOString()
        })
      }
    }
    
    return results
  }
  
  async getLocalRanking(keyword, location, businessName) {
    // Implementation would use a SERP API like SerpAPI or DataForSEO
    const searchQuery = `${keyword} ${location}`
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&api_key=${this.apiKey}`
    )
    
    const data = await response.json()
    const organicResults = data.organic_results || []
    
    // Find business in results
    for (let i = 0; i < organicResults.length; i++) {
      const result = organicResults[i]
      if (result.title.toLowerCase().includes(businessName.toLowerCase()) ||
          result.snippet.toLowerCase().includes(businessName.toLowerCase())) {
        return {
          position: i + 1,
          url: result.link,
          snippet: result.snippet
        }
      }
    }
    
    return { position: null, url: null, snippet: null }
  }
}
```

## 6. Implementation Timeline

### Month 1: Foundation
- [ ] Implement enhanced LocalBusiness schema
- [ ] Set up NAP consistency monitoring
- [ ] Create first 5 city-specific landing pages
- [ ] Begin local citation audit

### Month 2: Expansion
- [ ] Launch 10 additional city pages
- [ ] Implement review monitoring system
- [ ] Start local directory submission campaign
- [ ] Set up local ranking tracking

### Month 3: Optimization
- [ ] Complete 25 city pages
- [ ] Optimize based on performance data
- [ ] Launch local content marketing
- [ ] Implement advanced local SEO features

## Expected Results

### 30 Days
- 15% improvement in local search visibility
- Enhanced local business schema implementation
- 5 city-specific landing pages live

### 60 Days
- 25% increase in local organic traffic
- Improved local pack rankings
- 15 city pages generating traffic

### 90 Days
- 40% increase in local leads
- Top 3 rankings for target local keywords
- Complete local SEO infrastructure