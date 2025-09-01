# Excel Directory Import - Complete Implementation

## 🚀 Quick Start

1. **Place your Excel file** named `directoryBolt480Directories.xlsx` in the project root
2. **Validate the data** first: `npm run import:excel:validate`
3. **Run a dry-run**: `npm run import:excel:dry-run`
4. **Import the data**: `npm run import:excel`

## 📋 Excel File Requirements

### Required Columns (case-insensitive)
- **Name** (or "Directory Name", "Website Name")
- **Website** (or "URL", "Site URL")
- **Category** (or "Type", "Industry")

### Optional Columns
- **DA** (or "Domain Authority") - will default to 50 if missing
- **Submission URL** - will be auto-generated if missing
- **Price** - will default to 0 if missing

### Sample Data Structure
```
| Name                    | Website                      | Category        | DA  |
|------------------------|------------------------------|-----------------|-----|
| Google Business Profile | https://business.google.com  | Local Business  | 100 |
| Forbes Technology      | https://forbes.com           | Business        | 95  |
| Product Hunt           | https://producthunt.com      | Technology      | 91  |
```

## 🛠 Available Commands

```bash
# Import directories from Excel
npm run import:excel

# Validate Excel data without importing
npm run import:excel:validate

# Dry run to see what would be imported
npm run import:excel:dry-run

# Show all available options
npm run import:excel:help
```

## ⚙️ Advanced Options

```bash
# Custom Excel file
npm run import:excel -- --file=my-directories.xlsx

# Custom batch size
npm run import:excel -- --batch-size=50

# Overwrite existing directories
npm run import:excel -- --overwrite-duplicates

# Skip existing directories (default)
npm run import:excel -- --skip-duplicates

# Verbose logging
npm run import:excel -- --verbose
```

## 🎯 Key Features

### ✅ Intelligent Data Transformation
- **Auto-tier assignment** based on Domain Authority (90+ = Tier 1, 70-89 = Tier 2, etc.)
- **Category mapping** to DirectoryBolt standard categories
- **URL cleaning** and validation
- **Smart defaults** for missing fields based on DA and category

### ✅ Comprehensive Validation
- **Required field checking**
- **URL format validation**
- **Duplicate detection** (both in Excel and database)
- **Data range validation** (DA 0-100, valid tiers, etc.)

### ✅ Robust Error Handling
- **Batch processing** with error isolation
- **Detailed error reporting**
- **Automatic retry logic**
- **Progress tracking**

### ✅ Duplicate Management
- **URL normalization** for accurate duplicate detection
- **Skip or overwrite** existing directories
- **Comprehensive duplicate reporting**

## 📊 Data Processing Logic

### Tier Assignment (Based on Domain Authority)
```javascript
DA 90-100  →  Tier 1 (Starter)
DA 70-89   →  Tier 2 (Growth) 
DA 50-69   →  Tier 3 (Pro)
DA 0-49    →  Tier 4 (Enterprise)
```

### Category Mapping Examples
```javascript
'business' → 'business_general'
'technology' → 'tech_startups'
'software' → 'saas'
'ai' → 'ai_tools'
'local' → 'local_business'
// ... and 20+ more mappings
```

### Intelligent Defaults
- **Impact Level**: High (DA 85+), Medium (DA 60-84), Low (DA <60)
- **Difficulty**: Hard (DA 90+ or paid), Medium (default), Easy (DA <70 & free)
- **Features**: Category-specific arrays
- **Time to Approval**: Based on difficulty level
- **Estimated Traffic**: Calculated from Domain Authority

## 📈 Import Statistics

After import, you'll see comprehensive statistics:

```json
{
  "totalRows": 484,
  "validRows": 470,
  "duplicates": 8,
  "errors": 6,
  "inserted": 470,
  "updated": 0,
  "skipped": 14
}
```

## 🔍 Validation Examples

### ✅ Valid Row
```
Name: "Google Business Profile"
Website: "https://business.google.com"
Category: "Local Business"
DA: 100
Result: ✅ Transformed to Tier 1, High Impact, Easy difficulty
```

### ❌ Invalid Row
```
Name: ""
Website: "not-a-url"
Category: "Unknown"
DA: 150
Result: ❌ Missing name, invalid URL, invalid DA range
```

## 📁 Generated Files

### Import Report
- **Location**: `excel-import-report-{timestamp}.json`
- **Contains**: Full statistics, errors, configuration
- **Purpose**: Audit trail and debugging

### Log Output
```bash
🔄 Reading Excel file: directoryBolt480Directories.xlsx
✅ Excel file read successfully: 484 data rows found
✅ Column mapping completed. Required fields mapped: name, website, category
🔄 Transforming Excel data to directory format...
✅ Data transformation completed. 470 valid directories processed
🔄 Inserting 470 directories in batches of 25...
✅ Batch 1/19 completed (25 records)
✅ Batch 2/19 completed (25 records)
...
🎉 Excel directory import completed successfully!
```

## 🔧 Troubleshooting

### Common Issues & Solutions

**"Excel file not found"**
→ Ensure file is in project root with correct name

**"Missing required columns"** 
→ Check column names match expected variations

**"Invalid website URL"**
→ Fix URLs in Excel (script auto-adds https://)

**"Duplicate website detected"**
→ Use `--overwrite-duplicates` or remove duplicates from Excel

**"Database connection failed"**
→ Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

## 🏗 Integration with DirectoryBolt

### Database Schema Compatibility
- ✅ Fully compatible with existing schema
- ✅ Maintains referential integrity
- ✅ Preserves existing data
- ✅ Updates indexes and statistics

### API Integration
- ✅ Imported directories immediately available via API
- ✅ Appears in admin dashboard
- ✅ Searchable and filterable
- ✅ Maintains all DirectoryBolt functionality

## 📋 Pre-Flight Checklist

Before running the import:

- [ ] Excel file placed in project root
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Database backup created (recommended)
- [ ] Ran validation: `npm run import:excel:validate`
- [ ] Ran dry-run: `npm run import:excel:dry-run`
- [ ] Reviewed column mapping and sample transformations

## 🎯 Expected Results

With your 484 directory Excel file, you should expect:

- **~470-480 successful imports** (assuming minimal data issues)
- **~5-10 validation errors** (typical for large datasets)
- **~2-5 duplicates** (if any existing directories match)
- **~20-25 batches** processed at default batch size
- **5-10 minutes** total import time
- **Comprehensive JSON report** with full audit trail

## 📞 Support

If you encounter issues:

1. Run `npm run import:excel:validate --verbose` for detailed diagnostics
2. Check the generated import report JSON file
3. Review the Excel Import Guide in `docs/EXCEL-IMPORT-GUIDE.md`
4. Verify environment variables and database connection

---

**Ready to import your 484 directories? Start with validation, then run the full import!**

```bash
npm run import:excel:validate && npm run import:excel
```