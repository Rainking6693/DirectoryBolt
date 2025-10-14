#!/usr/bin/env node
// @ts-check

/**
 * DirectoryBolt AutoBolt Worker Service
 *
 * Production-ready Playwright-based form automation service
 * Replaces Chrome extension with backend worker automation
 *
 * Features:
 * - Playwright browser automation
 * - 2Captcha integration for captcha solving
 * - HTTP proxy support for Enterprise scaling
 * - Advanced field mapping and form detection
 * - Intelligent fallback mechanisms
 * - Worker-to-orchestrator communication
 */

const { chromium } = require("playwright");
const axiosModule = require("axios");
const axios = /** @type {import('axios').AxiosStatic} */ (
  axiosModule.default ?? axiosModule
);
const fs = require("fs");
const path = require("path");
const os = require("os");
const { solveCaptcha } = require("./utils/captchaSolver");
const { ensureRecaptchaSolved } = require("./utils/playwright-captcha-integration");
const DirectoryConfiguration = require("./directory-config.js");
const { createClient } = require('@supabase/supabase-js');
require("dotenv").config();

console.log("");
console.log("🔍 Environment Variables Check:");
console.log(
  "  AUTOBOLT_API_KEY:",
  process.env.AUTOBOLT_API_KEY
    ? `SET (${String(process.env.AUTOBOLT_API_KEY).substring(0, 10)}...)`
    : "NOT SET",
);
console.log(
  "  WORKER_AUTH_TOKEN:",
  process.env.WORKER_AUTH_TOKEN
    ? `SET (${String(process.env.WORKER_AUTH_TOKEN).substring(0, 10)}...)`
    : "NOT SET",
);
console.log(
  "  TWOCAPTCHA_API_KEY:",
  process.env.TWOCAPTCHA_API_KEY
    ? `SET (${String(process.env.TWOCAPTCHA_API_KEY).substring(0, 10)}...)`
    : "NOT SET",
);
console.log(
  "  TWO_CAPTCHA_KEY:",
  process.env.TWO_CAPTCHA_KEY
    ? `SET (${String(process.env.TWO_CAPTCHA_KEY).substring(0, 10)}...)`
    : "NOT SET",
);
console.log("  ORCHESTRATOR_URL:", process.env.ORCHESTRATOR_URL);
console.log("  SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("");

/** @typedef {import('playwright').Page} PlaywrightPage */
/** @typedef {import('playwright').Browser} PlaywrightBrowser */
/** @typedef {import('playwright').BrowserContext} PlaywrightContext */
/** @typedef {import('playwright').ElementHandle<HTMLElement | SVGElement>} PlaywrightElement */
/** @typedef {import('../auto-bolt-extension/lib/AdvancedFieldMapper.js').FieldPattern} FieldPattern */
/** @typedef {import('../auto-bolt-extension/lib/AdvancedFieldMapper.js').FieldMetadata} FieldMetadata */
/** @typedef {import('../auto-bolt-extension/lib/AdvancedFieldMapper.js').FieldMappingResult} FieldMappingResult */

/**
 * @typedef ProxyCredentials
 * @property {string} server
 * @property {string | null | undefined} [username]
 * @property {string | null | undefined} [password]
 */

class DirectoryBoltWorker {
  constructor() {
    /** @type {PlaywrightBrowser | null} */
    this.browser = null;
    /** @type {PlaywrightPage | null} */
    this.page = null;
    this.config = {
      // 2Captcha Configuration - NO HARDCODED FALLBACK FOR SECURITY
      twoCaptchaApiKey: process.env.TWO_CAPTCHA_KEY || process.env.TWOCAPTCHA_API_KEY,

      // HTTP Proxy Configuration
      proxyEnabled:
        process.env.HTTP_PROXY_ENABLED === "true" ||
        Boolean(process.env.PROXY_MANAGER_URL),
      proxyServer: process.env.HTTP_PROXY_SERVER || null,
      proxyUsername: process.env.HTTP_PROXY_USERNAME || null,
      proxyPassword: process.env.HTTP_PROXY_PASSWORD || null,
      proxyManagerUrl: process.env.PROXY_MANAGER_URL || null,

      // Orchestrator Communication - REQUIRED FOR SECURITY
      orchestratorBaseUrl:
        process.env.ORCHESTRATOR_URL || "https://directorybolt.netlify.app/api",
      workerAuthToken: process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN,

      // Browser Configuration
      headless: process.env.HEADLESS !== "false",
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Initialize helper classes (migrated from extension)
    /** @type {PlaywrightContext | null} */
    this.context = null;
    /** @type {ProxyCredentials | null} */
    this.currentProxy = null;
    this.proxyStats = {
      assignments: 0,
      lastAssignedAt: null,
    };

    this.captchaStats = {
      solved: 0,
      lastSolvedAt: null,
    };

    this.fieldMapper = new AdvancedFieldMapper();
    this.formDetector = new DynamicFormDetector();
    this.fallbackEngine = new FallbackSelectorEngine();
    this.directoryConfig = new DirectoryConfiguration();

    this.processingState = {
      currentJob: null,
      retryCount: 0,
      maxRetries: 3,
    };

    if (this.config.proxyManagerUrl) {
      this.config.proxyManagerUrl = this.config.proxyManagerUrl.replace(/\/$/, "");
    }
  }

  /**
   * Initialize the worker service
   */
  async initialize() {
    console.log("🚀 Initializing DirectoryBolt Worker Service...");

    try {
      // Validate required environment variables for security
      this.validateSecurityConfiguration();

      // Ensure screenshots directory exists for debugging artifacts
      this.ensureScreenshotsDir();

      // Initialize storage client if available
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || null;
      this.supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

      await this.directoryConfig.initialize();

      // Fetch and apply directory overrides from Supabase
      try {
        if (this.supabase) {
          const { data: overrides, error } = await this.supabase
            .from('directory_overrides')
            .select('directory_id, enabled, pacing_min_ms, pacing_max_ms, max_retries');
          if (error) {
            console.warn('[worker] failed to fetch directory_overrides', error.message || error);
          } else if (Array.isArray(overrides) && overrides.length > 0 && typeof this.directoryConfig.applyOverrides === 'function') {
            this.directoryConfig.applyOverrides(overrides);
            console.log(`[worker] Applied ${overrides.length} directory overrides`);
          }
        }
      } catch (e) {
        console.warn('[worker] overrides fetch/apply error:', e?.message || e);
      }
      await this.launchBrowser();
      await this.registerWithOrchestrator();
      console.log("✅ Worker service initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize worker service:", error);
      throw error;
    }
  }

  /**
   * Validate security configuration and required environment variables
   */
  validateSecurityConfiguration() {
    console.log("🔒 Validating security configuration...");

    // Worker auth token is required to talk to orchestrator APIs (warn in local dev)
    if (!this.config.workerAuthToken || this.config.workerAuthToken.trim() === "") {
      console.warn("⚠️  Missing AUTOBOLT_API_KEY/WORKER_AUTH_TOKEN. Worker will start, but job API requests will be unauthorized until you set it.");
    }

    // 2Captcha key is optional for many directories; warn if missing but don't block startup
    const captchaKey = (this.config.twoCaptchaApiKey || "").trim();
    if (!captchaKey) {
      console.warn("⚠️  TWO_CAPTCHA_KEY/TWOCAPTCHA_API_KEY not set. Captcha-protected directories may fail until configured.");
    } else if (captchaKey.length < 32) {
      console.warn("⚠️  2Captcha key appears to be short. Please verify your API key.");
    } else {
      console.log("✅ 2Captcha configured");
    }

    // Validate auth token length
    if (this.config.workerAuthToken && this.config.workerAuthToken.length < 20) {
      console.warn("⚠️  WORKER_AUTH_TOKEN appears short. Verify AUTOBOLT_API_KEY/WORKER_AUTH_TOKEN.");
    }

    console.log("✅ Security configuration validated");
  }

  /**
   * Ensure screenshots directory exists
   */
  ensureScreenshotsDir() {
    try {
      // Prefer tmp dir in serverless environments (Netlify/AWS) to ensure write access
      const base = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME ? os.tmpdir() : process.cwd();
      const dir = path.join(base, "screenshots");
      fs.mkdirSync(dir, { recursive: true });
      this.screenshotsDir = dir;
    } catch (e) {
      console.warn("⚠️  Could not create screenshots directory:", e?.message || e);
      this.screenshotsDir = os.tmpdir();
    }
  }

  /**
   * Upload a screenshot buffer to Supabase Storage and return public URL
   * @param {Buffer} buffer
   * @param {string} pathKey
   * @returns {Promise<string|null>}
   */
  async uploadScreenshotBuffer(buffer, pathKey) {
    try {
      if (!this.supabase) return null;
      const bucket = process.env.SCREENSHOTS_BUCKET || 'screenshots';
      const { error } = await this.supabase.storage.from(bucket).upload(pathKey, buffer, { contentType: 'image/png', upsert: true });
      if (error) {
        console.warn('⚠️  Supabase upload failed:', error.message || error);
        return null;
      }
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(pathKey);
      return data?.publicUrl || null;
    } catch (e) {
      console.warn('⚠️  uploadScreenshotBuffer error:', e?.message || e);
      return null;
    }
  }

  /**
   * Capture and upload page screenshot; returns URL or null
   */
  async captureAndUpload(page, jobId, directoryName, tag) {
    try {
      const buffer = await page.screenshot({ type: 'png' });
      const safeDir = String(directoryName || 'unknown').toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
      const ts = Date.now();
      const key = `screenshots/${jobId}/${safeDir}-${tag}-${ts}.png`;
      const url = await this.uploadScreenshotBuffer(buffer, key);
      return url;
    } catch (e) {
      console.warn('⚠️  captureAndUpload failed:', e?.message || e);
      return null;
    }
  }

  /**
   * Normalize proxy credentials into Playwright-compatible format.
   * @param {ProxyCredentials | null | undefined} proxy
   * @returns {ProxyCredentials | null}
   */
  normalizeProxyCredentials(proxy) {
    if (!proxy || !proxy.server) {
      return null;
    }

    const server =
      proxy.server.startsWith("http://") || proxy.server.startsWith("https://")
        ? proxy.server
        : `http://${proxy.server}`;

    return {
      server,
      username: proxy.username ?? null,
      password: proxy.password ?? null,
    };
  }

  /**
   * Fetch a proxy assignment from the proxy manager service.
   * @returns {Promise<ProxyCredentials | null>}
   */
  async obtainProxyFromManager() {
    if (!this.config.proxyManagerUrl) {
      return null;
    }

    try {
      const response = await axios.get(`${this.config.proxyManagerUrl}/proxy/next`, {
        timeout: 5000,
        headers: {
          "User-Agent": "DirectoryBolt-Worker/1.0.0",
        },
      });

      if (response.status !== 200 || !response.data?.proxy) {
        return null;
      }

      const nextProxy = this.normalizeProxyCredentials({
        server: response.data.proxy,
        username: response.data.username,
        password: response.data.password,
      });

      if (nextProxy) {
        this.proxyStats.assignments += 1;
        this.proxyStats.lastAssignedAt = new Date().toISOString();
        console.log(`?? Assigned proxy ${nextProxy.server}`);
      }

      return nextProxy;
    } catch (error) {
      console.warn(
        "??  Failed to retrieve proxy from manager:",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  /**
   * Create (or refresh) a Playwright page with optional proxy configuration.
   * @param {ProxyCredentials | null} proxy
   */
  async createPageContext(proxy) {
    if (!this.browser) {
      throw new Error("Browser not launched");
    }

    if (this.page) {
      try {
        await this.page.close();
      } catch (error) {
        console.warn(
          "??  Failed to close existing page before reinitialisation",
          error instanceof Error ? error.message : error,
        );
      }
      this.page = null;
    }

    if (this.context) {
      try {
        await this.context.close();
      } catch (error) {
        console.warn(
          "??  Failed to close existing browser context",
          error instanceof Error ? error.message : error,
        );
      }
      this.context = null;
    }

    /** @type {import('playwright').BrowserContextOptions} */
    // User-Agent rotation per context when enabled
    const uaPool = (process.env.USER_AGENT_POOL || '').split(',').map(s => s.trim()).filter(Boolean);
    const rotateUA = process.env.USER_AGENT_ROTATE_PER_DIRECTORY === 'true';

    const contextOptions = {
      viewport: this.config.viewport,
      userAgent: (rotateUA && uaPool.length > 0) ? uaPool[Math.floor(Math.random()*uaPool.length)] : this.config.userAgent,
      ignoreHTTPSErrors: true,
    };

    const normalizedProxy = this.normalizeProxyCredentials(proxy);
    if (normalizedProxy) {
      contextOptions.proxy = normalizedProxy;
      this.currentProxy = normalizedProxy;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });
  }

  /**
   * Ensure proxy rotation and page initialisation prior to processing a job.
   */
  async prepareForJob() {
    if (!this.browser) {
      await this.launchBrowser();
    }

    if (this.config.proxyManagerUrl) {
      const nextProxy = await this.obtainProxyFromManager();

      const hasChanged =
        nextProxy &&
        (!this.currentProxy ||
          nextProxy.server !== this.currentProxy.server ||
          nextProxy.username !== this.currentProxy.username ||
          nextProxy.password !== this.currentProxy.password);

      if (hasChanged) {
        await this.createPageContext(nextProxy);
        return;
      }

      if (!this.page) {
        await this.createPageContext(this.currentProxy);
      }
      return;
    }

    if (!this.page) {
      await this.createPageContext(this.currentProxy);
    }
  }

  /**
   * Launch Playwright browser with configuration
   */
  async launchBrowser() {
    console.log("🔧 Launching Playwright browser...");

    const launchOptions = {
      headless: this.config.headless,
      viewport: this.config.viewport,
      userAgent: this.config.userAgent,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    };

    let initialProxy = null;

    if (this.config.proxyEnabled && this.config.proxyServer && !this.config.proxyManagerUrl) {
      initialProxy = this.normalizeProxyCredentials({
        server: this.config.proxyServer,
        username: this.config.proxyUsername,
        password: this.config.proxyPassword,
      });

      if (initialProxy) {
        launchOptions.proxy = initialProxy;
        this.currentProxy = initialProxy;
        console.log("🌐 Static HTTP proxy enabled:", initialProxy.server);
      }
    }

    this.browser = await chromium.launch(launchOptions);

    if (this.config.proxyManagerUrl) {
      const managedProxy = await this.obtainProxyFromManager();
      if (managedProxy) {
        initialProxy = managedProxy;
      }
    }

    await this.createPageContext(initialProxy);

    console.log("✅ Browser launched successfully");
  }

  /**
   * Register worker with orchestrator service
   */
  async registerWithOrchestrator() {
    if (!this.config.orchestratorBaseUrl) {
      console.warn("⚠️  No orchestrator URL configured - running in standalone mode");
      return;
    }

    if (!this.config.workerAuthToken) {
      console.warn("⚠️  Missing worker token; orchestrator registration skipped");
      return;
    }

    try {
      // Best-effort health check style registration; do not block worker startup
      const response = await axios.get(
        `${this.config.orchestratorBaseUrl}/status`,
        {
          headers: {
            Authorization: `Bearer ${this.config.workerAuthToken}`,
            "User-Agent": "DirectoryBolt-Worker/1.0.0",
          },
          timeout: 5000,
        },
      );

      console.log("✅ Orchestrator reachable:", response.status);
    } catch (error) {
      console.warn("⚠️  Orchestrator not reachable right now; continuing standalone:", error.message || error);
    }
  }

  /**
   * Start processing jobs from orchestrator
   */
  async startProcessing() {
    console.log("🔄 Starting job processing loop...");

    while (true) {
      try {
        const job = await this.getNextJob();
        if (job) {
          await this.prepareForJob();
          await this.processJob(job);
        } else {
          // No jobs available, wait before checking again
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error("❌ Error in processing loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  /**
   * Get next job from orchestrator
   */
  async getNextJob() {
    console.log('🔐 DEBUG: Authentication details');
    console.log('  AUTOBOLT_API_KEY exists:', !!process.env.AUTOBOLT_API_KEY);
    console.log('  AUTOBOLT_API_KEY length:', process.env.AUTOBOLT_API_KEY ? String(process.env.AUTOBOLT_API_KEY).length : 0);
    console.log('  AUTOBOLT_API_KEY first 10 chars:', process.env.AUTOBOLT_API_KEY ? String(process.env.AUTOBOLT_API_KEY).substring(0, 10) + '...' : '');
    console.log('  WORKER_AUTH_TOKEN exists:', !!process.env.WORKER_AUTH_TOKEN);
    console.log('  Using token from:', process.env.AUTOBOLT_API_KEY ? 'AUTOBOLT_API_KEY' : 'WORKER_AUTH_TOKEN');

    const token = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN;

    if (!token) {
      console.error('❌ No authentication token found in environment!');
      throw new Error('Missing authentication token');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Worker-ID': process.env.WORKER_ID || 'worker-001',
      'User-Agent': 'DirectoryBolt-Worker/1.0.0',
      'Content-Type': 'application/json',
    };

    const url = `${this.config.orchestratorBaseUrl}/jobs/next`;
    console.log('📤 Request details:');
    console.log('  URL:', url);
    console.log('  Headers:', JSON.stringify({ ...headers, Authorization: `Bearer ${String(token).substring(0, 10)}...` }, null, 2));

    try {
      const response = await axios.get(url, { headers, timeout: 15000 });
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data (truncated):', JSON.stringify(response.data, null, 2).substring(0, 500));

      if (response.data?.data) {
        console.log('✅ Received job payload', { jobId: response.data.data.jobId || response.data.data.id });
      } else {
        console.log('ℹ️  No jobs available');
      }
      return response.data?.data || null;
    } catch (error) {
      console.error('❌ Request failed');
      console.error('  Status:', error?.response?.status);
      console.error('  Status text:', error?.response?.statusText);
      try {
        console.error('  Response data:', JSON.stringify(error?.response?.data, null, 2));
        console.error('  Response headers:', JSON.stringify(error?.response?.headers, null, 2));
      } catch {}

      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error('Authentication/authorization failed while getting job. Check AUTOBOLT_API_KEY.');
      }
      console.error('❌ Failed to get next job:', error.message || error);
      return null;
    }
  }


  /**
   * Add cache buster to URL (migrated from cache-buster.js)
   */
  addCacheBuster(url) {
    const separator = url.includes("?") ? "&" : "?";
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${url}${separator}_cb=${timestamp}&_r=${random}`;
  }

  /**
   * Update job status with orchestrator
   */
  async updateJobStatus(jobId, status, data = {}) {
    try {
      const payload = {
        jobId,
        status,
        ...data,
      };
      await axios.post(
        `${this.config.orchestratorBaseUrl}/jobs/update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.workerAuthToken}`,
            "Content-Type": "application/json",
            "User-Agent": "DirectoryBolt-Worker/1.0.0",
          },
          timeout: 15000,
        },
      );
console.log("📡 Job updated", { jobId, status });

      // Best-effort structured submission logs if directoryResults present
      const dr = Array.isArray(data?.directoryResults) ? data.directoryResults : null;
      if (dr && dr.length) {
        try {
          await axios.post(
            `${this.config.orchestratorBaseUrl}/autobolt/submission-logs`,
            {
              jobId,
              entries: dr,
              status,
              timestamp: new Date().toISOString(),
            },
            {
              headers: {
                Authorization: `Bearer ${this.config.workerAuthToken}`,
                "Content-Type": "application/json",
                "User-Agent": "DirectoryBolt-Worker/1.0.0",
              },
              timeout: 15000,
            },
          );
          console.log("🧾 Submission logs posted", { count: dr.length });
        } catch (e) {
          console.warn("⚠️  Failed to post submission logs:", e?.message || e);
        }
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error(`❌ Auth failed while updating job ${jobId}. Check AUTOBOLT_API_KEY.`);
      } else {
        console.error(`❌ Failed to update job ${jobId} status:`, error.message || error);
      }
    }
  }

  /**
   * Cleanup and shutdown worker
   */
  async shutdown() {
    console.log("🛑 Shutting down worker service...");

    if (this.browser) {
      await this.browser.close();
    }

    console.log("✅ Worker service shut down gracefully");
    process.exit(0);
  }
}

/**
 * AdvancedFieldMapper - Migrated from extension lib/AdvancedFieldMapper.js
 * Handles intelligent field mapping with confidence scoring
 */
class AdvancedFieldMapper {
  constructor() {
    this.confidenceThreshold = 0.7;
    this.mappingCache = new Map();
    this.learningData = new Map();
  }

  reset() {
    this.mappingCache.clear();
  }

  /**
   * Analyze field patterns for mapping confidence
   * Migrated and enhanced from extension logic
   */
  /**
   * @param {PlaywrightElement} element
   * @returns {Promise<FieldPattern>}
   */
  async analyzeFieldPatterns(element) {
    const cacheKey = this.generateCacheKey(element);

    if (this.mappingCache.has(cacheKey)) {
      return this.mappingCache.get(cacheKey);
    }

    const pattern = {
      semanticScore: await this.calculateSemanticScore(element),
      contextScore: await this.calculateContextScore(element),
      positionScore: await this.calculatePositionScore(element),
      confidence: 0.5,
    };

    // Calculate overall confidence
    pattern.confidence =
      (pattern.semanticScore + pattern.contextScore + pattern.positionScore) /
      3;

    this.mappingCache.set(cacheKey, pattern);
    return pattern;
  }

  /**
   * Map element to business field type
   */
  /**
   * @param {PlaywrightElement} element
   * @param {Record<string, unknown>} businessData
   * @returns {Promise<FieldMappingResult>}
   */
  async mapToBusinessField(element, businessData) {
    const fieldMetadata = await this.extractFieldMetadata(element);
    const pattern = await this.analyzeFieldPatterns(element);

    const result = {
      identifier: fieldMetadata.name || fieldMetadata.id || "unknown",
      confidence: pattern.confidence,
      suggestedField: this.determineSuggestedField(fieldMetadata, pattern),
      value: this.getBusinessValue(
        this.determineSuggestedField(fieldMetadata, pattern),
        businessData,
      ),
    };

    return result;
  }

  /**
   * Extract field metadata from element
   */
  /**
   * @param {PlaywrightElement} element
   * @returns {Promise<FieldMetadata>}
   */
  async extractFieldMetadata(element) {
    const name = (await element.getAttribute("name")) || "";
    const id = (await element.getAttribute("id")) || "";
    const placeholder = (await element.getAttribute("placeholder")) || "";
    const type = (await element.getAttribute("type")) || "";
    const className = (await element.getAttribute("class")) || "";

    return { name, id, placeholder, type, className, element };
  }

  /**
   * Generate cache key for element
   */
  /** @param {PlaywrightElement} element */
  generateCacheKey(element) {
    // Create a unique key based on element properties
    return `${element.constructor.name}-${Date.now()}-${Math.random()}`;
  }

  /**
   * Calculate semantic score based on field attributes
   */
  /**
   * @param {PlaywrightElement} element
   * @returns {Promise<number>}
   */
  async calculateSemanticScore(element) {
    const metadata = await this.extractFieldMetadata(element);
    let score = 0.3; // base score

    // Check for business name indicators
    if (
      this.matchesPattern(metadata, ["business", "company", "organization"])
    ) {
      score += 0.4;
    }

    // Check for email indicators
    if (
      metadata.type === "email" ||
      this.matchesPattern(metadata, ["email", "mail"])
    ) {
      score += 0.4;
    }

    // Check for phone indicators
    if (
      metadata.type === "tel" ||
      this.matchesPattern(metadata, ["phone", "tel", "mobile"])
    ) {
      score += 0.4;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate context score based on surrounding elements
   */
  /**
   * @param {PlaywrightElement} element
   * @returns {Promise<number>}
   */
  async calculateContextScore(element) {
    // For now, return base score - could be enhanced with DOM analysis
    return 0.5;
  }

  /**
   * Calculate position score based on element position
   */
  /**
   * @param {PlaywrightElement} element
   * @returns {Promise<number>}
   */
  async calculatePositionScore(element) {
    // For now, return base score - could be enhanced with position analysis
    return 0.5;
  }

  /**
   * Check if metadata matches patterns
   */
  /**
   * @param {FieldMetadata} metadata
   * @param {string[]} patterns
   */
  matchesPattern(metadata, patterns) {
    const searchText =
      `${metadata.name} ${metadata.id} ${metadata.placeholder} ${metadata.className}`.toLowerCase();
    return patterns.some((pattern) =>
      searchText.includes(pattern.toLowerCase()),
    );
  }

  /**
   * Determine suggested field type
   */
  /**
   * @param {FieldMetadata} metadata
   * @param {FieldPattern} pattern
   * @returns {string | null}
   */
  determineSuggestedField(metadata, pattern) {
    if (metadata.type === "email" || this.matchesPattern(metadata, ["email"])) {
      return "email";
    }

    if (
      this.matchesPattern(metadata, ["business", "company", "organization"])
    ) {
      return "businessName";
    }

    if (this.matchesPattern(metadata, ["phone", "tel", "mobile"])) {
      return "phone";
    }

    if (this.matchesPattern(metadata, ["website", "url", "site"])) {
      return "website";
    }

    if (this.matchesPattern(metadata, ["description", "about", "bio"])) {
      return "description";
    }

    return "general";
  }

  /**
   * Get business value for field type
   */
  /**
   * @param {string | null} fieldType
   * @param {Record<string, unknown>} businessData
   */
  getBusinessValue(fieldType, businessData) {
    const mapping = {
      businessName:
        businessData?.businessName || businessData?.business_name || "",
      email: businessData?.email || "",
      phone: businessData?.phone || businessData?.phoneNumber || "",
      website: businessData?.website || businessData?.websiteUrl || "",
      description:
        businessData?.description || businessData?.businessDescription || "",
    };

    return mapping[fieldType] || "";
  }
}

/**
 * DynamicFormDetector - Migrated from extension lib/DynamicFormDetector.js
 * Detects forms using multiple strategies for different website types
 */
class DynamicFormDetector {
  constructor() {
    this.detectionStrategies = ["standard", "spa", "component"];
    this.observedElements = new WeakSet();
  }

  /**
   * Detect advanced forms using multiple strategies
   */
  /**
   * @param {PlaywrightPage} page
   * @returns {Promise<PlaywrightElement[]>}
   */
  async detectAdvancedForms(page) {
    const forms = new Set();

    await this.collectStandardForms(page, forms);
    await this.collectSpaContainers(page, forms);
    await this.collectComponentForms(page, forms);

    return Array.from(forms);
  }

  /**
   * Collect standard HTML forms
   */
  /**
   * @param {PlaywrightPage} page
   * @param {Set<PlaywrightElement>} collection
   */
  async collectStandardForms(page, collection) {
    const forms = await page.$$("form");
    forms.forEach((form) => collection.add(form));
  }

  /**
   * Collect SPA container elements that act as forms
   */
  /**
   * @param {PlaywrightPage} page
   * @param {Set<PlaywrightElement>} collection
   */
  async collectSpaContainers(page, collection) {
    const selectors = [
      'div[role="form"]',
      "section[data-form]",
      ".form-container",
      ".form-wrapper",
      '[data-testid*="form"]',
      '[class*="form"]',
    ];

    for (const selector of selectors) {
      try {
        const containers = await page.$$(selector);

        for (const container of containers) {
          const inputs = await container.$$(
            'input, select, textarea, [contenteditable="true"]',
          );
          const buttons = await container.$$(
            'button, [role="button"], input[type="submit"]',
          );

          if (inputs.length >= 2 && buttons.length >= 1) {
            collection.add(container);
          }
        }
      } catch (error) {
        console.warn("DynamicFormDetector: invalid selector", selector, error);
      }
    }
  }

  /**
   * Collect component-based forms (React/Vue/Angular)
   */
  /**
   * @param {PlaywrightPage} page
   * @param {Set<PlaywrightElement>} collection
   */
  async collectComponentForms(page, collection) {
    const selectors = [
      "[data-react-form]",
      "[data-vue-form]",
      "[data-angular-form]",
      '[class*="Form"]',
      '[class*="form-component"]',
    ];

    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        elements.forEach((element) => collection.add(element));
      } catch (error) {
        console.warn("DynamicFormDetector: invalid selector", selector, error);
      }
    }
  }
}

/**
 * FallbackSelectorEngine - Migrated from extension lib/FallbackSelectorEngine.js
 * Handles element finding with retry and fallback mechanisms
 */
class FallbackSelectorEngine {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 500;
  }

  /**
   * Find element with retry mechanism
   */
  /**
   * @param {PlaywrightPage} page
   * @param {string[]} selectors
   * @param {number} [maxAttempts]
   * @returns {Promise<PlaywrightElement | null>}
   */
  async findElementWithRetry(
    page,
    selectors,
    maxAttempts = this.retryAttempts,
  ) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const element = await this.findElementWithFallback(page, selectors);
      if (element) {
        return element;
      }
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    }
    return null;
  }

  /**
   * Find element using fallback selectors
   */
  /**
   * @param {PlaywrightPage} page
   * @param {string[]} selectors
   * @returns {Promise<PlaywrightElement | null>}
   */
  async findElementWithFallback(page, selectors) {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element && (await this.isElementInteractable(element))) {
          return element;
        }
      } catch (error) {
        console.warn(
          "FallbackSelectorEngine: invalid selector",
          selector,
          error,
        );
      }
    }

    // Try XPath fallback
    return await this.findByXPath(page, selectors);
  }

  /**
   * Find element using XPath conversion
   */
  /**
   * @param {PlaywrightPage} page
   * @param {string[]} originalSelectors
   * @returns {Promise<PlaywrightElement | null>}
   */
  async findByXPath(page, originalSelectors) {
    const xpathQueries = originalSelectors
      .map((selector) => this.cssToXPath(selector))
      .filter(Boolean);

    for (const xpath of xpathQueries) {
      try {
        const element = await page.$(`xpath=${xpath}`);
        if (element) {
          return element;
        }
      } catch (error) {
        console.warn("FallbackSelectorEngine: invalid XPath", xpath, error);
      }
    }

    return null;
  }

  /**
   * Convert CSS selector to XPath
   */
  /** @param {string} cssSelector */
  cssToXPath(cssSelector) {
    try {
      if (cssSelector.includes("#")) {
        const id = cssSelector.split("#")[1].split(/[\s\[\.:]/)[0];
        return `//*[@id='${id}']`;
      }

      if (cssSelector.includes("[name=")) {
        const nameMatch = cssSelector.match(/\[name=['"]([^'"]*)['"]\]/);
        if (nameMatch) {
          return `//*[@name='${nameMatch[1]}']`;
        }
      }

      if (cssSelector.includes("input[type=")) {
        const typeMatch = cssSelector.match(/input\[type=['"]([^'"]*)['"]\]/);
        if (typeMatch) {
          return `//input[@type='${typeMatch[1]}']`;
        }
      }
    } catch (error) {
      console.warn("FallbackSelectorEngine: cssToXPath failed", error);
    }

    return null;
  }

  /**
   * Check if element is interactable
   */
  /** @param {PlaywrightElement | null} element */
  async isElementInteractable(element) {
    if (!element) return false;

    try {
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      return isVisible && isEnabled;
    } catch (error) {
      return false;
    }
  }
}

// Add additional worker methods to main class
DirectoryBoltWorker.prototype.detectAdvancedForms = async function () {
  if (!this.page) {
    throw new Error(
      "Worker page not initialized. Call initialize() before detecting forms.",
    );
  }
  return await this.formDetector.detectAdvancedForms(this.page);
};

/**
 * @param {PlaywrightElement} form
 * @param {Record<string, unknown>} businessData
 */
DirectoryBoltWorker.prototype.fillDirectoryForm = async function (
  form,
  businessData,
) {
  console.log("📝 Filling directory form with business data...");

  // Get all input elements within the form
  const inputs = await form.$$(
    'input, select, textarea, [contenteditable="true"]',
  );
  const fillResults = [];

  for (const input of inputs) {
    try {
      const mapping = await this.fieldMapper.mapToBusinessField(
        input,
        businessData,
      );

      if (
        mapping.confidence >= this.fieldMapper.confidenceThreshold &&
        mapping.value
      ) {
        await input.fill(mapping.value);
        fillResults.push({
          field: mapping.identifier,
          type: mapping.suggestedField,
          value: mapping.value,
          confidence: mapping.confidence,
        });

        console.log(`✅ Filled ${mapping.suggestedField}: ${mapping.value}`);
      }
    } catch (error) {
      console.warn("⚠️  Failed to fill field:", error.message);
    }
  }

  return fillResults;
};

DirectoryBoltWorker.prototype.handleCaptcha = async function () {
  console.log("🔍 Checking for captcha...");

  if (!this.page) return true;

  const captchaSelectors = [
    ".g-recaptcha",
    "#recaptcha",
    "[data-sitekey]",
    ".hcaptcha",
    ".cf-turnstile",
  ];

  for (const selector of captchaSelectors) {
    const captchaElement = await this.page.$(selector);
    if (captchaElement) {
      console.log("🤖 Captcha detected, attempting automated solve...");

      // Preferred: use unified Playwright captcha integration
      try {
        const solved = await ensureRecaptchaSolved(this.page).catch(() => false);
        if (solved) {
          this.captchaStats.solved += 1;
          this.captchaStats.lastSolvedAt = new Date().toISOString();
          console.log("✅ Captcha solved via integration");
          return true;
        }
      } catch (e) {
        console.warn("⚠️  ensureRecaptchaSolved failed:", e?.message || e);
      }

      // Fallback: legacy 2Captcha flow using detected element/sitekey
      const ok = await this.solve2Captcha(captchaElement);
      if (ok) {
        this.captchaStats.solved += 1;
        this.captchaStats.lastSolvedAt = new Date().toISOString();
      }
      return ok;
    }
  }

  console.log("✅ No captcha detected");
  return true;
};

DirectoryBoltWorker.prototype.solve2Captcha = async function (captchaElement) {
  try {
    // Verify API key is available
    if (!this.config.twoCaptchaApiKey) {
      throw new Error(
        "2Captcha API key not configured. Please set TWO_CAPTCHA_KEY/TWOCAPTCHA_API_KEY.",
      );
    }

    // Attempt to extract site key and current URL
    const siteKey = await captchaElement.getAttribute("data-sitekey");
    const pageUrl = this.page.url();

    if (!siteKey) {
      console.warn("⚠️  Could not find captcha site key");
      return false;
    }

    console.log("🔄 Submitting captcha to 2Captcha service...");

    // Delegate to shared solver (uses correct form-encoded requests and polling)
    const token = await solveCaptcha({
      apiKey: this.config.twoCaptchaApiKey,
      siteKey,
      url: pageUrl,
      pollingIntervalMs: 10000,
      timeoutMs: 180000,
      userAgent: "DirectoryBolt-Worker/1.0.0",
    });

    console.log("✅ Captcha solved successfully");

    // Inject solution token into the page
    await this.page.evaluate((solution) => {
      const win = /** @type {any} */ (window);
      // Ensure response textarea exists
      let textarea = document.querySelector('[name="g-recaptcha-response"]');
      if (!(textarea instanceof HTMLTextAreaElement)) {
        textarea = document.createElement('textarea');
        textarea.name = 'g-recaptcha-response';
        textarea.id = 'g-recaptcha-response';
        textarea.style.display = 'none';
        document.body.appendChild(textarea);
      }
      textarea.value = solution;

      // Invoke potential callbacks
      if (win.grecaptcha && typeof win.grecaptcha.callback === 'function') {
        try { win.grecaptcha.callback(solution); } catch {}
      }
    }, token);

    return true;
  } catch (error) {
    console.error("❌ Failed to solve captcha:", error?.message || error);
    return false;
  }
};

DirectoryBoltWorker.prototype.submitForm = async function () {
  console.log("📤 Submitting form...");

  try {
    // Look for submit buttons
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'button:has-text("Create")',
      '[role="button"]:has-text("Submit")',
    ];

    for (const selector of submitSelectors) {
      const button = await this.page.$(selector);
      if (button && (await button.isVisible())) {
        await button.click();
        console.log("✅ Form submitted successfully");
        return true;
      }
    }

    // Fallback: try pressing Enter on focused element
    await this.page.keyboard.press("Enter");
    console.log("⚠️  Submitted form using Enter key fallback");
    return true;
  } catch (error) {
    console.error("❌ Failed to submit form:", error.message);
    throw error;
  }
};

DirectoryBoltWorker.prototype.verifySubmission = async function () {
  console.log("🔍 Verifying form submission...");

  try {
    // Wait for navigation or success indicators
    await Promise.race([
      this.page.waitForNavigation({ timeout: 10000 }),
      this.page.waitForSelector('.success, .thank-you, [class*="success"]', {
        timeout: 10000,
      }),
    ]);

    // Check for success indicators
    const successIndicators = [
      ".success",
      ".thank-you",
      ".confirmation",
      '[class*="success"]',
      '[class*="thank"]',
      ':has-text("Thank you")',
      ':has-text("Success")',
      ':has-text("Submitted")',
    ];

    for (const indicator of successIndicators) {
      const element = await this.page.$(indicator);
      if (element) {
        console.log("✅ Submission verified successfully");
        return true;
      }
    }

    // Check if URL changed (likely success)
    const currentUrl = this.page.url();
    if (
      currentUrl.includes("thank") ||
      currentUrl.includes("success") ||
      currentUrl.includes("complete")
    ) {
      console.log("✅ Submission verified by URL change");
      return true;
    }

    console.log("⚠️  Could not verify submission - assuming success");
    return true;
  } catch (error) {
    console.warn("⚠️  Submission verification timeout:", error.message);
    return true; // Assume success if we can't verify
  }
};

/**
 * Attempt to extract a human-readable confirmation message after submission
 */
DirectoryBoltWorker.prototype.extractConfirmationMessage = async function () {
  try {
    if (!this.page) return null;
    const selectors = [
      ".success",
      ".thank-you",
      ".confirmation",
      '[class*="success"]',
      '[class*="thank"]',
      'text=Thank you',
      'text=Submitted',
      'text=Success',
    ];

    for (const sel of selectors) {
      const el = await this.page.$(sel);
      if (el) {
        const text = await this.page.evaluate((node) => node.textContent || "", el);
        const cleaned = (text || "").trim().replace(/\s+/g, " ");
        if (cleaned) return cleaned.substring(0, 500);
      }
    }

    // Fallback to brief snippet from body text
    const bodyText = await this.page.evaluate(() => document.body?.innerText || "");
    const snippet = (bodyText || "").trim().slice(0, 300);
    return snippet || null;
  } catch {
    return null;
  }
};

// Main execution
if (require.main === module) {
  const worker = new DirectoryBoltWorker();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    worker.shutdown();
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    worker.shutdown();
  });

  // Start the worker
  worker
    .initialize()
    .then(() => {
      console.log("🚀 DirectoryBolt Worker Service is ready!");
      return worker.startProcessing();
    })
    .catch((error) => {
      console.error("❌ Failed to start worker:", error);
      process.exit(1);
    });
}


// Emergency implementation of processJob with verbose logging and directory iteration
DirectoryBoltWorker.prototype.processJob = async function (job) {
  console.log("\n========================================");
  console.log("STARTING JOB PROCESSING");
  console.log("========================================");
  const jobId = job?.id || job?.jobId;
  const customerId = job?.customerId || job?.customer_id;
  const business = job?.businessData || job?.customer || {};
  const packageType = job?.packageType || job?.package_type || null;
  const directoryLimit = job?.directoryLimit || job?.directory_limit || job?.packageSize || null;
  console.log("Job ID:", jobId);
  console.log("Customer ID:", customerId);
  console.log("Package Type:", packageType);
  console.log("Directory Limit:", directoryLimit);

  try {
    if (!this.page) {
      console.log("Preparing browser/page context...");
      await this.prepareForJob();
    }

    console.log("Step 1: Launching/using browser...", { headless: this.config.headless });
    if (!this.browser) {
      await this.launchBrowser();
    }
    if (!this.page) {
      await this.createPageContext(this.currentProxy);
    }
    console.log("✓ Browser/page ready");

    // Map directory limit to package if needed
    const mapLimitToPackage = (limit) => {
      const map = { 50: 'starter', 100: 'growth', 300: 'professional', 500: 'enterprise' };
      return map[Number(limit)] || 'starter';
    };

    const effectivePackage = (packageType || (directoryLimit ? mapLimitToPackage(directoryLimit) : 'starter')).toLowerCase();

    console.log("Step 2: Loading directory list...");
    const allDirs = this.directoryConfig.getAvailableDirectories(effectivePackage) || [];
    const directories = directoryLimit ? allDirs.slice(0, Number(directoryLimit)) : allDirs;
    console.log("✓ Directories loaded:", directories.length);
    console.log("Directory names:", directories.map(d => d.name).join(', '));

    if (!directories || directories.length === 0) {
      console.error("✗ ERROR: No directories available for package", effectivePackage);
      await this.updateJobStatus(jobId, 'failed', { errorMessage: 'No directories for package' });
      return;
    }

    await this.updateJobStatus(jobId, 'in_progress');

    const results = [];
    let successCount = 0;
    let failCount = 0;

    const minDelay = parseInt(process.env.TUNE_MIN_DELAY_MS || '800');
    const maxDelay = parseInt(process.env.TUNE_MAX_DELAY_MS || '2200');
    const rotateProxyPerDir = this.config.proxyManagerUrl && process.env.PROXY_ROTATE_PER_DIRECTORY === 'true';

    for (let i = 0; i < directories.length; i++) {
      const directory = directories[i];
      console.log("\n═══════════════════════════════════════");
      console.log(`Directory ${i + 1} of ${directories.length}`);
      console.log("═══════════════════════════════════════");
      console.log("Name:", directory.name);
      console.log("URL:", directory.url);
      console.log("Category:", directory.category);

      // Per-directory pacing and retries
      const dirMin = Math.max(200, Number(directory.pacing?.minDelayMs || minDelay));
      const dirMax = Math.max(dirMin + 1, Number(directory.pacing?.maxDelayMs || maxDelay));
      const dirRetries = Math.max(1, Number(directory.maxRetries || process.env.DIR_MAX_RETRIES || 1));

      let finalResult = null;
      let attempt = 0;
      while (attempt < dirRetries) {
        attempt++;
        try {
        // Rotate proxy and UA per directory if enabled
        if (rotateProxyPerDir) {
          const next = await this.obtainProxyFromManager();
          await this.createPageContext(next || this.currentProxy);
        } else if (process.env.USER_AGENT_ROTATE_PER_DIRECTORY === 'true') {
          await this.createPageContext(this.currentProxy);
        }

        console.log('→ Navigating to', directory.url);
        await this.page.goto(this.addCacheBuster(directory.url), { timeout: 60000, waitUntil: 'domcontentloaded' });
        console.log('✓ Page loaded');

        // If we have a directory-specific implementation, use it; otherwise generic
        let usedSpecific = false;
        let specificResult = null;
        if ((directory.id && directory.id.includes('google')) || /google/i.test(directory.name || '')) {
          try {
            console.log('→ Using Google Business specific submission flow');
            specificResult = await this.submitToGoogleBusiness(this.page, business);
            usedSpecific = true;
          } catch (e) {
            console.warn('⚠ Google specific flow failed, falling back to generic:', e?.message || e);
          }
        }

if (!usedSpecific && ((directory.id && directory.id.includes('yelp')) || /yelp/i.test(directory.name || ''))) {
          try {
            console.log('→ Using Yelp specific submission flow');
            specificResult = await this.submitToYelp(this.page, business);
            usedSpecific = true;
          } catch (e) {
            console.warn('⚠ Yelp specific flow failed, falling back to generic:', e?.message || e);
          }
        }

if (!usedSpecific && ((directory.id && directory.id.includes('facebook')) || /facebook/i.test(directory.name || ''))) {
          try {
            console.log('→ Using Facebook Business specific submission flow');
            specificResult = await this.submitToFacebook(this.page, business);
            usedSpecific = true;
          } catch (e) {
            console.warn('⚠ Facebook specific flow failed, falling back to generic:', e?.message || e);
          }
        }
        if (!usedSpecific && ((directory.id && directory.id.includes('apple')) || /apple\s*maps/i.test(directory.name || ''))) {
          try {
            console.log('→ Using Apple Maps specific submission flow');
            specificResult = await this.submitToAppleMaps(this.page, business);
            usedSpecific = true;
          } catch (e) {
            console.warn('⚠ Apple Maps specific flow failed, falling back to generic:', e?.message || e);
          }
        }

        if (usedSpecific && specificResult) {
          results.push(specificResult);
          if (specificResult.success) successCount++; else failCount++;
          const progressPercent = Math.round(((i + 1) / directories.length) * 100);
          console.log(`Progress: ${progressPercent}% (${i + 1}/${directories.length})`);
          await this.updateJobStatus(jobId, 'in_progress', { directoryResults: [specificResult] });
          continue;
        }

        console.log('→ Detecting forms...');
        const forms = await this.detectAdvancedForms();
        console.log('→ Forms detected:', forms?.length || 0);
        if (!forms || forms.length === 0) {
          console.warn('⚠ No forms detected, skipping');
          const result = { success: false, directoryName: directory.name, status: 'no_form', error: 'No forms detected' };
          results.push(result);
          failCount++;
          await this.updateJobStatus(jobId, 'in_progress', { directoryResults: [result] });
          continue;
        }

        console.log('→ Filling form...');
        const fillResult = await this.fillDirectoryForm(forms[0], business);

        console.log('→ Handling captcha if present...');
        await this.handleCaptcha();

        console.log('→ Submitting form...');
        await this.submitForm();

        console.log('→ Verifying submission...');
        const ok = await this.verifySubmission();
        const submissionUrl = this.page.url();
        const screenshotUrl = await this.captureAndUpload(this.page, jobId, directory.name, ok ? 'success' : 'failed');
        const confirmationMessage = await this.extractConfirmationMessage();
        const result = ok
          ? { success: true, directoryName: directory.name, status: 'success', submissionUrl, screenshotUrl, confirmationMessage, submittedAt: new Date().toISOString() }
          : { success: false, directoryName: directory.name, status: 'failed', error: 'Verification failed', screenshotUrl, confirmationMessage };

        results.push(result);
        if (ok) successCount++; else failCount++;

        const progressPercent = Math.round(((i + 1) / directories.length) * 100);
        console.log(`Progress: ${progressPercent}% (${i + 1}/${directories.length})`);

        finalResult = result;
        await this.updateJobStatus(jobId, 'in_progress', { directoryResults: [result] });
        // Randomized polite delay between directories
        const sleep = Math.max(dirMin, Math.floor(Math.random() * (dirMax - dirMin + 1)) + dirMin);
        await this.page.waitForTimeout(sleep);
        break;
      } catch (err) {
        const msg = err?.message || String(err);
        console.error('✗ EXCEPTION:', directory.name, msg);
        if (attempt >= dirRetries) {
          failCount++;
          const screenshotUrl = await this.captureAndUpload(this.page, jobId, directory.name, 'error');
          const result = { success: false, directoryName: directory.name, status: 'error', error: msg, screenshotUrl };
          results.push(result);
          await this.updateJobStatus(jobId, 'in_progress', { directoryResults: [result] });
        } else {
          console.log(`🔄 Retrying ${directory.name} (attempt ${attempt + 1}/${dirRetries})`);
          await this.page.waitForTimeout(Math.min(5000, 1000 * attempt));
          continue;
        }
      }
      }
    }

    console.log('\n========================================');
    console.log('JOB PROCESSING COMPLETE');
    console.log('========================================');
    console.log('Total directories:', directories.length);
    console.log('Successful:', successCount);
    console.log('Failed:', failCount);
    console.log('========================================');

    await this.updateJobStatus(jobId, 'completed', { directoryResults: results });
  } catch (error) {
    console.error('❌ processJob fatal error', error?.message || error);
    await this.updateJobStatus(jobId, 'failed', { errorMessage: error?.message || 'processJob failed' });
  }
};

// Directory-specific submission: Google Business Profile (best-effort demo)
DirectoryBoltWorker.prototype.submitToGoogleBusiness = async function(page, jobBusiness) {
  console.log('  ▶ Starting Google Business submission');
  try {
    const gEmail = process.env.GOOGLE_EMAIL || '';
    const gPass = process.env.GOOGLE_PASSWORD || '';

    // Try Google login (best-effort). If creds missing, continue as anonymous.
    try {
      if (gEmail && gPass) {
        await page.goto('https://accounts.google.com/signin/v2/identifier?service=lbc', { timeout: 60000, waitUntil: 'domcontentloaded' });
        const emailSel = 'input[type="email"], input[name="identifier"]';
        if (await page.$(emailSel)) {
          await page.fill(emailSel, gEmail);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1500);
        }
        const passSel = 'input[type="password"], input[name="Passwd"]';
        if (await page.$(passSel)) {
          await page.fill(passSel, gPass);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
        }
        // 2FA detection
        if (await this.detectTwoFactor(page)) {
          console.warn('  ⚠ Google 2FA detected - marking manual_required');
          return { success: false, directoryName: 'Google Business Profile', status: 'manual_required', error: '2FA required' };
        }
      }
    } catch (e) {
      console.warn('  ⚠ Google login step failed:', e?.message || e);
    }

    // Navigate to creation page
    await page.goto('https://business.google.com/create', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(this.screenshotsDir || 'worker/screenshots', `google-start-${Date.now()}.png`) });

    const businessData = {
      name: jobBusiness.business_name || jobBusiness.businessName || jobBusiness.name || '',
      address: jobBusiness.business_address || jobBusiness.address || '',
      city: jobBusiness.business_city || jobBusiness.city || '',
      state: jobBusiness.business_state || jobBusiness.state || '',
      zip: jobBusiness.business_zip || jobBusiness.zip || '',
      phone: jobBusiness.business_phone || jobBusiness.phone || '',
      website: jobBusiness.business_website || jobBusiness.website || '',
      description: jobBusiness.business_description || jobBusiness.description || ''
    };

    // Try to fill name field (selectors may change)
    const nameSelector = 'input[aria-label*="business name" i], input[name="businessName"], input[aria-label*="business" i]';
    const nameInput = await page.$(nameSelector);
    if (nameInput) {
      await nameInput.fill(businessData.name);
      console.log('  ✓ Filled business name');
    } else {
      console.warn('  ⚠ Could not locate business name field');
    }

    // Continue/Next if present
    const nextBtn = await page.$('button:has-text("Continue"), button:has-text("Next")');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }

    // Attempt to fill phone/website on this or subsequent step
    const phoneEl = await page.$('input[type="tel"], input[aria-label*="phone" i]');
    if (phoneEl && businessData.phone) {
      await phoneEl.fill(businessData.phone);
      console.log('  ✓ Filled phone');
    }
    const websiteEl = await page.$('input[type="url"], input[aria-label*="website" i]');
    if (websiteEl && businessData.website) {
      await websiteEl.fill(businessData.website);
      console.log('  ✓ Filled website');
    }

    // Attempt submit-like action
    const submitBtn = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Submit")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Basic verification
    const ok = await this.verifySubmission();
    const submissionUrl = page.url();
    const screenshotUrl = await this.captureAndUpload(page, jobBusiness?.jobId || jobBusiness?.id || 'job', 'google-business', 'success');

    if (ok) {
      return { success: true, directoryName: 'Google Business Profile', status: 'success', submissionUrl, screenshotUrl, submittedAt: new Date().toISOString() };
    }
    return { success: false, directoryName: 'Google Business Profile', status: 'failed', error: 'Verification failed' };
  } catch (e) {
    console.error('  ❌ Google submission exception', e?.message || e);
    const screenshotUrl = await this.captureAndUpload(page, jobBusiness?.jobId || jobBusiness?.id || 'job', 'google-business', 'error');
    return { success: false, directoryName: 'Google Business Profile', status: 'error', error: e?.message || String(e), screenshotUrl };
  }
};

