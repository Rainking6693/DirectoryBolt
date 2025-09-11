import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface CustomerData {
  id: string;
  businessName: string;
  email: string;
  website: string;
  packageType: string;
  directoryLimit: number;
  status: string;
  progress: number;
  submittedDirectories: number;
  purchaseDate: string;
  estimatedCompletion: string;
}

interface ProgressMilestone {
  percentage: number;
  label: string;
  completed: boolean;
  date?: string;
}

interface DirectorySubmission {
  id: string;
  directoryName: string;
  status: 'pending' | 'submitted' | 'approved' | 'failed';
  submissionDate?: string;
  approvalDate?: string;
  directoryUrl: string;
  notes?: string;
}

const CustomerPortal: React.FC = () => {
  const router = useRouter();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [progressMilestones, setProgressMilestones] = useState<ProgressMilestone[]>([]);
  const [directorySubmissions, setDirectorySubmissions] = useState<DirectorySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'directories' | 'support'>('overview');

  // Authentication check
  useEffect(() => {
    const customerId = localStorage.getItem('customerId') || router.query.customerId as string;
    
    if (!customerId) {
      router.push('/customer-login');
      return;
    }

    fetchCustomerData(customerId);
  }, [router]);

  const fetchCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      
      // Fetch customer data
      const customerResponse = await fetch(`/api/customer/data?customerId=${customerId}`);
      if (!customerResponse.ok) {
        throw new Error('Failed to fetch customer data');
      }
      const customer = await customerResponse.json();
      setCustomerData(customer);

      // Fetch progress milestones
      const progressResponse = await fetch(`/api/customer/progress?customerId=${customerId}`);
      if (progressResponse.ok) {
        const progress = await progressResponse.json();
        setProgressMilestones(progress.milestones || []);
      }

      // Fetch directory submissions
      const submissionsResponse = await fetch(`/api/customer/submissions?customerId=${customerId}`);
      if (submissionsResponse.ok) {
        const submissions = await submissionsResponse.json();
        setDirectorySubmissions(submissions.submissions || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error || 'Customer data not found'}</p>
          <button 
            onClick={() => router.push('/customer-login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customer Portal - DirectoryBolt</title>
        <meta name="description" content="Track your directory submission progress" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">DirectoryBolt</h1>
                <span className="ml-4 text-sm text-gray-500">Customer Portal</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {customerData.businessName}</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('customerId');
                    router.push('/');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'progress', label: 'Progress Tracking' },
                { id: 'directories', label: 'Directory Submissions' },
                { id: 'support', label: 'Support' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{customerData.progress}%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{customerData.submittedDirectories}</div>
                    <div className="text-sm text-gray-600">Submitted</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{customerData.directoryLimit - customerData.submittedDirectories}</div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{customerData.packageType}</div>
                    <div className="text-sm text-gray-600">Package</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${customerData.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Started: {new Date(customerData.purchaseDate).toLocaleDateString()}</span>
                  <span>Est. Completion: {customerData.estimatedCompletion}</span>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <p className="mt-1 text-sm text-gray-900">{customerData.businessName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="mt-1 text-sm text-gray-900">{customerData.website}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{customerData.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customerData.status)}`}>
                      {customerData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Progress Milestones</h2>
                <div className="space-y-4">
                  {progressMilestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {milestone.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${milestone.completed ? 'text-green-700' : 'text-gray-700'}`}>
                            {milestone.label} ({milestone.percentage}%)
                          </span>
                          {milestone.date && (
                            <span className="text-sm text-gray-500">{milestone.date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Directory Submissions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Directory
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {directorySubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{submission.directoryName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubmissionStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {submission.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a 
                              href={submission.directoryUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Directory
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Support Center</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">📧 Email Support</h3>
                    <p className="text-sm text-gray-600 mb-3">Get help via email within 24 hours</p>
                    <a 
                      href="mailto:support@directorybolt.com"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Contact Support
                    </a>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">💬 Live Chat</h3>
                    <p className="text-sm text-gray-600 mb-3">Chat with our support team</p>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                      Start Chat
                    </button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">How long does the submission process take?</h4>
                      <p className="text-sm text-gray-600 mt-1">Most submissions are completed within 5-7 business days, depending on your package size.</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">Can I track individual directory submissions?</h4>
                      <p className="text-sm text-gray-600 mt-1">Yes! Use the "Directory Submissions" tab to see the status of each directory submission.</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">What if a directory submission fails?</h4>
                      <p className="text-sm text-gray-600 mt-1">Our team will manually review and resubmit failed submissions at no additional cost.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerPortal;