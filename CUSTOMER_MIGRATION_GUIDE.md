# 🚀 DirectoryBolt Customer Migration: Google Sheets → Supabase

## CRITICAL MIGRATION STATUS

**CURRENT GOOGLE SHEETS DATA:**
- `DIR-20250917-000001` (Bennet g, Growth package, Test business)
- `DIR-20250917-000002` (Stone b, Professional package, Directory Bolt business)

**MIGRATION OBJECTIVE:**
Export all customer data from Google Sheets and migrate to Supabase database while preserving existing customer IDs and ensuring backward compatibility with Chrome extension and staff dashboard.

---

## 📋 MIGRATION STEPS

### Step 1: Create Customers Table in Supabase

1. **Open Supabase SQL Editor:**
   - Go to: https://app.kolgqfjgncdwddziqloz.supabase.co/project/_/sql

2. **Execute the SQL:**
   - Copy the complete SQL from `customers-table-setup.sql`
   - Paste and run in Supabase SQL Editor
   - Verify successful execution (should see "Customers table created successfully!")

### Step 2: Run Customer Data Migration

```bash
cd "C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt"
node scripts/migrate-customers-to-supabase.js
```

This script will:
- Export customers from Google Sheets
- Transform data to Supabase schema
- Insert customers with preserved IDs
- Generate migration report
- Validate data integrity

### Step 3: Test Chrome Extension Validation

```bash
# Test with migrated customer IDs
curl -X POST http://localhost:3000/api/customer/supabase-lookup \
  -H "Content-Type: application/json" \
  -d '{"customerId": "DIR-20250917-000001"}'

curl -X POST http://localhost:3000/api/customer/supabase-lookup \
  -H "Content-Type: application/json" \
  -d '{"customerId": "DIR-20250917-000002"}'
```

### Step 4: Test Staff Dashboard

- Access: http://localhost:3000/admin/customers
- Verify customers load from Supabase
- Test queue functionality with migrated data

---

## 🔧 MIGRATION COMPONENTS

### Created Files

1. **`scripts/migrate-customers-to-supabase.js`**
   - Main migration script
   - Exports from Google Sheets
   - Inserts into Supabase with data mapping
   - Validates migration integrity

2. **`pages/api/customer/supabase-lookup.ts`**
   - Backward-compatible customer lookup API
   - Maps original customer IDs to Supabase records
   - Provides fallback to Google Sheets

3. **`customers-table-setup.sql`**
   - Complete SQL for creating customers table
   - Includes indexes, triggers, and functions
   - Creates admin test user

4. **Updated `lib/services/supabase.js`**
   - Enhanced to work with migrated data
   - Backward compatibility for old schema
   - Maps between Google Sheets and Supabase formats

---

## 📊 DATA MAPPING

### Google Sheets → Supabase Transformation

| Google Sheets Field | Supabase Field | Storage Location |
|---------------------|----------------|------------------|
| `customerId` | `business_data.original_customer_id` | JSONB field |
| `firstName` | Extracted from `full_name` | VARCHAR |
| `lastName` | Extracted from `full_name` | VARCHAR |
| `businessName` | `company_name` | VARCHAR |
| `email` | `email` | VARCHAR (unique) |
| `phone` | `business_data.phone` | JSONB field |
| `website` | `business_data.website` | JSONB field |
| `packageType` | `business_data.original_package_type` | JSONB field |
| `status` | Mapped to `subscription_status` | VARCHAR |

### Package Type Mapping

| Google Sheets | Supabase Tier | Credits Limit |
|---------------|---------------|---------------|
| `starter` | `basic` | 100 |
| `growth` | `pro` | 500 |
| `professional` | `pro` | 1000 |
| `enterprise` | `enterprise` | 2000 |

---

## 🧪 VALIDATION REQUIREMENTS

### Data Integrity Checks

1. **Customer ID Preservation:**
   - Original IDs stored in `business_data.original_customer_id`
   - Searchable via metadata fields
   - Backward-compatible lookup APIs

2. **Chrome Extension Compatibility:**
   - Updated validation endpoint: `/api/extension/validate`
   - Uses enhanced Supabase service
   - Fallback to Google Sheets if needed

3. **Staff Dashboard Compatibility:**
   - Customer lookup works with original IDs
   - Queue processing maintains functionality
   - Real-time updates continue working

4. **API Backward Compatibility:**
   - All existing customer endpoints work
   - Original customer ID format preserved
   - Package types correctly mapped

---

## 🔍 TESTING CHECKLIST

### Pre-Migration Tests
- [ ] Google Sheets connection working
- [ ] Supabase connection working  
- [ ] Customers table created successfully
- [ ] Test customers exist in Google Sheets

### Post-Migration Tests
- [ ] All customers migrated successfully
- [ ] Original customer IDs preserved
- [ ] Chrome extension validation works
- [ ] Staff dashboard loads customers
- [ ] Queue processing works with migrated data
- [ ] API endpoints return correct data
- [ ] Package types correctly mapped
- [ ] Credit limits set properly

### API Validation Tests
```bash
# Test Chrome extension validation
GET /api/extension/validate?customerId=DIR-20250917-000001

# Test customer lookup
POST /api/customer/supabase-lookup
{"customerId": "DIR-20250917-000001"}

# Test staff dashboard data
GET /api/admin/customers/stats
```

---

## 🚨 ROLLBACK PLAN

If migration fails or issues arise:

1. **Immediate Rollback:**
   - Keep Google Sheets as primary source
   - Comment out Supabase lookups in APIs
   - Revert to original validation endpoints

2. **Partial Rollback:**
   - Use fallback mechanisms in APIs
   - Gradual migration approach
   - Test with subset of customers first

3. **Data Recovery:**
   - All original data preserved in Google Sheets
   - Migration creates backup records
   - No destructive operations performed

---

## 📈 SUCCESS CRITERIA

Migration is successful when:

1. ✅ All customers from Google Sheets are in Supabase
2. ✅ Original customer IDs are preserved and searchable
3. ✅ Chrome extension validates customers correctly
4. ✅ Staff dashboard loads and displays customer data
5. ✅ Queue processing works with migrated data
6. ✅ All APIs return correct customer information
7. ✅ Package types and credit limits are accurate
8. ✅ No data loss or corruption occurred

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Issue:** Migration script fails to connect to Supabase
- **Solution:** Check environment variables in `.env.local`
- **Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Issue:** Customers table doesn't exist
- **Solution:** Manually run SQL from `customers-table-setup.sql` in Supabase dashboard

**Issue:** Chrome extension validation fails
- **Solution:** Check updated Supabase service and endpoint configuration

**Issue:** Original customer IDs not found
- **Solution:** Verify `business_data.original_customer_id` field contains correct values

### Debug Commands

```bash
# Check environment variables
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test Google Sheets connection
node -e "const {createGoogleSheetsService} = require('./lib/services/google-sheets.js'); require('dotenv').config({path:'.env.local'}); (async()=>{const service = createGoogleSheetsService(); await service.initialize(); console.log(await service.testConnection())})()"

# Test Supabase connection
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path:'.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('customers').select('count').then(r=>console.log(r))"
```

---

## 📞 SUPPORT

For migration issues or questions:

1. **Check migration report:** `migration-report-[timestamp].json`
2. **Review error logs:** Console output from migration script
3. **Verify environment:** Ensure all required environment variables are set
4. **Test connections:** Verify both Google Sheets and Supabase connectivity

**Critical Customer IDs to Test:**
- `DIR-20250917-000001` (Bennet g, Growth package)
- `DIR-20250917-000002` (Stone b, Professional package)

These represent the current customers that must be successfully migrated and validated.