\# Staff Operations — DirectoryBolt



This guide explains how staff should use the DirectoryBolt dashboard to monitor jobs, handle errors, and keep the system running smoothly.  

You do \*\*not\*\* need coding knowledge — just follow the steps below.



---



\## 1. Customer Lifecycle (What Happens Automatically)

1\. Customer signs up and pays through Stripe.  

2\. Customer submits business details.  

3\. DirectoryBolt creates a job in the system.  

4\. Jobs are automatically sent to our worker system (Playwright).  

5\. Workers submit customer info to directories.  

6\. Results and progress updates are saved automatically.  

7\. Staff dashboard shows job status in real time.  



---



\## 2. Staff Dashboard Features

\- \*\*Queue Overview\*\* → See all jobs (Pending, In Progress, Completed, Failed).  

\- \*\*Job Details\*\* → Click a job to see directory-by-directory progress.  

\- \*\*Retry Button\*\* → Resubmit failed directories without restarting the entire job.  

\- \*\*Pause/Cancel\*\* → Stop jobs that are misbehaving or on hold.  

\- \*\*System Health\*\* → View worker uptime, queue size, retries, and captcha usage.  



---



\## 3. When Staff Should Intervene

\- \*\*Job Fails\*\* → If a directory fails, hit \*\*Retry\*\*.  

\- \*\*Worker Issues\*\* → If a job seems “stuck,” alert engineering.  

\- \*\*Captcha/Proxy Errors\*\* → These usually resolve automatically. If persistent, escalate.  

\- \*\*Customer Escalations\*\* → Use the dashboard to verify their job status and explain results.  



---



\## 4. Completion \& Reporting

\- Jobs are marked \*\*Complete\*\* once all directories are processed.  

\- Each job shows:  

&nbsp; - Success count  

&nbsp; - Failure count  

&nbsp; - Retry attempts  

&nbsp; - Total time to complete  

\- Customers can access/download reports directly. Staff may be asked to confirm status.  



---



\## 5. Best Practices

\- Always use the \*\*Retry\*\* feature instead of creating new jobs.  

\- Do \*\*not\*\* manually edit or bypass job data — everything flows automatically.  

\- Check \*\*System Health\*\* regularly for unusual spikes in failures.  

\- Escalate quickly if you see repeated proxy/captcha failures.  

\- Communicate with customers using the clear stats shown on their reports.  



---



\## 6. What Staff Do \*\*Not\*\* Do

\- Staff do \*\*not\*\* push jobs into the system (this is automatic).  

\- Staff do \*\*not\*\* modify Supabase or database records directly.  

\- Staff do \*\*not\*\* manage proxy or captcha keys — these are automated.  

\- Staff do \*\*not\*\* run workers — scaling and automation happen on the backend.  



---



\## 7. Escalation

\- \*\*Technical errors\*\* → Contact engineering.  

\- \*\*Payment issues\*\* → Contact billing.  

\- \*\*Customer disputes\*\* → Follow support escalation process.  



