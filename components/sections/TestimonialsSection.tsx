export default function TestimonialsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-secondary-800 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-volt-400">What 500+ Businesses Are Saying</h2>
        
        {/* Social proof numbers */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-volt-400">500+</div>
            <div className="text-xs sm:text-sm text-secondary-400">Happy Businesses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-volt-400">4.9⭐</div>
            <div className="text-xs sm:text-sm text-secondary-400">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-volt-400">98%</div>
            <div className="text-xs sm:text-sm text-secondary-400">Success Rate</div>
          </div>
        </div>
        <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          <blockquote className="italic text-secondary-300 bg-secondary-700 p-4 sm:p-6 lg:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10 group hover:border-volt-500/30">
            <p className="text-sm sm:text-base lg:text-lg mb-4 group-hover:text-secondary-200 transition-colors">&quot;DirectoryBolt found us 23 high-authority directories we never knew existed. Generated <span className="text-volt-400 font-bold">$15,247 in new revenue</span> in 60 days.&quot;</p>
            <cite className="text-volt-400 font-medium not-italic group-hover:text-volt-300 transition-colors">— Sarah Chen, Local Dental Practice</cite>
            <div className="mt-2 text-xs text-success-400 font-bold">ROI: 450%</div>
          </blockquote>
          <blockquote className="italic text-secondary-300 bg-secondary-700 p-4 sm:p-6 lg:p-8 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-volt-500/10 group hover:border-volt-500/30">
            <p className="text-sm sm:text-base lg:text-lg mb-4 group-hover:text-secondary-200 transition-colors">&quot;We use DirectoryBolt for all our clients. The ROI is incredible—clients see results in weeks, not months.&quot;</p>
            <cite className="text-volt-400 font-medium not-italic group-hover:text-volt-300 transition-colors">— Jennifer Walsh, Marketing Agency CEO</cite>
            <div className="mt-2 text-xs text-success-400 font-bold">Client ROI: 600%</div>
          </blockquote>
          <div className="bg-volt-500/10 border border-volt-500/30 rounded-xl p-4 sm:p-6 mt-8 max-w-2xl mx-auto">
            <p className="font-semibold text-volt-400 text-base sm:text-lg mb-2">⭐ Rated 4.9/5 — Trusted by 500+ businesses</p>
            <p className="text-xs sm:text-sm text-secondary-300">Join the businesses already dominating their local markets</p>
          </div>
        </div>
      </div>
    </section>
  )
}