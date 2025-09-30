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




