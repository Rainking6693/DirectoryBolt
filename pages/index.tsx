import Head from 'next/head'
import LandingPage from '../components/LandingPage'

export default function Home() {
  return (
    <>
      <Head>
        <title>DirectoryBolt - Get Listed in 500+ Directories | Starting at $49/mo</title>
        <meta name="description" content="Stop losing customers! Get listed in 500+ directories starting at $49/mo. AI-powered directory submissions with 300-500% ROI. Free trial + 30-day guarantee." />
        <meta property="og:title" content="DirectoryBolt - AI-Powered Directory Submissions Starting at $49/mo" />
        <meta property="og:description" content="Stop losing customers! Get listed in 500+ directories with AI optimization. Plans from $49-399/mo. Free trial + 30-day guarantee. 300-500% ROI guaranteed." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://directorybolt.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DirectoryBolt - $49/mo Directory Submissions with AI" />
        <meta name="twitter:description" content="AI-powered directory submissions starting at $49/mo. 300-500% ROI. Free trial + 30-day money-back guarantee." />
        <link rel="canonical" href="https://directorybolt.com" />
        
        {/* Conversion-optimized meta tags */}
        <meta name="keywords" content="directory submission, local SEO, business listings, online visibility, local search, directory marketing, AI optimization, $49 directory service, automated submissions" />
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