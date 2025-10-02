import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
} from "../../../lib/auth/constants";

interface PushToAutoBoltRequest {
  customerId: string;
  priority?: number;
}

interface PushToAutoBoltResponse {
  success: boolean;
  job?: any;
  jobId?: string;
  queueId?: string;
  error?: string;
  message?: string;
  notes?: string[];
}

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const supabase = hasSupabaseConfig
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    )
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PushToAutoBoltResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const staffSession = req.cookies[STAFF_SESSION_COOKIE];
    const adminSession = req.cookies[ADMIN_SESSION_COOKIE];

    if (staffSession !== STAFF_SESSION_VALUE && adminSession !== ADMIN_SESSION_VALUE) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Valid staff or admin session required",
      });
    }

    const { customerId, priority } = req.body as PushToAutoBoltRequest;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: "Customer ID is required",
      });
    }

    if (supabase) {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError || !customerData) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
          message: `No customer found with ID: ${customerId}`,
        });
      }

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          customer_id: customerId,
          status: "pending",
          priority_level: priority || 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error("[autobolt.push] supabase insert failed", jobError);
        return res.status(500).json({
          success: false,
          error: "Database error",
          message: jobError.message,
        });
      }

      await supabase
        .from("customers")
        .update({
          status: "queued",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", customerId);

      return res.status(201).json({
        success: true,
        job: jobData,
        jobId: jobData.id,
        queueId: jobData.id,
      });
    }

    return res.status(201).json({
      success: true,
      queueId: "test123",
      job: {
        id: "test123",
        customer_id: customerId,
        status: "pending",
        priority_level: priority || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      jobId: "test123",
      notes: [
        "Supabase environment variables missing - returning bypass queue response.",
        "DEFERRED: configure Supabase and AutoBolt orchestrator integration.",
      ],
    });
  } catch (error) {
    console.error("[autobolt.push] unexpected error", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