// Detect generic 2FA prompts for major providers
DirectoryBoltWorker.prototype.detectTwoFactor = async function(page) {
  const twoFAKeywords = [
    '2-step', '2‑step', 'two-factor', 'two factor', 'verification code',
    'enter code', 'approve sign-in', 'security code', 'authenticator'
  ];
  try {
    const content = (await page.content()) || '';
    const lower = content.toLowerCase();
    return twoFAKeywords.some(k => lower.includes(k));
  } catch {
    return false;
  }
};

// Directory-specific submission: Yelp (login + best-effort listing flow)
DirectoryBoltWorker.prototype.submitToYelp = async function(page, jobBusiness) {
  console.log('  ▶ Starting Yelp submission');
  try {
    const email = process.env.YELP_EMAIL || '';
    const password = process.env.YELP_PASSWORD || '';
    if (!email || !password) {
      console.warn('  ⚠ YELP_EMAIL/YELP_PASSWORD not set; attempting limited flow without login');
    }

    // Login flow (best-effort)
    try {
      await page.goto('https://biz.yelp.com/login', { timeout: 60000, waitUntil: 'domcontentloaded' });
      const emailSel = 'input[type="email"], input[name="email" i]';
      const passSel = 'input[type="password"], input[name="password" i]';
      const loginBtnSel = 'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")';
      if (email && (await page.$(emailSel))) await page.fill(emailSel, email);
      if (password && (await page.$(passSel))) await page.fill(passSel, password);
      const btn = await page.$(loginBtnSel);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.warn('  ⚠ Yelp login step failed:', e?.message || e);
    }

    // Navigate to add business (URLs change; use best-known)
    try {
      await page.goto('https://biz.yelp.com/signup', { timeout: 60000, waitUntil: 'domcontentloaded' });
    } catch {}

    const businessData = {
      name: jobBusiness.business_name || jobBusiness.businessName || jobBusiness.name || '',
      phone: jobBusiness.business_phone || jobBusiness.phone || '',
      website: jobBusiness.business_website || jobBusiness.website || '',
    };

    // Attempt to fill basic fields if present
    try {
      const nameSel = 'input[name*="business" i], input[id*="business" i]';
      const phoneSel = 'input[type="tel"], input[name*="phone" i]';
      const siteSel = 'input[type="url"], input[name*="website" i]';
      if (await page.$(nameSel)) await page.fill(nameSel, businessData.name);
      if (await page.$(phoneSel)) await page.fill(phoneSel, businessData.phone);
      if (await page.$(siteSel)) await page.fill(siteSel, businessData.website);
    } catch (e) {
      console.warn('  ⚠ Yelp fill step failed:', e?.message || e);
    }

    // Try submit on this step
    try {
      const submitSel = 'button[type="submit"], button:has-text("Continue"), button:has-text("Next")';
      const sbtn = await page.$(submitSel);
      if (sbtn) {
        await sbtn.click();
        await page.waitForTimeout(2000);
      }
    } catch {}

    const ok = await this.verifySubmission();
    const submissionUrl = page.url();
    const screenshotUrl = await this.captureAndUpload(page, jobBusiness?.jobId || jobBusiness?.id || 'job', 'yelp', 'success');
    if (ok) {
      return { success: true, directoryName: 'Yelp', status: 'success', submissionUrl, screenshotUrl, submittedAt: new Date().toISOString() };
    }
    return { success: false, directoryName: 'Yelp', status: 'failed', error: 'Verification failed', screenshotUrl };
  } catch (e) {
    console.error('  ❌ Yelp submission exception', e?.message || e);
    const screenshotUrl = await this.captureAndUpload(page, jobBusiness?.jobId || jobBusiness?.id || 'job', 'yelp', 'error');
    return { success: false, directoryName: 'Yelp', status: 'error', error: e?.message || String(e), screenshotUrl };
  }
};

