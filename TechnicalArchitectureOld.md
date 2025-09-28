\# DirectoryBolt.com - Comprehensive Technical Architecture



\## Overview



DirectoryBolt.com is a sophisticated business directory submission service built on a modern, scalable architecture leveraging Next.js, Supabase, Stripe, and advanced AI integrations. This document provides a detailed technical process map of all backend systems.



\## System Architecture Diagram



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

│                           Data Layer \& Background Processes                    │

├─────────────────────────────────────────────────────────────────────────────────┤

│                                                                                 │

│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │

│  │    Supabase     │   │  Real-time      │   │  Customer       │              │

│  │   Database      │◄──┤  Data Sync      │◄──┤  Management     │              │

│  │   PostgreSQL    │   │  \& Analytics    │   │  System         │              │

│  └─────────────────┘   └─────────────────┘   └─────────────────┘              │

│                                                                                 │

│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐              │

│  │  Queue Manager  │   │  Background     │   │  Monitoring \&   │              │

│  │  Priority Sys   │◄──┤  Scheduler      │◄──┤  Analytics      │              │

│  │  Load Balancer  │   │  SLA Tracking   │   │  Performance    │              │

│  └─────────────────┘   └─────────────────┘   └─────────────────┘              │

│                                                                                 │

└─────────────────────────────────────────────────────────────────────────────────┘

```



\## 1. Payment Processing Flow



\### 1.1 Stripe Integration Architecture



\*\*Primary Components:\*\*

\- `/pages/api/stripe/create-checkout-session.ts` - Stripe checkout session creation

\- `/pages/api/customer/register-complete.ts` - Customer registration with Stripe integration

\- `/pages/success.js` - Payment success page with redirect logic

\- `/pages/business-info.tsx` - Post-payment business information collection



\*\*Data Flow:\*\*

1\. \*\*Customer Checkout Initiation\*\*

&nbsp;  ```typescript

&nbsp;  User Action → Checkout Session Creation → Stripe Hosted Checkout → Payment Processing

&nbsp;  ```



2\. \*\*Webhook Processing Pipeline\*\*

&nbsp;  ```typescript

&nbsp;  Stripe Webhook → Signature Verification → Event Processing → Database Update → Customer Notification

&nbsp;  ```



\*\*Key Event Handlers:\*\*

\- `checkout.session.completed` - Payment confirmation and customer creation

\- `payment\_intent.succeeded` - Payment processing completion

\- Customer registration via `/api/customer/register-complete.ts`

\- Business information collection post-payment



\*\*Security Measures:\*\*

\- Stripe checkout session validation

\- Customer email retrieval from Stripe sessions

\- Secure payment processing via Stripe hosted checkout

\- Business information collection post-payment



\### 1.2 One-Time Payment Management



\*\*Package Tiers:\*\*

```typescript

const PACKAGE\_CONFIGS = {

&nbsp; starter: { directory\_limit: 50, priority\_level: 4, price: 149 },

&nbsp; growth: { directory\_limit: 150, priority\_level: 3, price: 299 },

&nbsp; professional: { directory\_limit: 300, priority\_level: 2, price: 499 },

&nbsp; enterprise: { directory\_limit: 500, priority\_level: 1, price: 799 }

}

```



\*\*Streamlined Customer Lifecycle:\*\*

1\. \*\*Pricing Selection\*\* → Customer selects package and enters email only

2\. \*\*Payment\*\* → Stripe checkout session creation and payment processing

3\. \*\*Business Info Collection\*\* → Post-payment detailed information gathering

4\. \*\*Registration\*\* → Customer record creation in Supabase with Stripe session data

5\. \*\*Queue Entry\*\* → Customer added to AutoBolt processing queue

6\. \*\*Staff Processing\*\* → Manual "Push to AutoBolt" by staff members

7\. \*\*Completion\*\* → Results delivery and analytics via staff dashboard



\## 2. Streamlined Checkout Architecture



\### 2.1 Payment-First Flow Design



\*\*Core Philosophy:\*\*

\- Minimize friction by collecting only email before payment

\- Business information collected after payment commitment

\- Higher conversion rates through reduced form abandonment



\*\*Component Architecture:\*\*

```typescript

