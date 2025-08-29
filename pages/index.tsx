import Head from 'next/head'
import LandingPage from '../components/LandingPage'

export default function Home() {
  return (
    <>
      <Head>
        <title>DirectoryBolt - AI-Powered Directory Submissions Starting at $49</title>
        <meta name="description" content="Boost your business visibility with AI-powered submissions to 500+ directories. Quick setup, money-back guarantee, and proven results for 500+ businesses." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://directorybolt.com/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DirectoryBolt - Get Listed in 500+ Directories" />
        <meta property="og:description" content="Solve invisibility online with fast directory submissions." />
        <meta property="og:url" content="https://directorybolt.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://directorybolt.com/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="DirectoryBolt" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DirectoryBolt - AI-Powered Directory Submissions" />
        <meta name="twitter:description" content="Get listed in 500+ directories with AI optimization. Plans starting at $49." />
        <meta name="twitter:image" content="https://directorybolt.com/images/twitter-card.jpg" />
        <meta name="twitter:creator" content="@DirectoryBolt" />
        <meta name="twitter:site" content="@DirectoryBolt" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="directory submission, local SEO, business listings, online visibility, local search, directory marketing, AI optimization, automated submissions, business directory, local business, SEO service" />
        <meta name="author" content="DirectoryBolt" />
        <meta name="publisher" content="DirectoryBolt" />
        <meta name="copyright" content="DirectoryBolt" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Business/Local SEO */}
        <meta name="geo.region" content="US" />
        <meta name="geo.country" content="United States" />
        <meta name="ICBM" content="40.7128, -74.0060" />
        <meta name="geo.position" content="40.7128;-74.0060" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        
        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "WebSite",
              "name": "DirectoryBolt",
              "alternateName": "Directory Bolt",
              "url": "https://directorybolt.com/",
              "description": "AI-powered directory submission service for businesses. Get listed in 500+ directories to increase online visibility and drive more customers.",
              "publisher": {
                "@type": "Organization",
                "name": "DirectoryBolt",
                "url": "https://directorybolt.com/",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://directorybolt.com/images/logo.png",
                  "width": 512,
                  "height": 512
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://directorybolt.com/analyze?url={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://twitter.com/DirectoryBolt",
                "https://facebook.com/DirectoryBolt",
                "https://linkedin.com/company/directorybolt"
              ]
            })
          }}
        />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "DirectoryBolt",
              "alternateName": "Directory Bolt",
              "url": "https://directorybolt.com/",
              "logo": {
                "@type": "ImageObject",
                "url": "https://directorybolt.com/images/logo.png",
                "width": 512,
                "height": 512
              },
              "description": "AI-powered directory submission service helping businesses get listed in 500+ directories for increased online visibility and lead generation.",
              "foundingDate": "2024",
              "numberOfEmployees": "10-50",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US",
                "addressRegion": "NY"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@directorybolt.com",
                "availableLanguage": "English"
              },
              "sameAs": [
                "https://twitter.com/DirectoryBolt",
                "https://facebook.com/DirectoryBolt", 
                "https://linkedin.com/company/directorybolt"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "500+",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />

        {/* Structured Data - Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Service",
              "serviceType": "Directory Submission Service",
              "name": "AI-Powered Directory Submissions",
              "description": "Automated directory submission service using AI to optimize business listings across 500+ directories for maximum visibility and lead generation.",
              "provider": {
                "@type": "Organization",
                "name": "DirectoryBolt",
                "url": "https://directorybolt.com/"
              },
              "areaServed": {
                "@type": "Country",
                "name": "United States"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Directory Submission Plans",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Starter Plan"
                    },
                    "price": "49.00",
                    "priceCurrency": "USD"
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Growth Plan"
                    },
                    "price": "89.00",
                    "priceCurrency": "USD"
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Professional Plan"
                    },
                    "price": "159.00",
                    "priceCurrency": "USD"
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Subscription Plan"
                    },
                    "price": "49.00", 
                    "priceCurrency": "USD"
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "500+",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
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
                }
              ]
            })
          }}
        />
        
        {/* Preload critical fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <LandingPage />
    </>
  )
}