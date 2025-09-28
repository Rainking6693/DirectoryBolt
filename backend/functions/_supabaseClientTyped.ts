import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const client = require("./_supabaseClient.js");

import type {
  DirectoryBoltDatabase,
  JobResultsInsert,
  JobResultsRow,
  JobResultsUpdate,
  JobsInsert,
  JobsRow,
  JobsUpdate,
  JobStatus,
  Json,
} from "../../types/supabase";

export interface WorkerAuthFailure extends HandlerResponse {
  isValid: false;
}

export interface WorkerAuthSuccess {
  isValid: true;
  workerId: string;
}

export type WorkerAuthResult = WorkerAuthSuccess | WorkerAuthFailure;

type HelperShape = {
  handleSupabaseError: (error: unknown, operation: string) => HandlerResponse;
  handleSuccess: <T>(data: T, message?: string) => HandlerResponse;
  testConnection: () => Promise<{
    connected: boolean;
    test_query?: string;
    error?: string;
  }>;
  validateWorkerAuth: (event: HandlerEvent) => WorkerAuthResult;
  getCorsHeaders: () => Record<string, string>;
};

const helperClient = client as HelperShape;

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase admin configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

export const supabase = createClient<DirectoryBoltDatabase, "public">(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "DirectoryBolt-AutoBolt-Backend",
      },
    },
  },
);

export const {
  handleSupabaseError,
  handleSuccess,
  testConnection,
  validateWorkerAuth,
  getCorsHeaders,
} = helperClient;

export type {
  JobsRow,
  JobsInsert,
  JobsUpdate,
  JobResultsRow,
  JobResultsInsert,
  JobResultsUpdate,
  DirectoryBoltDatabase,
  JobStatus,
  Json,
} from "../../types/supabase";


