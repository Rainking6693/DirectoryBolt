# QUICK FIX SETUP GUIDE
## DirectoryBolt Supabase Migration - Immediate Actions

### 🚨 CRITICAL PRIORITY FIXES

#### 1. Create Supabase Database Schema (IMMEDIATE)

**Action**: Go to Supabase Dashboard and create the database schema

1. **Access Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz
   - Navigate to SQL Editor

2. **Execute Schema Creation**:
   ```sql
   -- Copy and paste the ENTIRE content from this file:
   lib/database/supabase-schema.sql
   
   -- Run all statements in the SQL Editor
   -- This will create all required tables, indexes, triggers, and policies
   ```

3. **Verify Schema Creation**:
   ```sql
   -- Run these verification queries:
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('customers', 'queue_history', 'customer_notifications');
   
   -- Should return 3 rows if successful
   ```

#### 2. Fix Module Import Issues (IMMEDIATE)

**Problem**: Mixed ES6/CommonJS imports causing compilation failures

**Files to Fix**:

1. `pages/api/extension/validate.ts`:
   ```typescript
   // Current (broken):
   import { SupabaseService } from '../../../lib/services/supabase';
   
   // Fix Option 1 - Use require:
   const { SupabaseService } = require('../../../lib/services/supabase');
   
   // Fix Option 2 - Fix the export in supabase.js:
   // In lib/services/supabase.js, change the last lines to:
   module.exports = SupabaseService;
   module.exports.SupabaseService = SupabaseService;
   module.exports.createSupabaseService = createSupabaseService;
   module.exports.default = SupabaseService;
   ```

2. Similar fixes needed for:
   - `pages/api/autobolt/queue-status.ts`
   - `pages/api/admin/customers/stats.ts`
   - `pages/api/business-info/submit.ts`

#### 3. Clear and Restart Development Environment

```bash
# Clear all cache and restart
rm -rf .next
npm run dev
```

### 🔧 TESTING AFTER FIXES

#### Test 1: Database Connection
```bash
node test-supabase-connection.js
# Should show: ✅ Direct connection successful
```

#### Test 2: API Endpoints
```bash
# Customer validation (should work after schema + import fix)
curl -X GET "http://localhost:3003/api/extension/validate?customerId=DIR-20250918-123456"

# Expected response format:
{
  "ok": false,
  "code": "NOT_FOUND",
  "message": "Customer ID not found."
}
```

#### Test 3: Customer Creation
```bash
# Create a test customer
curl -X POST "http://localhost:3003/api/business-info/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test", 
    "lastName": "User", 
    "businessName": "Test Business", 
    "email": "test@example.com", 
    "packageType": "starter"
  }'

# Should return customer with auto-generated ID
```

### 🎯 SUCCESS CRITERIA

After completing the fixes, you should see:

1. ✅ Database connection successful
2. ✅ API endpoints responding (not 500 errors)
3. ✅ Customer creation working with auto-generated IDs
4. ✅ Customer validation working for existing customers
5. ✅ Development server stable without compilation errors

### 📋 SAMPLE TEST DATA

After schema is created, you can add sample data for testing:

```sql
-- Insert test customers in Supabase SQL Editor:
INSERT INTO customers (customer_id, first_name, last_name, business_name, email, package_type, status) VALUES
('DIR-20250918-123456', 'John', 'Doe', 'Acme Corp', 'john@acme.com', 'professional', 'active'),
('DIR-20250918-123457', 'Jane', 'Smith', 'TechStart Inc', 'jane@techstart.com', 'growth', 'pending'),
('DIR-20250918-123458', 'Bob', 'Johnson', 'Local Cafe', 'bob@localcafe.com', 'starter', 'completed');
```

### 🚀 AFTER BASIC FUNCTIONALITY IS RESTORED

1. **Migrate Existing Data**: Transfer customers from Google Sheets to Supabase
2. **Test Dashboards**: Verify staff and admin dashboards load correctly
3. **Test Chrome Extension**: Validate customer ID lookup functionality
4. **Test Real-time Features**: Verify live dashboard updates
5. **Production Build**: Test `npm run build` and `npm start`

### ⏱️ ESTIMATED TIME

- **Database Schema Creation**: 15-30 minutes
- **Import Fixes**: 30-45 minutes  
- **Testing and Validation**: 30-60 minutes
- **Total**: 1.5-2.5 hours

### 🆘 IF YOU ENCOUNTER ISSUES

1. **Database Creation Fails**: Check Supabase project permissions and try smaller SQL chunks
2. **Import Errors Persist**: Try converting all API files to use CommonJS require() consistently
3. **Compilation Still Broken**: Delete node_modules and reinstall: `rm -rf node_modules && npm install`
4. **API Errors Continue**: Check environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`

---

**Priority Order**: Database Schema → Import Fixes → Testing → Data Migration