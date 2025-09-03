const { Handler } = require('@netlify/functions');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'auto-bolt-secret-key';

// Load master directory list
let masterDirectoryList = null;

function loadDirectoryList() {
  if (!masterDirectoryList) {
    try {
      const filePath = path.join(__dirname, '../../directories/master-directory-list.json');
      masterDirectoryList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error('Failed to load master directory list:', error);
      masterDirectoryList = { directories: [] };
    }
  }
  return masterDirectoryList;
}

const handler = async (event, context) => {
  const { httpMethod, path, body, headers, queryStringParameters } = event;
  
  // CORS handling
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'chrome-extension://*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-ID',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  try {
    const pathSegments = path.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    switch (httpMethod) {
      case 'GET':
        if (action === 'list') {
          return await handleGetDirectoryList(headers, queryStringParameters);
        } else if (action === 'status') {
          return await handleGetDirectoryStatus(headers, queryStringParameters);
        } else if (pathSegments.includes('directory') && pathSegments.length > 2) {
          const directoryId = pathSegments[pathSegments.length - 1];
          return await handleGetDirectoryDetails(headers, directoryId);
        }
        break;
      
      case 'POST':
        if (action === 'validate') {
          return await handleValidateDirectory(headers, JSON.parse(body || '{}'));
        } else if (action === 'submission') {
          return await handleTrackSubmission(headers, JSON.parse(body || '{}'));
        }
        break;
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Directory manager error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function handleGetDirectoryList(headers, queryParams) {
  const userId = await getUserIdFromToken(headers);
  const directories = loadDirectoryList();
  
  // Filter parameters
  const category = queryParams?.category;
  const priority = queryParams?.priority;
  const difficulty = queryParams?.difficulty;
  const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
  const offset = queryParams?.offset ? parseInt(queryParams.offset) : 0;

  let filteredDirectories = [...directories.directories];

  // Apply filters
  if (category) {
    filteredDirectories = filteredDirectories.filter(dir => dir.category === category);
  }
  if (priority) {
    filteredDirectories = filteredDirectories.filter(dir => dir.priority === priority);
  }
  if (difficulty) {
    filteredDirectories = filteredDirectories.filter(dir => dir.difficulty === difficulty);
  }

  // Sort by priority and estimated time
  filteredDirectories.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    return (a.estimatedTime || 0) - (b.estimatedTime || 0);
  });

  // Apply pagination
  const paginatedDirectories = filteredDirectories.slice(offset, offset + limit);

  // Add user-specific data if authenticated
  const enhancedDirectories = paginatedDirectories.map(dir => {
    const enhanced = { ...dir };
    
    if (userId) {
      // Add submission status (mock data - replace with actual user data)
      enhanced.userStatus = {
        submitted: false,
        lastSubmission: null,
        status: 'pending',
        notes: null
      };
    }
    
    return enhanced;
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    },
    body: JSON.stringify({
      success: true,
      data: {
        directories: enhancedDirectories,
        total: filteredDirectories.length,
        offset,
        limit,
        metadata: {
          version: directories.metadata?.version || '1.0.0',
          lastUpdated: directories.metadata?.lastUpdated,
          totalAvailable: directories.directories?.length || 0
        }
      }
    })
  };
}

async function handleGetDirectoryStatus(headers, queryParams) {
  const userId = await getUserIdFromToken(headers);
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  // Mock user directory status data
  const userDirectoryStatus = {
    totalDirectories: 63,
    submitted: 12,
    pending: 8,
    completed: 4,
    failed: 0,
    lastUpdate: new Date().toISOString(),
    recentSubmissions: [
      {
        directoryId: 'google-business',
        status: 'completed',
        submittedAt: '2025-08-29T10:30:00Z',
        completedAt: '2025-08-29T11:00:00Z'
      },
      {
        directoryId: 'yelp',
        status: 'pending',
        submittedAt: '2025-08-29T09:15:00Z'
      }
    ]
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      status: userDirectoryStatus
    })
  };
}

