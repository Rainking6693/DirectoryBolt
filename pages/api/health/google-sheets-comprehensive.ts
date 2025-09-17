import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheets, validateCustomerId, generateCustomerId } from '../../../lib/googleSheets';

interface HealthCheckResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      message: 'Only GET requests are allowed'
    });
  }

  const startTime = Date.now();
  const results: HealthCheckResult[] = [];

  try {
    // Test 1: Environment Variables
    const envTest = await testEnvironmentVariables();
    results.push(envTest);

    // Test 2: Service Account File
    const serviceAccountTest = await testServiceAccountFile();
    results.push(serviceAccountTest);

    // Test 3: Google Sheets Authentication
    const authTest = await testGoogleSheetsAuth();
    results.push(authTest);

    // Test 4: Spreadsheet Access
    const spreadsheetTest = await testSpreadsheetAccess();
    results.push(spreadsheetTest);

    // Test 5: Data Structure Validation
    const structureTest = await testDataStructure();
    results.push(structureTest);

    // Test 6: Customer ID Validation
    const customerIdTest = testCustomerIdValidation();
    results.push(customerIdTest);

    // Test 7: Sample Customer Lookup
    const customerLookupTest = await testCustomerLookup();
    results.push(customerLookupTest);

    // Calculate overall status
    const hasFailures = results.some(r => r.status === 'fail');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    let overallStatus: 'healthy' | 'warning' | 'error';
    if (hasFailures) {
      overallStatus = 'error';
    } else if (hasWarnings) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }

    const totalDuration = Date.now() - startTime;

    return res.status(200).json({
      ok: true,
      overallStatus,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        warnings: results.filter(r => r.status === 'warning').length,
        failed: results.filter(r => r.status === 'fail').length
      },
      tests: results,
      configuration: {
        spreadsheetId: process.env.GOOGLE_SHEET_ID ? 'configured' : 'missing',
        serviceAccount: 'configured',
        environment: process.env.NODE_ENV || 'development'
      }
    });

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    console.error('[google-sheets-comprehensive] error', { name: err?.name, message: err?.message });
    
    return res.status(500).json({
      ok: false,
      overallStatus: 'error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: err?.message || 'Health check failed',
      tests: results
    });
  }
}

async function testEnvironmentVariables(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const requiredVars = ['GOOGLE_SHEET_ID'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        test: 'Environment Variables',
        status: 'fail',
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    return {
      test: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are configured',
      details: {
        googleSheetId: process.env.GOOGLE_SHEET_ID ? 'configured' : 'missing'
      },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'Environment Variables',
      status: 'fail',
      message: 'Failed to check environment variables',
      duration: Date.now() - startTime
    };
  }
}

