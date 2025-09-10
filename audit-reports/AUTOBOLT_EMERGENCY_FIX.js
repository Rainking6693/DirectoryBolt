/**
 * EMERGENCY FIX: AutoBolt Extension Authentication
 * 
 * This file contains the immediate fixes for the critical authentication issues
 * identified in the Cora & Hudson audit.
 * 
 * DEPLOY IMMEDIATELY to resolve customer authentication failures.
 */

// =============================================================================
// FIX #1: Customer Authentication Prefix Mismatch
// =============================================================================

/**
 * Updated customer authentication handler
 * Accepts both DIR- and DB- prefixes during transition period
 */
async function handleAuthenticate() {
  const customerId = this.elements.customerIdInput.value.trim();
  
  if (!customerId) {
    this.showError('Please enter your Customer ID');
    return;
  }

  // FIXED: Accept both DIR- and DB- prefixes
  const normalizedId = customerId.trim().toUpperCase();
  if (!normalizedId.startsWith('DIR-') && !normalizedId.startsWith('DB-')) {
    this.showError('Invalid Customer ID format. Should start with "DIR-" or "DB-"');
    return;
  }

  try {
    this.elements.authenticateBtn.disabled = true;
    this.customerId = normalizedId;
    
    // Store normalized customer ID
    await chrome.storage.local.set({ customerId: this.customerId });
    
    // Validate customer with enhanced error handling
    await this.validateCustomerEnhanced();
    
  } catch (error) {
    console.error('Authentication failed:', error);
    this.showError('Authentication failed: ' + error.message);
  } finally {
    this.elements.authenticateBtn.disabled = false;
  }
}

/**
 * Enhanced customer validation with better error handling
 */
async function validateCustomerEnhanced() {
  try {
    this.updateStatus('loading', 'Validating customer...');

    const response = await fetch('https://directorybolt.com/api/extension/validate-fixed', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Extension/1.0.0'
      },
      body: JSON.stringify({
        customerId: this.customerId,
        extensionVersion: chrome.runtime.getManifest().version,
        timestamp: Date.now(),
        source: 'chrome_extension',
        userAgent: navigator.userAgent
      })
    });

    if (!response.ok) {
      // Enhanced error handling based on HTTP status
      if (response.status === 404) {
        throw new Error('Customer not found. Please verify your Customer ID.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please check your Customer ID.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Your subscription may be inactive.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again in a moment.');
      } else {
        throw new Error(`Validation failed (${response.status}). Please contact support.`);
      }
    }

    const data = await response.json();
    
    if (!data.valid) {
      // Enhanced error messages based on response
      if (data.error) {
        if (data.error.includes('not found')) {
          throw new Error('Customer ID not found. Please verify your ID starts with "DIR-" or "DB-".');
        } else if (data.error.includes('inactive')) {
          throw new Error('Your subscription is inactive. Please contact support.');
        } else if (data.error.includes('format')) {
          throw new Error('Invalid Customer ID format. Please check your ID.');
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error('Invalid customer or inactive subscription');
      }
    }

    this.customerData = data;
    this.showCustomerInterface();
    
  } catch (error) {
    console.error('Customer validation failed:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. Please try again.';
    }
    
    this.showError(errorMessage);
    this.showAuthenticationRequired();
  }
}

// =============================================================================
// FIX #2: Secure Configuration Management
// =============================================================================

/**
 * Secure Airtable configuration without hardcoded credentials
 */
class SecureAirtableConfig {
  static getDefaultConfig() {
    return {
      baseId: 'appZDNMzebkaOkLXo', // This can be public
      tableName: 'Sheet1', // This can be public
      apiToken: null, // NEVER hardcode this
      apiUrl: 'https://api.airtable.com/v0'
    };
  }

