\## Operational Architecture — DirectoryBolt



This document expands on the \*\*Technical Architecture\*\* and provides detailed operational notes, edge-case handling, and reliability strategies for DirectoryBolt.



---



\## 1. Customer Onboarding \& Post-Payment Data Collection

\- After Stripe payment confirmation, the system redirects the customer to the \*\*Business Info Form\*\*.  

\- Required fields: business name, address, phone, website, category, hours, and optional metadata (logo, tagline, etc).  

\- The data is validated client-side, then written into Supabase (`customers` + `jobs` tables).  

\- Jobs cannot be dispatched until required business fields are present.



---



\## 2. Queue Management

\- Each new job is written to Supabase `jobs` with status = `pending`.  

\- Orchestrator service (`jobs-next`) assigns jobs to workers on a first-in-first-out basis, respecting package tier limits (50/100/300/500).  

\- Jobs are moved into status `in\_progress` once claimed by a worker.  

\- Progress is tracked via `job\_results` rows (one per directory submission attempt).



---



\## 3. Directory Submission Workflow

1\. Worker claims job.  

2\. Loads business metadata and directory list (from `master-directory-list.json`).  

3\. Iterates through directories and attempts submission.  

4\. Captures logs: submission success, errors, retry triggers.  

5\. Updates Supabase after each submission.  



---



\## 4. Error Handling \& Retry Logic

\- \*\*Transient Failures\*\* (e.g. timeout, captcha unsolved) → worker retries up to 3x.  

\- \*\*Permanent Failures\*\* (e.g. directory down, duplicate listing detected) → result stored with status `failed`.  

\- Staff can manually retry failed directories via `/jobs/retry`.  

\- Staff dashboard provides per-directory status visibility.



---



\## 5. Captcha \& Proxy Management

\- Workers integrate with 2Captcha API for automated captcha solving.  

\- Each Enterprise-tier job must route submissions through rotating proxies to prevent IP throttling.  

\- Proxy and captcha keys are stored securely in environment variables.



---



\## 6. Staff Monitoring \& Intervention

\- Dashboard shows live queue status (pending, in progress, complete, failed).  

\- Staff can:  

&nbsp; - Retry failed jobs.  

&nbsp; - Pause or cancel jobs.  

&nbsp; - Drill into logs for per-directory errors.  

\- Staff no longer need to “push” jobs — they only \*\*monitor and intervene\*\*.



---



\## 7. Reporting \& Completion

\- Once all directories for a job are processed, the worker marks the job `complete`.  

\- A summary report is stored in Supabase:  

&nbsp; - Number of successes, failures, retries.  

&nbsp; - Time to completion.  

&nbsp; - Logs of key events.  

\- Customers can receive confirmation emails or download reports via the portal.



---



\## 8. Metrics \& Observability

\- Exposed via `/metrics` endpoint in Prometheus format.  

\- Key metrics:  

&nbsp; - Queue depth  

&nbsp; - Active workers  

&nbsp; - Completed jobs per hour  

&nbsp; - Retry rate  

&nbsp; - Captchas solved  

&nbsp; - Proxy rotation failures  

\- Staff dashboard aggregates these into charts.



---



\## 9. Reliability Features

\- \*\*Health Checks\*\* → `/healthz` endpoint reports uptime, queue depth, and worker health.  

\- \*\*Auto-Scaling\*\* → worker replicas increase when queue depth exceeds thresholds.  

\- \*\*Graceful Degradation\*\* → if proxies or captcha services fail, system alerts staff and slows job dispatch.  

\- \*\*Data Integrity\*\* → Supabase constraints ensure no duplicate job IDs or missing business metadata.  

\- \*\*Audit Logs\*\* → every retry, failure, and completion event stored in Supabase with timestamps.



---



\## 10. Failure Scenarios \& Recovery

\- \*\*Supabase Outage\*\* → Orchestrator pauses dispatch; workers idle until DB resumes.  

\- \*\*Worker Crash\*\* → Docker restarts worker; uncompleted jobs revert to `pending`.  

\- \*\*Captcha Provider Down\*\* → Staff alerted; Enterprise jobs throttled.  

\- \*\*Proxy Exhaustion\*\* → Staff notified to replenish proxy pool.  



---



\## 11. Security \& Compliance

\- Environment variables (`.env.local`, Netlify Dashboard) hold all secrets (Supabase, Stripe, captcha, proxy).  

\- Stripe webhook signatures are verified.  

\- Supabase RLS (row-level security) ensures customers can only see their own jobs.  

\- Staff API routes protected by `STAFF\_API\_KEY`.  

\- Workers run in isolated containers to avoid data leakage between jobs.



---



\## 12. Operational Assumptions

\- Jobs must always pass through the \*\*orchestrator\*\* (no direct worker → Supabase writes).  

\- Staff dashboard is \*\*monitor + intervene only\*\* (no manual job initiation).  

\- Proxies and captcha solvers are \*\*mandatory\*\* for scaling beyond 100 directories.  

\- Workers must log progress after \*\*every directory submission\*\* to avoid silent failures.

