# Repository Guidelines

## Project Structure & Module Organization

DirectoryBolt follows a standard Next.js 14 structure with TypeScript. Source code is organized in `/pages` for Next.js pages and API routes, `/components` for React components grouped by feature (ai-portal, analytics, dashboard, etc.), `/lib` for utilities, database connections, AI services, and type definitions, and `/public` for static assets. The `/autobolt-extension` directory contains the Chrome extension code for automated submissions.

## Build, Test, and Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Code quality checks
npm run lint

# Comprehensive testing
npm run test:comprehensive

# E2E testing
npm run test:e2e

# AI integration tests
npm run test:ai-integration
```

## Coding Style & Naming Conventions

- **Indentation**: 2 spaces (TypeScript/JavaScript)
- **File naming**: kebab-case for components, camelCase for utilities
- **Function/variable naming**: camelCase with descriptive names
- **Linting**: ESLint with Next.js configuration, TypeScript strict mode enabled

## Testing Guidelines

- **Framework**: Jest for unit tests, Playwright for E2E testing
- **Test files**: Located in `/tests` directory with feature-specific subdirectories
- **Running tests**: Use `npm run test:comprehensive` for full test suite
- **Coverage**: Comprehensive test coverage for AI services, payment flows, and user journeys

## Commit & Pull Request Guidelines

- **Commit format**: Descriptive messages focusing on feature/fix areas (e.g., "autobolt", "fixes", "updates")
- **PR process**: Team-based development with code review requirements
- **Branch naming**: Feature branches with descriptive names

---

# Repository Tour

## 🎯 What This Repository Does

DirectoryBolt is an AI-powered business directory submission platform that automates the process of submitting businesses to 480+ high-authority directories. The platform provides comprehensive business intelligence analysis, competitive insights, and automated submission workflows to help businesses improve their online visibility and generate more leads.

**Key responsibilities:**
- AI-powered website analysis and business intelligence
- Automated directory submission to 480+ platforms
- Competitive analysis and market insights
- Payment processing and subscription management

---

## 🏗️ Architecture Overview

### System Context
```
[Business Websites] → [DirectoryBolt Platform] → [480+ Directories]
                            ↓
                    [AI Analysis Engine]
                            ↓
                    [Business Intelligence Reports]
```

### Key Components
- **AI Analysis Engine** - OpenAI/Anthropic integration for business profiling and competitive analysis
- **Directory Database System** - Supabase-backed database with 480+ directory records and tier management
- **Payment Processing** - Stripe integration with multiple subscription tiers and one-time purchases
- **AutoBolt Extension** - Chrome extension for automated form filling and submission
- **Queue Processing System** - Background job processing for large-scale directory submissions
- **Health Monitoring** - Real-time system health checks and performance monitoring

### Data Flow
1. User submits website URL for analysis via web interface
2. AI services analyze business profile, industry, and competitive landscape
3. Directory matching algorithm identifies relevant submission opportunities
4. Payment processing validates subscription tier and feature access
5. Queue system processes automated submissions via Chrome extension
6. Results are compiled into comprehensive business intelligence reports

---

## 📁 Project Structure [Partial Directory Tree]

```
DirectoryBolt/
├── pages/                          # Next.js pages and API routes
│   ├── api/                        # Backend API endpoints
│   │   ├── ai/                     # AI analysis endpoints
│   │   ├── analyze.ts              # Main website analysis API
│   │   ├── health.ts               # System health monitoring
│   │   └── stripe/                 # Payment processing
│   ├── dashboard/                  # User dashboard pages
│   ├── index.tsx                   # Homepage with SEO optimization
│   └── _app.tsx                    # App configuration
├── components/                     # React components by feature
│   ├── ai-portal/                  # AI analysis interface
│   ├── analytics/                  # Analytics dashboard
│   ├── dashboard/                  # User dashboard components
│   ├── directories/                # Directory selection and management
│   ├── staff-dashboard/            # Admin interface
│   └── ui/                         # Reusable UI components
├── lib/                           # Core utilities and services
│   ├── ai-services/               # OpenAI/Anthropic integrations
│   ├── database/                  # Supabase database layer
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Helper functions
│   └── queue-manager.js           # Background job processing
├── autobolt-extension/            # Chrome extension for automation
├── public/                        # Static assets and images
├── styles/                        # Global CSS and Tailwind config
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── netlify.toml                   # Deployment configuration
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `pages/api/analyze.ts` | Main business analysis API | Adding new analysis features |
| `lib/database/directories.ts` | Directory database operations | Managing directory data |
| `lib/types/ai.types.ts` | AI service type definitions | Extending AI functionality |
| `pages/_app.tsx` | App configuration and providers | Global app changes |
| `next.config.js` | Next.js build configuration | Build optimization |
| `tailwind.config.js` | Design system configuration | UI/styling changes |
| `netlify.toml` | Deployment and serverless config | Infrastructure changes |
| `package.json` | Dependencies and scripts | Adding new packages |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript (5.2+) - Full type safety across frontend and backend
- **Framework:** Next.js 14 with App Router - Server-side rendering and API routes
- **Database:** Supabase - PostgreSQL with real-time capabilities and fallback data system
- **Styling:** Tailwind CSS 3.4 - Utility-first CSS with custom design system

