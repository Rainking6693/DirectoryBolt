const { Handler } = require('@netlify/functions');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'auto-bolt-secret-key';

// In-memory analytics storage (replace with actual database)
const analyticsData = {
  events: [],
  dailyStats: new Map(),
  userActivity: new Map(),
  directoryStats: new Map()
};

const handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
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
      case 'POST':
        if (action === 'track') {
          return await handleTrackEvent(headers, JSON.parse(body || '{}'));
        } else if (action === 'batch') {
          return await handleBatchEvents(headers, JSON.parse(body || '{}'));
        }
        break;
      
      case 'GET':
        if (action === 'stats') {
          return await handleGetStats(headers);
        } else if (action === 'dashboard') {
          return await handleGetDashboard(headers);
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
    console.error('Analytics error:', error);
    
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

async function handleTrackEvent(headers, eventData) {
  const userId = await getUserIdFromToken(headers);
  
  if (!userId && !eventData.anonymous) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Authentication required for non-anonymous events' })
    };
  }

  const event = {
    id: uuidv4(),
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    sessionId: eventData.sessionId || uuidv4(),
    eventType: eventData.eventType,
    eventName: eventData.eventName,
    properties: eventData.properties || {},
    metadata: {
      userAgent: headers['user-agent'],
      extensionVersion: eventData.extensionVersion,
      browserVersion: eventData.browserVersion,
      platform: eventData.platform
    }
  };

  // Store event
  analyticsData.events.push(event);

  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const dailyStat = analyticsData.dailyStats.get(today) || {
    date: today,
    totalEvents: 0,
    uniqueUsers: new Set(),
    eventTypes: new Map(),
    directories: new Map()
  };

  dailyStat.totalEvents++;
  if (userId) dailyStat.uniqueUsers.add(userId);
  
  const eventTypeCount = dailyStat.eventTypes.get(event.eventType) || 0;
  dailyStat.eventTypes.set(event.eventType, eventTypeCount + 1);

  if (event.properties.directoryId) {
    const directoryCount = dailyStat.directories.get(event.properties.directoryId) || 0;
    dailyStat.directories.set(event.properties.directoryId, directoryCount + 1);
  }

  analyticsData.dailyStats.set(today, dailyStat);

  // Update user activity
  if (userId) {
    const userActivity = analyticsData.userActivity.get(userId) || {
      userId,
      firstSeen: event.timestamp,
      lastSeen: event.timestamp,
      totalEvents: 0,
      eventTypes: new Map(),
      directories: new Set()
    };

    userActivity.lastSeen = event.timestamp;
    userActivity.totalEvents++;
    
    const userEventTypeCount = userActivity.eventTypes.get(event.eventType) || 0;
    userActivity.eventTypes.set(event.eventType, userEventTypeCount + 1);

    if (event.properties.directoryId) {
      userActivity.directories.add(event.properties.directoryId);
    }

    analyticsData.userActivity.set(userId, userActivity);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      eventId: event.id,
      timestamp: event.timestamp
    })
  };
}

async function handleBatchEvents(headers, batchData) {
  const { events } = batchData;
  
  if (!Array.isArray(events) || events.length === 0) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({ error: 'Invalid batch data' })
    };
  }

  const results = [];
  
  for (const eventData of events) {
    try {
      const result = await handleTrackEvent(headers, eventData);
      const responseData = JSON.parse(result.body);
      results.push({
        success: result.statusCode === 200,
        eventId: responseData.eventId,
        error: responseData.error
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      processed: results.length,
      results
    })
  };
}

async function handleGetStats(headers) {
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

  const userActivity = analyticsData.userActivity.get(userId);
  
  if (!userActivity) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'chrome-extension://*'
      },
      body: JSON.stringify({
        success: true,
        stats: {
          totalEvents: 0,
          directoriesUsed: 0,
          firstUsed: null,
          lastUsed: null,
          eventTypes: {}
        }
      })
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
      stats: {
        totalEvents: userActivity.totalEvents,
        directoriesUsed: userActivity.directories.size,
        firstUsed: userActivity.firstSeen,
        lastUsed: userActivity.lastSeen,
        eventTypes: Object.fromEntries(userActivity.eventTypes)
      }
    })
  };
}

async function handleGetDashboard(headers) {
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

  // Calculate dashboard metrics
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const weeklyStats = last7Days.map(date => {
    const dailyStat = analyticsData.dailyStats.get(date);
    return {
      date,
      events: dailyStat ? dailyStat.totalEvents : 0,
      users: dailyStat ? dailyStat.uniqueUsers.size : 0
    };
  });

  const totalEvents = analyticsData.events.length;
  const totalUsers = analyticsData.userActivity.size;
  const activeToday = analyticsData.dailyStats.get(new Date().toISOString().split('T')[0])?.uniqueUsers.size || 0;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'chrome-extension://*'
    },
    body: JSON.stringify({
      success: true,
      dashboard: {
        overview: {
          totalEvents,
          totalUsers,
          activeToday
        },
        weeklyStats,
        topDirectories: getTopDirectories(),
        recentActivity: getRecentActivity(userId)
      }
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

function getTopDirectories() {
  const directoryCounts = new Map();
  
  analyticsData.events.forEach(event => {
    if (event.properties.directoryId) {
      const count = directoryCounts.get(event.properties.directoryId) || 0;
      directoryCounts.set(event.properties.directoryId, count + 1);
    }
  });

  return Array.from(directoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([directoryId, count]) => ({ directoryId, count }));
}

function getRecentActivity(userId) {
  return analyticsData.events
    .filter(event => event.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .map(event => ({
      timestamp: event.timestamp,
      eventType: event.eventType,
      eventName: event.eventName,
      directoryId: event.properties.directoryId
    }));
}

exports.handler = handler;