# DirectoryBolt.com - Comprehensive Technical Architecture

## Overview

DirectoryBolt.com is a sophisticated business directory submission service built on a modern, scalable architecture leveraging Next.js, Supabase, Stripe, and advanced AI integrations. This document provides a detailed technical process map of all backend systems.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   DirectoryBolt                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js) │  API Layer (Pages/API) │  External Services              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │
│  │   User Portal   │   │  Payment APIs   │   │     Stripe      │              │
│  │   Dashboard     │◄──┤  Webhook Handler│◄──┤   Webhooks      │              │
│  │   Analytics     │   │  Subscription   │   │   Payments      │              │
│  └─────────────────┘   │  Management     │   └─────────────────┘              │
│                        └─────────────────┘                                    │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │
│  │  AI Analysis    │   │  AI Pipeline    │   │    OpenAI       │              │
│  │  Interface      │◄──┤  Business Intel │◄──┤    Anthropic    │              │
│  │  Results        │   │  Competitive    │   │    APIs         │              │
│  └─────────────────┘   │  Analysis       │   └─────────────────┘              │
│                        └─────────────────┘                                    │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │
│  │ Directory Form  │   │ Form Mapping    │   │   Puppeteer     │              │
│  │ Automation      │◄──┤ Engine          │◄──┤   Web Scraping  │              │
│  │ Results         │   │ AutoBolt Queue  │   │   Browser Auto  │              │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           Data Layer & Background Processes                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │
│  │    Supabase     │   │  Google Sheets  │   │   Airtable      │              │
│  │   Database      │◄──┤   Integration   │◄──┤   Legacy Data   │              │
│  │   Real-time     │   │   Customer Mgmt │   │   Migration     │              │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘              │
│                                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │
│  │  Queue Manager  │   │  Background     │   │  Monitoring &   │              │
│  │  Priority Sys   │◄──┤  Scheduler      │◄──┤  Analytics      │              │
│  │  Load Balancer  │   │  SLA Tracking   │   │  Performance    │              │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1. Payment Processing Flow

### 1.1 Stripe Integration Architecture

**Primary Components:**
- `/pages/api/stripe/webhook.ts` - Main webhook handler
- `/pages/api/webhooks/stripe-secure.ts` - Enhanced security webhook
- `/pages/api/payments/webhook.ts` - Payment processing
- `/pages/api/create-checkout-session.ts` - Session creation

**Data Flow:**
1. **Customer Checkout Initiation**
   ```typescript
   User Action → Checkout Session Creation → Stripe Hosted Checkout → Payment Processing
   ```

2. **Webhook Processing Pipeline**
   ```typescript
   Stripe Webhook → Signature Verification → Event Processing → Database Update → Customer Notification
   ```

**Key Event Handlers:**
- `checkout.session.completed` - New customer creation, subscription activation
- `payment_intent.succeeded` - Payment confirmation
- `customer.subscription.updated` - Plan changes, renewals
- `invoice.payment_succeeded` - Recurring payment processing
- `invoice.payment_failed` - Payment failure handling

**Security Measures:**
- Webhook signature verification using `stripe.webhooks.constructEvent()`
- Rate limiting with customizable intervals
- Timeout protection (25-second webhook timeout)
- Security monitoring with anomaly detection
- IP-based access controls

### 1.2 Subscription Management

**Package Tiers:**
```typescript
const PACKAGE_CONFIGS = {
  starter: { directory_limit: 50, priority_level: 4, price: 149 },
  growth: { directory_limit: 150, priority_level: 3, price: 299 },
  professional: { directory_limit: 300, priority_level: 2, price: 499 },
  enterprise: { directory_limit: 500, priority_level: 1, price: 799 }
}
```

**Streamlined Customer Lifecycle:**
1. **Pricing Selection** → Customer selects package and enters email only
2. **Payment** → Stripe checkout session creation and payment processing
3. **Business Info Collection** → Post-payment detailed information gathering
4. **Registration** → Customer record creation in Supabase with Stripe session data
5. **Activation** → Queue entry for directory processing
6. **Processing** → AutoBolt automation execution
7. **Completion** → Results delivery and analytics