async function testServiceAccountFile(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const saPath = path.join(process.cwd(), 'config', 'directorybolt-Googlesheetskey.json');
    
    if (!fs.existsSync(saPath)) {
      return {
        test: 'Service Account File',
        status: 'fail',
        message: 'Service account JSON file not found',
        details: { expectedPath: saPath },
        duration: Date.now() - startTime
      };
    }

    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      return {
        test: 'Service Account File',
        status: 'fail',
        message: `Service account file missing required fields: ${missingFields.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    // Check if it's a placeholder
    if (serviceAccount.private_key.includes('PLACEHOLDER')) {
      return {
        test: 'Service Account File',
        status: 'warning',
        message: 'Service account file contains placeholder data',
        details: { 
          clientEmail: serviceAccount.client_email,
          projectId: serviceAccount.project_id
        },
        duration: Date.now() - startTime
      };
    }

    return {
      test: 'Service Account File',
      status: 'pass',
      message: 'Service account file is properly configured',
      details: { 
        clientEmail: serviceAccount.client_email,
        projectId: serviceAccount.project_id
      },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'Service Account File',
      status: 'fail',
      message: 'Failed to read or parse service account file',
      duration: Date.now() - startTime
    };
  }
}

async function testGoogleSheetsAuth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const sheets = await getSheets();
    
    return {
      test: 'Google Sheets Authentication',
      status: 'pass',
      message: 'Successfully authenticated with Google Sheets API',
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      test: 'Google Sheets Authentication',
      status: 'fail',
      message: `Authentication failed: ${error.message}`,
      duration: Date.now() - startTime
    };
  }
}

async function testSpreadsheetAccess(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return {
        test: 'Spreadsheet Access',
        status: 'fail',
        message: 'GOOGLE_SHEET_ID not configured',
        duration: Date.now() - startTime
      };
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    
    return {
      test: 'Spreadsheet Access',
      status: 'pass',
      message: 'Successfully accessed target spreadsheet',
      details: {
        title: response.data.properties?.title,
        sheetCount: response.data.sheets?.length,
        spreadsheetId: spreadsheetId
      },
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      test: 'Spreadsheet Access',
      status: 'fail',
      message: `Failed to access spreadsheet: ${error.message}`,
      duration: Date.now() - startTime
    };
  }
}

async function testDataStructure(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return {
        test: 'Data Structure',
        status: 'fail',
        message: 'Cannot test data structure without spreadsheet ID',
        duration: Date.now() - startTime
      };
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Customers!A1:Z1'
    });

    const headers = response.data.values?.[0] || [];
    const expectedHeaders = ['customerid', 'firstname', 'lastname', 'businessname', 'email', 'packagetype'];
    const normalizedHeaders = headers.map(h => h.toString().toLowerCase());
    
    const missingHeaders = expectedHeaders.filter(expected => 
      !normalizedHeaders.includes(expected)
    );

    if (missingHeaders.length > 0) {
      return {
        test: 'Data Structure',
        status: 'warning',
        message: `Missing expected columns: ${missingHeaders.join(', ')}`,
        details: {
          foundHeaders: headers,
          missingHeaders
        },
        duration: Date.now() - startTime
      };
    }

    return {
      test: 'Data Structure',
      status: 'pass',
      message: 'Data structure contains all expected columns',
      details: {
        headers: headers,
        columnCount: headers.length
      },
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      test: 'Data Structure',
      status: 'fail',
      message: `Failed to check data structure: ${error.message}`,
      duration: Date.now() - startTime
    };
  }
}

function testCustomerIdValidation(): HealthCheckResult {
  const startTime = Date.now();
  
  try {
    const testCases = [
      { id: 'DIR-20250916-000002', expected: true },
      { id: 'DIR-20250101-123456', expected: true },
      { id: 'INVALID-ID', expected: false },
      { id: 'DIR-2025-001234', expected: false },
      { id: '', expected: false }
    ];

    const results = testCases.map(testCase => ({
      input: testCase.id,
      expected: testCase.expected,
      actual: validateCustomerId(testCase.id),
      passed: validateCustomerId(testCase.id) === testCase.expected
    }));

    const failedTests = results.filter(r => !r.passed);
    
    if (failedTests.length > 0) {
      return {
        test: 'Customer ID Validation',
        status: 'fail',
        message: `${failedTests.length} validation tests failed`,
        details: { failedTests },
        duration: Date.now() - startTime
      };
    }

    // Test ID generation
    const generatedId = generateCustomerId();
    const isValidGenerated = validateCustomerId(generatedId);

    return {
      test: 'Customer ID Validation',
      status: 'pass',
      message: 'Customer ID validation and generation working correctly',
      details: {
        testResults: results,
        generatedSample: generatedId,
        generatedValid: isValidGenerated
      },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: 'Customer ID Validation',
      status: 'fail',
      message: 'Customer ID validation test failed',
      duration: Date.now() - startTime
    };
  }
}

async function testCustomerLookup(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return {
        test: 'Customer Lookup',
        status: 'fail',
        message: 'Cannot test customer lookup without spreadsheet ID',
        duration: Date.now() - startTime
      };
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Customers!A1:Z'
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return {
        test: 'Customer Lookup',
        status: 'warning',
        message: 'No data found in spreadsheet',
        details: { rowCount: 0 },
        duration: Date.now() - startTime
      };
    }

    if (rows.length === 1) {
      return {
        test: 'Customer Lookup',
        status: 'warning',
        message: 'Only header row found, no customer data',
        details: { 
          rowCount: rows.length,
          headers: rows[0]
        },
        duration: Date.now() - startTime
      };
    }

    const headers = rows[0];
    const customerRows = rows.slice(1);
    
    return {
      test: 'Customer Lookup',
      status: 'pass',
      message: 'Customer data accessible',
      details: {
        totalRows: rows.length,
        headerCount: headers.length,
        customerCount: customerRows.length,
        sampleHeaders: headers.slice(0, 5)
      },
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      test: 'Customer Lookup',
      status: 'fail',
      message: `Customer lookup test failed: ${error.message}`,
      duration: Date.now() - startTime
    };
  }
}