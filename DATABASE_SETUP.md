# DirectoryBolt Database Setup

Complete Supabase database schema for DirectoryBolt customer management system with auto-generating customer IDs and comprehensive tracking.

## 🎯 Quick Start

### 1. Execute SQL Schema

Copy and paste the entire contents of `supabase-setup.sql` into your Supabase SQL Editor and execute it.

**Supabase Dashboard → SQL Editor → New Query → Paste → Run**

### 2. Verify Setup

```bash
node scripts/verify-database-setup.js
```

## 📋 Features Implemented

### ✅ Auto-Generating Customer IDs
- Format: `DIR-YYYYMMDD-XXXXXX` (e.g., `DIR-20250918-000001`)
- Automatically generated on customer creation
- Uses PostgreSQL sequence for uniqueness
- Date-based for easy identification

### ✅ Enhanced Customer Table
- All Google Sheets compatible columns
- JSONB fields for flexible data storage
- Comprehensive indexing for performance
- Real-time triggers for data consistency

### ✅ Supporting Tables
- **customer_submissions**: Track individual directory submissions
- **customer_progress**: Overall project progress and metrics
- **customer_communications**: All customer interactions
- **customer_payments**: Payment and billing history

### ✅ Management Views
- **customer_management**: Comprehensive customer view
- **customer_overview**: Dashboard-ready customer data with metrics
- **staff_workload**: Staff assignment and workload tracking
- **daily_submission_report**: Performance analytics

## 🗄️ Database Schema

### Core Tables

#### `customers` (Enhanced)
```sql
-- New columns added to existing table:
customer_id VARCHAR(20) NOT NULL UNIQUE,  -- Auto-generated DIR-YYYYMMDD-XXXXXX
first_name VARCHAR(255),
last_name VARCHAR(255),
package_type VARCHAR(50) DEFAULT 'basic',
submission_status VARCHAR(50) DEFAULT 'pending',
business_name VARCHAR(255),
phone VARCHAR(20),
website VARCHAR(500),
industry VARCHAR(100),
address TEXT,
city VARCHAR(100),
state VARCHAR(100),
country VARCHAR(100),
zip_code VARCHAR(20),
business_description TEXT,
target_keywords TEXT,
logo_url VARCHAR(500),
submission_results JSONB DEFAULT '{}',
directory_data JSONB DEFAULT '{}',
notes TEXT,
assigned_staff VARCHAR(255),
estimated_completion_date TIMESTAMP WITH TIME ZONE,
payment_status VARCHAR(50) DEFAULT 'pending',
payment_date TIMESTAMP WITH TIME ZONE,
refund_status VARCHAR(50),
refund_date TIMESTAMP WITH TIME ZONE,
customer_source VARCHAR(100),
referral_code VARCHAR(50)
```

#### `customer_submissions`
Tracks individual directory submissions with:
- Submission status and automation method
- Quality scores and approval tracking
- Staff assignment and review process
- Processing time and retry logic

#### `customer_progress`
Project-level progress tracking:
- Completion percentages and metrics
- Milestone and timeline management
- Team assignment and communication schedules
- Quality and approval rates

#### `customer_communications`
All customer interactions:
- Email, phone, chat, and internal notes
- Automated vs manual communications
- Response tracking and follow-ups
- Thread and message organization

#### `customer_payments`
Complete payment history:
- Stripe integration fields
- Payment methods and statuses
- Refund tracking and billing periods
- Invoice and receipt management

## 🔧 Functions & Triggers

### Customer ID Generation
```sql
-- Generate unique customer ID
SELECT generate_customer_id();
-- Returns: DIR-20250918-000001

-- Automatically triggered on INSERT
INSERT INTO customers (email, first_name, last_name) 
VALUES ('test@example.com', 'John', 'Doe');
-- customer_id is automatically generated
```

### Automatic Updates
- `updated_at` timestamps automatically maintained
- Customer progress automatically calculated from submissions
- Name splitting (full_name ↔ first_name/last_name)
- Billing period and credit management

## 📊 Key Views

