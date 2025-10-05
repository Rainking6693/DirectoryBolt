import type { Handler } from '@netlify/functions'
import { getNextPendingJob, markJobInProgress } from '../../lib/server/autoboltJobs'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  if (!authorize(event.headers.authorization)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const next = await getNextPendingJob()
    if (!next) {
      return { statusCode: 200, body: JSON.stringify({ job: null }) }
    }

    // Claim explicitly (getNextPendingJob may already set to in_progress; this makes it idempotent)
    await markJobInProgress(next.job.id)

    // Build response object enriched with customer fields
    const directoryLimitByPackage: Record<string, number> = {
      starter: 50,
      growth: 150,
      professional: 300,
      enterprise: 500,
      pro: 500
    }

    const jobPayload = {
      id: next.job.id,
      customer_id: next.job.customerId,
      package_size: next.job.packageSize,
      priority_level: next.job.priorityLevel,
      status: next.job.status,
      created_at: next.job.createdAt,
      started_at: next.job.startedAt,
      // customer fields
      business_name: (next.customer as any)?.business_name || null,
      email: (next.customer as any)?.email || null,
      phone: (next.customer as any)?.phone || null,
      website: (next.customer as any)?.website || null,
      address: (next.customer as any)?.address || null,
      city: (next.customer as any)?.city || null,
      state: (next.customer as any)?.state || null,
      zip: (next.customer as any)?.zip || null,
      description: (next.customer as any)?.description || null,
      category: (next.customer as any)?.category || null,
      package_type: next.job.packageSize, // kept for compatibility
      directory_limit: directoryLimitByPackage[String(next.job.packageSize).toLowerCase()] || next.job.packageSize || 50
    }

    return { statusCode: 200, body: JSON.stringify({ job: jobPayload }) }
  } catch (e:any) {
    console.error('jobs-next error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Internal error' }) }
  }
}

export { handler }
