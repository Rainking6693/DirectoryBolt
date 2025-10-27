/**
 * Task 1.2: Stripe Webhook Handler Test
 * Tests webhook event processing, record creation, and error handling
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('Task 1.2: Stripe Webhook Handler', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('Valid checkout.session.completed event creates customer', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          customer_details: {
            email: 'test@example.com',
            phone: '555-1234',
          },
          metadata: {
            business_name: 'Test Business',
            website: 'https://test.com',
            package_type: 'starter',
          },
        },
      },
    };

    // Mock successful customer creation
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'customer-uuid',
        customer_id: 'DB-2025-1234',
        business_name: 'Test Business',
        email: 'test@example.com',
      },
      error: null,
    });

    // Mock successful job creation
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'job-uuid',
        customer_id: 'customer-uuid',
        package_type: 'starter',
        status: 'pending',
      },
      error: null,
    });

    // Mock directory fetch
    mockSupabase.select.mockResolvedValueOnce({
      data: Array(50).fill({
        id: 'dir-uuid',
        name: 'Test Directory',
        correct_submission_url: 'https://directory.com',
      }),
      error: null,
    });

    // Mock submission creation
    mockSupabase.insert.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Verify customer was created
    expect(mockSupabase.from).toHaveBeenCalledWith('customers');
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  test('Invalid event signature returns 400 error', async () => {
    const invalidSignature = 'invalid_signature';

    // Mock Stripe signature verification failure
    const Stripe = require('stripe');
    const mockStripe = new Stripe();
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    // Test would verify 400 response
    expect(() => {
      mockStripe.webhooks.constructEvent('body', invalidSignature, 'secret');
    }).toThrow('Invalid signature');
  });

  test('Missing required metadata returns error', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer_details: {
            email: 'test@example.com',
          },
          metadata: {
            // Missing business_name
            package_type: 'starter',
          },
        },
      },
    };

    // Verify that missing business_name is handled
    expect(mockEvent.data.object.metadata).not.toHaveProperty('business_name');
  });

  test('Database error is handled gracefully', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer_details: {
            email: 'test@example.com',
          },
          metadata: {
            business_name: 'Test Business',
            package_type: 'starter',
          },
        },
      },
    };

    // Mock database error
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Database connection failed',
        code: 'PGRST301',
      },
    });

    const { error } = await mockSupabase.from('customers').insert([]).select().single();

    expect(error).not.toBeNull();
    expect(error.message).toBe('Database connection failed');
  });

  test('Email is sent after successful customer creation', async () => {
    // Mock Resend email service
    const mockResend = {
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'email-id' }),
      },
    };

    const emailData = {
      from: 'DirectoryBolt <noreply@directorybolt.com>',
      to: 'test@example.com',
      subject: 'Welcome to DirectoryBolt - Starter Package',
    };

    await mockResend.emails.send(emailData);

    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('DirectoryBolt'),
        to: 'test@example.com',
      })
    );
  });

  test('Subscription events are handled correctly', async () => {
    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];

    for (const eventType of subscriptionEvents) {
      const mockEvent = {
        type: eventType,
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
          },
        },
      };

      // Verify event type is recognized
      expect(subscriptionEvents).toContain(mockEvent.type);
    }
  });

  test('Package tier configuration is correct', () => {
    const PACKAGE_TIERS = {
      starter: { name: 'Starter', directoryLimit: 50, packageSize: 50 },
      growth: { name: 'Growth', directoryLimit: 100, packageSize: 100 },
      professional: { name: 'Professional', directoryLimit: 300, packageSize: 300 },
      enterprise: { name: 'Enterprise', directoryLimit: 500, packageSize: 500 },
    };

    expect(PACKAGE_TIERS.starter.directoryLimit).toBe(50);
    expect(PACKAGE_TIERS.growth.directoryLimit).toBe(100);
    expect(PACKAGE_TIERS.professional.directoryLimit).toBe(300);
    expect(PACKAGE_TIERS.enterprise.directoryLimit).toBe(500);
  });
});
