# Real-Time Communication System

## 🎯 **Overview**

The DirectoryBolt system now has **three-way real-time communication** between the AI worker, backend, and frontend dashboards.

```
AI Worker (Render) ← → Backend (Netlify) ← → Frontend (Dashboard)
     ↓                        ↓                      ↓
  Progress               Supabase DB          Real-Time Updates
  Reports                   Updates              via Supabase
```

---

## 🔄 **Communication Flow**

### **1. Worker → Backend**
The AI worker sends progress updates via API endpoint:

```typescript
POST /api/worker/update-progress
Authorization: Bearer <WORKER_AUTH_TOKEN>

{
  "job_id": "uuid",
  "submission_id": "uuid",
  "status": "submitting",
  "directories_completed": 5,
  "directories_failed": 0,
  "current_directory": "Google My Business"
}
```

### **2. Backend → Database**
The API endpoint updates Supabase tables:
- `jobs` table - Overall job progress
- `directory_submissions` table - Individual submission status

### **3. Database → Frontend**
Supabase Realtime pushes updates to connected clients:
```typescript
// Dashboard automatically receives updates via WebSocket
{
  job_id: "uuid",
  status: "in_progress",
  directories_completed: 5,
  progress_percentage: 25,
  current_directory: "Google My Business"
}
```

---

## 🛠️ **Implementation Components**

### **1. Worker Progress Reporter**
Location: `workers/playwright-worker/src/progressReporter.ts`

```typescript
const reporter = new ProgressReporter();

// Report job started
await reporter.reportJobStarted(jobId);

// Report submission progress
await reporter.reportSubmissionStarted(jobId, submissionId, "LinkedIn");
await reporter.reportSubmissionSuccess(jobId, submissionId, 1, 0);

// Report overall progress
await reporter.reportDirectoryProgress(jobId, 5, 0, "Facebook Business");

// Report job completed
await reporter.reportJobCompleted(jobId, 100, 5);
```

### **2. Backend API Endpoint**
Location: `pages/api/worker/update-progress.ts`

**Features:**
- Authenticates worker via Bearer token
- Updates job progress in `jobs` table
- Updates submission status in `directory_submissions` table
- Calculates progress percentage automatically
- Appends to error logs
- Timestamps all status changes

### **3. Real-Time Subscriptions**
Location: `lib/realtime/submission-updates.ts`

**Functions:**
- `subscribeToCustomerSubmissions(customerId)` - Customer-specific updates
- `subscribeToJobUpdates(jobId)` - Single job updates
- `subscribeToAllActiveJobs()` - All jobs (staff dashboard)

### **4. React Hook**
Location: `hooks/useRealtimeSubmissions.ts`

```typescript
// In staff dashboard
const { submissions, jobs, isConnected, lastUpdate } = useRealtimeSubmissions({
  watchAllJobs: true
});

// In customer portal
const { submissions, jobs, isConnected } = useRealtimeSubmissions({
  customerId: 'uuid',
  jobId: 'uuid'
});
```

---

## 📊 **Data Flow Examples**

### **Example 1: Job Start**

**Worker:**
```typescript
await reporter.reportJobStarted('job-123');
```

**API Updates:**
```sql
UPDATE jobs SET
  status = 'in_progress',
  started_at = NOW(),
  directories_completed = 0,
  directories_failed = 0
WHERE id = 'job-123';
```

**Dashboard Receives:**
```typescript
{
  job_id: 'job-123',
  status: 'in_progress',
  directories_completed: 0,
  directories_failed: 0,
  progress_percentage: 0,
  timestamp: '2025-10-23T10:30:00Z'
}
```

### **Example 2: Submission Progress**

**Worker:**
```typescript
await reporter.reportSubmissionStarted('job-123', 'sub-456', 'Google My Business');
// ... processing ...
await reporter.reportSubmissionSuccess('job-123', 'sub-456', 1, 0);
```

**API Updates:**
```sql
-- Update submission
UPDATE directory_submissions SET
  status = 'submitted',
  submitted_at = NOW()
WHERE id = 'sub-456';

-- Update job
UPDATE jobs SET
  directories_completed = 1,
  progress_percentage = 1.0,
  metadata = jsonb_set(metadata, '{current_directory}', '"Google My Business"')
WHERE id = 'job-123';
```

