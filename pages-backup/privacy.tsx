import Head from 'next/head'
import Header from '../components/Header'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | DirectoryBolt</title>
        <meta name="description" content="DirectoryBolt Privacy Policy - How we collect, use, and protect your personal information in accordance with GDPR and CCPA regulations." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://directorybolt.com/privacy" />
      </Head>

      <div className="bg-secondary-900 text-white min-h-screen">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-lg text-secondary-300">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Personal Information</h3>
              <p className="text-secondary-300 mb-4">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Name, email address, phone number, and business information</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Account credentials and profile information</li>
                <li>Communications with our support team</li>
                <li>Survey responses and feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Automatically Collected Information</h3>
              <p className="text-secondary-300 mb-4">
                When you use our services, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, clicks, scrolling behavior)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (general geographic location based on IP address)</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">2. How We Use Your Information</h2>
              <p className="text-secondary-300 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Provide, maintain, and improve our directory submission services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Communicate with you about products, services, offers, and events</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve your experience with our services</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-secondary-300 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except as described below:
              </p>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Providers</h3>
              <p className="text-secondary-300 mb-4">
                We share information with third-party service providers who perform services on our behalf, including:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
                <li><strong>Google Analytics:</strong> Website analytics (anonymized data only)</li>
                <li><strong>Email service providers:</strong> Transactional and marketing emails</li>
                <li><strong>Directory submission partners:</strong> Business listing submissions</li>
                <li><strong>Cloud hosting providers:</strong> Data storage and hosting services</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Legal Requirements</h3>
              <p className="text-secondary-300 mb-4">
                We may disclose your information if required to do so by law or if we believe such action is necessary to:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Comply with legal obligations or valid legal process</li>
                <li>Protect and defend our rights or property</li>
                <li>Prevent fraud or other illegal activity</li>
                <li>Protect the personal safety of users or the public</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">4. Data Security</h2>
              <p className="text-secondary-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>AES-256 encryption for data storage</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and employee training</li>
                <li>Secure data centers with physical security measures</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">5. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">GDPR Rights (EU Residents)</h3>
              <p className="text-secondary-300 mb-4">If you are a resident of the European Union, you have the following rights:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
                <li><strong>Right to Object:</strong> Object to processing for legitimate interests or direct marketing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">CCPA Rights (California Residents)</h3>
              <p className="text-secondary-300 mb-4">If you are a California resident, you have the following rights:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Right to Know:</strong> Request information about personal data collection and use</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal data</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal data (we don't sell data)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal treatment regardless of privacy rights exercise</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">How to Exercise Your Rights</h3>
              <p className="text-secondary-300 mb-2">
                To exercise your privacy rights, you can:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Submit a request through our <a href="/api/gdpr/deletion-request" className="text-volt-400 hover:text-volt-300">GDPR deletion endpoint</a></li>
                <li>Email us at privacy@directorybolt.com</li>
                <li>Contact our support team through your account dashboard</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-secondary-300 mb-4">
                We use cookies and similar technologies to provide and improve our services:
              </p>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Types of Cookies</h3>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Necessary Cookies:</strong> Essential for website functionality (always enabled)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns (opt-in required)</li>
                <li><strong>Marketing Cookies:</strong> Used for targeted advertising (opt-in required)</li>
              </ul>

              <p className="text-secondary-300 mb-4">
                You can manage your cookie preferences through our cookie consent banner or by adjusting your browser settings.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">7. Data Retention</h2>
              <p className="text-secondary-300 mb-4">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li><strong>Account Information:</strong> Until account deletion or 3 years after last activity</li>
                <li><strong>Transaction Data:</strong> 7 years for tax and legal compliance</li>
                <li><strong>Marketing Data:</strong> Until you unsubscribe or opt-out</li>
                <li><strong>Analytics Data:</strong> 26 months (Google Analytics default)</li>
                <li><strong>Support Communications:</strong> 3 years after resolution</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">8. International Data Transfers</h2>
              <p className="text-secondary-300 mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Privacy Shield certification (where applicable)</li>
                <li>Adequacy decisions by relevant data protection authorities</li>
              </ul>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">9. Children's Privacy</h2>
              <p className="text-secondary-300">
                Our services are not directed to children under 16. We do not knowingly collect personal information 
                from children under 16. If we learn that we have collected personal information from a child under 16, 
                we will delete such information promptly.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-secondary-300">
                We may update this privacy policy from time to time. We will notify you of any material changes by 
                posting the new privacy policy on this page and updating the "Last updated" date. Continued use of 
                our services after changes become effective constitutes acceptance of the revised policy.
              </p>
            </div>

            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">11. Contact Information</h2>
              <p className="text-secondary-300 mb-4">
                If you have any questions about this privacy policy or our privacy practices, please contact us:
              </p>
              <div className="bg-secondary-700 rounded-lg p-4">
                <p className="text-volt-300 font-semibold mb-2">DirectoryBolt Privacy Team</p>
                <p className="text-secondary-300">Email: privacy@directorybolt.com</p>
                <p className="text-secondary-300">Address: Privacy Officer, DirectoryBolt LLC</p>
                <p className="text-secondary-300">Response Time: 30 days maximum (EU/GDPR requests: 30 days)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}