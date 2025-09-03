/**
 * AutoBolt Package Configuration Manager
 * Manages package types, pricing, and customer tier configurations
 * 
 * This module handles package definitions, pricing calculations,
 * tier-based feature access, and upgrade/downgrade logic.
 */

const { AIRTABLE_SCHEMA_CONFIG } = require('./airtable-schema-enhancement.js');

class PackageConfigurationManager {
    constructor(config = {}) {
        this.config = {
            ...AIRTABLE_SCHEMA_CONFIG,
            ...config
        };
        
        // Default package configurations
        this.defaultPackages = {
            'Starter': {
                package_id: 'Starter',
                package_name: 'Starter Package',
                directory_limit: 50,
                priority_level: 4,
                processing_speed: 'standard',
                price_monthly: 29.99,
                price_annual: 299.99,
                features_included: [
                    '50 Directory Submissions',
                    'Email Support',
                    'Basic Reporting',
                    'Standard Processing (5-7 days)',
                    'Core Directory Network'
                ].join('\n'),
                max_concurrent_submissions: 1,
                support_level: 'Email Support',
                is_active: true,
                description: 'Perfect for small businesses getting started with directory marketing',
                target_audience: 'Small businesses, startups, solopreneurs'
            },
            'Growth': {
                package_id: 'Growth',
                package_name: 'Growth Package',
                directory_limit: 200,
                priority_level: 3,
                processing_speed: 'priority',
                price_monthly: 79.99,
                price_annual: 799.99,
                features_included: [
                    '200 Directory Submissions',
                    'Priority Support',
                    'Advanced Reporting',
                    'Priority Processing (3-5 days)',
                    'Extended Directory Network',
                    'Performance Analytics',
                    'Submission Tracking'
                ].join('\n'),
                max_concurrent_submissions: 2,
                support_level: 'Priority Support',
                is_active: true,
                description: 'Ideal for growing businesses looking to expand their online presence',
                target_audience: 'Growing businesses, local service providers'
            },
            'Professional': {
                package_id: 'Professional',
                package_name: 'Professional Package',
                directory_limit: 500,
                priority_level: 2,
                processing_speed: 'rush',
                price_monthly: 149.99,
                price_annual: 1499.99,
                features_included: [
                    '500 Directory Submissions',
                    'Phone Support',
                    'Premium Reporting & Analytics',
                    'Rush Processing (1-2 days)',
                    'Premium Directory Network',
                    'Custom Submission Scheduling',
                    'Dedicated Account Manager',
                    'API Access',
                    'Bulk Operations'
                ].join('\n'),
                max_concurrent_submissions: 3,
                support_level: 'Phone Support',
                is_active: true,
                description: 'Comprehensive solution for established businesses with serious growth goals',
                target_audience: 'Established businesses, franchises, multi-location companies'
            },
            'Enterprise': {
                package_id: 'Enterprise',
                package_name: 'Enterprise Package',
                directory_limit: 999999, // Unlimited
                priority_level: 1,
                processing_speed: 'white-glove',
                price_monthly: 299.99,
                price_annual: 2999.99,
                features_included: [
                    'Unlimited Directory Submissions',
                    'Dedicated Support Team',
                    'Enterprise Reporting Suite',
                    'White-glove Processing (Same day)',
                    'Complete Directory Network',
                    'Custom Integration Support',
                    'Multiple Account Management',
                    'Advanced API Access',
                    'Custom Workflows',
                    'SLA Guarantees',
                    'Monthly Strategy Calls'
                ].join('\n'),
                max_concurrent_submissions: 5,
                support_level: 'Dedicated Support',
                is_active: true,
                description: 'Premium service for large enterprises requiring maximum scale and support',
                target_audience: 'Large enterprises, agencies, enterprise franchises'
            }
        };
        
        // Feature matrix for package comparison
        this.featureMatrix = {
            directorySubmissions: {
                'Starter': 50,
                'Growth': 200,
                'Professional': 500,
                'Enterprise': 'Unlimited'
            },
            processingTime: {
                'Starter': '5-7 business days',
                'Growth': '3-5 business days',
                'Professional': '1-2 business days',
                'Enterprise': 'Same day'
            },
            supportLevel: {
                'Starter': 'Email support',
                'Growth': 'Priority email support',
                'Professional': 'Phone + email support',
                'Enterprise': 'Dedicated support team'
            },
            reporting: {
                'Starter': 'Basic reports',
                'Growth': 'Advanced reports',
                'Professional': 'Premium analytics',
                'Enterprise': 'Enterprise reporting suite'
            },
            apiAccess: {
                'Starter': false,
                'Growth': false,
                'Professional': true,
                'Enterprise': true
            },
            customIntegrations: {
                'Starter': false,
                'Growth': false,
                'Professional': false,
                'Enterprise': true
            },
            accountManager: {
                'Starter': false,
                'Growth': false,
                'Professional': true,
                'Enterprise': true
            },
            slaGuarantee: {
                'Starter': false,
                'Growth': false,
                'Professional': false,
                'Enterprise': true
            }
        };
    }