async function handleGetDirectoryDetails(headers, directoryId) {
  const directories = loadDirectoryList();
  const directory = directories.directories.find(dir => dir.id === directoryId);
  
  if (!directory) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Directory not found' })
    };
  }

  // Add enhanced details
  const enhancedDirectory = {
    ...directory,
    submissionTips: getSubmissionTips(directory),
    commonIssues: getCommonIssues(directory),
    successRate: getSuccessRate(directory),
    alternativeOptions: getAlternativeOptions(directory, directories.directories)
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*',
      'Cache-Control': 'public, max-age=7200' // Cache for 2 hours
    },
    body: JSON.stringify({
      success: true,
      directory: enhancedDirectory
    })
  };
}

async function handleValidateDirectory(headers, validationData) {
  const { directoryId, businessData } = validationData;
  
  const directories = loadDirectoryList();
  const directory = directories.directories.find(dir => dir.id === directoryId);
  
  if (!directory) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Directory not found' })
    };
  }

  // Validate business data against directory requirements
  const validation = validateBusinessData(businessData, directory);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      directoryId,
      validation
    })
  };
}

async function handleTrackSubmission(headers, submissionData) {
  const userId = await getUserIdFromToken(headers);
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  // Track submission (in production, save to database)
  const submission = {
    id: require('uuid').v4(),
    userId,
    directoryId: submissionData.directoryId,
    status: submissionData.status || 'submitted',
    timestamp: new Date().toISOString(),
    data: submissionData.data || {},
    notes: submissionData.notes || null
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      submissionId: submission.id,
      timestamp: submission.timestamp
    })
  };
}

async function getUserIdFromToken(headers) {
  const token = headers.authorization?.replace('Bearer ', '');
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

function getSubmissionTips(directory) {
  const tips = {
    'google-business': [
      'Verify your business address before submitting',
      'Upload high-quality photos of your business',
      'Ensure your business hours are accurate',
      'Add a detailed business description'
    ],
    'yelp': [
      'Create a compelling business description',
      'Add multiple business photos',
      'Encourage satisfied customers to leave reviews',
      'Respond to all reviews professionally'
    ]
  };
  
  return tips[directory.id] || [
    'Ensure all required fields are filled out accurately',
    'Double-check your business information for consistency',
    'Upload quality photos if supported',
    'Follow up on your submission status'
  ];
}

function getCommonIssues(directory) {
  const issues = {
    'google-business': [
      'Address verification delays',
      'Duplicate business listings',
      'Phone number verification required'
    ],
    'yelp': [
      'Business category restrictions',
      'Photo upload size limits',
      'Review filtering'
    ]
  };
  
  return issues[directory.id] || [
    'Incomplete business information',
    'Verification delays',
    'Category selection issues'
  ];
}

function getSuccessRate(directory) {
  // Mock success rates (replace with actual data)
  const rates = {
    'google-business': 92,
    'yelp': 89,
    'yellowpages': 95,
    'bing-places': 87
  };
  
  return rates[directory.id] || 85;
}

function getAlternativeOptions(directory, allDirectories) {
  return allDirectories
    .filter(dir => 
      dir.category === directory.category && 
      dir.id !== directory.id
    )
    .slice(0, 3)
    .map(dir => ({
      id: dir.id,
      name: dir.name,
      priority: dir.priority,
      difficulty: dir.difficulty
    }));
}

function validateBusinessData(businessData, directory) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 100
  };

  // Check required fields
  const requiredFields = Object.keys(directory.fieldMapping || {});
  requiredFields.forEach(field => {
    if (!businessData[field] || businessData[field].trim() === '') {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
      validation.score -= 20;
    }
  });

  // Check directory-specific requirements
  if (directory.requirements) {
    directory.requirements.forEach(requirement => {
      if (requirement === 'verified_phone' && !businessData.phoneVerified) {
        validation.warnings.push('Phone number verification recommended');
        validation.score -= 10;
      }
      if (requirement === 'verified_address' && !businessData.addressVerified) {
        validation.warnings.push('Address verification recommended');
        validation.score -= 10;
      }
    });
  }

  return validation;
}

exports.handler = handler;