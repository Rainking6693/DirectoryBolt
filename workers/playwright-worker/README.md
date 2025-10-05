# DirectoryBolt Playwright Worker

Playwright-based Docker worker that polls DirectoryBolt Netlify Functions for jobs, submits to processable directories, and writes progress/complete updates.

## Setup

1) Copy env template:

   cp .env.example .env

2) Fill .env values:
- NETLIFY_FUNCTIONS_URL: https://<your-site>/.netlify/functions
- SUPABASE_SERVICE_ROLE_KEY: service role key (used as Bearer token)
- POLL_INTERVAL: poll frequency in ms (default 5000)
- DIRECTORY_LIST_PATH: optional absolute path to master-directory-list json when running locally

3) Install and build

   npm ci
   npm run build

4) Run locally

   node dist/index.js

## Docker

Build and run 1 container locally:

   docker build -t db-playwright-worker .
   docker run --rm --env-file .env db-playwright-worker

Compose (3 replicas):

   docker-compose up --build

## Notes
- Worker authenticates to Netlify Functions using Bearer SUPABASE_SERVICE_ROLE_KEY.
- All DB writes happen behind functions: /jobs-next, /jobs-update, /jobs-complete.
- Directory list is loaded from repo if available, or specify DIRECTORY_LIST_PATH.
- The submission logic is best-effort: adjust formMapping in directory JSON as needed.
