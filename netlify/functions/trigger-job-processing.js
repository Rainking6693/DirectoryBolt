// Netlify Function: validates staff auth and triggers background processing
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  console.log('[trigger-job-processing] Function invoked', {
    httpMethod: event.httpMethod,
    bodyLength: event.body?.length,
    memoryUsage: `${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`
  });

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
    }

    const auth = event.headers.authorization || event.headers.Authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.substring('Bearer '.length) : auth;
    const expected = process.env.STAFF_API_KEY;

    if (!expected) {
      console.error('[trigger-job-processing] STAFF_API_KEY not configured');
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Server not configured' }) };
    }

    if (!token || token !== expected) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const { jobId, customerId } = event.body ? JSON.parse(event.body) : {};
    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'jobId required' }) };
    }

    // Fire-and-forget call to background function
    const fnUrl = `${process.env.URL || ''}/.netlify/functions/process-job-background`;
    console.log('[trigger-job-processing] Calling background function:', fnUrl);
    try {
      // Do not await; allow quick 202 return
      fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, customerId }),
      }).catch((e) => console.warn('[trigger-job-processing] background call failed', e?.message || e));
      console.log('[trigger-job-processing] Background function call initiated');
    } catch (e) {
      console.warn('[trigger-job-processing] background call error', e?.message || e);
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    console.log('[trigger-job-processing] Request completed successfully', {
      duration: `${duration}ms`,
      memoryDelta: `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024)}MB`
    });

    return {
      statusCode: 202,
      body: JSON.stringify({ success: true, message: 'Job queued' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (e) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    console.error('[trigger-job-processing] fatal error:', e?.message || e);
    console.error('[trigger-job-processing] Performance metrics:', {
      duration: `${duration}ms`,
      memoryDelta: `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024)}MB`,
      finalMemory: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e?.message || 'Internal Error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};