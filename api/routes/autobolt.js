/**
 * AutoBolt API Routes - DirectoryBolt Integration
 * Handles customer queue management and extension communication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

const CUSTOMERS_TABLE = 'Customers';

/**
 * GET /api/autobolt/queue/pending
 * Retrieve pending customers for extension processing
 */
export async function getPendingCustomers(req, res) {
  try {
    console.log('🔍 Fetching pending customers for AutoBolt processing...');

    const records = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: "AND({submissionStatus} = 'pending', {packageType} != '')",
        sort: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'asc' }
        ],
        maxRecords: 10 // Process max 10 customers at once
      })
      .all();

    const customers = records.map(record => ({
      customerId: record.get('customerId'),
      packageType: record.get('packageType'),
      submissionStatus: record.get('submissionStatus'),
      businessData: {
        companyName: record.get('businessName') || record.get('companyName'),
        email: record.get('email'),
        phone: record.get('phone'),
        address: record.get('address'),
        city: record.get('city'),
        state: record.get('state'),
        zipCode: record.get('zipCode') || record.get('zip'),
        website: record.get('website'),
        firstName: record.get('firstName'),
        lastName: record.get('lastName'),
        description: record.get('businessDescription') || record.get('description'),
        logo: record.get('logoUrl') || record.get('logo'),
        facebook: record.get('facebook'),
        instagram: record.get('instagram'),
        linkedin: record.get('linkedin'),
        twitter: record.get('twitter')
      },
      directoryLimits: getDirectoryLimits(record.get('packageType')),
      createdAt: record.get('createdAt'),
      priority: getPriorityScore(record.get('packageType')),
      airtableId: record.id
    }));

    console.log(`✅ Found ${customers.length} pending customers`);

    res.status(200).json({
      success: true,
      customers: customers,
      total: customers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching pending customers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST /api/autobolt/customer/{customerId}/status
 * Update customer processing status and progress
 */
export async function updateCustomerStatus(req, res) {
  try {
    const { customerId } = req.query;
    const { status, progress, results, currentDirectory, error } = req.body;

    console.log(`📊 Updating status for customer ${customerId}: ${status}`);

    // Find customer record
    const records = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: `{customerId} = '${customerId}'`,
        maxRecords: 1
      })
      .all();

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        customerId
      });
    }

    const record = records[0];
    const updateData = {
      submissionStatus: status,
      lastUpdated: new Date().toISOString()
    };

    // Update progress data
    if (progress) {
      updateData.totalDirectories = progress.totalDirectories;
      updateData.completedDirectories = progress.completed;
      updateData.successfulDirectories = progress.successful;
      updateData.failedDirectories = progress.failed;
      updateData.progressPercentage = Math.round((progress.completed / progress.totalDirectories) * 100);
    }

    // Update current processing info
    if (currentDirectory) {
      updateData.currentDirectory = currentDirectory;
    }

    // Store results if provided
    if (results && Array.isArray(results)) {
      updateData.submissionResults = JSON.stringify(results);
      updateData.completedAt = new Date().toISOString();
    }

    // Store error information
    if (error) {
      updateData.errorMessage = error;
      updateData.errorAt = new Date().toISOString();
    }

    // Update Airtable record
    await base(CUSTOMERS_TABLE).update(record.id, updateData);

    console.log(`✅ Customer ${customerId} status updated to: ${status}`);

    // Send notifications based on status
    if (status === 'in-progress' && progress?.completed === 1) {
      await sendProgressStartNotification(customerId, record.get('email'));
    } else if (status === 'completed') {
      await sendCompletionNotification(customerId, record.get('email'), results);
    } else if (status === 'failed') {
      await sendErrorNotification(customerId, record.get('email'), error);
    }

    res.status(200).json({
      success: true,
      message: 'Customer status updated successfully',
      customerId,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating customer status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/autobolt/customer/{customerId}
 * Get specific customer data and status
 */
export async function getCustomerData(req, res) {
  try {
    const { customerId } = req.query;

    console.log(`🔍 Fetching data for customer: ${customerId}`);

    const records = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: `{customerId} = '${customerId}'`,
        maxRecords: 1
      })
      .all();

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        customerId
      });
    }

    const record = records[0];
    const customerData = {
      customerId: record.get('customerId'),
      packageType: record.get('packageType'),
      submissionStatus: record.get('submissionStatus'),
      businessData: {
        companyName: record.get('businessName') || record.get('companyName'),
        email: record.get('email'),
        phone: record.get('phone'),
        address: record.get('address'),
        city: record.get('city'),
        state: record.get('state'),
        zipCode: record.get('zipCode') || record.get('zip'),
        website: record.get('website'),
        firstName: record.get('firstName'),
        lastName: record.get('lastName'),
        description: record.get('businessDescription') || record.get('description'),
        logo: record.get('logoUrl') || record.get('logo')
      },
      progress: {
        totalDirectories: record.get('totalDirectories') || 0,
        completed: record.get('completedDirectories') || 0,
        successful: record.get('successfulDirectories') || 0,
        failed: record.get('failedDirectories') || 0,
        percentage: record.get('progressPercentage') || 0,
        currentDirectory: record.get('currentDirectory')
      },
      results: record.get('submissionResults') ? JSON.parse(record.get('submissionResults')) : [],
      directoryLimits: getDirectoryLimits(record.get('packageType')),
      createdAt: record.get('createdAt'),
      lastUpdated: record.get('lastUpdated'),
      completedAt: record.get('completedAt')
    };

    res.status(200).json({
      success: true,
      customer: customerData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching customer data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/autobolt/directories
 * Get available directories for processing
 */
export async function getAvailableDirectories(req, res) {
  try {
    const { packageType, category, difficulty } = req.query;

    console.log('🔍 Fetching available directories...');

    // Load directory list from extension
    const directoryList = await loadDirectoryList();
    
    let filteredDirectories = directoryList;

    // Filter by package type limits
    if (packageType) {
      const limits = getDirectoryLimits(packageType);
      filteredDirectories = filteredDirectories.slice(0, limits);
    }

    // Filter by category
    if (category) {
      filteredDirectories = filteredDirectories.filter(dir => 
        dir.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by difficulty
    if (difficulty) {
      filteredDirectories = filteredDirectories.filter(dir => 
        dir.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
    }

    res.status(200).json({
      success: true,
      directories: filteredDirectories,
      total: filteredDirectories.length,
      filters: { packageType, category, difficulty },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching directories:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/autobolt/stats
 * Get AutoBolt system statistics
 */
export async function getSystemStats(req, res) {
  try {
    console.log('📊 Fetching AutoBolt system statistics...');

    // Get customer counts by status
    const pendingRecords = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: "{submissionStatus} = 'pending'",
        fields: ['customerId']
      })
      .all();

    const processingRecords = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: "{submissionStatus} = 'in-progress'",
        fields: ['customerId']
      })
      .all();

    const completedRecords = await base(CUSTOMERS_TABLE)
      .select({
        filterByFormula: "{submissionStatus} = 'completed'",
        fields: ['customerId', 'successfulDirectories', 'totalDirectories', 'completedAt']
      })
      .all();

    // Calculate success rates
    const totalCompleted = completedRecords.length;
    const totalSuccessful = completedRecords.reduce((sum, record) => 
      sum + (record.get('successfulDirectories') || 0), 0
    );
    const totalDirectories = completedRecords.reduce((sum, record) => 
      sum + (record.get('totalDirectories') || 0), 0
    );

    const successRate = totalDirectories > 0 ? (totalSuccessful / totalDirectories) : 0;

    // Calculate average processing time
    const processingTimes = completedRecords
      .filter(record => record.get('completedAt') && record.get('createdAt'))
      .map(record => {
        const start = new Date(record.get('createdAt'));
        const end = new Date(record.get('completedAt'));
        return (end - start) / (1000 * 60); // minutes
      });

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const stats = {
      customers: {
        pending: pendingRecords.length,
        processing: processingRecords.length,
        completed: totalCompleted,
        total: pendingRecords.length + processingRecords.length + totalCompleted
      },
      performance: {
        successRate: Math.round(successRate * 100) / 100,
        averageProcessingTime: Math.round(avgProcessingTime),
        totalDirectoriesProcessed: totalDirectories,
        totalSuccessfulSubmissions: totalSuccessful
      },
      system: {
        status: 'operational',
        lastUpdate: new Date().toISOString(),
        version: '2.0.0'
      }
    };

    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper Functions

function getDirectoryLimits(packageType) {
  const limits = {
    'Starter': 25,
    'Growth': 100,
    'Pro': 150,
    'Enterprise': 200
  };
  return limits[packageType] || 50;
}

function getPriorityScore(packageType) {
  const priorities = {
    'Enterprise': 4,
    'Pro': 3,
    'Growth': 2,
    'Starter': 1
  };
  return priorities[packageType] || 1;
}

async function loadDirectoryList() {
  // This would load from the extension's directory list
  // For now, return a basic structure
  return [
    {
      id: 'google-business',
      name: 'Google Business Profile',
      category: 'Local Search',
      difficulty: 'easy',
      url: 'https://business.google.com',
      priority: 1
    },
    {
      id: 'yelp',
      name: 'Yelp Business',
      category: 'Local Search',
      difficulty: 'medium',
      url: 'https://business.yelp.com',
      priority: 2
    }
    // Add more directories as needed
  ];
}

async function sendProgressStartNotification(customerId, email) {
  try {
    console.log(`📧 Sending progress start notification to ${email}`);
    // Implement email notification
    // This would integrate with your email service
  } catch (error) {
    console.error('❌ Failed to send progress notification:', error);
  }
}

async function sendCompletionNotification(customerId, email, results) {
  try {
    console.log(`📧 Sending completion notification to ${email}`);
    // Implement completion email with results
  } catch (error) {
    console.error('❌ Failed to send completion notification:', error);
  }
}

async function sendErrorNotification(customerId, email, error) {
  try {
    console.log(`📧 Sending error notification to ${email}`);
    // Implement error notification email
  } catch (error) {
    console.error('❌ Failed to send error notification:', error);
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const { endpoint, customerId } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (endpoint === 'queue' && req.query.status === 'pending') {
          return await getPendingCustomers(req, res);
        } else if (endpoint === 'customer' && customerId) {
          return await getCustomerData(req, res);
        } else if (endpoint === 'directories') {
          return await getAvailableDirectories(req, res);
        } else if (endpoint === 'stats') {
          return await getSystemStats(req, res);
        }
        break;

      case 'POST':
        if (endpoint === 'customer' && customerId && req.query.action === 'status') {
          return await updateCustomerStatus(req, res);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }

    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Handler Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}