**Dashboard Receives:**
```typescript
// Submission update
{
  submission_id: 'sub-456',
  status: 'submitted',
  directory_name: 'Google My Business',
  timestamp: '2025-10-23T10:31:00Z'
}

// Job update
{
  job_id: 'job-123',
  directories_completed: 1,
  progress_percentage: 1.0,
  current_directory: 'Google My Business',
  timestamp: '2025-10-23T10:31:00Z'
}
```

---

## 🎨 **Frontend Integration**

### **Staff Dashboard**

Update `components/staff-dashboard/ProgressTracking/index.tsx`:

```typescript
import { useRealtimeSubmissions } from '../../../hooks/useRealtimeSubmissions';

export default function ProgressTracking() {
  const { jobs, submissions, isConnected, lastUpdate } = useRealtimeSubmissions({
    watchAllJobs: true
  });

  // Convert jobs Map to array for display
  const activeJobs = Array.from(jobs.values())
    .filter(job => job.status === 'in_progress')
    .map(job => ({
      customerId: job.customer_id,
      jobId: job.job_id,
      progress: job.progress_percentage,
      directoriesCompleted: job.directories_completed,
      directoriesFailed: job.directories_failed,
      currentActivity: job.current_directory 
        ? `Processing ${job.current_directory}...` 
        : 'Starting...',
      status: job.status
    }));

  return (
    <div>
      <div className="connection-status">
        {isConnected ? '🟢 Live' : '🔴 Reconnecting...'}
      </div>
      
      <LiveDashboard 
        activeJobs={activeJobs}
        isConnected={isConnected}
      />
      
      {lastUpdate && (
        <div>Last update: {lastUpdate.toLocaleTimeString()}</div>
      )}
    </div>
  );
}
```

### **Customer Portal**

Create `components/customer-portal/SubmissionProgress.tsx`:

```typescript
import { useRealtimeSubmissions } from '../../hooks/useRealtimeSubmissions';

interface SubmissionProgressProps {
  customerId: string;
  jobId: string;
}

export default function SubmissionProgress({ customerId, jobId }: SubmissionProgressProps) {
  const { jobs, submissions, isConnected, getJob } = useRealtimeSubmissions({
    customerId,
    jobId
  });

  const job = getJob(jobId);

  if (!job) return <div>Loading...</div>;

  return (
    <div className="submission-progress">
      <h2>Your Submission Progress</h2>
      
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${job.progress_percentage}%` }}
        />
      </div>
      
      {/* Stats */}
      <div className="stats">
        <div>Completed: {job.directories_completed}</div>
        <div>Failed: {job.directories_failed}</div>
        <div>Progress: {job.progress_percentage.toFixed(1)}%</div>
      </div>
      
      {/* Current Activity */}
      {job.current_directory && (
        <div className="current-activity">
          Currently processing: {job.current_directory}
        </div>
      )}
      
      {/* Recent Submissions */}
      <div className="recent-submissions">
        <h3>Recent Submissions</h3>
        {submissions.slice(-10).reverse().map(sub => (
          <div key={sub.submission_id} className="submission-item">
            <span className="directory">{sub.directory_name}</span>
            <span className={`status status-${sub.status}`}>
              {sub.status}
            </span>
          </div>
        ))}
      </div>
      
      {/* Connection Status */}
      <div className="connection-status">
        {isConnected ? '🟢 Live Updates' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
}
```

---

## 🔧 **Worker Integration**

Update `workers/playwright-worker/src/aiWorker.ts`:

```typescript
import { ProgressReporter } from './progressReporter';

const reporter = new ProgressReporter();

