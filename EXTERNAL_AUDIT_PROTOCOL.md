# DirectoryBolt External Audit Protocol

🚨 **SECURITY WARNING - DO NOT DISTRIBUTE** 🚨
═══════════════════════════════════════════════════════════════
This document contains EXPOSED CREDENTIALS and is NOT SAFE for external distribution.
Use EXTERNAL_AUDIT_PROTOCOL_SECURE.md for external auditors.
Contact security@directorybolt.com for secure credential distribution.
═══════════════════════════════════════════════════════════════

**Version:** 1.0 (INSECURE - INTERNAL ONLY)  
**Date:** September 22, 2025  
**Status:** ⚠️ CONTAINS EXPOSED CREDENTIALS - NOT FOR EXTERNAL USE  
**Secure Version:** Use EXTERNAL_AUDIT_PROTOCOL_SECURE.md instead  
**Purpose:** Comprehensive validation protocol for external auditors to verify DirectoryBolt job queue implementation end-to-end

## Executive Summary

This protocol provides external auditors with step-by-step procedures to validate the complete DirectoryBolt system implementation across all 5 phases:

1. **Phase 1:** Backend APIs and Job Queue
2. **Phase 2:** Staff Dashboard and Monitoring
3. **Phase 3:** AutoBolt Chrome Extension
4. **Phase 4:** Testing Framework and Validation
5. **Phase 5:** End-to-End Integration and Customer Journey

The system serves customers across pricing tiers from free ($0) to premium ($149-799) with enterprise-grade performance and security standards.

---

## Prerequisites

### Required Tools
- **Node.js 18+** and npm
- **Chrome Browser** (latest version)
- **Postman** or equivalent API testing tool
- **Command line access** to run test scripts
- **Valid Stripe test API keys** (provided separately)

### Environment Setup
```bash
# Clone repository
git clone [repository-url]
cd DirectoryBolt

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server (separate terminal)
PORT=8082 NODE_ENV=production npm run start
```

### Test Data Requirements
- Test business information for form submissions
- Valid email addresses for notifications
- Chrome extension test user accounts

---

## Phase 1: Backend APIs and Job Queue Validation

### 1.1 Core API Endpoints Testing

#### Health Check Validation
```bash
# Test basic health endpoint
curl -X GET http://localhost:3000/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-22T...",
  "services": {
    "database": "connected",
    "ai": "operational"
  }
}
```
**Pass Criteria:** Status 200, all services operational

#### System Status Validation
```bash
# Test system status (public endpoint)
curl -X GET http://localhost:3000/api/system-status
```
**Expected Response:**
```json
{
  "status": "operational",
  "uptime": "99.9%",
  "activeJobs": 0,
  "queueHealth": "healthy"
}
```
**Pass Criteria:** Status 200, no sensitive data exposed

#### Website Analysis API
```bash
# Test analysis endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "tier": "free"}'
```
**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "domain": "example.com",
    "title": "...",
    "description": "...",
    "categories": [...],
    "recommendations": [...]
  },
  "processingTime": "<2000ms"
}
```
**Pass Criteria:** Status 200, analysis completed within 2 seconds

### 1.2 Job Queue Operations

#### Queue Status Check
```bash
# Check queue operations
curl -X GET http://localhost:3000/api/queue \
  -H "x-staff-key: [STAFF_API_KEY]"
```
**Expected Response:**
```json
{
  "queueStatus": "active",
  "pendingJobs": 0,
  "processingJobs": 0,
  "completedJobs": 0,
  "averageProcessingTime": "30s"
}
```
**Pass Criteria:** Status 200, queue operational

#### Customer Job Creation
```bash
# Create test customer job
curl -X POST http://localhost:3000/api/queue/batch \
  -H "Content-Type: application/json" \
  -H "x-staff-key: [STAFF_API_KEY]" \
  -d '{
    "customerId": "test-audit-customer",
    "businessData": {
      "name": "Test Business LLC",
      "email": "test@audit.com",
      "phone": "555-123-4567",
      "website": "https://testbusiness.com"
    },
    "selectedDirectories": ["yelp", "google-business"]
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "jobId": "job_...",
  "status": "queued",
  "estimatedCompletion": "2025-09-22T..."
}
```
**Pass Criteria:** Status 201, job created successfully

### 1.3 AutoBolt Integration APIs

#### AutoBolt Queue Status
```bash
# Check AutoBolt queue
curl -X GET http://localhost:3000/api/autobolt/queue-status \
  -H "x-staff-key: [STAFF_API_KEY]"
