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
│  │    Supabase     │   │  Real-time      │   │  Customer       │              │
│  │   Database      │◄──┤  Data Sync      │◄──┤  Management     │              │
│  │   PostgreSQL    │   │  & Analytics    │   │  System         │              │
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
- `/pages/api/stripe/create-checkout-session.ts` - Stripe checkout session creation
- `/pages/api/customer/register-complete.ts` - Customer registration with Stripe integration
- `/pages/success.js` - Payment success page with redirect logic
- `/pages/business-info.tsx` - Post-payment business information collection

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
- `checkout.session.completed` - Payment confirmation and customer creation
- `payment_intent.succeeded` - Payment processing completion
- Customer registration via `/api/customer/register-complete.ts`
- Business information collection post-payment

**Security Measures:**
- Stripe checkout session validation
- Customer email retrieval from Stripe sessions
- Secure payment processing via Stripe hosted checkout
- Business information collection post-payment

### 1.2 One-Time Payment Management

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
5. **Queue Entry** → Customer added to AutoBolt processing queue
6. **Staff Processing** → Manual "Push to AutoBolt" by staff members
7. **Completion** → Results delivery and analytics via staff dashboard

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
- `/pages/api/analyze.ts` - Main analysis endpoint with AI integration
- AI-powered business intelligence via OpenAI/Anthropic
- Customer record creation for paid analysis tiers
- Directory opportunity identification

**Analysis Tiers:**
```typescript
const ANALYSIS_TIERS = {
  free: { maxDirectories: 5, includeAIAnalysis: false },
  starter: { maxDirectories: 50, includeAIAnalysis: true, price: 149 },
  growth: { maxDirectories: 150, includeCompetitiveAnalysis: true, price: 299 },
  professional: { 
    maxDirectories: 300, 
    fullFeatureSet: true, 
    contentGapAnalyzer: true,
    price: 499 
  },
  enterprise: { 
    maxDirectories: 500, 
    customAnalysis: true, 
    contentGapAnalyzer: true,
    realTimeWebSocket: true,
    price: 799 
  }
}
```

### 3.2 AI Service Integration

**Supported AI Providers:**
- **OpenAI GPT-4** - Business analysis, content generation, content gap analysis
- **Anthropic Claude** - Competitive analysis, strategic insights
- **Web Scraping** - Puppeteer-based data collection, Cheerio for competitor scraping
- **Real-time WebSocket** - Live updates for Enterprise tier content analysis

**Analysis Pipeline:**
1. **URL Validation** → Security checks, domain analysis
2. **Data Collection** → Web scraping, metadata extraction
3. **AI Processing** → Business profiling, competitive analysis
4. **Result Compilation** → Structured response generation
5. **Customer Creation** → Database record creation for paid tiers

**Content Gap Analysis Pipeline:**
1. **Website Scraping** → Cheerio-based competitor content extraction
2. **Competitor Identification** → AI-powered competitor discovery and analysis
3. **Content Gap Analysis** → AI identification of content opportunities
4. **Blog Post Generation** → AI-generated blog post ideas with SEO optimization
5. **FAQ Suggestions** → High-volume FAQ recommendations with search data
6. **Keyword Clustering** → Thematically organized keyword groups
7. **Real-time Updates** → WebSocket progress updates (Enterprise tier)

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

interface ContentGapAnalysisResponse {
  targetWebsite: string
  competitors: CompetitorContent[]
  contentGaps: ContentGap[]
  blogPostIdeas: BlogPostIdea[]
  faqSuggestions: FAQSuggestion[]
  keywordClusters: KeywordCluster[]
  analysisDate: string
  confidence: number
  processingTime: number
}
```

### 3.3 Caching and Performance

**Data Management Strategy:**
- **Analysis Results** - Stored in Supabase database
- **Customer Records** - Real-time updates via Supabase
- **Business Profiles** - Integrated with customer registration pipeline
- **Content Gap Analysis** - Cached results with tier-based access control
- **Real-time Updates** - WebSocket connections for Enterprise tier

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
- `/pages/api/autobolt/queue-status.ts` - Queue status monitoring
- `/pages/api/autobolt/customer-status.ts` - Individual customer tracking
- `/pages/api/autobolt/get-next-customer.ts` - Get next customer for processing
- `/pages/api/autobolt/update-progress.ts` - Update submission progress
- `/pages/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring

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
- Enterprise: Priority processing with staff oversight
- Professional: Standard processing with staff oversight
- Growth: Standard processing with staff oversight
- Starter: Standard processing with staff oversight

