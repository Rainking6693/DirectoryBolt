# DirectoryBolt AI Coding Agent Instructions

## Project Overview
DirectoryBolt is an AI-powered business directory submission platform built with Next.js 14, TypeScript, Supabase, Stripe, and advanced AI integrations (OpenAI, Anthropic). It automates business analysis and submission to 480+ directories, with payment tiers and Chrome extension support.

## Architecture & Key Components
- **Frontend**: Next.js pages in `/pages`, React components in `/components` (grouped by feature)
- **Backend/API**: API routes in `/pages/api`, including AI analysis (`ai/`), health monitoring, and Stripe payment endpoints
- **AI Services**: Integrations in `/lib/ai-services/` (OpenAI, Anthropic)
- **Database**: Supabase-backed, logic in `/lib/database/`
- **Automation**: Chrome extension in `/autobolt-extension/` for automated submissions
- **Queue System**: Background job processing in `/lib/queue-manager.js`

## Developer Workflows
- **Start dev server**: `npm run dev`
- **Build**: `npm run build`
- **Type check**: `npm run type-check`
- **Lint**: `npm run lint`
- **Test (all)**: `npm run test:comprehensive`
- **E2E tests**: `npm run test:e2e`
- **AI integration tests**: `npm run test:ai-integration`

## Coding Conventions
- **Indentation**: 2 spaces (TypeScript/JavaScript)
- **File naming**: kebab-case for components, camelCase for utilities
- **Function/variable naming**: camelCase, descriptive
- **Linting**: ESLint, TypeScript strict mode

## Integration Patterns
- **AI Analysis**: Triggered via `/pages/api/analyze.ts`, flows through `/lib/ai-services/` and `/lib/database/directories.ts`
- **Directory Submission**: User selects in UI, processed via queue and Chrome extension
- **Payment**: Stripe endpoints in `/pages/api/stripe/`, webhooks update user access

## External Dependencies
- **Supabase**: Database, real-time updates
- **Stripe**: Payment, subscription tiers
- **OpenAI/Anthropic**: Business analysis, competitive intelligence
- **Netlify**: Hosting, serverless functions

## Security & Reliability
- **API keys**: Use environment variables
- **Input validation**: Strict URL checks in analysis endpoints
- **Rate limiting**: API endpoints protected
- **Webhook security**: Stripe signature validation

## Key Files & Directories
- `pages/api/analyze.ts`: Main analysis API
- `lib/database/directories.ts`: Directory DB logic
- `lib/ai-services/`: AI integrations
- `autobolt-extension/`: Chrome extension code
- `lib/queue-manager.js`: Background jobs
- `tests/`: All test suites

## Example Workflow: Website Analysis
1. User submits URL via UI
2. API (`analyze.ts`) validates and triggers AI
3. AI services analyze, match directories
4. Results returned, user selects directories
5. Queue schedules submissions, extension automates

## Tips for AI Agents
- Always validate external inputs and API responses
- Use provided build/test commands for reliability
- Reference feature-specific components for UI changes
- Follow strict typing and linting rules
- Use caching and batching for AI API efficiency

---
For more details, see `agents.md` and feature-specific docs in the repo.
