# DirectoryBolt Complete System Architecture

## 🎯 **System Overview**

DirectoryBolt is now a fully automated, AI-enhanced directory submission platform with real-time monitoring.

---

## 📐 **Complete Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER FRONTEND                            │
│  ┌────────────────┐     ┌────────────────┐    ┌─────────────────┐  │
│  │  Checkout Page │────>│ Stripe Payment │───>│ Success Page    │  │
│  │  directorybolt │     │   (Test Mode)  │    │ (Thank You)     │  │
│  │     .com       │     └────────────────┘    └─────────────────┘  │
│  └────────────────┘                                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Stripe Webhook Event
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       NETLIFY BACKEND                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  pages/api/webhook.js                                         │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  handleCheckoutSessionCompleted()                     │    │  │
│  │  │    ↓                                                  │    │  │
│  │  │  processPackagePurchase()                             │    │  │
│  │  │    ↓                                                  │    │  │
│  │  │  queueSubmissionsForCustomer()                        │    │  │
│  │  │    ├─> Create customer record (customers table)       │    │  │
│  │  │    ├─> Create master job (jobs table)                 │    │  │
│  │  │    ├─> Select directories by tier                     │    │  │
│  │  │    └─> Create submission tasks (directory_submissions)│    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                                │  │
│  │  pages/api/worker/update-progress.ts                          │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  Worker Progress Reporter API                         │    │  │
│  │  │  - Authenticates worker (Bearer token)               │    │  │
│  │  │  - Updates job progress                              │    │  │
│  │  │  - Updates submission status                         │    │  │
│  │  │  - Calculates progress percentage                    │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Database Operations
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                             │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐ │
│  │   customers      │   │      jobs        │   │   directories   │ │
│  │   (UUID id)      │   │   (UUID id)      │   │   (UUID id)     │ │
│  │ ┌──────────────┐ │   │ ┌──────────────┐ │   │ ┌─────────────┐ │ │
│  │ │ email        │ │   │ │ customer_id  │ │   │ │ name        │ │ │
│  │ │ company_name │ │   │ │ package_type │ │   │ │ website     │ │ │
│  │ │ business_data│ │   │ │ status       │ │   │ │ da_score    │ │ │
│  │ │ tier         │ │   │ │ dirs_total   │ │   │ │ tier        │ │ │
│  │ └──────────────┘ │   │ │ dirs_done    │ │   │ │ is_active   │ │ │
│  └──────────────────┘   │ │ progress %   │ │   │ └─────────────┘ │ │
│                         │ └──────────────┘ │   └─────────────────┘ │
│                         └──────────────────┘                        │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           directory_submissions                                │  │
│  │           (UUID id)                                            │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ customer_id (FK → customers.id)                        │   │  │
│  │  │ directory_id (FK → directories.id)                     │   │  │
│  │  │ submission_queue_id (FK → jobs.id)                     │   │  │
│  │  │ status: 'pending' | 'submitting' | 'submitted' | etc   │   │  │
│  │  │ listing_data: JSONB (business info)                    │   │  │
│  │  │ error_log: JSONB                                       │   │  │
│  │  │ submitted_at, approved_at, failed_at                   │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║              REALTIME SUBSCRIPTIONS (WebSockets)              ║  │
│  ║  Pushes updates to connected clients when data changes       ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Polling for 'pending' submissions
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   AI WORKER (DB-Worker Repo)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  workers/playwright-worker/src/aiWorker.ts                    │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  1. Poll Supabase for status='pending'               │    │  │
│  │  │  2. Fetch submission + customer + directory data     │    │  │
│  │  │  3. Initialize ProgressReporter                      │    │  │
│  │  │  4. Report job started to backend                    │    │  │
│  │  │  5. Process each submission:                         │    │  │
│  │  │     ┌─────────────────────────────────────────┐      │    │  │
│  │  │     │ AI-Enhanced Processing Pipeline:        │      │    │  │
│  │  │     │  • AIFormMapper - Auto-detect fields    │      │    │  │
│  │  │     │  • SuccessProbabilityCalculator         │      │    │  │
│  │  │     │  • SubmissionTimingOptimizer            │      │    │  │
│  │  │     │  • DescriptionCustomizer                │      │    │  │
│  │  │     │  • Playwright browser automation        │      │    │  │
│  │  │     │  • IntelligentRetryAnalyzer (on fail)   │      │    │  │
│  │  │     └─────────────────────────────────────────┘      │    │  │
│  │  │  6. Report progress after each submission            │    │  │
│  │  │  7. Update submission status in Supabase             │    │  │
│  │  │  8. Report job completed                             │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                                │  │
│  │  workers/playwright-worker/src/progressReporter.ts            │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  ProgressReporter Methods:                            │    │  │
│  │  │  • reportJobStarted()                                 │    │  │
│  │  │  • reportSubmissionStarted()                          │    │  │
│  │  │  • reportSubmissionSuccess()                          │    │  │
│  │  │  • reportSubmissionFailed()                           │    │  │
│  │  │  • reportDirectoryProgress()                          │    │  │
│  │  │  • reportJobCompleted()                               │    │  │
│  │  │                                                        │    │  │
│  │  │  All call POST /api/worker/update-progress           │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Progress Updates (HTTP POST)
                         ↓
                    [Backend API]
                         │
                         │ Updates Database
                         ↓
                  [Supabase Realtime]
                         │
                         │ WebSocket Push
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND DASHBOARDS                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STAFF DASHBOARD                                              │  │
│  │  components/staff-dashboard/ProgressTracking/                 │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  useRealtimeSubmissions({ watchAllJobs: true })      │    │  │
│  │  │    ↓                                                  │    │  │
│  │  │  Real-Time Display:                                   │    │  │
│  │  │  • All active jobs                                    │    │  │
│  │  │  • Progress bars (0-100%)                             │    │  │
│  │  │  • Success/failure counts                             │    │  │
│  │  │  • Current directory being processed                  │    │  │
│  │  │  • Live activity feed                                 │    │  │
│  │  │  • Connection status (🟢 Live / 🔴 Reconnecting)     │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CUSTOMER PORTAL                                              │  │
│  │  components/customer-portal/SubmissionProgress.tsx            │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  useRealtimeSubmissions({ customerId, jobId })       │    │  │
│  │  │    ↓                                                  │    │  │
│  │  │  Customer View:                                       │    │  │
│  │  │  • Their job progress                                 │    │  │
│  │  │  • Directories completed/failed                       │    │  │
│  │  │  • Current activity                                   │    │  │
│  │  │  • Recent submission list                             │    │  │
│  │  │  • Estimated completion time                          │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Data Flow Summary**