&nbsp;Operational Architecture — DirectoryBolt



This document expands on the \*\*Technical Architecture\*\* and provides detailed operational notes, edge-case handling, and reliability strategies for DirectoryBolt.



---



\## 1. Customer Onboarding \& Post-Payment Data Collection

\- After Stripe payment confirmation, the system redirects the customer to the \*\*Business Info Form\*\*.  

\- Required fields: business name, address, phone, website, category, hours, and optional metadata (logo, tagline, etc).  

\- The data is validated client-side, then written into Supabase (`customers` + `jobs` tables).  

\- Jobs cannot be dispatched until required business fields are present.



---



\## 2. Queue Management

\- Each new job is written to Supabase `jobs` with status = `pending`.  

\- Orchestrator service (`jobs-next`) assigns jobs to workers on a first-in-first-out basis, respecting package tier limits (50/100/300/500).  

\- Jobs are moved into status `in\_progress` once claimed by a worker.  

\- Progress is tracked via `job\_results` rows (one per directory submission attempt).



---



\## 3. Directory Submission Workflow

1\. Worker claims job.  

2\. Loads business metadata and directory list (from `master-directory-list.json`).  

3\. Iterates through directories and attempts submission.  

4\. Captures logs: submission success, errors, retry triggers.  

5\. Updates Supabase after each submission.  



---



\## 4. Error Handling \& Retry Logic

\- \*\*Transient Failures\*\* (e.g. timeout, captcha unsolved) → worker retries up to 3x.  

\- \*\*Permanent Failures\*\* (e.g. directory down, duplicate listing detected) → result stored with status `failed`.  

\- Staff can manually retry failed directories via `/jobs/retry`.  

\- Staff dashboard provides per-directory status visibility.



---



\## 5. Captcha \& Proxy Management

\- Workers integrate with 2Captcha API for automated captcha solving.  

\- Each Enterprise-tier job must route submissions through rotating proxies to prevent IP throttling.  

\- Proxy and captcha keys are stored securely in environment variables.



---



\## 6. Staff Monitoring \& Intervention

\- Dashboard shows live queue status (pending, in progress, complete, failed).  

\- Staff can:  

&nbsp; - Retry failed jobs.  

&nbsp; - Pause or cancel jobs.  

&nbsp; - Drill into logs for per-directory errors.  

\- Staff no longer need to “push” jobs — they only \*\*monitor and intervene\*\*.



---



\## 7. Reporting \& Completion

\- Once all directories for a job are processed, the worker marks the job `complete`.  

\- A summary report is stored in Supabase:  

&nbsp; - Number of successes, failures, retries.  

&nbsp; - Time to completion.  

&nbsp; - Logs of key events.  

\- Customers can receive confirmation emails or download reports via the portal.



---



\## 8. Metrics \& Observability

\- Exposed via `/metrics` endpoint in Prometheus format.  

\- Key metrics:  

&nbsp; - Queue depth  

&nbsp; - Active workers  

&nbsp; - Completed jobs per hour  

&nbsp; - Retry rate  

&nbsp; - Captchas solved  

&nbsp; - Proxy rotation failures  

\- Staff dashboard aggregates these into charts.



---



\## 9. Reliability Features

\- \*\*Health Checks\*\* → `/healthz` endpoint reports uptime, queue depth, and worker health.  

\- \*\*Auto-Scaling\*\* → worker replicas increase when queue depth exceeds thresholds.  

\- \*\*Graceful Degradation\*\* → if proxies or captcha services fail, system alerts staff and slows job dispatch.  

\- \*\*Data Integrity\*\* → Supabase constraints ensure no duplicate job IDs or missing business metadata.  

\- \*\*Audit Logs\*\* → every retry, failure, and completion event stored in Supabase with timestamps.



---



\## 10. Failure Scenarios \& Recovery

\- \*\*Supabase Outage\*\* → Orchestrator pauses dispatch; workers idle until DB resumes.  

\- \*\*Worker Crash\*\* → Docker restarts worker; uncompleted jobs revert to `pending`.  

\- \*\*Captcha Provider Down\*\* → Staff alerted; Enterprise jobs throttled.  

\- \*\*Proxy Exhaustion\*\* → Staff notified to replenish proxy pool.  



---



\## 11. Security \& Compliance

\- Environment variables (`.env.local`, Netlify Dashboard) hold all secrets (Supabase, Stripe, captcha, proxy).  

\- Stripe webhook signatures are verified.  

\- Supabase RLS (row-level security) ensures customers can only see their own jobs.  

\- Staff API routes protected by `STAFF\_API\_KEY`.  

\- Workers run in isolated containers to avoid data leakage between jobs.



---



\## 12. Operational Assumptions

\- Jobs must always pass through the \*\*orchestrator\*\* (no direct worker → Supabase writes).  

\- Staff dashboard is \*\*monitor + intervene only\*\* (no manual job initiation).  

\- Proxies and captcha solvers are \*\*mandatory\*\* for scaling beyond 100 directories.  

\- Workers must log progress after \*\*every directory submission\*\* to avoid silent failures.



