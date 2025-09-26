\# DirectoryBolt Backend Orchestrator + Workers (Server‑Side AutoBolt)



This document specifies the production-ready architecture and reference implementation for replacing the Chrome extension with \*\*server-side workers\*\*. It includes:



\* System diagram (queue → orchestrator → workers → directories)

\* Express backend (API contract, heartbeat, stuck detection)

\* Supabase integration helpers

\* Worker service (Playwright-based), directory adapter pattern

\* Environment variables, logging, captcha + proxy handling, and deployment playbook

\* Migration map from your existing extension files

\* Tiny operator extension as fallback tool

\* Staff Dashboard React monitor card



---



\## 1) High-Level Architecture (Text Diagram)



```

&nbsp;Customer Signup (DirectoryBolt UI)

&nbsp;       │

&nbsp;       ▼

&nbsp; Supabase (public.customers)

&nbsp;       │

&nbsp;  Insert Job → public.jobs (status=pending)

&nbsp;       │

&nbsp;       ▼

┌──────────────────────────────────────────────────────────┐

│            Express Orchestrator (Backend API)            │

│  - /autobolt/status   - /jobs/next   - /jobs/update      │

│  - /jobs/complete     - /jobs/failed - /jobs/retry       │

│  - background watcher: stuck detection + alerts          │

└───────────┬───────────────────────────────┬──────────────┘

&nbsp;           │                               │

&nbsp;           ▼                               ▼

&nbsp;  Worker Pool (N replicas)          Staff Dashboard

&nbsp;  Node + Playwright workers         (reads Supabase + status API)

&nbsp;  - pulls a job

&nbsp;  - loads directory adapters

&nbsp;  - submits forms/APIs

&nbsp;  - writes job\_results + heartbeat

&nbsp;  - uses proxies + captcha solver

&nbsp;           │

&nbsp;           ▼

&nbsp;      External Directories (500+)

&nbsp;      - API clients or headless form fill

```



---



\## 2) Data Model (Supabase)



\*(same as before; includes jobs, job\_results, autobolt\_heartbeats)\*



---



\## 3) Environment Variables (.env)



```

SUPABASE\_URL=...

SUPABASE\_SERVICE\_KEY=...



PORT=4000

WORKER\_ID=${HOSTNAME}-1

WORKER\_MAX\_CONCURRENCY=1

JOB\_STALL\_MINUTES=10



\# Proxy/captcha

HTTP\_PROXY=http://proxy-provider:port

ANTICAPTCHA\_KEY=...

2CAPTCHA\_KEY=...

```



---



\## 4) Express Orchestrator (API + Watchdog)



\*(same as before, but with new `/jobs/retry` endpoint)\*



```js

// Retry failed directories

app.post('/jobs/retry', async (req, res) => {

&nbsp; const { job\_id } = req.body;

&nbsp; // requeue failed + retry rows

&nbsp; const { data, error } = await supabase

&nbsp;   .from('job\_results')

&nbsp;   .select('\*')

&nbsp;   .eq('job\_id', job\_id)

&nbsp;   .in('status', \['failed','retry']);



&nbsp; if (error) return res.status(500).json({ success: false, error: error.message });



&nbsp; const inserts = data.map(r => ({

&nbsp;   job\_id: r.job\_id,

&nbsp;   directory\_name: r.directory\_name,

&nbsp;   status: 'pending'

&nbsp; }));

&nbsp; await supabase.from('job\_results').insert(inserts);

&nbsp; res.json({ success: true, data: inserts.length });

});

```



---



\## 5) Worker Service (Playwright)



