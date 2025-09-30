import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";
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

interface CustomerRecord {
  business_name: string | null;
  email: string | null;
  business_data: Record<string, Json> | null;
  status: string | null;
}

type CustomerResult = CustomerRecord | CustomerRecord[] | null;
type JoinedJobRecord = JobsRow & { customers: CustomerResult };

interface JobClaimPayload {
  jobId: string;
  customerId: string;
  packageSize: number;
  priorityLevel: number;
  directoryLimit: number;
  businessData: Record<string, Json> | null;
  businessName: string | null;
  customerEmail: string | null;
  metadata: Record<string, Json>;
  claimedAt: string;
  workerId: string;
}

const isWorkerAuthFailure = (
  result: WorkerAuthFailure | WorkerAuthSuccess,
): result is WorkerAuthFailure => !result.isValid;

const toJobMetadata = (
  metadata: Json | null,
): Record<string, Json> => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, Json>;
  }

  return {};
};

const normalizeCustomer = (input: CustomerResult): CustomerRecord => {
  if (Array.isArray(input)) {
    return normalizeCustomer(input[0] ?? null);
  }

  const businessDataRaw = input?.business_data ?? null;
  const businessData = (
    businessDataRaw && typeof businessDataRaw === 'object' && !Array.isArray(businessDataRaw)
      ? (businessDataRaw as Record<string, Json>)
      : null
  );

  return {
    business_name: input?.business_name ?? null,
    email: input?.email ?? null,
    business_data: businessData,
    status: input?.status ?? null,
  };
};

const handler: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
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
    console.log(`Worker ${workerId} requesting next job`);

    const { data: jobsData, error: fetchError } = await supabase
      .from("jobs")
      .select(
        `
        id,
        customer_id,
        package_size,
        priority_level,
        created_at,
        metadata,
        customers!inner(
          business_name,
          email,
          business_data,
          status
        )
      `,
      )
      .eq("status", "pending")
      .eq("customers.status", "active")
      .order("priority_level", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      return handleSupabaseError(fetchError, "fetch-next-job");
    }

    const jobs = (jobsData ?? []) as unknown as JoinedJobRecord[];

    if (jobs.length === 0) {
      return handleSuccess<null>(null, "No jobs available in queue");
    }

    const job = jobs[0];
    const customer = normalizeCustomer(job.customers);

    const jobMetadata: Record<string, Json> = {
      ...toJobMetadata(job.metadata),
      processed_by: workerId,
    };

    const nowIso = new Date().toISOString();
    const updatePayload: JobsUpdate = {
      status: "in_progress",
      started_at: nowIso,
      updated_at: nowIso,
      metadata: jobMetadata,
    };

    // TODO: Restore proper Supabase typings for jobs-next update after Stage 6.9 cleanup
    const { error: updateError } = await (supabase as any)
      .from("jobs")
      .update(updatePayload)
      .eq("id", job.id)
      .eq("status", "pending");

    if (updateError) {
      return handleSupabaseError(updateError, "claim-job");
    }

    const jobData: JobClaimPayload = {
      jobId: job.id,
      customerId: job.customer_id,
      packageSize: job.package_size,
      priorityLevel: job.priority_level,
      directoryLimit: job.package_size,
      businessData: customer.business_data,
      businessName: customer.business_name,
      customerEmail: customer.email,
      metadata: jobMetadata,
      claimedAt: new Date().toISOString(),
      workerId,
    };

    console.log(
      `Job ${job.id} claimed by worker ${workerId} for customer ${job.customer_id}`,
    );

    return handleSuccess<JobClaimPayload>(jobData, "Job claimed successfully");
  } catch (error) {
    console.error("Unexpected error in jobs-next:", error);
    return handleSupabaseError(error, "jobs-next-handler");
  }
};

export { handler };




