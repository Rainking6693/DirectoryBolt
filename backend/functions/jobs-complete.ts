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
  type JobResultsInsert,
  type Json,
} from "./_supabaseClientTyped";

interface CustomerRecord {
  business_name: string | null;
  email: string | null;
}

type CustomerResult = CustomerRecord | CustomerRecord[] | null;

type JoinedJobRecord = JobsRow & { customers: CustomerResult };

interface JobCompletionRequest {
  jobId?: string;
  queueId?: string;
  results?: unknown;
  directoriesCompleted?: number;
  directoriesTotal?: number;
  successfulSubmissions?: number;
  failedSubmissions?: number;
  processingTimeMs?: number;
  completionSummary?: string;
}

interface CompletionResponsePayload {
  jobId: string;
  queueId: string;
  customerId: string;
  packageSize: number;
  businessName: string | null;
  directoriesCompleted: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  processingTimeMs?: number;
  completedAt: string;
  workerId: string;
}

type WorkerAuthResult = WorkerAuthFailure | WorkerAuthSuccess;

const isWorkerAuthFailure = (
  result: WorkerAuthResult,
): result is WorkerAuthFailure => !result.isValid;

const parseRequestBody = (
  body: string | null | undefined,
): JobCompletionRequest => {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as JobCompletionRequest;
  } catch (error) {
    console.error("Failed to parse jobs-complete payload:", error);
    return {};
  }
};

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && !Number.isNaN(value) ? value : undefined;

const toMetadataRecord = (metadata: Json | null): Record<string, Json> => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, Json>;
  }
  return {};
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
      results,
      directoriesCompleted,
      directoriesTotal,
      successfulSubmissions,
      failedSubmissions,
      processingTimeMs,
      completionSummary,
    } = parseRequestBody(event.body);

    const actualJobId = jobId ?? queueId;

    if (!actualJobId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: "Missing required field: jobId (or queueId)",
        }),
      };
    }

    console.log(`Worker ${workerId} completing job ${actualJobId}`);

    const timestamp = new Date().toISOString();

    const metadataUpdates: Record<string, Json> = {
      processed_by: workerId,
      progress_percentage: 100,
    };

    const addNumber = (key: string, value: number | undefined) => {
      if (typeof value === "number") {
        metadataUpdates[key] = value;
      }
    };

    addNumber("directories_completed", asNumber(directoriesCompleted));
    addNumber("directories_total", asNumber(directoriesTotal));
    addNumber("successful_submissions", asNumber(successfulSubmissions));
    addNumber("failed_submissions", asNumber(failedSubmissions));
    addNumber("processing_time_ms", asNumber(processingTimeMs));

    if (completionSummary) {
      metadataUpdates.completion_summary = completionSummary;
    }

    if (typeof results !== "undefined") {
      metadataUpdates.processing_results = (results as Json);
    }

    const completionData: JobsUpdate = {
      status: "complete",
      completed_at: timestamp,
      updated_at: timestamp,
      metadata: metadataUpdates,
    };

    const { data: jobData, error: updateError } = await supabase
      .from("jobs")
      .update(completionData)
      .eq("id", actualJobId)
      .select(
        `
        id,
        customer_id,
        package_size,
        metadata,
        customers!inner(business_name, email)
      `,
      )
      .single();

    if (updateError) {
      return handleSupabaseError(updateError, "complete-job");
    }

    const joinedJob = jobData as unknown as JoinedJobRecord | null;

    if (!joinedJob) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: "Job not found",
        }),
      };
    }

    const metadataRecord = toMetadataRecord(joinedJob.metadata);
    const processingDurationMs = asNumber(metadataRecord.processing_time_ms);

    const logEntry = {
      job_id: actualJobId,
      customer_id: joinedJob.customer_id,
      package_size: joinedJob.package_size,
      worker_id: workerId,
      completion_status: "success",
      directories_processed:
        asNumber(metadataRecord.directories_completed) ?? 0,
      successful_submissions:
        asNumber(metadataRecord.successful_submissions) ?? 0,
      failed_submissions: asNumber(metadataRecord.failed_submissions) ?? 0,
      processing_duration_ms: processingDurationMs ?? null,
      completed_at: timestamp,
    };

    try {
      const completionLog: JobResultsInsert = {
        job_id: actualJobId,
        directory_name: "COMPLETION_LOG",
        status: "submitted",
        response_log: logEntry as Json,
      };

      const { error: logError } = await supabase
        .from("job_results")
        .insert(completionLog);

      if (logError) {
        console.error("Failed to create completion log:", logError);
      }
    } catch (logInsertError) {
      console.error("Failed to create completion log:", logInsertError);
    }

    console.log(
      `Job ${actualJobId} completed successfully by worker ${workerId} for customer ${joinedJob.customer_id}`,
    );
    console.log(
      `Results: ${asNumber(metadataRecord.successful_submissions) ?? 0} successful, ${
        asNumber(metadataRecord.failed_submissions) ?? 0
      } failed submissions`,
    );

    const customer = Array.isArray(joinedJob.customers)
      ? (joinedJob.customers[0] ?? null)
      : (joinedJob.customers ?? null);

    const responsePayload: CompletionResponsePayload = {
      jobId: joinedJob.id,
      queueId: joinedJob.id,
      customerId: joinedJob.customer_id,
      packageSize: joinedJob.package_size,
      businessName: customer?.business_name ?? null,
      directoriesCompleted:
        asNumber(metadataRecord.directories_completed) ?? 0,
      successfulSubmissions:
        asNumber(metadataRecord.successful_submissions) ?? 0,
      failedSubmissions: asNumber(metadataRecord.failed_submissions) ?? 0,
      processingTimeMs: asNumber(metadataRecord.processing_time_ms),
      completedAt: timestamp,
      workerId,
    };

    return handleSuccess<CompletionResponsePayload>(
      responsePayload,
      "Job completed successfully",
    );
  } catch (error) {
    console.error("Unexpected error in jobs-complete:", error);
    return handleSupabaseError(error, "jobs-complete-handler");
  }
};

export { handler };