```js

// src/worker/runner.js

import { chromium } from 'playwright';

import fetch from 'node-fetch';

import { getDirectoriesForTier } from './tier.js';

import { loadAdapter } from './adapters/index.js';



const API\_BASE = process.env.API\_BASE || 'http://localhost:4000';

const WORKER\_ID = process.env.WORKER\_ID || 'worker-local';



async function heartbeat(job\_id, info) {

&nbsp; await fetch(`${API\_BASE}/autobolt/status`, {

&nbsp;   method: 'POST', headers: { 'Content-Type': 'application/json' },

&nbsp;   body: JSON.stringify({ worker\_id: WORKER\_ID, job\_id, info })

&nbsp; }).catch(()=>{});

}



export async function runOnce() {

&nbsp; const r = await fetch(`${API\_BASE}/jobs/next`, { method: 'POST' });

&nbsp; const j = await r.json();

&nbsp; if (!j.data) { await heartbeat(null, { state: 'idle' }); return; }



&nbsp; const { job, customer } = j.data;

&nbsp; const directories = await getDirectoriesForTier(job.package\_size);



&nbsp; const browser = await chromium.launch({ headless: true, args: \["--no-sandbox"], proxy: process.env.HTTP\_PROXY ? { server: process.env.HTTP\_PROXY } : undefined });

&nbsp; const page = await browser.newPage();



&nbsp; try {

&nbsp;   for (const dir of directories) {

&nbsp;     await heartbeat(job.id, { state: 'working', directory: dir.name });

&nbsp;     const adapter = await loadAdapter(dir);

&nbsp;     try {

&nbsp;       const result = await adapter.submit(page, customer, { captchaKey: process.env.ANTICAPTCHA\_KEY });

&nbsp;       await fetch(`${API\_BASE}/jobs/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id, directory\_name: dir.name, status: result.ok?'submitted':'failed', response\_log: result.meta||{} }) });

