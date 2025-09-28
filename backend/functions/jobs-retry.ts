import type { Handler, HandlerResponse } from "@netlify/functions";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

import {
  supabase,
  handleSupabaseError,
  handleSuccess,
  getCorsHeaders,
  type JobsRow,
  type JobsUpdate,
  type JobResultsInsert,
  type Json,
} from "./_supabaseClientTyped";

type JobStatus = "pending" | "in_progress" | "complete" | "failed";

type JobMetadata = JobsRow["metadata"];

const toMetadataRecord = (metadata: JobMetadata): Record<string, Json> => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, Json>;
  }
  return {};
};

interface RetryRequest {
  queueId?: string;
  retryAll?: boolean;
  maxRetries?: number;
  resetProgress?: boolean;
}

interface RetryResponseJob {
  jobId: string;
  queueId: string;
  customerId: string;
  retryCount: number;
  status: JobStatus;
}

const parseRequestBody = (body: string | null | undefined): RetryRequest => {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as RetryRequest;
  } catch (error) {
    console.error("Failed to parse jobs-retry payload:", error);
    return {};
  }
};

const getRetryCount = (metadata: JobMetadata): number => {
  const metadataRecord = toMetadataRecord(metadata);
  const value = metadataRecord.retry_count;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  return 0;
};

const incrementRetryMetadata = (
  metadata: JobMetadata,
  resetProgress: boolean,
): Record<string, Json> => {
  const baseMetadata = toMetadataRecord(metadata);
  const currentRetries = getRetryCount(metadata);

  const updated: Record<string, Json> = {
    ...baseMetadata,
    retry_count: currentRetries + 1,
    processed_by: null,
    error_message: null,
  };

  if (resetProgress) {
    updated.progress_percentage = 0;
    updated.directories_completed = 0;
    updated.current_directory = null;
  }

  return updated;
};

const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    const {
      queueId,
      retryAll,
      maxRetries = 3,
      resetProgress = true,
    } = parseRequestBody(event.body);

    console.log("Processing retry request:", { queueId, retryAll, maxRetries });

    if (!queueId && !retryAll) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error:
            "Must specify either queueId for specific retry or retryAll=true for bulk retry",
        }),
      };
    }

    const timestamp = new Date().toISOString();

    if (queueId) {
      const { data: job, error: fetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", queueId)
        .single();

      if (fetchError) {
        return handleSupabaseError(fetchError, "fetch-job-for-retry");
      }

      if (!job) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json", ...getCorsHeaders() },
          body: JSON.stringify({ success: false, error: "Job not found" }),
        };
      }

      const currentRetries = getRetryCount(job.metadata);
      if (currentRetries >= maxRetries) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", ...getCorsHeaders() },
          body: JSON.stringify({
            success: false,
            error: `Job has exceeded maximum retry attempts (${maxRetries})`,
          }),
        };
      }

      const retryData: JobsUpdate = {
        status: "pending" as const,
        updated_at: timestamp,
        started_at: null,
        error_message: null,
        metadata: incrementRetryMetadata(job.metadata, resetProgress),
      };

      const { data: updatedJob, error: updateError } = await supabase
        .from("jobs")
        .update(retryData)
        .eq("id", queueId)
        .select("id, customer_id, metadata, status")
        .single();

      if (updateError) {
        return handleSupabaseError(updateError, "retry-job");
      }

      const responseJob: RetryResponseJob = {
        jobId: updatedJob.id,
        queueId: updatedJob.id,
        customerId: updatedJob.customer_id,
        retryCount: getRetryCount(updatedJob.metadata),
        status: updatedJob.status,
      };

      await logRetries([responseJob], timestamp);

      const message = `Job ${queueId} queued for retry (attempt ${responseJob.retryCount})`;
      console.log(message);

      return handleSuccess({ retriedJobs: 1, jobs: [responseJob] }, message);
    }

    const { data: failedJobsData, error: fetchError } = await supabase
      .from("jobs")
      .select("id, metadata, customer_id, status")
      .eq("status", "failed")
      .order("priority_level", { ascending: true });

    if (fetchError) {
      return handleSupabaseError(fetchError, "fetch-failed-jobs");
    }

    const failedJobs = (failedJobsData ?? []) as unknown as JobsRow[];

    const jobsWithMetadata = failedJobs.map((job) => ({
      ...job,
      metadata: (job.metadata ?? null) as JobsRow["metadata"],
    }));

    if (jobsWithMetadata.length === 0) {
      return handleSuccess([], "No failed jobs available for retry");
    }

    const eligibleJobs = jobsWithMetadata.filter(
      (job) => getRetryCount(job.metadata) < maxRetries,
    );

    if (eligibleJobs.length === 0) {
      return handleSuccess(
        [],
        "No failed jobs available for retry (all have exceeded retry limit)",
      );
    }

    const retryPromises: Array<Promise<PostgrestSingleResponse<JobsRow>>> =
      eligibleJobs.map((job) => {
        const updatePayload: JobsUpdate = {
          status: "pending",
          updated_at: timestamp,
          started_at: null,
          error_message: null,
          metadata: incrementRetryMetadata(job.metadata, resetProgress),
        };

        return supabase
          .from("jobs")
          .update(updatePayload)
          .eq("id", job.id);
      });

    const results = await Promise.all(retryPromises);
    const updateError = results.find((result) => result.error)?.error ?? null;

    if (updateError) {
      return handleSupabaseError(updateError, "bulk-retry-jobs");
    }

    const jobIds = eligibleJobs.map((job) => job.id);
    const { data: updatedJobsRaw, error: fetchUpdatedError } = await supabase
      .from("jobs")
      .select("id, customer_id, metadata, status")
      .in("id", jobIds);

    if (fetchUpdatedError) {
      return handleSupabaseError(fetchUpdatedError, "fetch-updated-jobs");
    }

    const updatedJobsData = (updatedJobsRaw ?? []) as unknown as JobsRow[];

    const responseJobs: RetryResponseJob[] = updatedJobsData.map((job) => ({
      jobId: job.id,
      queueId: job.id,
      customerId: job.customer_id,
      retryCount: getRetryCount(job.metadata),
      status: job.status,
    }));

    await logRetries(responseJobs, timestamp);

    const message = `${responseJobs.length} failed jobs queued for retry`;
    console.log(message);

    return handleSuccess(
      { retriedJobs: responseJobs.length, jobs: responseJobs },
      message,
    );
  } catch (error) {
    console.error("Unexpected error in jobs-retry:", error);
    return handleSupabaseError(error, "jobs-retry-handler");
  }
};

const logRetries = async (
  jobs: RetryResponseJob[],
  timestamp: string,
): Promise<void> => {
  if (jobs.length === 0) {
    return;
  }

  const retryLogEntries: JobResultsInsert[] = jobs.map((job) => ({
    job_id: job.jobId,
    directory_name: "RETRY_LOG",
    status: "pending",
    response_log: {
      customer_id: job.customerId,
      retry_count: job.retryCount,
      retried_at: timestamp,
      retry_reason: "manual_staff_retry",
    } as Json,
  }));

  const { error } = await supabase.from("job_results").insert(retryLogEntries);

  if (error) {
    console.error("Failed to create retry log entries:", error);
  }
};

export { handler };






