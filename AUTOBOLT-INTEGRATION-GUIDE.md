# AutoBolt Integration Guide

## 🎯 Overview

This guide will help you complete the AutoBolt integration by creating the necessary database tables and testing the Chrome extension functionality.

## 📋 Prerequisites

- ✅ **Backend APIs** - All AutoBolt APIs are implemented and working
- ✅ **Chrome Extension** - Updated with new API endpoints
- ✅ **Authentication** - Staff and admin dashboards working
- ✅ **Customer Data** - 3 customers in Supabase with 'pending' status

## 🗄️ Step 1: Create AutoBolt Database Tables

### Option A: Manual Creation (Recommended)

1. **Go to your Supabase Dashboard**
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

### Option B: Verify Tables Exist

Run this command to check if tables exist:
```bash
node scripts/verify-and-create-tables.js
```

## 🧪 Step 2: Test AutoBolt Integration

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

## 🔄 Step 3: End-to-End Testing

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

## 📊 Step 4: Monitor AutoBolt Processing

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
**Solution**: Create the AutoBolt tables using the SQL script

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

## 🔗 API Endpoints

### AutoBolt APIs
- `GET /api/autobolt/get-next-customer` - Get next customer for processing
- `POST /api/autobolt/update-progress` - Update directory submission progress
- `POST /api/autobolt/heartbeat` - Send extension heartbeat

### Staff APIs
- `GET /api/staff/queue` - Get customer queue
- `GET /api/staff/analytics` - Get analytics data
- `GET /api/staff/autobolt-queue` - Get AutoBolt queue
- `GET /api/staff/autobolt-extensions` - Get extension status
- `POST /api/staff/push-to-autobolt` - Push customer to AutoBolt

### Authentication
- `GET /api/staff/auth-check` - Check staff authentication
- `GET /api/admin/auth-check` - Check admin authentication

---

**AutoBolt Integration Status: Ready for Database Setup** 🚀
