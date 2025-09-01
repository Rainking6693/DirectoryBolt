# DirectoryBolt Excel Import Guide

## Overview

The DirectoryBolt Excel Import script allows you to bulk import directory data from Excel files directly into your Supabase database. This comprehensive tool provides data transformation, validation, duplicate detection, and batch processing capabilities.

## Quick Start

### 1. Prepare Your Excel File

Place your Excel file named `directoryBolt480Directories.xlsx` in the project root directory. The file should contain the following columns (case-insensitive):

**Required Columns:**
- `Name` / `Directory Name` / `Website Name`
- `Website` / `URL` / `Site URL`
- `Category` / `Type` / `Industry`

**Optional Columns:**
- `DA` / `Domain Authority`
- `Submission URL` / `Submit URL`
- `Price` / `Cost` / `Fee`
- `Description` / `Notes`

### 2. Set Environment Variables

Ensure your `.env.local` file contains:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Import Commands

```bash
# Validate your Excel data first
npm run import:excel:validate

# Run a dry-run to see what would be imported
npm run import:excel:dry-run

# Import the data
npm run import:excel

# Get help and see all options
npm run import:excel:help
```

## Excel File Format

### Sample Excel Structure

| Name | Website | Category | DA | Submission URL | Price |
|------|---------|----------|----|--------------  |-------|
| Google Business Profile | https://business.google.com | Local Business | 100 | https://business.google.com/create | 0 |
| Forbes Technology | https://forbes.com | Business | 95 | https://forbes.com/business/submit | 0 |
| Product Hunt | https://producthunt.com | Technology | 91 | https://producthunt.com/posts/new | 0 |

### Column Mapping Flexibility

The import script handles various column name variations:

- **Name**: `name`, `directory name`, `site name`, `website name`
- **Website**: `website`, `url`, `site url`, `website url`, `link`
- **Category**: `category`, `type`, `sector`, `industry`
- **Domain Authority**: `da`, `domain authority`, `authority`, `domain_authority`
- **Submission URL**: `submission url`, `submit url`, `add url`, `registration url`
- **Price**: `price`, `cost`, `fee`, `pricing`

## Data Transformation

### Automatic Processing

1. **URL Cleaning**: Adds https://, removes trailing slashes
2. **Category Mapping**: Maps to DirectoryBolt standard categories
3. **Tier Assignment**: Based on Domain Authority scores
   - DA 90-100: Tier 1 (Starter)
   - DA 70-89: Tier 2 (Growth)
   - DA 50-69: Tier 3 (Pro)
   - DA 0-49: Tier 4 (Enterprise)
4. **Intelligent Defaults**: Sets appropriate values based on DA and category

### Category Mapping

Input categories are automatically mapped to DirectoryBolt categories:

```javascript
'business' → 'business_general'
'technology' → 'tech_startups'
'software' → 'saas'
'ai' → 'ai_tools'
'local' → 'local_business'
'reviews' → 'review_platforms'
// ... and many more
```

### Field Defaults

The script intelligently sets defaults based on the data:

- **Impact Level**: High (DA 85+), Medium (DA 60-84), Low (DA <60)
- **Difficulty**: Hard (DA 90+ or price >$100), Medium (default), Easy (DA <70 & free)
- **Time to Approval**: Same day (Easy), 1-3 days (Medium), 1-4 weeks (Hard)
- **Features**: Category-specific feature arrays
- **Estimated Traffic**: Calculated based on Domain Authority

## Command Options

### Basic Commands

```bash
# Import with default settings
npm run import:excel

# Import from custom file
npm run import:excel -- --file=my-directories.xlsx

# Validate data without importing
npm run import:excel:validate

# Dry run to see what would happen
npm run import:excel:dry-run
```

### Advanced Options

```bash
# Custom batch size
npm run import:excel -- --batch-size=50

# Skip existing directories
npm run import:excel -- --skip-duplicates

# Overwrite existing directories
npm run import:excel -- --overwrite-duplicates

# Disable report generation
npm run import:excel -- --output-report=false

# Verbose logging
npm run import:excel -- --verbose
```

## Duplicate Handling

The script provides comprehensive duplicate detection:

### Detection Method
- Normalizes URLs by removing protocol, www, and trailing slashes
- Compares against existing database entries
- Detects duplicates within the Excel file itself

### Handling Options
- **Skip Duplicates** (default): Skip URLs that already exist
- **Overwrite Duplicates**: Update existing directories with new data
- **Report Only**: Log duplicates but continue processing

### Example Output
```
⚠️  Row 15: Duplicate website URL detected: https://example.com
⚠️  Row 23: Website already exists in database: https://existing.com
```

## Validation & Error Handling

### Automatic Validation

The script validates:
- **Required fields**: Name, Website, Category must be present
- **URL format**: Must be valid HTTP/HTTPS URLs
- **Domain Authority**: Must be 0-100 range
- **Data consistency**: No duplicate websites within the file

### Error Reporting

```bash
❌ Row 5: Missing required data: name="", website="", category=""
❌ Row 12: Invalid website URL: not-a-url
❌ Row 18: Invalid domain authority: 150 (must be 0-100)
```

### Validation-Only Mode

```bash
npm run import:excel:validate
```

This mode:
- Reads and validates the Excel file
- Transforms data and checks for errors
- Reports statistics without importing
- Perfect for testing before actual import

## Batch Processing

### Performance Optimization

- **Default batch size**: 25 records per batch
- **Customizable**: Use `--batch-size=N` option
- **Error isolation**: Failed batches don't affect successful ones
- **Progress tracking**: Real-time batch completion reporting

