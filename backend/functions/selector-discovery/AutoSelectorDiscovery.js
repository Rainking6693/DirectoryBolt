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
   * Discover selectors for a single directory
   */
  async discoverSelectorsForDirectory(directoryId) {
    const requestId = this.generateRequestId();
    console.log(`🔍 [${requestId}] Starting selector discovery for directory: ${directoryId}`);

    let browser;
    try {
      // Get directory info
      const directory = await this.getDirectoryInfo(directoryId);
      if (!directory || !directory.submission_url) {
        throw new Error('Directory not found or missing submission URL');
      }

      console.log(`📄 [${requestId}] Analyzing: ${directory.name}`);

      // Launch browser
      browser = await chromium.launch({
        headless: this.config.headless
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      const page = await context.newPage();

      // Navigate to submission page
      console.log(`🌐 [${requestId}] Loading: ${directory.submission_url}`);
      await page.goto(directory.submission_url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      // Wait for page to be fully loaded
      await page.waitForTimeout(3000);

      // Discover all form fields
      const discoveredFields = await this.discoverFormFields(page, requestId);

      // Map fields to business data
      const mappedFields = await this.mapFieldsToBusinessData(discoveredFields, requestId);

      // Generate selectors with fallbacks
      const selectors = await this.generateSelectorsWithFallbacks(page, mappedFields, requestId);

      // Validate selectors
      const validatedSelectors = await this.validateSelectors(page, selectors, requestId);

      // Calculate confidence scores
      const scoredSelectors = this.calculateConfidenceScores(validatedSelectors);

      // Save to database
      await this.saveDiscoveredSelectors(directoryId, scoredSelectors, requestId);

      console.log(`✅ [${requestId}] Discovery complete. Found ${Object.keys(scoredSelectors).length} fields`);

      return {
        success: true,
        directoryId,
        directoryName: directory.name,
        discoveredFields: scoredSelectors,
        requestId
      };

    } catch (error) {
      console.error(`❌ [${requestId}] Discovery failed:`, error);
      return {
        success: false,
        directoryId,
        error: error.message,
        requestId
      };
    } finally {
      if (browser) {
        await browser.close();
      }
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
   * Map discovered fields to business data fields
   */
  async mapFieldsToBusinessData(fields, requestId) {
    console.log(`🗺️ [${requestId}] Mapping fields to business data...`);

    const mapped = {};

    for (const [businessField, patterns] of Object.entries(this.fieldPatterns)) {
      const matches = [];

      fields.forEach(field => {
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
        selectorOptions.push({
          selector: `#${field.id}`,
          type: 'id',
          priority: 1
        });
      }

      // Priority 2: Name attribute
      if (field.name) {
        selectorOptions.push({
          selector: `${field.type}[name="${field.name}"]`,
          type: 'name',
          priority: 2
        });
      }

      // Priority 3: Placeholder (less reliable but sometimes necessary)
      if (field.placeholder) {
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
            selector += `#${element.id}`;
            path.unshift(selector);
            break;
          } else {
            let sibling = element;
            let nth = 1;
            while (sibling.previousElementSibling) {
              sibling = sibling.previousElementSibling;
              if (sibling.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += `:nth-of-type(${nth})`;
          }

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
   * Save discovered selectors to database
   */
  async saveDiscoveredSelectors(directoryId, selectors, requestId) {
    console.log(`💾 [${requestId}] Saving selectors to database...`);

    try {
      // Get existing selectors
      const { data: existingDir, error: fetchError } = await this.supabase
        .from('directories')
        .select('field_selectors, name')
        .eq('id', directoryId)
        .single();

      if (fetchError) throw fetchError;

      const existingSelectors = existingDir?.field_selectors || {};
      const updates = {};
      let updateCount = 0;

      // Compare and update
      for (const [field, selectorData] of Object.entries(selectors)) {
        const shouldUpdate =
          !existingSelectors[field] || // New field
          selectorData.confidence > this.config.minConfidence; // High confidence

        if (shouldUpdate) {
          updates[field] = selectorData.primary.selector;
          updateCount++;

          console.log(`🔄 [${requestId}] Updating ${field}: ${selectorData.primary.selector} (confidence: ${(selectorData.confidence * 100).toFixed(0)}%)`);
        }
      }

      if (updateCount > 0) {
        // Merge with existing selectors
        const mergedSelectors = { ...existingSelectors, ...updates };

        // Update database
        const { error: updateError } = await this.supabase
          .from('directories')
          .update({
            field_selectors: mergedSelectors,
            selectors_updated_at: new Date().toISOString(),
            selector_discovery_log: {
              last_run: new Date().toISOString(),
              updates: updateCount,
              confidence_scores: Object.fromEntries(
                Object.entries(selectors).map(([k, v]) => [k, v.confidence])
              )
            }
          })
          .eq('id', directoryId);

        if (updateError) throw updateError;

        console.log(`✅ [${requestId}] Updated ${updateCount} selectors for ${existingDir.name}`);
      } else {
        console.log(`ℹ️ [${requestId}] No updates needed (low confidence or no changes)`);
      }

    } catch (error) {
      console.error(`❌ [${requestId}] Failed to save selectors:`, error);
      throw error;
    }
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
