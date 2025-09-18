/**
 * DirectoryBolt Customer Authentication
 * Ensures only paying customers can use the extension
 */

class DirectoryBoltAuth {
  constructor() {
    this.baseUrl = 'https://directorybolt.com';
    this.customerId = null;
    this.isAuthenticated = false;
  }

  /**
   * Validate customer when extension starts
   */
  async validateCustomer() {
    try {
      // Get stored customer ID
      const result = await chrome.storage.local.get(['customerId']);
      this.customerId = result.customerId;

      if (!this.customerId) {
        console.log('No customer ID found in storage - user needs to authenticate first');
        // Don't redirect immediately - let the popup handle authentication
        return false;
      }

      // Validate with DirectoryBolt.com test endpoint (emergency fix)
      const response = await fetch(`${this.baseUrl}/api/extension/test-validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Extension-ID': chrome.runtime.id,
          'User-Agent': 'DirectoryBolt-Extension/3.0.1'
        },
        body: JSON.stringify({
          customerId: this.customerId,
          extensionVersion: chrome.runtime.getManifest().version,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        this.redirectToAuth('Customer validation failed');
        return false;
      }

      const data = await response.json();
      
      if (!data.valid) {
        this.redirectToAuth('Invalid customer or inactive subscription');
        return false;
      }

      this.isAuthenticated = true;
      console.log('✅ Customer authenticated via secure proxy:', data.customerName || data.businessName);
      return true;

    } catch (error) {
      console.error('❌ Secure authentication error:', error);
      if (error.message.includes('Customer ID format')) {
        this.redirectToAuth('Invalid Customer ID format');
      } else {
        this.redirectToAuth('Secure authentication service unavailable');
      }
      return false;
    }
  }

  /**
   * Store customer ID (called from DirectoryBolt.com)
   */
  async setCustomerId(customerId) {
    // Normalize customer ID
    const normalizedId = customerId.trim().toUpperCase();
    await chrome.storage.local.set({ customerId: normalizedId });
    this.customerId = normalizedId;
    console.log('✅ Customer ID stored:', normalizedId);
  }

  /**
   * Redirect to DirectoryBolt.com for authentication
   */
  redirectToAuth(reason) {
    const authUrl = `${this.baseUrl}/extension-setup?error=${encodeURIComponent(reason)}`;
    chrome.tabs.create({ url: authUrl });
  }

  /**
   * Check if customer is authenticated
   */
  isValidCustomer() {
    return this.isAuthenticated;
  }

  /**
   * Get customer ID
   */
  getCustomerId() {
    return this.customerId;
  }
}

// Global auth instance
const directoryBoltAuth = new DirectoryBoltAuth();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DirectoryBoltAuth;
}