## 2. Streamlined Checkout Architecture

### 2.1 Payment-First Flow Design

**Core Philosophy:**
- Minimize friction by collecting only email before payment
- Business information collected after payment commitment
- Higher conversion rates through reduced form abandonment

**Component Architecture:**
```typescript
// StreamlinedCheckout Component
interface StreamlinedCheckoutProps {
  plan: 'starter' | 'growth' | 'professional' | 'enterprise'
  planName: string
  price: number
  features: string[]
}

// Pricing Configuration
const PLANS = [
  { name: 'Starter', price: 149, directories: 50 },
  { name: 'Growth', price: 299, directories: 150, popular: true },
  { name: 'Professional', price: 499, directories: 300 },
  { name: 'Enterprise', price: 799, directories: 500 }
]
```

### 2.2 Stripe Integration Flow

**Checkout Session Creation:**
```typescript
// /api/stripe/create-checkout-session.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: planName },
      unit_amount: price * 100
    },
    quantity: 1
  }],
  mode: 'payment',
  customer_email: customerEmail,
  success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&collect_info=true`,
  cancel_url: `${origin}/pricing?cancelled=true`,
  metadata: { collect_business_info: 'true' }
})
```

### 2.3 Post-Payment Data Collection

**Business Information Form:**
- Comprehensive business data collection
- Stripe session validation for email retrieval
- Form validation and error handling
- Professional UX with progress indicators

**Registration Pipeline:**
```typescript
// /api/customer/register-complete.ts
async function getCustomerEmailFromSession(sessionId: string): Promise<string> {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session.customer_details?.email || session.customer_email || ''
}
```

### 2.4 Success Page Redirect Logic

**Automatic Flow Management:**
```typescript
// /pages/success.js
useEffect(() => {
  const { session_id, plan, info_collected } = router.query
  
  if (session_id && !info_collected) {
    router.push(`/business-info?session_id=${session_id}&plan=${plan}`)
    return
  }
}, [router.query])
```

## 3. AI Analysis Pipeline

### 3.1 Business Intelligence Engine

**Core Components:**
- `/pages/api/analyze.ts` - Main analysis endpoint
- `/pages/api/ai/business-analysis.ts` - Detailed business profiling
- `/pages/api/ai/competitor-analysis.ts` - Market positioning
- `/pages/api/ai/enhanced-analysis.ts` - Advanced AI features

**Analysis Tiers:**
```typescript
const ANALYSIS_TIERS = {
  free: { maxDirectories: 5, includeAIAnalysis: false },
  starter: { maxDirectories: 100, includeAIAnalysis: true, includeSEOAnalysis: true },
  growth: { maxDirectories: 250, includeCompetitiveAnalysis: true, includeMarketInsights: true },
  professional: { maxDirectories: 400, fullFeatureSet: true },
  enterprise: { maxDirectories: 500, customAnalysis: true }
}
```

### 3.2 AI Service Integration

**Supported AI Providers:**
- **OpenAI GPT-4** - Business analysis, content generation
- **Anthropic Claude** - Competitive analysis, strategic insights
- **Web Scraping** - Puppeteer-based data collection

**Analysis Pipeline:**
1. **URL Validation** → Security checks, domain analysis
2. **Data Collection** → Web scraping, metadata extraction
3. **AI Processing** → Business profiling, competitive analysis
4. **Result Compilation** → Structured response generation
5. **Caching** → Redis/Supabase storage for 30-day retention

**Business Intelligence Output:**
```typescript
interface BusinessIntelligenceResponse {
  businessProfile: {
    name: string
    industry: string
    targetAudience: string[]
    competitiveAdvantages: string[]
  }
  competitiveAnalysis: {
    marketPosition: string
    competitorCount: number
    differentiationOpportunities: string[]
  }
  seoAnalysis: {
    currentScore: number
    improvementAreas: string[]
    keywordOpportunities: string[]
  }
  directoryOpportunities: Directory[]
}
```

### 3.3 Caching and Performance

**Caching Strategy:**
- **Analysis Results** - 30-day retention in Supabase
- **Directory Listings** - 5-minute TTL with in-memory cache
- **Business Profiles** - Change detection for re-analysis triggers

## 4. Queue Management System

### 4.1 Supabase Data Architecture

**Core Tables:**
```sql
-- Customer Management
customers (
  id UUID PRIMARY KEY,
  customer_id TEXT UNIQUE,
  email TEXT,
  business_name TEXT,
  package_type TEXT,
  status TEXT,
  directories_submitted INTEGER,
  failed_directories INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Queue Management
queue_history (
  id UUID PRIMARY KEY,
  customer_id TEXT,
  status TEXT,
  package_type TEXT,
  directories_allocated INTEGER,
  directories_processed INTEGER,
  priority_level INTEGER,
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP
)

-- Batch Operations
batch_operations (
  id UUID PRIMARY KEY,
  operation_type TEXT,
  customer_ids TEXT[],
  status TEXT,
  total_customers INTEGER,
  processed_customers INTEGER,
  created_by TEXT,
  created_at TIMESTAMP
)

-- Customer Notifications
customer_notifications (
  id UUID PRIMARY KEY,
  customer_id TEXT,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  read BOOLEAN,
  created_at TIMESTAMP
)

-- Analytics Events
analytics_events (
  id UUID PRIMARY KEY,
  customer_id TEXT,
  event_type TEXT,
  event_name TEXT,
  event_data JSONB,
  created_at TIMESTAMP
)
```

### 4.2 AutoBolt Processing Queue

**Queue API Endpoints:**
- `/pages/api/autobolt/queue.ts` - Queue entry management
- `/pages/api/autobolt/process-queue.ts` - Queue processing
- `/pages/api/autobolt/queue-status.ts` - Status monitoring
- `/pages/api/autobolt/customer-status.ts` - Individual customer tracking

**Priority System:**
```typescript
const TIER_QUEUE_CONFIGS = {
  enterprise: { priority_weight: 1, max_concurrent: 20, rate_limit_per_hour: 1000 },
  professional: { priority_weight: 2, max_concurrent: 8, rate_limit_per_hour: 200 },
  growth: { priority_weight: 3, max_concurrent: 2, rate_limit_per_hour: 50 },
  starter: { priority_weight: 4, max_concurrent: 1, rate_limit_per_hour: 25 }
}
```

### 4.3 Advanced Queue Features

**Load Balancing:**
- Resource allocation by package tier
- Auto-scaling based on queue size and system load
- SLA compliance monitoring with violation alerts

**Processing Windows:**
- Enterprise: 24/7 availability
- Professional: Business hours extended (7am-9pm)
- Growth: Standard business hours (9am-6pm)
- Starter: Off-peak processing (10pm-6am)

## 5. Directory Submission Automation

### 5.1 Dynamic Form Mapping Engine

**Core Component:** `/lib/services/dynamic-form-mapper.ts`

**Mapping Strategies:**
1. **Site-Specific Mappings** - Pre-configured form mappings
2. **Semantic Auto-Mapping** - AI-powered field detection
3. **Pattern Fallbacks** - Common form pattern matching
4. **Manual Mapping Interface** - Human-in-the-loop for complex forms

**Form Mapping Architecture:**
```typescript
interface SiteMapping {
  siteId: string
  siteName: string
  url: string
  submissionUrl: string
  formMappings: { [businessField: string]: string[] }
  submitButton: string
  successIndicators: string[]
  skipConditions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  requiresLogin: boolean
  hasCaptcha: boolean
  verificationStatus: 'verified' | 'needs-testing' | 'broken'
}
```

### 5.2 Batch Processing Workflows

**Processing Methods:**
- **Browser Automation** - Puppeteer-based form filling
- **API Integration** - Direct API submissions where available
- **Hybrid Approach** - Combination of automation and manual intervention

**Success/Failure Tracking:**
- Real-time status updates via Supabase
- Success probability scoring per directory
- Automatic retry logic with exponential backoff
- Failure categorization and reporting

### 5.3 Unmappable Site Logic

**Automatic Detection:**
- CAPTCHA presence detection
- Login requirement identification
- Anti-bot protection recognition
- Rate limiting detection

**Fallback Strategies:**
- Manual submission queue
- Alternative directory suggestions
- Customer notification system

## 6. Data Architecture

### 6.1 Database Schema Design

**Primary Database:** Supabase PostgreSQL

**Key Relationships:**
```sql
-- Customer → Queue History (1:Many)
-- Customer → Notifications (1:Many)
-- Customer → Analytics Events (1:Many)
-- Batch Operations → Customers (Many:Many via customer_ids array)
```

**Indexing Strategy:**
```sql
-- Performance indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_queue_history_customer_id ON queue_history(customer_id);
CREATE INDEX idx_queue_history_status ON queue_history(status);
CREATE INDEX idx_analytics_events_customer_id ON analytics_events(customer_id);
```

### 6.2 External Service Integrations

**Google Sheets Integration:**
- Customer data synchronization
- Legacy Airtable data migration
- Real-time updates via Google Sheets API

**Airtable Legacy Support:**
- Backward compatibility layer
- Data migration utilities
- Dual-write capability during transition

### 6.3 API Endpoint Mapping

**Authentication APIs:**
- `/api/auth/login.ts` - User authentication
- `/api/auth/register.ts` - New user registration
- `/api/auth/refresh-token.ts` - Token refresh

**Customer Management APIs:**
- `/api/customer/register-complete.ts` - Complete registration pipeline with Stripe session integration
- `/api/customer/dashboard-data.ts` - Dashboard information
- `/api/customer/progress.ts` - Submission progress
- `/api/customer/notifications.ts` - Notification management

**Streamlined Checkout APIs:**
- `/api/stripe/create-checkout-session.ts` - Stripe checkout session creation
- `/pages/business-info.tsx` - Post-payment business information collection
- `/pages/success.js` - Payment success page with redirect logic

**Streamlined Checkout Components:**
- `/components/checkout/StreamlinedCheckout.tsx` - Email-only checkout component
- `/components/pricing/StreamlinedPricing.tsx` - 4-tier pricing display
- `/pages/test-streamlined-pricing.tsx` - Test page for streamlined flow

**Analysis APIs:**
- `/api/analyze.ts` - Main analysis endpoint
- `/api/ai/business-analysis.ts` - Business intelligence
- `/api/ai/competitor-analysis.ts` - Market analysis

**Queue Management APIs:**
- `/api/queue/index.ts` - Queue operations
- `/api/queue/status.js` - Status monitoring
- `/api/queue/process.ts` - Processing triggers

**Directory APIs:**
- `/api/directories/index.ts` - Directory listing and management
- `/api/directories/analyze-form.js` - Form analysis
- `/api/directories/seed.ts` - Directory seeding

## 7. Background Processes

### 7.1 Background Scheduler

**Core Component:** `/background-scheduler.js`

**Scheduling Architecture:**
```typescript
class BackgroundScheduler {
  // Package-specific configurations
  packageScheduling: {
    Enterprise: { priority: 1, processingWindow: '24/7', slaMinutes: 15 },
    Professional: { priority: 2, processingWindow: 'business-hours-extended', slaMinutes: 120 },
    Growth: { priority: 3, processingWindow: 'business-hours', slaMinutes: 480 },
    Starter: { priority: 4, processingWindow: 'off-peak', slaMinutes: 960 }
  }
}
```

**Job Queue System:**
- **Urgent Queue** - SLA violations, Enterprise priority
- **High Queue** - Enterprise and Professional packages
- **Medium Queue** - Growth packages
- **Low Queue** - Starter packages

### 7.2 Monitoring and Performance

**Performance Metrics:**
- Job processing throughput
- SLA compliance rates
- Resource utilization tracking
- Error rate monitoring

**Auto-scaling Logic:**
- Dynamic resource allocation based on load
- Automatic scaling up/down based on queue size
- Performance optimization through load balancing

### 7.3 Webhook Processors

**Stripe Webhook Processing:**
- Event validation and signature verification
- Idempotency handling for duplicate events
- Error handling and retry logic
- Real-time customer status updates

**Notification Systems:**
- Email notifications for completion/failures
- Dashboard real-time updates
- SMS notifications for premium customers

## 8. Security and Monitoring

### 8.1 Security Architecture

**API Security:**
- Rate limiting on all endpoints
- JWT token authentication
- Request validation and sanitization
- CORS protection

**Webhook Security:**
- Stripe signature verification
- IP whitelisting for known sources
- Timeout protection
- Anomaly detection and alerting

### 8.2 Error Handling

**Error Recovery:**
- Automatic retry with exponential backoff
- Dead letter queues for failed jobs
- Manual intervention workflows
- Comprehensive error logging

### 8.3 Performance Monitoring

**Metrics Collection:**
- API response times
- Database query performance
- Queue processing rates
- Resource utilization

**Health Checks:**
- `/api/health.ts` - System health endpoint
- `/api/health/supabase.ts` - Database connectivity
- `/api/health/google-sheets.ts` - External service health

## 9. Deployment and Infrastructure

### 9.1 Hosting and CDN

**Platform:** Netlify
- Serverless function deployment
- Automatic SSL/TLS
- Global CDN distribution
- Edge computing capabilities

### 9.2 Environment Configuration

**Environment Variables:**
```bash
# Core Application
BASE_URL=https://directorybolt.com
NEXT_PUBLIC_APP_URL=https://directorybolt.com

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# External Integrations
AIRTABLE_API_TOKEN=pat_your_airtable_token
AIRTABLE_BASE_ID=appYourBaseId
```

## 10. Data Flow Examples

### 10.1 Streamlined Customer Journey

```
1. Customer Visits Site
   ↓
2. Initiates Free Analysis (analyze.ts)
   ↓
3. AI Analysis Pipeline Executes
   ↓
4. Results Displayed with Upgrade Prompt
   ↓
5. Customer Views Streamlined Pricing (/test-streamlined-pricing)
   ↓
6. Customer Selects Package and Enters Email Only
   ↓
7. Stripe Checkout Session Created (create-checkout-session.ts)
   ↓
8. Customer Completes Payment via Stripe
   ↓
9. Success Page Redirects to Business Info Collection (/business-info)
   ↓
10. Customer Completes Business Information Form
    ↓
11. Customer Registration API Processes Data (register-complete.ts)
    ↓
12. Stripe Session Validated for Email Retrieval
    ↓
13. Customer Record Created in Supabase Database
    ↓
14. Queue Entry Added (autobolt/queue.ts)
    ↓
15. Background Scheduler Picks Up Job
    ↓
16. AutoBolt Processing Begins
    ↓
17. Form Mapping Engine Maps Fields
    ↓
18. Directory Submissions Execute
    ↓
19. Results Tracked in Database
    ↓
20. Customer Notified of Completion
```

### 10.2 Error Recovery Flow

```
1. Directory Submission Fails
   ↓
2. Error Categorized and Logged
   ↓
3. Retry Logic Determines Action
   ↓
4. If Retryable: Add to Retry Queue
   ↓
5. If Not Retryable: Mark as Failed
   ↓
6. Customer Notification Sent
   ↓
7. Alternative Directories Suggested
   ↓
8. Manual Review Queue Updated
```

## 11. Performance Characteristics

### 11.1 Scalability Metrics

**Current Capacity:**
- 1000+ concurrent users
- 50+ directories processed per minute
- 99.9% uptime SLA
- <200ms API response times

**Scaling Thresholds:**
- Auto-scale at 80% resource utilization
- Queue size monitoring with alerts
- Database connection pooling
- CDN caching for static assets

### 11.2 Reliability Features

**Fault Tolerance:**
- Multi-region deployment capability
- Database replication and backups
- Graceful degradation on service failures
- Circuit breaker patterns for external services

This technical architecture provides a comprehensive foundation for understanding DirectoryBolt's backend systems, enabling effective collaboration between development teams and supporting future scaling requirements.