# DirectoryBolt Customer Journey & Process Documentation

## COMPLETE CUSTOMER SIGNUP-TO-DIRECTORY-SUBMISSION PROCESS

### Phase 1: Customer Signup & Payment

#### 1.1 Website Visit & Analysis
1. **Customer visits directorybolt.com**
2. **AI Analysis Request**: Customer enters website URL for analysis
3. **Analysis Processing**: 
   - AI scrapes website content
   - Identifies business type, industry, target market
   - Generates personalized directory recommendations
4. **Analysis Results**: Customer sees their business insights and directory opportunities

#### 1.2 Package Selection & Payment
1. **Package Selection**: Customer chooses from:
   - **Starter**: 50 directories ($197)
   - **Growth**: 100 directories ($297) 
   - **Professional**: 200 directories ($497)
   - **Enterprise**: Custom pricing
2. **Stripe Checkout**: Customer proceeds to secure payment via Stripe
3. **Payment Processing**: Stripe handles payment securely
4. **Webhook Processing**: Stripe webhook triggers post-payment processing

### Phase 2: Customer Record Creation

#### 2.1 Airtable Record Creation
**AUTOMATED PROCESS:**
```
When Stripe payment succeeds:
├── Webhook receives payment confirmation
├── Creates Airtable record with customer data:
│   ├── Customer ID: DIR-2025-XXXXXX (auto-generated)
│   ├── Business Name, Email, Website
│   ├── Package Type & Directory Limit
│   ├── Payment Details (Stripe Customer ID)
│   ├── Status: "pending"
│   └── Purchase Date/Time
└── Customer receives confirmation email
```

#### 2.2 Queue Entry
- **Customer automatically enters processing queue**
- **Priority assigned based on package type:**
  - Enterprise: Priority 150+
  - Professional: Priority 100-149
  - Growth: Priority 50-99  
  - Starter: Priority 1-49

### Phase 3: AutoBolt Processing

#### 3.1 Queue Processing
**AUTOMATED SYSTEM:**
```
AutoBolt Extension monitors queue:
├── Fetches pending customers from Airtable
├── Processes customers by priority (highest first)
├── Updates status to "in-progress"
└── Begins directory submissions
```

#### 3.2 Directory Submission Process
**FOR EACH CUSTOMER:**
```
AutoBolt Extension:
├── Loads customer's business information
├── Identifies relevant directories from master list
├── Automatically fills out directory submission forms
├── Handles captchas and form variations
├── Tracks submission success/failure
├── Updates progress in Airtable
└── Moves to next directory
```

#### 3.3 Manual Intervention Points
**WHEN AUTOMATION FAILS:**
- **Staff Dashboard Alert**: Failed submissions trigger alerts
- **Manual Review**: Staff reviews problematic directories  
- **Manual Submission**: Staff manually submits where needed
- **Status Update**: Staff updates customer status

### Phase 4: Communication & Completion

#### 4.1 Progress Updates (PLANNED)
- **Email notifications** at 25%, 50%, 75%, and 100% completion
- **Customer portal** for real-time progress tracking
- **Issue notifications** if manual intervention required

#### 4.2 Completion Process
```
When all directories processed:
├── Status updated to "completed" 
├── Final report generated
├── Completion email sent to customer
├── Directory submission report provided
└── Customer moved to "completed" queue
```

## CURRENT MANUAL WORK REQUIRED

### Staff Dashboard Tasks

#### Daily Operations
1. **Queue Monitoring**: 
   - Review pending customer queue
   - Monitor processing progress
   - Identify stuck/failed submissions

2. **Manual Interventions**:
   - Handle directories that failed automation
   - Resolve captcha challenges  
   - Complete forms with unusual layouts
   - Contact directories requiring phone verification

3. **Quality Assurance**:
   - Verify submission confirmations
   - Check directory approval status
   - Update customer records with results

### Admin Dashboard Tasks

#### System Management
1. **User Management**: Create staff accounts, manage permissions
2. **System Monitoring**: Check API health, database connections  
3. **Configuration**: Update directory lists, modify processing rules
4. **Analytics**: Review success rates, processing times, revenue metrics

## EMAIL AUTOMATION SYSTEM

### Current Email Types
1. **Payment Confirmation**: Sent immediately after successful payment
2. **Processing Started**: Sent when customer enters queue (24-48hr delay)
3. **Progress Updates**: Sent at milestone percentages (IN DEVELOPMENT)
4. **Completion Notice**: Sent when all directories submitted
5. **Issue Notifications**: Sent if manual intervention needed

### Email Configuration
- **Service**: Powered by Stripe customer emails and Airtable automation
- **Templates**: Stored in email service (Mailchimp/SendGrid integration planned)
- **Triggers**: Webhook-based and status change triggers

## TECHNICAL INTEGRATION POINTS

### Database Flow
```
Customer Payment 
↓
Stripe Webhook
↓  
Airtable Record Creation
↓
AutoBolt Queue Processing
↓
Directory Submissions
↓
Status Updates
↓
Completion Notification
```

### API Endpoints Used
- `/api/extension/validate`: Authenticates AutoBolt extension
- `/api/autobolt/queue-status`: Provides queue statistics
- `/api/autobolt/pending-customers`: Lists customers to process
- `/api/staff/auth-check`: Authenticates staff dashboard access
- `/api/admin/auth-check`: Authenticates admin dashboard access

### Security & Access Control
- **Admin Dashboard**: Requires authentication (API key, session, or basic auth)
- **Staff Dashboard**: Requires staff-level authentication  
- **AutoBolt Extension**: Customer ID validation required
- **API Endpoints**: Rate limiting and IP restriction implemented

## EMERGENCY PROCEDURES

### When System Fails
1. **Manual Processing**: Staff can manually submit directories
2. **Customer Communication**: Direct email to affected customers
3. **Backup Queue**: Alternative processing method available
4. **Refund Process**: Stripe refund capability for unresolved issues

### Monitoring & Alerts
- **Queue Depth Monitoring**: Alerts if queue exceeds normal levels
- **Failed Submission Tracking**: Automatic alerts for high failure rates  
- **System Health Checks**: API endpoint monitoring every 5 minutes
- **Database Connection Monitoring**: Airtable connectivity verification

---

**Last Updated**: September 11, 2025  
**Document Version**: 1.0  
**Next Review**: Monthly or after major system changes