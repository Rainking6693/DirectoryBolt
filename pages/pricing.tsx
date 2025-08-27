import Head from 'next/head'
import { Layout } from '../components/layout/Layout'
import PricingPage from '../components/PricingPage'

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing Plans - DirectoryBolt | Starting at $49/month</title>
        <meta name="description" content="Choose your DirectoryBolt plan. Get listed in 500+ directories with guaranteed ROI. Plans starting at $49/month. 14-day free trial, 30-day money-back guarantee." />
        <meta name="keywords" content="directory submission pricing, local SEO plans, business listing service cost, $49 directory service, DirectoryBolt pricing" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DirectoryBolt Pricing - Plans Starting at $49/month" />
        <meta property="og:description" content="Get listed in 500+ directories. Proven 400-800% ROI. 14-day free trial. Choose your growth plan today." />
        <meta property="og:image" content="/images/pricing-og-image.jpg" />
        <meta property="og:url" content="https://directorybolt.com/pricing" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DirectoryBolt Pricing - 500+ Directory Submissions" />
        <meta name="twitter:description" content="Plans starting at $49/month. Proven ROI. 14-day free trial." />
        <meta name="twitter:image" content="/images/pricing-twitter-card.jpg" />
        
        {/* Structured Data for Pricing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "DirectoryBolt Directory Submission Service",
              "description": "Automated directory submission service for businesses. Get listed in 500+ directories to increase local search visibility.",
              "brand": {
                "@type": "Brand",
                "name": "DirectoryBolt"
              },
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Starter Plan",
                  "price": "49.00",
                  "priceCurrency": "USD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Growth Plan",
                  "price": "79.00",
                  "priceCurrency": "USD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Professional Plan",
                  "price": "149.00",
                  "priceCurrency": "USD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Enterprise Plan",
                  "price": "299.00",
                  "priceCurrency": "USD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt"
                  }
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "247",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://directorybolt.com/pricing" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        
        {/* Viewport for mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      
      <Layout>
        <PricingPage />
      </Layout>
    </>
  )
}

// Generate static paths for better SEO
export async function getStaticProps() {
  return {
    props: {
      // Add any static props needed for pricing data
      lastModified: new Date().toISOString(),
    },
    // Revalidate every hour to keep pricing current
    revalidate: 3600,
  }
}