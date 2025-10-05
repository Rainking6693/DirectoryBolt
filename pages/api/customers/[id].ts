import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
} from "../../../lib/auth/constants";
import {
  findTestCustomer,
  getTestCustomerStore,
  upsertTestCustomer,
} from "../../../lib/testData/customers";

interface CustomerDetailResponse {
  success: boolean;
  customer?: any;
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
  res: NextApiResponse<CustomerDetailResponse>,
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      error: "Invalid customer ID",
    });
  }

  const staffSession = req.cookies[STAFF_SESSION_COOKIE];
  const adminSession = req.cookies[ADMIN_SESSION_COOKIE];

  if (staffSession !== STAFF_SESSION_VALUE && adminSession !== ADMIN_SESSION_VALUE) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Valid staff or admin session required",
    });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    if (supabase) {
      // Support lookup by internal id (UUID) or public customer_id (e.g., DB-YYYY-XXXXXX)
      const { data: customer, error } = await supabase
        .from("customers")
        .select("*")
        .or(`id.eq.${id},customer_id.eq.${id}`)
        .single();

      if (error || !customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
          message: `No customer found with ID: ${id}`,
        });
      }

      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });

      return res.status(200).json({
        success: true,
        customer: {
          ...customer,
          jobs: jobs || [],
        },
      });
    }

    const store = getTestCustomerStore();
    const fallback = findTestCustomer(id);

    if (fallback) {
      return res.status(200).json({
        success: true,
        customer: fallback,
        notes: ["Supabase environment missing - serving seeded test customer."],
      });
    }

    const seeded = upsertTestCustomer({
      id,
      firstName: "Ben",
      lastName: "Stone",
      businessName: "DirectoryBolt Test Customer",
      email: "rainking6693@gmail.com",
      status: "pending",
    });

    store.set(id, seeded);

    return res.status(200).json({
      success: true,
      customer: seeded,
      notes: ["Supabase environment missing - generated placeholder record."],
    });
  } catch (error) {
    console.error("[customers.id] unexpected error", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

