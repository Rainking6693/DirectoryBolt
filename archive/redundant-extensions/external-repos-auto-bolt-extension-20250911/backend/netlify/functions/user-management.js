const { Handler } = require('@netlify/functions');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'auto-bolt-secret-key';
const DATABASE_URL = process.env.SUPABASE_URL;
const DATABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Validation schemas
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  extensionId: Joi.string().required(),
  businessInfo: Joi.object({
    name: Joi.string().required(),
    website: Joi.string().uri().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    description: Joi.string().max(500).optional()
  }).optional()
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  extensionId: Joi.string().required()
});

// In-memory user storage (replace with actual database)
const users = new Map();

const handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
  // CORS handling
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'chrome-extension://*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      case 'POST':
        if (action === 'register') {
          return await handleUserRegistration(JSON.parse(body || '{}'));
        } else if (action === 'login') {
          return await handleUserLogin(JSON.parse(body || '{}'));
        }
        break;
      
      case 'GET':
        if (action === 'profile') {
          return await handleGetProfile(headers);
        }
        break;
      
      case 'PUT':
        if (action === 'profile') {
          return await handleUpdateProfile(headers, JSON.parse(body || '{}'));
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
    console.error('User management error:', error);
    
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

async function handleUserRegistration(userData) {
  const { error, value } = userRegistrationSchema.validate(userData);
  
  if (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ 
        error: 'Validation error', 
        details: error.details 
      })
    };
  }

  const { email, name, extensionId, businessInfo } = value;
  
  // Check if user already exists
  if (users.has(email)) {
    return {
      statusCode: 409,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'User already exists' })
    };
  }

  // Create user
  const userId = uuidv4();
  const user = {
    id: userId,
    email,
    name,
    extensionId,
    businessInfo: businessInfo || {},
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    settings: {
      autoFill: true,
      notifications: true,
      analytics: true
    }
  };

  users.set(email, user);

  // Generate JWT token
  const token = jwt.sign(
    { userId, email, extensionId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessInfo: user.businessInfo,
        settings: user.settings
      },
      token
    })
  };
}

async function handleUserLogin(loginData) {
  const { error, value } = userLoginSchema.validate(loginData);
  
  if (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ 
        error: 'Validation error', 
        details: error.details 
      })
    };
  }

  const { email, extensionId } = value;
  const user = users.get(email);

  if (!user || user.extensionId !== extensionId) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  }

  // Update last active
  user.lastActive = new Date().toISOString();
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email, extensionId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessInfo: user.businessInfo,
        settings: user.settings
      },
      token
    })
  };
}

async function handleGetProfile(headers) {
  const token = headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email);
    
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'chrome-extension://*'
        },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          businessInfo: user.businessInfo,
          settings: user.settings,
          createdAt: user.createdAt,
          lastActive: user.lastActive
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
}

async function handleUpdateProfile(headers, updateData) {
  const token = headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email);
    
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'chrome-extension://*'
        },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Update user data
    if (updateData.name) user.name = updateData.name;
    if (updateData.businessInfo) {
      user.businessInfo = { ...user.businessInfo, ...updateData.businessInfo };
    }
    if (updateData.settings) {
      user.settings = { ...user.settings, ...updateData.settings };
    }
    
    user.lastActive = new Date().toISOString();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          businessInfo: user.businessInfo,
          settings: user.settings,
          lastActive: user.lastActive
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
}

exports.handler = handler;