```
**Expected Response:**
```json
{
  "queueStatus": "operational",
  "pendingCustomers": 0,
  "processingCustomers": 0,
  "averageProcessingTime": "45s"
}
```
**Pass Criteria:** Status 200, AutoBolt integration active

---

## Phase 2: Staff Dashboard and Monitoring Validation

### 2.1 Staff Authentication

#### Access Staff Dashboard
1. Navigate to `http://localhost:3000/staff-dashboard`
2. Should redirect to `http://localhost:3000/staff-login`
3. Enter credentials:
   - Username: `staff`
   - Password: `DirectoryBoltStaff2025!`

**Pass Criteria:** Successful login and redirect to dashboard

#### Staff API Authentication
```bash
# Test staff API access
curl -X GET http://localhost:3000/api/staff/auth-check \
  -H "x-staff-key: [STAFF_API_KEY]"
```
**Expected Response:**
```json
{
  "authenticated": true,
  "user": {
    "username": "staff",
    "role": "administrator"
  }
}
```
**Pass Criteria:** Status 200, authentication confirmed

### 2.2 Real-Time Monitoring

#### Queue Monitoring Dashboard
1. Access `http://localhost:3000/staff-dashboard`
2. Navigate to "Queue" tab
3. Verify real-time updates display:
   - Active jobs count
   - Processing status
   - Completion rates
   - Error logs

**Pass Criteria:** Live data updates every 5 seconds

#### Analytics Dashboard
1. Navigate to "Analytics" tab
2. Verify metrics display:
   - Customer acquisition rates
   - Revenue tracking
   - Performance metrics
   - Usage statistics

**Pass Criteria:** All metrics load within 3 seconds

### 2.3 Job Management

#### Job Progress Monitoring
```bash
# Test job progress API
curl -X GET http://localhost:3000/api/staff/jobs/progress \
  -H "x-staff-key: [STAFF_API_KEY]"
```
**Expected Response:**
```json
{
  "activeJobs": [
    {
      "jobId": "job_...",
      "customerId": "test-audit-customer",
      "status": "processing",
      "progress": 45,
      "estimatedCompletion": "2025-09-22T..."
    }
  ]
}
```
**Pass Criteria:** Status 200, job tracking functional

---

## Phase 3: AutoBolt Chrome Extension Validation

### 3.1 Extension Installation

#### Chrome Extension Setup
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Load unpacked extension from `/public/autobolt-extension/`
4. Verify extension appears in toolbar

**Pass Criteria:** Extension loads without errors

#### Extension Authentication
1. Click extension icon
2. Enter customer credentials or API key
3. Verify connection to DirectoryBolt backend

**Pass Criteria:** Authentication successful, backend connection established

### 3.2 Directory Automation Testing

#### Automated Form Population
1. Navigate to a test directory website (e.g., Yelp business registration)
2. Click "Start AutoBolt" in extension popup
3. Verify business data auto-population:
   - Business name fills correctly
   - Contact information populates
   - Description auto-generates
   - Categories select appropriately

**Pass Criteria:** 90%+ form fields populate correctly

#### Submission Processing
1. Complete automated form population
2. Verify submission confirmation
3. Check job status updates in real-time
4. Confirm success/failure reporting

**Pass Criteria:** Submission completes within 60 seconds, status updates correctly

### 3.3 Extension API Integration

