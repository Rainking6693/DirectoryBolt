# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

DirectoryBolt is an enterprise-grade SaaS platform that automates business directory submissions across 480+ online directories. The system processes customers through tiered packages (Starter 50, Growth 100, Professional 300, Enterprise 500 directories) using AI-powered business analysis, Playwright worker automation, and a comprehensive staff monitoring dashboard.

## Development Commands

### Core Development Workflow
```powershell
# Start development server with repository sanitization
npm run dev

# Alternative guarded development with enhanced logging
npm run dev:guarded

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### Testing Commands
```powershell
# Run comprehensive test suite
npm run test:comprehensive

# End-to-end tests (Playwright)
npm run test:e2e

# Enterprise-grade testing with coverage
npm run test:enterprise

# Critical revenue flow tests
npm run test:critical

# AI service integration tests
npm run test:ai-integration

# Performance benchmarks
npm run test:performance

# Single test run with specific focus
npm run test:ai-accuracy
npm run test:cost-optimization

# Mobile-specific testing
npm run test:mobile
```

### Quality Assurance & Code Review
```powershell
# Enhanced code review system
npm run review:enhanced

# Quick code review (pre-commit)
npm run review:pre-commit

# Security validation
npm run security-test

# SEO validation testing
npm run test:seo

# Production deployment testing
npm run test:production
```

### Build & Deployment
```powershell
# Optimized build with pre-build optimization
npm run build:optimized

# Build analysis for bundle size
npm run build:analyze

# Fast build with increased memory allocation
npm run build:fast

# Netlify-specific build
npm run build:netlify

# Deployment readiness check
npm run deploy:ready
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 14 with App Router and TypeScript 5.6+
- **Database**: Supabase with PostgreSQL, RLS policies, and real-time subscriptions
- **Payments**: Stripe with webhook integration for subscription tiers
- **AI Services**: OpenAI and Anthropic Claude for business analysis and competitive intelligence
- **Deployment**: Netlify with global CDN and serverless functions
- **Testing**: Jest + Playwright + comprehensive enterprise QA suite
- **Styling**: Tailwind CSS with custom design system
- **Automation**: Playwright workers in Docker for automated directory submissions

### High-Level System Architecture

DirectoryBolt operates as a job queue-based system where:

1. **Customer Journey**: Payment (Stripe) → Business Info Collection → Job Queue Entry → Playwright Worker Processing → Staff Monitoring → Completion
2. **Job Orchestration**: Backend orchestrator (`jobs-next`) assigns jobs to Playwright workers, all data flows through Supabase
3. **Staff Dashboard**: Real-time monitoring with progress tracking, retry capabilities, and intervention tools
4. **AI Integration**: Business analysis and competitive intelligence for directory matching
5. **Automated Submission**: Playwright workers with form automation, captcha solving via 2Captcha, and proxy rotation

### Key Components

#### Backend API Structure (`pages/api/`)
- **`/api/jobs/`** - Job queue management and orchestration
  - `jobs/next.ts` - Orchestrator assigns next pending job to Playwright workers
  - `jobs/update.ts` - Worker updates job progress per directory
  - `jobs/complete.ts` - Mark jobs as complete/failed
- **`/api/staff/`** - Staff dashboard endpoints with authentication
- **`/api/analyze/`** - AI-powered business analysis
- **`/api/stripe/`** - Payment processing and webhooks
- **`/api/auth/`** - Authentication and user management

#### Database Schema (Supabase)
- **`customers`** - Customer business information and subscription data
- **`jobs`** - Job queue entries with status tracking (pending/in_progress/complete/failed)
- **`job_results`** - Per-directory submission results and logs
- **`directories`** - Master directory database with form mappings

#### Frontend Components (`components/`)
- **`staff-dashboard/`** - Real-time job monitoring and management
- **`ui/`** - Reusable UI components with Tailwind CSS
- **`layout/`** - Application layout components

#### Playwright Workers (`worker/`)
- Docker-containerized Playwright automation workers
- Headless browser automation for directory form submission
- Directory-specific form mapping and automation scripts
- 2Captcha integration for automated captcha solving
- Proxy rotation for high-volume Enterprise submissions

### Security & Authentication Patterns

- **Worker Authentication**: Playwright workers authenticate via secure API keys for job orchestration
- **Row Level Security (RLS)**: Supabase policies ensure data isolation between customers
- **Staff Authentication**: Protected staff routes with role-based access
- **Environment Variables**: All sensitive keys in `.env.local` or Netlify dashboard
- **Webhook Security**: Stripe signature validation for payment events

### Performance & Scaling Considerations

- **Job Queue System**: Orchestrator manages job assignment to prevent database overload from concurrent worker operations
- **Real-time Updates**: Supabase subscriptions for live dashboard updates
- **Worker Scaling**: Docker-based Playwright workers scale horizontally based on queue depth
- **Proxy & Captcha Integration**: 2Captcha and proxy rotation for Enterprise-tier volumes
- **Bundle Optimization**: <250KB target with code splitting and tree shaking
- **Database Performance**: Strategic indexing on job status, customer relationships

## Development Patterns

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path aliases configured (`@/*`, `@/components/*`, `@/lib/*`)
- Build-time type validation required for deployment

