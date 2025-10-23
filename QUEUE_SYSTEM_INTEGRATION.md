# DirectoryBolt AI Worker Queue System Integration

## 🎯 **Overview**

This document describes the new automated queue system that replaced the old directory submission processing logic. The system creates a "master job" and individual submission tasks that the AI-enhanced worker polls and processes automatically.

---

## 📊 **Architecture**

```
Customer Purchase (Stripe) 
    ↓
Webhook Handler (`pages/api/webhook.js`)
    ↓
processPackagePurchase()
    ↓
queueSubmissionsForCustomer()
    ↓
Database Records Created:
    - 1 Customer record (customers table)
    - 1 Master Job (jobs table)
    - N Submission Tasks (directory_submissions table)
    ↓
AI Worker Poller (Render.com)
    ↓
Processes Each Submission with AI Services
```

---

## 🗄️ **Database Tables**

### **1. `customers` Table**
- **Purpose:** Store customer information
- **Key Fields:**
  - `id` (UUID) - Primary key
  - `email` (VARCHAR) - Unique identifier
  - `full_name` (VARCHAR)
  - `company_name` (VARCHAR)
  - `business_data` (JSONB) - Stores all business details
  - `subscription_tier` (VARCHAR) - Package tier
  - `subscription_status` (VARCHAR)

### **2. `jobs` Table**
- **Purpose:** Master job tracking
- **Key Fields:**
  - `id` (UUID) - Primary key
  - `customer_id` (VARCHAR) - Links to customer
  - `package_type` (VARCHAR) - starter, growth, professional, enterprise
  - `directory_limit` (INTEGER) - Number of directories to process
  - `directories_to_process` (INTEGER)
  - `directories_completed` (INTEGER)
  - `directories_failed` (INTEGER)
  - `business_data` (JSONB) - Business info for submissions
  - `status` (VARCHAR) - pending, in_progress, completed, failed
  - `priority_level` (INTEGER) - 1-5 priority

### **3. `directory_submissions` Table**
- **Purpose:** Individual submission tasks for AI worker
- **Key Fields:**
  - `id` (UUID) - Primary key
  - `customer_id` (UUID) - Foreign key to customers
  - `directory_id` (UUID) - Foreign key to directories
  - `submission_queue_id` (UUID) - Foreign key to jobs (master job)
  - `status` (VARCHAR) - **pending**, submitting, submitted, approved, rejected, failed
  - `listing_data` (JSONB) - Business data for this submission
  - `listing_url` (VARCHAR) - Result URL after submission
  - `error_log` (JSONB) - Errors encountered
  - `retry_attempts` (INTEGER)

---

## 🔄 **Purchase Flow**

### **Step 1: Customer Completes Purchase**
- Customer buys a package on directorybolt.com
- Stripe processes payment
- Stripe sends webhook to `/api/webhook`

### **Step 2: Webhook Handler Processes Event**
```javascript
handleCheckoutSessionCompleted(session, requestId)
  ↓
processPackagePurchase({
  session_id: sessionId,
  customer_id: customerId,
  package_id: packageId,
  total_directories: totalDirectories,
  custom_fields: session.custom_fields
})
```

### **Step 3: Create Customer Record**
```javascript
// Check if customer exists by email
const { data: existingCustomer } = await supabase
  .from('customers')
  .select('id')
  .eq('email', customerEmail)
  .single();

// If not, create new customer
if (!customerId) {
  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({
      email: customerEmail,
      full_name: fullName,
      company_name: businessName,
      business_data: { /* all business details */ },
      subscription_tier: packageTier
    })
    .select('id')
    .single();
  
  customerId = newCustomer.id; // UUID
}
```

### **Step 4: Queue Submissions**
```javascript
await queueSubmissionsForCustomer({
  customerId: customerId,        // UUID
  businessData: { /* ... */ },
  packageTier: 'growth',         // starter, growth, professional, enterprise
  packageSize: 100               // Number of directories
});
```

### **Step 5: Create Master Job**
```javascript
const { data: newJob } = await supabase
  .from('jobs')
  .insert({
    customer_id: customerId.toString(),
    customer_name: businessData.business_name,
    customer_email: businessData.email,
    package_type: packageTier,
    directory_limit: packageSize,
    directories_to_process: packageSize,
    business_data: businessData,
    status: 'pending',
    priority_level: 4
  })
  .select('id')
  .single();

const masterJobId = newJob.id; // UUID
```

### **Step 6: Select Directories**
```javascript
// Determine tier access level
const tierMap = {
  'starter': 1,      // Easy directories only
  'growth': 2,       // Easy + Medium
  'professional': 3, // Easy + Medium + Hard
  'enterprise': 5    // All directories
};

// Query directories table
const { data: directories } = await supabase
  .from('directories')
  .select('id, name, website, da_score')
  .lte('priority_tier', tierNumber)
  .eq('is_active', true)
  .order('da_score', { ascending: false })
  .limit(packageSize);
```