## 5. Directory Submission Automation

### 5.1 Dynamic Form Mapping Engine

**Core Component:** Chrome Extension AutoBolt Integration

**Processing Strategies:**
1. **Staff-Controlled Processing** - Manual "Push to AutoBolt" functionality
2. **Real-time Progress Tracking** - Live status updates via extension
3. **Queue Management** - Staff dashboard for monitoring and control
4. **Quality Assurance** - Human oversight for all submissions

**AutoBolt Processing Architecture:**
```typescript
interface AutoBoltProcessing {
  customerId: string
  directoryName: string
  submissionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  totalDirectories: number
  processedDirectories: number
  failedDirectories: number
  lastUpdated: string
  extensionId: string
}

interface AutoBoltQueueItem {
  id: string
  customer_id: string
  business_name: string
  email: string
  package_type: string
  directory_limit: number
  priority_level: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  action: string
  created_at: string
  updated_at: string
  created_by: string
  started_at?: string
  completed_at?: string
  error_message?: string
  metadata: Record<string, any>
}

interface AutoBoltExtensionStatus {
  extension_id: string
  status: 'online' | 'offline' | 'processing' | 'error'
  last_heartbeat: string
  current_customer_id?: string
  current_queue_id?: string
  processing_started_at?: string
  directories_processed: number
  directories_failed: number
  error_message?: string
  metadata: Record<string, any>
}
```

### 5.2 Batch Processing Workflows

**Processing Methods:**
- **Chrome Extension** - AutoBolt automated form filling
- **Staff Control** - Manual triggering via staff dashboard
- **Real-time Monitoring** - Live progress tracking and status updates

**Success/Failure Tracking:**
- Real-time status updates via Supabase
- Progress tracking via AutoBolt extension
- Staff dashboard monitoring and alerts
- Manual intervention capabilities

### 5.3 Staff Dashboard Management

**Staff Controls:**
- Manual "Push to AutoBolt" functionality
- Real-time queue monitoring
- Customer progress tracking
- Analytics and reporting

**Quality Assurance:**
- Human oversight for all submissions
- Manual intervention capabilities
- Error handling and retry logic
- Customer communication system

## 6. Data Architecture

### 6.1 Database Schema Design

**Primary Database:** Supabase PostgreSQL

**Core Tables:**
- `customers` - Customer management and business data
- `queue_history` - Processing queue management
- `customer_notifications` - Customer notification system
- `analytics_events` - Analytics and tracking data
- `batch_operations` - Batch processing management

**AutoBolt Integration Tables:**
- `autobolt_processing_queue` - AutoBolt processing queue management
- `directory_submissions` - Individual directory submission tracking
- `autobolt_extension_status` - Chrome extension status monitoring
- `autobolt_processing_history` - Processing session history