### Testing Strategy
- **Unit Tests**: Individual component and utility function testing
- **Integration Tests**: API endpoint and database integration validation
- **E2E Tests**: Complete user journey testing with Playwright
- **Performance Tests**: Load testing and benchmark validation
- **Enterprise QA**: 95%+ coverage standards with quality gates

### Code Quality Standards
- ESLint with Next.js configuration
- Husky pre-commit hooks for code quality
- Enhanced code review system with automated validation
- Performance monitoring with Lighthouse CI
- Security testing integrated into CI/CD pipeline

## Operational Workflows

### Customer Onboarding Flow
1. Plan selection and Stripe checkout
2. Webhook triggers job creation in Supabase
3. Business information collection and validation
4. Job enters queue with priority based on package tier
5. Backend orchestrator assigns job to available Playwright worker
6. Worker processes directory submissions with captcha solving and proxy rotation
7. Progress updates written back to Supabase in real-time
8. Staff monitoring dashboard provides complete visibility

### Staff Operations
- **Job Monitoring**: Real-time progress tracking with x/total completion status
- **Manual Intervention**: Retry failed submissions, pause/resume jobs
- **Performance Analytics**: Queue depth, completion rates, error analysis
- **Customer Support**: Access to detailed submission logs and failure analysis

### Failure Handling & Recovery
- **Transient Failures**: Automatic retry with exponential backoff (up to 3 attempts)
- **Permanent Failures**: Manual staff intervention with detailed error logs
- **System Failures**: Graceful degradation with customer communication
- **Data Integrity**: Comprehensive audit trails and backup procedures

## Environment Setup

### Required Environment Variables
```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://directorybolt.com

# Database & Authentication
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Worker Integration
WORKER_API_KEY=your_generated_api_key

# External Services
CAPTCHA_API_KEY=your_2captcha_key
PROXY_CREDENTIALS=your_proxy_config
```

### Local Development Setup
1. Clone repository and install dependencies: `npm install`
2. Configure environment variables in `.env.local`
3. Run repository sanitization: `npm run sanitize`
4. Start development server: `npm run dev`
5. Access application at `http://localhost:3000`

## Testing & Quality Assurance

### Pre-deployment Checklist
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Enterprise test suite passes (`npm run test:enterprise`)
- [ ] Security validation complete (`npm run security-test`)
- [ ] Performance benchmarks met (`npm run test:performance`)
- [ ] E2E tests pass across all browsers (`npm run test:e2e`)
- [ ] Production deployment test successful (`npm run test:production`)

### Quality Gates System
DirectoryBolt implements a comprehensive quality gate system with mandatory auditor approvals:
- **Database Integrity Validation**: Frank (Critical Database Investigator)
- **QA Standards Compliance**: Cora (QA Auditor)  
- **Code Quality Review**: Hudson (Code Reviewer)
- **End-to-End Integration**: Blake (Build Environment Detective)

### Performance Targets
- **API Response Times**: <500ms for all endpoints
- **Lighthouse Score**: 95+ across all metrics
- **Database Performance**: Handles 10x expected load
- **Bundle Size**: <250KB optimized
- **Uptime Target**: 99.9% availability

## AI Agent Integration Patterns

When working with DirectoryBolt's AI services:
- Use existing patterns in `/lib/ai-services/` for OpenAI and Anthropic integration
- Implement cost optimization strategies for API usage
- Follow established error handling patterns for AI service failures
- Validate AI responses before database storage
- Use caching strategies to minimize redundant API calls

## Playwright Workers Development

### Worker Architecture
- **Docker Containers**: Isolated execution environment for each worker
- **Playwright Automation**: Headless browser automation for form submission
- **Directory Mappings**: JSON configurations for each directory's form structure
- **Error Handling**: Comprehensive retry logic and failure reporting
- **Job Orchestration**: Workers pull jobs from backend orchestrator API
- **Captcha Integration**: 2Captcha service integration for automated solving
- **Proxy Management**: Rotating proxy support for high-volume submissions

### Testing Worker Integration
```powershell
# Test worker connectivity and job processing
npm run test:worker-smoke

# Validate directory form mappings
npm run test:ai-integration

# Test submission workflows end-to-end
npm run test:e2e-integration

# Test Docker worker scaling
npm run docker:build-worker
```

## Monitoring & Observability

### Health Check Endpoints
- `/api/health` - Basic system health validation
- `/api/metrics` - Prometheus-compatible metrics
- `/api/status` - Detailed system status including queue depth

### Key Metrics Tracked
- Job queue depth and processing rate
- Playwright worker connectivity and performance
- Worker scaling and resource utilization
- Directory submission success/failure rates
- Customer conversion funnel performance
- Staff dashboard usage analytics

### Alerting & Escalation
- Real-time monitoring of critical revenue flows
- Automated alerts for system degradation
- Staff notification system for job failures
- Emergency escalation procedures for critical issues

## Deployment Pipeline

DirectoryBolt uses Netlify with comprehensive CI/CD:
1. **Pre-build**: Repository sanitization and validation
2. **Build**: Optimized production build with Next.js
3. **Testing**: Complete test suite execution
4. **Security**: Vulnerability scanning and validation
5. **Deployment**: Atomic deployment with rollback capability
6. **Post-deployment**: Health checks and performance validation

### Production Considerations
- Environment-specific configuration management
- Database migration procedures  
- SSL/TLS certificate management
- CDN configuration and caching strategies
- Backup and disaster recovery procedures