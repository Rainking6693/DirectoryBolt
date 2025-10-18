# Quick Start Guide

Get started with the Selector Auto-Discovery System in 5 minutes.

## Prerequisites

- Node.js installed
- Supabase project with `directories` table
- Environment variables configured

## Step 1: Verify Installation

Check that everything is installed correctly:

```bash
cd backend/functions/selector-discovery
node test-discovery.js
```

You should see all tests passing.

## Step 2: Set Environment Variables

Ensure these are set in your environment or `.env` file:

```env
SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Test your connection:

```bash
node -e "console.log(process.env.SUPABASE_URL)"
```

## Step 3: Get a Directory ID

Find a directory ID from your database:

```sql
SELECT id, name, submission_url
FROM directories
WHERE submission_url IS NOT NULL
LIMIT 1;
```

Example ID: `550e8400-e29b-41d4-a716-446655440000`

## Step 4: Run Discovery on One Directory

```bash
cd backend/functions/selector-discovery
node run-discovery.js single 550e8400-e29b-41d4-a716-446655440000
```

Expected output:

```
🔍 [discover_xxx] Starting selector discovery for directory: 550e...
📄 [discover_xxx] Analyzing: Example Directory
🌐 [discover_xxx] Loading: https://example.com/submit
📋 [discover_xxx] Found 8 form fields
✅ [discover_xxx] Mapped 6 business fields
✅ [discover_xxx] Updated 6 selectors
✅ Discovery completed successfully!
```

## Step 5: Verify Results

Check your database:

```sql
SELECT
  id,
  name,
  field_selectors,
  selectors_updated_at,
  selector_discovery_log
FROM directories
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

You should see:

```json
{
  "field_selectors": {
    "businessName": "#company-name",
    "email": "input[type=\"email\"]",
    "website": "input[name=\"website\"]",
    ...
  },
  "selectors_updated_at": "2025-10-18T14:30:00Z",
  "selector_discovery_log": {
    "last_run": "2025-10-18T14:30:00Z",
    "updates": 6,
    "confidence_scores": {
      "businessName": 0.95,
      "email": 0.85,
      ...
    }
  }
}
```

## Step 6: Process Multiple Directories

Run batch discovery:

```bash
node run-discovery.js all
```

This will process the first 10 directories with submission URLs.

## Common Issues

### Issue: "Supabase environment variables are required"

**Solution:** Set your environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
```

Or use a `.env` file in the backend directory.

### Issue: "Chromium browser not found"

**Solution:** Install Playwright browsers:

```bash
cd backend
npx playwright install chromium
```

### Issue: "Directory not found or missing submission URL"

**Solution:** Verify the directory exists and has a `submission_url`:

```sql
SELECT id, name, submission_url FROM directories WHERE id = 'your-id';
```

### Issue: No selectors updated (confidence too low)

**Solution:** Lower the confidence threshold:

```javascript
// In run-discovery.js, change:
const discovery = new AutoSelectorDiscovery({
  headless: true,
  minConfidence: 0.5  // Lower from 0.7
});
```

## Next Steps

1. **Integrate with Workers**: Update your Playwright workers to use discovered selectors
2. **Schedule Regular Runs**: Set up cron job or Railway scheduled task
3. **Monitor Results**: Check `selector_discovery_log` for insights
4. **Fine-tune Patterns**: Add custom field patterns in `AutoSelectorDiscovery.js`

## Example Integration with Worker

```javascript
// In your Playwright worker:
const { data: directory } = await supabase
  .from('directories')
  .select('field_selectors')
  .eq('id', directoryId)
  .single();

// Use auto-discovered selectors
if (directory.field_selectors?.businessName) {
  await page.fill(directory.field_selectors.businessName, job.business_name);
}

if (directory.field_selectors?.email) {
  await page.fill(directory.field_selectors.email, job.email);
}
```

## Scheduling with Cron

Add to your crontab:

```bash
# Run discovery every Sunday at 2 AM
0 2 * * 0 cd /path/to/backend/functions/selector-discovery && node scheduled-discovery.js
```

## Railway Scheduled Job

In Railway dashboard:

1. Go to your project
2. Add a new "Scheduled Job"
3. Name: "Selector Discovery"
4. Schedule: `0 */6 * * *` (every 6 hours)
5. Command: `node backend/functions/selector-discovery/scheduled-discovery.js`
6. Save

## Support

For issues or questions, refer to:

- [Full Documentation](README.md)
- [DirectoryBolt Issues](https://github.com/your-org/directorybolt/issues)
