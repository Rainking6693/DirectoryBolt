#!/usr/bin/env node

/**
 * DirectoryBolt Proxy Manager
 *
 * Provides lightweight proxy rotation and health reporting for AutoBolt workers.
 * Proxies are supplied via the PROXY_LIST environment variable. Entries may use
 * either host:port or user:pass@host:port syntax and may be comma or newline separated.
 */

const http = require("http");
const { URL } = require("url");

const PORT = parseInt(process.env.PROXY_MANAGER_PORT || "3050", 10);

const parseProxyEntry = (entry) => {
  const trimmed = entry.trim();
  if (!trimmed) {
    return null;
  }

  // Support user:pass@host:port or host:port
  const [credentials, hostPart] = trimmed.includes("@")
    ? trimmed.split("@").slice(-2)
    : [null, trimmed];

  if (!hostPart || !hostPart.includes(":")) {
    return null;
  }

  const [host, port] = hostPart.split(":");
  if (!host || !port) {
    return null;
  }

  const proxy = { server: `${host}:${port}` };

  if (credentials) {
    const [username, password] = credentials.split(":");
    if (username) {
      proxy.username = username;
    }
    if (password) {
      proxy.password = password;
    }
  }

  return proxy;
};

class ProxyRotationService {
  constructor() {
    this.proxies = this.loadProxiesFromEnv();
    this.index = 0;
    this.metrics = {
      totalRequests: 0,
      rotations: 0,
      lastAssigned: null,
      failures: 0,
    };
  }

  loadProxiesFromEnv() {
    const raw = process.env.PROXY_LIST || "";
    const entries = raw
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map(parseProxyEntry)
      .filter(Boolean);

    return entries;
  }

  reload() {
    this.proxies = this.loadProxiesFromEnv();
    this.index = 0;
    return this.summary();
  }

  get nextProxy() {
    if (!this.proxies.length) {
      return null;
    }

    const proxy = this.proxies[this.index % this.proxies.length];
    this.index += 1;
    this.metrics.rotations += 1;
    this.metrics.lastAssigned = new Date().toISOString();
    return proxy;
  }

  summary() {
    return {
      available: this.proxies.length,
      lastAssigned: this.metrics.lastAssigned,
      totalRequests: this.metrics.totalRequests,
      rotations: this.metrics.rotations,
      failures: this.metrics.failures,
    };
  }
}

const service = new ProxyRotationService();

const jsonResponse = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const handleProxyNext = (req, res) => {
  service.metrics.totalRequests += 1;

  const proxy = service.nextProxy;
  if (!proxy) {
    service.metrics.failures += 1;
    return jsonResponse(res, 503, {
      error: "No proxies configured",
      available: 0,
    });
  }

  jsonResponse(res, 200, {
    proxy: proxy.server,
    username: proxy.username || null,
    password: proxy.password || null,
    assignedAt: new Date().toISOString(),
  });
};

const handleProxyStatus = (res) => {
  jsonResponse(res, 200, {
    status: service.proxies.length ? "ready" : "empty",
    ...service.summary(),
  });
};

const handleProxyReload = (res) => {
  const summary = service.reload();
  jsonResponse(res, 200, {
    status: summary.available ? "ready" : "empty",
    ...summary,
    reloadedAt: new Date().toISOString(),
  });
};

const handleHealth = (res) => {
  jsonResponse(res, 200, {
    status: service.proxies.length ? "ok" : "degraded",
    proxies: service.proxies.length,
    ...service.summary(),
    timestamp: new Date().toISOString(),
  });
};

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/proxy/next") {
      return handleProxyNext(req, res);
    }

    if (req.method === "GET" && url.pathname === "/proxy/status") {
      return handleProxyStatus(res);
    }

    if (req.method === "GET" && url.pathname === "/proxy/reload") {
      return handleProxyReload(res);
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return handleHealth(res);
    }

    jsonResponse(res, 404, { error: "Not found" });
  } catch (error) {
    service.metrics.failures += 1;
    jsonResponse(res, 500, { error: error.message || "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`?? Proxy Manager listening on port ${PORT}`);
  console.log(`?? Loaded ${service.proxies.length} proxies`);
});

const shutdown = () => {
  console.log("?? Shutting down proxy manager...");
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = service;
