import { supabase, handleSupabaseError, handleSuccess, getCorsHeaders } from './_supabaseClient.js';

// /api/autobolt-status - Real-time AutoBolt system status and heartbeat monitoring
// Staff dashboard endpoint for monitoring worker activity and queue status

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders()
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // TODO: Add staff authentication validation here
    // const staffToken = event.headers['x-staff-token'];
    // const isValidStaff = await validateStaffAccess(staffToken);
    // if (!isValidStaff) return unauthorized response

    console.log('Fetching AutoBolt system status...');

    // Parallel queries for comprehensive status
    const [
      queueStatsResult,
      activeWorkersResult,
      recentCompletionsResult,
      systemMetricsResult
    ] = await Promise.all([
      // Queue statistics
      supabase
        .from('jobs')
        .select('status, package_size, priority_level, created_at, updated_at, metadata')
        .order('created_at', { ascending: false }),

      // Active workers (jobs in_progress in last 5 minutes)
      supabase
        .from('jobs')
        .select('metadata, status, updated_at, customer_id')
        .eq('status', 'in_progress')
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),

      // Recent completions (last 24 hours)
      supabase
        .from('jobs')
        .select('status, completed_at, metadata')
        .eq('status', 'complete')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // System performance metrics from job_results
      supabase
        .from('job_results')
        .select('status, submitted_at, response_log')
        .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Process queue statistics
    const queueStats = queueStatsResult.data || [];
    const queueByStatus = {
      pending: queueStats.filter(job => job.status === 'pending').length,
      in_progress: queueStats.filter(job => job.status === 'in_progress').length,
      complete: queueStats.filter(job => job.status === 'complete').length,
      failed: queueStats.filter(job => job.status === 'failed').length
    };

    const queueByPriority = {
      enterprise: queueStats.filter(job => job.priority_level === 1).length,
      professional: queueStats.filter(job => job.priority_level === 2).length,
      growth: queueStats.filter(job => job.priority_level === 3).length,
      starter: queueStats.filter(job => job.priority_level === 4).length
    };

    // Process active workers
    const activeWorkers = activeWorkersResult.data || [];
    const workerMetrics = {};
    
    activeWorkers.forEach(job => {
      const workerId = job.metadata?.processed_by || 'unknown-worker';
      if (!workerMetrics[workerId]) {
        workerMetrics[workerId] = {
          workerId: workerId,
          activeJobs: 0,
          averageProgress: 0,
          lastActivity: job.updated_at
        };
      }
      workerMetrics[workerId].activeJobs++;
      workerMetrics[workerId].averageProgress += (job.metadata?.progress_percentage || 0);
      if (new Date(job.updated_at) > new Date(workerMetrics[workerId].lastActivity)) {
        workerMetrics[workerId].lastActivity = job.updated_at;
      }
    });

    // Calculate average progress for each worker
    Object.values(workerMetrics).forEach(worker => {
      if (worker.activeJobs > 0) {
        worker.averageProgress = Math.round(worker.averageProgress / worker.activeJobs);
      }
    });

    // Process recent completions
    const recentCompletions = recentCompletionsResult.data || [];
    const completionStats = {
      totalCompleted: recentCompletions.length,
      averageProcessingTime: 0,
      totalSuccessfulSubmissions: 0,
      totalFailedSubmissions: 0
    };

    if (recentCompletions.length > 0) {
      const totalProcessingTime = recentCompletions
        .filter(job => job.metadata?.processing_time_ms)
        .reduce((sum, job) => sum + (job.metadata?.processing_time_ms || 0), 0);
      
      const validProcessingTimes = recentCompletions.filter(job => job.metadata?.processing_time_ms).length;
      if (validProcessingTimes > 0) {
        completionStats.averageProcessingTime = Math.round(totalProcessingTime / validProcessingTimes);
      }

      completionStats.totalSuccessfulSubmissions = recentCompletions
        .reduce((sum, job) => sum + (job.metadata?.successful_submissions || 0), 0);

      completionStats.totalFailedSubmissions = recentCompletions
        .reduce((sum, job) => sum + (job.metadata?.failed_submissions || 0), 0);
    }

    // Calculate system health score (0-100)
    const healthFactors = {
      queueHealth: Math.min(100, Math.max(0, 100 - (queueByStatus.failed) * 10)),
      workerHealth: Object.keys(workerMetrics).length > 0 ? 100 : 50,
      processingHealth: queueByStatus.in_progress > 0 ? 100 : 75,
      completionRate: recentCompletions.length > 0 ? Math.min(100, completionStats.totalSuccessfulSubmissions / (completionStats.totalSuccessfulSubmissions + completionStats.totalFailedSubmissions) * 100) : 90
    };

    const systemHealth = Math.round(
      (healthFactors.queueHealth + healthFactors.workerHealth + healthFactors.processingHealth + healthFactors.completionRate) / 4
    );

    // Compile comprehensive status response
    const statusResponse = {
      timestamp: new Date().toISOString(),
      systemHealth: {
        score: systemHealth,
        status: systemHealth >= 90 ? 'excellent' : systemHealth >= 75 ? 'good' : systemHealth >= 50 ? 'warning' : 'critical',
        factors: healthFactors
      },
      queue: {
        total: queueStats.length,
        byStatus: queueByStatus,
        byPriority: queueByPriority,
        oldestPending: queueStats
          .filter(job => job.status === 'pending')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.created_at || null
      },
      workers: {
        active: Object.keys(workerMetrics).length,
        details: Object.values(workerMetrics)
      },
      performance: {
        last24Hours: completionStats,
        averageProcessingTime: completionStats.averageProcessingTime,
        successRate: completionStats.totalSuccessfulSubmissions + completionStats.totalFailedSubmissions > 0 
          ? Math.round((completionStats.totalSuccessfulSubmissions / (completionStats.totalSuccessfulSubmissions + completionStats.totalFailedSubmissions)) * 100)
          : 0
      },
      alerts: [] // TODO: Add alert logic for stuck jobs, failed workers, etc.
    };

    // Add alerts for concerning conditions
    if (queueByStatus.failed > 5) {
      statusResponse.alerts.push({
        type: 'warning',
        message: `${queueByStatus.failed} jobs have failed and may need attention`,
        action: 'Consider reviewing failed jobs and retrying if appropriate'
      });
    }

    if (queueByStatus.in_progress > 0 && Object.keys(workerMetrics).length === 0) {
      statusResponse.alerts.push({
        type: 'critical',
        message: 'Jobs marked as in_progress but no active workers detected',
        action: 'Check worker connectivity and restart if necessary'
      });
    }

    if (queueByStatus.pending > 20) {
      statusResponse.alerts.push({
        type: 'info',
        message: `${queueByStatus.pending} jobs are pending processing`,
        action: 'Consider scaling up workers if processing is slow'
      });
    }

    console.log(`System status: ${statusResponse.systemHealth.status} (${systemHealth}% health score)`);

    return handleSuccess(statusResponse, 'AutoBolt system status retrieved successfully');

  } catch (error) {
    console.error('Unexpected error in autobolt-status:', error);
    return handleSupabaseError(error, 'autobolt-status-handler');
  }
}

// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY