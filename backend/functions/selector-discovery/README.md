# Selector Auto-Discovery System

Automatically discover and maintain CSS selectors for directory submission forms.

## Overview

The Selector Auto-Discovery System uses Playwright to analyze directory submission forms, intelligently map form fields to business data, and automatically update selectors in the database with confidence scoring.

## Features

- **Intelligent Field Mapping**: Automatically matches form fields to business data using pattern recognition
- **Confidence Scoring**: Each selector is scored based on reliability (ID > Name > Placeholder > CSS Path)
- **Fallback Selectors**: Generates multiple selector options for resilience
- **Validation**: Tests each selector to ensure it works before saving
- **Batch Processing**: Process multiple directories in sequence
- **Auto-Update**: Only updates selectors with high confidence scores (>70%)

## Installation

```bash
# Install dependencies
cd backend
npm install playwright

# Install Chromium browser
npx playwright install chromium
```

## Usage

### CLI Tool

The `run-discovery.js` script provides three modes:

#### 1. Discover All Directories

Process all directories with submission URLs (limited to first 10):

```bash
node backend/functions/selector-discovery/run-discovery.js all
```

#### 2. Discover Failed Directories

Only process directories with high failure rates:

```bash
node backend/functions/selector-discovery/run-discovery.js failed
```

#### 3. Single Directory

Process a specific directory by ID:

```bash
node backend/functions/selector-discovery/run-discovery.js single <directory-id>
```

### Scheduled Discovery

For automated runs (e.g., via cron or Railway scheduled jobs):

```bash
node backend/functions/selector-discovery/scheduled-discovery.js
```

This processes 5 failed directories per run with 80% confidence threshold.

## Environment Variables

Required environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## How It Works

### 1. Form Detection

- Loads directory submission URL with Playwright
- Detects all form elements (inputs, textareas, selects)
- Extracts metadata (ID, name, placeholder, label, aria-label)

### 2. Field Mapping

Maps discovered fields to business data using pattern matching:

| Business Field | Patterns |
|---------------|----------|
| businessName | company name, business name, organization |
| email | email, e-mail, contact email |
| website | website, url, homepage |
| phone | phone, telephone, mobile |
| description | description, about, summary, bio |
| address | address, street, location |
| category | category, type, industry |

### 3. Selector Generation

Creates selectors with priority ranking:

1. **ID Selector** (95% confidence) - `#fieldId`
2. **Name Attribute** (85% confidence) - `input[name="fieldName"]`
3. **Placeholder** (70% confidence) - `input[placeholder="Enter email"]`
4. **Input Type** (60% confidence) - `input[type="email"]`
5. **CSS Path** (50% confidence) - `form > div:nth-of-type(3) > input`

### 4. Validation

- Tests each selector on the live page
- Verifies element is visible and enabled
- Keeps top 3 working selectors as fallbacks

### 5. Database Update

- Compares new selectors with existing ones
- Only updates if:
  - Field is new (doesn't exist), OR
  - Confidence score > 70%
- Stores discovery metadata (timestamp, confidence scores)

## Configuration

Customize behavior via config object:

```javascript
const discovery = new AutoSelectorDiscovery({
  headless: true,           // Run browser in headless mode
  timeout: 30000,           // Page load timeout (ms)
  minConfidence: 0.7        // Minimum confidence to auto-update
});
```

## Output Example

```
🔍 [discover_1234567890_abc123] Starting selector discovery for directory: dir-123
📄 [discover_1234567890_abc123] Analyzing: Yelp
🌐 [discover_1234567890_abc123] Loading: https://www.yelp.com/signup
🔎 [discover_1234567890_abc123] Discovering form fields...
📋 [discover_1234567890_abc123] Found 12 form fields
🗺️ [discover_1234567890_abc123] Mapping fields to business data...
✅ [discover_1234567890_abc123] Mapped 7 business fields
🎯 [discover_1234567890_abc123] Generating selectors...
✔️ [discover_1234567890_abc123] Validating selectors...
✅ [discover_1234567890_abc123] Validated 7 fields
💾 [discover_1234567890_abc123] Saving selectors to database...
🔄 [discover_1234567890_abc123] Updating businessName: #business-name (confidence: 95%)
🔄 [discover_1234567890_abc123] Updating email: input[type="email"] (confidence: 85%)
✅ [discover_1234567890_abc123] Updated 7 selectors for Yelp
✅ [discover_1234567890_abc123] Discovery complete. Found 7 fields
```

## Database Schema

The system updates the `directories` table:

```sql
{
  field_selectors: {
    businessName: "#business-name",
    email: "input[type=\"email\"]",
    website: "input[name=\"website\"]",
    ...
  },
  selectors_updated_at: "2025-10-18T14:30:00Z",
  selector_discovery_log: {
    last_run: "2025-10-18T14:30:00Z",
    updates: 7,
    confidence_scores: {
      businessName: 0.95,
      email: 0.85,
      ...
    }
  }
}
```

## Integration with Workers

Workers use discovered selectors via:

```javascript
const { data: directory } = await supabase
  .from('directories')
  .select('field_selectors')
  .eq('id', directoryId)
  .single();

// Use selectors
await page.fill(directory.field_selectors.businessName, businessData.name);
await page.fill(directory.field_selectors.email, businessData.email);
```

## Scheduling on Railway

Add a scheduled job to Railway:

1. Create new scheduled job
2. Set schedule: `0 */6 * * *` (every 6 hours)
3. Command: `node backend/functions/selector-discovery/scheduled-discovery.js`

## Troubleshooting

### Browser Installation Issues

```bash
# Install system dependencies (Linux)
npx playwright install-deps chromium

# Verify installation
npx playwright --version
```

### Supabase Connection Errors

Ensure environment variables are set:

```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Selector Not Found

- Check that submission_url is valid
- Verify page loads without errors
- Try running in non-headless mode: `headless: false`

## Best Practices

1. **Start Small**: Test with a single directory first
2. **Review Auto-Updates**: Check `selector_discovery_log` for changes
3. **Manual Review**: Set `minConfidence: 0.9` for critical directories
4. **Schedule Wisely**: Run weekly for stable sites, daily for frequently changing ones
5. **Monitor Failures**: Use `failed` mode to focus on problematic directories

## Limitations

- Requires JavaScript-rendered forms to be in initial HTML
- Cannot handle multi-step forms (yet)
- Doesn't handle dynamic field names
- Limited to visible, enabled fields

## Future Enhancements

- [ ] Multi-step form support
- [ ] Dynamic field name handling
- [ ] Success rate tracking
- [ ] Selector performance metrics
- [ ] A/B testing between selector options
- [ ] Integration with Staff Dashboard
