import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
} from '../../../lib/auth/constants';
import {
  getTestCustomerStore,
  upsertTestCustomer,
} from '../../../lib/testData/customers';

interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  packageType?: string;
  directoryLimit?: number;
}

interface CreateCustomerResponse {
  success: boolean;
  customer?: any;
  customerId?: string;
  error?: string;
  message?: string;
  notes?: string[];
}

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const supabase = hasSupabaseConfig
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    )
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCustomerResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const staffSession = req.cookies[STAFF_SESSION_COOKIE];
    const adminSession = req.cookies[ADMIN_SESSION_COOKIE];

    if (staffSession !== STAFF_SESSION_VALUE && adminSession !== ADMIN_SESSION_VALUE) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Valid staff or admin session required',
      });
    }

    const data: CreateCustomerRequest = req.body;

    if (!data?.firstName || !data?.lastName || !data?.businessName || !data?.email) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'First name, last name, business name, and email are required',
      });
    }

    if (supabase) {
      const { data: customerData, error } = await supabase
        .from('customers')
        .insert({
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          packageType: data.packageType || 'STARTER',
          directoryLimit: data.directoryLimit || 25,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[customers.create] supabase insert failed', error);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message,
        });
      }

      return res.status(201).json({
        success: true,
        customer: customerData,
        customerId: customerData.id,
      });
    }

    const store = getTestCustomerStore();
    const customerId = 'test-customer-' + Date.now();
    const customer = upsertTestCustomer({
      id: customerId,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName,
      email: data.email,
      phone: data.phone || null,
      website: data.website || null,
      packageType: data.packageType || 'STARTER',
      directoryLimit: data.directoryLimit || 25,
      status: 'pending',
    });
    store.set(customerId, customer);

    return res.status(201).json({
      success: true,
      customer,
      customerId,
      notes: [
        'Supabase environment variables missing - using in-memory customer store.',
        'DEFERRED: configure SUPABASE_SERVICE_ROLE_KEY for production data.',
      ],
    });
  } catch (error) {
    console.error('[customers.create] unexpected error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

