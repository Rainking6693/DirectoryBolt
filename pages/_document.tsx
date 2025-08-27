import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Global SEO Meta Tags */}
        <meta name="geo.region" content="US" />
        <meta name="geo.country" content="United States" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Mobile & PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="apple-mobile-web-app-title" content="DirectoryBolt" />
        
        {/* Global WebSite Schema with SearchAction */}
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
              "inLanguage": "en-US",
              "copyrightYear": "2024",
              "copyrightHolder": {
                "@type": "Organization",
                "name": "DirectoryBolt"
              },
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
              "potentialAction": [
                {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://directorybolt.com/analyze?url={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                },
                {
                  "@type": "ViewAction",
                  "target": "https://directorybolt.com/pricing",
                  "name": "View Pricing Plans"
                }
              ],
              "mainEntity": {
                "@type": "Service",
                "serviceType": "Directory Submission Service",
                "name": "AI-Powered Directory Submissions",
                "description": "Automated directory submission service using AI to optimize business listings across 500+ directories."
              },
              "sameAs": [
                "https://twitter.com/DirectoryBolt",
                "https://facebook.com/DirectoryBolt",
                "https://linkedin.com/company/directorybolt",
                "https://youtube.com/@DirectoryBolt"
              ]
            })
          }}
        />
        
        {/* Global Organization Schema */}
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
              "image": [
                {
                  "@type": "ImageObject",
                  "url": "https://directorybolt.com/images/logo.png",
                  "width": 512,
                  "height": 512
                },
                {
                  "@type": "ImageObject", 
                  "url": "https://directorybolt.com/images/og-image.jpg",
                  "width": 1200,
                  "height": 630
                }
              ],
              "description": "DirectoryBolt is an AI-powered directory submission service helping businesses get listed in 500+ high-authority directories for increased online visibility, better local SEO, and more customer leads.",
              "slogan": "Get Listed in 500+ Directories with AI",
              "foundingDate": "2024",
              "numberOfEmployees": {
                "@type": "QuantitativeValue",
                "value": "10-50"
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US",
                "addressRegion": "NY",
                "addressLocality": "New York"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "email": "support@directorybolt.com",
                  "availableLanguage": "English",
                  "areaServed": "US"
                },
                {
                  "@type": "ContactPoint",
                  "contactType": "sales",
                  "email": "sales@directorybolt.com",
                  "availableLanguage": "English",
                  "areaServed": "US"
                }
              ],
              "areaServed": {
                "@type": "Country",
                "name": "United States"
              },
              "knowsAbout": [
                "Directory Submission",
                "Local SEO",
                "Business Listings",
                "Online Visibility",
                "Search Engine Optimization",
                "Digital Marketing",
                "Business Directory Marketing",
                "AI Optimization"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "DirectoryBolt Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Directory Submission Service",
                      "description": "AI-powered automated directory submissions"
                    }
                  }
                ]
              },
              "sameAs": [
                "https://twitter.com/DirectoryBolt",
                "https://facebook.com/DirectoryBolt",
                "https://linkedin.com/company/directorybolt",
                "https://youtube.com/@DirectoryBolt"
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
        
        {/* Google Tag Manager - Using Next.js Script component for better performance */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TJWH3TRK');`
          }}
        />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Favicon and App Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#f59e0b" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript dangerouslySetInnerHTML={{
          __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TJWH3TRK"
          height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}