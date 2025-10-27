# DirectoryBolt Backend - Quick Start Guide

## 🚀 Getting Started

This guide will help you get the DirectoryBolt backend up and running in minutes.

---

## Prerequisites

- Node.js 18+ installed
- npm 8+ installed
- Supabase account and project
- Stripe account
- Resend account (for emails)

---

## Step 1: Install Dependencies

```bash
npm install
```

### Additional Dependencies for New Features

```bash
npm install @tanstack/react-table recharts react-datepicker resend
npm install --save-dev @playwright/test
```

---

## Step 2: Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:Chartres6693!23$@db.your-project.supabase.co:5432/postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Resend
RESEND_API_KEY=re_your_resend_api_key

# App
BASE_URL=http://localhost:3000
```

---

## Step 3: Database Setup

### 3.1 Apply Directory Schema Migration

```bash
node apply-directories-migration.js
```

Expected output:
```
🚀 Starting directories migration...
📡 Connecting to Supabase database...
✅ Connected successfully
📄 Applying migration: 20251025_fix_directories_schema.sql
✅ Migration applied successfully
📊 Directories table schema: [table output]
📈 Total directories in table: 0
🔍 Indexes created: [index list]
✨ Migration completed successfully!
```

### 3.2 Import Directories

```bash
node scripts/import-directories.js
```

Expected output:
```
Parsed 832 directories
Successfully imported/updated directories
```

### 3.3 Apply Status Column Migration

```bash
node apply-status-migration.js
```

Expected output:
```
🚀 Starting status column migration...
✅ Migration applied successfully
📊 Status column details: [column info]
📈 Customer status distribution: [status counts]
✨ Migration completed successfully!
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Step 5: Access Admin Dashboard

Navigate to:
- **Dashboard:** `http://localhost:3000/admin/dashboard`
- **Customers:** `http://localhost:3000/admin/customers`
- **Jobs:** `http://localhost:3000/admin/jobs`

---

## Step 6: Start Custom Poller (Optional)

In a separate terminal:

```bash
npx ts-node custom-poller.ts
```

Expected output:
```
🚀 Starting Custom Poller...
🌐 Initializing browser...
✅ Browser initialized
💚 Health check: { uptime: '60s', jobsProcessed: 0, jobsFailed: 0, activeJobs: 0, isHealthy: true }
```

To stop the poller, press `Ctrl+C`

---

## Step 7: Test Stripe Webhook (Optional)

### 7.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

### 7.2 Login to Stripe

```bash
stripe login
```

### 7.3 Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/netlify/functions/stripe-webhook
```

### 7.4 Trigger Test Event

```bash
stripe trigger checkout.session.completed
```

---

## Step 8: Run Tests

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Specific Test Suites

```bash
# Task 1.1 - Directory Import
npm test tests/task1.1-import-test.js

# Task 1.2 - Stripe Webhook
npm test tests/task1.2-webhook-test.ts

# Task 1.3 - Poller Worker
npm test tests/task1.3-poller-test.ts

# Task 2.1 - Dashboard
npm test tests/task2.1-dashboard-test.tsx

# Task 2.2 - Customers
npm test tests/task2.2-customers-test.tsx

# Task 2.3 - Modal
npm test tests/task2.3-modal-test.tsx

# Task 2.4 - API Endpoint
npm test tests/task2.4-endpoint-test.ts

# Task 2.5 - Jobs
npm test tests/task2.5-jobs-test.tsx

