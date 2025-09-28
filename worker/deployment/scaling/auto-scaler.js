#!/usr/bin/env node

/**
 * DirectoryBolt AutoBolt Worker Auto-Scaler
 *
 * Reads Supabase queue depth and adjusts Docker worker replicas accordingly.
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const { createClient } = require("@supabase/supabase-js");

const execAsync = promisify(exec);

const SCALE_THRESHOLDS = [
  { depth: 500, workers: 8 },
  { depth: 300, workers: 6 },
  { depth: 100, workers: 4 },
  { depth: 50, workers: 2 },
];

class AutoScaler {
  constructor() {
    this.composeFile = process.env.COMPOSE_FILE || "worker/docker-compose.production.yml";
    this.serviceName = process.env.WORKER_SERVICE_NAME || "autobolt-worker";
    this.minWorkers = parseInt(process.env.MIN_WORKERS || "1", 10);
    this.maxWorkers = parseInt(process.env.MAX_WORKERS || "8", 10);
    this.pollInterval = parseInt(process.env.SCALER_INTERVAL_MS || "60000", 10);
    this.lastTarget = this.minWorkers;
    this.supabase = this.createSupabaseClient();
  }

  createSupabaseClient() {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for auto-scaler");
    }

    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async readQueueDepth() {
    const { count, error } = await this.supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      console.error("[auto-scaler] failed to read queue depth", error.message);
      throw error;
    }

    return count || 0;
  }

  computeTargetWorkers(queueDepth) {
    const threshold = SCALE_THRESHOLDS.find(({ depth }) => queueDepth >= depth);
    const target = threshold?.workers || this.minWorkers;
    return Math.min(Math.max(target, this.minWorkers), this.maxWorkers);
  }

  async scaleWorkers(target) {
    if (target === this.lastTarget) {
      console.log(`[auto-scaler] target unchanged (${target}), skipping scale operation.`);
      return;
    }

    console.log(`[auto-scaler] scaling ${this.serviceName} to ${target} replicas...`);

    try {
      await execAsync(
        `docker compose -f ${this.composeFile} up -d --scale ${this.serviceName}=${target}`,
      );
      this.lastTarget = target;
      console.log(`[auto-scaler] scaling complete. Active replicas: ${target}`);
    } catch (error) {
      console.error("[auto-scaler] scaling command failed", error.message);
      throw error;
    }
  }

  async runOnce() {
    try {
      const queueDepth = await this.readQueueDepth();
      const target = this.computeTargetWorkers(queueDepth);

      console.log(
        `[auto-scaler] queue depth=${queueDepth} | current=${this.lastTarget} | target=${target}`,
      );

      await this.scaleWorkers(target);
    } catch (error) {
      console.error("[auto-scaler] cycle failed", error);
    }
  }

  async start() {
    console.log("[auto-scaler] starting with interval", this.pollInterval, "ms");
    await this.runOnce();
    setInterval(() => {
      void this.runOnce();
    }, this.pollInterval);
  }
}

if (require.main === module) {
  try {
    const scaler = new AutoScaler();
    void scaler.start();
  } catch (error) {
    console.error("[auto-scaler] fatal error", error);
    process.exit(1);
  }
}

module.exports = AutoScaler;
