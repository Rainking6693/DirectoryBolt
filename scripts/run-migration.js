#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
    process.exit(1);
  }

  const sqlPath = path.resolve(fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
    process.exit(1);
  }

  // Supabase Postgres REST query endpoint
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/pg_exec`; // Using a helper function if available

  // Some Supabase projects don't expose pg_exec. Fallback to /rest/v1 via built-in rpc unsupported.
  // Prefer using the SQL editor UI. If pg_exec is available as a Postgres function:
  // CREATE OR REPLACE FUNCTION public.pg_exec(sql text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN EXECUTE sql; END; $$; SECURITY DEFINER;

  try {
    console.log('Executing SQL migration:', sqlPath);

    // Attempt using pg:query if enabled
    const altUrl = `${SUPABASE_URL.replace(/\/$/, '')}/pg`;
    const headers = {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    };

    // Try PostgREST "sql" extension (if enabled via pgroonga or sql endpoints). Many projects do not have it.
    // Safer: chunk by statements and execute via /rest/v1/rpc/exec_sql custom function if present.

    // Fallback: Show instructions to paste in SQL editor
    console.warn('Direct SQL execution via REST is not guaranteed.');
    console.warn('Please paste the contents of the file into the Supabase SQL editor if this fails.');

    // Try calling a custom function exec_sql if exists
    const rpcUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`;
    const resp = await axios.post(rpcUrl, { sql }, { headers, timeout: 60000 });
    console.log('Migration response:', resp.status, resp.data);
    console.log('✅ Migration executed via exec_sql');
  } catch (e) {
    console.error('❌ Migration via REST RPC failed:', e?.response?.status, e?.response?.data || e.message);
    console.log('\nManual fallback:');
    console.log('1) Open Supabase dashboard → SQL');
    console.log('2) Paste contents of:', sqlPath);
    console.log('3) Run');
    process.exit(2);
  }
}

main();
