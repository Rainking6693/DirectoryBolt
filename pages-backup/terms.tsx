import Head from 'next/head'
import Header from '../components/Header'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | DirectoryBolt</title>
        <meta name="description" content="DirectoryBolt Terms of Service - Legal terms and conditions for using our AI-powered directory submission services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://directorybolt.com/terms" />
      </Head>

      <div className="bg-secondary-900 text-white min-h-screen">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-lg text-secondary-300">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">1. Acceptance of Terms</h2>
              <p className="text-secondary-300 mb-4">
                By accessing and using DirectoryBolt's services, you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-secondary-300">
                These Terms of Service ("Terms") govern your use of our website located at directorybolt.com (the "Service") 
                operated by DirectoryBolt LLC ("us", "we", or "our").
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">2. Description of Service</h2>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt provides AI-powered business directory submission services, including:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Automated business listing submissions to 500+ directories</li>
                <li>AI-powered market analysis and competitive intelligence</li>
                <li>SEO optimization recommendations</li>
                <li>Business visibility scoring and monitoring</li>
                <li>Growth strategy recommendations</li>
              </ul>
              <p className="text-secondary-300">
                Our services are designed to improve your business's online presence and visibility through legitimate 
                directory submissions and data-driven insights.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Account Creation</h3>
              <p className="text-secondary-300 mb-4">
                To use certain features of our service, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Provide accurate, complete, and up-to-date information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Eligibility</h3>
              <p className="text-secondary-300 mb-4">
                You must be at least 18 years old and have the legal authority to enter into this agreement. 
                You represent that you are legally permitted to use our services in your jurisdiction.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">4. Payment Terms and Refund Policy</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Pricing and Payments</h3>
              <p className="text-secondary-300 mb-4">
                Our services are offered on a one-time payment model with the following tiers:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Starter Package:</strong> $149 - Basic analysis + 100 directory submissions</li>
                <li><strong>Growth Package:</strong> $299 - Complete analysis + 300 directory submissions</li>
                <li><strong>Enterprise Package:</strong> $799 - Full analysis + 500+ directory submissions</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Payment Processing</h3>
              <p className="text-secondary-300 mb-4">
                All payments are processed securely through Stripe. We do not store your payment information. 
                By providing payment information, you represent that you are authorized to use the payment method.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">30-Day Money-Back Guarantee</h3>
              <p className="text-secondary-300 mb-4">
                We offer a 30-day money-back guarantee. If you are not satisfied with our service, you may request 
                a full refund within 30 days of purchase, provided that:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>You can demonstrate that our service did not deliver the promised results</li>
                <li>You have not received at least 5 new customer inquiries within 30 days</li>
                <li>The refund request is made in good faith with legitimate reasons</li>
              </ul>
              <p className="text-secondary-300">
                Refund requests must be submitted to support@directorybolt.com with documentation of your experience.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">5. Service Delivery and Performance</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Delivery Timeline</h3>
              <p className="text-secondary-300 mb-4">
                We strive to deliver results within the following timeframes:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>AI Analysis Report:</strong> Within 24-48 hours of purchase</li>
                <li><strong>Directory Submissions:</strong> Completed within 7-14 business days</li>
                <li><strong>Initial Results Visibility:</strong> 2-4 weeks after submission completion</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Guarantees</h3>
              <p className="text-secondary-300 mb-4">
                We guarantee to submit your business to the number of directories specified in your package. 
                However, approval rates depend on individual directory requirements and your business information quality.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">6. User Responsibilities and Prohibited Uses</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Your Responsibilities</h3>
              <p className="text-secondary-300 mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Provide accurate and complete business information</li>
                <li>Ensure you have the legal right to represent the business</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain appropriate business licenses and certifications</li>
                <li>Respond to directory verification requests promptly</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Prohibited Uses</h3>
              <p className="text-secondary-300 mb-4">You may not use our services for:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Fraudulent, illegal, or deceptive business practices</li>
                <li>Adult content, gambling, or regulated industries without proper licensing</li>
                <li>Businesses that violate directory terms of service</li>
                <li>Submitting false or misleading information</li>
                <li>Creating multiple accounts to circumvent our policies</li>
                <li>Automated scraping or misuse of our platform</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">7. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Our Content</h3>
              <p className="text-secondary-300 mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive 
                property of DirectoryBolt LLC and its licensors. The Service is protected by copyright, trademark, 
                and other laws.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Your Content</h3>
              <p className="text-secondary-300 mb-4">
                You retain ownership of your business information and content. By using our services, you grant us 
                a limited license to use your business information solely for the purpose of providing directory 
                submission services.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">AI-Generated Analysis</h3>
              <p className="text-secondary-300">
                Reports and analysis generated by our AI systems are provided to you for your business use. 
                You may not redistribute or resell these reports without our explicit permission.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">8. Disclaimers and Limitations of Liability</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Disclaimers</h3>
              <p className="text-secondary-300 mb-4">
                Our services are provided "as is" and "as available" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Specific approval rates from directory submissions</li>
                <li>Specific increases in website traffic or business inquiries</li>
                <li>Immediate or guaranteed SEO improvements</li>
                <li>Compatibility with all business types or industries</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Limitation of Liability</h3>
              <p className="text-secondary-300 mb-4">
                In no event shall DirectoryBolt LLC be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, or use, incurred by you or 
                any third party, whether in an action in contract or tort, arising from your access to or use of the Service.
              </p>
              <p className="text-secondary-300">
                Our total liability for any claims shall not exceed the amount you paid for the service.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">9. Third-Party Services and Directory Policies</h2>
              <p className="text-secondary-300 mb-4">
                Our service involves submitting your business to third-party directories, each with their own terms and policies:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Google Business Profile, Bing Places, Apple Maps</li>
                <li>Yelp, Better Business Bureau, Yellow Pages</li>
                <li>Industry-specific directories and local directories</li>
                <li>Social media platforms and review sites</li>
              </ul>
              <p className="text-secondary-300">
                You acknowledge that directory approvals are subject to each directory's individual policies and 
                quality standards, which are beyond our control.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">10. Privacy and Data Protection</h2>
              <p className="text-secondary-300 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p className="text-secondary-300">
                By using our services, you consent to our privacy practices as outlined in our 
                <a href="/privacy" className="text-volt-400 hover:text-volt-300 ml-1">Privacy Policy</a>.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">11. Termination</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Termination by You</h3>
              <p className="text-secondary-300 mb-4">
                You may discontinue using our services at any time. One-time purchases are non-refundable after 
                the 30-day guarantee period, but you retain access to delivered reports and analysis.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Termination by Us</h3>
              <p className="text-secondary-300 mb-4">
                We may terminate or suspend your access immediately, without prior notice, for conduct that we believe:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Violates these Terms or our policies</li>
                <li>Is harmful to other users or our business</li>
                <li>Involves fraudulent or illegal activity</li>
                <li>Violates applicable laws or regulations</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">12. Changes to Terms</h2>
              <p className="text-secondary-300 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className="text-secondary-300">
                Your continued use of our services after changes become effective constitutes acceptance of the 
                revised terms.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">13. Governing Law and Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Governing Law</h3>
              <p className="text-secondary-300 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of Delaware, 
                without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Dispute Resolution</h3>
              <p className="text-secondary-300 mb-4">
                Any disputes arising from these terms or your use of our services will be resolved through:
              </p>
              <ol className="list-decimal list-inside text-secondary-300 space-y-2">
                <li><strong>Good Faith Negotiation:</strong> Direct discussion to resolve the matter</li>
                <li><strong>Mediation:</strong> If negotiation fails, binding mediation in Delaware</li>
                <li><strong>Arbitration:</strong> Final binding arbitration under American Arbitration Association rules</li>
              </ol>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">14. Contact Information</h2>
              <p className="text-secondary-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-secondary-700 rounded-lg p-4">
                <p className="text-volt-300 font-semibold mb-2">DirectoryBolt Legal Team</p>
                <p className="text-secondary-300">Email: legal@directorybolt.com</p>
                <p className="text-secondary-300">Support: support@directorybolt.com</p>
                <p className="text-secondary-300">Address: DirectoryBolt LLC, Legal Department</p>
                <p className="text-secondary-300">Response Time: 5 business days maximum</p>
              </div>
              
              <div className="mt-6 p-4 bg-volt-500/10 border border-volt-500/30 rounded-lg">
                <p className="text-volt-300 font-semibold mb-2">Agreement</p>
                <p className="text-secondary-300 text-sm">
                  By using DirectoryBolt's services, you acknowledge that you have read, understood, and 
                  agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}