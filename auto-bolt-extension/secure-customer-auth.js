/**
 * SECURE CUSTOMER AUTHENTICATION - SECURITY HARDENED
 * NO HARDCODED CREDENTIALS - ALL API CALLS VIA SECURE PROXY
 * PHASE 1 SECURITY FIX
 */

class SecureCustomerAuth {
    constructor() {
        // SECURITY: NO HARDCODED CREDENTIALS
        // All API calls go through secure server-side proxy
        this.proxyBaseUrl = 'https://directorybolt.com/api/extension';
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * SECURE VALIDATION - VIA SERVER-SIDE PROXY ONLY
     * Zero credentials exposed to client-side code
     */
    async validateCustomer(customerId) {
        console.log('🔒 SECURE AUTH: Validating customer via secure proxy:', customerId);
        
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        // Validate customer ID format client-side
        if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
            throw new Error('Invalid Customer ID format. Must start with DIR- or DB-');
        }

        try {
            // SECURE: All validation happens server-side
            const response = await this.secureApiCall('/secure-validate', {
                customerId: customerId.trim(),
                extensionVersion: this.getExtensionVersion()
            });

            if (!response.valid) {
                console.log('❌ SECURE AUTH: Customer validation failed:', response.error);
                return null;
            }

            console.log('✅ SECURE AUTH: Customer validated:', response.customerName);
            
            return {
                customerId: customerId.trim().toUpperCase(),
                customerName: response.customerName,
                packageType: response.packageType,
                isValid: true
            };

        } catch (error) {
            console.error('❌ SECURE AUTH: Validation error:', error);
            throw new Error(`Customer validation failed: ${error.message}`);
        }
    }

    /**
     * SECURE API CALL - WITH RETRY LOGIC AND ERROR HANDLING
     */
    async secureApiCall(endpoint, data, retryCount = 0) {
        const url = `${this.proxyBaseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-ID': this.getExtensionId()
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed: ${response.status} - ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`❌ SECURE AUTH: API call failed (attempt ${retryCount + 1}):`, error);
            
            // Retry logic with exponential backoff
            if (retryCount < this.maxRetries) {
                await this.delay(this.retryDelay * Math.pow(2, retryCount));
                return this.secureApiCall(endpoint, data, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * GET CUSTOMER FROM STORAGE - SECURE RETRIEVAL
     */
    async getStoredCustomer() {
        try {
            const result = await chrome.storage.local.get(['secureCustomer']);
            return result.secureCustomer || null;
        } catch (error) {
            console.error('❌ SECURE AUTH: Failed to get stored customer:', error);
            return null;
        }
    }

    /**
     * STORE CUSTOMER SECURELY - NO SENSITIVE DATA
     */
    async storeCustomer(customerData) {
        try {
            // Only store non-sensitive data locally
            const secureData = {
                customerId: customerData.customerId,
                customerName: customerData.customerName,
                packageType: customerData.packageType,
                lastValidated: Date.now()
            };

            await chrome.storage.local.set({ secureCustomer: secureData });
            console.log('✅ SECURE AUTH: Customer data stored securely');
            
        } catch (error) {
            console.error('❌ SECURE AUTH: Failed to store customer:', error);
            throw error;
        }
    }

    /**
     * CLEAR STORED CUSTOMER DATA
     */
    async clearStoredCustomer() {
        try {
            await chrome.storage.local.remove(['secureCustomer']);
            console.log('✅ SECURE AUTH: Customer data cleared');
        } catch (error) {
            console.error('❌ SECURE AUTH: Failed to clear customer data:', error);
        }
    }

    /**
     * CHECK IF CACHED VALIDATION IS STILL VALID
     */
    async isCachedValidationValid() {
        const storedCustomer = await this.getStoredCustomer();
        
        if (!storedCustomer || !storedCustomer.lastValidated) {
            return false;
        }

        // Cache validation for 1 hour
        const oneHour = 60 * 60 * 1000;
        const validUntil = storedCustomer.lastValidated + oneHour;
        
        return Date.now() < validUntil;
    }

    /**
     * AUTHENTICATE CUSTOMER - MAIN ENTRY POINT
     */
    async authenticate(customerId = null) {
        try {
            // Try to use cached validation first
            if (!customerId && await this.isCachedValidationValid()) {
                const storedCustomer = await this.getStoredCustomer();
                console.log('✅ SECURE AUTH: Using cached validation:', storedCustomer.customerName);
                return storedCustomer;
            }

            // Get customer ID from storage if not provided
            if (!customerId) {
                const storedCustomer = await this.getStoredCustomer();
                customerId = storedCustomer?.customerId;
            }

            if (!customerId) {
                throw new Error('No customer ID available for authentication');
            }

            // Validate customer via secure proxy
            const customerData = await this.validateCustomer(customerId);
            
            if (!customerData) {
                await this.clearStoredCustomer();
                throw new Error('Customer validation failed');
            }

            // Store validated customer data
            await this.storeCustomer(customerData);
            
            return customerData;

        } catch (error) {
            console.error('❌ SECURE AUTH: Authentication failed:', error);
            await this.clearStoredCustomer();
            throw error;
        }
    }

    /**
     * UTILITY METHODS
     */
    getExtensionVersion() {
        try {
            return chrome.runtime.getManifest().version;
        } catch {
            return '1.0.0';
        }
    }

    getExtensionId() {
        try {
            return chrome.runtime.id;
        } catch {
            return 'unknown';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * REDIRECT TO AUTHENTICATION PAGE
     */
    redirectToAuth(reason = 'Authentication required') {
        const authUrl = `${this.proxyBaseUrl.replace('/api/extension', '')}/auth?reason=${encodeURIComponent(reason)}`;
        console.log('🔒 SECURE AUTH: Redirecting to authentication:', authUrl);
        chrome.tabs.create({ url: authUrl });
    }
}

// Export for use in other extension scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureCustomerAuth;
} else if (typeof window !== 'undefined') {
    window.SecureCustomerAuth = SecureCustomerAuth;
}