### **1. Purchase Flow**
```
Customer → Stripe → Webhook → Supabase
```
1. Customer completes purchase
2. Stripe sends webhook event
3. Backend creates customer, job, and submissions
4. All records stored in Supabase

### **2. Processing Flow**
```
Worker → Polls → Processes → Reports → Updates Database
```
1. Worker polls for `status='pending'`
2. Processes with AI services
3. Reports progress to backend API
4. Backend updates Supabase tables

### **3. Real-Time Flow**
```
Database Update → Realtime Trigger → WebSocket → Frontend
```
1. Worker updates job/submission status
2. Supabase Realtime detects change
3. WebSocket pushes to connected clients
4. Frontend instantly updates UI

---

## 📦 **Package Tier Logic**

| Tier | Directories | Selection Query |
|------|-------------|-----------------|
| Starter | 50 | `WHERE priority_tier <= 1 AND is_active = true ORDER BY da_score DESC LIMIT 50` |
| Growth | 100 | `WHERE priority_tier <= 2 AND is_active = true ORDER BY da_score DESC LIMIT 100` |
| Professional | 300 | `WHERE priority_tier <= 3 AND is_active = true ORDER BY da_score DESC LIMIT 300` |
| Enterprise | 500+ | `WHERE priority_tier <= 5 AND is_active = true ORDER BY da_score DESC LIMIT 500` |

**Selection Priority:**
1. Tier access (1-5)
2. Active status
3. Domain Authority (highest first)
4. Package limit

---

## 🤖 **AI Services Integration**

The worker uses **7 AI services** for each submission:

1. **AIFormMapper** - Auto-detects form fields on any website
2. **SuccessProbabilityCalculator** - Predicts likelihood of approval
3. **SubmissionTimingOptimizer** - Chooses best time to submit
4. **DescriptionCustomizer** - Tailors business description
5. **AIEnhancedQueueManager** - Prioritizes submissions
6. **IntelligentRetryAnalyzer** - Smart failure analysis
7. **PerformanceFeedbackLoop** - Continuous learning

---

## 🔐 **Authentication Flow**

### **Worker → Backend**
```http
POST /api/worker/update-progress
Authorization: Bearer <WORKER_AUTH_TOKEN>
```

### **Frontend → Supabase**
```javascript
createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// Row Level Security handles permissions
```

---

## 📊 **Real-Time Update Types**

### **Job Updates**
- Status change (pending → in_progress → completed)
- Directories completed count
- Directories failed count
- Progress percentage (0-100)
- Current directory being processed

### **Submission Updates**
- Status change (pending → submitting → submitted → approved)
- Error messages
- Timestamps (submitted_at, approved_at, failed_at)
- Error log entries

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT                                  │
│                                                          │
│  Frontend + API:  Netlify (directorybolt.com)          │
│  Database:        Supabase (PostgreSQL + Realtime)     │
│  AI Worker:       Render.com (Docker container)        │
│  Payments:        Stripe (webhooks)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**URLs:**
- **Customer Site:** `https://directorybolt.com`
- **API Endpoints:** `https://directorybolt.com/api/*`
- **AI Worker:** `https://playwright-worker-*.onrender.com`
- **Database:** `https://*.supabase.co`

---

## ✅ **System Capabilities**

- ✅ Automated queue system
- ✅ Real-time progress monitoring
- ✅ AI-enhanced form filling
- ✅ Intelligent retry logic
- ✅ Multi-tier package support
- ✅ Customer portal (ready)
- ✅ Staff dashboard (active)
- ✅ Webhook integration
- ✅ Error logging
- ✅ Progress percentage
- ✅ Success/failure tracking
- ✅ WebSocket live updates
- ✅ Horizontal scaling ready

---

## 📈 **Scalability**

The system can scale:
- **Workers:** Deploy multiple Render instances
- **Database:** Supabase auto-scales
- **Realtime:** Supabase handles millions of connections
- **API:** Netlify serverless functions auto-scale

---

## 🎯 **Success Metrics**

Track these in the dashboard:
- Jobs completed per day
- Average submission success rate
- Average processing time per directory
- Customer satisfaction (completion %)
- AI service accuracy
- Error rate by directory

---

## 📝 **Related Documentation**

- **Queue System:** `QUEUE_SYSTEM_INTEGRATION.md`
- **Real-Time Communication:** `REALTIME-COMMUNICATION-GUIDE.md`
- **AI Worker Deployment:** `AI-WORKER-DEPLOYMENT-GUIDE.md`
- **API Compatibility:** `AI-ENHANCED-WORKER-API-COMPATIBILITY.md`

---

## 🎉 **System Status: PRODUCTION READY**

All components are implemented, tested, and ready for deployment!

