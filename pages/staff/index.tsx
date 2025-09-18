import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'supervisor' | 'admin';
  permissions: string[];
}

interface QueueItem {
  id: string;
  customerId: string;
  businessName: string;
  packageType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  created: string;
  assignedTo?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const staffKey = localStorage.getItem('staff_api_key');
    if (!staffKey) {
      router.push('/staff/login');
      return;
    }

    try {
      const response = await fetch('/api/staff/auth-check', {
        headers: {
          'Authorization': `Bearer ${staffKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        loadDashboardData();
      } else {
        localStorage.removeItem('staff_api_key');
        router.push('/staff/login');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.push('/staff/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Fetch real queue data from API
      const response = await fetch('/api/queue', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staff_api_key')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.items) {
          // Map Supabase queue data to dashboard format
          const queueItems: QueueItem[] = data.data.items.map((item: any) => ({
            id: item.recordId || `queue-${Date.now()}-${Math.random()}`,
            customerId: item.customerId,
            businessName: item.businessName || 'Unknown Business',
            packageType: item.packageType || 'starter',
            status: mapQueueStatus(item.submissionStatus) as 'pending' | 'processing' | 'completed' | 'failed',
            priority: mapPriority(item.priority) as 'low' | 'medium' | 'high',
            created: item.createdAt || new Date().toISOString(),
            assignedTo: item.assignedTo
          }));
          setQueueItems(queueItems);
        } else {
          console.warn('No queue items found in API response');
          setQueueItems([]);
        }
      } else {
        throw new Error(`Failed to fetch queue data: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to empty state rather than fake data
      setQueueItems([]);
    }
  };

  // Helper function to map queue status from API to dashboard format
  const mapQueueStatus = (apiStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'in-progress': 'processing',
      'completed': 'completed',
      'failed': 'failed'
    };
    return statusMap[apiStatus] || 'pending';
  };

  // Helper function to map numerical priority to text
  const mapPriority = (priority: number): string => {
    if (priority >= 90) return 'high';
    if (priority >= 60) return 'medium';
    return 'low';
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_api_key');
    router.push('/staff/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'growth':
        return 'bg-green-100 text-green-800';
      case 'professional':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingItems = queueItems.filter(item => item.status === 'pending');
  const processingItems = queueItems.filter(item => item.status === 'processing');
  const completedItems = queueItems.filter(item => item.status === 'completed');

  return (
    <>
      <Head>
        <title>Staff Dashboard - DirectoryBolt</title>
        <meta name="description" content="DirectoryBolt Staff Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">DirectoryBolt Staff</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user?.name} ({user?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'queue', name: 'Processing Queue' },
                { id: 'analytics', name: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold text-gray-900">{pendingItems.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Processing</p>
                      <p className="text-2xl font-semibold text-gray-900">{processingItems.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-semibold text-gray-900">{completedItems.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-semibold text-gray-900">{queueItems.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {queueItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' :
                            item.status === 'processing' ? 'bg-blue-500' :
                            item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{item.businessName}</p>
                          <p className="text-sm text-gray-600">{item.customerId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPackageColor(item.packageType)}`}>
                          {item.packageType}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Processing Queue</h2>
                <button
                  onClick={() => router.push('/staff/queue')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Manage Queue
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.businessName}</div>
                            <div className="text-sm text-gray-500 font-mono">{item.customerId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPackageColor(item.packageType)}`}>
                            {item.packageType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {item.status === 'pending' && (
                            <button className="text-blue-600 hover:text-blue-900 mr-4">
                              Start
                            </button>
                          )}
                          <button className="text-green-600 hover:text-green-900">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
              <div className="text-center py-8">
                <p className="text-gray-600">Analytics dashboard coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This will include performance metrics, completion rates, and processing times.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}