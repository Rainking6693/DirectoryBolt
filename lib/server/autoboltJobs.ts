import { createSupabaseAdminClient } from './supabaseAdmin'

export type JobStatus = 'pending' | 'in_progress' | 'complete' | 'failed'

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
    id: string
    customerId: string
    packageSize: number
    priorityLevel: number
    status: JobStatus
    metadata: Record<string, unknown> | null
    createdAt: string
    startedAt: string
  }
  customer: Record<string, unknown> | null
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
  const supabase = createSupabaseAdminClient()

  const { data: pendingJob, error: pendingError } = await supabase
    .from('jobs')
    .select('id, customer_id, package_size, priority_level, status, metadata, created_at')
    .eq('status', 'pending')
    .order('priority_level', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    throw new Error(`Failed to fetch pending job: ${pendingError.message}`)
  }

  if (!pendingJob) {
    return null
  }

  const startedAt = new Date().toISOString()
  const { error: updateError, data: updatedJob } = await supabase
    .from('jobs')
    .update({ status: 'in_progress', started_at: startedAt, updated_at: startedAt })
    .eq('id', pendingJob.id)
    .eq('status', 'pending')
    .select('id, customer_id, package_size, priority_level, metadata, created_at')
    .maybeSingle()

  if (updateError) {
    throw new Error(`Failed to mark job in progress: ${updateError.message}`)
  }

  // Race condition: another worker may have claimed job in between
  if (!updatedJob) {
    return await getNextPendingJob()
  }

  const { data: customer, error: customerError } = await supabase
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

  if (customerError) {
    throw new Error(`Failed to fetch customer for job ${updatedJob.id}: ${customerError.message}`)
  }

  return {
    job: {
      id: updatedJob.id,
      customerId: updatedJob.customer_id,
      packageSize: updatedJob.package_size,
      priorityLevel: updatedJob.priority_level,
      status: 'in_progress',
      metadata: updatedJob.metadata || null,
      createdAt: updatedJob.created_at,
      startedAt
    },
    customer: customer ?? null
  }
}

export async function updateJobProgress(options: {
  jobId: string
  directoryResults?: DirectoryResultInput[]
  status?: string
  errorMessage?: string
}) {
  const { jobId, directoryResults = [], status, errorMessage } = options
  const canonicalStatus = normalizeJobStatus(status)
  const supabase = createSupabaseAdminClient()

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, package_size, status')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  if (job.status !== 'in_progress' && job.status !== 'pending') {
    throw new Error(`Job status is ${job.status}, expected in_progress or pending`)
  }

  if (directoryResults.length > 0) {
    const nowIso = new Date().toISOString()
    const rows = directoryResults.map((result) => {
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

    const { error: insertError } = await supabase
      .from('job_results')
      .upsert(rows, { onConflict: 'job_id,directory_name' })

    if (insertError) {
      throw new Error(`Failed to upsert job results: ${insertError.message}`)
    }
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

    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`)
    }
  }

  const { data: progressRows, error: progressError } = await supabase
    .from('job_results')
    .select('status')
    .eq('job_id', jobId)

  if (progressError) {
    throw new Error(`Failed to compute job progress: ${progressError.message}`)
  }

  const completed = progressRows?.filter((row) => row.status === 'submitted').length || 0
  const failed = progressRows?.filter((row) => row.status === 'failed').length || 0
  const processed = progressRows?.length || 0
  const total = job.package_size || 0
  const progressPercentage = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0

  return {
    jobId,
    progressPercentage,
    directoriesCompleted: completed,
    directoriesFailed: failed,
    resultsAdded: directoryResults.length
  }
}
export async function completeJob(options: {
  jobId: string
  finalStatus?: string
  errorMessage?: string
  summary?: JobSummary
}) {
  const { jobId, finalStatus, errorMessage, summary } = options
  const canonicalStatus = normalizeJobStatus(finalStatus) ?? 'complete'
  const supabase = createSupabaseAdminClient()

  const completedAt = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: canonicalStatus,
    completed_at: completedAt,
    updated_at: completedAt
  }

  if (errorMessage) {
    updatePayload['error_message'] = errorMessage
  }

  const { data: updatedJob, error: updateError } = await supabase
    .from('jobs')
    .update(updatePayload)
    .eq('id', jobId)
    .eq('status', 'in_progress')
    .select('id, customer_id, package_size, started_at, created_at')
    .maybeSingle()

  if (updateError) {
    throw new Error(`Failed to complete job: ${updateError.message}`)
  }

  if (!updatedJob) {
    throw new Error('Job not found or not in progress')
  }

  const { data: results, error: resultsError } = await supabase
    .from('job_results')
    .select('status')
    .eq('job_id', jobId)

  if (resultsError) {
    throw new Error(`Failed to fetch job results: ${resultsError.message}`)
  }

  const completed = results?.filter((row) => row.status === 'submitted').length || 0
  const failed = results?.filter((row) => row.status === 'failed').length || 0
  const total = updatedJob.package_size || summary?.totalDirectories || 0
  const totalProcessingTime = summary?.processingTimeSeconds || 0

  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
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
}

export async function getQueueSnapshot(): Promise<JobProgressSnapshot> {
  const supabase = createSupabaseAdminClient()

  const { data: jobs, error: jobsError } = await supabase
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

  if (jobsError) {
    throw new Error(`Failed to load jobs: ${jobsError.message}`)
  }

  const jobIds = jobs?.map((job) => job.id) || []
  let resultsByJob: Record<string, { completed: number; failed: number; total: number }> = {}

  if (jobIds.length > 0) {
    const { data: results, error: resultsError } = await supabase
      .from('job_results')
      .select('job_id, status')
      .in('job_id', jobIds)

    if (resultsError) {
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
    const stats = resultsByJob[job.id] || { completed: 0, failed: 0, total: 0 }
    const total = job.package_size || stats.total
    const processed = stats.total
    const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0
    const status = normalizeJobStatus(job.status as string) ?? 'pending'

    return {
      id: job.id,
      customerId: job.customer_id,
      businessName: job.customers?.business_name || null,
      email: job.customers?.email || null,
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

  return { jobs: queueJobs, stats }
}









