import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  packageType: string;
  status: string;
  created: string;
}

export default function AdminCustomers() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
    loadCustomers(adminKey);
  };

  const loadCustomers = async (adminKey: string) => {
    try {
      // For now, we'll show a placeholder since the Google Sheets integration
      // would require the actual service account credentials
      const mockCustomers: Customer[] = [
        {
          customerId: 'DIR-20250916-000002',
          firstName: 'John',
          lastName: 'Doe',
          businessName: 'Doe Enterprises',
          email: 'john@doeenterprises.com',
          phone: '(555) 123-4567',
          website: 'https://doeenterprises.com',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          packageType: 'professional',
          status: 'active',
          created: '2025-01-08T10:00:00Z'
        },
        {
          customerId: 'DIR-20250916-000003',
          firstName: 'Jane',
          lastName: 'Smith',
          businessName: 'Smith Solutions',
          email: 'jane@smithsolutions.com',
          phone: '(555) 987-6543',
          website: 'https://smithsolutions.com',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90210',
          packageType: 'starter',
          status: 'active',
          created: '2025-01-08T11:30:00Z'
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPackage = filterPackage === 'all' || customer.packageType === filterPackage;
    
    return matchesSearch && matchesPackage;
  });

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

  const getPackageLimit = (packageType: string) => {
    const limits = {
      starter: 50,
      growth: 75,
      professional: 150,
      enterprise: 500
    };
    return limits[packageType as keyof typeof limits] || 50;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
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
        <title>Customer Management - DirectoryBolt Admin</title>
        <meta name="description" content="DirectoryBolt Customer Management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{customers.length} customers</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customers
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by ID, name, business, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="package-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Package
                </label>
                <select
                  id="package-filter"
                  value={filterPackage}
                  onChange={(e) => setFilterPackage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Packages</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Customers ({filteredCustomers.length})
              </h2>
            </div>
            
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No customers found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
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
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                            <div className="text-xs text-gray-400 font-mono">{customer.customerId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.businessName}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPackageColor(customer.packageType)}`}>
                            {customer.packageType}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {getPackageLimit(customer.packageType)} directories
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.created).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </button>
                          <a
                            href={`/api/extension/validate?customerId=${customer.customerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                          >
                            Test API
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                    <p><span className="font-medium">Customer ID:</span> <span className="font-mono">{selectedCustomer.customerId}</span></p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Business:</span> {selectedCustomer.businessName}</p>
                    <p><span className="font-medium">Website:</span> {selectedCustomer.website}</p>
                    <p><span className="font-medium">Address:</span> {selectedCustomer.address}</p>
                    <p><span className="font-medium">City:</span> {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zip}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Package Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Package:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPackageColor(selectedCustomer.packageType)}`}>
                        {selectedCustomer.packageType}
                      </span>
                    </p>
                    <p><span className="font-medium">Directory Limit:</span> {getPackageLimit(selectedCustomer.packageType)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedCustomer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCustomer.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedCustomer.created).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <a
                  href={`/api/extension/validate?customerId=${selectedCustomer.customerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                >
                  Test API Validation
                </a>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}