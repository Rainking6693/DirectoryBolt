import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface QueueItem {
  id: string;
  customerId: string;
  businessName: string;
  packageType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  created: string;
  assignedTo?: string;
  notes?: string;
  directoryCount?: number;
  completedDirectories?: number;
}

export default function StaffQueue() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

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
        setIsAuthenticated(true);
        loadQueueData();
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

  const loadQueueData = async () => {
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
          // Map Supabase queue data to queue management format
          const queueItems: QueueItem[] = data.data.items.map((item: any) => ({
            id: item.recordId || `queue-${Date.now()}-${Math.random()}`,
            customerId: item.customerId,
            businessName: item.businessName || 'Unknown Business',
            packageType: item.packageType || 'starter',
            status: mapQueueStatus(item.submissionStatus) as 'pending' | 'processing' | 'completed' | 'failed',
            priority: mapPriority(item.priority) as 'low' | 'medium' | 'high',
            created: item.createdAt || new Date().toISOString(),
            assignedTo: item.assignedTo,
            directoryCount: item.directoryLimit || getDirectoryLimit(item.packageType),
            completedDirectories: item.processedDirectories || 0,
            notes: item.notes || generateStatusNote(item.submissionStatus)
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
      console.error('Failed to load queue data:', error);
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

  // Helper function to get directory limits by package
  const getDirectoryLimit = (packageType: string): number => {
    const limits: { [key: string]: number } = {
      'starter': 50,
      'growth': 100,
      'professional': 200,
      'pro': 200,
      'enterprise': 500
    };
    return limits[packageType] || 50;
  };

  // Helper function to generate status-based notes
  const generateStatusNote = (status: string): string => {
    const notes: { [key: string]: string } = {
      'pending': 'Awaiting processing',
      'in-progress': 'Currently being processed',
      'completed': 'Successfully completed',
      'failed': 'Processing failed - requires attention'
    };
    return notes[status] || 'No additional notes';
  };

  const filteredItems = queueItems.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-volt-100 text-volt-800';
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
        return 'bg-volt-100 text-volt-800';
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

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setQueueItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, status: newStatus as any, assignedTo: newStatus === 'processing' ? 'staff' : item.assignedTo }
          : item
      )
    );
  };

  const getProgressPercentage = (item: QueueItem) => {
    if (!item.directoryCount || item.directoryCount === 0) return 0;
    return Math.round((item.completedDirectories || 0) / item.directoryCount * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading queue...</p>
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
        <title>Processing Queue - DirectoryBolt Staff</title>
        <meta name="description" content="DirectoryBolt Processing Queue Management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/staff')}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Processing Queue</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{filteredItems.length} items</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Priority
                </label>
                <select
                  id="priority-filter"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Queue Items */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Queue Items ({filteredItems.length})
              </h2>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No items found matching your criteria.</p>
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
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
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
                    {filteredItems.map((item) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${getProgressPercentage(item)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.completedDirectories || 0}/{item.directoryCount || 0} directories
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {item.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(item.id, 'processing')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Start
                              </button>
                            )}
                            {item.status === 'processing' && (
                              <button
                                onClick={() => handleStatusChange(item.id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Queue Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Business:</span> {selectedItem.businessName}</p>
                    <p><span className="font-medium">Customer ID:</span> <span className="font-mono">{selectedItem.customerId}</span></p>
                    <p><span className="font-medium">Package:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPackageColor(selectedItem.packageType)}`}>
                        {selectedItem.packageType}
                      </span>
                    </p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedItem.created).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Processing Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedItem.priority)}`}>
                        {selectedItem.priority}
                      </span>
                    </p>
                    <p><span className="font-medium">Assigned To:</span> {selectedItem.assignedTo || 'Unassigned'}</p>
                    <p><span className="font-medium">Progress:</span> {selectedItem.completedDirectories || 0}/{selectedItem.directoryCount || 0} directories ({getProgressPercentage(selectedItem)}%)</p>
                  </div>
                </div>
              </div>
              
              {selectedItem.notes && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{selectedItem.notes}</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <a
                  href={`/api/extension/validate?customerId=${selectedItem.customerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                >
                  Test Customer API
                </a>
                <button
                  onClick={() => setSelectedItem(null)}
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