&nbsp;     } catch (err) {

&nbsp;       await fetch(`${API\_BASE}/jobs/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id, directory\_name: dir.name, status:'retry', response\_log:{ error:String(err) } }) });

&nbsp;     }

&nbsp;   }

&nbsp; } finally {

&nbsp;   await browser.close();

&nbsp; }



&nbsp; await fetch(`${API\_BASE}/jobs/complete`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id }) });

}

```



---



\## 6) Tiny Operator Extension (Fallback)



\* Minimal Chrome extension kept for \*\*manual fallback\*\*.

\* Purpose: handle directories with \*\*CAPTCHAs or anti-bot blocks\*\* that automation cannot yet solve.

\* Flow: Dashboard marks job as "needs operator," staff runs extension to complete missing directories manually.



---



\## 7) Staff Dashboard React Snippet (AutoBolt Monitor)



```jsx

import { useEffect, useState } from 'react';



export default function AutoBoltMonitor() {

&nbsp; const \[status, setStatus] = useState(null);



&nbsp; useEffect(() => {

&nbsp;   const fetchStatus = async () => {

&nbsp;     const r = await fetch('/autobolt/status');

&nbsp;     const j = await r.json();

&nbsp;     setStatus(j.data);

&nbsp;   };

&nbsp;   fetchStatus();

&nbsp;   const interval = setInterval(fetchStatus, 10000);

&nbsp;   return () => clearInterval(interval);

&nbsp; }, \[]);



&nbsp; if (!status) return <div>Loading AutoBolt...</div>;



&nbsp; return (

&nbsp;   <div className="card">

&nbsp;     <h3>AutoBolt Monitor</h3>

&nbsp;     <p>Worker: {status.worker\_id}</p>

&nbsp;     <p>Job: {status.job\_id || 'Idle'}</p>

&nbsp;     <p>Last heartbeat: {status.last\_seen\_at}</p>

&nbsp;     {status.info?.progress \&\& <progress value={status.info.progress.done} max={status.info.progress.total}></progress>}

&nbsp;   </div>

&nbsp; );

}

```



---



\## 8) Improvements Over Extension



\* \*\*Playwright flavor\*\*: reliability, multi-browser, built-in tracing/debugging.

\* \*\*/jobs/retry\*\*: retry only failed directories → saves time.

\* \*\*React AutoBolt Monitor\*\*: visibility into live worker health.

\* \*\*Proxies + captcha solvers\*\*: essential for Enterprise scale, reduce throttling/failures.

\* \*\*Tiny operator extension\*\*: last-resort fallback for unsolvable captchas.



---



\## ✅ Summary



AutoBolt is now fully backend-driven, with:



\* Playwright workers (scalable, debuggable)

\* Retry logic

\* Live dashboard monitor

\* Captcha + proxy support

\* Optional operator extension fallback



This makes the system enterprise-ready while preserving your existing directory mapping intelligence.



This document specifies the production-ready architecture and reference implementation for replacing the Chrome extension with \*\*server-side workers\*\*. It includes:



\* System diagram (queue → orchestrator → workers → directories)

\* Express backend (API contract, heartbeat, stuck detection)

\* Supabase integration helpers

\* Worker service (Playwright-based), directory adapter pattern

\* Environment variables, logging, captcha + proxy handling, and deployment playbook

\* Migration map from your existing extension files

\* Tiny operator extension as fallback tool

\* Staff Dashboard React monitor card



---



\## 1) High-Level Architecture (Text Diagram)



```

&nbsp;Customer Signup (DirectoryBolt UI)

&nbsp;       │

&nbsp;       ▼

&nbsp; Supabase (public.customers)

&nbsp;       │

&nbsp;  Insert Job → public.jobs (status=pending)

&nbsp;       │

&nbsp;       ▼

┌──────────────────────────────────────────────────────────┐

│            Express Orchestrator (Backend API)            │

│  - /autobolt/status   - /jobs/next   - /jobs/update      │

│  - /jobs/complete     - /jobs/failed - /jobs/retry       │

│  - background watcher: stuck detection + alerts          │

└───────────┬───────────────────────────────┬──────────────┘

&nbsp;           │                               │

&nbsp;           ▼                               ▼

&nbsp;  Worker Pool (N replicas)          Staff Dashboard

&nbsp;  Node + Playwright workers         (reads Supabase + status API)

&nbsp;  - pulls a job

&nbsp;  - loads directory adapters

&nbsp;  - submits forms/APIs

&nbsp;  - writes job\_results + heartbeat

&nbsp;  - uses proxies + captcha solver

&nbsp;           │

&nbsp;           ▼

&nbsp;      External Directories (500+)

&nbsp;      - API clients or headless form fill

```



---



\## 2) Data Model (Supabase)



\*(same as before; includes jobs, job\_results, autobolt\_heartbeats)\*



---



\## 3) Environment Variables (.env)



```

SUPABASE\_URL=...

SUPABASE\_SERVICE\_KEY=...



PORT=4000

WORKER\_ID=${HOSTNAME}-1

WORKER\_MAX\_CONCURRENCY=1

JOB\_STALL\_MINUTES=10



\# Proxy/captcha

HTTP\_PROXY=http://proxy-provider:port

ANTICAPTCHA\_KEY=...

2CAPTCHA\_KEY=...

```



---



\## 4) Express Orchestrator (API + Watchdog)



\*(same as before, but with new `/jobs/retry` endpoint)\*



```js

// Retry failed directories

app.post('/jobs/retry', async (req, res) => {

&nbsp; const { job\_id } = req.body;

&nbsp; // requeue failed + retry rows

&nbsp; const { data, error } = await supabase

&nbsp;   .from('job\_results')

&nbsp;   .select('\*')

&nbsp;   .eq('job\_id', job\_id)

&nbsp;   .in('status', \['failed','retry']);



&nbsp; if (error) return res.status(500).json({ success: false, error: error.message });



&nbsp; const inserts = data.map(r => ({

&nbsp;   job\_id: r.job\_id,

&nbsp;   directory\_name: r.directory\_name,

&nbsp;   status: 'pending'

&nbsp; }));

&nbsp; await supabase.from('job\_results').insert(inserts);

&nbsp; res.json({ success: true, data: inserts.length });

});

```



---



\## 5) Worker Service (Playwright)



```js

// src/worker/runner.js

import { chromium } from 'playwright';

import fetch from 'node-fetch';

import { getDirectoriesForTier } from './tier.js';

import { loadAdapter } from './adapters/index.js';



const API\_BASE = process.env.API\_BASE || 'http://localhost:4000';

const WORKER\_ID = process.env.WORKER\_ID || 'worker-local';



async function heartbeat(job\_id, info) {

&nbsp; await fetch(`${API\_BASE}/autobolt/status`, {

&nbsp;   method: 'POST', headers: { 'Content-Type': 'application/json' },

&nbsp;   body: JSON.stringify({ worker\_id: WORKER\_ID, job\_id, info })

&nbsp; }).catch(()=>{});

}



export async function runOnce() {

&nbsp; const r = await fetch(`${API\_BASE}/jobs/next`, { method: 'POST' });

&nbsp; const j = await r.json();

&nbsp; if (!j.data) { await heartbeat(null, { state: 'idle' }); return; }



&nbsp; const { job, customer } = j.data;

&nbsp; const directories = await getDirectoriesForTier(job.package\_size);



&nbsp; const browser = await chromium.launch({ headless: true, args: \["--no-sandbox"], proxy: process.env.HTTP\_PROXY ? { server: process.env.HTTP\_PROXY } : undefined });

&nbsp; const page = await browser.newPage();



&nbsp; try {

&nbsp;   for (const dir of directories) {

&nbsp;     await heartbeat(job.id, { state: 'working', directory: dir.name });

&nbsp;     const adapter = await loadAdapter(dir);

&nbsp;     try {

&nbsp;       const result = await adapter.submit(page, customer, { captchaKey: process.env.ANTICAPTCHA\_KEY });

&nbsp;       await fetch(`${API\_BASE}/jobs/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id, directory\_name: dir.name, status: result.ok?'submitted':'failed', response\_log: result.meta||{} }) });

