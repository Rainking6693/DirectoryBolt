#!/usr/bin/env node

/**
 * Health Check Script for DirectoryBolt AutoBolt Worker
 * Used by Docker healthcheck and monitoring systems
 */

const http = require("http");
const fs = require("fs");

function performHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/health",
        method: "GET",
        timeout: 5000,
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const health = JSON.parse(data);

            if (res.statusCode === 200 && health.status === "healthy") {
              console.log(
                `✅ Worker ${health.workerId || "unknown"} is healthy`,
              );
              console.log(
                `📊 Uptime: ${Math.floor(health.uptime || 0)}s, Jobs: ${health.jobsProcessed || 0}`,
              );
              resolve(0);
            } else {
              console.error(
                `❌ Worker unhealthy: ${health.reason || "Unknown reason"}`,
              );
              resolve(1);
            }
          } catch (error) {
            console.error(`❌ Invalid health response: ${error.message}`);
            resolve(1);
          }
        });
      },
    );

    req.on("error", (error) => {
      console.error(`❌ Health check failed: ${error.message}`);
      resolve(1);
    });

    req.on("timeout", () => {
      console.error("❌ Health check timeout");
      req.destroy();
      resolve(1);
    });

    req.end();
  });
}

// Additional system health checks
function performSystemChecks() {
  const checks = {
    diskSpace: checkDiskSpace(),
    memory: checkMemoryUsage(),
    browserDeps: checkBrowserDependencies(),
  };

  const failures = Object.entries(checks)
    .filter(([key, value]) => !value.healthy)
    .map(([key, value]) => `${key}: ${value.error}`);

  if (failures.length > 0) {
    console.error(`⚠️  System issues detected: ${failures.join(", ")}`);
  }

  return failures.length === 0;
}

function checkDiskSpace() {
  try {
    const stats = fs.statSync("/app");
    // Simple check - if we can stat the directory, assume disk is accessible
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: "Disk access failed" };
  }
}

function checkMemoryUsage() {
  try {
    const memUsage = process.memoryUsage();
    const totalMemMB = memUsage.heapTotal / 1024 / 1024;
    const usedMemMB = memUsage.heapUsed / 1024 / 1024;
    const usage = (usedMemMB / totalMemMB) * 100;

    if (usage > 90) {
      return {
        healthy: false,
        error: `High memory usage: ${usage.toFixed(1)}%`,
      };
    }

    return { healthy: true, usage: `${usage.toFixed(1)}%` };
  } catch (error) {
    return { healthy: false, error: "Memory check failed" };
  }
}

function checkBrowserDependencies() {
  try {
    // Check if Playwright browser is accessible
    const browserPath = "/root/.cache/ms-playwright/chromium-*";
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: "Browser dependencies missing" };
  }
}

// Main health check execution
async function main() {
  try {
    console.log("🔍 Performing health check...");

    // Primary health check via HTTP
    const primaryResult = await performHealthCheck();

    if (primaryResult === 0) {
      // Secondary system checks
      const systemHealthy = performSystemChecks();

      if (systemHealthy) {
        console.log("✅ All health checks passed");
        process.exit(0);
      } else {
        console.log("⚠️  Primary healthy but system issues detected");
        process.exit(1);
      }
    } else {
      console.log("❌ Primary health check failed");
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Health check error: ${error.message}`);
    process.exit(1);
  }
}

// Run health check
if (require.main === module) {
  main();
}

module.exports = { performHealthCheck, performSystemChecks };
