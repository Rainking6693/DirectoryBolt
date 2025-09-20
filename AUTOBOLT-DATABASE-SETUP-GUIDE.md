# AutoBolt Database Setup Guide

## 🎯 Overview

This guide will help you create the AutoBolt database tables in your Supabase instance to complete the AutoBolt integration.

## 📋 Current Status

- ✅ **AutoBolt APIs** - All implemented and ready
- ✅ **Chrome Extension** - Updated with new endpoints
- ✅ **Staff Dashboard** - AutoBolt monitoring ready
- ❌ **Database Tables** - Need to be created manually

## 🗄️ Step 1: Create AutoBolt Tables

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `kolgqfjgncdwddziqloz`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the SQL**
   - Copy the entire contents of `supabase-autobolt-simple.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these new tables:
     - `autobolt_processing_queue`
     - `autobolt_extension_status`
     - `autobolt_processing_history`

### Method 2: Copy SQL Content

Here's the exact SQL to run:

```sql
-- Simplified AutoBolt Tables for Supabase
-- Run this in the Supabase SQL Editor

-- 1. Create autobolt_processing_queue table
CREATE TABLE autobolt_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    directory_limit INTEGER NOT NULL,
    priority_level INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    action VARCHAR(50) DEFAULT 'start_processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'staff_dashboard',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create autobolt_extension_status table
CREATE TABLE autobolt_extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_customer_id VARCHAR(50),
    current_queue_id UUID,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    directories_processed INTEGER DEFAULT 0,
    directories_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create autobolt_processing_history table
CREATE TABLE autobolt_processing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id UUID,
    customer_id VARCHAR(50) NOT NULL,
    session_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_completed_at TIMESTAMP WITH TIME ZONE,
    total_directories INTEGER NOT NULL,
    directories_completed INTEGER DEFAULT 0,
    directories_failed INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    processing_time_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);
CREATE INDEX idx_autobolt_queue_status ON autobolt_processing_queue(status);
CREATE INDEX idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);
CREATE INDEX idx_extension_status_extension_id ON autobolt_extension_status(extension_id);
CREATE INDEX idx_processing_history_customer_id ON autobolt_processing_history(customer_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_extension_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_processing_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (allow service role to access all data)
CREATE POLICY "Service role can access all autobolt data" 
    ON autobolt_processing_queue FOR ALL USING (true);

CREATE POLICY "Service role can access all extension status" 
    ON autobolt_extension_status FOR ALL USING (true);

CREATE POLICY "Service role can access all processing history" 
    ON autobolt_processing_history FOR ALL USING (true);

-- 7. Test the tables
SELECT 'AutoBolt tables created successfully!' as message;
```

## 🧪 Step 2: Verify Tables Created

Run this command to verify the tables were created successfully:

```bash
node scripts/verify-and-create-tables.js
```

Expected output:
```
✅ autobolt_processing_queue - EXISTS and accessible
✅ autobolt_extension_status - EXISTS and accessible
✅ autobolt_processing_history - EXISTS and accessible
🎉 All AutoBolt tables are ready!
```

## 🚀 Step 3: Test AutoBolt Functionality

### Test 1: Push Customer to AutoBolt

1. **Access Staff Dashboard**
   - Go to: http://localhost:3000/staff-login
   - Login with: `staff` / `DirectoryBoltStaff2025!`

2. **Push Customer to AutoBolt**
   - Go to "Customer Queue" tab
   - Find a customer with "Push to AutoBolt" button
   - Click the button
   - Should see success message

### Test 2: Verify AutoBolt APIs

Run this command to test all APIs:

```bash
node scripts/verify-and-create-tables.js
```

Expected results:
- ✅ AutoBolt get-next-customer API working
- ✅ AutoBolt update-progress API working
- ✅ AutoBolt heartbeat API working
- ✅ Push to AutoBolt working

### Test 3: Chrome Extension Integration

1. **Load Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `auto-bolt-extension` folder

2. **Test Extension APIs**
   - Open browser console (F12)
   - The extension should automatically start polling for customers
   - Check console for API calls to AutoBolt endpoints

## 🔄 Step 4: End-to-End Testing

### Complete Workflow Test

1. **Staff pushes customer to AutoBolt**
   - Use staff dashboard to push a customer
   - Customer should appear in `autobolt_processing_queue` table

2. **Chrome extension picks up customer**
   - Extension polls `/api/autobolt/get-next-customer`
   - Should receive customer data

3. **Extension processes directories**
   - Extension submits to directories
   - Updates progress via `/api/autobolt/update-progress`

4. **Staff monitors progress**
   - Check "AutoBolt Monitor" tab in staff dashboard
   - Should see real-time processing updates

## 📊 Step 5: Monitor AutoBolt Processing

### Staff Dashboard - AutoBolt Monitor

1. **Access AutoBolt Monitor**
   - Go to staff dashboard
   - Click "AutoBolt Monitor" tab

2. **Monitor Processing**
   - View queue statistics
   - See extension status
   - Track processing progress

### Database Monitoring

Check these tables for real-time data:
- `autobolt_processing_queue` - Customer processing queue
- `autobolt_extension_status` - Extension health and status
- `autobolt_processing_history` - Processing session history
- `directory_submissions` - Individual directory submissions

## 🚨 Troubleshooting

### Common Issues

#### 1. "Table not found" errors
**Solution**: Create the AutoBolt tables using the SQL script above

#### 2. "Authentication failed" errors
**Solution**: Use correct credentials:
- Staff: `staff` / `DirectoryBoltStaff2025!`
- Admin: `admin` / `DirectoryBolt2025!`

#### 3. Chrome extension not connecting
**Solution**: 
- Check extension is loaded correctly
- Verify API endpoints are accessible
- Check browser console for errors

#### 4. Push to AutoBolt fails
**Solution**: 
- Ensure AutoBolt tables exist
- Check customer status is 'pending'
- Verify staff authentication

### Debug Commands

```bash
# Test all APIs
node scripts/verify-and-create-tables.js

# Check customer status
curl -X GET "http://localhost:3000/api/staff/queue" -H "Authorization: Bearer DirectoryBolt-Staff-2025-SecureKey"

# Test push to AutoBolt
curl -X POST "http://localhost:3000/api/staff/push-to-autobolt" -H "Authorization: Bearer DirectoryBolt-Staff-2025-SecureKey" -H "Content-Type: application/json" -d '{"customer_id": "DIR-20250918-700000"}'
```

## 🎉 Success Criteria

AutoBolt integration is complete when:

- ✅ **AutoBolt tables exist** in Supabase
- ✅ **Push to AutoBolt works** from staff dashboard
- ✅ **Chrome extension connects** to backend APIs
- ✅ **Real-time monitoring works** in staff dashboard
- ✅ **Directory submissions tracked** in database
- ✅ **Progress updates work** end-to-end

## 📞 Support

If you encounter issues:

1. **Check the logs** in browser console and server logs
2. **Verify database tables** exist and have correct structure
3. **Test APIs individually** using the debug commands
4. **Check authentication** is working correctly

---

**AutoBolt Database Setup Status: Ready for Manual Table Creation** 🚀
