declare module "./_supabaseClient.js" {
  import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
  import type { SupabaseClient } from "@supabase/supabase-js";

  export interface WorkerAuthFailure extends HandlerResponse {
    isValid: false;
  }

  export interface WorkerAuthSuccess {
    isValid: true;
    workerId: string;
  }

  export type WorkerAuthResult = WorkerAuthSuccess | WorkerAuthFailure;

  export const supabase: SupabaseClient<any, "public", any>;

  export function handleSupabaseError(
    error: unknown,
    operation: string,
  ): HandlerResponse;

  export function handleSuccess<T>(data: T, message?: string): HandlerResponse;

  export function testConnection(): Promise<{
    connected: boolean;
    test_query?: string;
    error?: string;
  }>;

  export function validateWorkerAuth(event: HandlerEvent): WorkerAuthResult;

  export function getCorsHeaders(): Record<string, string>;
}
