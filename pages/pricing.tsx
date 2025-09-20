import Head from 'next/head'
import dynamic from 'next/dynamic'
import Layout from '../components/layout/Layout'

const PricingPage = dynamic(() => import('../components/PricingPage'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: true,
})

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Directory Submission Service Pricing | AI-Powered Business Listings</title>
        <meta name="description" content="Directory submission service pricing plans from $149-$799. Get listed on 500+ high-authority directories with AI-powered automation. 14-day free trial available." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://directorybolt.com/pricing" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="directory submission pricing, directory submission service cost, business listing service pricing, local seo directory pricing, automated directory submission cost, directory marketing plans, DirectoryBolt pricing" />
        <meta name="author" content="DirectoryBolt" />
        <meta name="publisher" content="DirectoryBolt" />
        <meta name="copyright" content="DirectoryBolt" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Directory Submission Service Pricing | AI-Powered Business Listings" />
        <meta property="og:description" content="Directory submission service pricing plans from $149-$799. Get listed on 500+ high-authority directories with AI-powered automation. 14-day free trial available." />
        <meta property="og:image" content="https://directorybolt.com/og/hero-1200x630.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://directorybolt.com/pricing" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="DirectoryBolt" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Directory Submission Service Pricing | AI-Powered Business Listings" />
        <meta name="twitter:description" content="Directory submission service pricing plans from $149-$799. Get listed on 500+ high-authority directories with AI-powered automation. 14-day free trial available." />
        <meta name="twitter:image" content="https://directorybolt.com/og/hero-1200x630.png" />
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
              "name": "DirectoryBolt AI-Enhanced Business Intelligence Platform",
              "description": "Revolutionary AI-powered business intelligence platform that delivers $2,600+ worth of competitive analysis, market research, and strategic insights at 87-94% savings compared to traditional consultants.",
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
                  "price": "149.00",
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
                  "price": "299.00",
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
                  "price": "499.00",
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
                  "price": "799.00",
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