**Key Relationships:**
```sql
-- Customer → Queue History (1:Many)
-- Customer → Notifications (1:Many)
-- Customer → Analytics Events (1:Many)
-- Customer → AutoBolt Processing Queue (1:Many)
-- AutoBolt Queue → Directory Submissions (1:Many)
-- AutoBolt Queue → Processing History (1:Many)
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

**Stripe Integration:**
- Payment processing and checkout sessions
- Customer email retrieval from sessions
- Webhook handling for payment confirmations

**AI Service Integration:**
- OpenAI API for business analysis and content gap analysis
- Anthropic API for competitive intelligence
- Cheerio for competitor website scraping
- Real-time analysis processing
- WebSocket for real-time updates (Enterprise tier)

### 6.3 API Endpoint Mapping

**Customer Management APIs:**
- `/api/customer/register-complete.ts` - Complete registration pipeline with Stripe session integration
- `/api/analyze.ts` - Website analysis and customer creation for paid tiers

**AI Content Gap Analysis APIs:**
- `/api/ai/content-gap-analysis.ts` - REST API endpoint for content gap analysis
- ContentGapAnalyzer service class with OpenAI integration
- Rate limiting and tier validation (Professional/Enterprise only)
- Real-time WebSocket updates (Enterprise tier)

**Staff Dashboard APIs:**
- `/api/staff/queue.ts` - Queue data for staff monitoring
- `/api/staff/analytics.ts` - Analytics data for staff dashboard
- `/api/staff/push-to-autobolt.ts` - Manual AutoBolt processing trigger
- `/api/staff/auth-check.ts` - Staff authentication verification
- `/api/staff/autobolt-extensions.ts` - AutoBolt extension management
- `/api/staff/autobolt-queue.ts` - Staff AutoBolt queue monitoring

**AutoBolt Integration APIs:**
- `/api/autobolt/queue.ts` - AutoBolt queue management
- `/api/autobolt/process-queue.ts` - Process AutoBolt queue
- `/api/autobolt/queue-status.ts` - AutoBolt queue status
- `/api/autobolt/pending-customers.ts` - Get pending customers for AutoBolt
- `/api/autobolt/get-next-customer.ts` - Get next customer for processing
- `/api/autobolt/update-progress.ts` - Update submission progress
- `/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring
- `/api/autobolt/customer-data.ts` - Customer data for AutoBolt
- `/api/autobolt/customer-status.ts` - Customer processing status
- `/api/autobolt/directories.ts` - Directory data for AutoBolt
- `/api/autobolt/dynamic-mapping.ts` - Dynamic directory mapping
- `/api/autobolt/processing-queue.ts` - Processing queue management
- `/api/autobolt/update-submission.ts` - Update submission status

**Queue Management APIs:**
- `/api/queue/add.js` - Add customer to processing queue
- `/api/queue/status.js` - Queue status and statistics
- `/api/queue/process.ts` - Process queue items
- `/api/queue/operations.ts` - Queue operations management
- `/api/queue/[customerId].ts` - Individual customer queue management
- `/api/queue/pending.js` - Get pending queue items
- `/api/queue/batch.ts` - Batch queue operations

**Streamlined Checkout APIs:**
- `/api/stripe/create-checkout-session.ts` - Stripe checkout session creation
- `/pages/business-info.tsx` - Post-payment business information collection
- `/pages/success.js` - Payment success page with redirect logic

**Streamlined Checkout Components:**
- `/components/checkout/StreamlinedCheckout.tsx` - Email-only checkout component
- `/components/pricing/StreamlinedPricing.tsx` - 4-tier pricing display
- `/pages/test-streamlined-pricing.tsx` - Test page for streamlined flow

