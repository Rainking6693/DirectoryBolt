# AutoBolt Enhanced Airtable Schema & Backend System

## Overview

This backend system transforms AutoBolt from a simple directory submission tool into a scalable customer service platform with advanced queue management, package-based processing, and comprehensive tracking capabilities.

## Architecture Components

### 1. Enhanced Airtable Schema (`airtable-schema-enhancement.js`)
Defines a comprehensive 6-table schema with advanced relationships and business logic:

- **Customers**: Complete customer profiles with package tracking
- **Packages**: Flexible package configurations with pricing tiers
- **Queue**: Priority-based processing queue with status management  
- **Submissions**: Individual directory submission tracking
- **Directories**: Enhanced master directory registry
- **ProcessingLogs**: Comprehensive audit trail and error logging

### 2. Queue Management System (`airtable-queue-manager.js`)
Intelligent processing engine with priority-based routing:

- **Priority Processing**: Enterprise customers processed first
- **Capacity Management**: Concurrent processing limits by package
- **Error Handling**: Automatic retries with exponential backoff
- **Performance Monitoring**: Real-time metrics and analytics
- **Package-Based SLA**: Different processing speeds per tier

### 3. API Integration Layer (`airtable-api-integration.js`)
RESTful API server for DirectoryBolt website integration:

- **Customer Registration**: Secure onboarding endpoints
- **Queue Submission**: Business data collection and validation
- **Status Tracking**: Real-time progress monitoring
- **Webhook Support**: Directory response handling
- **Authentication**: JWT-based security with role permissions

### 4. Package Configuration Manager (`package-configuration.js`)
Advanced package and customer tier management:

- **Dynamic Pricing**: Monthly/annual billing with prorations
- **Feature Access Control**: Package-based feature permissions
- **Usage Tracking**: Directory allocation and consumption monitoring
- **Upgrade/Downgrade**: Seamless package transitions
- **Tier Comparison**: Feature matrix generation

### 5. Data Migration System (`data-migration-scripts.js`)
Comprehensive migration toolkit with safety features:

- **Backup Creation**: Automatic data backups before migration
- **Schema Validation**: Verify table structures and relationships
- **Batch Processing**: Large dataset migration with progress tracking
- **Rollback Support**: Automatic rollback on migration failures
- **Data Transformation**: Legacy data conversion to new schema

### 6. Testing & Validation Suite (`testing-validation-suite.js`)
Complete testing framework ensuring system reliability:

- **Schema Tests**: Table structure and relationship validation
- **API Tests**: Endpoint functionality and response validation
- **Integration Tests**: End-to-end workflow verification
- **Performance Tests**: Response time and memory usage monitoring
- **Migration Tests**: Data transformation and integrity validation

## Package Tiers & Features

### Starter Package ($29.99/month)
- 50 Directory Submissions
- Standard Processing (5-7 days)
- Email Support
- Basic Reporting
- Core Directory Network

### Growth Package ($79.99/month)
- 200 Directory Submissions
- Priority Processing (3-5 days)
- Priority Support
- Advanced Reporting & Analytics
- Extended Directory Network

### Professional Package ($149.99/month)
- 500 Directory Submissions
- Rush Processing (1-2 days)
- Phone Support
- Premium Analytics
- API Access
- Dedicated Account Manager

### Enterprise Package ($299.99/month)
- Unlimited Directory Submissions
- White-glove Processing (Same day)
- Dedicated Support Team
- Enterprise Reporting Suite
- Custom Integrations
- SLA Guarantees
- Monthly Strategy Calls

## API Endpoints

### Public Endpoints
- `POST /api/customers/register` - Customer registration
- `POST /api/queue/submit` - Queue submission
- `GET /api/packages` - Available packages

### Protected Endpoints (JWT Required)
- `GET /api/protected/customers/:id` - Customer details
- `GET /api/protected/queue/:customerId` - Customer queue status
- `GET /api/protected/submissions/:customerId` - Submission history

### Admin Endpoints (API Key Required)
- `GET /api/admin/queue` - All queue entries
- `GET /api/admin/analytics` - System analytics
- `GET /api/admin/logs` - Processing logs

### Webhooks
- `POST /api/webhooks/directory-response` - Directory status updates

## Installation & Setup

### Prerequisites
```bash
npm install express cors helmet jsonwebtoken bcrypt uuid
```

### Environment Variables
```bash
AIRTABLE_API_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=your_base_id
JWT_SECRET=your_jwt_secret
ADMIN_API_KEY=your_admin_api_key
NODE_ENV=production
PORT=3000
```

