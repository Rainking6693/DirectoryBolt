const DEFAULT_API_BASE = 'https://directorybolt.com';
const DEFAULT_ENDPOINT = '/api/extension/validate';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_PACKAGE = 'starter';
const DEFAULT_LIMIT = 50;
const PACKAGE_LIMITS = {
  starter: 50,
  growth: 75,
  professional: 150,
  enterprise: 500,
};
const VALID_PACKAGES = Object.keys(PACKAGE_LIMITS);
const REQUIRED_PREFIX = 'DIR-';
const FALLBACK_MESSAGE = 'Validation service unavailable.';

class PackageTierEngine {
  constructor(customerOrOptions = {}) {
    let options = customerOrOptions;
    if (typeof customerOrOptions === 'string') {
      this.customerId = customerOrOptions.trim();
      options = {};
    } else {
      this.customerId = undefined;
      options = customerOrOptions || {};
    }

    this.apiBase = this.#normalizeBase(options.apiBase);
    this.endpoint = this.#normalizeEndpoint(options.endpoint);
    this.timeout = this.#normalizeTimeout(options.timeout);
    this.fetchImpl = this.#resolveFetch(options.fetch);
    this.cache = options.cache instanceof Map ? options.cache : new Map();

    this.packageTier = DEFAULT_PACKAGE;
    this.directoryLimit = PACKAGE_LIMITS[DEFAULT_PACKAGE];
    this.lastResponse = null;
  }

  static async init(customerId, options = {}) {
    let engine = null;
    let engineConfig = options;

    if (typeof options === 'string') {
      engine = new PackageTierEngine(options);
      engineConfig = {};
    } else if (options instanceof PackageTierEngine) {
      engine = options;
      engineConfig = {};
    } else if (options && typeof options === 'object') {
      if (options.engine instanceof PackageTierEngine) {
        engine = options.engine;
        const { engine: _ignored, ...rest } = options;
        engineConfig = rest;
      } else {
        engineConfig = options;
      }
    }

    if (!engine) {
      engine = new PackageTierEngine(engineConfig);
    }

    if (customerId) {
      engine.customerId = customerId.trim();
    }

    const result = await engine.init();
    return { engine, result };
  }

  async init(customerId) {
    if (customerId) {
      this.customerId = customerId.trim();
    }

    if (!this.customerId) {
      const failure = this.buildFailure(null, 'MISSING_ID', 'Customer ID is required.');
      this.#applyResult(failure);
      return failure;
    }

    return this.validate(this.customerId);
  }

