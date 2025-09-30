import type { Handler, HandlerResponse } from "@netlify/functions";
import { supabase } from "./_supabaseClientTyped";

const DEFAULT_MIN_WORKERS = parseInt(process.env.MIN_WORKERS || "1", 10);
const DEFAULT_MAX_WORKERS = parseInt(process.env.MAX_WORKERS || "6", 10);

const QUEUE_THRESHOLDS = [
  { depth: 500, workers: 8 },
  { depth: 300, workers: 6 },
  { depth: 100, workers: 4 },
  { depth: 50, workers: 2 },
];

interface MetricSnapshot {
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  failedJobs: number;
  retriesLast24h: number;
  captchasSolvedLast24h: number;
}

interface HealthPayload {
  status: "ok" | "degraded" | "error";
  uptime: number;
  queueDepth: number;
  activeWorkers: number;
  recommendedWorkers: number;
  scalingLevel: string;
  metrics: MetricSnapshot;
  timestamp: string;
}

const mapQueueDepthToWorkers = (
  queueDepth: number,
  minWorkers: number,
  maxWorkers: number,
): number => {
  const threshold = QUEUE_THRESHOLDS.find(({ depth }) => queueDepth >= depth);
  const target = threshold?.workers ?? minWorkers;
  return Math.min(Math.max(target, minWorkers), maxWorkers);
};

const toScalingLabel = (workers: number): string => {
  if (workers <= 1) return "1x";
  return `${workers}x`;
};

const selectCount = async (status: string): Promise<number> => {
  const { count: rawCount, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    console.error(`[healthz] failed to read ${status} count`, error.message);
    throw error;
  }

  return typeof rawCount === "number" ? rawCount : 0;
};

const countRetriesLast24h = async (): Promise<number> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: rawCount, error } = await supabase
    .from("job_results")
    .select("id", { count: "exact", head: true })
    .eq("status", "retry")
    .gte("updated_at", since);

  if (error) {
    console.error("[healthz] failed to read retry count", error.message);
    throw error;
  }

  return typeof rawCount === "number" ? rawCount : 0;
};

const countCaptchasSolved = async (): Promise<number> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: rawCount, error } = await supabase
    .from("job_results")
    .select("id", { count: "exact", head: true })
    .eq("directory_name", "CAPTCHA_SOLVED")
    .gte("updated_at", since);

  if (error) {
    console.error("[healthz] failed to read captcha solved count", error.message);
    throw error;
  }

  return typeof rawCount === "number" ? rawCount : 0;
};

const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const pendingJobs = await selectCount("pending");
    const inProgressJobs = await selectCount("in_progress");
    const completedJobs = await selectCount("complete");
    const failedJobs = await selectCount("failed");

    const [retriesLast24h, captchasSolvedLast24h] = await Promise.all([
      countRetriesLast24h(),
      countCaptchasSolved(),
    ]);

    const queueDepth = pendingJobs;
    const minWorkers = DEFAULT_MIN_WORKERS;
    const maxWorkers = DEFAULT_MAX_WORKERS;

    const recommendedWorkers = mapQueueDepthToWorkers(
      queueDepth,
      minWorkers,
      maxWorkers,
    );

    const payload: HealthPayload = {
      status: "ok",
      uptime: process.uptime(),
      queueDepth,
      activeWorkers: inProgressJobs,
      recommendedWorkers,
      scalingLevel: toScalingLabel(recommendedWorkers),
      metrics: {
        pendingJobs,
        inProgressJobs,
        completedJobs,
        failedJobs,
        retriesLast24h,
        captchasSolvedLast24h,
      },
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(payload),
    };
  } catch (error) {
    console.error("[healthz] unexpected error", error);

    return {
      statusCode: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        status: "error",
        message:
          error instanceof Error ? error.message : "Health check unavailable",
      }),
    };
  }
};

export { handler };
