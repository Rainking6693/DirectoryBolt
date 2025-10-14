# Genesis Rebuild Master Roadmap

> Seamless hand-off from prior Claude-led sessions. Continue execution without breaking the Hetzner VPS baseline (`genesis-agent-01`, Ubuntu 22.04, Python 3.12.3 venv). All legacy automations remain intact in `~/genesis-agent-system`; the rebuild happens in `~/genesis-rebuild`.

---

## 1. Mission & Builder Commitment

- **Mission**: Rebuild Genesis as a recursive, zero-touch platform that can launch, operate, and retire 100+ autonomous businesses. Each business is an agentic system that can hire other agents, transact in the internal economy, and improves the collective network.
- **Commitment**: Obey the roadmap. Use only production-ready SDKs, APIs, and frameworks (Microsoft Agent Framework, A2A protocol, Stripe, Vercel, MongoDB, etc.). No bespoke agent runtimes.
- **Success Metric**: Preserve the historical 100% success rate and <$0.20 marginal cost per business. Every runtime tweak must retain observability, safety, and rollback paths.

---

## 2. Current Status (Day 1 – Foundation Reset)

- Seven-day rebuild schedule; we are midway through Prompt A.
- Environment verification complete:
  - SSH as `genesis@genesis-agent-01`.
  - Python 3.12.3 within venv (`source ~/genesis-rebuild/.venv/bin/activate`).
  - `pip install azure-ai-agent-framework` produced `agent-framework 1.0.0b251007`, `a2a-sdk 0.3.8`.
- `~/genesis-rebuild/genesis_orchestrator.py` drafted using `agent_framework.ChatAgent` with `gpt-4o-mini`; API keys confirmed (OpenAI, Anthropic, Google AI Studio, Azure, Stripe test).
- Next immediate tasks for Prompt A:
  1. Save the orchestrator (`nano`, then `Ctrl+X`, `Y`, `Enter`).
  2. Create `test_agent.py` (<20 lines) from Microsoft basic-agent sample.
  3. Run orchestrator and confirm “Hello, confirm spawn” response.
  4. Verify console traces (observability on the VPS).
  5. Integrate the legacy `intent_abstraction.py` as a Framework tool once base loop passes.

---

## 3. Philosophy & Non-Negotiables

1. **Battle-tested building blocks** only—if Microsoft/OpenAI/Google provide an SDK, use it before writing glue code.
2. **Migration without disruption**—legacy agents stay running until their Framework equivalents are validated.
3. **Observability first**—OpenTelemetry hooks, structured logging, prompt shields, and safety rails before scaling traffic.
4. **Economy-aware design**—x402 protocol via Sei Network for micropayments; ensure agent actions can be priced and audited.
5. **Learning loops everywhere**—every interaction becomes training data for the next revision (see §6).

---

## 4. Production Stack Overview

| Layer | Component | Purpose | Notes |
| --- | --- | --- | --- |
| Orchestration | Microsoft Agent Framework | Durable workflows, observability, Entra auth | Replace AutoGen & Semantic Kernel entirely |
| Communication | A2A Protocol + MCP bridge | Standard agent-to-agent messaging | Align with Linux Foundation spec (Sept 2025 merger) |
| Models | GPT-4o (strategy), Claude 4 Sonnet (code), Gemini 2.5 Flash (throughput), DeepSeek R1 (fallback) | Multi-model, cost-balanced | Configure via Agent Framework’s multi-provider support |
| Self-Improvement | Darwin Gödel Machine + **Early Experience loop** | Autonomous code evolution & reflection | See §6.1 for integration details |
| Memory | MongoDB + Redis + **ReasoningBank** | Consensus, personas, whiteboard, distilled strategies | Optimise KV-cache hits, enforce TTL policies |
| Economy | x402 + Stripe | Autonomous payments & revenue share | Connect to internal marketplace and partner APIs |
| Tooling | Gemini Computer Use, legacy Intent Abstraction, Vertex AI Extensions | Browser control, intent compression | Instrument with test coverage before enabling auto-run |
| Deployment | GitHub Actions → Vercel (front-end) + VPS (agents) | Split control-plane vs data-plane | Keep VPS as canonical training sandbox |

---

## 5. Layered Architecture (Expanded)

### 5.1 Layer 1 — Genesis Meta-Agent
- Acts as portfolio manager: spawns/kills businesses, allocates compute, enforces safety thresholds.
- Runs on Microsoft Agent Framework long-lived workflow with OpenTelemetry traces exported to Azure Monitor.

### 5.2 Layer 2 — Self-Improving Agents (Evolution Loop)
- **Baseline**: Darwin Gödel Machine (DGM) workflow—agents rewrite their code, run benchmarks, accept improvements after passing regression checks.
- **New Additions (Agent Learning via Early Experience)**:
  - **Reward-free Early Experience Loop**: log each `(state, action, observation)` from production and rehearsal traces; fine-tune policies off-policy using implicit world modelling before any reward signals exist.
  - **Implicit World Models**: lightweight models predict next state and outcome probability; use them to validate candidate code edits in sandbox before deployment.
  - **Self-Reflection Harness**: after unsuccessful attempts, auto-generate “what went wrong / next try” rationales. Store alongside trace and feed into the replay buffer for the next iteration.
  - **Contrastive Signal Tracking**: tag every reflection with outcome metadata (win / loss). Promote only reflections that improved success rate; demote noisy advice.
  - **RL Warm-Start**: treat successful early-experience checkpoints as initial policy for future reinforcement learning tasks (when verifiable rewards become available).

