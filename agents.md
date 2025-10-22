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
🏗️ System Overview

DirectoryBolt is a SaaS platform that automates business directory submissions using a hybrid AI + headless browser architecture.

Submissions are orchestrated through a queue system in Supabase.

Jobs are processed by distributed Playwright workers running inside Docker containers.

The new AI-Enhanced Worker Process replaces the original static job execution loop, bringing probabilistic job selection, auto-form detection, and intelligent retries.

Primary Goals of the Agent Architecture:

Maximize successful directory submissions per minute.

Minimize human mapping and retry intervention.

Continuously learn from past submissions to optimize future outcomes.

🧭 High-Level Agent Architecture
[Customer Signup & Job Creation]
            ↓
[AIEnhancedQueueManager] → [SubmissionOrchestratorAgent]
            ↓
[AIEnhancedWorkerAgent (Playwright+AI)]
            ↓
[PerformanceFeedbackLoop + RetryAgent]
            ↓
[Supabase DB + Monitoring Dashboard]


All agents communicate via secure Netlify API endpoints.

Job state is persisted to Supabase (jobs, job_results, autobolt_submission_logs).

Agent decisions are logged and explainable (probabilities, confidence, mapping choices, retry categories).

🧰 Core Agents
1. 🤖 AIEnhancedQueueManager

Role: Intelligent job scheduler.
Trigger: Polls for next job from Supabase.
Responsibilities:

Pull all pending jobs.

Calculate success probability for each using trained AI scoring functions.

Select job with highest expected throughput, not oldest in queue.

Mark job in_progress and hand off to SubmissionOrchestratorAgent.

AI Inputs:

Job metadata (tier, business type)

Historical success data by category

Worker load balance

Directory category match rates

2. 🧭 SubmissionOrchestratorAgent

Role: Job supervisor and coordinator.
Trigger: Activated when job assigned.
Responsibilities:

Load directory package (50 / 100 / 300 / 500).

Filter out non-processable directories (captcha, login required, etc.).

Sort by AI priority scoring (timing, difficulty, historical patterns).

Spawn worker execution loop.

Maintain atomic job progress updates to Supabase.

Key Enhancements:

Real-time timing optimization (approval-window aware).

Adaptive job sequencing.

3. 🛠️ AIEnhancedWorkerAgent

Role: Executes directory submissions at scale.
Trigger: Receives one directory at a time from Orchestrator.
Responsibilities:

Compute AI Success Probability for this directory + business.

If score < 0.6, skip immediately.

Initialize AI services:

SubmissionTimingOptimizer

SuccessProbabilityCalculator

DescriptionCustomizer

AIFormMapper

IntelligentRetryAnalyzer

A/B Testing Framework

PerformanceFeedbackLoop

Route to appropriate executor:

Gemini for hard, anti-bot directories.

Playwright for standard directories.

Outputs: Submission result (success / failed / skipped) with full AI metadata.

4. 📝 AIFormMapper

Role: Dynamic form detection and mapping.
Trigger: Directory with no predefined mapping.
Responsibilities:

Analyze page HTML.

Detect form fields automatically.

Match fields to business data.

Return mapping with confidence scores.

Cache successful mappings in Supabase for reuse.

Impact:

Reduces manual mapping from hours to minutes.

80 %+ of new directories can now be processed automatically.

5. 🪄 DescriptionCustomizer

Role: Content optimization for submission forms.
Trigger: Pre-fill step for each directory.
Responsibilities:

Tailor business description to directory’s language and tone.

Insert keywords known to increase approval rates.

Use A/B testing framework to improve over time.

Example:
Generic → “DirectoryBolt is an AI-powered automation platform.”
ProductHunt-tailored → “DirectoryBolt helps startups boost visibility across 800+ platforms with AI-powered directory submissions.”

6. ⏰ SubmissionTimingOptimizer

Role: Time-aware decision agent.
Trigger: Before each directory submission.
Responsibilities:

Analyze approval rate patterns by directory and timezone.

