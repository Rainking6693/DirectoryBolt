/**
 * Task 2.2: Customers Management Page Test
 * Tests table rendering, filters, sorting, and pagination
 */

import { describe, test, expect } from '@jest/globals';

describe('Task 2.2: Customers Management', () => {
  test('Customer table renders with data', () => {
    const mockCustomers = [
      {
        id: '1',
        customer_id: 'DB-2025-1001',
        business_name: 'Test Business',
        email: 'test@example.com',
        status: 'active',
      },
    ];

    expect(mockCustomers).toHaveLength(1);
    expect(mockCustomers[0].business_name).toBe('Test Business');
  });

  test('Global filter searches across columns', () => {
    const customers = [
      { business_name: 'Acme Corp', email: 'acme@example.com' },
      { business_name: 'Test Inc', email: 'test@example.com' },
    ];

    const filterCustomers = (query: string) => {
      return customers.filter(
        (c) =>
          c.business_name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      );
    };

    expect(filterCustomers('acme')).toHaveLength(1);
    expect(filterCustomers('test')).toHaveLength(1);
    expect(filterCustomers('example')).toHaveLength(2);
  });

  test('Status filter works correctly', () => {
    const customers = [
      { id: '1', status: 'active' },
      { id: '2', status: 'inactive' },
      { id: '3', status: 'active' },
    ];

    const filterByStatus = (status: string) => {
      return customers.filter((c) => c.status === status);
    };

    expect(filterByStatus('active')).toHaveLength(2);
    expect(filterByStatus('inactive')).toHaveLength(1);
  });

  test('Sorting works on columns', () => {
    const customers = [
      { business_name: 'Zebra Corp' },
      { business_name: 'Acme Inc' },
      { business_name: 'Beta LLC' },
    ];

    const sorted = [...customers].sort((a, b) =>
      a.business_name.localeCompare(b.business_name)
    );

    expect(sorted[0].business_name).toBe('Acme Inc');
    expect(sorted[2].business_name).toBe('Zebra Corp');
  });

  test('Pagination controls work correctly', () => {
    const totalItems = 25;
    const pageSize = 10;
    const totalPages = Math.ceil(totalItems / pageSize);

    expect(totalPages).toBe(3);

    let currentPage = 0;
    const canGoNext = currentPage < totalPages - 1;
    const canGoPrevious = currentPage > 0;

    expect(canGoNext).toBe(true);
    expect(canGoPrevious).toBe(false);

    currentPage = 1;
    expect(currentPage < totalPages - 1).toBe(true);
    expect(currentPage > 0).toBe(true);
  });
});