  #normalizeBase(base) {
    if (typeof base === 'string' && base.trim()) {
      return base.trim();
    }
    return DEFAULT_API_BASE;
  }

  #normalizeEndpoint(endpoint) {
    if (typeof endpoint === 'string' && endpoint.trim()) {
      const trimmed = endpoint.trim();
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
    return DEFAULT_ENDPOINT;
  }

  #normalizeTimeout(timeout) {
    const numeric = Number(timeout);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
    return DEFAULT_TIMEOUT;
  }

  #resolveFetch(fetchOverride) {
    if (typeof fetchOverride === 'function') {
      return fetchOverride;
    }
    if (typeof fetch === 'function') {
      return fetch.bind(globalThis);
    }
    return null;
  }

  normalizeCustomerId(rawId) {
    if (!rawId || typeof rawId !== 'string') {
      return this.buildFailure(null, 'MISSING_ID', 'Customer ID is required.');
    }

    const trimmed = rawId.trim();
    if (!trimmed) {
      return this.buildFailure(null, 'MISSING_ID', 'Customer ID is required.');
    }

    const cleaned = trimmed.toUpperCase();
    if (!cleaned.startsWith(REQUIRED_PREFIX)) {
      return this.buildFailure(cleaned, 'BAD_ID_FORMAT', 'Customer ID must start with "DIR-".');
    }

    return { ok: true, customerId: cleaned };
  }

  buildUrl(customerId) {
    const base = this.apiBase.endsWith('/') ? this.apiBase.slice(0, -1) : this.apiBase;
    const endpoint = this.endpoint.startsWith('/') ? this.endpoint : `/${this.endpoint}`;
    const href = `${base}${endpoint}`;

    try {
      const url = new URL(href);
      url.searchParams.set('customerId', customerId);
      return url.toString();
    } catch (error) {
      console.warn('PackageTierEngine: invalid URL configuration, falling back to default', error);
      const fallback = new URL(`${DEFAULT_API_BASE}${DEFAULT_ENDPOINT}`);
      fallback.searchParams.set('customerId', customerId);
      return fallback.toString();
    }
  }

  buildFailure(customerId, code = 'SERVER_ERROR', message = FALLBACK_MESSAGE) {
    const pkg = DEFAULT_PACKAGE;
    return {
      ok: false,
      customerId: customerId || null,
      package: pkg,
      directoryLimit: PACKAGE_LIMITS[pkg],
      code,
      message: this.#normalizeMessage(message),
    };
  }

  sanitizeFailure(raw, fallbackId) {
    if (!raw || typeof raw !== 'object') {
      return this.buildFailure(fallbackId, 'SERVER_ERROR', FALLBACK_MESSAGE);
    }

    const pkg = this.normalizePackage(raw.package);
    return {
      ok: false,
      customerId: raw.customerId || (fallbackId ? fallbackId.trim().toUpperCase() : null),
      package: pkg,
      directoryLimit: this.normalizeLimit(pkg, raw.directoryLimit),
      code: typeof raw.code === 'string' && raw.code ? raw.code : 'SERVER_ERROR',
      message: this.#normalizeMessage(raw.message),
    };
  }

  async validate(customerId) {
    const normalized = this.normalizeCustomerId(customerId);
    if (!normalized.ok) {
      const failure = this.sanitizeFailure(normalized, customerId);
      this.#applyResult(failure);
      return failure;
    }

    const cacheKey = normalized.customerId;
    this.customerId = cacheKey;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      this.#applyResult(cached);
      return cached;
    }

    if (!this.fetchImpl) {
      const failure = this.buildFailure(cacheKey);
      this.cache.set(cacheKey, failure);
      this.#applyResult(failure);
      return failure;
    }

    let result = this.buildFailure(cacheKey);

    try {
      const url = this.buildUrl(cacheKey);
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), this.timeout) : null;
      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      let data = null;
      if (response && typeof response.json === 'function') {
        try {
          data = await response.json();
        } catch (parseError) {
          console.warn('PackageTierEngine: failed to parse JSON response', parseError);
        }
      }

      if (response && response.ok && data && data.ok) {
        const pkg = this.normalizePackage(data.package);
        result = {
          ok: true,
          customerId: data.customerId || cacheKey,
          package: pkg,
          directoryLimit: this.normalizeLimit(pkg, data.directoryLimit),
          message: this.#normalizeMessage(data.message || ''),
          ...data,
        };
      } else if (data && typeof data === 'object') {
        result = { ...this.sanitizeFailure(data, cacheKey), ...data };
      } else {
        result = this.buildFailure(cacheKey);
      }
    } catch (error) {
      console.warn('PackageTierEngine: validation request failed', error);
      result = this.buildFailure(cacheKey);
    }

    this.cache.set(cacheKey, result);
    this.#applyResult(result);
    return result;
  }

  normalizePackage(value) {
    if (!value || typeof value !== 'string') {
      return DEFAULT_PACKAGE;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'pro') {
      return 'professional';
    }

    return VALID_PACKAGES.includes(normalized) ? normalized : DEFAULT_PACKAGE;
  }

  normalizeLimit(pkg, limit) {
    const numeric = Number(limit);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric);
    }
    return PACKAGE_LIMITS[pkg] ?? DEFAULT_LIMIT;
  }

  getPackageTier() {
    return this.packageTier;
  }

  getDirectoryLimit() {
    return this.directoryLimit;
  }

  #applyResult(result) {
    this.lastResponse = result;
    const pkg = this.normalizePackage(result.package);
    this.packageTier = pkg;
    this.directoryLimit = this.normalizeLimit(pkg, result.directoryLimit);
  }

  #normalizeMessage(message) {
    if (typeof message === 'string') {
      const trimmed = message.trim();
      if (trimmed) {
        return trimmed;
      }
    }
    return FALLBACK_MESSAGE;
  }
}

export default PackageTierEngine;

if (typeof globalThis !== 'undefined') {
  globalThis.PackageTierEngine = PackageTierEngine;
}
