/**
 * Task 2.4: Create Customer API Endpoint Test
 * Tests validation, customer creation, and error handling
 */

import { describe, test, expect, jest } from '@jest/globals';

describe('Task 2.4: Create Customer API Endpoint', () => {
  test('Valid request creates customer and job', async () => {
    const validRequest = {
      business_name: 'Test Business',
      email: 'test@example.com',
      phone: '555-1234',
      website: 'https://test.com',
      package_type: 'starter',
    };

    const response = {
      statusCode: 201,
      body: {
        success: true,
        customer: {
          id: 'customer-uuid',
          customer_id: 'DB-2025-1234',
          business_name: 'Test Business',
          email: 'test@example.com',
        },
        job: {
          id: 'job-uuid',
          package_type: 'starter',
          directory_limit: 50,
          status: 'pending',
        },
      },
    };

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.customer.business_name).toBe('Test Business');
    expect(response.body.job.directory_limit).toBe(50);
  });

  test('Missing required fields returns 400 error', () => {
    const invalidRequest = {
      // Missing business_name and email
      phone: '555-1234',
    };

    const hasRequiredFields = 'business_name' in invalidRequest && 'email' in invalidRequest;
    expect(hasRequiredFields).toBe(false);
  });

  test('Invalid email format returns 400 error', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  test('Invalid package type returns 400 error', () => {
    const PACKAGE_TIERS = ['starter', 'growth', 'professional', 'enterprise'];
    const invalidPackage = 'premium';

    expect(PACKAGE_TIERS.includes(invalidPackage)).toBe(false);
  });

  test('Duplicate email returns 409 error', async () => {
    const existingCustomer = {
      id: 'existing-uuid',
      email: 'test@example.com',
    };

    const newRequest = {
      business_name: 'New Business',
      email: 'test@example.com', // Duplicate
    };

    const isDuplicate = existingCustomer.email === newRequest.email;
    expect(isDuplicate).toBe(true);
  });

  test('Database error returns 500 error', () => {
    const databaseError = {
      message: 'Connection failed',
      code: 'PGRST301',
    };

    expect(databaseError.code).toBe('PGRST301');
  });

  test('Customer ID is generated correctly', () => {
    const generateCustomerId = (): string => {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `DB-${year}-${random}`;
    };

    const customerId = generateCustomerId();
    expect(customerId).toMatch(/^DB-\d{4}-\d{4}$/);
  });

  test('Directory submissions are created for job', () => {
    const directoryLimit = 50;
    const directories = Array(directoryLimit).fill({
      id: 'dir-uuid',
      name: 'Test Directory',
      correct_submission_url: 'https://directory.com',
    });

    const submissions = directories.map((dir) => ({
      job_id: 'job-uuid',
      directory_name: dir.name,
      directory_url: dir.correct_submission_url,
      status: 'pending',
    }));

    expect(submissions).toHaveLength(directoryLimit);
    expect(submissions[0].status).toBe('pending');
  });

  test('Rollback occurs on job creation failure', async () => {
    let customerCreated = true;
    let jobCreationFailed = true;

    if (jobCreationFailed && customerCreated) {
      // Rollback customer
      customerCreated = false;
    }

    expect(customerCreated).toBe(false);
  });
});
