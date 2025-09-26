🔄 Mapping AutoBolt Extension Files → Backend Worker

1\. Core Data + Job Logic



PackageTierEngine.js →

Maps package sizes (50 / 100 / 300 / 500).

Backend fit: integrate this logic into /api/jobs-next and jobs-complete so the orchestrator knows how many directory submissions each job requires.



directory-registry.js / master-directory-list.json / directory-list.json →

Contain all known directories + metadata.

Backend fit: imported by worker.js to know which directories to hit.



2\. Form Detection + Field Mapping



AdvancedFieldMapper.js →

Maps customer fields (name, phone, address) into form field selectors.

Backend fit: in worker.js, load this file and use it to fill fields with Playwright.



DynamicFormDetector.js →

Detects if a form has dynamic/conditional fields.

Backend fit: worker logic — run this before filling so it adapts to differences in forms.



FallbackSelectorEngine.js →

Provides alternative selectors if the main one fails.

Backend fit: wrap form fill steps in try/catch and call fallback selectors when a field isn’t found.



directory-form-filler.js →

Old Chrome content script that autofilled forms.

Backend fit: this becomes a helper function inside worker.js that uses Playwright instead of document.querySelector.



3\. Background + Batch Processing



background-batch.js / background-batch-fixed.js →

Managed job batches in the extension.

Backend fit: this logic now lives in the orchestrator (jobs-next, jobs-update, jobs-complete) — jobs are queued in Supabase and pulled in batches by workers.



cache-buster.js →

Ensures fresh page loads.

Backend fit: can be reused in worker.js by appending random query params to Playwright page.goto() calls.



4\. Auth + Customer Handling



customer-auth.js, simple-customer-auth.js, secure-customer-auth.js →

Handled extension-side auth.

Backend fit: not needed directly; authentication/authorization should move fully into Netlify Functions + Supabase (API keys, JWTs).



customer-popup.js, customer-popup.html, popup.css →

Popup UI in extension.

Backend fit: replaced by the staff dashboard (React AutoBolt Monitor card).



5\. Integration + APIs



directorybolt-website-api.js →

Called the backend from the extension.

Backend fit: delete/replace; workers now call Netlify /api/\* endpoints directly.



real-google-sheets-integration.js →

Synced customer data with Sheets.

Backend fit: optional worker plugin — could run after submissions to log results in Google Sheets.



manifest.json →

Chrome extension manifest.

Backend fit: no longer needed. The backend replaces extension architecture.



6\. Misc + Build Info



build-info.json →

Extension version/build metadata.

Backend fit: not necessary, but you can keep a /api/version endpoint for internal reference.



dev-config.js →

Local dev settings.

Backend fit: move relevant configs to .env or Netlify environment variables.



content.js →

Core content script injected into pages.

Backend fit: this is now worker.js + Playwright scripts.



✅ Summary



All “form filling” logic (mapper, detector, filler, fallback) → move into worker.js as Playwright helpers.



All “batch/queue” logic (background-batch, tier engine) → move into Netlify orchestrator endpoints.



All “UI/popup/auth” files → replaced by Supabase auth + React staff dashboard.



Extension manifest + content scripts → obsolete, replaced by backend workers.