### Key Libraries
- **openai** - GPT integration for business analysis and competitive intelligence
- **stripe** - Payment processing and subscription management
- **@supabase/supabase-js** - Database operations and real-time updates
- **puppeteer-core** - Web scraping and automated form submission
- **framer-motion** - UI animations and micro-interactions
- **@headlessui/react** - Accessible UI components

### Development Tools
- **Jest** - Unit testing framework with AI service mocks
- **Playwright** - End-to-end testing for user flows
- **ESLint** - Code quality and Next.js best practices
- **TypeScript** - Static type checking and IntelliSense

---

## 🌐 External Dependencies

### Required Services
- **Supabase** - Primary database for directories, users, and analytics (with fallback data)
- **Stripe** - Payment processing for subscriptions and one-time purchases
- **OpenAI API** - Business analysis and content generation
- **Anthropic API** - Advanced AI analysis and competitive intelligence
- **Netlify** - Hosting platform with serverless functions and CDN

### Optional Integrations
- **Google Sheets** - Directory data import and management workflows
- **Google Analytics** - User behavior tracking and conversion metrics
- **Sentry** - Error monitoring and performance tracking

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=          # Stripe payment processing
OPENAI_API_KEY=            # AI business analysis
ANTHROPIC_API_KEY=         # Advanced AI features
SUPABASE_URL=              # Database connection
SUPABASE_SERVICE_KEY=      # Database admin access

# Optional
GOOGLE_PRIVATE_KEY=     # Directory data import
GA_MEASUREMENT_ID=         # Analytics tracking
SENTRY_DSN=               # Error monitoring
```

---

## 🔄 Common Workflows

### Website Analysis Workflow
1. User submits website URL via `/analyze` page
2. `pages/api/analyze.ts` validates URL and determines user tier
3. AI services analyze business profile and competitive landscape
4. Directory matching algorithm identifies relevant opportunities
5. Results compiled into comprehensive business intelligence report

**Code path:** `pages/analyze.tsx` → `pages/api/analyze.ts` → `lib/ai-services/` → `lib/database/directories.ts`

### Directory Submission Workflow
1. User selects directories from analysis results
2. Payment processing validates subscription tier access
3. Queue system schedules automated submissions
4. AutoBolt extension performs form filling and submission
5. Results tracked and reported in user dashboard

**Code path:** `components/directories/DirectorySelector.tsx` → `pages/api/queue/` → `lib/queue-manager.js` → `autobolt-extension/`

### Payment Processing Workflow
1. User selects subscription tier on pricing page
2. Stripe checkout session created with tier-specific features
3. Webhook processes successful payments and updates user access
4. Dashboard unlocks premium features based on subscription

**Code path:** `pages/pricing.tsx` → `pages/api/create-checkout-session.ts` → `pages/api/webhook.js` → `lib/database/`

---

## 📈 Performance & Scale

### Performance Considerations
- **AI API Optimization** - Request batching and response caching for analysis endpoints
- **Database Queries** - Optimized Supabase queries with proper indexing and fallback data
- **Image Optimization** - Next.js automatic image optimization with WebP/AVIF support
- **Bundle Splitting** - Automatic code splitting for optimal loading performance

### Monitoring
- **Health Checks** - `/api/health` endpoint monitors database, memory, and external APIs
- **Performance Metrics** - Lighthouse CI integration with 95+ score targets
- **Error Tracking** - Comprehensive error handling with fallback mechanisms
- **Usage Analytics** - AI token usage and cost optimization tracking

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **API Key Management** - All AI and payment keys stored in environment variables
- **Input Validation** - URL validation and sanitization for analysis endpoints
- **Rate Limiting** - API endpoints protected against abuse and excessive usage
- **CORS Configuration** - Strict origin validation for cross-origin requests

### 🤖 AI Service Management
- **Token Usage** - Monitor OpenAI/Anthropic API costs and implement usage limits
- **Fallback Handling** - Graceful degradation when AI services are unavailable
- **Response Validation** - Validate AI responses before presenting to users
- **Cost Optimization** - Implement caching and request batching for efficiency

### 💳 Payment Processing
- **Webhook Security** - Stripe webhook signature validation for payment events
- **Subscription Management** - Proper handling of subscription lifecycle events
- **Feature Gating** - Tier-based access control for premium features
- **Refund Handling** - Automated processes for subscription cancellations

*Updated at: 2025-01-08 UTC*