  static async getStoredConfig() {
    try {
      const result = await chrome.storage.local.get(['airtableConfig']);
      if (result.airtableConfig && result.airtableConfig.apiToken) {
        return {
          ...this.getDefaultConfig(),
          ...result.airtableConfig
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get stored config:', error);
      return null;
    }
  }

  static async saveConfig(config) {
    try {
      // Validate config before saving
      if (!config.apiToken || !config.baseId || !config.tableName) {
        throw new Error('Incomplete configuration. All fields are required.');
      }

      // Test the configuration
      await this.testConfig(config);

      // Save if test passes
      await chrome.storage.local.set({ airtableConfig: config });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  static async testConfig(config) {
    try {
      const testUrl = `${config.apiUrl}/${config.baseId}/${encodeURIComponent(config.tableName)}?maxRecords=1`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API token');
        } else if (response.status === 404) {
          throw new Error('Base ID or table name not found');
        } else {
          throw new Error(`Configuration test failed: ${response.status}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Config test failed:', error);
      throw error;
    }
  }

  static async requireConfig() {
    const config = await this.getStoredConfig();
    if (!config) {
      throw new Error('Airtable configuration required. Please configure in extension settings.');
    }
    return config;
  }
}

// =============================================================================
// FIX #3: Enhanced Error Handling and User Experience
// =============================================================================

/**
 * Enhanced error display with actionable messages
 */
function showEnhancedError(error) {
  let userMessage = error.message;
  let actionButton = null;

  // Provide specific actions for common errors
  if (error.message.includes('configuration required')) {
    userMessage = 'Extension setup required. Please configure your Airtable settings.';
    actionButton = {
      text: 'Open Settings',
      action: () => this.showSettingsTab()
    };
  } else if (error.message.includes('Customer not found')) {
    userMessage = 'Customer ID not found. Please verify your ID format.';
    actionButton = {
      text: 'Help',
      action: () => this.showCustomerIdHelp()
    };
  } else if (error.message.includes('Network error')) {
    userMessage = 'Connection failed. Please check your internet and try again.';
    actionButton = {
      text: 'Retry',
      action: () => this.handleAuthenticate()
    };
  }

  // Display error with optional action button
  this.showError(userMessage);
  
  if (actionButton) {
    this.showActionButton(actionButton.text, actionButton.action);
  }
}

/**
 * Show customer ID format help
 */
function showCustomerIdHelp() {
  const helpMessage = `
    Customer ID Format Help:
    
    Your Customer ID should be in one of these formats:
    • DIR-2025-XXXXXX (new format)
    • DB-2025-XXXXXX (legacy format)
    
    You can find your Customer ID in:
    • Your DirectoryBolt purchase confirmation email
    • Your DirectoryBolt dashboard
    • Your receipt from Stripe
    
    If you can't find your Customer ID, please contact support.
  `;
  
  this.showMessage(helpMessage, 'info');
}

// =============================================================================
// FIX #4: Validation Endpoint Standardization
// =============================================================================

/**
 * Standardized validation request with comprehensive error handling
 */
async function validateCustomerStandardized(customerId) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Validation attempt ${attempt}/${maxRetries} for customer: ${customerId}`);

      const response = await fetch('https://directorybolt.com/api/extension/validate-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-Extension/1.0.0',
          'X-Extension-Version': chrome.runtime.getManifest().version,
          'X-Attempt': attempt.toString()
        },
        body: JSON.stringify({
          customerId: customerId,
          extensionVersion: chrome.runtime.getManifest().version,
          timestamp: Date.now(),
          source: 'chrome_extension',
          attempt: attempt,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }),
        timeout: 10000 // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Validation successful:', data);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      lastError = error;
      console.error(`Validation attempt ${attempt} failed:`, error);

      // Don't retry on certain errors
      if (error.message.includes('404') || error.message.includes('401')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw new Error(`Validation failed after ${maxRetries} attempts: ${lastError.message}`);
}

// =============================================================================
// DEPLOYMENT INSTRUCTIONS
// =============================================================================

/**
 * DEPLOYMENT CHECKLIST:
 * 
 * 1. IMMEDIATE (Deploy within 4 hours):
 *    □ Replace handleAuthenticate() function in customer-popup.js
 *    □ Update validation logic to accept both DIR- and DB- prefixes
 *    □ Remove hardcoded API tokens from all files
 *    □ Test with real customer IDs
 * 
 * 2. SHORT-TERM (Deploy within 24 hours):
 *    □ Implement SecureAirtableConfig class
 *    □ Add enhanced error handling
 *    □ Update Chrome Web Store listing
 *    □ Create customer setup documentation
 * 
 * 3. VERIFICATION:
 *    □ Test authentication with DIR- prefix customer IDs
 *    □ Test authentication with DB- prefix customer IDs (if any exist)
 *    □ Verify no hardcoded credentials in source code
 *    □ Test error scenarios (network failure, invalid ID, etc.)
 *    □ Verify secure configuration management works
 * 
 * 4. MONITORING:
 *    □ Monitor authentication success rates
 *    □ Track error types and frequencies
 *    □ Monitor API usage and performance
 *    □ Set up alerts for authentication failures
 */

// =============================================================================
// TESTING COMMANDS
// =============================================================================

/**
 * Test the fixes with these commands:
 * 
 * // Test DIR- prefix (should work)
 * validateCustomerStandardized('DIR-2025-123456');
 * 
 * // Test DB- prefix (should work during transition)
 * validateCustomerStandardized('DB-2025-123456');
 * 
 * // Test invalid format (should fail gracefully)
 * validateCustomerStandardized('INVALID-123456');
 * 
 * // Test network error handling
 * // (Disconnect internet and test)
 * 
 * // Test configuration management
 * SecureAirtableConfig.testConfig({
 *   apiToken: 'test_token',
 *   baseId: 'appZDNMzebkaOkLXo',
 *   tableName: 'Sheet1',
 *   apiUrl: 'https://api.airtable.com/v0'
 * });
 */

console.log('🚨 AutoBolt Emergency Fix loaded - Deploy immediately to resolve authentication issues');