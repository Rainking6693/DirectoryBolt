import { StartTrialButton } from '../CheckoutButton'

export default function PricingPreviewSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-volt-400">Choose Your Growth Plan</h2>
      <p className="text-center text-secondary-300 mb-12 max-w-3xl mx-auto">
        Get listed in hundreds of directories with our proven system. Start your free trial today and see results in 48 hours.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
        {/* Starter Plan */}
        <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-3xl font-black text-volt-400 mb-2">$49</div>
            <p className="text-sm text-secondary-300 mb-4">50 directories</p>
            <ul className="text-xs text-secondary-400 space-y-1 mb-6">
              <li>• 50 directory submissions</li>
              <li>• Product Hunt, Crunchbase included</li>
              <li>• Basic analytics dashboard</li>
              <li>• Email support</li>
              <li>• 85%+ approval rates</li>
            </ul>
            <StartTrialButton
              plan="starter"
              className="w-full py-2 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=starter`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=starter`}
            >
              Start Trial
            </StartTrialButton>
          </div>
        </div>

        {/* Growth Plan - Most Popular */}
        <div className="bg-gradient-to-br from-volt-500/20 to-volt-600/10 rounded-2xl p-6 border-2 border-volt-500 backdrop-blur-sm transform scale-105 shadow-2xl shadow-volt-500/20 hover:scale-110 transition-all duration-300">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-black px-4 py-2 rounded-full text-xs shadow-lg">
              🔥 MOST POPULAR
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-volt-300 mb-2">Growth</h3>
            <div className="text-3xl font-black text-volt-400 mb-2">$89</div>
            <p className="text-sm text-secondary-300 mb-4">100 directories</p>
            <ul className="text-xs text-secondary-400 space-y-1 mb-6">
              <li>• 100 directory submissions</li>
              <li>• Hacker News, AlternativeTo included</li>
              <li>• AI optimization for descriptions</li>
              <li>• Priority support</li>
              <li>• 400-600% ROI potential</li>
            </ul>
            <StartTrialButton
              plan="growth"
              className="w-full py-2 text-sm bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold rounded-lg hover:from-volt-400 hover:to-volt-500 transition-all"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=growth`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=growth`}
            >
              Start Trial
            </StartTrialButton>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-secondary-800/80 to-secondary-900/60 rounded-2xl p-6 border border-secondary-600 backdrop-blur-sm hover:border-volt-500/50 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <div className="text-3xl font-black text-volt-400 mb-2">$159</div>
            <p className="text-sm text-secondary-300 mb-4">200 directories</p>
            <ul className="text-xs text-secondary-400 space-y-1 mb-6">
              <li>• 200 directory submissions</li>
              <li>• API access for agencies</li>
              <li>• White-label reports</li>
              <li>• Phone support priority</li>
              <li>• 600-800% ROI potential</li>
            </ul>
            <StartTrialButton
              plan="pro"
              className="w-full py-2 text-sm bg-secondary-700 hover:bg-secondary-600 text-white rounded-lg transition-colors"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=pro`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=pro`}
            >
              Start Trial
            </StartTrialButton>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-gradient-to-br from-success-900/50 to-success-800/30 rounded-2xl p-6 border border-success-600/50 backdrop-blur-sm hover:border-success-500/70 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-bold text-success-300 mb-2">Subscription</h3>
            <div className="text-3xl font-black text-volt-400 mb-2">$49/month</div>
            <p className="text-sm text-secondary-300 mb-4">Monthly maintenance</p>
            <ul className="text-xs text-secondary-400 space-y-1 mb-6">
              <li>• Monthly directory maintenance</li>
              <li>• Auto-resubmissions when expired</li>
              <li>• Monthly performance reports</li>
              <li>• Priority support & management</li>
              <li>• Ongoing ROI tracking</li>
            </ul>
            <StartTrialButton
              plan="subscription"
              className="w-full py-2 text-sm bg-gradient-to-r from-success-500 to-success-600 text-white font-bold rounded-lg hover:from-success-400 hover:to-success-500 transition-all"
              successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/success?session_id={CHECKOUT_SESSION_ID}&plan=subscription`}
              cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?cancelled=true&plan=subscription`}
            >
              Start Trial
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