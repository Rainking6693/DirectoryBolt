import type { Handler, HandlerResponse } from "@netlify/functions";
import {
  supabase,
  handleSupabaseError,
  handleSuccess,
  getCorsHeaders,
  type JobsRow,
} from "./_supabaseClientTyped";

type JobStatus = "pending" | "in_progress" | "complete" | "failed";

type QueueRecord = JobsRow;

type WorkerRecord = Pick<
  JobsRow,
  "status" | "updated_at" | "customer_id" | "metadata"
>;

type CompletionRecord = Pick<JobsRow, "status" | "completed_at" | "metadata">;

interface WorkerMetric {
  workerId: string;
  activeJobs: number;
  averageProgress: number;
  lastActivity: string;
}

interface QueueStatusSummary {
  total: number;
  byStatus: Record<JobStatus, number>;
  byPriority: {
    enterprise: number;
    professional: number;
    growth: number;
    starter: number;
  };
  oldestPending: string | null;
}

interface CompletionStats {
  totalCompleted: number;
  averageProcessingTime: number;
  totalSuccessfulSubmissions: number;
  totalFailedSubmissions: number;
}

interface HealthFactors {
  queueHealth: number;
  workerHealth: number;
  processingHealth: number;
  completionRate: number;
}

interface StatusResponse {
  timestamp: string;
  systemHealth: {
    score: number;
    status: "excellent" | "good" | "warning" | "critical";
    factors: HealthFactors;
  };
  queue: QueueStatusSummary;
  workers: {
    active: number;
    details: WorkerMetric[];
  };
  performance: {
    last24Hours: CompletionStats;
    averageProcessingTime: number;
    successRate: number;
  };
  alerts: Array<{
    type: "info" | "warning" | "critical";
    message: string;
    action: string;
  }>;
}

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && !Number.isNaN(value) ? value : undefined;

const toMetadataRecord = (metadata: unknown): Record<string, unknown> | null => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
};

const getMetadataNumber = (
  metadata: unknown,
  key: string,
): number | undefined => {
  const record = toMetadataRecord(metadata);
  if (!record) {
    return undefined;
  }
  return asNumber(record[key]);
};

const getWorkerId = (metadata: Record<string, unknown> | null): string => {
  if (
    metadata &&
    typeof metadata === "object" &&
    typeof metadata.processed_by === "string"
  ) {
    return metadata.processed_by;
  }

  return "unknown-worker";
};

const computeQueueSummary = (records: QueueRecord[]): QueueStatusSummary => {
  const byStatus: Record<JobStatus, number> = {
    pending: 0,
    in_progress: 0,
    complete: 0,
    failed: 0,
  };

  const byPriority = {
    enterprise: 0,
    professional: 0,
    growth: 0,
    starter: 0,
  };

  for (const job of records) {
    if (byStatus[job.status] !== undefined) {
      byStatus[job.status] += 1;
    }

    switch (job.priority_level) {
      case 1:
        byPriority.enterprise += 1;
        break;
      case 2:
        byPriority.professional += 1;
        break;
      case 3:
        byPriority.growth += 1;
        break;
      case 4:
        byPriority.starter += 1;
        break;
      default:
        break;
    }
  }

  const oldestPending =
    records
      .filter((job) => job.status === "pending")
      .map((job) => job.created_at)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  return {
    total: records.length,
    byStatus,
    byPriority,
    oldestPending,
  };
};

const computeWorkerMetrics = (records: WorkerRecord[]): WorkerMetric[] => {
  const metricsMap = new Map<string, WorkerMetric>();

  for (const job of records) {
    const metadataRecord = toMetadataRecord(job.metadata);

    if (!metadataRecord) {
      console.warn(
        "Invalid metadata format for worker job:",
        job.customer_id,
        job.metadata,
      );
      continue;
    }

    const workerId = getWorkerId(metadataRecord);
    const existing = metricsMap.get(workerId);
    const progress = asNumber(metadataRecord["progress_percentage"]) ?? 0;

    if (existing) {
      existing.activeJobs += 1;
      existing.averageProgress += progress;
      if (
        new Date(job.updated_at).getTime() >
        new Date(existing.lastActivity).getTime()
      ) {
        existing.lastActivity = job.updated_at;
      }
    } else {
      metricsMap.set(workerId, {
        workerId,
        activeJobs: 1,
        averageProgress: progress,
        lastActivity: job.updated_at,
      });
    }
  }

  const metrics = Array.from(metricsMap.values());
  for (const metric of metrics) {
    if (metric.activeJobs > 0) {
      metric.averageProgress = Math.round(
        metric.averageProgress / metric.activeJobs,
      );
    }
  }

  return metrics;
};

const computeCompletionStats = (
  records: CompletionRecord[],
): CompletionStats => {
  const stats: CompletionStats = {
    totalCompleted: records.length,
    averageProcessingTime: 0,
    totalSuccessfulSubmissions: 0,
    totalFailedSubmissions: 0,
  };

  if (records.length === 0) {
    return stats;
  }

  const processingTimes = records
    .map((job) => getMetadataNumber(job.metadata, "processing_time_ms"))
    .filter((value): value is number => typeof value === "number");

  if (processingTimes.length > 0) {
    const totalProcessingTime = processingTimes.reduce(
      (sum, value) => sum + value,
      0,
    );
    stats.averageProcessingTime = Math.round(
      totalProcessingTime / processingTimes.length,
    );
  }

  stats.totalSuccessfulSubmissions = records.reduce(
    (sum, job) => sum + (getMetadataNumber(job.metadata, "successful_submissions") ?? 0),
    0,
  );

  stats.totalFailedSubmissions = records.reduce(
    (sum, job) => sum + (getMetadataNumber(job.metadata, "failed_submissions") ?? 0),
    0,
  );

  return stats;
};