// StreamlinedCheckout Component

interface StreamlinedCheckoutProps {

&nbsp; plan: 'starter' | 'growth' | 'professional' | 'enterprise'

&nbsp; planName: string

&nbsp; price: number

&nbsp; features: string\[]

}



// Pricing Configuration

const PLANS = \[

&nbsp; { name: 'Starter', price: 149, directories: 50 },

&nbsp; { name: 'Growth', price: 299, directories: 150, popular: true },

&nbsp; { name: 'Professional', price: 499, directories: 300 },

&nbsp; { name: 'Enterprise', price: 799, directories: 500 }

]

```



\### 2.2 Stripe Integration Flow



\*\*Checkout Session Creation:\*\*

```typescript

// /api/stripe/create-checkout-session.ts

const session = await stripe.checkout.sessions.create({

&nbsp; payment\_method\_types: \['card'],

&nbsp; line\_items: \[{

&nbsp;   price\_data: {

&nbsp;     currency: 'usd',

&nbsp;     product\_data: { name: planName },

&nbsp;     unit\_amount: price \* 100

&nbsp;   },

&nbsp;   quantity: 1

&nbsp; }],

&nbsp; mode: 'payment',

&nbsp; customer\_email: customerEmail,

&nbsp; success\_url: `${origin}/success?session\_id={CHECKOUT\_SESSION\_ID}\&plan=${plan}\&collect\_info=true`,

&nbsp; cancel\_url: `${origin}/pricing?cancelled=true`,

&nbsp; metadata: { collect\_business\_info: 'true' }

})

```



\### 2.3 Post-Payment Data Collection



\*\*Business Information Form:\*\*

\- Comprehensive business data collection

\- Stripe session validation for email retrieval

\- Form validation and error handling

\- Professional UX with progress indicators



\*\*Registration Pipeline:\*\*

```typescript

// /api/customer/register-complete.ts

async function getCustomerEmailFromSession(sessionId: string): Promise<string> {

&nbsp; const session = await stripe.checkout.sessions.retrieve(sessionId)

&nbsp; return session.customer\_details?.email || session.customer\_email || ''

}

```



\### 2.4 Success Page Redirect Logic



\*\*Automatic Flow Management:\*\*

```typescript

// /pages/success.js

useEffect(() => {

&nbsp; const { session\_id, plan, info\_collected } = router.query

&nbsp; 

&nbsp; if (session\_id \&\& !info\_collected) {

&nbsp;   router.push(`/business-info?session\_id=${session\_id}\&plan=${plan}`)

&nbsp;   return

&nbsp; }

}, \[router.query])

```



\## 3. AI Analysis Pipeline



\### 3.1 Business Intelligence Engine



\*\*Core Components:\*\*

\- `/pages/api/analyze.ts` - Main analysis endpoint with AI integration

\- AI-powered business intelligence via OpenAI/Anthropic

\- Customer record creation for paid analysis tiers

\- Directory opportunity identification



\*\*Analysis Tiers:\*\*

```typescript

const ANALYSIS\_TIERS = {

&nbsp; free: { maxDirectories: 5, includeAIAnalysis: false },

&nbsp; starter: { maxDirectories: 50, includeAIAnalysis: true, price: 149 },

&nbsp; growth: { maxDirectories: 150, includeCompetitiveAnalysis: true, price: 299 },

&nbsp; professional: { 

&nbsp;   maxDirectories: 300, 

&nbsp;   fullFeatureSet: true, 

&nbsp;   contentGapAnalyzer: true,

&nbsp;   price: 499 

&nbsp; },

&nbsp; enterprise: { 

&nbsp;   maxDirectories: 500, 

&nbsp;   customAnalysis: true, 

&nbsp;   contentGapAnalyzer: true,

&nbsp;   realTimeWebSocket: true,

&nbsp;   price: 799 

&nbsp; }

}