#### Customer Status API
```bash
# Test customer status from extension
curl -X GET http://localhost:3000/api/autobolt/customer-status/[CUSTOMER_ID] \
  -H "x-api-key: [CUSTOMER_API_KEY]"
```
**Expected Response:**
```json
{
  "customerId": "test-audit-customer",
  "status": "active",
  "currentJob": {
    "jobId": "job_...",
    "progress": 75,
    "currentDirectory": "yelp"
  },
  "completedSubmissions": 12,
  "remainingCredits": 38
}
```
**Pass Criteria:** Status 200, accurate customer data

---

## Phase 4: Testing Framework Validation

### 4.1 Automated Test Suite Execution

#### Run Core Test Suites
```bash
# Execute comprehensive test suite
npm run test:enterprise

# Run performance benchmarks
npm run test:performance-benchmarks

# Execute critical revenue flow tests
npm run test:critical

# Run edge case validation
npm run test:edge-cases
```

**Pass Criteria:** All test suites pass with >95% success rate

#### Load Testing Validation
```bash
# Execute production load tests
node scripts/production-load-test.js
```
**Expected Output:**
```
📈 LOAD TEST RESULTS
==================
Total Requests: 50
Successful: 47
Failed: 3
Success Rate: 94.00%
🎯 OVERALL GRADE: A (85/100)
Production Readiness: PRODUCTION READY
```
**Pass Criteria:** Grade B+ or higher (score ≥80)

### 4.2 End-to-End Integration Testing

#### E2E Automation Suite
```bash
# Run E2E automation tests
node e2e-automation-test.js
```
**Expected Output:**
```
✅ E2E Test Report Generated
✅ Success Rate: 100%
⏱️ Total Duration: 45 seconds
📊 Directory Analysis: 250 processable directories
```
**Pass Criteria:** 100% test phase success, all validations pass

#### Customer Journey Testing
```bash
# Execute complete customer journey test
npm run test:user-journey
```
**Pass Criteria:** Full customer flow completes successfully from registration to submission

---

## Phase 5: Payment Processing and Customer Journey

### 5.1 Stripe Integration Validation

#### Stripe Webhook Testing
```bash
# Test Stripe webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/stripe-secure \
  -H "Content-Type: application/json" \
  -H "stripe-signature: [TEST_SIGNATURE]" \
  -d '[STRIPE_TEST_PAYLOAD]'
```
**Expected Response:**
```json
{
  "received": true,
  "processed": true,
  "customerId": "cus_...",
  "status": "subscription_active"
}
```
**Pass Criteria:** Status 200, webhook processed correctly

#### Payment Flow Testing
```bash
# Test checkout session creation
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_premium_149",
    "customerId": "test-audit-customer"
  }'
```
**Expected Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/...",
  "expires": "2025-09-22T..."
}
```
**Pass Criteria:** Status 200, valid checkout URL generated

### 5.2 Pricing Tier Validation

#### Free Tier Limits ($0)
1. Create free tier customer
2. Verify 10 submission limit
3. Test rate limiting (1 request per 5 seconds)
4. Confirm basic feature access

**Pass Criteria:** Limits enforced correctly

#### Starter Tier ($149)
1. Process Stripe payment for starter tier
2. Verify 50 submission limit
3. Test medium priority processing
4. Confirm enhanced features access

**Pass Criteria:** Upgrade processed, limits updated

#### Professional Tier ($299)
1. Process payment for professional tier
2. Verify 150 submission limit
3. Test high priority processing
4. Confirm advanced analytics access

**Pass Criteria:** All professional features accessible

#### Enterprise Tier ($799)
1. Process payment for enterprise tier
2. Verify unlimited submissions
3. Test dedicated processing queue
4. Confirm white-label options

**Pass Criteria:** Enterprise features fully functional

### 5.3 Customer Journey Validation

#### Complete Customer Flow
1. **Registration:** New customer signs up
2. **Free Trial:** Use free tier (10 submissions)
3. **Upgrade:** Purchase starter plan ($149)
4. **Service Usage:** Submit 25 directories via AutoBolt
5. **Support:** Contact customer service
6. **Renewal:** Process subscription renewal

**Pass Criteria:** Each step completes successfully with proper tracking

---

## Security Validation

### 6.1 API Security Testing

#### Rate Limiting Validation
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}' &
done
```
**Expected:** 429 status codes after limit exceeded
**Pass Criteria:** Rate limiting active and enforced

