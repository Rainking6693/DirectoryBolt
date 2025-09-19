import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface ConfigCheck {
  name: string;
  status: 'ok' | 'missing' | 'error';
  message: string;
}

interface ConfigStatus {
  overallStatus: 'healthy' | 'warning' | 'error';
  checks: ConfigCheck[];
  summary: {
    total: number;
    ok: number;
    missing: number;
    error: number;
  };
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'admin' | 'staff' | 'readonly';
  created: string;
  active: boolean;
}

interface CustomerStats {
  totalCustomers: number;
  activeMonitoring: number;
  alertsGenerated: number;
  complianceRequests: number;
  error?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const adminKey = localStorage.getItem('admin_api_key');
    if (!adminKey) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
    loadDashboardData(adminKey);
  };

  const loadDashboardData = async (adminKey: string) => {
    try {
      // Load configuration status
      const configResponse = await fetch('/api/admin/config-check', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfigStatus(configData);
      }

      // Load API keys
      const keysResponse = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });
      
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.keys || []);
      }

      // Load customer statistics
      const statsResponse = await fetch('/api/admin/customers/stats', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCustomerStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_api_key');
    router.push('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'missing':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - DirectoryBolt</title>
        <meta name="description" content="DirectoryBolt Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">DirectoryBolt Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Administrator</span>
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
                { id: 'config', name: 'Configuration' },
                { id: 'api-keys', name: 'API Keys' },
                { id: 'customers', name: 'Customers' }
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
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
                {configStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          configStatus.overallStatus === 'healthy' ? 'bg-green-500' :
                          configStatus.overallStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Overall Status</p>
                          <p className="text-sm text-gray-600 capitalize">{configStatus.overallStatus}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Configuration Checks</p>
                        <p className="text-sm text-gray-600">
                          {configStatus.summary.ok}/{configStatus.summary.total} passing
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">API Keys</p>
                        <p className="text-sm text-gray-600">{apiKeys.length} configured</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Statistics</h2>
                {customerStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Customers</p>
                          <p className="text-2xl font-semibold text-gray-900">{customerStats.totalCustomers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Active Monitoring</p>
                          <p className="text-2xl font-semibold text-gray-900">{customerStats.activeMonitoring}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Alerts Generated</p>
                          <p className="text-2xl font-semibold text-gray-900">{customerStats.alertsGenerated}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Compliance Requests</p>
                          <p className="text-2xl font-semibold text-gray-900">{customerStats.complianceRequests}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading customer statistics...</span>
                  </div>
                )}
                {customerStats?.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">Error loading statistics: {customerStats.error}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('config')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="text-sm font-medium text-gray-900">Check Configuration</div>
                    <div className="text-sm text-gray-600">Verify system settings</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('api-keys')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="text-sm font-medium text-gray-900">Manage API Keys</div>
                    <div className="text-sm text-gray-600">Create and manage keys</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="text-sm font-medium text-gray-900">View Customers</div>
                    <div className="text-sm text-gray-600">Manage customer data</div>
                  </button>
                  <a
                    href="/api/health/google-sheets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
                  >
                    <div className="text-sm font-medium text-gray-900">Test Google Sheets</div>
                    <div className="text-sm text-gray-600">Check integration</div>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
              {configStatus ? (
                <div className="space-y-4">
                  {configStatus.checks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          check.status === 'ok' ? 'bg-green-500' :
                          check.status === 'missing' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{check.name}</p>
                          <p className="text-sm text-gray-600">{check.message}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Loading configuration status...</p>
              )}
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                  Create New Key
                </button>
              </div>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{key.name}</p>
                      <p className="text-sm text-gray-600">Type: {key.type} • Created: {key.created}</p>
                      <p className="text-sm font-mono text-gray-500">{key.key}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        key.active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {key.active ? 'Active' : 'Inactive'}
                      </span>
                      <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customer Management</h2>
                <button
                  onClick={() => router.push('/admin/customers')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  View All Customers
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600">Access comprehensive customer management tools</p>
                <p className="text-sm text-gray-500 mt-2">
                  View, search, and manage all customer records from the Supabase database
                </p>
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => router.push('/admin/customers')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm hover:bg-blue-700"
                  >
                    Manage Customers
                  </button>
                  <a
                    href="/api/customer/data-operations?limit=5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-3 rounded-md text-sm hover:bg-green-700"
                  >
                    Test API Connection
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}