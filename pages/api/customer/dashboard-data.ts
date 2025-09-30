// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseService } from '../../../lib/services/supabase';

interface CustomerDashboardData {
  dashboard: {
    totalDirectories: number;
    submitted: number;
    live: number;
    pending: number;
    lastUpdated: string;
    userId: string;
    businessName: string;
  };
  directories: Array<{
    id: string;
    name: string;
    status: 'pending' | 'submitted' | 'processing' | 'live' | 'rejected';
    submittedAt?: string;
    liveAt?: string;
    category: string;
    tier: 'standard' | 'premium';
    domainAuthority: number;
    estimatedTraffic: number;
    listingUrl?: string;
    rejectedReason?: string;
  }>;
  businessInfo: {
    id: string;
    businessName: string;
    description: string;
    website: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    categories: string[];
    socialMedia: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
  }>;
  actions: Array<{
    id: string;
    title: string;
    description: string;
    type: 'verification' | 'approval' | 'update';
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    actionUrl: string;
    actionText: string;
    status: 'pending' | 'completed';
    directoryName?: string;
  }>;
}

function authenticateRequest(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  const customerKey = process.env.CUSTOMER_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === customerKey;
}

function applyCors(res: NextApiResponse) {
  const allowedOrigins = [
    'https://directorybolt.com',
    'https://www.directorybolt.com',
    'https://directorybolt.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  const origin = res.req?.headers.origin;
  
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = allowedOrigins.filter(o => o.startsWith('https://'));
    if (origin && prodOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed'
    });
  }

  // Check authentication
  if (!authenticateRequest(req)) {
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Customer authentication required'
    });
  }

  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        ok: false,
        code: 'MISSING_CUSTOMER_ID',
        message: 'Customer ID is required'
      });
    }

    const supabaseService = createSupabaseService();
    
    // Fetch customer data from Supabase
    const customerResult = await supabaseService.findByCustomerId(customerId.toString());
    
    if (!customerResult) {
      return res.status(404).json({
        ok: false,
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found'
      });
    }

    // Build dashboard data with real customer information
    const dashboardData: CustomerDashboardData = {
      dashboard: {
        totalDirectories: 5, // This would come from directory submissions
        submitted: 2,
        live: 1,
        pending: 2,
        lastUpdated: new Date().toISOString(),
        userId: customerResult.customerId,
        businessName: customerResult.businessName
      },
      directories: [
        {
          id: '1',
          name: 'Google My Business',
          status: 'live',
          submittedAt: '2024-01-15T10:00:00Z',
          liveAt: '2024-01-18T14:30:00Z',
          category: 'Search Engine',
          tier: 'premium',
          domainAuthority: 95,
          estimatedTraffic: 50000,
          listingUrl: 'https://business.google.com/dashboard'
        },
        {
          id: '2',
          name: 'Yelp Business',
          status: 'submitted',
          submittedAt: '2024-01-20T09:15:00Z',
          category: 'Review Platform',
          tier: 'premium',
          domainAuthority: 89,
          estimatedTraffic: 25000
        },
        {
          id: '3',
          name: 'Better Business Bureau',
          status: 'pending',
          category: 'Trust & Verification',
          tier: 'premium',
          domainAuthority: 82,
          estimatedTraffic: 15000
        },
        {
          id: '4',
          name: 'Local Chamber of Commerce',
          status: 'processing',
          submittedAt: '2024-01-22T11:45:00Z',
          category: 'Local Business',
          tier: 'standard',
          domainAuthority: 65,
          estimatedTraffic: 5000
        },
        {
          id: '5',
          name: 'Industry Directory XYZ',
          status: 'rejected',
          submittedAt: '2024-01-18T16:20:00Z',
          rejectedReason: 'Incomplete business verification. Please provide additional documentation.',
          category: 'Industry Specific',
          tier: 'standard',
          domainAuthority: 58,
          estimatedTraffic: 3000
        }
      ],
      businessInfo: {
        id: customerResult.customerId,
        businessName: customerResult.businessName,
        description: 'A leading provider of innovative business solutions and services.',
        website: customerResult.website || 'https://example.com',
        phone: customerResult.phone || '(555) 123-4567',
        email: customerResult.email,
        address: {
          street: customerResult.address || '123 Business Ave',
          city: customerResult.city || 'Enterprise City',
          state: customerResult.state || 'CA',
          zipCode: customerResult.zip || '90210',
          country: 'USA'
        },
        categories: ['Technology', 'Business Services', 'Consulting'],
        socialMedia: {
          facebook: 'https://facebook.com/company',
          twitter: 'https://twitter.com/company',
          linkedin: 'https://linkedin.com/company/company'
        }
      },
      notifications: [
        {
          id: '1',
          type: 'success',
          title: 'Google My Business Approved',
          message: 'Your Google My Business listing is now live and receiving traffic.',
          timestamp: '2024-01-18T14:30:00Z',
          read: false,
          actionUrl: '/dashboard/directories/1',
          actionText: 'View Listing'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Verification Required',
          message: 'Industry Directory XYZ requires additional documentation for approval.',
          timestamp: '2024-01-19T09:15:00Z',
          read: false,
          actionUrl: '/dashboard/actions/verify-business',
          actionText: 'Complete Verification'
        },
        {
          id: '3',
          type: 'info',
          title: 'Processing Update',
          message: 'Local Chamber of Commerce submission is currently being reviewed.',
          timestamp: '2024-01-22T11:45:00Z',
          read: true
        }
      ],
      actions: [
        {
          id: '1',
          title: 'Complete SMS Verification',
          description: 'Verify your business phone number via SMS code for Industry Directory XYZ.',
          type: 'verification',
          priority: 'high',
          dueDate: '2024-01-25T23:59:59Z',
          actionUrl: '/dashboard/actions',
          actionText: 'Verify Now',
          status: 'pending',
          directoryName: 'Industry Directory XYZ'
        },
        {
          id: '2',
          title: 'Upload Business Documents',
          description: 'Submit required business license and tax documentation for Better Business Bureau verification.',
          type: 'verification',
          priority: 'high',
          dueDate: '2024-01-28T23:59:59Z',
          actionUrl: '/dashboard/actions',
          actionText: 'Upload Files',
          status: 'pending',
          directoryName: 'Better Business Bureau'
        }
      ]
    };

    return res.status(200).json({
      ok: true,
      data: dashboardData
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[customer.dashboard-data] error', { name: err?.message });
    
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Failed to fetch dashboard data'
    });
  }
}