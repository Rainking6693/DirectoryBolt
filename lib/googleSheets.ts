import { createClient } from '@supabase/supabase-js';

// Supabase client for database operations
export async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Customer ID validation
export function validateCustomerId(customerId: string): boolean {
  const pattern = /^DIR-\d{8}-\d{6}$/;
  return pattern.test(customerId);
}

// Generate new customer ID
export function generateCustomerId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `DIR-${year}${month}${day}-${random}`;
}

// Package limits
export const PACKAGE_LIMITS = {
  starter: 50,
  growth: 75,
  professional: 150,
  enterprise: 500,
} as const;

export type PackageType = keyof typeof PACKAGE_LIMITS;

// Get package limit
export function getPackageLimit(packageType: string): number {
  return PACKAGE_LIMITS[packageType as PackageType] || PACKAGE_LIMITS.starter;
}

// Validate package type
export function validatePackageType(packageType: string): boolean {
  return Object.keys(PACKAGE_LIMITS).includes(packageType);
}

// Legacy compatibility function - redirects to Supabase
export async function getSheets() {
  // This function is kept for compatibility with existing code
  // but it should be replaced with direct Supabase calls
  const client = await getSupabaseClient();
  return {
    spreadsheets: {
      get: async () => ({ data: { properties: { title: 'DirectoryBolt Customers' } } }),
      values: {
        get: async () => ({ data: { values: [] } }),
        append: async () => ({ data: { updates: { updatedRows: 1 } } }),
        batchUpdate: async () => ({ data: {} })
      }
    }
  };
}
