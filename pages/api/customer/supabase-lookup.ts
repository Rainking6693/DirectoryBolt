/**
 * Supabase Customer Lookup API
 * 
 * Provides backward-compatible customer lookup for migrated customers
 * Maps original Google Sheets customer IDs to Supabase customer records
 * 
 * Used by:
 * - Chrome Extension validation
 * - Staff Dashboard customer loading
 * - Queue processing system
 * - Customer authentication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for customer lookup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CustomerLookupResponse {
  found: boolean;
  customer?: {
    id: string;
    customerId: string; // Original customer ID for backward compatibility
    firstName: string;
    lastName: string;
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    packageType: string;
    subscriptionTier: string;
    status: string;
    creditsRemaining: number;
    creditsLimit: number;
    isActive: boolean;
    isVerified: boolean;
    created: string;
    businessData: any;
  };
  error?: string;
  source: 'supabase' | 'google_sheets_fallback';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerLookupResponse>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      found: false,
      error: 'Method not allowed',
      source: 'supabase'
    });
  }

  try {
    const customerId = req.method === 'GET' 
      ? req.query.customerId as string
      : req.body.customerId;

    if (!customerId) {
      return res.status(400).json({
        found: false,
        error: 'Customer ID is required',
        source: 'supabase'
      });
    }

    console.log(`🔍 Looking up customer: ${customerId}`);

    // Validate customer ID format
    if (!isValidCustomerId(customerId)) {
      return res.status(400).json({
        found: false,
        error: 'Invalid customer ID format',
        source: 'supabase'
      });
    }

    // Lookup customer in Supabase by original customer ID
    const customer = await findCustomerInSupabase(customerId);

    if (customer) {
      console.log(`✅ Customer found in Supabase: ${customer.fullName}`);
      
      return res.status(200).json({
        found: true,
        customer,
        source: 'supabase'
      });
    }

    // Fallback to Google Sheets for customers not yet migrated
    console.log(`⚠️  Customer not found in Supabase, checking Google Sheets fallback...`);
    
    const fallbackCustomer = await findCustomerInGoogleSheetsFallback(customerId);
    
    if (fallbackCustomer) {
      console.log(`✅ Customer found in Google Sheets fallback: ${fallbackCustomer.fullName}`);
      
      return res.status(200).json({
        found: true,
        customer: fallbackCustomer,
        source: 'google_sheets_fallback'
      });
    }

    // Customer not found in either source
    console.log(`❌ Customer not found: ${customerId}`);
    
    return res.status(404).json({
      found: false,
      error: 'Customer not found',
      source: 'supabase'
    });

  } catch (error) {
    console.error('❌ Customer lookup error:', error);
    
    return res.status(500).json({
      found: false,
      error: 'Internal server error during customer lookup',
      source: 'supabase'
    });
  }
}

async function findCustomerInSupabase(customerId: string): Promise<CustomerLookupResponse['customer'] | null> {
  try {
    // Performance optimized query with selective fields and indexed lookup
    // Using RLS optimization techniques for 2025 best practices
    let { data, error } = await supabase
      .from('customers')
      .select('id,customer_id,full_name,business_name,email,subscription_tier,subscription_status,credits_remaining,credits_limit,is_active,is_verified,created_at,business_data,metadata')
      .eq('customer_id', customerId.trim().toUpperCase())
      .single();

    // If not found by direct customer_id, try metadata search with optimized query
    if (error && error.code === 'PGRST116') {
      const { data: metaData, error: metaError } = await supabase
        .from('customers')
        .select('id,customer_id,full_name,business_name,email,subscription_tier,subscription_status,credits_remaining,credits_limit,is_active,is_verified,created_at,business_data,metadata')
        .or(`metadata->>original_customer_id.eq.${customerId},business_data->>original_customer_id.eq.${customerId}`)
        .single();
      
      data = metaData;
      error = metaError;
    }

    if (error || !data) {
      return null;
    }

    // Transform Supabase customer to expected format
    const businessData = data.business_data || {};
    const metadata = data.metadata || {};
    
    return {
      id: data.id,
      customerId: businessData.original_customer_id || metadata.original_customer_id || customerId,
      firstName: extractFirstName(data.full_name),
      lastName: extractLastName(data.full_name),
      fullName: data.full_name,
      businessName: data.business_name || '',
      email: data.email,
      phone: businessData.phone || '',
      website: businessData.website || '',
      address: businessData.address || '',
      city: businessData.city || '',
      state: businessData.state || '',
      zip: businessData.zip || '',
      packageType: businessData.original_package_type || mapTierToPackage(data.subscription_tier),
      subscriptionTier: data.subscription_tier,
      status: mapSupabaseStatus(data.subscription_status),
      creditsRemaining: data.credits_remaining || 0,
      creditsLimit: data.credits_limit || 0,
      isActive: data.is_active || false,
      isVerified: data.is_verified || false,
      created: data.created_at,
      businessData: businessData
    };

  } catch (error) {
    console.error('Error finding customer in Supabase:', error);
    return null;
  }
}

async function findCustomerInGoogleSheetsFallback(customerId: string): Promise<CustomerLookupResponse['customer'] | null> {
  try {
    // Import Google Sheets service for fallback
    const { createGoogleSheetsService } = require('../../../lib/services/google-sheets.js');
    
    const googleSheetsService = createGoogleSheetsService();
    await googleSheetsService.initialize();
    
    const result = await googleSheetsService.getCustomerById(customerId);
    
    if (!result.found || !result.customer) {
      return null;
    }

    const customer = result.customer;
    
    // Transform Google Sheets customer to expected format
    return {
      id: customer.customerId, // Use customer ID as ID for fallback
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: `${customer.firstName} ${customer.lastName}`.trim() || customer.businessName,
      businessName: customer.businessName,
      email: customer.email,
      phone: customer.phone,
      website: customer.website,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      packageType: customer.packageType,
      subscriptionTier: mapPackageToTier(customer.packageType),
      status: customer.status,
      creditsRemaining: getPackageCredits(customer.packageType),
      creditsLimit: getPackageCredits(customer.packageType),
      isActive: customer.status === 'active' || customer.status === 'pending',
      isVerified: true,
      created: customer.created,
      businessData: {
        original_customer_id: customer.customerId,
        source: 'google_sheets_fallback'
      }
    };

  } catch (error) {
    console.error('Error in Google Sheets fallback lookup:', error);
    return null;
  }
}

function isValidCustomerId(customerId: string): boolean {
  // Support multiple customer ID formats for backward compatibility
  const patterns = [
    /^DIR-\d{8}-\d{6}$/, // DIR-20250917-000001
    /^DIR-\d{4}-\d{6}$/,  // DIR-2025-001234
    /^DB-\d+$/,           // DB-123456
    /^TEST-.*$/           // TEST-CUSTOMER-123
  ];
  
  return patterns.some(pattern => pattern.test(customerId));
}

function extractFirstName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
}

function extractLastName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(1).join(' ') || '';
}

function mapTierToPackage(tier: string): string {
  const tierToPackageMap: { [key: string]: string } = {
    'basic': 'starter',
    'pro': 'professional',
    'enterprise': 'enterprise'
  };
  
  return tierToPackageMap[tier] || 'starter';
}

function mapPackageToTier(packageType: string): string {
  const packageToTierMap: { [key: string]: string } = {
    'starter': 'basic',
    'growth': 'pro',
    'professional': 'pro',
    'enterprise': 'enterprise'
  };
  
  return packageToTierMap[packageType?.toLowerCase()] || 'basic';
}

function mapSupabaseStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'active',
    'trialing': 'pending',
    'past_due': 'past_due',
    'cancelled': 'cancelled',
    'unpaid': 'unpaid'
  };
  
  return statusMap[status] || 'pending';
}

function getPackageCredits(packageType: string): number {
  const packageCredits: { [key: string]: number } = {
    'starter': 100,
    'growth': 500,
    'professional': 1000,
    'enterprise': 2000
  };
  
  return packageCredits[packageType?.toLowerCase()] || 100;
}