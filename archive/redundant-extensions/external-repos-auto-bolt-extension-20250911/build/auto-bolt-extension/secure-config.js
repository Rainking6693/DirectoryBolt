/**
 * Secure Configuration Management for AutoBolt Extension
 * Handles secure storage and validation of sensitive configuration data
 */

class SecureConfig {
  static getDefaultConfig() {
    return {
      baseId: 'appZDNMzebkaOkLXo', // Public base ID
      tableName: 'Sheet1', // Public table name
      apiToken: null, // NEVER hardcode this
      apiUrl: 'https://api.airtable.com/v0'
    };
  }

  /**
   * Get stored configuration from Chrome storage
   */
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

  /**
   * Save configuration to Chrome storage after validation
   */
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
      console.log('✅ Configuration saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Test configuration by making a test API call
   */
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

      console.log('✅ Configuration test passed');
      return true;
    } catch (error) {
      console.error('Config test failed:', error);
      throw error;
    }
  }

  /**
   * Require valid configuration or throw error
   */
  static async requireConfig() {
    const config = await this.getStoredConfig();
    if (!config) {
      throw new Error('Airtable configuration required. Please configure in extension settings.');
    }
    return config;
  }

  /**
   * Clear stored configuration
   */
  static async clearConfig() {
    try {
      await chrome.storage.local.remove(['airtableConfig']);
      console.log('✅ Configuration cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear config:', error);
      throw error;
    }
  }

  /**
   * Validate API token format
   */
  static validateApiToken(token) {
    if (!token) {
      throw new Error('API token is required');
    }

    // Airtable Personal Access Tokens start with 'pat'
    if (!token.startsWith('pat')) {
      throw new Error('Invalid API token format. Airtable tokens should start with "pat"');
    }

    if (token.length < 20) {
      throw new Error('API token appears to be too short');
    }

    return true;
  }

  /**
   * Get configuration status for UI display
   */
  static async getConfigStatus() {
    try {
      const config = await this.getStoredConfig();
      
      if (!config) {
        return {
          configured: false,
          status: 'not_configured',
          message: 'Configuration required'
        };
      }

      // Test configuration
      try {
        await this.testConfig(config);
        return {
          configured: true,
          status: 'valid',
          message: 'Configuration valid'
        };
      } catch (error) {
        return {
          configured: true,
          status: 'invalid',
          message: `Configuration error: ${error.message}`
        };
      }

    } catch (error) {
      return {
        configured: false,
        status: 'error',
        message: `Error checking configuration: ${error.message}`
      };
    }
  }

  /**
   * Setup configuration wizard for first-time users
   */
  static async setupWizard() {
    const steps = [
      {
        title: 'Welcome to AutoBolt Extension Setup',
        message: 'This wizard will help you configure the extension to work with your Airtable data.',
        action: 'continue'
      },
      {
        title: 'Airtable API Token Required',
        message: 'You need to create a Personal Access Token in Airtable. Visit https://airtable.com/create/tokens to create one.',
        action: 'input',
        field: 'apiToken',
        placeholder: 'pat...',
        validation: this.validateApiToken
      },
      {
        title: 'Base Configuration',
        message: 'Configure your Airtable base settings.',
        action: 'input',
        fields: [
          { name: 'baseId', placeholder: 'appXXXXXXXXXXXXXX', default: 'appZDNMzebkaOkLXo' },
          { name: 'tableName', placeholder: 'Table name', default: 'Sheet1' }
        ]
      },
      {
        title: 'Test Configuration',
        message: 'Testing your configuration...',
        action: 'test'
      },
      {
        title: 'Setup Complete',
        message: 'Your AutoBolt extension is now configured and ready to use!',
        action: 'complete'
      }
    ];

    return steps;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SecureConfig = SecureConfig;
}

// Security reminder
console.log('🔒 SecureConfig loaded - Never hardcode API tokens!');