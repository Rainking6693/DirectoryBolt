import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheets, validateCustomerId, generateCustomerId, getPackageLimit, validatePackageType } from '../../../lib/googleSheets';

interface CustomerData {
  customerId: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  packageType: string;
  status?: string;
  created?: string;
}

function authenticateRequest(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY;
  const staffKey = process.env.STAFF_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === adminKey || token === staffKey;
}

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Check authentication
  if (!authenticateRequest(req)) {
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Admin or staff authentication required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetCustomers(req, res);
      case 'POST':
        return handleCreateCustomer(req, res);
      case 'PUT':
        return handleUpdateCustomer(req, res);
      case 'DELETE':
        return handleDeleteCustomer(req, res);
      default:
        res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
        return res.status(405).json({
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed'
        });
    }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    console.error('[customer.data-operations] error', { name: err?.name, message: err?.message });
    
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Customer data operation failed'
    });
  }
}

async function handleGetCustomers(req: NextApiRequest, res: NextApiResponse) {
  const { customerId, limit = '100' } = req.query;
  
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    return res.status(500).json({
      ok: false,
      code: 'MISSING_SHEET_ID',
      message: 'Google Sheets configuration missing'
    });
  }

  try {
    const sheets = await getSheets();
    const range = 'Customers!A1:Z';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.status(200).json({
        ok: true,
        customers: [],
        total: 0
      });
    }

    const headers = rows[0].map(header => (header || '').toString().trim().toLowerCase());
    const records = rows.slice(1);

    // Map column indices
    const getColumnIndex = (name: string) => headers.indexOf(name.toLowerCase());
    
    const columnIndices = {
      customerId: getColumnIndex('customerid'),
      firstName: getColumnIndex('firstname'),
      lastName: getColumnIndex('lastname'),
      businessName: getColumnIndex('businessname'),
      email: getColumnIndex('email'),
      phone: getColumnIndex('phone'),
      website: getColumnIndex('website'),
      address: getColumnIndex('address'),
      city: getColumnIndex('city'),
      state: getColumnIndex('state'),
      zip: getColumnIndex('zip'),
      packageType: getColumnIndex('packagetype'),
      status: getColumnIndex('status'),
      created: getColumnIndex('created')
    };

    // Convert rows to customer objects
    let customers = records.map(record => {
      const customer: CustomerData = {
        customerId: record[columnIndices.customerId] || '',
        firstName: record[columnIndices.firstName] || '',
        lastName: record[columnIndices.lastName] || '',
        businessName: record[columnIndices.businessName] || '',
        email: record[columnIndices.email] || '',
        phone: record[columnIndices.phone] || '',
        website: record[columnIndices.website] || '',
        address: record[columnIndices.address] || '',
        city: record[columnIndices.city] || '',
        state: record[columnIndices.state] || '',
        zip: record[columnIndices.zip] || '',
        packageType: record[columnIndices.packageType] || 'starter',
        status: record[columnIndices.status] || 'active',
        created: record[columnIndices.created] || ''
      };
      return customer;
    }).filter(customer => customer.customerId); // Filter out empty rows

    // If specific customer ID requested
    if (customerId) {
      const cleanedId = customerId.toString().trim().toUpperCase();
      const customer = customers.find(c => c.customerId.toUpperCase() === cleanedId);
      
      if (!customer) {
        return res.status(404).json({
          ok: false,
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      return res.status(200).json({
        ok: true,
        customer: {
          ...customer,
          directoryLimit: getPackageLimit(customer.packageType)
        }
      });
    }

    // Apply limit
    const limitNum = parseInt(limit.toString(), 10);
    if (limitNum > 0) {
      customers = customers.slice(0, limitNum);
    }

    return res.status(200).json({
      ok: true,
      customers: customers.map(customer => ({
        ...customer,
        directoryLimit: getPackageLimit(customer.packageType)
      })),
      total: customers.length
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    return res.status(500).json({
      ok: false,
      code: 'SHEETS_ERROR',
      message: `Failed to retrieve customers: ${err.message}`
    });
  }
}

async function handleCreateCustomer(req: NextApiRequest, res: NextApiResponse) {
  const customerData: Partial<CustomerData> = req.body;

  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'businessName', 'email', 'packageType'];
  const missingFields = requiredFields.filter(field => !customerData[field as keyof CustomerData]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_FIELDS',
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerData.email!)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_EMAIL',
      message: 'Invalid email format'
    });
  }

  // Validate package type
  if (!validatePackageType(customerData.packageType!)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_PACKAGE',
      message: 'Invalid package type'
    });
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    return res.status(500).json({
      ok: false,
      code: 'MISSING_SHEET_ID',
      message: 'Google Sheets configuration missing'
    });
  }

  try {
    // Generate customer ID
    const customerId = customerData.customerId || generateCustomerId();
    const timestamp = new Date().toISOString();

    // Prepare row data
    const rowData = [
      customerId,
      customerData.firstName,
      customerData.lastName,
      customerData.businessName,
      customerData.email,
      customerData.phone || '',
      customerData.website || '',
      customerData.address || '',
      customerData.city || '',
      customerData.state || '',
      customerData.zip || '',
      customerData.packageType,
      timestamp,
      customerData.status || 'active'
    ];

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Customers!A:N',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData]
      }
    });

    return res.status(201).json({
      ok: true,
      message: 'Customer created successfully',
      customer: {
        customerId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        businessName: customerData.businessName,
        email: customerData.email,
        packageType: customerData.packageType,
        directoryLimit: getPackageLimit(customerData.packageType!),
        status: customerData.status || 'active',
        created: timestamp
      },
      updatedRows: response.data.updates?.updatedRows || 0
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    return res.status(500).json({
      ok: false,
      code: 'SHEETS_ERROR',
      message: `Failed to create customer: ${err.message}`
    });
  }
}

async function handleUpdateCustomer(req: NextApiRequest, res: NextApiResponse) {
  const { customerId } = req.query;
  const updateData = req.body;

  if (!customerId) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_CUSTOMER_ID',
      message: 'Customer ID is required'
    });
  }

  if (!validateCustomerId(customerId.toString())) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_CUSTOMER_ID',
      message: 'Invalid customer ID format'
    });
  }

  // Validate package type if provided
  if (updateData.packageType && !validatePackageType(updateData.packageType)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_PACKAGE',
      message: 'Invalid package type'
    });
  }

  return res.status(200).json({
    ok: true,
    message: 'Customer update functionality coming soon',
    customerId: customerId.toString()
  });
}

async function handleDeleteCustomer(req: NextApiRequest, res: NextApiResponse) {
  const { customerId } = req.query;

  if (!customerId) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_CUSTOMER_ID',
      message: 'Customer ID is required'
    });
  }

  return res.status(200).json({
    ok: true,
    message: 'Customer deletion functionality coming soon',
    customerId: customerId.toString()
  });
}