#### Authentication Security
```bash
# Test unauthorized access
curl -X GET http://localhost:3000/api/staff/jobs/progress
```
**Expected Response:** 401 Unauthorized
**Pass Criteria:** Protected endpoints require authentication

#### API Key Management
```bash
# Test invalid API key
curl -X GET http://localhost:3000/api/autobolt/queue-status \
  -H "x-staff-key: invalid-key"
```
**Expected Response:** 403 Forbidden
**Pass Criteria:** Invalid keys rejected

### 6.2 Data Protection Validation

#### PII Protection
1. Verify customer data encryption in database
2. Test data retention policies
3. Confirm GDPR compliance features
4. Validate secure data transmission (HTTPS)

**Pass Criteria:** All customer data properly protected

#### Input Sanitization
```bash
# Test XSS protection
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "<script>alert(\"xss\")</script>"}'
```
**Expected:** Input sanitized, no script execution
**Pass Criteria:** XSS attempts blocked

---

## Performance Benchmarks

### 7.1 Response Time Requirements

| Endpoint | Requirement | Test Command |
|----------|-------------|--------------|
| Health Check | <100ms | `curl -w "@curl-format.txt" http://localhost:3000/api/health` |
| Website Analysis | <2000ms | Time analysis API response |
| Queue Operations | <500ms | Measure queue API responses |
| Staff Dashboard | <1000ms | Page load time measurement |

### 7.2 Throughput Testing

#### Concurrent User Testing
```bash
# Load test with concurrent users
node scripts/production-load-test.js
```
**Requirements:**
- Support 50+ concurrent users
- 95% success rate under load
- P99 response time <2000ms

**Pass Criteria:** All performance requirements met

### 7.3 Resource Usage Monitoring

#### Memory and CPU Usage
1. Monitor during load testing
2. Verify no memory leaks
3. Check CPU utilization stays <80%
4. Confirm database connection pooling

**Pass Criteria:** Resource usage within acceptable limits

---

## Database and Queue Validation

### 8.1 Database Operations

#### Connection Testing
```bash
# Test Supabase connection
curl -X GET http://localhost:3000/api/health/supabase
```
**Expected Response:**
```json
{
  "status": "connected",
  "database": "online",
  "latency": "<50ms"
}
```
**Pass Criteria:** Database accessible and responsive

#### Data Integrity
1. Create test customer record
2. Submit job through queue
3. Verify data consistency across tables
4. Test rollback on failures

**Pass Criteria:** ACID properties maintained

### 8.2 Queue Management

#### Job Processing Validation
```bash
# Monitor job processing
curl -X GET http://localhost:3000/api/queue/operations \
  -H "x-staff-key: [STAFF_API_KEY]"
```
**Expected Response:**
```json
{
  "operations": {
    "enqueue": "functional",
    "dequeue": "functional",
    "processing": "active",
    "completion": "tracked"
  }
}
```
**Pass Criteria:** All queue operations functional

#### Error Handling
1. Submit invalid job data
2. Verify error logging
3. Test job retry mechanisms
4. Confirm dead letter queue handling

**Pass Criteria:** Errors handled gracefully with proper logging

---

## Chrome Extension Integration

### 9.1 Extension Functionality

#### Form Detection and Population
1. Navigate to Yelp business registration
2. Activate AutoBolt extension
3. Verify form field detection accuracy
4. Test data population speed and accuracy

**Pass Criteria:** >90% form fields detected and populated correctly

#### Multi-Site Compatibility
Test extension on multiple directory sites:
- Yelp Business
- Google My Business
- Facebook Business
- Yellow Pages
- Better Business Bureau

**Pass Criteria:** Compatible with >80% of target directories

### 9.2 Extension Security

#### Content Script Isolation
1. Verify extension doesn't conflict with site scripts
2. Test CSP compliance
3. Confirm secure communication with backend
4. Validate permission requests

