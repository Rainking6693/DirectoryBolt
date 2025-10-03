// Real-Time Customer Queue Component for Staff Dashboard
// Displays live customer processing data from Supabase

import React, { useState, useEffect } from "react";
import {
  useNotifications,
  useApiNotifications,
} from "../ui/NotificationSystem";

interface CustomerQueueData {
  id: string;
  customer_id: string;
  business_name: string;
  email: string;
  package_type: string;
  status: string;
  priority_level: number;
  directories_allocated: number;
  directories_submitted: number;
  directories_failed: number;
  progress_percentage: number;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
  recent_activity: Array<{
    id: string;
    action: string;
    directories_processed: number;
    directories_failed: number;
    timestamp: string;
  }>;
  current_submissions: Array<{
    id: string;
    directory_name: string;
    submission_status: string;
    created_at: string;
  }>;
}

interface QueueData {
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
    completedToday: number;
  };
  queue: CustomerQueueData[];
  alerts: Array<{
    type: "warning" | "error" | "info";
    title: string;
    message: string;
    customer_id: string;
    priority: "high" | "medium" | "low";
  }>;
  recent_activity: Array<{
    id: string;
    customer_id: string;
    action: string;
    directories_processed: number;
    directories_failed: number;
    timestamp: string;
  }>;
  processing_summary: {
    total_directories_allocated: number;
    total_directories_submitted: number;
    total_directories_failed: number;
    overall_completion_rate: number;
  };
}