```



\### 3.2 AI Service Integration



\*\*Supported AI Providers:\*\*

\- \*\*OpenAI GPT-4\*\* - Business analysis, content generation, content gap analysis

\- \*\*Anthropic Claude\*\* - Competitive analysis, strategic insights

\- \*\*Web Scraping\*\* - Puppeteer-based data collection, Cheerio for competitor scraping

\- \*\*Real-time WebSocket\*\* - Live updates for Enterprise tier content analysis



\*\*Analysis Pipeline:\*\*

1\. \*\*URL Validation\*\* → Security checks, domain analysis

2\. \*\*Data Collection\*\* → Web scraping, metadata extraction

3\. \*\*AI Processing\*\* → Business profiling, competitive analysis

4\. \*\*Result Compilation\*\* → Structured response generation

5\. \*\*Customer Creation\*\* → Database record creation for paid tiers



\*\*Content Gap Analysis Pipeline:\*\*

1\. \*\*Website Scraping\*\* → Cheerio-based competitor content extraction

2\. \*\*Competitor Identification\*\* → AI-powered competitor discovery and analysis

3\. \*\*Content Gap Analysis\*\* → AI identification of content opportunities

4\. \*\*Blog Post Generation\*\* → AI-generated blog post ideas with SEO optimization

5\. \*\*FAQ Suggestions\*\* → High-volume FAQ recommendations with search data

6\. \*\*Keyword Clustering\*\* → Thematically organized keyword groups

7\. \*\*Real-time Updates\*\* → WebSocket progress updates (Enterprise tier)



\*\*Business Intelligence Output:\*\*

```typescript

interface BusinessIntelligenceResponse {

&nbsp; businessProfile: {

&nbsp;   name: string

&nbsp;   industry: string

&nbsp;   targetAudience: string\[]

&nbsp;   competitiveAdvantages: string\[]

&nbsp; }

&nbsp; competitiveAnalysis: {

&nbsp;   marketPosition: string

&nbsp;   competitorCount: number

&nbsp;   differentiationOpportunities: string\[]

&nbsp; }

&nbsp; seoAnalysis: {

&nbsp;   currentScore: number

&nbsp;   improvementAreas: string\[]

&nbsp;   keywordOpportunities: string\[]

&nbsp; }

&nbsp; directoryOpportunities: Directory\[]

}



interface ContentGapAnalysisResponse {

&nbsp; targetWebsite: string

&nbsp; competitors: CompetitorContent\[]

&nbsp; contentGaps: ContentGap\[]

&nbsp; blogPostIdeas: BlogPostIdea\[]

&nbsp; faqSuggestions: FAQSuggestion\[]

&nbsp; keywordClusters: KeywordCluster\[]

&nbsp; analysisDate: string

&nbsp; confidence: number

&nbsp; processingTime: number

}

```



\### 3.3 Caching and Performance



\*\*Data Management Strategy:\*\*

\- \*\*Analysis Results\*\* - Stored in Supabase database

\- \*\*Customer Records\*\* - Real-time updates via Supabase

\- \*\*Business Profiles\*\* - Integrated with customer registration pipeline

\- \*\*Content Gap Analysis\*\* - Cached results with tier-based access control

\- \*\*Real-time Updates\*\* - WebSocket connections for Enterprise tier



\## 4. Queue Management System



\### 4.1 Supabase Data Architecture



\*\*Core Tables:\*\*

```sql

-- Customer Management

customers (

&nbsp; id UUID PRIMARY KEY,

&nbsp; customer\_id TEXT UNIQUE,

&nbsp; email TEXT,

&nbsp; business\_name TEXT,

&nbsp; package\_type TEXT,

&nbsp; status TEXT,

&nbsp; directories\_submitted INTEGER,

&nbsp; failed\_directories INTEGER,

&nbsp; created\_at TIMESTAMP,

&nbsp; updated\_at TIMESTAMP

)



-- Queue Management

queue\_history (

&nbsp; id UUID PRIMARY KEY,

&nbsp; customer\_id TEXT,

&nbsp; status TEXT,

&nbsp; package\_type TEXT,

&nbsp; directories\_allocated INTEGER,

&nbsp; directories\_processed INTEGER,

&nbsp; priority\_level INTEGER,

&nbsp; estimated\_completion TIMESTAMP,

&nbsp; created\_at TIMESTAMP

)



