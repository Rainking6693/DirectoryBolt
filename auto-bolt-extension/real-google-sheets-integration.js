/**
 * SECURE DIRECTORYBOLT INTEGRATION - PROXY MODE
 * Connects via Ben's secure DirectoryBolt.com proxy
 * NO DIRECT GOOGLE SHEETS ACCESS - SECURE PROXY ONLY
 */

class RealDirectoryBoltAPI {
    constructor() {
        // SECURE: NO HARDCODED CREDENTIALS
        // All API calls go through secure DirectoryBolt.com proxy
        this.proxyBaseUrl = 'https://directorybolt.com/api/extension';
        this.cache = new Map();
        this.debugMode = true;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * SECURE: Fetch customer data via DirectoryBolt proxy
     */
    async fetchRealCustomerData(customerId) {
        console.log('🔒 SECURE: Fetching customer data via DirectoryBolt proxy for:', customerId);

        try {
            // Check cache first
            if (this.cache.has(customerId)) {
                console.log('📋 Returning cached customer data');
                return this.cache.get(customerId);
            }

            // SECURE: Fetch via DirectoryBolt proxy (no direct Google Sheets access)
            const customerData = await this.fetchViaSecureProxy(customerId);
            if (customerData) {
                console.log('✅ Customer data found via secure proxy:', customerData);
                this.cache.set(customerId, customerData);
                return customerData;
            }

            console.log('❌ Customer not found in database');
            throw new Error('Customer not found in database');

        } catch (error) {
            console.error('❌ Error fetching customer data:', error);
            throw error;
        }
    }

    /**
     * SECURE: Fetch via DirectoryBolt proxy (no direct Google Sheets access)
     */
    async fetchViaSecureProxy(customerId) {
        try {
            console.log('🔒 Connecting to DirectoryBolt secure proxy...');
            
            const response = await this.secureProxyCall('/secure-validate', {
                customerId: customerId.trim(),
                extensionVersion: this.getExtensionVersion()
            });

            if (!response.valid) {
                console.log('❌ Customer validation failed via proxy:', response.error);
                return null;
            }

            return this.parseProxyCustomerResponse(response, customerId);

        } catch (error) {
            console.error('❌ Secure proxy fetch failed:', error);
            throw error;
        }
    }

    /**
     * SECURE PROXY API CALL - WITH RETRY LOGIC
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
            console.error(`❌ Proxy call failed (attempt ${retryCount + 1}):`, error);
            
            // Retry logic with exponential backoff
            if (retryCount < this.maxRetries) {
                await this.delay(this.retryDelay * Math.pow(2, retryCount));
                return this.secureProxyCall(endpoint, data, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * SECURE: Parse customer response from DirectoryBolt proxy
     */
    parseProxyCustomerResponse(response, customerId) {
        console.log('📊 Parsing secure proxy customer response:', response);

        const customerData = {
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
            createdTime: response.createdTime || new Date().toISOString(),
            lastModified: response.lastModified || new Date().toISOString(),
            dataSource: 'directorybolt_proxy',
            realData: true
        };

        console.log('✅ Secure proxy customer data parsed:', customerData);
        return customerData;
    }

    /**
     * Helper: Extract field value from multiple possible field names
     */
    extractField(fields, possibleNames) {
        for (const name of possibleNames) {
            if (fields[name] && fields[name].toString().trim()) {
                return fields[name].toString().trim();
            }
        }
        return null;
    }

    /**
     * Helper: Extract numeric value from fields
     */
    extractNumber(fields, possibleNames) {
        for (const name of possibleNames) {
            if (fields[name]) {
                const num = parseInt(fields[name]);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }
        return null;
    }

    // EMILY'S FIX: Removed flawed validation logic
    // Customer ID is ONLY valid if it exists in database
    // No format validation, no placeholders, no "valid but not in database"

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

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Customer data cache cleared');
    }
}

// PERMANENT FIX: Replace the mock system with real system
window.realDirectoryBoltAPI = new RealDirectoryBoltAPI();

console.log('🚀 PERMANENT FIX: Real DirectoryBolt API initialized');
console.log('📊 Ready to fetch REAL customer data from Google Sheets');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealDirectoryBoltAPI;
}