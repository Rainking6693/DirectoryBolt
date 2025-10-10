# Repository Guidelines

# - Repository Structure

## Project Structure & Module Organization

follows a standard Next.js 14 structure with TypeScript. Source code is organized in `/pages` for Next.js pages and API routes, `/components` for React components grouped by feature (ai-cleanup, receipts, reports, client-portal, etc.), `/lib` for utilities, database connections, AI services, and type definitions, and `/public` for static assets. The `/integrations` directory contains QuickBooks API and OCR service integrations.

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

# Database tests
npm run test:db
```

