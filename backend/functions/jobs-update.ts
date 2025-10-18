import type { Handler, HandlerResponse } from "@netlify/functions";
import {
  supabase,
  handleSupabaseError,
  handleSuccess,
  validateWorkerAuth,
  getCorsHeaders,
  type WorkerAuthFailure,
  type WorkerAuthSuccess,
  type JobsRow,
  type JobsUpdate,
  type Json,
} from "./_supabaseClientTyped";

type JobStatus = "pending" | "in_progress" | "complete" | "failed";

interface JobUpdateRequest {
  jobId?: string;
  queueId?: string;
  status?: JobStatus;
  progress?: number;
  currentDirectory?: string;
  directoriesCompleted?: number;
  directoriesTotal?: number;
  errorMessage?: string;
  lastActivity?: string;
  directoryResults?: Array<{
    directory: string;
    status: string;
    log?: string;
    error?: string;
  }>;
}

interface JobUpdateResponse {
  jobId: string;
  queueId: string;
  status: JobStatus;
  progress?: number;
  customerId: string;
  updatedAt: string;
}

const isWorkerAuthFailure = (
  result: WorkerAuthFailure | WorkerAuthSuccess,
): result is WorkerAuthFailure => !result.isValid;

const parseRequestBody = (
  body: string | null | undefined,
): JobUpdateRequest => {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as JobUpdateRequest;
  } catch (error) {
    console.error("Failed to parse jobs-update payload:", error);
    return {};
  }
};

const clampProgress = (value: number | undefined): number | undefined => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(100, Math.max(0, value));
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

  const authResult = validateWorkerAuth(event);

  if (isWorkerAuthFailure(authResult)) {
    return {
      ...authResult,
      headers: { ...authResult.headers, ...getCorsHeaders() },
    };
  }

  const workerId = authResult.workerId;

  try {
    const {
      jobId,
      queueId,
      status,
      progress,
      currentDirectory,
      directoriesCompleted,
      directoriesTotal,
      errorMessage,
      lastActivity,
      directoryResults,
    } = parseRequestBody(event.body);

    const actualJobId: JobsRow["id"] | undefined = jobId ?? queueId;

    if (!actualJobId || !status) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: "Missing required fields: jobId (or queueId) and status",
        }),
      };
    }

    const validStatuses: JobStatus[] = [
      "pending",
      "in_progress",
      "complete",
      "failed",
    ];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        }),
      };
    }

    console.log(
      `Worker ${workerId} updating job ${actualJobId} to status: ${status}`,
    );

    const nowIso = new Date().toISOString();

    const metadataUpdates: Record<string, Json> = {
      processed_by: workerId,
    };

    const clampedProgress = clampProgress(progress);
    if (typeof clampedProgress === "number") {
      metadataUpdates.progress_percentage = clampedProgress;
    }

    if (currentDirectory) {
      metadataUpdates.current_directory = currentDirectory;
    }

    if (typeof directoriesCompleted === "number") {
      metadataUpdates.directories_completed = directoriesCompleted;
    }

    if (typeof directoriesTotal === "number") {
      metadataUpdates.directories_total = directoriesTotal;
    }

    if (lastActivity) {
      metadataUpdates.last_activity = lastActivity;
    }

    if (status === "complete") {
      metadataUpdates.progress_percentage = 100;
    }

    const updateData: JobsUpdate = {
      status,
      updated_at: nowIso,
      metadata: metadataUpdates,
    };

    if (status === "complete") {
      updateData.completed_at = nowIso;
    }

    if (status === "failed") {
      updateData.error_message =
        errorMessage ?? "Job failed without specific error message";
    }

    const { data, error } = await (supabase as any)
      .from("jobs")
      .update(updateData)
      .eq("id", actualJobId)
      .select("id, status, metadata, customer_id")
      .single();

    // After successful jobs update, handle inserts for logging tables if directoryResults provided and in_progress
    if (!error && data && status === "in_progress" && directoryResults && Array.isArray(directoryResults) && directoryResults.length > 0) {
      try {
        console.log(`Inserting ${directoryResults.length} directory results for job ${actualJobId} by worker ${workerId}`);

        // Insert into job_results for each directory result
        for (const result of directoryResults) {
          const jobResultPayload = {
            job_id: actualJobId,
            directory_name: result.directory,
            status: result.status,
            response_log: {
              log: result.log || null,
              error: result.error || null,
            },
            submitted_at: nowIso,
            worker_id: workerId,
          };

          console.log(`Attempting insert to job_results:`, jobResultPayload);

          const { error: jobResultError } = await (supabase as any)
            .from("job_results")
            .insert(jobResultPayload);

          if (jobResultError) {
            console.error(`Failed to insert job_results for ${result.directory}:`, jobResultError);
            // Continue with other inserts, don't fail the whole response
          } else {
            console.log(`Successfully inserted job_results for ${result.directory}`);
          }
        }

        // Insert summary log into autobolt_submission_logs for the API call
        const submissionLogPayload = {
          job_id: actualJobId,
          api_call: "jobs-update",
          method: "POST",
          status_code: 200, // Assuming success since we reached here
          response_summary: `Processed ${directoryResults.length} directories`,
          payload_summary: JSON.stringify({
            directories_processed: directoryResults.length,
            statuses: directoryResults.map(r => ({ directory: r.directory, status: r.status })),
          }),
          timestamp: nowIso,
          worker_id: workerId,
        };

        console.log(`Attempting insert to autobolt_submission_logs:`, submissionLogPayload);

        const { error: logError } = await (supabase as any)
          .from("autobolt_submission_logs")
          .insert(submissionLogPayload);

        if (logError) {
          console.error(`Failed to insert autobolt_submission_logs:`, logError);
        } else {
          console.log(`Successfully inserted autobolt_submission_logs for job ${actualJobId}`);
        }

      } catch (insertError) {
        console.error(`Unexpected error during logging inserts for job ${actualJobId}:`, insertError);
        // Don't propagate insert errors to the main response to avoid breaking worker flow
      }
    }

    if (error) {
      return handleSupabaseError(error, "update-job-status");
    }

    if (!data) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: "Job not found or not owned by this worker",
        }),
      };
    }

    if (status === "complete" || status === "failed") {
      console.log(
        `Job ${actualJobId} ${status} by worker ${workerId} for customer ${data.customer_id}`,
      );
    }

    const responsePayload: JobUpdateResponse = {
      jobId: data.id,
      queueId: data.id,
      status: data.status as JobStatus,
      progress: (() => {
        const metadataRecord = (data.metadata ?? {}) as Record<string, Json>;
        const value = metadataRecord.progress_percentage;
        return typeof value === "number" ? value : undefined;
      })(),
      customerId: data.customer_id,
      updatedAt: nowIso,
    };

    return handleSuccess<JobUpdateResponse>(
      responsePayload,
      `Job status updated to: ${status}`,
    );
  } catch (error) {
    console.error("Unexpected error in jobs-update:", error);
    return handleSupabaseError(error, "jobs-update-handler");
  }
};

export { handler };




