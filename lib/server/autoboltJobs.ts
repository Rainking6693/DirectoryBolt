import { createSupabaseAdminClient } from './supabaseAdmin'
import { logInfo, logWarn, logError, serializeError } from './logging'

import type {
  DirectoryBoltSupabaseClient,
  JobResultsInsert,
  JobResultsRow,
  JobsRow,
  JobStatus,
} from '../../types/supabase'

export type { JobStatus } from '../../types/supabase'

const QUERY_TIMEOUT_MS = 10_000

type QueryExecutor<T> = () => Promise<T>

function getClientOrThrow(functionName: string): DirectoryBoltSupabaseClient {
  const client = createSupabaseAdminClient()
  if (!client) {
    logError(functionName, 'Supabase client unavailable')
    throw new Error('Supabase client unavailable')
  }
  return client
}

async function executeSupabaseQuery<T>(
  functionName: string,
  label: string,
  executor: QueryExecutor<T>
): Promise<T> {
  const started = Date.now()
  logInfo(functionName, `Executing query: ${label}`)
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Query timeout after ${QUERY_TIMEOUT_MS}ms (${label})`))
    }, QUERY_TIMEOUT_MS)
  })

  try {
    const result = await Promise.race([executor(), timeoutPromise])
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
    const duration = Date.now() - started
    const meta: Record<string, unknown> = { durationMs: duration }
    if (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>)) {
      const data = (result as Record<string, unknown>).data
      if (Array.isArray(data)) {
        meta.rows = data.length
      } else {
        meta.hasData = Boolean(data)
      }
    }
    logInfo(functionName, `Query completed: ${label}`, meta)
    return result as T
  } catch (error) {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
    const duration = Date.now() - started
    logError(functionName, `Query failed: ${label}`, {
      durationMs: duration,
      error: serializeError(error)
    })
    throw error
  }
}

function logFunctionStart(functionName: string, meta?: Record<string, unknown>) {
  logInfo(functionName, 'Started', meta)
}
function coerceString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value)
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}


export interface DirectoryResultInput {
  directoryName: string
  status: 'pending' | 'processing' | 'submitted' | 'approved' | 'rejected' | 'failed' | 'skipped' | 'retry' | 'retrying'
  directoryUrl?: string
  directoryCategory?: string
  directoryTier?: 'standard' | 'premium' | 'enterprise'
  listingUrl?: string
  responseLog?: Record<string, unknown>
  submissionResult?: string
  rejectionReason?: string
  processingTimeSeconds?: number
}

export interface JobSummary {
  totalDirectories?: number
  successfulSubmissions?: number
  failedSubmissions?: number
  processingTimeSeconds?: number
}

export interface NextJobResponse {
  job: {
    id: string;
    customerId: string;
    businessName: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    category: string;
    packageType: string;
    directoryLimit: number;
    packageSize: number;
    priorityLevel: number;
    status: JobStatus;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
    metadata: Record<string, unknown> | null;
  };
  customer: Record<string, unknown> | null;
}

export interface JobProgressSnapshot {
  jobs: Array<{
    id: string
    customerId: string
    businessName: string | null
    email: string | null
    packageSize: number
    priorityLevel: number
    status: JobStatus
    createdAt: string
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
    directoriesTotal: number
    directoriesCompleted: number
    directoriesFailed: number
    progressPercentage: number
  }>
  stats: {
    totalJobs: number
    pendingJobs: number
    inProgressJobs: number
    completedJobs: number
    failedJobs: number
    totalDirectories: number
    completedDirectories: number
    failedDirectories: number
    successRate: number
  }
}

export function normalizeJobStatus(input?: string | null): JobStatus | null {
  if (typeof input !== 'string') {
    return null
  }

  const value = input.trim().toLowerCase()
  if (!value) {
    return null
  }

  switch (value) {
    case 'pending':
      return 'pending'
    case 'in_progress':
    case 'in-progress':
    case 'processing':
    case 'submitted':
      return 'in_progress'
    case 'complete':
    case 'completed':
      return 'complete'
    case 'failed':
      return 'failed'
    default:
      return null
  }
}

function mapDirectoryStatus(status: DirectoryResultInput['status']): 'pending' | 'submitted' | 'failed' | 'retry' {
  if (status === 'submitted' || status === 'approved') {
    return 'submitted'
  }
  if (status === 'failed' || status === 'rejected') {
    return 'failed'
  }
  if (status === 'retry' || status === 'retrying') {
    return 'retry'
  }
  return 'pending'
}

export async function getNextPendingJob(): Promise<NextJobResponse | null> {
  const fn = 'autoboltJobs.getNextPendingJob'
  logFunctionStart(fn)
  const supabase = getClientOrThrow(fn)

  const pendingResponse = await executeSupabaseQuery(fn, 'jobs.select pending limit 1', () =>
    supabase
      .from('jobs')
      .select('id, customer_id, package_size, priority_level, status, metadata, created_at, business_name, email, phone, website, address, city, state, zip, description, category, package_type, directory_limit')
      .eq('status', 'pending')
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
  )

  const { data: pendingJob, error: pendingError } = pendingResponse
  if (pendingError) {
    logError(fn, 'Error selecting pending job', { error: serializeError(pendingError) })
    throw new Error(`Failed to fetch pending job: ${pendingError.message}`)
  }

  if (!pendingJob) {
    logInfo(fn, 'No pending jobs available')
    return null
  }

  const startedAt = new Date().toISOString()
  const updateResponse = await executeSupabaseQuery(fn, 'jobs.update set in_progress', () =>
    supabase
      .from('jobs')
      .update({ status: 'in_progress', started_at: startedAt, updated_at: startedAt })
      .eq('id', pendingJob.id)
      .eq('status', 'pending')
      .select('id, customer_id, package_size, priority_level, metadata, created_at, updated_at, business_name, email, phone, website, address, city, state, zip, description, category, package_type, directory_limit')
      .maybeSingle()
  )

  const { data: updatedJob, error: updateError } = updateResponse
  if (updateError) {
    logError(fn, 'Error updating job status', { error: serializeError(updateError), jobId: pendingJob.id })
    throw new Error(`Failed to mark job in progress: ${updateError.message}`)
  }

  if (!updatedJob) {
    logWarn(fn, 'Job already claimed by another worker, retrying', { jobId: pendingJob.id })
    return await getNextPendingJob()
  }

  const customerResponse = await executeSupabaseQuery(fn, 'customers.select by id', () =>
    supabase
      .from('customers')
      .select(`
        id,
        business_name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        website,
        description,
        facebook,
        instagram,
        linkedin
      `)
      .eq('id', updatedJob.customer_id)
      .maybeSingle()
  )

  const { data: customer, error: customerError } = customerResponse
  if (customerError) {
    logError(fn, 'Error fetching customer for job', {
      jobId: updatedJob.id,
      error: serializeError(customerError)
    })
    throw new Error(`Failed to fetch customer for job ${updatedJob.id}: ${customerError.message}`)
  }

  const customerRecord = (customer ?? {}) as Record<string, unknown>
  const businessName = coerceString((updatedJob as any).business_name ?? customerRecord['business_name'])
  const email = coerceString((updatedJob as any).email ?? customerRecord['email'])
  const phone = coerceString((updatedJob as any).phone ?? customerRecord['phone'])
  const website = coerceString((updatedJob as any).website ?? customerRecord['website'])
  const address = coerceString((updatedJob as any).address ?? customerRecord['address'])
  const city = coerceString((updatedJob as any).city ?? customerRecord['city'])
  const state = coerceString((updatedJob as any).state ?? customerRecord['state'])
  const zip = coerceString((updatedJob as any).zip ?? customerRecord['zip'])
  const description = coerceString((updatedJob as any).description ?? customerRecord['description'])
  const category = coerceString((updatedJob as any).category ?? customerRecord['category'])
  const packageType = coerceString((updatedJob as any).package_type ?? 'starter') || 'starter'
  const directoryLimit = Math.max(1, coerceNumber((updatedJob as any).directory_limit, 50))
  const updatedAt = coerceString((updatedJob as any).updated_at ?? startedAt)

  logInfo(fn, 'Job row normalized', { jobId: updatedJob.id, packageType, directoryLimit })
  logInfo(fn, 'Returning job for worker', { jobId: updatedJob.id })
  return {
    job: {
      id: updatedJob.id,
      customerId: coerceString(updatedJob.customer_id),
      packageSize: coerceNumber(updatedJob.package_size, 0),
      priorityLevel: coerceNumber(updatedJob.priority_level, 0),
      businessName,
      email,
      phone,
      website,
      address,
      city,
      state,
      zip,
      description,
      category,
      packageType,
      directoryLimit,
      status: 'in_progress',
      createdAt: coerceString(updatedJob.created_at),
      updatedAt,
      metadata: updatedJob.metadata || null,
      startedAt: startedAt,
    },
    customer: customer ?? null,
  }
}

export async function updateJobProgress(options: {
  jobId: string
  directoryResults: DirectoryResultInput[]
  canonicalStatus?: JobStatus | null
  errorMessage?: string | null
}) {
  const fn = 'autoboltJobs.updateJobProgress'
  const { jobId, directoryResults, canonicalStatus, errorMessage } = options
  logFunctionStart(fn, { jobId, resultsCount: directoryResults.length, status: canonicalStatus })

  const supabase = getClientOrThrow(fn)

  const jobResponse = await executeSupabaseQuery(fn, 'jobs.select for progress update', () =>
    supabase
      .from('jobs')
      .select('id, status, package_size')
      .eq('id', jobId)
      .maybeSingle()
  )

  const { data: job, error: jobError } = jobResponse
  if (jobError || !job) {
    logError(fn, 'Job not found during progress update', { jobId, error: serializeError(jobError) })
    throw new Error('Job not found')
  }

  if (job.status !== 'in_progress' && job.status !== 'pending') {
    logWarn(fn, 'Job status not eligible for progress update', { jobId, status: job.status })
    throw new Error(`Job status is ${job.status}, expected in_progress or pending`)
  }

  if (directoryResults.length > 0) {
    const nowIso = new Date().toISOString()
    const rows: JobResultsInsert[] = directoryResults.map((result) => {
      const responseLog: Record<string, unknown> = {}
      if (result.responseLog && typeof result.responseLog === 'object') {
        Object.assign(responseLog, result.responseLog)
      }
      if (result.submissionResult) {
        responseLog['submission_result'] = result.submissionResult
      }
      if (result.listingUrl) {
        responseLog['listing_url'] = result.listingUrl
      }
      if (result.directoryUrl) {
        responseLog['directory_url'] = result.directoryUrl
      }
      if (result.directoryCategory) {
        responseLog['directory_category'] = result.directoryCategory
      }
      if (result.directoryTier) {
        responseLog['directory_tier'] = result.directoryTier
      }
      if (result.rejectionReason) {
        responseLog['rejection_reason'] = result.rejectionReason
      }
      if (typeof result.processingTimeSeconds === 'number') {
        responseLog['processing_time_seconds'] = result.processingTimeSeconds
      }

      const normalizedResultStatus = mapDirectoryStatus(result.status)

      return {
        job_id: jobId,
        directory_name: result.directoryName,
        status: normalizedResultStatus,
        response_log: Object.keys(responseLog).length > 0 ? responseLog : null,
        submitted_at: normalizedResultStatus === 'submitted' ? nowIso : null,
        retry_count: normalizedResultStatus === 'retry' ? 1 : 0,
        updated_at: nowIso
      }
    })

    await executeSupabaseQuery(fn, 'job_results.upsert directory results', () =>
      supabase.from('job_results').upsert(rows, { onConflict: 'job_id,directory_name' })
    )
    logInfo(fn, 'Directory results upserted', { count: rows.length })
  }

  if (canonicalStatus || errorMessage) {
    const updateTimestamp = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      updated_at: updateTimestamp
    }

    if (canonicalStatus) {
      updateData['status'] = canonicalStatus
    }
    if (errorMessage) {
      updateData['error_message'] = errorMessage
    }

    await executeSupabaseQuery(fn, 'jobs.update progress status/error', () =>
      supabase.from('jobs').update(updateData).eq('id', jobId)
    )
    logInfo(fn, 'Job metadata updated', { jobId, status: canonicalStatus, hasError: Boolean(errorMessage) })
  }

  const progressResponse = await executeSupabaseQuery(fn, 'job_results.select progress summary', () =>
    supabase
      .from('job_results')
      .select('status')
      .eq('job_id', jobId)
  )

  const { data: progressRows, error: progressError } = progressResponse
  if (progressError) {
    logError(fn, 'Failed to compute job progress', { jobId, error: serializeError(progressError) })
    throw new Error(`Failed to compute job progress: ${progressError.message}`)
  }

  const completed = progressRows?.filter((row) => row.status === 'submitted').length || 0
  const failed = progressRows?.filter((row) => row.status === 'failed').length || 0
  const processed = progressRows?.length || 0
  const total = job.package_size || 0
  const progressPercentage = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0

  const summary = {
    jobId,
    progressPercentage,
    directoriesCompleted: completed,
    directoriesFailed: failed,
    resultsAdded: directoryResults.length
  }

  logInfo(fn, 'Progress computation complete', summary)
  return summary
}

export async function completeJob(options: {
  jobId: string
  finalStatus?: string
  errorMessage?: string
  summary?: JobSummary
}) {
  const fn = 'autoboltJobs.completeJob'
  const { jobId, finalStatus, errorMessage, summary } = options
  logFunctionStart(fn, { jobId, finalStatus, hasSummary: Boolean(summary) })

  const canonicalStatus = normalizeJobStatus(finalStatus) ?? 'complete'
  const supabase = getClientOrThrow(fn)
  const completedAt = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: canonicalStatus,
    completed_at: completedAt,
    updated_at: completedAt
  }

  if (errorMessage) {
    updatePayload['error_message'] = errorMessage
  }

  const updateResponse = await executeSupabaseQuery(fn, 'jobs.update complete job', () =>
    supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .eq('status', 'in_progress')
      .select('id, customer_id, package_size, started_at, created_at')
      .maybeSingle()
  )

  const { data: updatedJob, error: updateError } = updateResponse
  if (updateError) {
    logError(fn, 'Failed to complete job', { jobId, error: serializeError(updateError) })
    throw new Error(`Failed to complete job: ${updateError.message}`)
  }

  if (!updatedJob) {
    logError(fn, 'Job not found or not in progress', { jobId })
    throw new Error('Job not found or not in progress')
  }

  const resultsResponse = await executeSupabaseQuery(fn, 'job_results.select for completion', () =>
    supabase
      .from('job_results')
      .select('status')
      .eq('job_id', jobId)
  )

  const { data: results, error: resultsError } = resultsResponse
  if (resultsError) {
    logError(fn, 'Failed to fetch job results during completion', { jobId, error: serializeError(resultsError) })
    throw new Error(`Failed to fetch job results: ${resultsError.message}`)
  }

  const completed = results?.filter((row) => row.status === 'submitted').length || 0
  const failed = results?.filter((row) => row.status === 'failed').length || 0
  const total = updatedJob.package_size || summary?.totalDirectories || 0
  const totalProcessingTime = summary?.processingTimeSeconds || 0
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const payload = {
    jobId,
    customerId: updatedJob.customer_id,
    finalStatus: canonicalStatus,
    completedAt,
    statistics: {
      totalDirectories: total,
      successfulSubmissions: completed,
      failedSubmissions: failed,
      processingTimeSeconds: totalProcessingTime,
      successRate
    }
  }

  logInfo(fn, 'Job completion summary prepared', payload)
  return payload
}

export async function getQueueSnapshot(): Promise<JobProgressSnapshot> {
  const fn = 'autoboltJobs.getQueueSnapshot'
  logFunctionStart(fn)
  const supabase = getClientOrThrow(fn)

  const jobsResponse = await executeSupabaseQuery(fn, 'jobs.select queue snapshot', () =>
    supabase
      .from('jobs')
      .select(`
        id,
        customer_id,
        package_size,
        priority_level,
        status,
        created_at,
        started_at,
        completed_at,
        error_message,
        customers ( business_name, email )
      `)
      .order('created_at', { ascending: true })
  )

  const { data: jobs, error: jobsError } = jobsResponse
  if (jobsError) {
    logError(fn, 'Failed to load jobs for snapshot', { error: serializeError(jobsError) })
    throw new Error(`Failed to load jobs: ${jobsError.message}`)
  }

  const jobIds = jobs?.map((job) => job.id) || []
  let resultsByJob: Record<string, { completed: number; failed: number; total: number }> = {}

  if (jobIds.length > 0) {
    const resultsResponse = await executeSupabaseQuery(fn, 'job_results.select snapshot aggregation', () =>
      supabase
        .from('job_results')
        .select('job_id, status')
        .in('job_id', jobIds)
    )

    const { data: results, error: resultsError } = resultsResponse
    if (resultsError) {
      logError(fn, 'Failed to load job results for snapshot', { error: serializeError(resultsError) })
      throw new Error(`Failed to load job results: ${resultsError.message}`)
    }

    resultsByJob = (results || []).reduce<Record<string, { completed: number; failed: number; total: number }>>((acc, row) => {
      const current = acc[row.job_id] || { completed: 0, failed: 0, total: 0 }
      current.total += 1
      if (row.status === 'submitted') current.completed += 1
      if (row.status === 'failed') current.failed += 1
      acc[row.job_id] = current
      return acc
    }, {})
  }

  const queueJobs = (jobs || []).map((job) => {
    const customerData = Array.isArray(job.customers) ? job.customers[0] : job.customers
    const stats = resultsByJob[job.id] || { completed: 0, failed: 0, total: 0 }
    const total = job.package_size || stats.total
    const processed = stats.total
    const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0
    const status = normalizeJobStatus(job.status as string) ?? 'pending'

    return {
      id: job.id,
      customerId: job.customer_id,
      businessName: customerData?.business_name ?? null,
      email: customerData?.email ?? null,
      packageSize: job.package_size,
      priorityLevel: job.priority_level,
      status,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
      directoriesTotal: total,
      directoriesCompleted: stats.completed,
      directoriesFailed: stats.failed,
      progressPercentage: progress
    }
  })

  const stats = queueJobs.reduce<JobProgressSnapshot['stats']>((acc, job) => {
    acc.totalJobs += 1
    acc.totalDirectories += job.directoriesTotal
    acc.completedDirectories += job.directoriesCompleted
    acc.failedDirectories += job.directoriesFailed

    if (job.status === 'pending') acc.pendingJobs += 1
    if (job.status === 'in_progress') acc.inProgressJobs += 1
    if (job.status === 'complete') acc.completedJobs += 1
    if (job.status === 'failed') acc.failedJobs += 1

    return acc
  }, {
    totalJobs: 0,
    pendingJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalDirectories: 0,
    completedDirectories: 0,
    failedDirectories: 0,
    successRate: 0
  })

  stats.successRate = stats.totalDirectories > 0
    ? Math.round((stats.completedDirectories / stats.totalDirectories) * 100)
    : 0

  const snapshot = { jobs: queueJobs, stats }
  logInfo(fn, 'Queue snapshot prepared', {
    jobCount: queueJobs.length,
    pendingJobs: stats.pendingJobs,
    inProgressJobs: stats.inProgressJobs
  })
  return snapshot
}

export async function markJobInProgress(jobId: string) {
  const fn = 'autoboltJobs.markJobInProgress'
  logFunctionStart(fn, { jobId })
  const supabase = getClientOrThrow(fn)
  const startedAt = new Date().toISOString()

  const response = await executeSupabaseQuery(fn, 'jobs.update mark in progress', () =>
    supabase
      .from('jobs')
      .update({ status: 'in_progress', started_at: startedAt, updated_at: startedAt })
      .eq('id', jobId)
      .select('id, status, started_at')
      .maybeSingle()
  )

  const { data, error } = response
  if (error) {
    logError(fn, 'Failed to mark job in progress', { jobId, error: serializeError(error) })
    throw new Error(`Failed to mark job in progress: ${error.message}`)
  }

  logInfo(fn, 'Job marked in progress', { jobId })
  return data
}

export async function retryFailedJob(jobId: string) {
  const fn = 'autoboltJobs.retryFailedJob'
  logFunctionStart(fn, { jobId })
  const supabase = getClientOrThrow(fn)
  const now = new Date().toISOString()

  const fetchResponse = await executeSupabaseQuery(fn, 'jobs.select for retry', () =>
    supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle()
  )

  const { data: job, error: fetchErr } = fetchResponse
  if (fetchErr) {
    logError(fn, 'Failed to fetch job for retry', { jobId, error: serializeError(fetchErr) })
    throw new Error(`Failed to fetch job for retry: ${fetchErr.message}`)
  }
  if (!job) {
    logWarn(fn, 'Job not found for retry', { jobId })
    throw new Error('Job not found')
  }

  const updateResponse = await executeSupabaseQuery(fn, 'jobs.update reset status to pending', () =>
    supabase
      .from('jobs')
      .update({ status: 'pending', started_at: null, completed_at: null, updated_at: now, error_message: null })
      .eq('id', jobId)
      .select('id, status')
      .maybeSingle()
  )

  const { data: updated, error: updateErr } = updateResponse
  if (updateErr) {
    logError(fn, 'Failed to reset job for retry', { jobId, error: serializeError(updateErr) })
    throw new Error(`Failed to reset job for retry: ${updateErr.message}`)
  }

  logInfo(fn, 'Job reset for retry', { jobId, status: updated?.status })
  return updated
}



