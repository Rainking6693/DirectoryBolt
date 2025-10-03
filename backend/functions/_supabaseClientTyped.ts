import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "../../lib/server/supabaseEnv";

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

const { url: supabaseUrl, serviceRoleKey: supabaseServiceKey } = getSupabaseServerConfig();

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

