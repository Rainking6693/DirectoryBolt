import { StartTrialButton } from '../CheckoutButton'

export default function PricingPreviewSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-danger-500/20 to-danger-600/10 border border-danger-500/30 px-4 py-2 rounded-full text-sm font-bold text-danger-300 mb-6 backdrop-blur-sm">
          <span>🔥</span>
          Replace Your Entire Marketing Stack
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-volt-400">Business Intelligence Plans</h2>
        <p className="text-secondary-300 mb-8 max-w-3xl mx-auto text-lg">
          Stop paying $3,000+ for consultant projects. Own enterprise-level AI insights and automated growth strategies with one strategic investment.
        </p>
        
        {/* Market Comparison */}
        <div className="bg-secondary-800/50 border border-volt-500/20 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-volt-400 font-bold mb-4">Market Comparison: What Others Charge</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div className="text-center">
              <div className="text-danger-400 font-bold text-lg mb-1">$2,500-5,000</div>
              <div className="text-secondary-300">Consultant Projects</div>
            </div>
            <div className="text-center">
              <div className="text-danger-400 font-bold text-lg mb-1">$1,200-3,000</div>
              <div className="text-secondary-300">Market Research Projects</div>
            </div>
            <div className="text-center">
              <div className="text-danger-400 font-bold text-lg mb-1">$800-1,500</div>
              <div className="text-secondary-300">Directory Project Fees</div>
            </div>
          </div>
          <div className="text-center text-success-400 font-bold text-xl">
            DirectoryBolt: $149-799 ONE-TIME → Save 93%
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
        {/* Starter Intelligence Plan */}
        <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Starter Intelligence</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-secondary-400 line-through">$2,000</span>
              <div className="text-3xl font-black text-volt-400">$149</div>
            </div>
            <div className="text-success-400 font-bold text-sm mb-4">Save 93% vs. Consultant Projects</div>
            <ul className="text-xs text-secondary-400 space-y-2 mb-6 text-left">
              <li>• <strong className="text-volt-400">AI Market Analysis</strong> (Worth $1,500)</li>
              <li>• <strong className="text-volt-400">100 Directory Submissions</strong> (Worth $400)</li>
              <li>• <strong className="text-volt-400">Competitor Intelligence</strong> (Worth $800)</li>
              <li>• Basic optimization reports</li>
              <li>• Email support</li>
            </ul>
            <StartTrialButton
              plan="starter"
              className="w-full py-3 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors font-bold"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=starter`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=starter`}
            >
              Get Instant Access
            </StartTrialButton>
          </div>
        </div>

        {/* Growth Intelligence Plan - Most Popular */}
        <div className="bg-gradient-to-br from-volt-500/20 to-volt-600/10 rounded-2xl p-6 border-2 border-volt-500 backdrop-blur-sm transform scale-105 shadow-2xl shadow-volt-500/20 hover:scale-110 transition-all duration-300 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black px-4 py-2 rounded-full text-xs shadow-lg">
              🔥 MOST POPULAR
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-volt-300 mb-2">Growth Intelligence</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-secondary-400 line-through">$4,300</span>
              <div className="text-3xl font-black text-volt-400">$299</div>
            </div>
            <div className="text-success-400 font-bold text-sm mb-4">Save 93% vs. Consultant Projects</div>
            <ul className="text-xs text-secondary-400 space-y-2 mb-6 text-left">
              <li>• <strong className="text-volt-400">Full AI Business Intelligence</strong> (Worth $2,000)</li>
              <li>• <strong className="text-volt-400">250 Premium Directory Submissions</strong> (Worth $1,000)</li>
              <li>• <strong className="text-volt-400">Advanced Competitor Analysis</strong> (Worth $1,200)</li>
              <li>• <strong className="text-volt-400">Growth Strategy Reports</strong> (Worth $800)</li>
              <li>• Priority support & optimization</li>
            </ul>
            <StartTrialButton
              plan="growth"
              className="w-full py-3 text-sm bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold rounded-lg hover:from-volt-400 hover:to-volt-500 transition-all"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=growth`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=growth`}
            >
              Get Instant Access
            </StartTrialButton>
          </div>
        </div>

        {/* Enterprise Intelligence Plan */}
        <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise Intelligence</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-secondary-400 line-through">$8,500</span>
              <div className="text-3xl font-black text-volt-400">$799</div>
            </div>
            <div className="text-success-400 font-bold text-sm mb-4">Save 91% vs. Consultant Projects</div>
            <ul className="text-xs text-secondary-400 space-y-2 mb-6 text-left">
              <li>• <strong className="text-volt-400">Enterprise AI Intelligence Suite</strong> (Worth $4,000)</li>
              <li>• <strong className="text-volt-400">500+ Premium Directory Network</strong> (Worth $2,000)</li>
              <li>• <strong className="text-volt-400">Deep Market Intelligence</strong> (Worth $2,500)</li>
              <li>• <strong className="text-volt-400">White-label Reports</strong> (Worth $1,200)</li>
              <li>• Dedicated success manager</li>
            </ul>
            <StartTrialButton
              plan="pro"
              className="w-full py-3 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors font-bold"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=pro`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=pro`}
            >
              Get Instant Access
            </StartTrialButton>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => typeof window !== 'undefined' && (window.location.href = '/pricing')}
          className="text-volt-400 hover:text-volt-300 font-medium text-lg underline underline-offset-4 hover:underline-offset-8 transition-all duration-300"
        >
          View Full Pricing Details & Features →
        </button>
      </div>
    </section>
  )
}