-- Batch Operations

batch\_operations (

&nbsp; id UUID PRIMARY KEY,

&nbsp; operation\_type TEXT,

&nbsp; customer\_ids TEXT\[],

&nbsp; status TEXT,

&nbsp; total\_customers INTEGER,

&nbsp; processed\_customers INTEGER,

&nbsp; created\_by TEXT,

&nbsp; created\_at TIMESTAMP

)



-- Customer Notifications

customer\_notifications (

&nbsp; id UUID PRIMARY KEY,

&nbsp; customer\_id TEXT,

&nbsp; notification\_type TEXT,

&nbsp; title TEXT,

&nbsp; message TEXT,

&nbsp; action\_url TEXT,

&nbsp; read BOOLEAN,

&nbsp; created\_at TIMESTAMP

)



-- Analytics Events

analytics\_events (

&nbsp; id UUID PRIMARY KEY,

&nbsp; customer\_id TEXT,

&nbsp; event\_type TEXT,

&nbsp; event\_name TEXT,

&nbsp; event\_data JSONB,

&nbsp; created\_at TIMESTAMP

)

```



\### 4.2 AutoBolt Processing Queue



\*\*Queue API Endpoints:\*\*

\- `/pages/api/autobolt/queue-status.ts` - Queue status monitoring

\- `/pages/api/autobolt/customer-status.ts` - Individual customer tracking

\- `/pages/api/autobolt/get-next-customer.ts` - Get next customer for processing

\- `/pages/api/autobolt/update-progress.ts` - Update submission progress

\- `/pages/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring



\*\*Priority System:\*\*

```typescript

const TIER\_QUEUE\_CONFIGS = {

&nbsp; enterprise: { priority\_weight: 1, max\_concurrent: 20, rate\_limit\_per\_hour: 1000 },

&nbsp; professional: { priority\_weight: 2, max\_concurrent: 8, rate\_limit\_per\_hour: 200 },

&nbsp; growth: { priority\_weight: 3, max\_concurrent: 2, rate\_limit\_per\_hour: 50 },

&nbsp; starter: { priority\_weight: 4, max\_concurrent: 1, rate\_limit\_per\_hour: 25 }

}

```



\### 4.3 Advanced Queue Features



\*\*Load Balancing:\*\*

\- Resource allocation by package tier

\- Auto-scaling based on queue size and system load

\- SLA compliance monitoring with violation alerts



\*\*Processing Windows:\*\*

\- Enterprise: Priority processing with staff oversight

\- Professional: Standard processing with staff oversight

\- Growth: Standard processing with staff oversight

\- Starter: Standard processing with staff oversight



\## 5. Directory Submission Automation



\### 5.1 Dynamic Form Mapping Engine



\*\*Core Component:\*\* Chrome Extension AutoBolt Integration



\*\*Processing Strategies:\*\*

1\. \*\*Staff-Controlled Processing\*\* - Manual "Push to AutoBolt" functionality

2\. \*\*Real-time Progress Tracking\*\* - Live status updates via extension

3\. \*\*Queue Management\*\* - Staff dashboard for monitoring and control

4\. \*\*Quality Assurance\*\* - Human oversight for all submissions



\*\*AutoBolt Processing Architecture:\*\*

