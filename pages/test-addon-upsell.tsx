import { useState } from 'react'
import Head from 'next/head'
import CheckoutButton from '../components/CheckoutButton'

export default function TestAddonUpsellPage() {
  const [selectedAddons, setSelectedAddons] = useState([])

  return (
    <>
      <Head>
        <title>Test Add-On Upsell - DirectoryBolt</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-black mb-6">
              Test Add-On <span className="text-volt-400">Upsell System</span>
            </h1>
            <p className="text-lg text-secondary-300 mb-8">
              Click the buttons below to test the add-on upsell modal integration
            </p>

            {/* Selected Add-ons Display */}
            {selectedAddons.length > 0 && (
              <div className="mb-8 p-4 bg-volt-500/10 border border-volt-500/30 rounded-lg">
                <h3 className="text-lg font-bold text-volt-300 mb-2">Currently Selected Add-ons:</h3>
                <div className="text-sm text-secondary-300">
                  {selectedAddons.join(', ')}
                </div>
              </div>
            )}

            {/* Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Growth Plan with Upsell */}
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-600">
                <h3 className="text-xl font-bold mb-4 text-volt-300">Growth Plan (with upsell)</h3>
                <CheckoutButton
                  plan="growth"
                  variant="primary"
                  size="lg"
                  className="w-full py-3 rounded-xl font-bold"
                  showAddOnUpsell={true}
                  onAddOnsSelected={(addons) => {
                    console.log('Growth plan add-ons selected:', addons)
                    setSelectedAddons(addons)
                  }}
                  onSuccess={(data) => {
                    console.log('Growth checkout success:', data)
                  }}
                  onError={(error) => {
                    console.error('Growth checkout error:', error)
                  }}
                >
                  Test Growth + Add-ons
                </CheckoutButton>
              </div>

              {/* Starter Plan with Upsell */}
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-600">
                <h3 className="text-xl font-bold mb-4 text-volt-300">Starter Plan (with upsell)</h3>
                <CheckoutButton
                  plan="starter"
                  variant="secondary"
                  size="lg"
                  className="w-full py-3 rounded-xl font-bold"
                  showAddOnUpsell={true}
                  onAddOnsSelected={(addons) => {
                    console.log('Starter plan add-ons selected:', addons)
                    setSelectedAddons(addons)
                  }}
                  onSuccess={(data) => {
                    console.log('Starter checkout success:', data)
                  }}
                  onError={(error) => {
                    console.error('Starter checkout error:', error)
                  }}
                >
                  Test Starter + Add-ons
                </CheckoutButton>
              </div>

              {/* Pro Plan with Upsell */}
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-600">
                <h3 className="text-xl font-bold mb-4 text-volt-300">Pro Plan (with upsell)</h3>
                <CheckoutButton
                  plan="pro"
                  variant="secondary"
                  size="lg"
                  className="w-full py-3 rounded-xl font-bold"
                  showAddOnUpsell={true}
                  onAddOnsSelected={(addons) => {
                    console.log('Pro plan add-ons selected:', addons)
                    setSelectedAddons(addons)
                  }}
                  onSuccess={(data) => {
                    console.log('Pro checkout success:', data)
                  }}
                  onError={(error) => {
                    console.error('Pro checkout error:', error)
                  }}
                >
                  Test Pro + Add-ons
                </CheckoutButton>
              </div>

              {/* Regular Checkout (no upsell) */}
              <div className="bg-secondary-800/50 p-6 rounded-xl border border-secondary-600">
                <h3 className="text-xl font-bold mb-4 text-secondary-300">Growth Plan (no upsell)</h3>
                <CheckoutButton
                  plan="growth"
                  variant="outline"
                  size="lg"
                  className="w-full py-3 rounded-xl font-bold"
                  showAddOnUpsell={false}
                  onSuccess={(data) => {
                    console.log('Regular checkout success:', data)
                  }}
                  onError={(error) => {
                    console.error('Regular checkout error:', error)
                  }}
                >
                  Test Regular Checkout
                </CheckoutButton>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-secondary-800/30 border border-secondary-600/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-volt-400 mb-2">Test Instructions:</h3>
              <div className="text-sm text-secondary-300 text-left space-y-2">
                <p>1. <strong>Click any "with upsell" button</strong> - Should show add-on selection modal</p>
                <p>2. <strong>Select add-ons and continue</strong> - Should proceed to checkout with selected add-ons</p>
                <p>3. <strong>Try "Skip Add-ons"</strong> - Should proceed to checkout without add-ons</p>
                <p>4. <strong>Click "no upsell" button</strong> - Should go directly to checkout (no modal)</p>
                <p>5. <strong>Check browser console</strong> - For debug logs and add-on selection data</p>
              </div>
            </div>

            {/* Available Add-ons Reference */}
            <div className="mt-8 bg-secondary-800/30 border border-secondary-600/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-volt-400 mb-3">Available Add-ons:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-secondary-300">
                <div className="flex items-center justify-between">
                  <span>⚡ Fast-Track Submission</span>
                  <span className="text-volt-400 font-bold">+$25</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>👑 Premium Directories Only</span>
                  <span className="text-volt-400 font-bold">+$15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🔍 Manual QA Review</span>
                  <span className="text-volt-400 font-bold">+$10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📊 CSV Export</span>
                  <span className="text-volt-400 font-bold">+$9</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-secondary-600/50">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">Maximum Add-on Value:</span>
                  <span className="text-volt-400">+$59</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}