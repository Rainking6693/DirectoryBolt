# Technical Architecture — DirectoryBolt

## 1. High-Level Overview
DirectoryBolt is a SaaS platform that automates submission of small business information across hundreds of online directories.  
The system integrates **Stripe for payments**, **Supabase for database + auth**, **Netlify serverless functions for API endpoints**, and **Playwright workers** running in Docker for large-scale directory submission.  
A React/Next.js **staff dashboard** provides visibility, retry control, and monitoring.

---

## 2. Core Components
- **Customer Onboarding** → Signup, authentication, Stripe checkout, business details form.  
- **Supabase Database** → Stores customer records, job queue entries, job results, and worker metadata.  
- **Backend Orchestrator (Netlify Functions)** → Handles job creation, assignment, retries, and status updates.  
- **Playwright Worker Cluster** → Automated headless browsers submit to directories; scale via Docker.  
- **Proxy + Captcha Services** → Ensure reliable submissions at high volumes.  
- **Staff Dashboard** → Real-time monitoring, job retry/pause, completion reporting.  
- **Metrics + Health Endpoints** → Prometheus-compatible metrics, health checks, and scaling signals.

---

## 3. Data Flow
1. **Customer Signs Up** → Registers, selects a plan (Starter 50 / Growth 100 / Professional 300 / Enterprise 500).  
2. **Payment via Stripe** → Stripe Checkout confirms payment; webhook triggers job creation.  
3. **Customer Info Submission** → Business info form completed → stored in Supabase.  
4. **Queue Entry** → A job record is created in Supabase (`jobs` + `job_results`).  
5. **Backend Orchestration** → Orchestrator (`jobs-next`) assigns job to Playwright worker.  
6. **Worker Execution** → Worker pulls job, submits directories, handles captchas via 2Captcha.  
7. **Progress Updates** → Worker writes status + logs back to Supabase.  
8. **Staff Monitoring** → Dashboard shows queue state, retries, and progress.  
9. **Completion** → When all directories processed, Supabase marks job `complete`; results are available for staff and customer.

---

## 4. Streamlined Customer Lifecycle
- **Step 1. Plan Selection** → Customer picks package tier.  
- **Step 2. Payment Processing** → Stripe Checkout validates payment.  
- **Step 3. Info Capture** → Customer provides business details.  
- **Step 4. Job Creation** → Record stored in Supabase `jobs` table.  
- **Step 5. Queue Entry** → Job placed in Supabase queue.  
- **Step 6. Automated Processing** → Orchestrator dispatches job to Playwright worker cluster.  
- **Step 7. Worker Execution** → Worker performs submissions using proxies/captcha solving.  
- **Step 8. Monitoring** → Staff dashboard displays live updates, retry buttons, and queue health.  
- **Step 9. Completion** → Worker logs synced to Supabase; job marked `complete`; customer notified.

---

## 5. Infrastructure Components
- **Netlify Functions**: Expose API endpoints for job queue (`jobs-next`, `jobs-update`, `jobs-retry`, `jobs-complete`, `autobolt-status`, `metrics`, `healthz`).  
- **Supabase**: Database, auth, row-level security (RLS) policies, service role integration.  
- **Docker Worker Cluster**: Playwright workers run headless browsers, scaling horizontally with Docker Compose + auto-scaler.  
- **Proxies & Captcha Solvers**: Rotate IPs, solve captchas for Enterprise (500 directory) tier.  
- **Prometheus Metrics**: Worker/job counts, retries, captchas solved, queue depth → used for scaling.  
- **Monitoring Dashboard**: Staff oversight, retry interface, and system health visualization.

---

## 6. Key Flows

### Customer Signup Flow
- Frontend → Stripe Checkout → Webhook → Supabase entry → Job queue.

### Job Lifecycle
- Supabase `jobs` → Orchestrator → Worker → Supabase updates → Dashboard.

### Retry Flow
- Failed submissions are re-queued by staff (`/jobs/retry`) endpoint.

### Metrics Flow
- Worker → Supabase → Prometheus endpoint → Staff dashboard + auto-scaler.

---

## 7. Constraints & Assumptions
- All sensitive keys (Supabase, Stripe, captcha solvers, proxies) live in `.env.local` or Netlify Dashboard.  
- Jobs must always pass through the orchestrator — workers never hit Supabase directly.  
- Proxies + captcha solving required for higher-tier scaling.  
- Dashboard is monitoring-only; business logic remains backend-driven.  
- Workers must log progress incrementally — no silent failures.



