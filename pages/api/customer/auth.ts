// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface CustomerAuthRequest {
  email?: string;
  customerId?: string;
}

interface CustomerRecord {
  id: string;
  businessName: string;
  email: string;
  website: string;
  packageType: string;
  directoryLimit: number;
  status: string;
  purchaseDate: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    const { email, customerId }: CustomerAuthRequest = req.body;

    if (!email && !customerId) {
      return res.status(400).json({ error: 'Email or Customer ID is required' });
    }

    console.log('🔐 Customer authentication request:', { email: email ? `${email.substring(0,3)}***` : undefined, customerId });
    
    let customer: CustomerRecord | null = null;

    if (customerId) {
      // Authenticate by Customer ID using real Supabase data
      customer = await authenticateByCustomerId(customerId);
    } else if (email) {
      // Authenticate by email using real Supabase data
      customer = await authenticateByEmail(email);
    }

    if (!customer) {
      console.log('❌ Authentication failed - customer not found');
      return res.status(401).json({ error: 'Invalid credentials. Please check your email or Customer ID.' });
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Customer authenticated successfully in ${responseTime}ms:`, customer.businessName);

    // Return customer data for session management
    res.status(200).json({
      success: true,
      customerId: customer.id,
      businessName: customer.businessName,
      email: customer.email,
      packageType: customer.packageType,
      status: customer.status
    });

  } catch (error) {
    console.error('❌ Customer authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function authenticateByCustomerId(customerId: string): Promise<CustomerRecord | null> {
  try {
    console.log('🔍 Authenticating by Customer ID:', customerId);
    
    // Validate Customer ID format - support multiple formats
    const validPatterns = [
      /^DIR-20\d{2}-[A-Z0-9]{6}$/,
      /^DIR-\d{8}-\d{6}$/,
      /^DIR-\d{4}-[A-Z0-9]{6,}$/,
      /^DB-[A-Z0-9]{6,}$/
    ];
    
    const isValidFormat = validPatterns.some(pattern => pattern.test(customerId));
    if (!isValidFormat) {
      console.log('❌ Invalid Customer ID format:', customerId);
      return null;
    }

    // Use direct Supabase client for authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query customer by ID
    const { data, error } = await supabase
      .from('customers')
      .select('customer_id,first_name,last_name,business_name,email,website,package_type,status,created_at')
      .eq('customer_id', customerId.toUpperCase())
      .single();

    if (error || !data) {
      console.log('❌ Customer not found in database:', customerId);
      return null;
    }
    
    // Map Supabase data to CustomerRecord format
    const packageLimits = getPackageLimits();
    const directoryLimit = packageLimits[data.package_type] || 50;

    return {
      id: data.customer_id,
      businessName: data.business_name || `${data.first_name} ${data.last_name}`.trim() || 'Unknown Business',
      email: data.email,
      website: data.website || '',
      packageType: data.package_type,
      directoryLimit: directoryLimit,
      status: data.status,
      purchaseDate: data.created_at || new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error authenticating by Customer ID:', error);
    return null;
  }
}

async function authenticateByEmail(email: string): Promise<CustomerRecord | null> {
  try {
    console.log('🔍 Authenticating by email:', email.substring(0,3) + '***');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return null;
    }

    // Use direct Supabase client for authentication by email
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query Supabase for customer by email
    const { data, error } = await supabase
      .from('customers')
      .select('customer_id,first_name,last_name,business_name,email,website,package_type,status,created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      console.log('❌ Customer not found by email:', email.substring(0,3) + '***');
      return null;
    }

    // Map Supabase data to CustomerRecord format
    const packageLimits = getPackageLimits();
    const directoryLimit = packageLimits[data.package_type] || 50;

    return {
      id: data.customer_id,
      businessName: data.business_name || `${data.first_name} ${data.last_name}`.trim() || 'Unknown Business',
      email: data.email,
      website: data.website || '',
      packageType: data.package_type,
      directoryLimit: directoryLimit,
      status: data.status,
      purchaseDate: data.created_at || new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error authenticating by email:', error);
    return null;
  }
}

function getPackageLimits() {
  return {
    starter: 50,
    growth: 75,
    professional: 150,
    pro: 150,
    enterprise: 500
  };
}