async function processJob(job: Job) {
  const jobId = job.id;
  let completed = 0;
  let failed = 0;
  
  try {
    // Report job started
    await reporter.reportJobStarted(jobId);
    console.log(`📊 Job ${jobId} started - reporting to backend`);
    
    // Get pending submissions
    const submissions = await getPendingSubmissions(jobId);
    
    // Process each submission
    for (const submission of submissions) {
      try {
        // Report submission started
        await reporter.reportSubmissionStarted(
          jobId,
          submission.id,
          submission.directory_name
        );
        
        // Process with AI services
        const result = await processSubmission(submission);
        
        if (result.success) {
          completed++;
          await reporter.reportSubmissionSuccess(jobId, submission.id, completed, failed);
        } else {
          failed++;
          await reporter.reportSubmissionFailed(
            jobId,
            submission.id,
            result.error || 'Unknown error',
            completed,
            failed
          );
        }
        
        // Report overall progress every submission
        await reporter.reportDirectoryProgress(
          jobId,
          completed,
          failed,
          submission.directory_name
        );
        
      } catch (error) {
        failed++;
        await reporter.reportSubmissionFailed(
          jobId,
          submission.id,
          error.message,
          completed,
          failed
        );
      }
    }
    
    // Report job completed
    await reporter.reportJobCompleted(jobId, completed, failed);
    console.log(`✅ Job ${jobId} completed - ${completed} succeeded, ${failed} failed`);
    
  } catch (error) {
    await reporter.reportJobFailed(jobId, error.message, completed, failed);
    console.error(`❌ Job ${jobId} failed:`, error);
  }
}
```

---

## 🗄️ **Database Schema Updates**

The existing tables already support real-time updates. No schema changes needed!

### **`jobs` Table**
- `status` - Updated by worker
- `directories_completed` - Incremented on success
- `directories_failed` - Incremented on failure
- `progress_percentage` - Calculated automatically
- `metadata` - Stores `current_directory` and other data
- `updated_at` - Timestamp for realtime triggers

### **`directory_submissions` Table**
- `status` - Updated through workflow
- `submitted_at`, `approved_at`, `failed_at` - Timestamped
- `error_log` - Appended with errors
- `last_error_message` - Latest error
- `updated_at` - Timestamp for realtime triggers

---

## 🧪 **Testing Real-Time Updates**

### **Test 1: Worker Progress**
```bash
# In worker logs (Render)
curl -X POST https://directorybolt.com/api/worker/update-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job-123",
    "status": "in_progress",
    "directories_completed": 10,
    "current_directory": "LinkedIn"
  }'
```

### **Test 2: Frontend Subscription**
```typescript
// In browser console
const channel = subscribeToJobUpdates('test-job-123', (update) => {
  console.log('Received update:', update);
});
```

### **Test 3: Supabase Direct**
```sql
-- Trigger update manually in Supabase SQL editor
UPDATE jobs SET
  directories_completed = directories_completed + 1,
  updated_at = NOW()
WHERE id = 'test-job-123';

-- Check if frontend receives update immediately
```

---

## 📝 **Environment Variables**

### **Worker (Render):**
```bash
NETLIFY_FUNCTIONS_URL=https://directorybolt.com
WORKER_AUTH_TOKEN=your_worker_token_here
AUTOBOLT_API_KEY=your_api_key_here  # Fallback
```

### **Backend (Netlify):**
```bash
WORKER_AUTH_TOKEN=your_worker_token_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

### **Frontend:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## ✅ **Benefits**

1. **Real-Time Updates** - No polling delays, instant updates
2. **Scalable** - Supabase Realtime handles WebSocket connections
3. **Reliable** - Fallback to polling if WebSocket fails
4. **Efficient** - Only send updates when data changes
5. **Type-Safe** - Full TypeScript support
6. **Customer-Facing** - Customers can watch their own progress
7. **Staff Monitoring** - Dashboard shows all active jobs

---

## 🚀 **Deployment Checklist**

- ✅ Deploy `update-progress.ts` API endpoint to Netlify
- ✅ Deploy worker with `ProgressReporter` to Render
- ✅ Set `WORKER_AUTH_TOKEN` in both Render and Netlify
- ✅ Enable Supabase Realtime on `jobs` and `directory_submissions` tables
- ✅ Set `NEXT_PUBLIC_SUPABASE_*` env vars in Netlify
- ✅ Update staff dashboard to use `useRealtimeSubmissions` hook
- ✅ Create customer portal with progress view
- ✅ Test with a real job

**The system is now fully connected and ready for real-time monitoring!** 🎉

