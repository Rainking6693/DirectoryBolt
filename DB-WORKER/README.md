# DirectoryBolt DB-WORKER

AI-powered directory submission worker that polls Supabase for pending jobs, uses Playwright for form automation, and leverages Claude + Gemini for intelligent form mapping.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npm run postinstall  # Installs Playwright browsers
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys (see below)
```

### 3. Run Diagnostics
```bash
npm run diagnose
```

This will test all connections and identify any missing configuration.

### 4. Start the Worker
```bash
npm start
```

## 🔑 Required Environment Variables

Edit `.env` with these values:

```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Services (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-your-key-here
GEMINI_API_KEY=AIza-your-key-here

# Worker Configuration
WORKER_ID=worker-1
POLL_INTERVAL=30000
HEADLESS=true

# Optional: CAPTCHA Solving
TWO_CAPTCHA_API_KEY=your_2captcha_key_here
```

⚠️ **Important:** Use the **SERVICE_ROLE_KEY**, not the anon key from Supabase!

## 🧪 Testing & Diagnostics

### Full System Diagnostics
```bash
npm run diagnose
```
Tests: Supabase, Anthropic, Gemini, 2Captcha, Playwright, and database schema.

### Test Supabase Connection
```bash
npm run test:connection
```

### Check Job Structure
```bash
npm run check:jobs
```

## 📊 How It Works

1. **Polls Supabase** every 30 seconds for pending jobs
2. **Fetches linked submissions** via `submission_queue_id` foreign key
3. **Analyzes forms** using Gemini AI to generate CSS selector mappings
4. **Fills forms** using Playwright with human-like delays
5. **Validates submissions** using Claude AI to analyze result pages
6. **Updates status** in Supabase for real-time dashboard tracking

## 🗄️ Database Requirements

The worker expects these tables in Supabase:

- `jobs` - Job queue with customer data
- `directory_submissions` - Individual directory submissions linked to jobs
- `directory_form_mappings` - Cached form field mappings
- `worker_status` - Worker heartbeat and status tracking

See `NEW UPDATE DOCS/Current schema in supabase.md` for full schema.

## 🐛 Troubleshooting

If the worker isn't processing jobs, see **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for detailed fixes.

Common issues:
- ❌ Missing API keys → Run `npm run diagnose`
- ❌ No jobs found → Check `submission_queue_id` foreign key
- ❌ Playwright crashes → Run `npm run postinstall`
- ❌ Form mapping fails → Check Gemini API key and quota

## 🐳 Docker Deployment

### Build and Run
```bash
docker build -t db-worker .
docker run --env-file .env db-worker
```

### Docker Compose (3 replicas)
```bash
docker-compose up --build
```

## 📝 Scripts

- `npm start` - Start the worker
- `npm run diagnose` - Run full connection diagnostics
- `npm run test:connection` - Test Supabase connection
- `npm run check:jobs` - Check job and submission structure
- `npm run build` - Build TypeScript files
- `npm run postinstall` - Install Playwright browsers

## 🔧 Architecture

```
custom-poller.js
├── fetchNextJobWithSubmissions() - Query Supabase for pending jobs
├── getFormHtml() - Fetch directory form HTML with Playwright
├── callGeminiWithRetry() - Generate form mappings with Gemini AI
├── submitWithPlaywright() - Fill and submit forms
└── pollForJobs() - Main polling loop
```

## 📚 Documentation

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Detailed troubleshooting guide
- **[NEW UPDATE DOCS/DB10.24.md](../NEW%20UPDATE%20DOCS/DB10.24.md)** - Full system architecture
- **[NEW UPDATE DOCS/DirectoryBolt-Overview10.22.md](../NEW%20UPDATE%20DOCS/DirectoryBolt-Overview10.22.md)** - Platform overview

## ✅ Recent Fixes (Oct 2025)

- ✅ Added `@anthropic-ai/sdk` dependency
- ✅ Fixed environment variable loading (.env instead of .env.local)
- ✅ Added API key validation on startup
- ✅ Fixed CAPTCHA solver null check
- ✅ Added immediate polling on startup (no 30s wait)
- ✅ Improved Gemini prompt for better JSON responses
- ✅ Added retry logic with exponential backoff
- ✅ Added comprehensive diagnostics script

## 🆘 Support

If you encounter issues:
1. Run `npm run diagnose` to identify problems
2. Check `poller.log` for detailed error messages
3. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Verify database schema matches documentation
