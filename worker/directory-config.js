/**
 * Directory Configuration for DirectoryBolt Worker Service
 * Migrated from extension directory-registry.js and directory lists
 *
 * Manages directory submission patterns, form selectors, and tier access
 */

class DirectoryConfiguration {
  constructor() {
    this.directories = [];
    this.metadata = {};
    this.initialized = false;
    this.filterCache = new Map();
    this.version = "2.0.0"; // Worker version
    this.overridesApplied = false;
    this.maxCacheSize = 100;

    // Centralized tier hierarchy for consistency (migrated from extension)
    this.tierHierarchy = {
      starter: 1,
      growth: 2,
      professional: 3,
      enterprise: 4,
    };

    // Common field selector patterns (migrated from directory-form-filler.js)
    this.fieldSelectors = {
      businessName: [
        'input[name*="business" i]',
        'input[name*="company" i]',
        'input[name*="name" i]:not([name*="first" i]):not([name*="last" i]):not([name*="user" i])',
        'input[id*="business" i]',
        'input[id*="company" i]',
        'input[placeholder*="business" i]',
        'input[placeholder*="company" i]',
        "#businessName",
        "#companyName",
        "#company_name",
        "#business_name",
        ".business-name input",
        ".company-name input",
        'input[name="name"]:not([name*="first"]):not([name*="last"])',
      ],

      email: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        "#email",
        "#emailAddress",
        "#email_address",
        ".email input",
        'input[name="email"]',
      ],

      phone: [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[name*="tel" i]',
        'input[name*="mobile" i]',
        'input[id*="phone" i]',
        'input[id*="tel" i]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="tel" i]',
        "#phone",
        "#phoneNumber",
        "#phone_number",
        "#tel",
        ".phone input",
        'input[name="phone"]',
        'input[name="tel"]',
      ],

      website: [
        'input[type="url"]',
        'input[name*="website" i]',
        'input[name*="url" i]',
        'input[name*="site" i]',
        'input[id*="website" i]',
        'input[id*="url" i]',
        'input[placeholder*="website" i]',
        'input[placeholder*="url" i]',
        "#website",
        "#websiteUrl",
        "#website_url",
        "#url",
        ".website input",
        'input[name="website"]',
        'input[name="url"]',
      ],

      description: [
        'textarea[name*="description" i]',
        'textarea[name*="about" i]',
        'textarea[name*="bio" i]',
        'textarea[id*="description" i]',
        'textarea[id*="about" i]',
        'textarea[placeholder*="description" i]',
        'textarea[placeholder*="about" i]',
        "#description",
        "#businessDescription",
        "#business_description",
        "#about",
        ".description textarea",
        'textarea[name="description"]',
      ],

      address: [
        'input[name*="address" i]',
        'input[name*="street" i]',
        'input[id*="address" i]',
        'input[id*="street" i]',
        'input[placeholder*="address" i]',
        'input[placeholder*="street" i]',
        "#address",
        "#streetAddress",
        "#street_address",
        ".address input",
        'input[name="address"]',
      ],

      city: [
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[placeholder*="city" i]',
        "#city",
        ".city input",
        'input[name="city"]',
      ],

      state: [
        'select[name*="state" i]',
        'input[name*="state" i]',
        'select[id*="state" i]',
        'input[id*="state" i]',
        "#state",
        ".state select",
        ".state input",
        'select[name="state"]',
        'input[name="state"]',
      ],

      zipCode: [
        'input[name*="zip" i]',
        'input[name*="postal" i]',
        'input[id*="zip" i]',
        'input[id*="postal" i]',
        'input[placeholder*="zip" i]',
        'input[placeholder*="postal" i]',
        "#zip",
        "#zipCode",
        "#zip_code",
        "#postalCode",
        "#postal_code",
        ".zip input",
        'input[name="zip"]',
        'input[name="postal_code"]',
      ],
    };
  }

  /**
   * Initialize directory configuration
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      console.log("🏗️ Initializing Directory Configuration...");

      // Load directory configurations (would be loaded from database in production)
      await this.loadDirectoryConfigurations();

      this.initialized = true;
      console.log(
        `✅ Initialized ${this.directories.length} directory configurations`,
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize directory configuration:", error);
      throw error;
    }
  }

  /**
   * Load directory configurations
   * In production, this would load from database/API
   */
  async loadDirectoryConfigurations() {
    // Sample directory configurations based on common patterns
    this.directories = [
      {
        id: "yelp",
        name: "Yelp",
        url: "https://www.yelp.com/signup",
        category: "general",
        tier: "starter",
        enabled: true,
        pacing: { minDelayMs: 1200, maxDelayMs: 3000 },
        maxRetries: 2,
        formSelectors: {
          businessName: ["#business-name", 'input[name="businessName"]'],
          email: ['input[type="email"]'],
          phone: ['input[type="tel"]'],
          website: ['input[name="website"]'],
          description: ['textarea[name="description"]'],
        },
        submitSelector: 'button[type="submit"]',
        successIndicators: [".success", ".thank-you"],
        waitTime: 2000,
      },
      {
        id: "google-business",
        name: "Google My Business",
        url: "https://business.google.com/",
        category: "search-engines",
        tier: "growth",
        enabled: true,
        pacing: { minDelayMs: 1500, maxDelayMs: 3500 },
        maxRetries: 2,
        formSelectors: {
          businessName: ['input[aria-label*="Business name"]'],
          email: ['input[type="email"]'],
          phone: ['input[type="tel"]'],
          website: ['input[name="websiteUrl"]'],
          address: ['input[aria-label*="Address"]'],
        },
        submitSelector: 'button:has-text("Next")',
        successIndicators: [':has-text("Congratulations")'],
        waitTime: 3000,
      },
      {
        id: "facebook-business",
        name: "Facebook Business",
        url: "https://www.facebook.com/business/pages/create",
        category: "social-media",
        tier: "professional",
        enabled: true,
        pacing: { minDelayMs: 1500, maxDelayMs: 4000 },
        maxRetries: 2,
        formSelectors: {
          businessName: ['input[name="page_name"]'],
          email: ['input[type="email"]'],
          phone: ['input[name="phone"]'],
          website: ['input[name="website"]'],
          description: ['textarea[name="description"]'],
        },
        submitSelector: 'button[data-testid="create-page-button"]',
        successIndicators: [".page-created", ':has-text("Page created")'],
        waitTime: 4000,
      },
      // More directories would be loaded here...
    ];

    console.log(
      `📚 Loaded ${this.directories.length} directory configurations`,
    );
  }

  /**
   * Get directory configuration by ID
   */
  getDirectoryById(id) {
    return this.directories.find((dir) => dir.id === id);
  }

  /**
   * Get directories by tier
   */
  getDirectoriesByTier(tier) {
    // When overrides are applied, some directories may be disabled
    if (typeof this.applyOverrides === 'function' && !this.overridesApplied) {
      // No-op placeholder: worker will call applyOverrides
    }
    const tierLevel = this.tierHierarchy[tier.toLowerCase()] || 1;

    return this.directories.filter((dir) => {
      const dirTierLevel = this.tierHierarchy[dir.tier.toLowerCase()] || 1;
      return dirTierLevel <= tierLevel;
    });
  }

  /**
   * Get directories by category
   */
  getDirectoriesByCategory(category) {
    return this.directories.filter((dir) => dir.category === category);
  }

  /**
   * Get field selectors for business data type
   */
  getFieldSelectors(fieldType) {
    return this.fieldSelectors[fieldType] || [];
  }

  /**
   * Check if directory is available for tier
   */
  isDirectoryAvailableForTier(directoryId, customerTier) {
    const directory = this.getDirectoryById(directoryId);
    if (!directory) return false;

    const customerTierLevel =
      this.tierHierarchy[customerTier.toLowerCase()] || 1;
    const directoryTierLevel =
      this.tierHierarchy[directory.tier.toLowerCase()] || 1;

    return customerTierLevel >= directoryTierLevel;
  }

  /**
   * Get all available directories for customer tier
   */
  getAvailableDirectories(customerTier) {
    return this.getDirectoriesByTier(customerTier);
  }

  /**
   * Apply overrides fetched from database.
   * overrides: Array<{ directory_id, enabled, pacing_min_ms, pacing_max_ms, max_retries }>
   */
  applyOverrides(overrides) {
    try {
      if (!Array.isArray(overrides) || overrides.length === 0) return false;
      const map = new Map();
      for (const o of overrides) {
        if (o && o.directory_id) {
          map.set(String(o.directory_id), o);
        }
      }
      this.directories = this.directories.map((dir) => {
        const ov = map.get(dir.id);
        if (!ov) return dir;
        const pacing = { ...dir.pacing };
        if (typeof ov.pacing_min_ms === 'number') pacing.minDelayMs = ov.pacing_min_ms;
        if (typeof ov.pacing_max_ms === 'number') pacing.maxDelayMs = ov.pacing_max_ms;
        const merged = {
          ...dir,
          enabled: typeof ov.enabled === 'boolean' ? ov.enabled : (dir.enabled !== false),
          pacing,
          maxRetries: typeof ov.max_retries === 'number' ? ov.max_retries : dir.maxRetries,
        };
        return merged;
      });
      this.overridesApplied = true;
      return true;
    } catch (e) {
      console.warn('DirectoryConfiguration.applyOverrides failed:', e?.message || e);
      return false;
    }
  }

  /**
   * Update directory configuration
   */
  updateDirectoryConfig(id, updates) {
    const index = this.directories.findIndex((dir) => dir.id === id);
    if (index !== -1) {
      this.directories[index] = { ...this.directories[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Add new directory configuration
   */
  addDirectoryConfig(config) {
    if (!config.id || this.getDirectoryById(config.id)) {
      throw new Error("Directory ID already exists or invalid");
    }

    // Validate required fields
    const required = ["id", "name", "url", "tier"];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    this.directories.push(config);
    console.log(`✅ Added directory configuration: ${config.name}`);
    return true;
  }

  /**
   * Get statistics about configured directories
   */
  getStatistics() {
    const stats = {
      total: this.directories.length,
      byTier: {},
      byCategory: {},
    };

    // Count by tier
    for (const tier of Object.keys(this.tierHierarchy)) {
      stats.byTier[tier] = this.getDirectoriesByTier(tier).length;
    }

    // Count by category
    const categories = [
      ...new Set(this.directories.map((dir) => dir.category)),
    ];
    for (const category of categories) {
      stats.byCategory[category] =
        this.getDirectoriesByCategory(category).length;
    }

    return stats;
  }
}

module.exports = DirectoryConfiguration;
