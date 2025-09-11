/**
 * SECURE CUSTOMER AUTHENTICATION - DIRECTORYBOLT PROXY
 * Uses Ben's secure DirectoryBolt.com proxy instead of direct Airtable access
 * NO HARDCODED CREDENTIALS - ALL CALLS VIA SECURE PROXY
 */

class SimpleCustomerAuth {
    constructor() {
        // SECURE: NO HARDCODED CREDENTIALS
        // All API calls go through secure DirectoryBolt.com proxy
        this.proxyBaseUrl = 'https://directorybolt.com/api/extension';
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * SECURE VALIDATION - VIA DIRECTORYBOLT PROXY ONLY
     * Customer exists in database = valid
     * Customer doesn't exist = invalid
     * NO HARDCODED CREDENTIALS EXPOSED
     */
    async validateCustomer(customerId) {
        console.log('🔒 SECURE AUTH: Validating customer via DirectoryBolt proxy:', customerId);
        
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        // Validate customer ID format client-side
        if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
            throw new Error('Invalid Customer ID format. Must start with DIR- or DB-');
        }

        try {
            // SECURE: All validation happens via DirectoryBolt proxy
            const response = await this.secureProxyCall('/secure-validate', {
                customerId: customerId.trim(),
                extensionVersion: this.getExtensionVersion()
            });

            if (!response.valid) {
                console.log('❌ SECURE AUTH: Customer validation failed:', response.error);
                throw new Error(response.error || 'Customer not found in database');
            }

            console.log('✅ SECURE AUTH: Customer validated:', response.customerName);
            
            return {
                valid: true,
                customerId: customerId.trim(),
                customerName: response.customerName || response.businessName || 'Customer',
                businessName: response.businessName || response.customerName || 'Customer', 
                packageType: response.packageType || 'Professional',
                status: 'active',
                email: response.email || null,
                phone: response.phone || null,
                website: response.website || null,
                directories: response.directories || response.directoryCount || 100,
                dataSource: 'directorybolt_proxy',
                createdTime: response.createdTime || new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ SECURE AUTH: Validation failed:', error.message);
            throw error;
        }
    }

    /**
     * SECURE PROXY API CALL - WITH RETRY LOGIC AND ERROR HANDLING
     */
    async secureProxyCall(endpoint, data, retryCount = 0) {
        const url = `${this.proxyBaseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-ID': this.getExtensionId(),
                    'User-Agent': 'DirectoryBolt-Extension/3.0.1'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Proxy API call failed: ${response.status} - ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`❌ SECURE AUTH: Proxy call failed (attempt ${retryCount + 1}):`, error);
            
            // Retry logic with exponential backoff
            if (retryCount < this.maxRetries) {
                await this.delay(this.retryDelay * Math.pow(2, retryCount));
                return this.secureProxyCall(endpoint, data, retryCount + 1);
            }
            
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
            return '3.0.1';
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
}

// GLOBAL INSTANCE - SINGLE AUTHENTICATION SYSTEM
window.simpleCustomerAuth = new SimpleCustomerAuth();

console.log('✅ SIMPLE AUTH: Authentication system ready');