**Pass Criteria:** No security violations or conflicts

---

## Monitoring and Alerting

### 10.1 Real-Time Monitoring

#### Staff Dashboard Monitoring
1. Access real-time queue monitor
2. Verify alert generation for failures
3. Test performance metric tracking
4. Confirm customer status updates

**Pass Criteria:** Real-time data updates with <5 second latency

#### Automated Alerting
```bash
# Test alert system
curl -X POST http://localhost:3000/api/admin/alerts \
  -H "Content-Type: application/json" \
  -H "x-staff-key: [STAFF_API_KEY]" \
  -d '{
    "type": "test_alert",
    "severity": "medium",
    "message": "Audit test alert"
  }'
```
**Expected:** Alert appears in staff dashboard
**Pass Criteria:** Alerts delivered within 30 seconds

### 10.2 System Health Monitoring

#### Uptime Monitoring
1. Verify 99.9% uptime tracking
2. Test failover mechanisms
3. Confirm backup systems activation
4. Validate recovery procedures

**Pass Criteria:** System maintains target uptime

---

## Customer Support Integration

### 11.1 Support Ticket System

#### Ticket Creation
```bash
# Test support ticket API
curl -X POST http://localhost:3000/api/customer/support \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-audit-customer",
    "subject": "Audit test ticket",
    "message": "Test support request",
    "priority": "medium"
  }'
```
**Expected Response:**
```json
{
  "ticketId": "ticket_...",
  "status": "open",
  "assignedTo": "support_team"
}
```
**Pass Criteria:** Ticket created and routed correctly

### 11.2 Customer Communication

#### Email Notifications
1. Trigger job completion notification
2. Verify payment confirmation emails
3. Test support response notifications
4. Confirm subscription renewal reminders

**Pass Criteria:** All notifications delivered within 2 minutes

---

## Final Validation Checklist

### System Integration
- [ ] All APIs respond correctly
- [ ] Database operations complete successfully
- [ ] Queue processing functional
- [ ] Real-time monitoring active
- [ ] Extension integration working
- [ ] Payment processing validated
- [ ] Security measures enforced
- [ ] Performance benchmarks met

### Customer Journey
- [ ] Registration process smooth
- [ ] Free tier functionality verified
- [ ] Upgrade flow functional
- [ ] Service delivery confirmed
- [ ] Support system responsive
- [ ] Billing process accurate

### Technical Requirements
- [ ] Load testing passed (Grade B+ minimum)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database integrity confirmed
- [ ] API documentation accurate
- [ ] Error handling robust

---

## Test Report Generation

### Automated Reporting
```bash
# Generate comprehensive audit report
node scripts/generate-audit-report.js --external-audit

# Run all validation tests
npm run test:all-enterprise

# Generate performance report
node scripts/production-load-test.js > audit-performance-report.txt

# Create security validation report
npm run security-test > audit-security-report.txt
```

### Manual Verification Document
Create a signed verification document including:
1. Test execution timestamps
2. Pass/fail status for each test
3. Performance metrics achieved
4. Security validation results
5. Any identified issues or recommendations
6. Overall system grade and certification

**Final Deliverable:** Comprehensive audit report with external auditor certification

---

## Emergency Contacts

**Technical Support:** support@directorybolt.com  
**Security Team:** security@directorybolt.com  
**Emergency Hotline:** +1-555-BOLT-911

---

## Referenced Test Files

This protocol references the following existing test implementations:

- `scripts/production-load-test.js` - Performance and load testing
- `e2e-automation-test.js` - End-to-end automation validation
- `comprehensive_stripe_checkout_test.js` - Payment processing tests
- `__tests__/integration/critical-revenue-flows.test.ts` - Revenue flow validation
- `__tests__/edge-cases/payment-autobolt-edge-cases.test.ts` - Edge case testing

Execute these files as part of your validation process to ensure comprehensive coverage.

---

**Document Version:** 1.0  
**Last Updated:** September 22, 2025  
**Next Review:** December 22, 2025