**AutoBolt APIs:**
- `/api/autobolt/queue-status.ts` - Queue status monitoring
- `/api/autobolt/customer-status.ts` - Individual customer tracking
- `/api/autobolt/get-next-customer.ts` - Get next customer for processing
- `/api/autobolt/update-progress.ts` - Update submission progress
- `/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring

**Queue Management APIs:**
- `/api/queue/[customerId].ts` - Individual customer queue operations
- `/api/queue/batch.ts` - Batch queue operations
- `/api/queue/operations.ts` - Queue operation management

**Directory APIs:**
- `/api/directories/index.ts` - Directory listing and management
- `/api/directories/analyze-form.js` - Form analysis
- `/api/directories/seed.ts` - Directory seeding

## 7. Staff Dashboard System

### 7.1 Staff Dashboard Architecture

**Core Components:**
- `/pages/staff-dashboard.tsx` - Main staff dashboard interface
- `/pages/staff-login.tsx` - Staff authentication
- `/components/staff-dashboard/RealTimeQueue.tsx` - Queue monitoring
- `/components/staff-dashboard/RealTimeAnalytics.tsx` - Analytics display
- `/components/staff-dashboard/AutoBoltQueueMonitor.tsx` - AutoBolt monitoring

**Staff Controls:**
- Manual "Push to AutoBolt" functionality
- Real-time queue monitoring and management
- Customer progress tracking and analytics
- Quality assurance and oversight capabilities

### 7.2 Monitoring and Performance

**Performance Metrics:**
- Customer queue processing status
- AutoBolt extension health monitoring
- Real-time analytics and reporting
- Staff dashboard performance tracking

**Quality Assurance:**
- Human oversight for all submissions
- Manual intervention capabilities
- Error handling and retry logic
- Customer communication and support

### 7.3 Security and Authentication

**Staff Authentication:**
- `/pages/staff-login.tsx` - Staff login interface
- `/pages/api/staff/auth-check.ts` - Authentication validation
- Session management and security controls
- Role-based access control

**API Security:**
- Staff authentication middleware
- Rate limiting and CSRF protection
- Input validation and sanitization
- Secure API endpoint access

## 8. Security and Monitoring

### 8.1 Security Architecture

**API Security:**
- Staff authentication middleware (`/lib/middleware/staff-auth.ts`)
- Rate limiting middleware (`/lib/middleware/rate-limit.ts`)
- CSRF protection middleware (`/lib/middleware/csrf-protection.ts`)
- Input validation and sanitization

**Authentication Security:**
- Session-based authentication
- API key validation
- Basic authentication support
- Secure cookie management

### 8.2 Error Handling

**Error Recovery:**
- Staff dashboard error monitoring
- Manual intervention capabilities
- Customer notification system
- Comprehensive error logging and tracking

### 8.3 Performance Monitoring

**Metrics Collection:**
- API response times
- Database query performance
- AutoBolt processing rates
- Staff dashboard performance

**Health Checks:**
- `/api/status/index.ts` - System status endpoint
- `/api/system-status.ts` - Comprehensive system diagnostics
- `/api/ai/status.ts` - AI service health monitoring

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

# Chrome Extension
AUTOBOLT_EXTENSION_ID=your_extension_id
AUTOBOLT_API_KEY=your_extension_api_key

# Content Gap Analyzer
CONTENT_GAP_ANALYZER_ENABLED=true
WEBSOCKET_ENABLED=true
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
14. Queue Entry Added to AutoBolt Processing Queue
    ↓
15. Staff Dashboard Shows Customer in Queue
    ↓
16. Staff Member Clicks "Push to AutoBolt"
    ↓
17. AutoBolt Extension Receives Customer Data
    ↓
18. Chrome Extension Processes Directory Submissions
    ↓
19. Real-time Progress Updates via Staff Dashboard
    ↓
20. Customer Notified of Completion
```

### 10.2 Content Gap Analysis Flow (Professional/Enterprise)

```
1. Customer Accesses Content Gap Analyzer
   ↓
2. Enters Website URL for Analysis
   ↓
3. Clicks "Analyze" Button
   ↓
4. API Validates Tier Access (Professional/Enterprise)
   ↓
5. ContentGapAnalyzer Service Initialized
   ↓
6. Website Scraping with Cheerio
   ↓
7. Competitor Identification via AI
   ↓
8. Content Gap Analysis Processing
   ↓
9. Blog Post Ideas Generation
   ↓
10. FAQ Suggestions with Search Volumes
    ↓
11. Keyword Clusters Organization
    ↓
12. Real-time Updates (Enterprise WebSocket)
    ↓
13. Comprehensive Report Generation
    ↓
14. Results Displayed to Customer
```

### 10.3 Error Recovery Flow

```
1. Directory Submission Fails
   ↓
2. Error Logged in Staff Dashboard
   ↓
3. Staff Member Reviews Error Details
   ↓
4. Manual Intervention or Retry Decision
   ↓
5. If Retryable: Staff Triggers Retry
   ↓
6. If Not Retryable: Mark as Failed
   ↓
7. Customer Notification Sent
   ↓
8. Alternative Directories Suggested
   ↓
9. Staff Dashboard Updated with Status
```

## 11. Performance Characteristics

### 11.1 Scalability Metrics

**Current Capacity:**
- 1000+ concurrent users
- Staff-controlled processing with quality oversight
- 99.9% uptime SLA
- <200ms API response times

**Scaling Thresholds:**
- Staff dashboard monitoring with alerts
- Queue size monitoring with staff notifications
- Database connection pooling
- CDN caching for static assets

### 11.2 Reliability Features

**Fault Tolerance:**
- Multi-region deployment capability
- Database replication and backups
- Graceful degradation on service failures
- Staff dashboard monitoring and manual intervention capabilities

This technical architecture provides a comprehensive foundation for understanding DirectoryBolt's backend systems, enabling effective collaboration between development teams and supporting future scaling requirements.