### 5.3 Layer 3 — Agent Communication
- Adopt A2A JSON-RPC operations for task lifecycle (accept, in-progress, complete, abort).
- Integrate MCP servers for tools (GitHub, Google Workspace, Stripe, etc.).
- Require OAuth 2.1 / Entra ID handshake per partner org.

### 5.4 Layer 4 — Agent Economy
- Transactions denominated through x402 (Sei Network) with sub-cent precision.
- Maintain Stripe test keys for charge simulations; implement human sign-off for payments >$50.
- Log every internal purchase between agents for auditing and ROI analysis.

### 5.5 Layer 5 — Swarm Optimisation
- Use SwarmAgentic research patterns (Particle Swarm + evolutionary exploration) to auto-design team compositions.
- Feed diversity metrics from TUMIX (tool-use mixtures) into the optimiser to ensure heterogeneous capabilities per business unit.
- Smart termination (LLM-as-judge) reduces redundant iterations; minimum 2 refinement rounds, max 5 unless judge flags novelty.

### 5.6 Layer 6 — Shared Memory & Collective Intelligence
- Three-tier memory: consensus procedures, persona libraries, collaborative whiteboards.
- **ReasoningBank Integration (Scaling Agent Memory)**:
  - Distil both successful and failed trajectories into reusable “strategy nuggets” (e.g., “if invoice sync stalls → pull ledger snapshot first”).
  - Tag strategies with task metadata, environment, and tool usage; surface the nearest neighbours as context when a new task begins.
  - Couple with **Memory-Aware Test-Time Scaling (MaTTS)**—use ReasoningBank to seed diverse agent rollouts, allocate extra compute to promising branches, and stop early when new runs mirror previous conclusions.
  - Maintain contrastive evaluations; prune memory items that do not increase win rate or reduce steps.

---

## 6. Learning Systems & Feedback Loops

### 6.1 Early Experience Pipeline
1. **Capture**: Structured logging for every decision (inputs, tool calls, observations, final result).
2. **Replay Buffer**: Store raw traces in Redis Streams; nightly batch to MongoDB for long-term storage.
3. **Implicit Modelling**: Fine-tune lightweight world models to predict next-state; use them to sanity-check agent proposals.
4. **Reflection Module**: Agents generate self-critique summarising errors and future adjustments.
5. **Policy Update**: Fine-tune agent prompts / adapters using successful reflections; schedule LoRA updates weekly.
6. **Evaluation**: Benchmark on SWE-Bench/Gemini internal tasks; promote models only if success rate improves without regressions.

### 6.2 Memory-Aware Test-Time Scaling
1. Spawn diverse agent variants (text-only, code-heavy, search-heavy) inspired by TUMIX.
2. For each task, let ReasoningBank recommend the top-N strategy snippets, one per variant.
3. Run agents in parallel for two iterations minimum. After each round:
   - Share intermediate answers across agents.
   - Use LLM judge to decide whether to continue (stop if answers converge and confidence high).
4. Track cost per path; cap total compute at 49% of budget when early convergence flagged.

### 6.3 Continuous Instrumentation
- Version every prompt, adapter, and policy artefact. Keep changelog in `~/genesis-rebuild/logs`.
- Integrate OpenTelemetry spans for:
  - `span.kind=internal`: reflection generation, world-model predictions.
  - `span.kind=tool`: external API usage with cost metrics.
- Observability dashboards include:
  - Success rate per business unit.
  - Token usage before/after ReasoningBank suggestion.
  - Reflection effectiveness (win delta after adoption).

---

## 7. Execution Roadmap (Prompts A–G)

### Prompt A — Foundation Reset (Day 1)
1. Complete environment verification (done).
2. Finalise `genesis_orchestrator.py` (import fixes + config).
3. Create `test_agent.py` (<20 lines) from Microsoft basic-agent sample.
4. Run orchestrator; capture logs proving agent spawn & response.
5. Verify telemetry export (console + OpenTelemetry).
6. Stage Intent Abstraction tool (wrap `infrastructure/intent_abstraction.py` via Agent Framework tool interface once base agent validated).
7. Log outputs and screenshots to the run journal.

### Prompt B — Specification Convergence (Day 2)
- Run Spec Agent via Framework using official templates.
- Connect to ReasoningBank memory (read-only) to provide design precedents.
- Deliver signed-off specs for first migrated business.

### Prompt C — Builder Loop (Day 3)
- Use Builder Agent (Claude Sonnet default) to generate code from specs.
- Enforce early-experience capture: every build attempt writes to replay buffer.
- Ensure unit tests for new tools and memory connectors.

