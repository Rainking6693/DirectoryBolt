'use client';

/**
 * Jobs/Submissions Monitoring Page
 * Table with expandable rows, filters, and real-time updates
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
} from '@tanstack/react-table';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Job {
  id: string;
  customer_id: string;
  business_name: string;
  email: string;
  package_type: string;
  package_size: number;
  directory_limit: number;
  status: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

interface DirectorySubmission {
  id: string;
  job_id: string;
  directory_name: string;
  directory_url: string;
  status: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, DirectorySubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  /**
   * Fetch submissions for a job
   */
  const fetchSubmissions = async (jobId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('directory_submissions')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSubmissions((prev) => ({
        ...prev,
        [jobId]: data || [],
      }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  /**
   * Define table columns
   */
  const columns: ColumnDef<Job>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={() => {
            row.toggleExpanded();
            if (!row.getIsExpanded() && !submissions[row.original.id]) {
              fetchSubmissions(row.original.id);
            }
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.getIsExpanded() ? '▼' : '▶'}
        </button>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Job ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue('id').substring(0, 8)}...</span>
      ),
    },
    {
      accessorKey: 'business_name',
      header: 'Business',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('business_name')}</div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'package_type',
      header: 'Package',
      cell: ({ row }) => {
        const packageType = row.getValue('package_type') as string;
        const packageColors = {
          starter: 'bg-blue-100 text-blue-800',
          growth: 'bg-green-100 text-green-800',
          professional: 'bg-purple-100 text-purple-800',
          enterprise: 'bg-orange-100 text-orange-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              packageColors[packageType as keyof typeof packageColors] || packageColors.starter
            }`}
          >
            {packageType}
          </span>
        );
      },
    },
    {
      accessorKey: 'directory_limit',
      header: 'Directories',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('directory_limit')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800',
          in_progress: 'bg-blue-100 text-blue-800',
          completed: 'bg-green-100 text-green-800',
          failed: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[status as keyof typeof statusColors] || statusColors.pending
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{new Date(row.getValue('created_at')).toLocaleDateString()}</div>
          <div className="text-gray-500">
            {new Date(row.getValue('created_at')).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleRetryJob(row.original.id)}
            disabled={row.original.status === 'in_progress'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retry
          </button>
          <button
            onClick={() => handleCancelJob(row.original.id)}
            disabled={row.original.status === 'completed'}
            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  /**
   * Initialize table
   */
  const table = useReactTable<Job>({
    data: jobs,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  /**
   * Fetch jobs
   */
  const fetchJobs = async () => {
    try {
      setError(null);
      let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setJobs(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setLoading(false);
    }
  };

  /**
   * Retry a job
   */
  const handleRetryJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to retry this job?')) {
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'pending', error_message: null })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Reset submissions to pending
      const { error: submissionError } = await supabase
        .from('directory_submissions')
        .update({ status: 'pending', error_message: null, retry_count: 0 })
        .eq('job_id', jobId);

      if (submissionError) throw submissionError;

      alert('Job queued for retry');
      fetchJobs();
    } catch (err) {
      console.error('Error retrying job:', err);
      alert('Failed to retry job');
    }
  };

  /**
   * Cancel a job
   */
  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Cancelled by admin' })
        .eq('id', jobId);

      if (error) throw error;

      alert('Job cancelled');
      fetchJobs();
    } catch (err) {
      console.error('Error cancelling job:', err);
      alert('Failed to cancel job');
    }
  };

  /**
   * Load jobs on mount
   */
  useEffect(() => {
    fetchJobs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Jobs & Submissions</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        <span>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getIsSorted() && (
                          <span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <>
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 bg-gray-50">
                        <SubmissionsTable
                          submissions={submissions[row.original.id] || []}
                          loading={!submissions[row.original.id]}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Submissions Table Component
 */
interface SubmissionsTableProps {
  submissions: DirectorySubmission[];
  loading: boolean;
}

function SubmissionsTable({ submissions, loading }: SubmissionsTableProps) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">No submissions found for this job</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Directory
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              URL
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Retries
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm">{submission.directory_name}</td>
              <td className="px-4 py-2 text-sm">
                <a
                  href={submission.directory_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {submission.directory_url}
                </a>
              </td>
              <td className="px-4 py-2 text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'submitted'
                      ? 'bg-green-100 text-green-800'
                      : submission.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : submission.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {submission.status}
                </span>
              </td>
              <td className="px-4 py-2 text-sm">{submission.retry_count || 0}</td>
              <td className="px-4 py-2 text-sm">
                {new Date(submission.updated_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
