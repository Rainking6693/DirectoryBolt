import React, { useState, useEffect } from 'react';

interface QueueCustomer {
  id: string;
  businessName: string;
  email: string;
  packageType: string;
  directoryLimit: number;
  status: 'pending' | 'in-progress' | 'completed' | 'manual-review';
  progress: number;
  submittedDirectories: number;
  priority: number;
  purchaseDate: string;
  assignedStaff?: string;
  estimatedCompletion: string;
  lastActivity: string;
}

interface CustomerQueueProps {
  staffId?: string;
  showAssignedOnly?: boolean;
}

const CustomerQueue: React.FC<CustomerQueueProps> = ({ 
  staffId, 
  showAssignedOnly = false 
}) => {
  const [customers, setCustomers] = useState<QueueCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'manual-review'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'progress'>('priority');

  useEffect(() => {
    fetchQueueData();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [staffId, showAssignedOnly]);

  const fetchQueueData = async () => {
    try {
      const params = new URLSearchParams();
      if (staffId) params.append('staffId', staffId);
      if (showAssignedOnly) params.append('assignedOnly', 'true');
      
      const response = await fetch(`/api/staff/queue?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch queue data');
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCustomer = async (customerId: string, staffMember: string) => {
    try {
      const response = await fetch('/api/staff/assign-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, staffId: staffMember })
      });

      if (response.ok) {
        fetchQueueData(); // Refresh the queue
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
    }
  };

  const handleUpdateStatus = async (customerId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/staff/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, status: newStatus })
      });

      if (response.ok) {
        fetchQueueData(); // Refresh the queue
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'manual-review': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 150) return 'text-red-600 bg-red-100'; // Enterprise
    if (priority >= 100) return 'text-orange-600 bg-orange-100'; // Professional
    if (priority >= 50) return 'text-blue-600 bg-blue-100'; // Growth
    return 'text-gray-600 bg-gray-100'; // Starter
  };

  const filteredCustomers = customers.filter(customer => {
    if (filter === 'all') return true;
    return customer.status === filter;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return b.priority - a.priority;
      case 'date':
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      case 'progress':
        return a.progress - b.progress;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className=\"bg-white rounded-lg shadow p-6\">
        <div className=\"animate-pulse space-y-4\">
          <div className=\"h-4 bg-gray-200 rounded w-1/4\"></div>
          <div className=\"space-y-3\">
            {[...Array(5)].map((_, i) => (
              <div key={i} className=\"h-16 bg-gray-200 rounded\"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"bg-red-50 border border-red-200 rounded-lg p-6\">
        <div className=\"text-red-600\">
          ⚠️ Error loading queue: {error}
        </div>
      </div>
    );
  }

  return (
    <div className=\"bg-white rounded-lg shadow\">
      {/* Header */}
      <div className=\"px-6 py-4 border-b border-gray-200\">
        <div className=\"flex items-center justify-between\">
          <h2 className=\"text-xl font-semibold text-gray-900\">
            Customer Queue ({sortedCustomers.length})
          </h2>
          <div className=\"flex items-center space-x-4\">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className=\"border border-gray-300 rounded-md px-3 py-1 text-sm\"
            >
              <option value=\"all\">All Status</option>
              <option value=\"pending\">Pending</option>
              <option value=\"in-progress\">In Progress</option>
              <option value=\"manual-review\">Manual Review</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className=\"border border-gray-300 rounded-md px-3 py-1 text-sm\"
            >
              <option value=\"priority\">Priority</option>
              <option value=\"date\">Purchase Date</option>
              <option value=\"progress\">Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className=\"overflow-x-auto\">
        <table className=\"min-w-full divide-y divide-gray-200\">
          <thead className=\"bg-gray-50\">
            <tr>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Customer
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Package
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Priority
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Status
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Progress
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Assigned
              </th>
              <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className=\"bg-white divide-y divide-gray-200\">
            {sortedCustomers.map((customer) => (
              <tr key={customer.id} className=\"hover:bg-gray-50\">
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <div>
                    <div className=\"text-sm font-medium text-gray-900\">
                      {customer.businessName}
                    </div>
                    <div className=\"text-sm text-gray-500\">{customer.email}</div>
                    <div className=\"text-xs text-gray-400\">{customer.id}</div>
                  </div>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <div className=\"text-sm text-gray-900\">{customer.packageType}</div>
                  <div className=\"text-xs text-gray-500\">{customer.directoryLimit} directories</div>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(customer.priority)}`}>
                    {customer.priority}
                  </span>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <div className=\"flex items-center\">
                    <div className=\"w-16 bg-gray-200 rounded-full h-2 mr-2\">
                      <div 
                        className=\"bg-blue-600 h-2 rounded-full\"
                        style={{ width: `${customer.progress}%` }}
                      ></div>
                    </div>
                    <span className=\"text-sm text-gray-900\">{customer.progress}%</span>
                  </div>
                  <div className=\"text-xs text-gray-500\">
                    {customer.submittedDirectories}/{customer.directoryLimit}
                  </div>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap\">
                  <div className=\"text-sm text-gray-900\">
                    {customer.assignedStaff || 'Unassigned'}
                  </div>
                </td>
                <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2\">
                  <button
                    onClick={() => window.open(`/customer-portal?customerId=${customer.id}`, '_blank')}
                    className=\"text-blue-600 hover:text-blue-900\"
                  >
                    View
                  </button>
                  
                  {customer.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(customer.id, 'in-progress')}
                      className=\"text-green-600 hover:text-green-900\"
                    >
                      Start
                    </button>
                  )}
                  
                  {customer.status === 'in-progress' && (
                    <button
                      onClick={() => handleUpdateStatus(customer.id, 'manual-review')}
                      className=\"text-yellow-600 hover:text-yellow-900\"
                    >
                      Review
                    </button>
                  )}
                  
                  <select
                    onChange={(e) => handleAssignCustomer(customer.id, e.target.value)}
                    className=\"text-xs border border-gray-300 rounded px-2 py-1\"
                    defaultValue=\"\"
                  >
                    <option value=\"\">Assign...</option>
                    <option value=\"staff1\">John Doe</option>
                    <option value=\"staff2\">Jane Smith</option>
                    <option value=\"staff3\">Mike Johnson</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCustomers.length === 0 && (
        <div className=\"text-center py-12\">
          <div className=\"text-gray-500\">
            {filter === 'all' ? 'No customers in queue' : `No customers with status: ${filter}`}
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      <div className=\"px-6 py-3 bg-gray-50 border-t border-gray-200\">
        <div className=\"flex items-center justify-between text-xs text-gray-500\">
          <div className=\"flex items-center\">
            <div className=\"w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse\"></div>
            Live updates active
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerQueue;