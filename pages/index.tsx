import Head from 'next/head'
import LandingPage from '../components/LandingPage'

export default function Home() {
  return (
    <>
      <Head>
        <title>DirectoryBolt - Get Listed in 500+ Directories | Stop Losing Customers to Competitors</title>
        <meta name="description" content="Your business is INVISIBLE online! Get listed in 500+ high-authority directories and dominate local search. Stop losing customers to competitors who found directory marketing first." />
        <meta property="og:title" content="DirectoryBolt - Stop Losing Customers to Competitors" />
        <meta property="og:description" content="Get your business listed in 500+ directories and dominate local search results. See the transformation that converts browsers into buyers." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://directorybolt.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Business Is INVISIBLE Online - Fix It Now" />
        <meta name="twitter:description" content="Stop losing customers to competitors! Get listed in 500+ directories and watch your visibility explode." />
        <link rel="canonical" href="https://directorybolt.com" />
        
        {/* Conversion-optimized meta tags */}
        <meta name="keywords" content="directory submission, local SEO, business listings, online visibility, local search, directory marketing, business directory, get more customers" />
        <meta name="author" content="DirectoryBolt" />
        <meta name="robots" content="index, follow" />
        
        {/* Preload critical fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <LandingPage />
    </>
  )
}