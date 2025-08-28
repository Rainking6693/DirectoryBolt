'use client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Header from './Header'

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="bg-secondary-900 text-white font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-secondary-800 via-secondary-900 to-black text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent leading-tight animate-slide-up">
            Get Listed in 500+ Directories—Without Lifting a Finger
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-secondary-300 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Make your business visible online in minutes. DirectoryBolt uses smart automation and AI to put your business where customers are already searching.
          </p>
          <button 
            onClick={() => router.push('/pricing')}
            className="bg-gradient-to-r from-volt-400 to-volt-600 text-secondary-900 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg sm:text-xl hover:from-volt-300 hover:to-volt-500 animate-zoom-in"
            style={{ animationDelay: '0.4s' }}
          >
            Start Your Free Trial Today
          </button>
          <p className="mt-4 text-sm sm:text-base text-secondary-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>Risk-free 7 days | Cancel anytime</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-volt-400">Still Invisible Online—Even After Running Ads?</h2>
        <p className="text-base sm:text-lg lg:text-xl text-secondary-300 leading-relaxed">
          Most businesses miss out on leads because they're simply not listed where customers are searching. Manual submissions are tedious. Freelancers charge a premium. And DIY? It just doesn't scale.
        </p>
      </section>

      {/* Solution Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
            DirectoryBolt Automates Everything
          </h2>
          <ul className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8 max-w-4xl mx-auto text-left">
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Submit your business to <strong className="text-volt-400">500+ high-authority directories</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">AI-powered optimization = <strong className="text-volt-400">more visibility, better consistency</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Setup in <strong className="text-volt-400">under 2 minutes</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base"><strong className="text-volt-400">$49/month</strong> | <strong className="text-volt-400">Free 7-day trial</strong></span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base"><strong className="text-volt-400">Cancel anytime</strong>. 30-day money-back guarantee</span>
            </li>
            <li className="flex items-start sm:items-center text-secondary-300 p-2">
              <span className="text-success-400 mr-3 mt-1 sm:mt-0 flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base"><strong className="text-volt-400">Trusted by 500+ businesses</strong> | ⭐ 4.9/5 rating</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-volt-400">What You'll Love</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">AI-Optimized Listings</h3>
            <p className="text-secondary-300 text-sm sm:text-base">We don't just submit—we optimize for visibility in every directory.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Multi-Platform Reach</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Google Business, Yelp, Apple Maps, Yellow Pages, and 500+ more.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Centralized Dashboard</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Track, update, and manage all listings from one clean interface.</p>
          </div>
          <div className="bg-secondary-800 p-6 sm:p-8 rounded-lg border border-volt-400/20 hover:border-volt-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-volt-400">Auto-Sync Updates</h3>
            <p className="text-secondary-300 text-sm sm:text-base">Changed your info? We update every listing automatically.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-volt-400">What Businesses Are Saying</h2>
          <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
            <blockquote className="italic text-secondary-300 bg-secondary-700 p-6 sm:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10">
              <p className="text-sm sm:text-base lg:text-lg mb-4">"DirectoryBolt saved us 20+ hours and got us listed everywhere in minutes. Our local leads doubled in 30 days."</p>
              <cite className="text-volt-400 font-medium not-italic">— Jamie M., SaaS Founder</cite>
            </blockquote>
            <blockquote className="italic text-secondary-300 bg-secondary-700 p-6 sm:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10">
              <p className="text-sm sm:text-base lg:text-lg mb-4">"I used to dread updating listings. Now it's done before I finish my coffee."</p>
              <cite className="text-volt-400 font-medium not-italic">— Amanda L., Salon Owner</cite>
            </blockquote>
            <p className="font-semibold text-volt-400 text-base sm:text-lg mt-8">⭐ Rated 4.9/5 — Trusted by 500+ businesses</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center bg-gradient-to-r from-volt-400 to-volt-600 text-secondary-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Let's Get You Found</h2>
          <p className="mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">Stop being invisible. Start showing up where your ideal customers are searching.</p>
          <button 
            onClick={() => router.push('/pricing')}
            className="bg-secondary-900 text-volt-400 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:bg-secondary-800 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl"
          >
            Start My Free Trial Today
          </button>
          <p className="mt-4 text-xs sm:text-sm opacity-90">Fast setup | 500+ directories | 100% visibility control</p>
        </div>
      </section>
    </div>
  )
}