### Example Output
```
🔄 Batch 1/20 completed (25 records)
🔄 Batch 2/20 completed (25 records)
✅ Batch 3/20 completed (25 records)
...
ℹ️  Batch insertion completed: 475 successful, 25 failed
```

## Import Reports

### Automatic Report Generation

Each import generates a detailed JSON report:

```json
{
  "timestamp": "2025-09-01T10:30:00.000Z",
  "configuration": {
    "excelFile": "directoryBolt480Directories.xlsx",
    "batchSize": 25,
    "skipDuplicates": true
  },
  "statistics": {
    "totalRows": 484,
    "validRows": 470,
    "duplicates": 8,
    "errors": 6,
    "inserted": 470,
    "skipped": 14
  },
  "errors": [
    "Row 15: Invalid website URL: invalid-url",
    "Row 23: Missing required data: name=\"\""
  ]
}
```

### Report Location
- **Filename**: `excel-import-report-{timestamp}.json`
- **Location**: Project root directory
- **Content**: Configuration, statistics, and error details

## Troubleshooting

### Common Issues

#### 1. "Excel file not found"
```bash
❌ Excel file not found: /path/to/directoryBolt480Directories.xlsx
```
**Solution**: Ensure the Excel file is in the project root with the correct name.

#### 2. "Missing required columns"
```bash
❌ Missing required columns: name, website. Available columns: Title, URL, Type
```
**Solution**: Rename columns to match expected formats or use recognized variations.

#### 3. "Missing environment variables"
```bash
❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```
**Solution**: Check your `.env.local` file contains the required Supabase credentials.

#### 4. "Failed to connect to database"
```bash
❌ Failed to load existing directories: invalid API key
```
**Solution**: Verify your Supabase URL and service role key are correct.

### Debug Mode

For detailed troubleshooting:

```bash
npm run import:excel -- --verbose --dry-run
```

This will:
- Show detailed column mapping
- Display transformed data samples
- Report all validation issues
- Provide comprehensive error messages

### Performance Issues

If import is slow:

1. **Reduce batch size**: `--batch-size=10`
2. **Check network**: Ensure stable internet connection
3. **Database health**: Verify Supabase service status
4. **File size**: Very large files (>1000 rows) may need chunking

## Integration with DirectoryBolt

### Database Schema Compatibility

The import script is fully compatible with the DirectoryBolt database schema:

```typescript
interface Directory {
  name: string
  website: string
  category: string
  domain_authority: number
  impact_level: 'High' | 'Medium' | 'Low'
  submission_url: string
  tier_required: 1 | 2 | 3 | 4
  difficulty: 'Easy' | 'Medium' | 'Hard'
  // ... additional fields with intelligent defaults
}
```

### API Integration

After import, directories are immediately available via:
- `/api/directories` - List all directories
- `/api/directories/[id]` - Get specific directory
- DirectoryBolt admin dashboard
- Existing directory filtering and search

### Existing Data Preservation

The import process:
- ✅ Preserves existing directory data
- ✅ Provides duplicate handling options
- ✅ Maintains referential integrity
- ✅ Updates statistics and indexes

## Best Practices

### Before Import
1. **Backup database**: Create a database backup
2. **Validate Excel**: Run validation mode first
3. **Test with subset**: Try with a small file first
4. **Check duplicates**: Review existing directories

### During Import
1. **Monitor progress**: Watch batch completion messages
2. **Check errors**: Address validation errors promptly
3. **Network stability**: Ensure stable internet connection
4. **Don't interrupt**: Let batches complete naturally

### After Import
1. **Verify counts**: Check total directory count
2. **Review report**: Examine the generated JSON report
3. **Test API**: Verify directories appear in API responses
4. **Update application**: Refresh any cached directory data

### Data Quality
1. **Clean URLs**: Ensure websites are valid and accessible
2. **Accurate categories**: Use consistent category naming
3. **Domain Authority**: Verify DA scores are current
4. **Complete data**: Fill optional fields when possible

## Advanced Usage

### Custom File Processing

For different file formats or structures:

```bash
node scripts/import-excel-directories.js --file=custom.xlsx --verbose
```

### Batch Size Optimization

For different database loads:

```bash
# Large batches for fast networks
npm run import:excel -- --batch-size=100

# Small batches for reliability
npm run import:excel -- --batch-size=10
```

### Error Recovery

If an import fails partway:

1. Check the error report
2. Fix data issues in Excel
3. Re-run with `--skip-duplicates` to avoid re-importing successful records

### Integration Testing

Test the import process:

```bash
# 1. Validate data
npm run import:excel:validate

# 2. Dry run
npm run import:excel:dry-run

# 3. Import small subset
head -n 50 large-file.xlsx > test-file.xlsx
npm run import:excel -- --file=test-file.xlsx

# 4. Full import
npm run import:excel
```

## Support

For issues or questions:

1. **Check logs**: Review console output and error reports
2. **Validate data**: Run validation mode to identify issues
3. **Documentation**: Review this guide and help output
4. **Community**: Check GitHub issues and discussions

## Changelog

### Version 1.0.0
- ✅ Excel file reading with flexible column mapping
- ✅ Comprehensive data transformation and validation
- ✅ Intelligent defaults based on Domain Authority
- ✅ Duplicate detection and handling options
- ✅ Batch processing with error isolation
- ✅ Detailed reporting and logging
- ✅ Integration with DirectoryBolt infrastructure
- ✅ Dry-run and validation modes
- ✅ Command-line interface with npm scripts