```typescript

interface AutoBoltProcessing {

&nbsp; customerId: string

&nbsp; directoryName: string

&nbsp; submissionStatus: 'pending' | 'processing' | 'completed' | 'failed'

&nbsp; progress: number

&nbsp; totalDirectories: number

&nbsp; processedDirectories: number

&nbsp; failedDirectories: number

&nbsp; lastUpdated: string

&nbsp; extensionId: string

}



interface AutoBoltQueueItem {

&nbsp; id: string

&nbsp; customer\_id: string

&nbsp; business\_name: string

&nbsp; email: string

&nbsp; package\_type: string

&nbsp; directory\_limit: number

&nbsp; priority\_level: number

&nbsp; status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'

&nbsp; action: string

&nbsp; created\_at: string

&nbsp; updated\_at: string

&nbsp; created\_by: string

&nbsp; started\_at?: string

&nbsp; completed\_at?: string

&nbsp; error\_message?: string

&nbsp; metadata: Record<string, any>

}



interface AutoBoltExtensionStatus {

&nbsp; extension\_id: string

&nbsp; status: 'online' | 'offline' | 'processing' | 'error'

&nbsp; last\_heartbeat: string

&nbsp; current\_customer\_id?: string

&nbsp; current\_queue\_id?: string

&nbsp; processing\_started\_at?: string

&nbsp; directories\_processed: number

&nbsp; directories\_failed: number

&nbsp; error\_message?: string

&nbsp; metadata: Record<string, any>

}

```



\### 5.2 Batch Processing Workflows



\*\*Processing Methods:\*\*

\- \*\*Chrome Extension\*\* - AutoBolt automated form filling

\- \*\*Staff Control\*\* - Manual triggering via staff dashboard

\- \*\*Real-time Monitoring\*\* - Live progress tracking and status updates



\*\*Success/Failure Tracking:\*\*

\- Real-time status updates via Supabase

\- Progress tracking via AutoBolt extension

\- Staff dashboard monitoring and alerts

\- Manual intervention capabilities



\### 5.3 Staff Dashboard Management



\*\*Staff Controls:\*\*

\- Manual "Push to AutoBolt" functionality

\- Real-time queue monitoring

\- Customer progress tracking

\- Analytics and reporting



\*\*Quality Assurance:\*\*

\- Human oversight for all submissions

\- Manual intervention capabilities

\- Error handling and retry logic

\- Customer communication system



\## 6. Data Architecture



\### 6.1 Database Schema Design



\*\*Primary Database:\*\* Supabase PostgreSQL



\*\*Core Tables:\*\*

\- `customers` - Customer management and business data

\- `queue\_history` - Processing queue management

\- `customer\_notifications` - Customer notification system

\- `analytics\_events` - Analytics and tracking data

\- `batch\_operations` - Batch processing management



\*\*AutoBolt Integration Tables:\*\*

\- `autobolt\_processing\_queue` - AutoBolt processing queue management

\- `directory\_submissions` - Individual directory submission tracking

\- `autobolt\_extension\_status` - Chrome extension status monitoring

\- `autobolt\_processing\_history` - Processing session history



\*\*Key Relationships:\*\*

```sql

-- Customer → Queue History (1:Many)

-- Customer → Notifications (1:Many)

-- Customer → Analytics Events (1:Many)

-- Customer → AutoBolt Processing Queue (1:Many)

-- AutoBolt Queue → Directory Submissions (1:Many)

-- AutoBolt Queue → Processing History (1:Many)

-- Batch Operations → Customers (Many:Many via customer\_ids array)

```



\*\*Indexing Strategy:\*\*

```sql

-- Performance indexes

CREATE INDEX idx\_customers\_email ON customers(email);

CREATE INDEX idx\_customers\_status ON customers(status);

CREATE INDEX idx\_queue\_history\_customer\_id ON queue\_history(customer\_id);

CREATE INDEX idx\_queue\_history\_status ON queue\_history(status);

CREATE INDEX idx\_analytics\_events\_customer\_id ON analytics\_events(customer\_id);

```



\### 6.2 External Service Integrations



\*\*Stripe Integration:\*\*

\- Payment processing and checkout sessions

\- Customer email retrieval from sessions

\- Webhook handling for payment confirmations



\*\*AI Service Integration:\*\*

\- OpenAI API for business analysis and content gap analysis

\- Anthropic API for competitive intelligence

\- Cheerio for competitor website scraping

\- Real-time analysis processing

\- WebSocket for real-time updates (Enterprise tier)



\### 6.3 API Endpoint Mapping



\*\*Customer Management APIs:\*\*

\- `/api/customer/register-complete.ts` - Complete registration pipeline with Stripe session integration