Recommend best submission window.

Delay or log if suboptimal.

Benefit:

+15 % average approval improvement.

7. 🔁 IntelligentRetryAnalyzer

Role: AI-based failure analysis and retry planning.
Trigger: On failed submission.
Responsibilities:

Parse failure messages.

Classify failure: content, policy, technical, temporary.

Calculate retry probability and suggest improvements.

Schedule smart retry (vs. brute force).

Retry categories:
CONTENT_QUALITY | REQUIREMENTS_NOT_MET | WRONG_CATEGORY | TECHNICAL_ERROR | TEMPORARY_REJECTION | POLICY_VIOLATION

8. 📈 PerformanceFeedbackLoop

Role: Continuous learning layer.
Trigger: After every submission.
Responsibilities:

Log submission metadata (AI score, mapping, timing, status).

Update success/failure models.

Improve future probability estimates and content strategies.

Provide analytics to the dashboard and AI scoring.

9. 🧪 ABTestingFramework

Role: Optimize tactics through controlled variation.
Trigger: Randomized per submission.
Responsibilities:

Compare different wording, timing, form-fill strategies.

Store performance data for model improvement.

🧠 Additional Agents & Utility Layers

ProxyRotationAgent — Ensures IP rotation and geo-distribution for scale.

CaptchaSolverAgent — Integrates with external captcha-solving services for high-tier jobs.

LoggingAgent — Structured logging to Supabase and monitoring tools.

MonitoringAgent — Exposes metrics endpoints for Prometheus.

DashboardNotifierAgent — Real-time progress updates for staff UI.

🗂️ Data Flow with AI Agents
1. Job created in Supabase
2. QueueManager selects optimal job
3. Orchestrator loads and sorts directories
4. For each directory:
   - WorkerAgent computes AI score
   - TimingOptimizer runs
   - DescriptionCustomizer runs
   - AIFormMapper runs (if needed)
   - Submission executed
   - Result classified (submitted / failed / skipped)
   - RetryAnalyzer may trigger
   - FeedbackLoop records data
5. Job completes
6. Dashboard + database updated in real-time

🧾 Example Job Lifecycle
Step	Agent	Action	Output
1	AIEnhancedQueueManager	Select highest probability job	job #2025-10-22
2	SubmissionOrchestratorAgent	Load 50 directories, filter	42 processable
3	AIEnhancedWorkerAgent	Loop over directories	Submission results
4	AIFormMapper	Auto-detect selectors	Mapping confidence 0.87
5	DescriptionCustomizer	Tailor copy	Approval boost
6	TimingOptimizer	Check optimal window	Proceed
7	Playwright/Gemini	Submit form	Result: submitted
8	FeedbackLoop	Log + learn	Model updated
⚡ Technical Integration Points

API endpoints exposed via Netlify functions

/api/autobolt/jobs/next

/api/autobolt/jobs/update

/api/autobolt/jobs/complete

Database powered by Supabase (jobs, job_results, autobolt_submission_logs).

Workers run in Docker containers with Playwright.

Metrics exposed to Prometheus for scaling logic.

Staff dashboard connected to real-time updates via Supabase subscriptions.

🧭 Agent State & Monitoring

Each agent logs:

Decision timestamp

Confidence score

Selected strategy (e.g., Playwright vs Gemini)

Result classification

Processing time

Monitoring dashboards display:

Active jobs

Queue health

Success vs. failure trends

Mapping confidence distribution

AI vs. manual ratios over time

🚀 Roadmap for Agent Evolution

 Advanced multi-agent collaboration (parallelized submissions with dynamic backoff)

 Real-time AI scoring model fine-tuning from live job logs

 Feedback loop integration with reinforcement learning agent

 More granular retry strategies (content-specific variants)

 Predictive resource scaling based on queue load + AI probability

✅ In short: DirectoryBolt’s new AI-Enhanced Agent Architecture replaces a static pipeline with a probability-driven, self-optimizing submission engine, cutting submission time in half and boosting success rates by 40 %+.