### Prompt D — Tool & Intent Migration (Day 4)
- Wrap legacy tools (Intent Abstraction, computer use flows) as Agent Framework tools.
- Enable Reflection harness; track failure rationales in ReasoningBank.
- Validate TUMIX-inspired diverse agent pool for QA vs Deploy.

### Prompt E — Deployment & Economy (Day 5)
- Configure Stripe/x402 sandbox transactions.
- Deploy updated orchestrator via GitHub Actions; keep VPS as control-plane.
- Smoke-test payments, telemetry, and kill-switch flows.

### Prompt F — Scaling & Marketplace (Day 6)
- Launch internal marketplace (MuleRun reference) with pricing tiers (Free 50/day, Standard 2000/month, Premium 10 000/month).
- Track compute tokens per agent; auto-scale via Hetzner upgrades (CPX51+) or horizontal VPS clustering.
- Run memory-aware test-time scaling for the first 15-agent portfolio.

### Prompt G — Autonomous Decision Loop (Day 7)
- Enable meta-agent to autonomously spawn/retire businesses using reflection metrics and ROI.
- Formalise human-in-the-loop gates for high-risk operations (payments >$1,000, data export).
- Publish final report: success metrics, cost per business, roadmap for next iteration.

---

## 8. Migration Checklist

- [ ] Keep `~/genesis-agent-system` untouched until the new Framework agents pass full regression.
- [ ] Copy Intent Abstraction layer into Framework tool module; add regression tests verifying 97 % cost reduction.
- [ ] Port Gemini Computer Use workflows (Phase 2B) to Framework tasks—deploy behind feature flag until Day 4 validation.
- [ ] Maintain 4.2 min build time by caching dependencies within venv and reusing warmed prompts.
- [ ] Document every migrated component in the run journal (`docs/genesis-migration-log.md`).

---

## 9. Operational Guardrails

- **Budget**: $200 total ($150 ads, $50 API). Track spend via Stripe dashboards + OpenAI usage API.
- **Observability**: Enable prompt shields, LLM guardrails, and human approval toggles for high-risk tasks.
- **Security**: OAuth 2.1 everywhere; sandbox untrusted code; maintain allowlist for tool execution.
- **Incident Response**: If unexpected filesystem or code changes appear, pause immediately and escalate to operator.

---

## 10. Required Readings & References

1. *Genesis Agent Rebuild Executive Summary* — six-layer architecture, ROI, research links.
2. *??? Genesis Agent System – Master Roadmap* — historical Phase 2A achievements, 15-agent roster, Intent Abstraction details.
3. *Genesis Rebuild – Progress Tracker (Day 1)* — granular checklist; use Microsoft samples.
4. Research papers:
   - **Agent Learning via Early Experience** — reward-free loops, implicit world models, self-reflection.
   - **ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory** — strategy distillation, MaTTS.
   - **TUMIX: Multi-Agent Test-Time Scaling with Tool-Use Mixture** — diverse tool strategies, adaptive early stopping.
5. Prompting references: ReAct, Automatic Prompt Engineering, CoT React notebooks.
6. Microsoft Agent Framework samples: `basic-agent.py`, `group-chat.py`, `tool-calling.py`.

Keep annotated notes for each source and link them in the run journal.

---

## 11. VPS Quickstart Checklist

- [ ] `ssh genesis@genesis-agent-01`
- [ ] `cd ~/genesis-rebuild`
- [ ] `source .venv/bin/activate`
- [ ] `python --version` → `Python 3.12.3`
- [ ] `pip show agent-framework` → `1.0.0b251007`
- [ ] `pip show a2a-sdk` → `0.3.8`
- [ ] Run `python genesis_orchestrator.py` after `test_agent.py` is created and saved.
- [ ] Capture logs and add to `~/genesis-rebuild/logs/day1.txt`.

---

## 12. Artifact Tracking

- Maintain a single markdown log (`docs/genesis-run-log.md`) capturing:
  - Date, prompt, files touched, commands run, screenshots.
  - Reflection outcomes (“what worked / what failed / next iteration”).
  - Cost and compute metrics per session.

---

## 13. Escalation & Safety

- **Unexpected File Drift**: Stop, capture diff, ask operator before continuing.
- **Payment Operations**: Manual review if aggregate spend >$150 or single payout >$50.
- **External Integrations**: No network changes without explicit approval (even though network is enabled).
- **Legacy Assets**: Do not delete or overwrite files in `~/genesis-agent-system` until the new stack is fully validated and backed up.

---

## 14. Forward Looking Enhancements

- Integrate Vertex AI Agent Builder for hybrid deployments once Framework baseline stable.
- Automate ReasoningBank pruning with reinforcement learning (as per paper recommendations).
- Extend early-experience pipeline to support cross-environment transfer learning (e.g., web nav ↔️ software agents).
- Explore Gemini Computer Use expansion to QA & Deploy agents once Prompt D tasks complete.

---

### Final Reminder

Continue executing Prompt A immediately: save orchestrator, build `test_agent.py`, run genesis, capture traces. Only after validation should you progress to Prompt B. Document everything—the next agent in the loop must be able to pick up without context loss.



