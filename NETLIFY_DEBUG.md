# Netlify Debugging Guide

This file collects safe, repeatable steps to validate Netlify build, Functions deployment, and runtime access to environment variables. Use these steps when diagnosing the issues summarized in `UNRESOLVED_ISSUES_REPORT.md`.

Prerequisites:
- Install Netlify CLI: `npm i -g netlify-cli`
- Authenticate: `netlify login`
- Run from repository root

1) Start local Netlify dev server (replicates Functions runtime)

```pwsh
netlify dev
```

Expected outcome: local server runs and Next.js API routes are available under `/api/*`. If routes 404, inspect console logs for build errors.

2) List configured environment variables for your Netlify site

```pwsh
netlify env:list
```

Check that values like `GOOGLE_PRIVATE_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL` appear. Note: `netlify env:list` shows keys but not full secret values in some configurations.

3) Verify Functions are deployed and listed

```pwsh
netlify functions:list
```

Confirm that functions (if any) appear. If using Next.js serverless functions, ensure Netlify is configured to build Next plugin or uses the correct adapter.

4) Use the safe runtime debug endpoint

Start `netlify dev` and open in your browser:

```
http://localhost:8888/api/debug/env-vars
```

This endpoint reports presence and masked values of critical env vars without revealing secrets.

5) If env vars are missing at runtime
- Ensure values are set in Netlify under "Site settings → Build & deploy → Environment".
- Put sensitive keys under "Functions" if Netlify separates build vs functions envs in your plan.
- Consider adding a `[build.environment]` block to `netlify.toml` for build-time values.

6) Common fixes
- If Next.js is exporting statically, enable Netlify Next plugin or deploy to Vercel for native Next.js SSR/API support.
- Ensure Node version in Netlify UI matches local (Node 18+).
- For `GOOGLE_PRIVATE_KEY`, ensure newlines are preserved. Netlify may require replacing literal `\n` with actual newlines during upload or using base64-encoded key and decoding at runtime.

7) Next steps for Google Sheets authentication
- Create a service account with editor access to the target sheet and share the sheet with the service account email.
- Verify the `GOOGLE_PRIVATE_KEY` format; if it includes newlines, store as base64 and decode in runtime code:

```ts
const key = process.env.GOOGLE_PRIVATE_KEY
const decoded = key?.includes('-----BEGIN') ? key : Buffer.from(key || '', 'base64').toString('utf8')
```

8) When to escalate
- If `netlify dev` shows env vars present locally but production Functions still can't read them, open a Netlify support ticket and include build logs and function logs.

---
Keep this file up to date with any changes to build or runtime configuration.