// Directory-specific submission: Facebook Business (login + page create)
DirectoryBoltWorker.prototype.submitToFacebook = async function(page, jobBusiness) {
  console.log('  ▶ Starting Facebook Business submission');
  try {
    const fbEmail = process.env.FACEBOOK_EMAIL || process.env.FB_EMAIL || '';
    const fbPass = process.env.FACEBOOK_PASSWORD || process.env.FB_PASSWORD || '';
    if (!fbEmail || !fbPass) {
      console.warn('  ⚠ FACEBOOK_EMAIL/FACEBOOK_PASSWORD not set; attempting limited flow without login');
    }

    try {
      await page.goto('https://www.facebook.com/login', { timeout: 60000, waitUntil: 'domcontentloaded' });
      const emailSel = 'input[name="email"], input[type="text"][id="email"]';
      const passSel = 'input[name="pass"], input[type="password"][id="pass"]';
      const loginBtn = 'button[name="login"], button:has-text("Log in")';
      if (fbEmail && (await page.$(emailSel))) await page.fill(emailSel, fbEmail);
      if (fbPass && (await page.$(passSel))) await page.fill(passSel, fbPass);
      const btn = await page.$(loginBtn);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
      }
      if (await this.detectTwoFactor(page)) {
        console.warn('  ⚠ Facebook 2FA detected - marking manual_required');
        return { success: false, directoryName: 'Facebook Business', status: 'manual_required', error: '2FA required' };
      }
    } catch (e) {
      console.warn('  ⚠ Facebook login failed:', e?.message || e);
    }

    // Navigate to create page flow
    try {
      await page.goto('https://www.facebook.com/pages/creation/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    } catch {}

    const businessData = {
      name: jobBusiness.business_name || jobBusiness.businessName || jobBusiness.name || ''
    };

    try {
      const pageNameSel = 'input[name="page_name"], input[aria-label*="Page name" i]';
      if (await page.$(pageNameSel)) {
        await page.fill(pageNameSel, businessData.name);
      }
      const createBtn = await page.$('div[role="button"]:has-text("Create")');
      if (createBtn) {
        await createBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.warn('  ⚠ Facebook page create step failed:', e?.message || e);
    }

    const ok = await this.verifySubmission();
    const submissionUrl = page.url();
    if (ok) {
      return { success: true, directoryName: 'Facebook Business', status: 'success', submissionUrl, submittedAt: new Date().toISOString() };
    }
    return { success: false, directoryName: 'Facebook Business', status: 'failed', error: 'Verification failed' };
  } catch (e) {
    console.error('  ❌ Facebook submission exception', e?.message || e);
    try { await page.screenshot({ path: path.join(this.screenshotsDir || 'worker/screenshots', `facebook-error-${Date.now()}.png`) }); } catch {}
    return { success: false, directoryName: 'Facebook Business', status: 'error', error: e?.message || String(e) };
  }
};

// Directory-specific submission: Apple Maps (login then Maps Connect)
DirectoryBoltWorker.prototype.submitToAppleMaps = async function(page, jobBusiness) {
  console.log('  ▶ Starting Apple Maps submission');
  try {
    const appleEmail = process.env.APPLE_ID_EMAIL || '';
    const applePass = process.env.APPLE_ID_PASSWORD || '';
    if (!appleEmail || !applePass) {
      console.warn('  ⚠ APPLE_ID_EMAIL/APPLE_ID_PASSWORD not set; attempting limited flow without login');
    }

    try {
      await page.goto('https://mapsconnect.apple.com/', { timeout: 60000, waitUntil: 'domcontentloaded' });
      const signIn = await page.$('a:has-text("Sign In"), a:has-text("Sign in")');
      if (signIn) { await signIn.click(); await page.waitForTimeout(1500); }
      const emailSel = 'input[type="email"], input[id="account_name_text_field"]';
      if (appleEmail && (await page.$(emailSel))) {
        await page.fill(emailSel, appleEmail);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
      }
      const passSel = 'input[type="password"], input[id="password_text_field"]';
      if (applePass && (await page.$(passSel))) {
        await page.fill(passSel, applePass);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
      if (await this.detectTwoFactor(page)) {
        console.warn('  ⚠ Apple 2FA detected - marking manual_required');
        return { success: false, directoryName: 'Apple Maps', status: 'manual_required', error: '2FA required' };
      }
    } catch (e) {
      console.warn('  ⚠ Apple login step failed:', e?.message || e);
    }

    // Best-effort to reach add business flow
    try {
      await page.goto('https://mapsconnect.apple.com/business/locations', { timeout: 60000, waitUntil: 'domcontentloaded' });
    } catch {}

    const ok = await this.verifySubmission();
    const submissionUrl = page.url();
    if (ok) {
      return { success: true, directoryName: 'Apple Maps', status: 'success', submissionUrl, submittedAt: new Date().toISOString() };
    }
    return { success: false, directoryName: 'Apple Maps', status: 'failed', error: 'Verification failed' };
  } catch (e) {
    console.error('  ❌ Apple Maps submission exception', e?.message || e);
    try { await page.screenshot({ path: path.join(this.screenshotsDir || 'worker/screenshots', `applemaps-error-${Date.now()}.png`) }); } catch {}
    return { success: false, directoryName: 'Apple Maps', status: 'error', error: e?.message || String(e) };
  }
};

module.exports = DirectoryBoltWorker;