    /**
     * Initialize package configurations in Airtable
     */
    async initializePackages() {
        console.log('🎁 Initializing package configurations...');
        
        try {
            for (const [packageId, packageData] of Object.entries(this.defaultPackages)) {
                await this.createOrUpdatePackage(packageId, packageData);
            }
            
            console.log('✅ Package configurations initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize packages:', error);
            throw error;
        }
    }

    /**
     * Create or update a package configuration
     */
    async createOrUpdatePackage(packageId, packageData) {
        try {
            // Check if package already exists
            const existingPackage = await this.getPackageById(packageId);
            
            if (existingPackage) {
                console.log(`📝 Updating existing package: ${packageId}`);
                return await this.updatePackage(existingPackage.id, packageData);
            } else {
                console.log(`🆕 Creating new package: ${packageId}`);
                return await this.createPackage(packageData);
            }
        } catch (error) {
            console.error(`❌ Failed to create/update package ${packageId}:`, error);
            throw error;
        }
    }

    /**
     * Get package by ID
     */
    async getPackageById(packageId) {
        try {
            const filter = `{package_id} = '${packageId}'`;
            const response = await this.makeAirtableRequest('GET', 'Packages', {
                filterByFormula: filter,
                maxRecords: 1
            });
            
            return response.records[0] || null;
        } catch (error) {
            console.error(`❌ Failed to get package ${packageId}:`, error);
            return null;
        }
    }

    /**
     * Create new package
     */
    async createPackage(packageData) {
        return await this.makeAirtableRequest('POST', 'Packages', {
            fields: packageData
        });
    }

    /**
     * Update existing package
     */
    async updatePackage(recordId, packageData) {
        return await this.makeAirtableRequest('PATCH', `Packages/${recordId}`, {
            fields: packageData
        });
    }

    /**
     * Get all active packages
     */
    async getActivePackages() {
        try {
            const response = await this.makeAirtableRequest('GET', 'Packages', {
                filterByFormula: '{is_active} = TRUE()',
                sort: [{ field: 'priority_level', direction: 'asc' }]
            });
            
            return response.records || [];
        } catch (error) {
            console.error('❌ Failed to get active packages:', error);
            return [];
        }
    }

