import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <>
      <Head>
        <title>Offline - DirectoryBolt</title>
        <meta name="description" content="You are currently offline" />
      </Head>

      <div className="min-h-screen bg-secondary-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Offline Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-secondary-800 border border-secondary-700 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-volt-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl font-bold text-white mb-4">
            You're Offline
          </h1>
          
          <p className="text-secondary-400 mb-8 leading-relaxed">
            DirectoryBolt needs an internet connection to access the latest data. 
            Some features may still be available from your cached content.
          </p>

          {/* Available Actions */}
          <div className="space-y-4 mb-8">
            <Link
              href="/dashboard"
              className="block w-full bg-volt-500 hover:bg-volt-600 text-secondary-900 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try Dashboard (Cached)
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-secondary-800 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg border border-secondary-700 transition-colors"
            >
              Try Again
            </button>
          </div>

          {/* Offline Features */}
          <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-white mb-3">
              Available Offline:
            </h3>
            
            <ul className="space-y-2 text-sm text-secondary-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-volt-500 rounded-full"></div>
                View cached dashboard data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-volt-500 rounded-full"></div>
                Browse previously loaded directories
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-volt-500 rounded-full"></div>
                Access saved analytics reports
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-volt-500 rounded-full"></div>
                Review submission history
              </li>
            </ul>
          </div>

          {/* Connection Status */}
          <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Waiting for connection...
            </div>
          </div>
        </div>
      </div>

      {/* Auto-reload when back online */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('online', function() {
              setTimeout(function() {
                window.location.reload();
              }, 1000);
            });
          `,
        }}
      />
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {},
  }
}