\- `/api/analyze.ts` - Website analysis and customer creation for paid tiers



\*\*AI Content Gap Analysis APIs:\*\*

\- `/api/ai/content-gap-analysis.ts` - REST API endpoint for content gap analysis

\- ContentGapAnalyzer service class with OpenAI integration

\- Rate limiting and tier validation (Professional/Enterprise only)

\- Real-time WebSocket updates (Enterprise tier)



\*\*Staff Dashboard APIs:\*\*

\- `/api/staff/queue.ts` - Queue data for staff monitoring

\- `/api/staff/analytics.ts` - Analytics data for staff dashboard

\- `/api/staff/push-to-autobolt.ts` - Manual AutoBolt processing trigger

\- `/api/staff/auth-check.ts` - Staff authentication verification

\- `/api/staff/autobolt-extensions.ts` - AutoBolt extension management

\- `/api/staff/autobolt-queue.ts` - Staff AutoBolt queue monitoring



\*\*AutoBolt Integration APIs:\*\*

\- `/api/autobolt/queue.ts` - AutoBolt queue management

\- `/api/autobolt/process-queue.ts` - Process AutoBolt queue

\- `/api/autobolt/queue-status.ts` - AutoBolt queue status

\- `/api/autobolt/pending-customers.ts` - Get pending customers for AutoBolt

\- `/api/autobolt/get-next-customer.ts` - Get next customer for processing

\- `/api/autobolt/update-progress.ts` - Update submission progress