    /**
     * Get package pricing information
     */
    async getPackagePricing(packageId) {
        try {
            const packageRecord = await this.getPackageById(packageId);
            if (!packageRecord) {
                throw new Error(`Package ${packageId} not found`);
            }
            
            const fields = packageRecord.fields;
            return {
                packageId: fields.package_id,
                packageName: fields.package_name,
                pricing: {
                    monthly: fields.price_monthly,
                    annual: fields.price_annual,
                    annualSavings: (fields.price_monthly * 12) - fields.price_annual,
                    annualDiscount: Math.round(((fields.price_monthly * 12) - fields.price_annual) / (fields.price_monthly * 12) * 100)
                },
                features: {
                    directoryLimit: fields.directory_limit,
                    processingSpeed: fields.processing_speed,
                    supportLevel: fields.support_level,
                    maxConcurrentSubmissions: fields.max_concurrent_submissions
                }
            };
        } catch (error) {
            console.error(`❌ Failed to get package pricing for ${packageId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate upgrade/downgrade pricing
     */
    async calculatePackageChange(currentPackage, newPackage, billingCycle = 'monthly') {
        try {
            const current = await this.getPackagePricing(currentPackage);
            const target = await this.getPackagePricing(newPackage);
            
            const currentPrice = billingCycle === 'annual' ? current.pricing.annual : current.pricing.monthly;
            const targetPrice = billingCycle === 'annual' ? target.pricing.annual : target.pricing.monthly;
            
            const priceDifference = targetPrice - currentPrice;
            const isUpgrade = priceDifference > 0;
            
            return {
                currentPackage: current,
                targetPackage: target,
                billingCycle,
                priceDifference: Math.abs(priceDifference),
                isUpgrade,
                changeType: isUpgrade ? 'upgrade' : 'downgrade',
                effectiveDate: new Date().toISOString().split('T')[0],
                prorationAmount: this.calculateProration(currentPrice, targetPrice, billingCycle)
            };
        } catch (error) {
            console.error('❌ Failed to calculate package change:', error);
            throw error;
        }
    }

    /**
     * Calculate proration for package changes
     */
    calculateProration(currentPrice, newPrice, billingCycle) {
        // Simple proration calculation - in production you'd use actual billing dates
        const daysInCycle = billingCycle === 'annual' ? 365 : 30;
        const remainingDays = Math.floor(Math.random() * daysInCycle); // Mock remaining days
        
        const currentDailyRate = currentPrice / daysInCycle;
        const newDailyRate = newPrice / daysInCycle;
        
        const currentRemaining = currentDailyRate * remainingDays;
        const newRemaining = newDailyRate * remainingDays;
        
        return {
            remainingDays,
            currentRemaining: Math.round(currentRemaining * 100) / 100,
            newRemaining: Math.round(newRemaining * 100) / 100,
            prorationCredit: Math.round((currentRemaining - newRemaining) * 100) / 100
        };
    }

    /**
     * Check if customer can access feature
     */
    async checkFeatureAccess(customerId, featureName) {
        try {
            // Get customer package
            const customer = await this.getCustomer(customerId);
            if (!customer) {
                return { hasAccess: false, reason: 'Customer not found' };
            }
            
            const packageType = customer.fields.package_type;
            const feature = this.featureMatrix[featureName];
            
            if (!feature) {
                return { hasAccess: false, reason: 'Feature not found' };
            }
            
            const hasAccess = feature[packageType] !== false && feature[packageType] !== undefined;
            
            return {
                hasAccess,
                packageType,
                featureValue: feature[packageType],
                reason: hasAccess ? 'Feature included in package' : 'Feature not available in current package'
            };
        } catch (error) {
            console.error('❌ Failed to check feature access:', error);
            return { hasAccess: false, reason: 'Error checking access' };
        }
    }

    /**
     * Get usage limits for customer
     */
    async getUsageLimits(customerId) {
        try {
            const customer = await this.getCustomer(customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }
            
            const packageType = customer.fields.package_type;
            const packageConfig = await this.getPackageById(packageType);
            
            if (!packageConfig) {
                throw new Error('Package configuration not found');
            }
            
            return {
                customerId,
                packageType,
                limits: {
                    totalDirectories: packageConfig.fields.directory_limit,
                    directoriesUsed: customer.fields.directories_completed || 0,
                    directoriesRemaining: customer.fields.directories_remaining || packageConfig.fields.directory_limit,
                    maxConcurrentSubmissions: packageConfig.fields.max_concurrent_submissions,
                    processingSpeed: packageConfig.fields.processing_speed,
                    priorityLevel: packageConfig.fields.priority_level
                },
                features: this.getPackageFeatures(packageType)
            };
        } catch (error) {
            console.error('❌ Failed to get usage limits:', error);
            throw error;
        }
    }

    /**
     * Get package features
     */
    getPackageFeatures(packageType) {
        const features = {};
        
        Object.entries(this.featureMatrix).forEach(([featureName, packageValues]) => {
            features[featureName] = packageValues[packageType];
        });
        
        return features;
    }

    /**
     * Generate package comparison matrix
     */
    generatePackageComparison() {
        const packages = Object.keys(this.defaultPackages);
        const features = Object.keys(this.featureMatrix);
        
        const comparison = {
            packages: packages.map(pkg => ({
                id: pkg,
                name: this.defaultPackages[pkg].package_name,
                pricing: {
                    monthly: this.defaultPackages[pkg].price_monthly,
                    annual: this.defaultPackages[pkg].price_annual
                }
            })),
            features: features.map(feature => ({
                name: feature,
                displayName: this.formatFeatureName(feature),
                values: packages.reduce((acc, pkg) => {
                    acc[pkg] = this.featureMatrix[feature][pkg];
                    return acc;
                }, {})
            }))
        };
        
        return comparison;
    }

    /**
     * Format feature name for display
     */
    formatFeatureName(featureName) {
        const displayNames = {
            directorySubmissions: 'Directory Submissions',
            processingTime: 'Processing Time',
            supportLevel: 'Support Level',
            reporting: 'Reporting & Analytics',
            apiAccess: 'API Access',
            customIntegrations: 'Custom Integrations',
            accountManager: 'Account Manager',
            slaGuarantee: 'SLA Guarantee'
        };
        
        return displayNames[featureName] || featureName;
    }

    /**
     * Validate package upgrade eligibility
     */
    async validateUpgradeEligibility(customerId, targetPackage) {
        try {
            const customer = await this.getCustomer(customerId);
            if (!customer) {
                return { eligible: false, reason: 'Customer not found' };
            }
            
            const currentPackage = customer.fields.package_type;
            const subscriptionStatus = customer.fields.subscription_status;
            
            // Check subscription status
            if (subscriptionStatus !== 'Active') {
                return { 
                    eligible: false, 
                    reason: `Cannot upgrade: subscription status is ${subscriptionStatus}` 
                };
            }
            
            // Check if it's actually an upgrade
            const currentPriority = this.defaultPackages[currentPackage]?.priority_level;
            const targetPriority = this.defaultPackages[targetPackage]?.priority_level;
            
            if (!currentPriority || !targetPriority) {
                return { eligible: false, reason: 'Invalid package configuration' };
            }
            
            if (currentPriority <= targetPriority) {
                return { eligible: false, reason: 'Target package is not an upgrade' };
            }
            
            return {
                eligible: true,
                currentPackage,
                targetPackage,
                upgradeType: 'immediate',
                message: `Upgrade from ${currentPackage} to ${targetPackage} is available`
            };
        } catch (error) {
            console.error('❌ Failed to validate upgrade eligibility:', error);
            return { eligible: false, reason: 'Error validating eligibility' };
        }
    }

    /**
     * Process package change
     */
    async processPackageChange(customerId, newPackage, billingCycle = 'monthly') {
        try {
            console.log(`📦 Processing package change for customer ${customerId} to ${newPackage}`);
            
            const customer = await this.getCustomer(customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }
            
            const currentPackage = customer.fields.package_type;
            const changeCalculation = await this.calculatePackageChange(currentPackage, newPackage, billingCycle);
            
            // Update customer record
            const newPackageConfig = await this.getPackageById(newPackage);
            const updateData = {
                package_type: newPackage,
                total_directories_allocated: newPackageConfig.fields.directory_limit,
                priority_level: newPackageConfig.fields.priority_level,
                last_modified: new Date().toISOString()
            };
            
            await this.updateCustomer(customerId, updateData);
            
            // Log the package change
            await this.logPackageChange(customerId, currentPackage, newPackage, changeCalculation);
            
            console.log(`✅ Package change completed: ${currentPackage} → ${newPackage}`);
            
            return {
                success: true,
                customerId,
                previousPackage: currentPackage,
                newPackage,
                changeCalculation,
                effectiveDate: new Date().toISOString(),
                message: `Package successfully changed from ${currentPackage} to ${newPackage}`
            };
            
        } catch (error) {
            console.error('❌ Failed to process package change:', error);
            throw error;
        }
    }

    /**
     * Log package change event
     */
    async logPackageChange(customerId, fromPackage, toPackage, calculation) {
        try {
            const logData = {
                log_level: 'INFO',
                event_type: 'Customer Action',
                customer_id: [customerId],
                event_summary: `Package change: ${fromPackage} → ${toPackage}`,
                event_details: `Customer upgraded/downgraded from ${fromPackage} to ${toPackage}. Price difference: $${calculation.priceDifference}`,
                additional_data: JSON.stringify({
                    fromPackage,
                    toPackage,
                    changeType: calculation.changeType,
                    priceDifference: calculation.priceDifference,
                    billingCycle: calculation.billingCycle,
                    prorationAmount: calculation.prorationAmount
                }),
                processor_instance: 'package_manager'
            };
            
            await this.makeAirtableRequest('POST', 'ProcessingLogs', {
                fields: logData
            });
        } catch (error) {
            console.error('❌ Failed to log package change:', error);
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Make Airtable API request
     */
    async makeAirtableRequest(method, tableName, params = {}) {
        const url = `${this.config.apiUrl}/${this.config.baseId}/${tableName}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, JSON.stringify(item)));
                } else {
                    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });
            url += `?${searchParams.toString()}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Get customer record
     */
    async getCustomer(customerId) {
        try {
            return await this.makeAirtableRequest('GET', `Customers/${customerId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update customer record
     */
    async updateCustomer(customerId, updateData) {
        return await this.makeAirtableRequest('PATCH', `Customers/${customerId}`, {
            fields: updateData
        });
    }
}

module.exports = PackageConfigurationManager;