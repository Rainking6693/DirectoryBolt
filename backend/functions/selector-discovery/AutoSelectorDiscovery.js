const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

class AutoSelectorDiscovery {
  constructor(config = {}) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      minConfidence: config.minConfidence || 0.7,
      ...config
    };

    // Field type patterns for intelligent matching
    this.fieldPatterns = {
      businessName: [
        /company.*name/i,
        /business.*name/i,
        /organization/i,
        /name.*business/i,
        /^name$/i
      ],
      email: [
        /e-?mail/i,
        /contact.*email/i,
        /email.*address/i
      ],
      website: [
        /website/i,
        /url/i,
        /site.*address/i,
        /web.*address/i,
        /homepage/i
      ],
      phone: [
        /phone/i,
        /telephone/i,
        /mobile/i,
        /contact.*number/i
      ],
      description: [
        /description/i,
        /about/i,
        /summary/i,
        /details/i,
        /bio/i
      ],
      address: [
        /address/i,
        /street/i,
        /location/i,
        /city/i
      ],
      category: [
        /category/i,
        /type/i,
        /industry/i,
        /sector/i
      ]
    };
  }

  /**
   * Discover selectors for a single directory with retry logic
   */
  async discoverSelectorsForDirectory(directoryId, retryCount = 0) {
    const maxRetries = 3;
    const requestId = this.generateRequestId();

    try {
      return await this._discoverWithRetry(directoryId, requestId, retryCount);
    } catch (error) {
      if (retryCount < maxRetries && this._isRetriableError(error)) {
        const delay = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
        console.log(`🔄 [${requestId}] Retry ${retryCount + 1}/${maxRetries} after ${delay}ms for ${directoryId}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.discoverSelectorsForDirectory(directoryId, retryCount + 1);
      }

      // Not retriable or max retries exceeded
      console.error(`❌ [${requestId}] Discovery failed after ${retryCount} retries:`, error.message);
      return {
        success: false,
        directoryId,
        error: error.message,
        errorType: error.name || 'UnknownError',
        retries: retryCount,
        requestId
      };
    }
  }

  /**
   * Check if error is retriable
   * @private
   */
  _isRetriableError(error) {
    const retriableErrors = [
      'PAGE_LOAD_TIMEOUT',
      'NETWORK_ERROR',
      'TIMEOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];

    return retriableErrors.some(errType =>
      error.message.includes(errType) || error.code === errType
    );
  }

  /**
   * Internal discovery implementation with error handling
   * @private
   */
  async _discoverWithRetry(directoryId, requestId, retryCount) {
    console.log(`🔍 [${requestId}] Starting selector discovery for directory: ${directoryId} (attempt ${retryCount + 1})`);

    let browser;
    let browserClosed = false;

    try {
      // Get directory info
      const directory = await this.getDirectoryInfo(directoryId);
      if (!directory || !directory.submission_url) {
        const error = new Error('Directory not found or missing submission URL');
        error.name = 'INVALID_DIRECTORY';
        throw error;
      }

      console.log(`📄 [${requestId}] Analyzing: ${directory.name}`);

      // Launch browser with timeout
      browser = await chromium.launch({
        headless: this.config.headless,
        timeout: 60000
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await context.newPage();

      // Set default timeout for all operations
      page.setDefaultTimeout(this.config.timeout);

      // Navigate to submission page with error handling
      console.log(`🌐 [${requestId}] Loading: ${directory.submission_url}`);

      try {
        await page.goto(directory.submission_url, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout
        });
      } catch (navError) {
        if (navError.message.includes('timeout')) {
          const error = new Error('PAGE_LOAD_TIMEOUT');
          error.name = 'PAGE_LOAD_TIMEOUT';
          throw error;
        }
        throw navError;
      }

      // Check if page redirected to different domain
      const currentUrl = page.url();
      const originalHost = new URL(directory.submission_url).hostname;
      const currentHost = new URL(currentUrl).hostname;

      if (originalHost !== currentHost) {
        const error = new Error(`PAGE_REDIRECTED: Expected ${originalHost}, got ${currentHost}`);
        error.name = 'PAGE_REDIRECTED';
        console.warn(`⚠️ [${requestId}] ${error.message}`);

        // Mark directory as requiring login if redirected to login page
        if (currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('auth')) {
          await this._markDirectoryRequiresLogin(directoryId);
        }

        throw error;
      }

      // Wait for page stability
      await page.waitForTimeout(3000);

      // Discover all form fields
      const discoveredFields = await this.discoverFormFields(page, requestId);

      if (discoveredFields.length === 0) {
        const error = new Error('NO_FORM_FIELDS_FOUND');
        error.name = 'NO_FORM_FIELDS_FOUND';
        throw error;
      }

      // Map fields to business data
      const mappedFields = await this.mapFieldsToBusinessData(discoveredFields, requestId);

      if (Object.keys(mappedFields).length === 0) {
        const error = new Error('NO_BUSINESS_FIELDS_MAPPED');
        error.name = 'NO_BUSINESS_FIELDS_MAPPED';
        console.warn(`⚠️ [${requestId}] Found ${discoveredFields.length} fields but none matched business patterns`);
        throw error;
      }

      // Generate selectors with fallbacks
      const selectors = await this.generateSelectorsWithFallbacks(page, mappedFields, requestId);

      // Validate selectors
      const validatedSelectors = await this.validateSelectors(page, selectors, requestId);

      // Calculate confidence scores
      const scoredSelectors = this.calculateConfidenceScores(validatedSelectors);

      // Close browser before database operations
      await browser.close();
      browserClosed = true;

      // Save to database
      await this.saveDiscoveredSelectors(directoryId, scoredSelectors, requestId);

      console.log(`✅ [${requestId}] Discovery complete. Found ${Object.keys(scoredSelectors).length} fields`);

      return {
        success: true,
        directoryId,
        directoryName: directory.name,
        discoveredFields: scoredSelectors,
        fieldsCount: Object.keys(scoredSelectors).length,
        retries: retryCount,
        requestId
      };

    } catch (error) {
      console.error(`❌ [${requestId}] Discovery error:`, error.message);
      throw error;
    } finally {
      // Ensure browser is always closed
      if (browser && !browserClosed) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn(`⚠️ [${requestId}] Failed to close browser:`, closeError.message);
        }
      }
    }
  }

  /**
   * Mark directory as requiring login
   * @private
   */
  async _markDirectoryRequiresLogin(directoryId) {
    try {
      await this.supabase
        .from('directories')
        .update({ requires_login: true })
        .eq('id', directoryId);

      console.log(`🔒 Marked directory ${directoryId} as requiring login`);
    } catch (error) {
      console.warn('Failed to mark directory as requiring login:', error.message);
    }
  }

  /**
   * Discover all form fields on the page
   */
  async discoverFormFields(page, requestId) {
    console.log(`🔎 [${requestId}] Discovering form fields...`);

    const fields = await page.evaluate(() => {
      const discovered = [];

      // Find all input fields
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      inputs.forEach((input, index) => {
        discovered.push({
          type: 'input',
          inputType: input.type || 'text',
          id: input.id || null,
          name: input.name || null,
          placeholder: input.placeholder || null,
          ariaLabel: input.getAttribute('aria-label') || null,
          label: getAssociatedLabel(input),
          className: input.className || null,
          required: input.required || false,
          index
        });
      });

      // Find all textarea fields
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea, index) => {
        discovered.push({
          type: 'textarea',
          id: textarea.id || null,
          name: textarea.name || null,
          placeholder: textarea.placeholder || null,
          ariaLabel: textarea.getAttribute('aria-label') || null,
          label: getAssociatedLabel(textarea),
          className: textarea.className || null,
          required: textarea.required || false,
          index
        });
      });

      // Find all select fields
      const selects = document.querySelectorAll('select');
      selects.forEach((select, index) => {
        discovered.push({
          type: 'select',
          id: select.id || null,
          name: select.name || null,
          ariaLabel: select.getAttribute('aria-label') || null,
          label: getAssociatedLabel(select),
          className: select.className || null,
          required: select.required || false,
          options: Array.from(select.options).map(opt => opt.text),
          index
        });
      });

      // Helper to get associated label
      function getAssociatedLabel(element) {
        // Check for label with for attribute
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) return label.textContent.trim();
        }

        // Check for parent label
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();

        // Check for sibling label
        const prevLabel = element.previousElementSibling;
        if (prevLabel && prevLabel.tagName === 'LABEL') {
          return prevLabel.textContent.trim();
        }

        return null;
      }

      return discovered;
    });

    console.log(`📋 [${requestId}] Found ${fields.length} form fields`);
    return fields;
  }

  /**
   * Escape CSS selector special characters to prevent injection
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for CSS selectors
   */
  escapeCSSSelector(str) {
    if (!str || typeof str !== 'string') return '';

    // Escape special CSS characters per CSS.escape() spec
    // Characters that need escaping: !"#$%&'()*+,./:;<=>?@[\]^`{|}~
    return str.replace(/([!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~])/g, '\\$1');
  }

  /**
   * Validate and sanitize field data to prevent injection attacks
   * @param {Object} field - Field data from page
   * @returns {Object} Sanitized field data
   */
  validateFieldData(field) {
    const sanitized = {};

    // Only allow alphanumeric, dash, underscore for IDs
    const idPattern = /^[a-zA-Z0-9_-]+$/;

    if (field.id && idPattern.test(field.id) && field.id.length < 100) {
      sanitized.id = field.id;
    }

    // Sanitize name attribute (more permissive, but still safe)
    if (field.name && field.name.length < 100) {
      // Only allow letters, numbers, dash, underscore, dots, brackets
      const safeName = field.name.replace(/[^a-zA-Z0-9_.\[\]-]/g, '');
      if (safeName) {
        sanitized.name = safeName;
      }
    }

    // Sanitize placeholder (escape for selector use)
    if (field.placeholder && field.placeholder.length < 200) {
      sanitized.placeholder = this.escapeCSSSelector(field.placeholder);
    }

    // Copy safe fields
    if (field.type) sanitized.type = field.type;
    if (field.inputType) sanitized.inputType = field.inputType;
    if (field.label) sanitized.label = field.label;
    if (field.className) sanitized.className = field.className;
    sanitized.required = field.required || false;
    sanitized.index = field.index;

    return sanitized;
  }

  /**
   * Map discovered fields to business data fields
   */
  async mapFieldsToBusinessData(fields, requestId) {
    console.log(`🗺️ [${requestId}] Mapping fields to business data...`);

    const mapped = {};

    // First, sanitize all fields
    const sanitizedFields = fields.map(field => ({
      ...field,
      ...this.validateFieldData(field)
    }));

    for (const [businessField, patterns] of Object.entries(this.fieldPatterns)) {
      const matches = [];

      sanitizedFields.forEach(field => {
        let score = 0;
        const searchText = [
          field.name,
          field.id,
          field.label,
          field.placeholder,
          field.ariaLabel
        ].filter(Boolean).join(' ').toLowerCase();

        // Check if any pattern matches
        for (const pattern of patterns) {
          if (pattern.test(searchText)) {
            score += 10;
            break;
          }
        }

        // Exact match bonus
        if (searchText.includes(businessField.toLowerCase())) {
          score += 15;
        }

        // Required field bonus
        if (field.required) {
          score += 5;
        }

        // Field type bonus
        if (businessField === 'email' && field.inputType === 'email') score += 10;
        if (businessField === 'website' && field.inputType === 'url') score += 10;
        if (businessField === 'phone' && field.inputType === 'tel') score += 10;
        if (businessField === 'description' && field.type === 'textarea') score += 10;

        if (score > 0) {
          matches.push({ ...field, score });
        }
      });

      // Sort by score and take best match
      if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        mapped[businessField] = matches[0];
      }
    }

    console.log(`✅ [${requestId}] Mapped ${Object.keys(mapped).length} business fields`);
    return mapped;
  }

  /**
   * Generate selectors with fallback options
   */
  async generateSelectorsWithFallbacks(page, mappedFields, requestId) {
    console.log(`🎯 [${requestId}] Generating selectors...`);

    const selectors = {};

    for (const [businessField, field] of Object.entries(mappedFields)) {
      const selectorOptions = [];

      // Priority 1: ID selector (most reliable)
      if (field.id) {
        // IDs are already validated to be alphanumeric+dash+underscore only
        selectorOptions.push({
          selector: `#${field.id}`,
          type: 'id',
          priority: 1
        });
      }

      // Priority 2: Name attribute
      if (field.name) {
        // Names are already sanitized in validateFieldData
        selectorOptions.push({
          selector: `${field.type}[name="${field.name}"]`,
          type: 'name',
          priority: 2
        });
      }

      // Priority 3: Placeholder (less reliable but sometimes necessary)
      if (field.placeholder) {
        // Placeholders are already escaped in validateFieldData
        selectorOptions.push({
          selector: `${field.type}[placeholder="${field.placeholder}"]`,
          type: 'placeholder',
          priority: 3
        });
      }

      // Priority 4: Type-specific selector
      if (field.inputType) {
        if (field.inputType === 'email') {
          selectorOptions.push({
            selector: `input[type="email"]`,
            type: 'input-type',
            priority: 4
          });
        }
      }

      // Priority 5: CSS path (last resort)
      const cssPath = await this.generateCSSPath(page, field, requestId);
      if (cssPath) {
        selectorOptions.push({
          selector: cssPath,
          type: 'css-path',
          priority: 5
        });
      }

      selectors[businessField] = selectorOptions;
    }

    return selectors;
  }

  /**
   * Generate CSS path for element
   */
  async generateCSSPath(page, field, requestId) {
    try {
      const cssPath = await page.evaluate((fieldData) => {
        // Helper function to escape CSS selector IDs (must be defined inside evaluate)
        function escapeId(id) {
          if (!id) return '';
          // Only allow alphanumeric, dash, underscore
          const safe = id.replace(/[^a-zA-Z0-9_-]/g, '');
          return safe;
        }

        // Find the element by its attributes
        let element;

        if (fieldData.id) {
          element = document.getElementById(fieldData.id);
        } else if (fieldData.name) {
          element = document.querySelector(`${fieldData.type}[name="${fieldData.name}"]`);
        }

        if (!element) return null;

        // Generate CSS path
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
          let selector = element.nodeName.toLowerCase();

          if (element.id) {
            const safeId = escapeId(element.id);
            if (safeId) {
              selector += `#${safeId}`;
              path.unshift(selector);
              break;
            }
          }

          // Use nth-of-type for elements without IDs
          let sibling = element;
          let nth = 1;
          while (sibling.previousElementSibling) {
            sibling = sibling.previousElementSibling;
            if (sibling.nodeName.toLowerCase() === selector) nth++;
          }
          if (nth !== 1) selector += `:nth-of-type(${nth})`;

          path.unshift(selector);
          element = element.parentNode;
        }

        return path.join(' > ');
      }, field);

      return cssPath;
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Failed to generate CSS path:`, error.message);
      return null;
    }
  }

  /**
   * Validate that selectors actually work
   */
  async validateSelectors(page, selectors, requestId) {
    console.log(`✔️ [${requestId}] Validating selectors...`);

    const validated = {};

    for (const [businessField, selectorOptions] of Object.entries(selectors)) {
      const workingSelectors = [];

      for (const option of selectorOptions) {
        try {
          const element = await page.$(option.selector);
          if (element) {
            // Verify element is visible and interactable
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();

            if (isVisible && isEnabled) {
              workingSelectors.push({
                ...option,
                validated: true,
                visible: true,
                enabled: true
              });
            }
          }
        } catch (error) {
          // Selector didn't work, skip it
        }
      }

      if (workingSelectors.length > 0) {
        validated[businessField] = workingSelectors;
      }
    }

    console.log(`✅ [${requestId}] Validated ${Object.keys(validated).length} fields`);
    return validated;
  }

  /**
   * Calculate confidence scores for selectors
   */
  calculateConfidenceScores(validatedSelectors) {
    const scored = {};

    for (const [businessField, selectors] of Object.entries(validatedSelectors)) {
      // Score each selector based on type and priority
      const scoredSelectors = selectors.map(selector => {
        let confidence = 0.5; // Base confidence

        // Type-based scoring
        if (selector.type === 'id') confidence = 0.95;
        else if (selector.type === 'name') confidence = 0.85;
        else if (selector.type === 'placeholder') confidence = 0.70;
        else if (selector.type === 'input-type') confidence = 0.60;
        else if (selector.type === 'css-path') confidence = 0.50;

        // Validation bonus
        if (selector.validated) confidence += 0.05;

        return {
          selector: selector.selector,
          confidence: Math.min(confidence, 1.0),
          type: selector.type,
          priority: selector.priority
        };
      });

      // Sort by confidence
      scoredSelectors.sort((a, b) => b.confidence - a.confidence);

      scored[businessField] = {
        primary: scoredSelectors[0],
        fallbacks: scoredSelectors.slice(1, 3), // Keep top 3
        confidence: scoredSelectors[0].confidence
      };
    }

    return scored;
  }

  /**
   * Save discovered selectors to database using atomic update to prevent race conditions
   */
  async saveDiscoveredSelectors(directoryId, selectors, requestId) {
    console.log(`💾 [${requestId}] Saving selectors atomically...`);

    try {
      // Prepare data for atomic function
      const updates = {};
      let updateCount = 0;

      // Filter to only high-confidence selectors
      for (const [field, selectorData] of Object.entries(selectors)) {
        if (selectorData.confidence > this.config.minConfidence) {
          updates[field] = selectorData.primary.selector;
          updateCount++;

          console.log(`🔄 [${requestId}] Adding ${field}: ${selectorData.primary.selector} (confidence: ${(selectorData.confidence * 100).toFixed(0)}%)`);
        }
      }

      if (updateCount === 0) {
        console.log(`ℹ️ [${requestId}] No high-confidence updates to save`);
        return;
      }

      // Prepare discovery log metadata
      const discoveryLog = {
        last_run: new Date().toISOString(),
        updates: updateCount,
        confidence_scores: Object.fromEntries(
          Object.entries(selectors).map(([k, v]) => [k, v.confidence])
        ),
        request_id: requestId
      };

      // Use atomic function to prevent race conditions
      // This function uses JSONB merge (||) which is atomic
      const { error } = await this.supabase.rpc('update_directory_selectors', {
        dir_id: directoryId,
        new_selectors: updates,
        discovery_log: discoveryLog
      });

      if (error) {
        // If function doesn't exist (migration not applied), fall back to direct update
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.warn(`⚠️ [${requestId}] Atomic function not found, using fallback update`);
          await this._saveSelectorsLegacy(directoryId, updates, discoveryLog, requestId);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ [${requestId}] Atomically updated ${updateCount} selectors`);
      }

    } catch (error) {
      console.error(`❌ [${requestId}] Failed to save selectors:`, error);
      throw error;
    }
  }

  /**
   * Legacy fallback for saving selectors (non-atomic, only used if migration not applied)
   * @private
   */
  async _saveSelectorsLegacy(directoryId, updates, discoveryLog, requestId) {
    console.warn(`⚠️ [${requestId}] Using legacy non-atomic update (migration not applied)`);

    // Get directory name for logging
    const { data: dir } = await this.supabase
      .from('directories')
      .select('name, field_selectors')
      .eq('id', directoryId)
      .single();

    const existingSelectors = dir?.field_selectors || {};
    const mergedSelectors = { ...existingSelectors, ...updates };

    const { error } = await this.supabase
      .from('directories')
      .update({
        field_selectors: mergedSelectors,
        selectors_updated_at: new Date().toISOString(),
        selector_discovery_log: discoveryLog
      })
      .eq('id', directoryId);

    if (error) throw error;

    console.log(`✅ [${requestId}] Updated ${Object.keys(updates).length} selectors for ${dir?.name || directoryId} (legacy mode)`);
  }

  /**
   * Batch discover selectors for multiple directories
   */
  async discoverSelectorsForAllDirectories(options = {}) {
    const requestId = this.generateRequestId();
    console.log(`🚀 [${requestId}] Starting batch selector discovery...`);

    try {
      // Get all directories that need discovery
      let query = this.supabase
        .from('directories')
        .select('id, name, submission_url, field_selectors')
        .not('submission_url', 'is', null);

      // Filter by status if specified
      if (options.onlyFailed) {
        // Get directories with high failure rates
        // This would require joining with submission stats
      }

      if (options.directoryIds) {
        query = query.in('id', options.directoryIds);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: directories, error } = await query;

      if (error) throw error;

      console.log(`📊 [${requestId}] Found ${directories.length} directories to process`);

      const results = [];

      // Process directories sequentially to avoid overwhelming the system
      for (const directory of directories) {
        console.log(`\n${'='.repeat(80)}`);
        const result = await this.discoverSelectorsForDirectory(directory.id);
        results.push(result);

        // Small delay between directories
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Generate summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📈 [${requestId}] Batch Discovery Complete:`);
      console.log(`   ✅ Successful: ${successful}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📊 Total: ${results.length}`);

      return {
        success: true,
        total: results.length,
        successful,
        failed,
        results,
        requestId
      };

    } catch (error) {
      console.error(`❌ [${requestId}] Batch discovery failed:`, error);
      throw error;
    }
  }

  // Helper methods
  async getDirectoryInfo(directoryId) {
    const { data, error } = await this.supabase
      .from('directories')
      .select('id, name, submission_url, field_selectors')
      .eq('id', directoryId)
      .single();

    if (error) throw error;
    return data;
  }

  generateRequestId() {
    return `discover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AutoSelectorDiscovery;
