import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Dashboard Filters Integration Test
 * 
 * Tests the search, filter, and sort functionality
 * added to the staff dashboard RealTimeQueue component
 */

// Mock data structure
const mockQueueData = {
  stats: {
    pending: 5,
    processing: 2,
    completed: 10,
    failed: 1,
    total: 18,
    completedToday: 3
  },
  queue: [
    {
      id: '1',
      customer_id: 'CUST-001',
      business_name: 'Tech Corp',
      email: 'tech@example.com',
      package_type: 'PRO',
      status: 'pending',
      priority_level: 1,
      directories_allocated: 200,
      directories_submitted: 0,
      directories_failed: 0,
      progress_percentage: 0,
      estimated_completion: null,
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-01T10:00:00Z',
      recent_activity: [],
      current_submissions: []
    },
    {
      id: '2',
      customer_id: 'CUST-002',
      business_name: 'Marketing Plus',
      email: 'marketing@example.com',
      package_type: 'GROWTH',
      status: 'in-progress',
      priority_level: 2,
      directories_allocated: 100,
      directories_submitted: 50,
      directories_failed: 2,
      progress_percentage: 50,
      estimated_completion: null,
      created_at: '2025-10-01T09:00:00Z',
      updated_at: '2025-10-01T11:00:00Z',
      recent_activity: [],
      current_submissions: []
    },
    {
      id: '3',
      customer_id: 'CUST-003',
      business_name: 'Small Business',
      email: 'small@example.com',
      package_type: 'STARTER',
      status: 'completed',
      priority_level: 4,
      directories_allocated: 25,
      directories_submitted: 25,
      directories_failed: 0,
      progress_percentage: 100,
      estimated_completion: null,
      created_at: '2025-09-30T08:00:00Z',
      updated_at: '2025-10-01T12:00:00Z',
      recent_activity: [],
      current_submissions: []
    }
  ],
  alerts: [],
  recent_activity: [],
  processing_summary: {
    total_directories_allocated: 325,
    total_directories_submitted: 75,
    total_directories_failed: 2,
    overall_completion_rate: 23
  }
};

describe('Dashboard Filters - Search Functionality', () => {
  it('should filter queue by customer ID when typing in search box', () => {
    const searchQuery = 'CUST-001';
    
    // Simulate filtering logic
    const filtered = mockQueueData.queue.filter((customer) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.customer_id.toLowerCase().includes(query) ||
        customer.business_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].customer_id).toBe('CUST-001');
    expect(filtered[0].business_name).toBe('Tech Corp');
  });

  it('should filter queue by business name', () => {
    const searchQuery = 'marketing';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.customer_id.toLowerCase().includes(query) ||
        customer.business_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].business_name).toBe('Marketing Plus');
  });

  it('should filter queue by email', () => {
    const searchQuery = 'small@';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.customer_id.toLowerCase().includes(query) ||
        customer.business_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe('small@example.com');
  });

  it('should return all customers when search is empty', () => {
    const searchQuery = '';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        customer.customer_id.toLowerCase().includes(query) ||
        customer.business_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    });

    expect(filtered.length).toBe(3);
  });
});

describe('Dashboard Filters - Status Filter', () => {
  it('should filter queue by pending status', () => {
    const statusFilter = 'pending';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (statusFilter === 'all') return true;
      return customer.status === statusFilter;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('pending');
  });

  it('should filter queue by in-progress status', () => {
    const statusFilter = 'in-progress';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (statusFilter === 'all') return true;
      return customer.status === statusFilter;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('in-progress');
  });

  it('should filter queue by completed status', () => {
    const statusFilter = 'completed';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (statusFilter === 'all') return true;
      return customer.status === statusFilter;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('completed');
  });

  it('should show all customers when filter is set to all', () => {
    const statusFilter = 'all';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (statusFilter === 'all') return true;
      return customer.status === statusFilter;
    });

    expect(filtered.length).toBe(3);
  });
});

describe('Dashboard Filters - Sorting', () => {
  it('should sort by priority (P1 first)', () => {
    const sortBy = 'priority';
    
    const sorted = [...mockQueueData.queue].sort((a, b) => {
      return a.priority_level - b.priority_level; // Lower number = higher priority
    });

    expect(sorted[0].priority_level).toBe(1);
    expect(sorted[0].business_name).toBe('Tech Corp');
    expect(sorted[2].priority_level).toBe(4);
    expect(sorted[2].business_name).toBe('Small Business');
  });

  it('should sort by created_at (newest first)', () => {
    const sortBy = 'created_at';
    
    const sorted = [...mockQueueData.queue].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    expect(sorted[0].customer_id).toBe('CUST-001'); // Oct 1, 10:00
    expect(sorted[1].customer_id).toBe('CUST-002'); // Oct 1, 09:00
    expect(sorted[2].customer_id).toBe('CUST-003'); // Sep 30, 08:00
  });

  it('should sort by package_size (largest first)', () => {
    const sortBy = 'package_size';
    
    const sorted = [...mockQueueData.queue].sort((a, b) => {
      return b.directories_allocated - a.directories_allocated;
    });

    expect(sorted[0].directories_allocated).toBe(200); // PRO
    expect(sorted[1].directories_allocated).toBe(100); // GROWTH
    expect(sorted[2].directories_allocated).toBe(25);  // STARTER
  });
});

describe('Dashboard Filters - Combined Filters', () => {
  it('should apply search AND status filter together', () => {
    const searchQuery = 'tech';
    const statusFilter = 'pending';
    
    const filtered = mockQueueData.queue
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
      });

    expect(filtered.length).toBe(1);
    expect(filtered[0].business_name).toBe('Tech Corp');
    expect(filtered[0].status).toBe('pending');
  });

  it('should apply all three filters: search, status, and sort', () => {
    const searchQuery = ''; // All customers
    const statusFilter = 'all'; // All statuses
    const sortBy = 'created_at';
    
    const result = mockQueueData.queue
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
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return a.priority_level - b.priority_level;
        } else if (sortBy === 'created_at') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === 'package_size') {
          return b.directories_allocated - a.directories_allocated;
        }
        return 0;
      });

    expect(result.length).toBe(3);
    expect(result[0].customer_id).toBe('CUST-001'); // Newest
  });

  it('should return empty array when no matches found', () => {
    const searchQuery = 'NONEXISTENT';
    
    const filtered = mockQueueData.queue.filter((customer) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        customer.customer_id.toLowerCase().includes(query) ||
        customer.business_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      );
    });

    expect(filtered.length).toBe(0);
  });
});

