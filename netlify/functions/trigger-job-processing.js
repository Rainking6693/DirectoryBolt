// Netlify Function: validates staff auth and triggers background processing
const fetch = require('node-fetch');

exports.handler = async (event) => {
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
    try {
      // Do not await; allow quick 202 return
      fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, customerId }),
      }).catch((e) => console.warn('[trigger-job-processing] background call failed', e?.message || e));
    } catch (e) {
      console.warn('[trigger-job-processing] background call error', e?.message || e);
    }

    return { statusCode: 202, body: JSON.stringify({ success: true, message: 'Job queued' }) };
  } catch (e) {
    console.error('[trigger-job-processing] fatal', e?.message || e);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e?.message || 'Internal Error' }) };
  }
};