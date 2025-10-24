# 🌐 DirectoryBolt — Complete System Overview

**Version:** 2.0 (AI-Enhanced)  
**Last Updated:** October 2025  
**Status:** ✅ Production

---

## 🧭 Introduction

DirectoryBolt is a **SaaS platform that automates directory submissions** for small businesses, freelancers, and agencies. It uses **AI-enhanced workers**, **smart job scheduling**, and **auto-form mapping** to place business listings across **hundreds of online directories** with maximum efficiency and approval rates.

The platform replaces manual submissions with a **probability-driven orchestration system**, cutting processing time by more than 50 % and increasing success rates by 40 % or more.

---

## 🧰 Core Platform Components

- **AI Queue Manager** — selects the most promising jobs to run next.  
- **Submission Orchestrator** — supervises directory batches and prioritization.  
- **AI Worker Agent** — executes each submission intelligently.  
- **AI Form Mapper** — auto-detects and maps forms to reduce manual mapping.  
- **Description Customizer** — tailors business copy to directory tone.  
- **Timing Optimizer** — finds best submission windows for higher approval rates.  
- **Retry Analyzer** — classifies failures and suggests targeted retries.  
- **Feedback Loop** — learns from every submission to improve future runs.

---

## 🧱 Technical Architecture

DirectoryBolt uses a **modular, scalable stack** built for high throughput:

- **Frontend**: Next.js + React (staff dashboard)  
- **Backend**: Netlify Functions (API orchestration)  
- **Database**: Supabase (auth, jobs, results, logging)  
- **Workers**: Playwright in Docker (headless browsers)  
- **AI Services**: Internal Claude/Gemini-based modules for decision-making  
- **Proxies + Captcha Solver**: For higher-tier directory packages  
- **Prometheus Metrics**: Scaling and monitoring

### 🛰️ Data Flow

```
Customer Signup → Stripe Payment → Supabase Job Queue
→ AIEnhancedQueueManager selects optimal job
→ SubmissionOrchestrator loads directory batch
→ AIEnhancedWorker processes each directory intelligently
→ FeedbackLoop learns from outcome
→ Dashboard updates in real time
```

---

## ⚙️ Core Features

### 1. Automated Directory Submissions
- Up to 500 directories per job.  
- Auto-form detection for unmapped sites.  
- Tailored descriptions for better approvals.

### 2. Smart Job Scheduling
- AI selects job with highest success probability instead of FIFO.  
- Maximizes worker efficiency and platform throughput.

### 3. Adaptive Learning
- AI Feedback Loop improves over time.  
- Learns which directories work best with which types of businesses.

### 4. Intelligent Retries
- Failed submissions analyzed.  
- AI recommends whether and how to retry.  
- Boosts retry success by 75 %.

### 5. Real-Time Monitoring
- Staff dashboard shows live job state, directory status, and success metrics.  
- Prometheus metrics for scaling and alerts.

---

## 🧠 Agent Architecture

```
[AIEnhancedQueueManager]
        ↓
[SubmissionOrchestratorAgent]
        ↓
[AIEnhancedWorkerAgent]
        ↓
[PerformanceFeedbackLoop + RetryAnalyzer]
        ↓
[Supabase DB + Dashboard]
```

| Agent | Function | Enhancement |
|-------|-----------|-------------|
| Queue Manager | Smart job selection | Probability scoring |
| Orchestrator | Batch coordination | AI priority sorting |
| Worker | Directory execution | AI-assisted processing |
| Form Mapper | Auto field mapping | 80%+ automation |
| Description Customizer | Content tailoring | Better approvals |
| Timing Optimizer | Approval window detection | +15% rate |
| Retry Analyzer | Intelligent retry | Targeted improvements |
| Feedback Loop | Self-learning | Continuous optimization |

---

## 🧾 Job Lifecycle Example

1. Customer signs up and selects a package (e.g., 50 directories).  
2. Stripe checkout confirms payment.  
3. Supabase records a new job.  
4. AI queue selects the optimal job to process.  
5. Worker loads directory batch → filters unprocessable → sorts by priority.  
6. Each directory gets an AI score. Low-score directories are skipped.  
7. Auto-form mapping fills fields with human-like typing.  
8. Submissions executed via Playwright or Gemini (if complex).  
9. Results classified (submitted, failed, skipped).  
10. FeedbackLoop learns patterns; retry suggestions stored.  
11. Job completes, dashboard updates in real time.

---

## 🛡️ Infrastructure

- **Netlify Functions** — `/jobs-next`, `/jobs-update`, `/jobs-complete`, `/metrics`  
- **Supabase** — Auth, job queue, logs, retries  
- **Docker Worker Cluster** — Horizontal scaling of Playwright bots  
- **Proxy & Captcha Services** — Reliability for Enterprise tier  
- **Prometheus & Alerts** — Health checks, scaling metrics

---

## 📊 Performance Gains with AI

| Metric | Before AI | After AI | Improvement |
|--------|-----------|----------|-------------|
| Avg Submission Time | 3–4 min | 1–2 min | 50% faster |
| Success Rate | 45% | 70–80% | +40% |
| Mapping Time | Manual | 80% Auto | 10× faster |
| Retry Efficiency | Blind | AI targeted | +75% success |

---

## 🧭 Monitoring & Logging

- All agent decisions logged with confidence scores.  
- Dashboard displays active jobs, directories processed, retry recommendations.  
- Prometheus metrics drive auto-scaling.

**Example logged metadata:**  
```
{
  directory: "Product Hunt",
  ai_score: 0.85,
  ai_customized: true,
  form_mapping_confidence: 0.91,
  timing_optimal: true,
  processing_time_ms: 12500,
  result: "submitted"
}
```

---

## 🧭 Future Roadmap

- Advanced multi-agent parallelization.  
- Real-time model tuning.  
- Predictive scaling based on queue load.  
- Content-specific retry variants.  
- Reinforcement learning agent.

---

## ✅ Summary

DirectoryBolt is an **AI-driven submission engine** designed for scale, speed, and precision.  
Through agentic automation, it **cuts submission time in half**, **increases approval rates dramatically**, and **continuously learns to get better** with every directory processed.

**Core Pillars:**  
- Smart orchestration.  
- AI decision-making.  
- Continuous feedback loops.  
- Scalable infrastructure.

---

© 2025 DirectoryBolt — Automated Visibility. Smarter. Faster.