&nbsp;     } catch (err) {

&nbsp;       await fetch(`${API\_BASE}/jobs/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id, directory\_name: dir.name, status:'retry', response\_log:{ error:String(err) } }) });

&nbsp;     }

&nbsp;   }

&nbsp; } finally {

&nbsp;   await browser.close();

&nbsp; }



&nbsp; await fetch(`${API\_BASE}/jobs/complete`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ job\_id: job.id }) });

}

```



---



\## 6) Tiny Operator Extension (Fallback)



\* Minimal Chrome extension kept for \*\*manual fallback\*\*.

\* Purpose: handle directories with \*\*CAPTCHAs or anti-bot blocks\*\* that automation cannot yet solve.

\* Flow: Dashboard marks job as "needs operator," staff runs extension to complete missing directories manually.



---



\## 7) Staff Dashboard React Snippet (AutoBolt Monitor)



```jsx

import { useEffect, useState } from 'react';



export default function AutoBoltMonitor() {

&nbsp; const \[status, setStatus] = useState(null);



&nbsp; useEffect(() => {

&nbsp;   const fetchStatus = async () => {

&nbsp;     const r = await fetch('/autobolt/status');

&nbsp;     const j = await r.json();

&nbsp;     setStatus(j.data);

&nbsp;   };

&nbsp;   fetchStatus();

&nbsp;   const interval = setInterval(fetchStatus, 10000);

&nbsp;   return () => clearInterval(interval);

&nbsp; }, \[]);



&nbsp; if (!status) return <div>Loading AutoBolt...</div>;



&nbsp; return (

&nbsp;   <div className="card">

&nbsp;     <h3>AutoBolt Monitor</h3>

&nbsp;     <p>Worker: {status.worker\_id}</p>

&nbsp;     <p>Job: {status.job\_id || 'Idle'}</p>

&nbsp;     <p>Last heartbeat: {status.last\_seen\_at}</p>

&nbsp;     {status.info?.progress \&\& <progress value={status.info.progress.done} max={status.info.progress.total}></progress>}

&nbsp;   </div>

&nbsp; );

}

```



---



\## 8) Improvements Over Extension



\* \*\*Playwright flavor\*\*: reliability, multi-browser, built-in tracing/debugging.

\* \*\*/jobs/retry\*\*: retry only failed directories → saves time.

\* \*\*React AutoBolt Monitor\*\*: visibility into live worker health.

\* \*\*Proxies + captcha solvers\*\*: essential for Enterprise scale, reduce throttling/failures.

\* \*\*Tiny operator extension\*\*: last-resort fallback for unsolvable captchas.



---



\## ✅ Summary



AutoBolt is now fully backend-driven, with:



\* Playwright workers (scalable, debuggable)

\* Retry logic

\* Live dashboard monitor

\* Captcha + proxy support

\* Optional operator extension fallback



This makes the system enterprise-ready while preserving your existing directory mapping intelligence.