# E2E Tests
npm test tests/e2e-backend.test.ts
```

---

## Verification Checklist

### Database
- [ ] Directories table created
- [ ] 832 directories imported
- [ ] Indexes created
- [ ] Status column added to customers
- [ ] Queries run in <100ms

### API Endpoints
- [ ] Stripe webhook responds to events
- [ ] Create customer endpoint works
- [ ] Validation errors return 400
- [ ] Success returns 201

### Admin Dashboard
- [ ] Dashboard loads in <2s
- [ ] Metrics display correctly
- [ ] Charts render
- [ ] Real-time updates work

### Customers Page
- [ ] Table displays customers
- [ ] Search filter works
- [ ] Status filter works
- [ ] Create modal opens
- [ ] Form validation works
- [ ] Customer creation succeeds

### Jobs Page
- [ ] Table displays jobs
- [ ] Row expansion works
- [ ] Submissions load
- [ ] Filters work
- [ ] Actions work (Retry, Cancel)

### Custom Poller
- [ ] Poller starts successfully
- [ ] Browser initializes
- [ ] Health checks run
- [ ] Jobs are processed
- [ ] Graceful shutdown works

---

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution:** The table already exists. Skip to import step.

```bash
node scripts/import-directories.js
```

### Issue: Import fails with "no such file"

**Solution:** Ensure CSV file exists at `directories/ENHANCED-DIRECTORIES.csv`

### Issue: Webhook signature verification fails

**Solution:** Update `STRIPE_WEBHOOK_SECRET` in `.env.local` with the secret from Stripe CLI or dashboard.

### Issue: Dashboard shows "Failed to load metrics"

**Solution:** Check Supabase connection and ensure tables exist.

```bash
# Verify connection
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('customers').select('count').then(console.log);"
```

### Issue: Poller fails to start

**Solution:** Install Playwright browsers:

```bash
npx playwright install chromium
```

### Issue: Tests fail with module not found

**Solution:** Install test dependencies:

```bash
npm install --save-dev @playwright/test @testing-library/react @testing-library/jest-dom
```

---

## Development Workflow

### 1. Make Changes

Edit files in:
- `app/admin/` - Frontend pages
- `netlify/functions/` - API endpoints
- `custom-poller.ts` - Worker logic

### 2. Test Changes

```bash
# Run relevant tests
npm test tests/your-test-file.ts

# Run all tests
npm test
```

### 3. Verify in Browser

Navigate to the affected page and test manually.

### 4. Check Logs

- **Frontend:** Browser console
- **Backend:** Terminal running `npm run dev`
- **Poller:** Terminal running `custom-poller.ts`
- **Database:** Supabase dashboard

---

## Production Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Deploy to Netlify

```bash
netlify deploy --prod
```

### 3. Set Environment Variables

In Netlify dashboard, add all environment variables from `.env.local`

### 4. Configure Stripe Webhook

In Stripe dashboard:
1. Go to Developers > Webhooks
2. Add endpoint: `https://your-domain.netlify.app/netlify/functions/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Deploy Custom Poller

Deploy to a server (Railway, Render, etc.) or run as a background process:

```bash
# Using PM2
pm2 start custom-poller.ts --name directorybolt-poller

# Using systemd (Linux)
# Create service file at /etc/systemd/system/directorybolt-poller.service
```

---

## Monitoring

### Health Checks

- **Dashboard:** Check metrics update every 30s
- **Poller:** Check health logs every 60s
- **Database:** Monitor query performance in Supabase
- **API:** Monitor function logs in Netlify

### Metrics to Watch

- Total customers
- Active jobs
- Success rate
- Query performance
- Poller uptime
- Jobs processed/failed

---

## Support

For issues or questions:
1. Check this guide
2. Review `BACKEND_IMPLEMENTATION_SUMMARY.md`
3. Check test files for examples
4. Review code comments

---

## Next Steps

1. ✅ Complete database setup
2. ✅ Verify all tests pass
3. ✅ Test admin dashboard
4. ✅ Test customer creation
5. ✅ Test job monitoring
6. ✅ Configure Stripe webhook
7. ✅ Deploy to production
8. ✅ Monitor performance

---

## Success! 🎉

You now have a fully functional DirectoryBolt backend with:
- ✅ 832 directories in database
- ✅ Real-time admin dashboard
- ✅ Customer management system
- ✅ Job monitoring system
- ✅ Automated worker process
- ✅ Stripe payment integration
- ✅ Comprehensive test coverage

Happy coding! 🚀
