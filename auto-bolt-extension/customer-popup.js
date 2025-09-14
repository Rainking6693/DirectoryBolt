/**
 * ALEX - DirectoryBolt Extension Customer Authentication
 * Fixes customer validation and extension functionality
 */

class DirectoryBoltExtension {
    constructor() {
        this.apiUrl = 'https://directorybolt.com/api';
        this.customer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkSavedAuth();
    }

    bindEvents() {
        document.getElementById('validate-btn').addEventListener('click', () => this.validateCustomer());
        document.getElementById('auto-fill-btn').addEventListener('click', () => this.autoFill());
        document.getElementById('queue-btn').addEventListener('click', () => this.addToQueue());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Allow Enter key to validate
        document.getElementById('customer-id').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateCustomer();
            }
        });
    }

    async checkSavedAuth() {
        try {
            const result = await chrome.storage.local.get(['customer']);
            if (result.customer) {
                this.customer = result.customer;
                this.showCustomerSection();
            }
        } catch (error) {
            console.log('No saved authentication found');
        }
    }

    async validateCustomer() {
        const customerId = document.getElementById('customer-id').value.trim();
        
        if (!customerId) {
            this.showStatus('Please enter your Customer ID', 'error');
            return;
        }

        if (!customerId.startsWith('DIR-') && !customerId.startsWith('TEST-')) {
            this.showStatus('Customer ID must start with DIR- or TEST-', 'error');
            return;
        }

        this.showStatus('Validating customer...', 'info');
        document.getElementById('validate-btn').disabled = true;

        try {
            // ALEX FIX: Enhanced customer validation with multiple API attempts
            let customer = await this.attemptCustomerLookup(customerId);
            
            if (!customer) {
                // Try alternative formats
                const alternatives = this.generateAlternativeIds(customerId);
                for (const altId of alternatives) {
                    customer = await this.attemptCustomerLookup(altId);
                    if (customer) {
                        console.log(`Found customer with alternative ID: ${altId}`);
                        break;
                    }
                }
            }

            if (customer) {
                this.customer = customer;
                await chrome.storage.local.set({ customer: customer });
                this.showCustomerSection();
                this.showStatus('Customer validated successfully!', 'success');
            } else {
                // ALEX FIX: Create test customers for development
                if (customerId.startsWith('TEST-')) {
                    customer = this.createTestCustomer(customerId);
                    this.customer = customer;
                    await chrome.storage.local.set({ customer: customer });
                    this.showCustomerSection();
                    this.showStatus('Test customer created successfully!', 'success');
                } else {
                    this.showStatus('Customer ID not found. Please verify your ID starts with "DIR-" or contact support.', 'error');
                }
            }

        } catch (error) {
            console.error('Validation error:', error);
            
            if (error.message.includes('401')) {
                this.showStatus('Authentication failed. Please check your Customer ID.', 'error');
            } else if (error.message.includes('Customer not found')) {
                this.showStatus('Customer ID not found in database. Please verify your ID.', 'error');
            } else {
                this.showStatus('Validation failed. Please try again later.', 'error');
            }
        } finally {
            document.getElementById('validate-btn').disabled = false;
        }
    }

    generateAlternativeIds(customerId) {
        const alternatives = [];
        
        // Try different date formats
        if (customerId.startsWith('DIR-2025')) {
            const base = customerId.replace('DIR-2025', '');
            alternatives.push(`DIR-202509${base}`);
            alternatives.push(`DIR-20259${base}`);
        }
        
        // Try without prefix
        if (customerId.startsWith('DIR-')) {
            alternatives.push(customerId.replace('DIR-', ''));
        }
        
        return alternatives;
    }

    async attemptCustomerLookup(customerId) {
        const endpoints = [
            `${this.apiUrl}/customer/validate`, // Netlify redirect → function
            `${this.apiUrl.replace('/api', '')}/.netlify/functions/customer-validate`, // direct function
            `${this.apiUrl}/extension/secure-validate`, // secure server-side proxy
            `${this.apiUrl}/extension/validate-fixed` // diagnostic validator
        ];

        const payload = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId }) };

        for (const url of endpoints) {
            try {
                const response = await fetch(url, payload);
                if (response.status === 404) {
                    // Not found at this endpoint, try next
                    continue;
                }
                if (!response.ok) {
                    // Try next endpoint on non-OK status
                    continue;
                }
                const data = await response.json().catch(() => ({}));

                // Normalize different response shapes
                // Netlify function shape
                if (data && data.success && data.customer) {
                    return data.customer;
                }
                // Secure endpoints shape
                if (data && data.valid === true) {
                    return {
                        customerId,
                        businessName: data.customerName || 'Customer',
                        packageType: data.packageType || 'starter',
                        submissionStatus: 'active'
                    };
                }
                // Some endpoints may directly return customer-like object
                if (data && (data.customerId || data.customerID)) {
                    return data;
                }

                // If reached here but response OK, try next as a safety
            } catch (err) {
                // Network error on this endpoint, try next
                continue;
            }
        }

        // If none succeeded
        return null;
    }

    createTestCustomer(customerId) {
        return {
            customerId: customerId,
            businessName: 'Test Business',
            email: 'test@example.com',
            packageType: '25 Directories',
            submissionStatus: 'active',
            isTestCustomer: true,
            note: 'Test customer for development'
        };
    }

    showCustomerSection() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('customer-section').style.display = 'block';
        
        const customerInfo = document.getElementById('customer-info');
        customerInfo.innerHTML = `
            <strong>Customer:</strong> ${this.customer.businessName || 'Test Business'}<br>
            <strong>ID:</strong> ${this.customer.customerId}<br>
            <strong>Package:</strong> ${this.customer.packageType || '25 Directories'}<br>
            <strong>Status:</strong> ${this.customer.submissionStatus || 'Active'}
        `;
    }

    async autoFill() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Inject auto-fill script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.performAutoFill,
                args: [this.customer]
            });
            
            this.showStatus('Auto-fill completed!', 'success');
        } catch (error) {
            console.error('Auto-fill error:', error);
            this.showStatus('Auto-fill failed. Please try manually.', 'error');
        }
    }

    performAutoFill(customer) {
        // This function runs in the context of the current page
        const businessData = {
            businessName: customer.businessName || 'Test Business',
            email: customer.email || 'test@example.com',
            phone: customer.phone || '555-1234',
            address: customer.address || '123 Main St',
            city: customer.city || 'Test City',
            state: customer.state || 'TS',
            zip: customer.zip || '12345',
            website: customer.website || 'https://example.com',
            description: customer.description || 'Test business description'
        };

        // Common field selectors for various directory sites
        const fieldMappings = {
            businessName: ['[name*="business"]', '[name*="company"]', '[name*="name"]', '#business-name', '#company-name'],
            email: ['[name*="email"]', '[type="email"]', '#email'],
            phone: ['[name*="phone"]', '[type="tel"]', '#phone'],
            address: ['[name*="address"]', '[name*="street"]', '#address'],
            city: ['[name*="city"]', '#city'],
            state: ['[name*="state"]', '#state'],
            zip: ['[name*="zip"]', '[name*="postal"]', '#zip'],
            website: ['[name*="website"]', '[name*="url"]', '#website'],
            description: ['[name*="description"]', '[name*="about"]', 'textarea']
        };

        let filledFields = 0;

        for (const [key, selectors] of Object.entries(fieldMappings)) {
            const value = businessData[key];
            if (!value) continue;

            for (const selector of selectors) {
                const field = document.querySelector(selector);
                if (field && !field.value) {
                    field.value = value;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    filledFields++;
                    break;
                }
            }
        }

        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        notification.textContent = `DirectoryBolt: Filled ${filledFields} fields`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async addToQueue() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const queueItem = {
                customerId: this.customer.customerId,
                url: tab.url,
                title: tab.title,
                timestamp: Date.now(),
                status: 'pending'
            };

            // Save to local storage queue
            const result = await chrome.storage.local.get(['submissionQueue']);
            const queue = result.submissionQueue || [];
            queue.push(queueItem);
            
            await chrome.storage.local.set({ submissionQueue: queue });
            
            this.showStatus(`Added ${tab.title} to submission queue`, 'success');
        } catch (error) {
            console.error('Queue error:', error);
            this.showStatus('Failed to add to queue', 'error');
        }
    }

    async logout() {
        await chrome.storage.local.remove(['customer']);
        this.customer = null;
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('customer-section').style.display = 'none';
        document.getElementById('customer-id').value = '';
        this.showStatus('Logged out successfully', 'success');
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DirectoryBoltExtension();
});