# 🚀 DirectoryBolt Database Setup - Complete Guide

## URGENT: Import 484 Directories from Excel

This guide provides **complete instructions** to set up your database schema for importing 484 directories from Excel.

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Get SQL Schema
```bash
npm run migrate:simple
```
This will display the SQL you need to run.

### Step 2: Run SQL in Supabase Dashboard
1. Copy the SQL from Step 1
2. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
3. Open **SQL Editor**
4. Paste and **run the SQL**

### Step 3: Validate & Import
```bash
# Validate table setup
npm run validate:table

# Import your Excel file
npm run import:excel
```

---

## 📋 Detailed Instructions

### Prerequisites ✅

Your `.env.local` file should have:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 1. Generate Database Schema SQL

Run this command to get the SQL:
```bash
npm run migrate:simple
```

You'll see SQL output like this:
```sql
-- DirectoryBolt Excel-Compatible Directories Table
DROP TABLE IF EXISTS directories CASCADE;

CREATE TABLE directories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    domain_authority INTEGER DEFAULT 50 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    -- ... more columns
);
-- ... indexes and triggers
```

### 2. Execute SQL in Supabase

1. **Open Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your DirectoryBolt project

2. **Open SQL Editor**  
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration SQL**
   - Copy the SQL from step 1
   - Paste it into the SQL Editor
   - Click **Run** or press `Ctrl+Enter`

4. **Verify Success**
   - You should see "Success" message
   - Check **Database > Tables** to see `directories` table

### 3. Validate Database Setup

```bash
npm run validate:table
```

Expected output:
```
✅ Connected to Supabase
✅ Directories table exists
✅ Insert operation works  
✅ Update operation works
✅ Delete operation works
📊 Current directories in table: 2
🎉 VALIDATION SUCCESSFUL!
```

### 4. Import Excel Directories

```bash
# First validate your Excel file
npm run import:excel:validate

# See what would be imported (dry run)
npm run import:excel:dry-run  

# Import all 484 directories
npm run import:excel
```

---

## 🔧 Schema Details

### Table: `directories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `name` | VARCHAR(255) | Directory name (from Excel) |
| `website` | VARCHAR(500) | Website URL (unique) |
| `category` | VARCHAR(100) | Category text (from Excel) |
| `domain_authority` | INTEGER | DA score 0-100 |
| `impact_level` | VARCHAR(20) | Low/Medium/High |
| `tier_required` | INTEGER | 1-4 based on DA |
| `difficulty` | VARCHAR(20) | Easy/Medium/Hard |
| `active` | BOOLEAN | Default true |
| `estimated_traffic` | INTEGER | Estimated monthly traffic |
| `time_to_approval` | VARCHAR(50) | Expected approval time |
| `price` | INTEGER | Price in cents |
| `features` | JSONB | Array of features |
| `requires_approval` | BOOLEAN | Whether approval needed |
| `country_code` | VARCHAR(2) | Country code |
| `language` | VARCHAR(10) | Language code |
| `description` | TEXT | Directory description |
| `created_at` | TIMESTAMP | Auto-generated |
| `updated_at` | TIMESTAMP | Auto-updated |

### Key Features:
- ✅ **Excel Compatible**: Matches import script expectations
- ✅ **No Foreign Keys**: Simple category text field (no complex relationships)
- ✅ **Performance Optimized**: Indexes on key columns
- ✅ **Data Integrity**: Constraints and checks
- ✅ **Auto-timestamping**: Created/updated timestamps

---

## 🚨 Troubleshooting

### "Table not found" Error
```bash
# Check if SQL was run in Supabase
npm run validate:table

# If failed, re-run SQL in Supabase dashboard
npm run migrate:simple
```

### "Missing environment variables" Error
```bash
# Check .env.local file
cat .env.local | grep SUPABASE

# Verify credentials in Supabase dashboard
```

### Excel Import Fails
```bash
# Validate Excel file first
npm run import:excel:validate

# Check table setup
npm run validate:table

# Try smaller batch
node scripts/import-excel-directories.js --batch-size=10
```

### Permission Denied Errors
- Ensure you're using **SERVICE_ROLE_KEY** (not anon key)
- Check key has database modification permissions
- Verify project is active in Supabase dashboard

---

## 📊 Expected Results

After complete setup:

### Database:
- ✅ `directories` table with 20 columns
- ✅ Proper indexes and constraints  
- ✅ 2 sample records (Google, Yelp)

### Excel Import:
- ✅ ~480 directories imported successfully
- ✅ Categories mapped correctly
- ✅ DA scores assigned tiers automatically
- ✅ All fields populated with intelligent defaults

### Performance:
- ✅ Fast queries with indexes
- ✅ Batch import optimized for 500+ records
- ✅ Ready for production use

---

## 🎯 Success Checklist

- [ ] Environment variables set in `.env.local`
- [ ] SQL migration run in Supabase dashboard  
- [ ] `npm run validate:table` shows all ✅
- [ ] Excel file `directoryBolt480Directories.xlsx` in project root
- [ ] `npm run import:excel:validate` passes
- [ ] `npm run import:excel` completes successfully
- [ ] Supabase dashboard shows ~484 directories

---

## ⚡ Command Quick Reference

```bash
# Setup
npm run migrate:simple          # Get SQL for Supabase
npm run validate:table          # Check table setup

# Import  
npm run import:excel:validate   # Validate Excel data
npm run import:excel:dry-run    # See what would import
npm run import:excel            # Import directories

# Troubleshooting
npm run migrate:simple --dry-run # Show SQL without running
npm run validate:schema:verbose # Detailed validation
npm run import:excel:help       # Import options
```

---

## 📞 Need Help?

1. **Check Status**: `npm run validate:table`
2. **View Logs**: All scripts show detailed progress and errors
3. **Verify Dashboard**: Check Supabase dashboard for tables and data
4. **Test Connection**: Scripts will report connection issues clearly

---

**🎉 Ready to import your 484 directories? Start with Step 1 above!**