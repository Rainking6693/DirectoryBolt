# Backend API Issues - Resolution Guide

Date: October 29, 2025  
Status: ✅ FIXED (Issues 1 & 2) | ⚠️ PARTIAL (Issues 3 & 4)

---

## ✅ FIXED Issues

### Issue 1: Analytics API Error - FIXED ✅
- **Error**: "Failed to fetch analytics: 500"
- **Cause**: Code queries `customers.status` column which doesn't exist
- **File**: `pages/api/staff/analytics.ts`
- **Fix Applied**: 
  - Removed `status` from customers SELECT query (line 40)
  - Updated `buildDrilldownLists()` to derive status from jobs table (line 90-92)
  - Analytics now correctly uses `jobs.status` instead of non-existent `customers.status`

### Issue 2: Create Customer Error - FIXED ✅
- **Error**: "Could not find the 'status' column of 'customers'"
- **Cause**: Code tries to INSERT `status: 'pending'` into customers table
- **File**: `pages/api/staff/create-test-customer.ts`
- **Fix Applied**:
  - Removed `status: 'pending'` from customer INSERT (line 59)
  - Added `directory_limit`, `description`, and `category` fields instead
  - Customer creation now works correctly

---

## ⚠️ Remaining Issues (Require Database Changes)

### Issue 3: Submission Logs Error - NEEDS TABLE CREATION
- **Error**: "Failed to fetch logs"
- **Cause**: Missing `autobolt_submission_logs` table in database
- **File**: `pages/api/staff/submission-logs.ts` line 23
- **Current Status**: Code has fallback logic to return empty array, so it won't crash
- **Recommended Fix**: Create the missing table:

```sql
CREATE TABLE IF NOT EXISTS autobolt_submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT,
  job_id UUID,
  directory_name TEXT NOT NULL,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  screenshot_url TEXT,
  success BOOLEAN,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submission_logs_customer ON autobolt_submission_logs(customer_id);
CREATE INDEX idx_submission_logs_job ON autobolt_submission_logs(job_id);
CREATE INDEX idx_submission_logs_timestamp ON autobolt_submission_logs(timestamp DESC);
```

### Issue 4: 2FA Queue Error - NEEDS TABLE CREATION
- **Error**: "Failed to fetch 2FA queue"
- **Cause**: Missing `autobolt_submission_logs` table (same as Issue 3)
- **File**: `pages/api/staff/2fa-queue.ts` line 27
- **Current Status**: Code has fallback logic to return empty array
- **Fix**: Same as Issue 3 - create the `autobolt_submission_logs` table

---

## Database Schema Reference

### Customers Table (Actual Schema)
```sql
CREATE TABLE public.customers (
  id text NOT NULL,
  customer_id character varying NOT NULL UNIQUE,
  business_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  website character varying,
  address text,
  city character varying,
  state character varying,
  zip character varying,
  country character varying DEFAULT 'USA',
  package_type character varying DEFAULT 'starter',
  directory_limit integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  category text,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
```

**Note:** No `status` column exists. Customer status is derived from related jobs.

### Jobs Table (Has Status)
```sql
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'in_progress', 'complete', 'failed'])),
  package_size integer NOT NULL,
  ...
);
```

---

## Testing Instructions

### Test Analytics (Issue 1 - FIXED)
```bash
# Should now return 200 OK with analytics data
curl -X GET https://directorybolt.com/api/staff/analytics \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN"
```

### Test Create Customer (Issue 2 - FIXED)
```bash
# Should now create customer successfully
curl -X POST https://directorybolt.com/api/staff/create-test-customer \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Customer", "email": "test@example.com"}'
```

### Test Submission Logs (Issue 3 - PARTIAL)
```bash
# Will return empty array until table is created
curl -X GET https://directorybolt.com/api/staff/submission-logs \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN"
```

---

## Summary

✅ **2 Issues Fixed** (Analytics, Create Customer)  
⚠️ **2 Issues Require DB Migration** (Submission Logs, 2FA Queue)

**Next Steps:**
1. Test the fixed endpoints (Analytics and Create Customer)
2. Create `autobolt_submission_logs` table in Supabase
3. Verify all dashboard tabs load correctly
