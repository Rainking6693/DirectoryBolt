import Head from 'next/head'
import Header from '../components/Header'

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | DirectoryBolt - AI Business Intelligence Platform</title>
        <meta name="description" content="DirectoryBolt Terms of Service - Legal terms for our AI-powered directory submission and business intelligence services. Professional, Enterprise, Growth and Starter packages." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://directorybolt.com/terms-of-service" />
        <meta property="og:title" content="Terms of Service | DirectoryBolt" />
        <meta property="og:description" content="Legal terms and conditions for DirectoryBolt's AI business intelligence platform and directory submission services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directorybolt.com/terms-of-service" />
      </Head>

      <div className="bg-secondary-900 text-white min-h-screen">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-lg text-secondary-300 mb-4">
              DirectoryBolt AI Business Intelligence Platform
            </p>
            <p className="text-sm text-secondary-400">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* 1. Acceptance of Terms */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">1. Acceptance of Terms</h2>
              <p className="text-secondary-300 mb-4">
                By accessing and using DirectoryBolt's AI business intelligence platform and directory submission services, 
                you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these terms, 
                please do not use our services.
              </p>
              <p className="text-secondary-300">
                These Terms govern your use of our website located at directorybolt.com and all related services 
                (collectively, the "Service") operated by DirectoryBolt LLC ("DirectoryBolt", "we", "us", or "our").
              </p>
            </div>

            {/* 2. Service Description */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">2. DirectoryBolt Service Description</h2>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt provides a comprehensive AI-powered business intelligence platform offering:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>AI Business Analysis:</strong> Advanced artificial intelligence algorithms analyze your business and market positioning</li>
                <li><strong>Directory Submissions:</strong> Automated submission to 500+ business directories and local listings</li>
                <li><strong>AutoBolt Chrome Extension:</strong> Browser automation tool for streamlined directory submissions</li>
                <li><strong>Competitive Intelligence:</strong> AI-driven analysis of competitor strategies and market gaps</li>
                <li><strong>AI Content Gap Analyzer:</strong> Identifies content opportunities and optimization strategies</li>
                <li><strong>Business Intelligence Reports:</strong> Comprehensive analytics and growth recommendations</li>
                <li><strong>Real-time Processing:</strong> WebSocket-enabled live updates for Enterprise customers</li>
                <li><strong>SEO Optimization:</strong> Search engine optimization recommendations and implementation</li>
              </ul>
              <p className="text-secondary-300">
                Our services combine artificial intelligence, automation, and human expertise to enhance your business's 
                online presence and market visibility.
              </p>
            </div>

            {/* 3. Service Packages and Pricing */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">3. Service Packages and Pricing</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Available Service Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-volt-400 mb-2">Starter Package - $149</h4>
                  <ul className="text-sm text-secondary-300 space-y-1">
                    <li>• 50 directory submissions</li>
                    <li>• Basic AI business analysis</li>
                    <li>• Email support</li>
                    <li>• Standard processing time</li>
                  </ul>
                </div>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-volt-400 mb-2">Growth Package - $299</h4>
                  <ul className="text-sm text-secondary-300 space-y-1">
                    <li>• 150 directory submissions</li>
                    <li>• Complete AI business intelligence</li>
                    <li>• Competitive analysis</li>
                    <li>• Priority processing</li>
                    <li>• Enhanced analytics dashboard</li>
                  </ul>
                </div>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-volt-400 mb-2">Professional Package - $499</h4>
                  <ul className="text-sm text-secondary-300 space-y-1">
                    <li>• 300 directory submissions</li>
                    <li>• AI Content Gap Analyzer access</li>
                    <li>• White-label reporting</li>
                    <li>• Phone support</li>
                    <li>• Advanced market intelligence</li>
                  </ul>
                </div>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-volt-400 mb-2">Enterprise Package - $799</h4>
                  <ul className="text-sm text-secondary-300 space-y-1">
                    <li>• 500+ directory submissions</li>
                    <li>• Real-time WebSocket updates</li>
                    <li>• Dedicated account manager</li>
                    <li>• Custom AI analysis</li>
                    <li>• Staff dashboard access</li>
                    <li>• Priority manual processing</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Value Proposition</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt packages provide up to $4,300 worth of business intelligence consulting services, 
                market analysis, and directory submission work at a fraction of traditional consulting costs.
              </p>
            </div>

            {/* 4. Payment Terms */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">4. Payment Terms and Processing</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Payment Processing</h3>
              <p className="text-secondary-300 mb-4">
                All payments are processed securely through Stripe, Inc. DirectoryBolt does not store or have access 
                to your payment card information. By providing payment information, you:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Represent that you are authorized to use the payment method provided</li>
                <li>Authorize DirectoryBolt to charge the selected payment method for your chosen service package</li>
                <li>Agree to pay all charges incurred under your account</li>
                <li>Acknowledge that payments are processed by Stripe under their terms of service</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">One-Time Payment Model</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt operates on a one-time payment model. There are no recurring charges, subscriptions, 
                or hidden fees. Payment is due in full at the time of purchase.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">30-Day Money-Back Guarantee</h3>
              <p className="text-secondary-300 mb-4">
                We offer a comprehensive 30-day money-back guarantee. You may request a full refund within 30 days 
                of purchase if:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Our AI analysis fails to provide actionable business insights</li>
                <li>Directory submissions are not completed as specified in your package</li>
                <li>You experience technical issues that prevent service delivery</li>
                <li>The service does not meet the specifications outlined in your package</li>
              </ul>
              <p className="text-secondary-300">
                Refund requests must be submitted to support@directorybolt.com with specific reasons and documentation. 
                Refunds are processed within 5-10 business days to your original payment method.
              </p>
            </div>

            {/* 5. User Accounts and Registration */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">5. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Account Requirements</h3>
              <p className="text-secondary-300 mb-4">
                To access DirectoryBolt services, you must create an account and provide accurate information. You agree to:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Provide complete, accurate, and current business information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Ensure you have legal authority to represent the business being submitted</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Eligibility</h3>
              <p className="text-secondary-300">
                You must be at least 18 years old and legally authorized to enter binding agreements. 
                You must have the legal authority to represent the business for which you are purchasing services.
              </p>
            </div>

            {/* 6. AutoBolt Chrome Extension */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">6. AutoBolt Chrome Extension Usage</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Extension Functionality</h3>
              <p className="text-secondary-300 mb-4">
                The AutoBolt Chrome Extension automates directory submission processes by:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Filling out directory submission forms with your business information</li>
                <li>Navigating directory websites according to their submission requirements</li>
                <li>Monitoring submission progress and completion status</li>
                <li>Reporting results back to the DirectoryBolt dashboard</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Extension Requirements</h3>
              <p className="text-secondary-300 mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Use the extension only for legitimate business directory submissions</li>
                <li>Not modify, reverse engineer, or tamper with the extension code</li>
                <li>Allow the extension to access necessary browser data for form completion</li>
                <li>Report any technical issues or unexpected behavior promptly</li>
              </ul>
              
              <p className="text-secondary-300">
                The extension operates within browser security protocols and respects website terms of service 
                for legitimate business submissions.
              </p>
            </div>

            {/* 7. Acceptable Use Policy */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">7. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Permitted Uses</h3>
              <p className="text-secondary-300 mb-4">DirectoryBolt services may be used for:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Legitimate business directory submissions and listings</li>
                <li>Market research and competitive analysis for legal business purposes</li>
                <li>SEO optimization and online presence improvement</li>
                <li>Business intelligence gathering for strategic planning</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Prohibited Uses</h3>
              <p className="text-secondary-300 mb-4">You may not use our services for:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Fraudulent, illegal, or deceptive business practices</li>
                <li>Adult content, gambling, or heavily regulated industries without proper licensing</li>
                <li>Submitting false, misleading, or inaccurate business information</li>
                <li>Circumventing directory policies or terms of service</li>
                <li>Creating multiple accounts to bypass service limitations</li>
                <li>Reselling or redistributing our services without authorization</li>
                <li>Automated scraping or unauthorized data collection from our platform</li>
              </ul>
            </div>

            {/* 8. Service Delivery and Performance */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">8. Service Delivery and Performance Standards</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Delivery Timeline</h3>
              <div className="bg-secondary-700 rounded-lg p-4 mb-6">
                <ul className="text-secondary-300 space-y-2">
                  <li><strong className="text-volt-400">AI Analysis Reports:</strong> Delivered within 24-48 hours of purchase</li>
                  <li><strong className="text-volt-400">Directory Submissions:</strong> Completed within 7-14 business days</li>
                  <li><strong className="text-volt-400">Competitive Analysis:</strong> Available within 48-72 hours</li>
                  <li><strong className="text-volt-400">Enterprise Real-time Updates:</strong> Live processing with WebSocket notifications</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Quality Guarantees</h3>
              <p className="text-secondary-300 mb-4">DirectoryBolt guarantees:</p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Submission attempts to the full number of directories specified in your package</li>
                <li>Professional-quality AI analysis reports with actionable insights</li>
                <li>Adherence to directory submission best practices and guidelines</li>
                <li>Responsive customer support throughout the service delivery process</li>
              </ul>
              
              <p className="text-secondary-300">
                <strong>Note:</strong> Directory approval rates depend on individual directory requirements, 
                business category, and information quality. We cannot guarantee approval by specific directories.
              </p>
            </div>

            {/* 9. Intellectual Property Rights */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">9. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">DirectoryBolt Intellectual Property</h3>
              <p className="text-secondary-300 mb-4">
                The DirectoryBolt platform, including our AI algorithms, software, design, content, and methodology, 
                is protected by copyright, trademark, patent, and other intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Copy, reproduce, or distribute our proprietary technology</li>
                <li>Reverse engineer our AI algorithms or software systems</li>
                <li>Create derivative works based on our platform</li>
                <li>Remove or alter copyright or proprietary notices</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Your Business Information</h3>
              <p className="text-secondary-300 mb-4">
                You retain all rights to your business information and content. By using our services, you grant 
                DirectoryBolt a limited, non-exclusive license to:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Use your business information solely for providing directory submission services</li>
                <li>Process your data through our AI systems for analysis and reporting</li>
                <li>Submit your information to third-party directories as specified in your service package</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">AI-Generated Reports</h3>
              <p className="text-secondary-300">
                Reports and analysis generated by our AI systems are provided for your exclusive business use. 
                You may not redistribute, resell, or publicly share these reports without our written consent.
              </p>
            </div>

            {/* 10. Privacy and Data Protection */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">10. Privacy and Data Protection</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Data Collection and Use</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt collects and processes business information necessary to provide our services, including:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Business contact information and details</li>
                <li>Website and online presence data</li>
                <li>Market and competitive analysis data</li>
                <li>Service usage and analytics information</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Data Security</h3>
              <p className="text-secondary-300 mb-4">
                We implement industry-standard security measures to protect your data, including encryption, 
                secure data transmission, and access controls. However, no method of electronic storage or 
                transmission is 100% secure.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Privacy Policy</h3>
              <p className="text-secondary-300">
                Our detailed privacy practices are outlined in our Privacy Policy, which is incorporated into 
                these Terms by reference. Please review our 
                <a href="/privacy" className="text-volt-400 hover:text-volt-300 ml-1">Privacy Policy</a> 
                for complete information about data handling.
              </p>
            </div>

            {/* 11. Third-Party Services */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">11. Third-Party Services and Directory Policies</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Directory Partners</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt submits your business information to various third-party directories, including:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Major search engines: Google Business Profile, Bing Places, Apple Maps</li>
                <li>Review platforms: Yelp, Better Business Bureau, TripAdvisor</li>
                <li>Local directories: Yellow Pages, White Pages, Superpages</li>
                <li>Industry-specific directories and professional networks</li>
                <li>Social media business profiles and local citation sites</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Third-Party Terms</h3>
              <p className="text-secondary-300 mb-4">
                Each directory has its own terms of service, privacy policy, and submission requirements. 
                By using DirectoryBolt services, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Directory approvals are subject to each directory's individual policies</li>
                <li>Some directories may require additional verification or documentation</li>
                <li>Directory listing modifications or removals must be handled directly with each directory</li>
                <li>DirectoryBolt is not responsible for third-party directory policy changes</li>
              </ul>
            </div>

            {/* 12. Disclaimers and Limitations */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">12. Disclaimers and Limitations of Liability</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Disclaimers</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt services are provided "as is" and "as available" without warranties of any kind. 
                We specifically disclaim warranties regarding:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Specific directory approval rates or guaranteed acceptance</li>
                <li>Immediate or guaranteed improvements in website traffic or business inquiries</li>
                <li>Specific SEO ranking improvements or search visibility increases</li>
                <li>Compatibility with all business types, industries, or geographic locations</li>
                <li>Accuracy of third-party directory information or policies</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Limitation of Liability</h3>
              <p className="text-secondary-300 mb-4">
                In no event shall DirectoryBolt LLC, its officers, directors, employees, or agents be liable for:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages resulting from third-party directory policies or decisions</li>
                <li>Technical issues beyond our reasonable control</li>
              </ul>
              
              <p className="text-secondary-300">
                <strong>Maximum Liability:</strong> Our total liability for any claims shall not exceed the amount 
                you paid for the specific service package giving rise to the claim.
              </p>
            </div>

            {/* 13. Service Availability */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">13. Service Availability and Modifications</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Uptime and Availability</h3>
              <p className="text-secondary-300 mb-4">
                We strive to maintain 99.9% uptime for our platform, but may experience temporary interruptions for:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Scheduled maintenance and system updates</li>
                <li>Emergency security patches or bug fixes</li>
                <li>Third-party service provider outages</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Service Modifications</h3>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt reserves the right to modify, update, or discontinue features of our service. 
                We will provide reasonable notice of significant changes that affect purchased services.
              </p>
            </div>

            {/* 14. Termination */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">14. Termination</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Termination by User</h3>
              <p className="text-secondary-300 mb-4">
                You may discontinue using DirectoryBolt services at any time. One-time purchases are non-refundable 
                after the 30-day guarantee period, but you retain access to:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Delivered AI analysis reports and business intelligence</li>
                <li>Completed directory submissions and listings</li>
                <li>Dashboard access for monitoring submission status</li>
              </ul>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Termination by DirectoryBolt</h3>
              <p className="text-secondary-300 mb-4">
                We may terminate or suspend your access immediately for conduct that:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-4">
                <li>Violates these Terms of Service or our policies</li>
                <li>Involves fraudulent, deceptive, or illegal activity</li>
                <li>Harms other users, our business, or third-party services</li>
                <li>Violates applicable laws or regulations</li>
              </ul>
              
              <p className="text-secondary-300">
                Upon termination, your right to access and use our services ceases immediately.
              </p>
            </div>

            {/* 15. Legal Compliance */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">15. Legal Compliance and Governing Law</h2>
              
              <h3 className="text-xl font-semibold text-volt-300 mb-3">Governing Law</h3>
              <p className="text-secondary-300 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
                United States, without regard to conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Dispute Resolution</h3>
              <p className="text-secondary-300 mb-4">
                Any disputes arising from these Terms or your use of DirectoryBolt services shall be resolved through:
              </p>
              <ol className="list-decimal list-inside text-secondary-300 space-y-2 mb-6">
                <li><strong>Good Faith Negotiation:</strong> Direct communication to resolve disputes amicably</li>
                <li><strong>Mediation:</strong> If negotiation fails, binding mediation in Delaware</li>
                <li><strong>Arbitration:</strong> Final binding arbitration under American Arbitration Association rules</li>
              </ol>

              <h3 className="text-xl font-semibold text-volt-300 mb-3">Severability</h3>
              <p className="text-secondary-300">
                If any provision of these Terms is found to be unenforceable, the remaining provisions 
                shall continue in full force and effect.
              </p>
            </div>

            {/* 16. Changes to Terms */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20 mb-8">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">16. Changes to Terms of Service</h2>
              <p className="text-secondary-300 mb-4">
                DirectoryBolt reserves the right to modify these Terms at any time. Material changes will be 
                communicated through:
              </p>
              <ul className="list-disc list-inside text-secondary-300 space-y-2 mb-6">
                <li>Email notification to registered users</li>
                <li>Prominent notice on our website</li>
                <li>In-app notifications for active users</li>
              </ul>
              <p className="text-secondary-300">
                Continued use of DirectoryBolt services after changes become effective constitutes acceptance 
                of the revised Terms.
              </p>
            </div>

            {/* 17. Contact Information */}
            <div className="bg-secondary-800 rounded-xl p-6 sm:p-8 border border-volt-500/20">
              <h2 className="text-2xl font-bold text-volt-400 mb-4">17. Contact Information</h2>
              <p className="text-secondary-300 mb-6">
                For questions about these Terms of Service or DirectoryBolt services, please contact us:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h3 className="text-volt-400 font-semibold mb-3">Legal Inquiries</h3>
                  <p className="text-secondary-300 text-sm space-y-1">
                    <span className="block">Email: legal@directorybolt.com</span>
                    <span className="block">Response Time: 5 business days</span>
                    <span className="block">For: Terms, compliance, legal matters</span>
                  </p>
                </div>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <h3 className="text-volt-400 font-semibold mb-3">Customer Support</h3>
                  <p className="text-secondary-300 text-sm space-y-1">
                    <span className="block">Email: support@directorybolt.com</span>
                    <span className="block">Response Time: 24-48 hours</span>
                    <span className="block">For: Service, technical, billing</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-secondary-700 rounded-lg p-4 mb-6">
                <h3 className="text-volt-400 font-semibold mb-3">Business Address</h3>
                <p className="text-secondary-300 text-sm">
                  DirectoryBolt LLC<br />
                  Legal Department<br />
                  Delaware, United States
                </p>
              </div>
              
              <div className="bg-volt-500/10 border border-volt-500/30 rounded-lg p-4">
                <h3 className="text-volt-300 font-semibold mb-2">Terms Acceptance</h3>
                <p className="text-secondary-300 text-sm">
                  By using DirectoryBolt's AI business intelligence platform and directory submission services, 
                  you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
                  and our Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}