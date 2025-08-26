import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      <Head>
        <title>DirectoryBolt - Your Business Directory Platform</title>
        <meta name="description" content="DirectoryBolt - The most powerful business directory platform for modern enterprises. Built with Next.js 14 and deployed on enterprise-grade infrastructure." />
        <meta property="og:title" content="DirectoryBolt - Your Business Directory Platform" />
        <meta property="og:description" content="The most powerful business directory platform for modern enterprises." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://directorybolt.com" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 mb-8 animate-fade-in">
              DirectoryBolt
            </h1>
            
            <p className="text-xl md:text-2xl text-secondary-700 mb-12 leading-relaxed animate-slide-up">
              Enterprise-grade business directory platform built with cutting-edge technology. 
              Powered by Next.js 14, TypeScript, and deployed on bulletproof infrastructure.
            </p>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-soft p-6 border border-secondary-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-sm font-semibold text-secondary-700">Production Ready</span>
                </div>
                <h3 className="font-bold text-secondary-900">Next.js 14</h3>
                <p className="text-secondary-600 text-sm">Latest React framework</p>
              </div>

              <div className="bg-white rounded-lg shadow-soft p-6 border border-secondary-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-sm font-semibold text-secondary-700">Optimized</span>
                </div>
                <h3 className="font-bold text-secondary-900">TypeScript</h3>
                <p className="text-secondary-600 text-sm">Type-safe development</p>
              </div>

              <div className="bg-white rounded-lg shadow-soft p-6 border border-secondary-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-sm font-semibold text-secondary-700">Scalable</span>
                </div>
                <h3 className="font-bold text-secondary-900">Tailwind CSS</h3>
                <p className="text-secondary-600 text-sm">Utility-first styling</p>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-medium hover:shadow-strong transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
              disabled={isLoading}
              onClick={() => setIsLoading(true)}
            >
              {isLoading ? 'Initializing...' : 'Get Started'}
            </button>
          </div>

          {/* Infrastructure Status */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-soft border border-secondary-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-sm text-secondary-700">
                🚀 Production infrastructure online • Monitoring active • Auto-scaling enabled
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}