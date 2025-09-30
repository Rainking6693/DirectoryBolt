import type { Handler, HandlerResponse } from "@netlify/functions";
import { supabase } from "./_supabaseClientTyped";

const METRIC_NAME_PREFIX = "directorybolt";

const formatMetric = (name: string, value: number, help: string): string => {
  const metricName = `${METRIC_NAME_PREFIX}_${name}`;
  return [`# HELP ${metricName} ${help}`, `# TYPE ${metricName} gauge`, `${metricName} ${value}`, ""].join("\n");
};

const countJobsByStatus = async (status: string): Promise<number> => {
  const { count: rawCount, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    console.error(`[metrics] failed to count status ${status}`, error.message);
    throw error;
  }

  return typeof rawCount === "number" ? rawCount : 0;
};

const countRetries = async (): Promise<number> => {
  const { count: rawCount, error } = await supabase
    .from("job_results")
    .select("id", { count: "exact", head: true })
    .eq("status", "retry");

  if (error) {
    console.error("[metrics] failed to count retries", error.message);
    throw error;
  }

  return typeof rawCount === "number" ? rawCount : 0;
};

const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "text/plain" },
      body: "Method not allowed",
    };
  }

  try {
    const [pending, inProgress, completed, failed, retries] = await Promise.all([
      countJobsByStatus("pending"),
      countJobsByStatus("in_progress"),
      countJobsByStatus("complete"),
      countJobsByStatus("failed"),
      countRetries(),
    ]);

    const uptime = process.uptime();

    const lines = [
      formatMetric("queue_depth", pending, "Pending jobs in the queue"),
      formatMetric("active_jobs", inProgress, "Jobs currently in progress"),
      formatMetric("completed_jobs_total", completed, "Total completed jobs"),
      formatMetric("failed_jobs_total", failed, "Total failed jobs"),
      formatMetric("retries_total", retries, "Total retry attempts recorded"),
      formatMetric("process_uptime_seconds", uptime, "AutoBolt backend uptime in seconds"),
    ];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4",
        "Cache-Control": "no-store",
      },
      body: lines.join("\n"),
    };
  } catch (error) {
    console.error("[metrics] generation failed", error);
    return {
      statusCode: 503,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
      body: "metrics_unavailable 0\n",
    };
  }
};

export { handler };