\- `/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring

\- `/api/autobolt/customer-data.ts` - Customer data for AutoBolt

\- `/api/autobolt/customer-status.ts` - Customer processing status

\- `/api/autobolt/directories.ts` - Directory data for AutoBolt

\- `/api/autobolt/dynamic-mapping.ts` - Dynamic directory mapping

\- `/api/autobolt/processing-queue.ts` - Processing queue management

\- `/api/autobolt/update-submission.ts` - Update submission status



\*\*Queue Management APIs:\*\*

\- `/api/queue/add.js` - Add customer to processing queue

\- `/api/queue/status.js` - Queue status and statistics

\- `/api/queue/process.ts` - Process queue items

\- `/api/queue/operations.ts` - Queue operations management

\- `/api/queue/\[customerId].ts` - Individual customer queue management

\- `/api/queue/pending.js` - Get pending queue items

\- `/api/queue/batch.ts` - Batch queue operations



\*\*Streamlined Checkout APIs:\*\*

\- `/api/stripe/create-checkout-session.ts` - Stripe checkout session creation

\- `/pages/business-info.tsx` - Post-payment business information collection

\- `/pages/success.js` - Payment success page with redirect logic



\*\*Streamlined Checkout Components:\*\*

\- `/components/checkout/StreamlinedCheckout.tsx` - Email-only checkout component

\- `/components/pricing/StreamlinedPricing.tsx` - 4-tier pricing display

\- `/pages/test-streamlined-pricing.tsx` - Test page for streamlined flow



\*\*AutoBolt APIs:\*\*

\- `/api/autobolt/queue-status.ts` - Queue status monitoring

\- `/api/autobolt/customer-status.ts` - Individual customer tracking

\- `/api/autobolt/get-next-customer.ts` - Get next customer for processing

\- `/api/autobolt/update-progress.ts` - Update submission progress

\- `/api/autobolt/heartbeat.ts` - Extension heartbeat monitoring



\*\*Queue Management APIs:\*\*

\- `/api/queue/\[customerId].ts` - Individual customer queue operations

\- `/api/queue/batch.ts` - Batch queue operations

\- `/api/queue/operations.ts` - Queue operation management



\*\*Directory APIs:\*\*

\- `/api/directories/index.ts` - Directory listing and management

\- `/api/directories/analyze-form.js` - Form analysis

\- `/api/directories/seed.ts` - Directory seeding



\## 7. Staff Dashboard System



\### 7.1 Staff Dashboard Architecture



\*\*Core Components:\*\*

\- `/pages/staff-dashboard.tsx` - Main staff dashboard interface

\- `/pages/staff-login.tsx` - Staff authentication

\- `/components/staff-dashboard/RealTimeQueue.tsx` - Queue monitoring

\- `/components/staff-dashboard/RealTimeAnalytics.tsx` - Analytics display

\- `/components/staff-dashboard/AutoBoltQueueMonitor.tsx` - AutoBolt monitoring



\*\*Staff Controls:\*\*

\- Manual "Push to AutoBolt" functionality

\- Real-time queue monitoring and management

\- Customer progress tracking and analytics

\- Quality assurance and oversight capabilities



\### 7.2 Monitoring and Performance



\*\*Performance Metrics:\*\*

\- Customer queue processing status

\- AutoBolt extension health monitoring

\- Real-time analytics and reporting

\- Staff dashboard performance tracking



\*\*Quality Assurance:\*\*

\- Human oversight for all submissions

\- Manual intervention capabilities

\- Error handling and retry logic

\- Customer communication and support



\### 7.3 Security and Authentication



\*\*Staff Authentication:\*\*

\- `/pages/staff-login.tsx` - Staff login interface

\- `/pages/api/staff/auth-check.ts` - Authentication validation

\- Session management and security controls

\- Role-based access control



\*\*API Security:\*\*

\- Staff authentication middleware

\- Rate limiting and CSRF protection

\- Input validation and sanitization

\- Secure API endpoint access



\## 8. Security and Monitoring



\### 8.1 Security Architecture



\*\*API Security:\*\*

\- Staff authentication middleware (`/lib/middleware/staff-auth.ts`)

\- Rate limiting middleware (`/lib/middleware/rate-limit.ts`)

\- CSRF protection middleware (`/lib/middleware/csrf-protection.ts`)

\- Input validation and sanitization



\*\*Authentication Security:\*\*

\- Session-based authentication

\- API key validation

\- Basic authentication support

\- Secure cookie management



\### 8.2 Error Handling



\*\*Error Recovery:\*\*

\- Staff dashboard error monitoring

\- Manual intervention capabilities

\- Customer notification system

\- Comprehensive error logging and tracking



\### 8.3 Performance Monitoring



\*\*Metrics Collection:\*\*

\- API response times

\- Database query performance

\- AutoBolt processing rates

\- Staff dashboard performance



\*\*Health Checks:\*\*

\- `/api/status/index.ts` - System status endpoint

\- `/api/system-status.ts` - Comprehensive system diagnostics

\- `/api/ai/status.ts` - AI service health monitoring



\## 9. Deployment and Infrastructure



\### 9.1 Hosting and CDN



\*\*Platform:\*\* Netlify

\- Serverless function deployment

\- Automatic SSL/TLS

\- Global CDN distribution

\- Edge computing capabilities



\### 9.2 Environment Configuration



\*\*Environment Variables:\*\*

```bash

\# Core Application

BASE\_URL=https://directorybolt.com

NEXT\_PUBLIC\_APP\_URL=https://directorybolt.com



\# Database

SUPABASE\_URL=https://your-project.supabase.co

SUPABASE\_SERVICE\_KEY=your-service-key

NEXT\_PUBLIC\_SUPABASE\_URL=https://your-project.supabase.co



\# Payment Processing

STRIPE\_SECRET\_KEY=sk\_live\_your\_secret\_key

NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY=pk\_live\_your\_publishable\_key

STRIPE\_WEBHOOK\_SECRET=whsec\_your\_webhook\_secret



\# AI Services

OPENAI\_API\_KEY=sk-your-openai-key

ANTHROPIC\_API\_KEY=sk-ant-your-anthropic-key



\# Chrome Extension

AUTOBOLT\_EXTENSION\_ID=your\_extension\_id

AUTOBOLT\_API\_KEY=your\_extension\_api\_key



\# Content Gap Analyzer

CONTENT\_GAP\_ANALYZER\_ENABLED=true

WEBSOCKET\_ENABLED=true

```



\## 10. Data Flow Examples



\### 10.1 Streamlined Customer Journey



```

1\. Customer Visits Site

&nbsp;  ↓

2\. Initiates Free Analysis (analyze.ts)

