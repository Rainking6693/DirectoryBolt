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
  constructor(options = {}) {
    this.apiBase = this.#normalizeBase(options.apiBase);
    this.endpoint = this.#normalizeEndpoint(options.endpoint);
    this.timeout = this.#normalizeTimeout(options.timeout);
    this.fetchImpl = this.#resolveFetch(options.fetch);
    this.cache = options.cache instanceof Map ? options.cache : new Map();
  }

  static async init(customerId, options = {}) {
    const { engine: existingEngine, ...engineConfig } = options || {};
    const engine = existingEngine instanceof PackageTierEngine
      ? existingEngine
      : new PackageTierEngine(engineConfig);

    const result = await engine.validate(customerId);
    return { engine, result };
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
      if (failure.customerId) {
        this.cache.set(failure.customerId, failure);
      }
      return failure;
    }

    const cacheKey = normalized.customerId;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!this.fetchImpl) {
      const failure = this.buildFailure(cacheKey);
      this.cache.set(cacheKey, failure);
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
        };
      } else if (data && typeof data === 'object') {
        result = this.sanitizeFailure(data, cacheKey);
      } else {
        result = this.buildFailure(cacheKey);
      }
    } catch (error) {
      console.warn('PackageTierEngine: validation request failed', error);
      result = this.buildFailure(cacheKey);
    }

    this.cache.set(cacheKey, result);
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