### Initialize System
```bash
# Run data migration
node backend/data-migration-scripts.js

# Run tests
node backend/testing-validation-suite.js

# Start API server
node backend/server.js
```

## Usage Examples

### Customer Registration
```javascript
const customerData = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@smithplumbing.com',
    businessName: 'Smith Plumbing Services',
    businessWebsite: 'https://smithplumbing.com',
    packageType: 'Professional'
};

const response = await fetch('/api/customers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData)
});
```

### Queue Submission
```javascript
const queueData = {
    customerId: 'customer-uuid',
    businessName: 'Smith Plumbing Services',
    businessWebsite: 'https://smithplumbing.com',
    businessEmail: 'info@smithplumbing.com',
    selectedDirectories: ['dir1', 'dir2', 'dir3']
};

const response = await fetch('/api/queue/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queueData)
});
```

### Status Monitoring
```javascript
const response = await fetch(`/api/protected/queue/${customerId}`, {
    headers: { 
        'Authorization': `Bearer ${jwt_token}` 
    }
});

const queueStatus = await response.json();
```

## Queue Processing Logic

### Priority Calculation
```javascript
priority_score = package_tier_priority + time_waiting_factor
// Enterprise = 1, Professional = 2, Growth = 3, Starter = 4
```

### Processing Flow
1. **Queue Monitoring** - Continuous monitoring every 30 seconds
2. **Priority Sorting** - Sort by package tier and submission time
3. **Capacity Check** - Verify available processing slots
4. **Batch Processing** - Process entries based on package limits
5. **Status Updates** - Real-time status and progress tracking
6. **Error Handling** - Automatic retries and failure notifications

## Data Schema Relationships

```
Customers ──┬── Queue (1:many)
            ├── Submissions (1:many)
            └── ProcessingLogs (1:many)

Packages ──── Queue (1:many)

Queue ──── Submissions (1:many)

Directories ──── Submissions (1:many)
```

## Monitoring & Analytics

### Key Metrics
- **Processing Performance**: Average processing time by package tier
- **Success Rates**: Submission success rates by directory
- **Customer Metrics**: Usage patterns and tier distribution
- **System Health**: Error rates and processing capacity

### Logging Levels
- **INFO**: Normal operations and status updates
- **WARNING**: Non-critical issues requiring attention  
- **ERROR**: Critical failures requiring immediate action
- **DEBUG**: Detailed troubleshooting information
- **SUCCESS**: Successful operations and completions

## Security Features

### Authentication
- JWT tokens with 30-day expiration
- Admin API key validation
- Rate limiting (100 requests per 15 minutes)
- CORS protection with whitelist

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- Secure error messages (no sensitive data exposure)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Queue processor instances
- Load balancer compatibility
- Distributed logging support

### Performance Optimization
- Connection pooling
- Request batching
- Caching layer support
- Background job processing

## Deployment Architecture

### Production Stack
```
Load Balancer
    ↓
API Servers (Multiple instances)
    ↓
Queue Processors (Multiple instances)
    ↓
Airtable Database
```

### Development Stack
```
Local API Server
    ↓
Local Queue Processor
    ↓
Airtable Database (Shared/Test base)
```

## Error Handling Strategy

### Automatic Recovery
- **Submission Failures**: Automatic retry with backoff
- **API Errors**: Circuit breaker pattern
- **Queue Stalls**: Automatic processor restart
- **Data Corruption**: Rollback to last known good state

### Manual Intervention
- **Customer Issues**: Support ticket integration
- **Directory Problems**: Manual verification workflow
- **System Failures**: Alert notification system

## Future Enhancements

### Phase 2 Features
- **Chrome Extension API**: Direct extension integration
- **Webhook System**: Real-time directory notifications
- **Advanced Analytics**: Predictive processing insights
- **Multi-tenant Support**: Agency customer management

### Phase 3 Features
- **Machine Learning**: Success rate optimization
- **Custom Integrations**: CRM and marketing tool connections
- **White-label Solution**: Reseller program support
- **Mobile Applications**: iOS and Android companion apps

## Support & Maintenance

### Regular Tasks
- **Database Cleanup**: Archive old logs and submissions
- **Performance Monitoring**: Track and optimize slow queries
- **Security Updates**: Regular dependency updates
- **Backup Verification**: Test backup and restore procedures

### Troubleshooting
- Check processing logs for error patterns
- Verify Airtable API limits and quotas
- Monitor queue processing capacity
- Validate customer package allocations

For technical support or feature requests, contact the AutoBolt development team.