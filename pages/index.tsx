import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LandingPage = dynamic(() => import('../components/LandingPage'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  ),
  ssr: true, // Enable SSR for SEO
})


export default function Home() {
  return (
    <>
      <Head>
        <title>AI Business Intelligence Platform - Replace Your Marketing Stack | DirectoryBolt</title>
        <meta name="description" content="Get $4,300 worth of business intelligence for $299 ONE-TIME. AI market analysis, competitor insights, and 500+ premium directories. Save 93% vs. consultants." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://directorybolt.com/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AI Business Intelligence Platform - Save 93% vs. Consultant Projects" />
        <meta property="og:description" content="Get $4,300 worth of business intelligence for $299 ONE-TIME. Own your intelligence forever vs. expensive consultant project fees." />
        <meta property="og:url" content="https://directorybolt.com/" />
        <meta property="og:image" content="https://directorybolt.com/og/hero-1200x630.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="DirectoryBolt" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Business Intelligence Platform - Save 93% vs. Consultant Projects" />
        <meta name="twitter:description" content="Get $4,300 worth of business intelligence for $299 ONE-TIME. Own your intelligence forever vs. expensive consultant project fees." />
        <meta name="twitter:image" content="https://directorybolt.com/og/hero-1200x630.png" />
        <meta name="twitter:creator" content="@DirectoryBolt" />
        <meta name="twitter:site" content="@DirectoryBolt" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="business intelligence platform, AI market analysis, competitor intelligence, business consulting alternative, marketing stack replacement, automated business insights, enterprise intelligence, consultant alternative, business strategy AI, competitive analysis platform" />
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
              "description": "AI-powered directory submission service for businesses. Get listed in 480+ directories to increase online visibility and drive more customers.",
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
                "https://www.linkedin.com/company/directorybolt",
                "https://x.com/directorybolt"
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
              "description": "AI-powered directory submission service helping businesses get listed in 480+ directories for increased online visibility and lead generation.",
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
                "https://www.linkedin.com/company/directorybolt",
                "https://x.com/directorybolt"
              ]
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
              "name": "Automated Directory Submissions",
              "provider": {"@type": "Organization", "name": "DirectoryBolt"},
              "areaServed": "US",
              "description": "AI-optimized submissions to 500+ high-authority directories with ongoing maintenance.",
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Starter",
                  "priceCurrency": "USD",
                  "price": "49",
                  "url": "https://directorybolt.com/pricing"
                },
                {
                  "@type": "Offer",
                  "name": "Growth",
                  "priceCurrency": "USD",
                  "price": "89",
                  "url": "https://directorybolt.com/pricing"
                },
                {
                  "@type": "Offer",
                  "name": "Pro",
                  "priceCurrency": "USD",
                  "price": "159",
                  "url": "https://directorybolt.com/pricing"
                }
              ]
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
        
        
        {/* Preload critical resources */}
        <link rel="preload" as="image" href="/hero.svg" />
        
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