export default function RealTimeQueue(): JSX.Element {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerQueueData | null>(null);
  const [pushingCustomers, setPushingCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'package_size' | 'priority'>('priority');
  const { showSuccess, showError, showInfo } = useNotifications();
  const { notifyApiProgress, notifyApiSuccess, notifyApiError } =
    useApiNotifications();

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      // Get stored staff auth from localStorage
      const storedAuth = localStorage.getItem("staffAuth");

      if (!storedAuth) {
        throw new Error("Staff authentication required");
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${storedAuth}`,
        Origin: window.location.origin,
      };

      const response = await fetch("/api/staff/queue", {
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch queue data");
      }

      const result = await response.json();
      if (result.success) {
        setQueueData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(result.message || "Failed to load queue data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pushToAutoBolt = async (customerId: string) => {
    // Prevent multiple simultaneous pushes for the same customer
    if (pushingCustomers.has(customerId)) {
      showInfo("Customer is already being pushed to AutoBolt", {
        title: "Already in Progress",
        autoHide: 3000,
      });
      return;
    }

    try {
      // Mark customer as being pushed
      setPushingCustomers((prev) => new Set(prev).add(customerId));

      // Show progress notification
      const progressId = showInfo("Initiating AutoBolt processing...", {
        title: "Pushing to AutoBolt",
        autoHide: 2000,
      });

      const storedAuth = localStorage.getItem("staffAuth");

      if (!storedAuth) {
        throw new Error("Staff authentication required");
      }

      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token");
      const csrfData = await csrfResponse.json();

      if (!csrfData.success) {
        throw new Error("Failed to get CSRF token");
      }

      // Show validation progress
      showInfo("Validating customer data and preparing for AutoBolt...", {
        title: "Processing",
        autoHide: 1500,
      });

      const response = await fetch("/api/staff/push-to-autobolt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuth}`,
          "X-CSRF-Token": csrfData.csrfToken,
          Origin: window.location.origin,
        },
        body: JSON.stringify({ customer_id: customerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to push to AutoBolt");
      }

      const result = await response.json();
      console.log("✅ Customer pushed to AutoBolt:", result);

      // Show success with detailed information
      notifyApiSuccess("Customer pushed to AutoBolt", [
        `Customer ID: ${customerId}`,
        `Business: ${result.data?.business_name || "Unknown"}`,
        `Package: ${result.data?.package_type || "Unknown"}`,
        `Directories: ${result.data?.directory_limit || "Unknown"}`,
        `Priority: P${result.data?.priority_level || "Unknown"}`,
        `Status: ${result.data?.status || "queued"}`,
      ]);

      // Refresh queue data to show updated status
      await fetchQueueData();
    } catch (err) {
      console.error("Push to AutoBolt error:", err);
      notifyApiError(
        "Push to AutoBolt",
        err instanceof Error ? err.message : "Unknown error occurred",
      );
    } finally {
      // Remove customer from pushing set
      setPushingCustomers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-volt-400 bg-volt-400/20";
      case "in-progress":
        return "text-blue-400 bg-blue-400/20";
      case "completed":
        return "text-green-400 bg-green-400/20";
      case "failed":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-secondary-400 bg-secondary-400/20";
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "text-red-400 bg-red-400/20";
      case 2:
        return "text-orange-400 bg-orange-400/20";
      case 3:
        return "text-volt-400 bg-volt-400/20";
      default:
        return "text-secondary-400 bg-secondary-400/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 font-medium">Failed to load queue data</p>
        <p className="text-red-300 text-sm mt-2">{error}</p>
        <button
          onClick={fetchQueueData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="text-center text-secondary-400">
        No queue data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Customer Queue</h2>
        <div className="flex items-center space-x-2 text-secondary-300">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Live"}
          </span>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-volt-400/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-volt-400">
            {queueData.stats.pending}
          </p>
          <p className="text-secondary-400 text-sm">Pending</p>
        </button>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-blue-400/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-blue-400">
            {queueData.stats.processing}
          </p>
          <p className="text-secondary-400 text-sm">Processing</p>
        </button>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-green-400/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-green-400">
            {queueData.stats.completed}
          </p>
          <p className="text-secondary-400 text-sm">Completed</p>
        </button>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-red-400/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-red-400">
            {queueData.stats.failed}
          </p>
          <p className="text-secondary-400 text-sm">Failed</p>
        </button>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-white/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-white">
            {queueData.stats.total}
          </p>
          <p className="text-secondary-400 text-sm">Total</p>
        </button>
        <button
          onClick={() => setSelectedCustomer(null)}
          className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 text-center hover:bg-secondary-700 hover:border-volt-400/50 transition-all cursor-pointer"
        >
          <p className="text-2xl font-bold text-volt-400">
            {queueData.stats.completedToday}
          </p>
          <p className="text-secondary-400 text-sm">Today</p>
        </button>
      </div>

      {/* Alerts */}
      {queueData.alerts.length > 0 && (
        <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
          <h3 className="text-xl font-bold text-white mb-4">⚠️ Alerts</h3>
          <div className="space-y-3">
            {queueData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.type === "error"
                    ? "bg-red-500/10 border-red-500/20"
                    : alert.type === "warning"
                      ? "bg-volt-500/10 border-volt-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{alert.title}</p>
                    <p className="text-secondary-300 text-sm">
                      {alert.message}
                    </p>
                    <p className="text-secondary-400 text-xs mt-1">
                      Customer: {alert.customer_id}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.priority === "high"
                        ? "bg-red-500/20 text-red-400"
                        : alert.priority === "medium"
                          ? "bg-volt-500/20 text-volt-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Queue */}
      <div className="bg-secondary-800 rounded-xl border border-secondary-700">
        <div className="p-6 border-b border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Customer Processing Queue
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-secondary-300">P1 (Enterprise/Pro)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-secondary-300">P2 (Professional)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-volt-500"></span>
                <span className="text-secondary-300">P3 (Growth)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-secondary-300">P4 (Starter)</span>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by customer ID, business name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-secondary-900 border border-secondary-600 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-volt-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-secondary-900 border border-secondary-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-volt-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created_at' | 'package_size' | 'priority')}
              className="px-4 py-2 bg-secondary-900 border border-secondary-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-volt-500 focus:border-transparent"
            >
              <option value="priority">Sort by Priority</option>
              <option value="created_at">Sort by Newest</option>
              <option value="package_size">Sort by Package Size</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || statusFilter !== 'all' || sortBy !== 'priority') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSortBy('priority');
                }}
                className="px-4 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-secondary-300 hover:bg-secondary-600 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-secondary-400">
              Click on any customer row to view detailed information
            </p>
            <p className="text-secondary-300">
              Showing {queueData.queue
                .filter((customer) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    customer.customer_id.toLowerCase().includes(query) ||
                    customer.business_name.toLowerCase().includes(query) ||
                    customer.email.toLowerCase().includes(query)
                  );
                })
                .filter((customer) => {
                  if (statusFilter === 'all') return true;
                  return customer.status === statusFilter;
                }).length} of {queueData.queue.length} customers
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-700">
              {queueData.queue
                // Apply search filter
                .filter((customer) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    customer.customer_id.toLowerCase().includes(query) ||
                    customer.business_name.toLowerCase().includes(query) ||
                    customer.email.toLowerCase().includes(query)
                  );
                })
                // Apply status filter
                .filter((customer) => {
                  if (statusFilter === 'all') return true;
                  return customer.status === statusFilter;
                })
                // Apply sorting
                .sort((a, b) => {
                  if (sortBy === 'priority') {
                    return a.priority_level - b.priority_level; // Lower priority number = higher priority
                  } else if (sortBy === 'created_at') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first
                  } else if (sortBy === 'package_size') {
                    return b.directories_allocated - a.directories_allocated; // Largest first
                  }
                  return 0;
                })
                .map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-secondary-700/50 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/customers/${encodeURIComponent(customer.customer_id)}`
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {customer.business_name}
                      </div>
                      <div className="text-sm text-secondary-400">
                        {customer.email}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {customer.customer_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-volt-500/20 text-volt-400 rounded-full">
                      {customer.package_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(customer.priority_level)}`}
                    >
                      P{customer.priority_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-secondary-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-volt-500 h-2 rounded-full"
                          style={{ width: `${customer.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-secondary-300">
                        {customer.directories_submitted}/
                        {customer.directories_allocated}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                    {customer.estimated_completion
                      ? new Date(customer.estimated_completion).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <a
                        href={`/customers/${encodeURIComponent(customer.customer_id)}`}
                        className="text-volt-400 hover:text-volt-300"
                      >
                        View Details
                      </a>
                      {(customer.status === "pending" ||
                        customer.status === "active") &&
                        customer.directories_submitted === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pushToAutoBolt(customer.customer_id);
                            }}
                            disabled={pushingCustomers.has(
                              customer.customer_id,
                            )}
                            className={`${
                              pushingCustomers.has(customer.customer_id)
                                ? "text-gray-400 bg-gray-500/10 cursor-not-allowed"
                                : "text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20"
                            } px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1`}
                          >
                            {pushingCustomers.has(customer.customer_id) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                <span>Pushing...</span>
                              </>
                            ) : (
                              <>
                                <span>Push to AutoBolt</span>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  />
                                </svg>
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing Summary */}
      <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Processing Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-secondary-400 text-sm">Total Allocated</p>
            <p className="text-2xl font-bold text-white">
              {queueData.processing_summary.total_directories_allocated.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Total Submitted</p>
            <p className="text-2xl font-bold text-green-400">
              {queueData.processing_summary.total_directories_submitted.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Total Failed</p>
            <p className="text-2xl font-bold text-red-400">
              {queueData.processing_summary.total_directories_failed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-secondary-400 text-sm">Overall Completion</p>
            <p className="text-2xl font-bold text-volt-400">
              {queueData.processing_summary.overall_completion_rate}%
            </p>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary-800 rounded-xl p-6 border border-secondary-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-secondary-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">
                  Business Information
                </h4>
                <p className="text-secondary-300">
                  {selectedCustomer.business_name}
                </p>
                <p className="text-secondary-400 text-sm">
                  {selectedCustomer.email}
                </p>
                <p className="text-secondary-500 text-xs">
                  {selectedCustomer.customer_id}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">
                  Processing Status
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-secondary-400 text-sm">Package</p>
                    <p className="text-white">
                      {selectedCustomer.package_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCustomer.status)}`}
                    >
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Progress</p>
                    <p className="text-white">
                      {selectedCustomer.directories_submitted}/
                      {selectedCustomer.directories_allocated}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary-400 text-sm">Failed</p>
                    <p className="text-red-400">
                      {selectedCustomer.directories_failed}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.current_submissions.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">
                    Current Submissions
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.current_submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-2 bg-secondary-700 rounded"
                      >
                        <span className="text-white text-sm">
                          {submission.directory_name}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${getStatusColor(submission.submission_status)}`}
                        >
                          {submission.submission_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
