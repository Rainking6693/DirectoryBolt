import { createClient } from "@supabase/supabase-js";

// Enhanced Supabase client for Netlify Functions
// Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing required Supabase environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
  );
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
});

// Helper function for consistent error handling
export function handleSupabaseError(error, operation) {
  console.error(`Supabase ${operation} error:`, error);
  return {
    statusCode: 500,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production"
          ? "https://directorybolt.netlify.app"
          : "*",
    },
    body: JSON.stringify({
      success: false,
      error: error.message || "Database operation failed",
      operation,
      timestamp: new Date().toISOString(),
    }),
  };
}

// Helper function for consistent success responses
export function handleSuccess(data, message = "Operation successful") {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production"
          ? "https://directorybolt.netlify.app"
          : "*",
    },
    body: JSON.stringify({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }),
  };
}

// Connection test function for health checks
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("jobs").select("id").limit(1);

    if (error) throw error;
    return { connected: true, test_query: "success" };
  } catch (error) {
    console.error("Supabase connection test failed:", error);
    return { connected: false, error: error.message };
  }
}

// Authentication middleware for worker endpoints
export function validateWorkerAuth(event) {
  const authToken =
    event.headers["authorization"] || event.headers["x-worker-auth"];
  const workerId = event.headers["x-worker-id"];
  const expectedToken = process.env.WORKER_AUTH_TOKEN;

  if (!expectedToken) {
    console.error("WORKER_AUTH_TOKEN not configured in environment");
    return {
      isValid: false,
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Server configuration error",
      }),
    };
  }

  if (!authToken) {
    return {
      isValid: false,
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error:
          "Missing authentication token. Include Authorization or X-Worker-Auth header.",
      }),
    };
  }

  if (!workerId) {
    return {
      isValid: false,
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Missing X-Worker-ID header",
      }),
    };
  }

  const token = authToken.replace("Bearer ", "");
  if (token !== expectedToken) {
    return {
      isValid: false,
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Invalid authentication token",
      }),
    };
  }

  return {
    isValid: true,
    workerId,
  };
}

// CORS configuration for production security
export function getCorsHeaders() {
  const origin =
    process.env.NODE_ENV === "production"
      ? "https://directorybolt.netlify.app"
      : "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Worker-ID, X-Worker-Auth",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