### **Step 7: Create Submission Tasks**
```javascript
const submissionsToInsert = directories.map(directory => ({
  customer_id: customerId,           // UUID
  directory_id: directory.id,        // UUID
  submission_queue_id: masterJobId,  // UUID
  status: 'pending',                 // AI worker looks for this
  listing_data: businessData         // Business info for forms
}));

await supabase
  .from('directory_submissions')
  .insert(submissionsToInsert);
```

---

## 🤖 **AI Worker Processing**

### **Worker Poll Loop**
The AI worker (deployed on Render.com) continuously polls for pending submissions:

```javascript
// Worker polls every 5 seconds
const { data: pendingSubmissions } = await supabase
  .from('directory_submissions')
  .select('*, directories(*), customers(*)')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
  .limit(1);

if (pendingSubmissions.length > 0) {
  await processSubmission(pendingSubmissions[0]);
}
```

### **AI-Enhanced Processing**
For each submission, the worker:
1. **AIFormMapper** - Detects and maps form fields
2. **SuccessProbabilityCalculator** - Calculates likelihood of success
3. **SubmissionTimingOptimizer** - Chooses optimal submission time
4. **DescriptionCustomizer** - Tailors business description
5. **Playwright** - Fills and submits form
6. **IntelligentRetryAnalyzer** - Analyzes failures for smart retries

### **Status Updates**
Worker updates submission status in real-time:
- `pending` → `submitting` → `submitted` → `approved`
- Or: `pending` → `submitting` → `failed` (with error log)

---

## 📦 **Package Tiers**

| Tier | Directories | Tier Access | Min Success Rate |
|------|-------------|-------------|------------------|
| Starter | 50 | 1 | 80% |
| Growth | 100 | 1-2 | 75% |
| Professional | 300 | 1-3 | 70% |
| Enterprise | 500+ | 1-5 (All) | No minimum |

---

## 🔍 **Directory Selection Logic**

Directories are selected based on:
1. **Tier Access** - Package tier determines which directories are eligible
2. **Active Status** - Only `is_active = true` directories
3. **Domain Authority** - Sorted by `da_score` (highest first)
4. **Success Rate** - Minimum threshold based on tier
5. **Package Limit** - Limited to package size

---

## ✅ **Benefits of New System**

1. **Separation of Concerns** - Backend only creates database records
2. **Scalability** - Workers can scale independently
3. **AI Integration** - All AI services fully integrated
4. **Retry Logic** - Intelligent retry with error analysis
5. **Real-Time Updates** - Status updates in database
6. **Monitoring** - Complete audit trail of all submissions

---

## 🚫 **What Was Removed**

The following old logic was replaced:
- ❌ Direct submission processing in webhook
- ❌ Chrome extension processing requests
- ❌ `sendToExtension()` calls
- ❌ Manual queue management
- ❌ Airtable integrations

---

## 🧪 **Testing**

To test the complete flow:

1. **Create a test customer** in the staff dashboard
2. **Verify database records:**
   ```sql
   -- Check customer created
   SELECT * FROM customers WHERE email = 'test@example.com';
   
   -- Check job created
   SELECT * FROM jobs WHERE customer_email = 'test@example.com';
   
   -- Check submissions queued
   SELECT * FROM directory_submissions 
   WHERE customer_id = (SELECT id FROM customers WHERE email = 'test@example.com');
   ```
3. **Monitor AI worker logs** on Render.com
4. **Watch status updates** in real-time

---

## 📊 **Monitoring Queries**

```sql
-- Jobs by status
SELECT status, COUNT(*) 
FROM jobs 
GROUP BY status;

-- Submissions by status
SELECT status, COUNT(*) 
FROM directory_submissions 
GROUP BY status;

-- Customer progress
SELECT 
  c.company_name,
  j.directories_to_process,
  j.directories_completed,
  j.directories_failed,
  (j.directories_completed::float / j.directories_to_process * 100) as progress_pct
FROM jobs j
JOIN customers c ON c.id::text = j.customer_id
WHERE j.status = 'in_progress';
```

---

## 🔗 **Related Files**

- `pages/api/webhook.js` - Webhook handler with new queue logic
- `workers/playwright-worker/src/aiWorker.ts` - AI worker entry point
- `workers/playwright-worker/src/aiJobProcessor.ts` - Job processing logic
- `migrations/020_create_job_queue_tables.sql` - Jobs table schema
- `migrations/014_create_directory_submissions_table.sql` - Submissions table schema
- `migrations/011_create_customers_table.sql` - Customers table schema

---

## 📝 **Summary**

**Old System:** Webhook → Process → Extension → Submit
**New System:** Webhook → Queue → AI Worker → Submit

The backend now **only creates database records**. The AI worker **polls and processes automatically**.