const computeHealthFactors = (
  queueSummary: QueueStatusSummary,
  workerCount: number,
  completionStats: CompletionStats,
): HealthFactors => {
  const failedJobs = queueSummary.byStatus.failed;
  const queueHealth = Math.min(100, Math.max(0, 100 - failedJobs * 10));

  const workerHealth = workerCount > 0 ? 100 : 50;
  const processingHealth = queueSummary.byStatus.in_progress > 0 ? 100 : 75;

  const totalSubmissions =
    completionStats.totalSuccessfulSubmissions +
    completionStats.totalFailedSubmissions;

  const completionRate =
    totalSubmissions > 0
      ? Math.min(
          100,
          Math.round(
            (completionStats.totalSuccessfulSubmissions / totalSubmissions) *
              100,
          ),
        )
      : 90;

  return {
    queueHealth,
    workerHealth,
    processingHealth,
    completionRate,
  };
};

const deriveHealthStatus = (
  score: number,
): "excellent" | "good" | "warning" | "critical" => {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "critical";
};

const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    console.log("Fetching AutoBolt system status...");

    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(
      now - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      queueStatsResult,
      activeWorkersResult,
      recentCompletionsResult,
      systemMetricsResult,
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "status, package_size, priority_level, created_at, updated_at, metadata",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("jobs")
        .select("metadata, status, updated_at, customer_id")
        .eq("status", "in_progress")
        .gte("updated_at", fiveMinutesAgo),

      supabase
        .from("jobs")
        .select("status, completed_at, metadata")
        .eq("status", "complete")
        .gte("completed_at", twentyFourHoursAgo),

      supabase
        .from("job_results")
        .select("status, submitted_at, response_log")
        .gte("submitted_at", twentyFourHoursAgo),
    ]);

    if (queueStatsResult.error) {
      return handleSupabaseError(queueStatsResult.error, "queue-status");
    }

    if (activeWorkersResult.error) {
      return handleSupabaseError(activeWorkersResult.error, "active-workers");
    }

    if (recentCompletionsResult.error) {
      return handleSupabaseError(
        recentCompletionsResult.error,
        "recent-completions",
      );
    }

    if (systemMetricsResult.error) {
      return handleSupabaseError(systemMetricsResult.error, "system-metrics");
    }

    const queueSummary = computeQueueSummary(
      (queueStatsResult.data ?? []) as QueueRecord[],
    );
    const workerDetails = computeWorkerMetrics(
      (activeWorkersResult.data ?? []) as WorkerRecord[],
    );
    const completionStats = computeCompletionStats(
      (recentCompletionsResult.data ?? []) as CompletionRecord[],
    );

    const healthFactors = computeHealthFactors(
      queueSummary,
      workerDetails.length,
      completionStats,
    );
    const systemHealthScore = Math.round(
      (healthFactors.queueHealth +
        healthFactors.workerHealth +
        healthFactors.processingHealth +
        healthFactors.completionRate) /
        4,
    );

    const alerts: StatusResponse["alerts"] = [];

    if (queueSummary.byStatus.failed > 5) {
      alerts.push({
        type: "warning",
        message: `${queueSummary.byStatus.failed} jobs have failed and may need attention`,
        action: "Consider reviewing failed jobs and retrying if appropriate",
      });
    }

    if (queueSummary.byStatus.in_progress > 0 && workerDetails.length === 0) {
      alerts.push({
        type: "critical",
        message: "Jobs marked as in_progress but no active workers detected",
        action: "Check worker connectivity and restart if necessary",
      });
    }

    if (queueSummary.byStatus.pending > 20) {
      alerts.push({
        type: "info",
        message: `${queueSummary.byStatus.pending} jobs are pending processing`,
        action: "Consider scaling up workers if processing is slow",
      });
    }

    const response: StatusResponse = {
      timestamp: new Date().toISOString(),
      systemHealth: {
        score: systemHealthScore,
        status: deriveHealthStatus(systemHealthScore),
        factors: healthFactors,
      },
      queue: queueSummary,
      workers: {
        active: workerDetails.length,
        details: workerDetails,
      },
      performance: {
        last24Hours: completionStats,
        averageProcessingTime: completionStats.averageProcessingTime,
        successRate:
          completionStats.totalSuccessfulSubmissions +
            completionStats.totalFailedSubmissions >
          0
            ? Math.round(
                (completionStats.totalSuccessfulSubmissions /
                  (completionStats.totalSuccessfulSubmissions +
                    completionStats.totalFailedSubmissions)) *
                  100,
              )
            : 0,
      },
      alerts,
    };

    console.log(
      `System status: ${response.systemHealth.status} (${response.systemHealth.score}% health score)`,
    );

    return handleSuccess<StatusResponse>(
      response,
      "AutoBolt system status retrieved successfully",
    );
  } catch (error) {
    console.error("Unexpected error in autobolt-status:", error);
    return handleSupabaseError(error, "autobolt-status-handler");
  }
};

export { handler };
