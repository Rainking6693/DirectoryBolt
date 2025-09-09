import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function ExtensionSetup() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [customerIdExample, setCustomerIdExample] = useState('')

  useEffect(() => {
    // Get error from URL params
    if (router.query.error) {
      setError(decodeURIComponent(router.query.error as string))
    }

    // Generate example customer ID
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setCustomerIdExample(`DIR-${year}-${random}`)
  }, [router.query])

  const handleInstallExtension = () => {
    // This would be the actual Chrome Web Store link
    window.open('https://chrome.google.com/webstore/detail/directorybolt-extension', '_blank')
  }

  const handleContactSupport = () => {
    window.open('mailto:support@directorybolt.com?subject=Extension Setup Help', '_blank')
  }

  return (
    <>
      <Head>
        <title>DirectoryBolt Extension Setup | DirectoryBolt</title>
        <meta name="description" content="Set up your DirectoryBolt Chrome extension for automated directory submissions" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DirectoryBolt Extension Setup</h1>
            <p className="text-lg text-gray-600">Get your Chrome extension ready for automated directory submissions</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Extension Authentication Failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p><strong>Error:</strong> {error}</p>
                    <p className="mt-2">Please follow the setup instructions below to resolve this issue.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Steps */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Extension Setup Instructions</h2>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">1</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Install the Chrome Extension</h3>
                    <p className="text-gray-600 mb-4">
                      First, you need to install the DirectoryBolt Chrome extension from the Chrome Web Store.
                    </p>
                    <button
                      onClick={handleInstallExtension}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Install Extension
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">2</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Find Your Customer ID</h3>
                    <p className="text-gray-600 mb-4">
                      Your Customer ID was provided in your DirectoryBolt purchase confirmation email. It looks like this:
                    </p>
                    <div className="bg-gray-100 rounded-md p-3 font-mono text-sm">
                      {customerIdExample} (example)
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Customer IDs start with "DIR-" followed by the year and a unique identifier.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">3</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Authenticate the Extension</h3>
                    <p className="text-gray-600 mb-4">
                      After installing the extension:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Click the DirectoryBolt extension icon in your Chrome toolbar</li>
                      <li>Enter your Customer ID in the authentication field</li>
                      <li>Click "Authenticate" to verify your account</li>
                      <li>Once authenticated, you can start directory processing</li>
                    </ol>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">4</div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start Processing</h3>
                    <p className="text-gray-600 mb-4">
                      Once authenticated, you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>View your business information and package details</li>
                      <li>Start automated directory submissions</li>
                      <li>Monitor real-time progress</li>
                      <li>View your dashboard for detailed results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-4">Troubleshooting</h3>
            <div className="space-y-4 text-sm text-yellow-700">
              <div>
                <strong>Authentication Failed:</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                  <li>Double-check your Customer ID format (should start with DIR-)</li>
                  <li>Ensure you've completed your DirectoryBolt purchase</li>
                  <li>Check that your account status is active</li>
                  <li>Try refreshing the extension and re-entering your Customer ID</li>
                </ul>
              </div>
              <div>
                <strong>Extension Not Working:</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                  <li>Make sure you're using Google Chrome (other browsers not supported)</li>
                  <li>Check that the extension is enabled in chrome://extensions/</li>
                  <li>Try disabling and re-enabling the extension</li>
                  <li>Restart Chrome and try again</li>
                </ul>
              </div>
              <div>
                <strong>Can't Find Customer ID:</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                  <li>Check your email for the DirectoryBolt purchase confirmation</li>
                  <li>Look for emails from DirectoryBolt or your payment processor</li>
                  <li>Contact support if you can't locate your Customer ID</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you're still having trouble setting up your extension, our support team is here to help.
            </p>
            <button
              onClick={handleContactSupport}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </button>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to DirectoryBolt
            </button>
          </div>
        </div>
      </div>
    </>
  )
}