### Customer Management Dashboard
```sql
SELECT * FROM customer_management 
WHERE assigned_staff = 'john@company.com';
```

### Customer Overview with Metrics
```sql
SELECT 
    customer_id,
    first_name,
    last_name,
    completion_percentage,
    directories_submitted,
    approval_rate
FROM customer_overview 
ORDER BY completion_percentage DESC;
```

### Staff Workload
```sql
SELECT * FROM staff_workload 
ORDER BY active_customers DESC;
```

## 🔐 Environment Configuration

Ensure your `.env.local` has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testing

### Verification Script
```bash
# Verify all components are working
node scripts/verify-database-setup.js
```

### Manual Tests
```sql
-- Test customer ID generation
SELECT generate_customer_id();

-- Create test customer
INSERT INTO customers (email, first_name, last_name, business_name)
VALUES ('test@example.com', 'Test', 'User', 'Test Corp');

-- Verify auto-generated customer_id
SELECT customer_id, first_name, last_name FROM customers 
WHERE email = 'test@example.com';
```

## 📈 Usage Examples

### Creating a New Customer
```javascript
const { data, error } = await supabase
  .from('customers')
  .insert({
    email: 'customer@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    business_name: 'Smith Enterprises',
    package_type: 'pro',
    industry: 'Technology',
    phone: '+1-555-123-4567',
    website: 'https://smithenterprises.com'
  })
  .select('customer_id, email, first_name, last_name')
  .single();

// customer_id will be automatically generated (e.g., DIR-20250918-000001)
```

### Tracking Submission Progress
```javascript
// Add a submission
await supabase.from('customer_submissions').insert({
  customer_id: 'customer-uuid',
  directory_name: 'Google My Business',
  status: 'submitted',
  automation_method: 'api',
  quality_score: 9
});

// Progress is automatically updated via triggers
// Check progress
const { data } = await supabase
  .from('customer_progress')
  .select('completion_percentage, directories_submitted, approval_rate')
  .eq('customer_id', 'customer-uuid')
  .single();
```

### Real-time Subscriptions
```javascript
// Subscribe to customer changes
const subscription = supabase
  .channel('customer-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'customers'
  }, (payload) => {
    console.log('Customer updated:', payload);
  })
  .subscribe();
```

## 🔍 Monitoring & Analytics

### Performance Metrics
- Customer acquisition and conversion rates
- Submission success and approval rates
- Processing times and bottlenecks
- Staff workload distribution

### Quality Tracking
- Submission quality scores
- Directory approval rates
- Customer satisfaction metrics
- Service delivery timelines

## 🚀 Next Steps

1. **Integration**: Connect your app to the new schema
2. **Real-time Features**: Implement Supabase subscriptions for live updates
3. **Google Sheets Sync**: Set up bidirectional sync if needed
4. **Automation**: Connect submission workflow to the tracking system
5. **Analytics**: Build dashboards using the provided views
6. **Notifications**: Set up automated customer communications

## 🛠️ Troubleshooting

### Common Issues

1. **Customer ID not generating**
   - Verify the trigger is created: `\d+ customers` in SQL editor
   - Check sequence exists: `SELECT * FROM customer_id_sequence;`

2. **Views not working**
   - Ensure all tables are created successfully
   - Check for any foreign key constraint errors

3. **Permission errors**
   - Verify you're using the service role key for admin operations
   - Check RLS policies if enabled

### Logs and Debugging
- Check Supabase logs in the dashboard
- Use `SELECT * FROM pg_stat_activity;` to see active queries
- Monitor slow queries with `pg_stat_statements`

## 📝 Schema Files

- `supabase-setup.sql` - Complete schema setup (execute in Supabase SQL Editor)
- `scripts/verify-database-setup.js` - Verification and testing script
- `migrations/016_add_customer_id_generation.sql` - Customer ID system migration
- `migrations/017_create_customer_support_tables.sql` - Supporting tables migration

---

**✅ Setup complete!** Your DirectoryBolt database is ready for comprehensive customer management with auto-generating IDs and real-time tracking.