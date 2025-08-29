// 💻 BEN: Success page with session confirmation
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SuccessPage = () => {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session ID from URL params
    const { session_id } = router.query;
    if (session_id) {
      setSessionId(session_id);
      console.log('💻 BEN: Success page loaded with session:', session_id);
    }
    setLoading(false);
  }, [router.query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center text-white">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Successful! 🎉</h1>
            <p className="text-xl text-green-100">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            {sessionId && (
              <div className="mt-4 text-sm text-green-200">
                Order ID: {sessionId}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What happens next?</h2>
              <p className="text-gray-600 text-lg">
                We'll start processing your directory submissions within 24 hours.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-8 mb-12">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmation Email</h3>
                  <p className="text-gray-600">
                    You'll receive an email confirmation with your order details within minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-yellow-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Processing Begins</h3>
                  <p className="text-gray-600">
                    Our team will start submitting your business to the selected directories.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Results Delivered</h3>
                  <p className="text-gray-600">
                    You'll receive a comprehensive report with all submission results.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <a className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Back to Home
                </a>
              </Link>
              
              <Link href="/pricing">
                <a className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  View Pricing Plans
                </a>
              </Link>
            </div>

            {/* Support */}
            <div className="mt-12 text-center border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Our support team is here to help you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <a href="mailto:support@directorybolt.com" className="text-blue-600 hover:text-blue-700">
                  📧 support@directorybolt.com
                </a>
                <span className="hidden sm:inline text-gray-400">|</span>
                <a href="tel:1-800-555-0123" className="text-blue-600 hover:text-blue-700">
                  📞 1-800-555-0123
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Upsell (for subscription if they didn't add it) */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Want to Keep Your Listings Updated?</h3>
          <p className="text-purple-100 mb-6">
            Add our Auto Update & Resubmission service to keep your business information current across all directories.
          </p>
          <div className="flex items-center justify-center mb-6">
            <div className="text-4xl font-bold">$49/month</div>
            <div className="ml-4 text-purple-200">
              <div>Automatic updates</div>
              <div>Monthly resubmissions</div>
            </div>
          </div>
          <Link href="/pricing">
            <a className="inline-flex items-center justify-center px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Add Subscription Service
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;