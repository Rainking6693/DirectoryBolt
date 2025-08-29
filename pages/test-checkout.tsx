import Head from 'next/head'
import Link from 'next/link'

export default function TestCheckout() {
  return (
    <>
      <Head>
        <title>Test DirectoryBolt Checkout - DirectoryBolt</title>
        <meta name="description" content="Test the new DirectoryBolt checkout system" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white">
        <div className="px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-8">
              DirectoryBolt Checkout
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-400 to-volt-600"> Test Page</span>
            </h1>
            
            <p className="text-xl text-secondary-300 mb-12 max-w-2xl mx-auto">
              Test the new DirectoryBolt checkout system with your exact pricing and flow specifications.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-secondary-800/50 border border-secondary-600/50 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">New Checkout System</h2>
                <p className="text-secondary-300 mb-6">
                  Experience the complete DirectoryBolt checkout flow with:
                </p>
                <ul className="text-left text-secondary-300 space-y-2 mb-8">
                  <li>✅ Package selection ($49, $89, $159)</li>
                  <li>✅ Add-ons upsells ($25, $15, $10, $9)</li>
                  <li>✅ Subscription option ($49/month)</li>
                  <li>✅ Live Stripe integration</li>
                  <li>✅ Mobile-responsive design</li>
                </ul>
                <Link 
                  href="/checkout"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black text-lg rounded-xl hover:from-volt-400 hover:to-volt-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-volt-500/50 animate-glow"
                >
                  🚀 Test New Checkout
                </Link>
              </div>

              <div className="bg-secondary-800/50 border border-secondary-600/50 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Legacy Pricing Page</h2>
                <p className="text-secondary-300 mb-6">
                  Compare with the existing pricing page system:
                </p>
                <ul className="text-left text-secondary-300 space-y-2 mb-8">
                  <li>📊 Current pricing tiers</li>
                  <li>🔄 Existing checkout flow</li>
                  <li>⚙️ Legacy integration</li>
                </ul>
                <Link 
                  href="/pricing"
                  className="inline-block px-8 py-4 bg-secondary-700 hover:bg-secondary-600 text-white font-bold text-lg rounded-xl transition-all duration-300"
                >
                  View Legacy Pricing
                </Link>
              </div>
            </div>

            {/* Configuration Status */}
            <div className="bg-gradient-to-r from-success-500/10 to-success-600/10 border border-success-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-success-300 mb-4">🔧 Configuration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">✅ Completed</h3>
                  <ul className="text-success-300 space-y-1 text-sm">
                    <li>• Live Stripe keys configured</li>
                    <li>• Package pricing updated ($49, $89, $159)</li>
                    <li>• Add-ons pricing set ($25, $15, $10, $9)</li>
                    <li>• Subscription service ($49/month)</li>
                    <li>• Success page with upsell flow</li>
                    <li>• Mobile-responsive design</li>
                    <li>• Error handling & loading states</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-warning-400 mb-3">⚠️ Needs Setup</h3>
                  <ul className="text-warning-300 space-y-1 text-sm">
                    <li>• Create Stripe products in dashboard</li>
                    <li>• Update price IDs in environment</li>
                    <li>• Set up webhook endpoint</li>
                    <li>• Test with real payments</li>
                    <li>• Update domain redirects</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/"
                className="px-6 py-3 border border-secondary-600 text-secondary-300 font-medium rounded-xl hover:bg-secondary-700 hover:border-secondary-500 transition-all duration-300"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}