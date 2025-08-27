import Head from 'next/head'
import Layout from '../components/layout/Layout'
import PricingPage from '../components/PricingPage'

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing Plans - DirectoryBolt | Starting at $49/month</title>
        <meta name="description" content="Choose your DirectoryBolt plan. Get listed in 500+ directories with guaranteed ROI. Plans starting at $49/month. 14-day free trial, 30-day money-back guarantee." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://directorybolt.com/pricing" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="directory submission pricing, local SEO plans, business listing service cost, $49 directory service, DirectoryBolt pricing, directory marketing plans, automated directory submission cost" />
        <meta name="author" content="DirectoryBolt" />
        <meta name="publisher" content="DirectoryBolt" />
        <meta name="copyright" content="DirectoryBolt" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DirectoryBolt Pricing - Plans Starting at $49/month" />
        <meta property="og:description" content="Get listed in 500+ directories. Proven 400-800% ROI. 14-day free trial. Choose your growth plan today." />
        <meta property="og:image" content="https://directorybolt.com/images/pricing-og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://directorybolt.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="DirectoryBolt" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DirectoryBolt Pricing - 500+ Directory Submissions" />
        <meta name="twitter:description" content="Plans starting at $49/month. Proven ROI. 14-day free trial." />
        <meta name="twitter:image" content="https://directorybolt.com/images/pricing-twitter-card.jpg" />
        <meta name="twitter:creator" content="@DirectoryBolt" />
        <meta name="twitter:site" content="@DirectoryBolt" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        
        {/* Enhanced Structured Data for Pricing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product", 
              "name": "DirectoryBolt Directory Submission Service",
              "description": "AI-powered automated directory submission service for businesses. Get listed in 500+ high-authority directories to increase local search visibility, drive more traffic, and generate leads.",
              "brand": {
                "@type": "Brand",
                "name": "DirectoryBolt",
                "url": "https://directorybolt.com/"
              },
              "manufacturer": {
                "@type": "Organization",
                "name": "DirectoryBolt",
                "url": "https://directorybolt.com/"
              },
              "category": "Business Software",
              "sku": "DB-DIRECTORY-SERVICE",
              "image": "https://directorybolt.com/images/product-image.jpg",
              "url": "https://directorybolt.com/pricing",
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Starter Plan",
                  "description": "Perfect for small businesses getting started with directory marketing",
                  "price": "49.00",
                  "priceCurrency": "USD",
                  "billingPeriod": "P1M",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01",
                  "url": "https://directorybolt.com/pricing#starter",
                  "itemCondition": "https://schema.org/NewCondition",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt",
                    "url": "https://directorybolt.com/"
                  },
                  "eligibleRegion": {
                    "@type": "Country",
                    "name": "United States"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Growth Plan", 
                  "description": "Most popular plan for growing businesses",
                  "price": "79.00",
                  "priceCurrency": "USD",
                  "billingPeriod": "P1M",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01",
                  "url": "https://directorybolt.com/pricing#growth",
                  "itemCondition": "https://schema.org/NewCondition",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt",
                    "url": "https://directorybolt.com/"
                  },
                  "eligibleRegion": {
                    "@type": "Country",
                    "name": "United States"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Professional Plan",
                  "description": "Advanced features for established businesses",
                  "price": "129.00",
                  "priceCurrency": "USD",
                  "billingPeriod": "P1M", 
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01",
                  "url": "https://directorybolt.com/pricing#professional",
                  "itemCondition": "https://schema.org/NewCondition",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt",
                    "url": "https://directorybolt.com/"
                  },
                  "eligibleRegion": {
                    "@type": "Country",
                    "name": "United States"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Enterprise Plan",
                  "description": "Full-scale solution for large organizations",
                  "price": "299.00",
                  "priceCurrency": "USD",
                  "billingPeriod": "P1M",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01",
                  "url": "https://directorybolt.com/pricing#enterprise",
                  "itemCondition": "https://schema.org/NewCondition",
                  "seller": {
                    "@type": "Organization",
                    "name": "DirectoryBolt",
                    "url": "https://directorybolt.com/"
                  },
                  "eligibleRegion": {
                    "@type": "Country",
                    "name": "United States"
                  }
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "500",
                "bestRating": "5",
                "worstRating": "1"
              },
              "review": [
                {
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": "Business Owner"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                  },
                  "reviewBody": "DirectoryBolt helped us get listed in hundreds of directories quickly. Our local search visibility increased dramatically."
                }
              ]
            })
          }}
        />
        
        {/* BreadcrumbList for Pricing */}
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
                  "name": "Pricing",
                  "item": "https://directorybolt.com/pricing"
                }
              ]
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