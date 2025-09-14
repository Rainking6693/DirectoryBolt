# Safe local Netlify Dev workflow

This repo uses Netlify Dev for local Netlify Functions proxying. On Windows, Netlify Dev and Next.js watchers can be resource-heavy and may steal focus or interfere with other windows. Follow these safe steps to avoid interruptions.

Recommended workflow (non-disruptive)

1. Frontend work only (fast, minimal):
   - Use Next.js dev server only:
     ```pwsh
     npm run dev
     ```
   - This avoids Netlify Dev and function watchers.

2. Testing serverless functions (when needed):
   - Start Netlify Dev in a detached/minimized window and log to a file (helper script):
     ```pwsh
     .\scripts\start-netlify-dev.ps1
     # Wait a few seconds for it to initialize, check logs:
     Get-Content .\netlify-dev.log -Wait -Tail 50
     ```
   - Stop Netlify Dev when done:
     ```pwsh
     .\scripts\stop-netlify-dev.ps1
     ```

3. Fast health probes (no heavy Puppeteer launches):
   - Shallow AI health:
     ```pwsh
     Invoke-RestMethod 'http://127.0.0.1:8888/.netlify/functions/ai-health-check'
     ```
   - Puppeteer shallow health probe (returns 501 if Puppeteer not installed):
     ```pwsh
     Invoke-RestMethod 'http://127.0.0.1:8888/.netlify/functions/puppeteer-handler?action=health'
     ```

4. If you need deep checks (real network calls & browser launches):
   - Provide these env vars in `.env.local` or Netlify settings:
     - `SUPABASE_SERVICE_KEY`
     - `PUPPETEER_EXECUTABLE_PATH` (optional; points to a local Chrome/Chromium binary to avoid downloads)
   - Then run Netlify Dev (detached) and call deep probe:
     ```pwsh
     # example deep call
     Invoke-RestMethod 'http://127.0.0.1:8888/.netlify/functions/ai-health-check?action=deep'
     ```

Notes
 - We added guards so shallow probes won't launch Puppeteer or perform expensive checks.
 - Deep probes include a timeout to avoid hanging your dev workflow.