&nbsp;  ↓

3\. AI Analysis Pipeline Executes

&nbsp;  ↓

4\. Results Displayed with Upgrade Prompt

&nbsp;  ↓

5\. Customer Views Streamlined Pricing (/test-streamlined-pricing)

&nbsp;  ↓

6\. Customer Selects Package and Enters Email Only

&nbsp;  ↓

7\. Stripe Checkout Session Created (create-checkout-session.ts)

&nbsp;  ↓

8\. Customer Completes Payment via Stripe

&nbsp;  ↓

9\. Success Page Redirects to Business Info Collection (/business-info)

&nbsp;  ↓

10\. Customer Completes Business Information Form

&nbsp;   ↓

11\. Customer Registration API Processes Data (register-complete.ts)

&nbsp;   ↓

12\. Stripe Session Validated for Email Retrieval

&nbsp;   ↓

13\. Customer Record Created in Supabase Database

&nbsp;   ↓

14\. Queue Entry Added to AutoBolt Processing Queue

&nbsp;   ↓

15\. Staff Dashboard Shows Customer in Queue

&nbsp;   ↓

16\. Staff Member Clicks "Push to AutoBolt"

&nbsp;   ↓

17\. AutoBolt Extension Receives Customer Data

&nbsp;   ↓

18\. Chrome Extension Processes Directory Submissions

&nbsp;   ↓

19\. Real-time Progress Updates via Staff Dashboard

&nbsp;   ↓

20\. Customer Notified of Completion

```



\### 10.2 Content Gap Analysis Flow (Professional/Enterprise)



```

1\. Customer Accesses Content Gap Analyzer

&nbsp;  ↓

2\. Enters Website URL for Analysis

&nbsp;  ↓

3\. Clicks "Analyze" Button

&nbsp;  ↓

4\. API Validates Tier Access (Professional/Enterprise)

&nbsp;  ↓

5\. ContentGapAnalyzer Service Initialized

&nbsp;  ↓

6\. Website Scraping with Cheerio

&nbsp;  ↓

7\. Competitor Identification via AI

&nbsp;  ↓

8\. Content Gap Analysis Processing

&nbsp;  ↓

9\. Blog Post Ideas Generation

&nbsp;  ↓

10\. FAQ Suggestions with Search Volumes

&nbsp;   ↓

11\. Keyword Clusters Organization

&nbsp;   ↓

12\. Real-time Updates (Enterprise WebSocket)

&nbsp;   ↓

13\. Comprehensive Report Generation

&nbsp;   ↓

14\. Results Displayed to Customer

```



\### 10.3 Error Recovery Flow



```

1\. Directory Submission Fails

&nbsp;  ↓

2\. Error Logged in Staff Dashboard

&nbsp;  ↓

3\. Staff Member Reviews Error Details

&nbsp;  ↓

4\. Manual Intervention or Retry Decision

&nbsp;  ↓

5\. If Retryable: Staff Triggers Retry

&nbsp;  ↓

6\. If Not Retryable: Mark as Failed

&nbsp;  ↓

7\. Customer Notification Sent

&nbsp;  ↓

8\. Alternative Directories Suggested

&nbsp;  ↓

9\. Staff Dashboard Updated with Status

```



\## 11. Performance Characteristics



\### 11.1 Scalability Metrics



\*\*Current Capacity:\*\*

\- 1000+ concurrent users

\- Staff-controlled processing with quality oversight

\- 99.9% uptime SLA

\- <200ms API response times



\*\*Scaling Thresholds:\*\*

\- Staff dashboard monitoring with alerts

\- Queue size monitoring with staff notifications

\- Database connection pooling

\- CDN caching for static assets



\### 11.2 Reliability Features



\*\*Fault Tolerance:\*\*

\- Multi-region deployment capability

\- Database replication and backups

\- Graceful degradation on service failures

\- Staff dashboard monitoring and manual intervention capabilities



This technical architecture provides a comprehensive foundation for understanding DirectoryBolt's backend systems, enabling effective collaboration between development teams and supporting future scaling requirements.

