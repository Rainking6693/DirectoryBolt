import { NextApiRequest, NextApiResponse } from 'next';

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

  try {
    const { email, customerId }: CustomerAuthRequest = req.body;

    if (!email && !customerId) {
      return res.status(400).json({ error: 'Email or Customer ID is required' });
    }

    // In a real implementation, this would query your database (Airtable, Supabase, etc.)
    // For now, we'll simulate the authentication process
    
    let customer: CustomerRecord | null = null;

    if (customerId) {
      // Authenticate by Customer ID
      customer = await authenticateByCustomerId(customerId);
    } else if (email) {
      // Authenticate by email
      customer = await authenticateByEmail(email);
    }

    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your email or Customer ID.' });
    }

    // Return customer ID for session management
    res.status(200).json({
      success: true,
      customerId: customer.id,
      businessName: customer.businessName
    });

  } catch (error) {
    console.error('Customer authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function authenticateByCustomerId(customerId: string): Promise<CustomerRecord | null> {
  try {
    // This would typically query your Airtable or database
    // For demo purposes, we'll simulate a database lookup
    
    // Validate Customer ID format
    if (!customerId.match(/^DIR-2025-[A-Z0-9]{6}$/)) {
      return null;
    }

    // Simulate database query
    // In real implementation, replace with actual Airtable/Supabase query
    const mockCustomer: CustomerRecord = {
      id: customerId,
      businessName: 'Demo Business',
      email: 'demo@example.com',
      website: 'https://demo.com',
      packageType: 'Growth',
      directoryLimit: 100,
      status: 'in-progress',
      purchaseDate: new Date().toISOString()
    };

    return mockCustomer;

  } catch (error) {
    console.error('Error authenticating by Customer ID:', error);
    return null;
  }
}

async function authenticateByEmail(email: string): Promise<CustomerRecord | null> {
  try {
    // This would typically query your Airtable or database
    // For demo purposes, we'll simulate a database lookup
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return null;
    }

    // Simulate database query
    // In real implementation, replace with actual Airtable/Supabase query
    const mockCustomer: CustomerRecord = {
      id: 'DIR-2025-ABC123',
      businessName: 'Demo Business',
      email: email,
      website: 'https://demo.com',
      packageType: 'Growth',
      directoryLimit: 100,
      status: 'in-progress',
      purchaseDate: new Date().toISOString()
    };

    return mockCustomer;

  } catch (error) {
    console.error('Error authenticating by email:', error);
    return null;
  }
}

// Real implementation would look like this for Airtable:
/*
async function authenticateByCustomerId(customerId: string): Promise<CustomerRecord | null> {
  try {
    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID);
    
    const records = await base('Customers').select({
      filterByFormula: `{Customer ID} = '${customerId}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      id: record.get('Customer ID') as string,
      businessName: record.get('Business Name') as string,
      email: record.get('Email') as string,
      website: record.get('Website') as string,
      packageType: record.get('Package Type') as string,
      directoryLimit: record.get('Directory Limit') as number,
      status: record.get('Status') as string,
      purchaseDate: record.get('Purchase Date') as string
    };

  } catch (error) {
    console.error('Airtable authentication error:', error);
    return null;
  }
}
*/