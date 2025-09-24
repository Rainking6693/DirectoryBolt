import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

const CustomerLogin: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    customerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'email' | 'customerId'>('email');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginData = loginMethod === 'email' 
        ? { email: formData.email }
        : { customerId: formData.customerId };

      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store customer ID in localStorage
      localStorage.setItem('customerId', result.customerId);
      
      // Redirect to customer portal
      router.push('/customer-portal');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Login - DirectoryBolt</title>
        <meta name="description" content="Access your DirectoryBolt customer portal" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              DirectoryBolt
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Customer Portal Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your directory submission dashboard
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Login Method Toggle */}
            <div className="mb-6">
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                    loginMethod === 'email'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('customerId')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                    loginMethod === 'customerId'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Customer ID
                </button>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {loginMethod === 'email' ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Use the email address you provided when purchasing
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                    Customer ID
                  </label>
                  <div className="mt-1">
                    <input
                      id="customerId"
                      name="customerId"
                      type="text"
                      required
                      value={formData.customerId}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="DIR-2025-XXXXXX"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Your Customer ID was provided in your confirmation email
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Login Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </>
                  ) : (
                    'Access Portal'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need help?</span>
                </div>
              </div>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Can't find your Customer ID?{' '}
                  <a href="mailto:support@directorybolt.com" className="font-medium text-blue-600 hover:text-blue-500">
                    Contact Support
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                    Get Started
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How to find your login information:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Check your email confirmation from DirectoryBolt</li>
              <li>• Your Customer ID starts with "DIR-2025-"</li>
              <li>• Use the same email address you used for purchase</li>
              <li>• Contact support if you need assistance</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerLogin;