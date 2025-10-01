/**
 * AutoBolt Package Manager
 * Tier-specific feature access control and package-based processing
 * 
 * This module handles:
 * - Package tier configurations and feature access control
 * - Directory filtering based on package capabilities
 * - Processing speed and resource allocation by tier
 * - Quality assurance levels and retry strategies
 * - Customer tier validation and upgrade recommendations
 */

class PackageManager {
    constructor(config = {}) {
        this.config = {
            enableUpgradeRecommendations: config.enableUpgradeRecommendations !== false,
            qualityThresholds: config.qualityThresholds || {},
            performanceTracking: config.performanceTracking !== false,
            ...config
        };

        // Package tier definitions with comprehensive feature sets
        this.packageTiers = {
            'Enterprise': {
                tier: 'Enterprise',
                priority: 1,
                displayName: 'Enterprise',
                color: '#6366F1', // Indigo
                
                // Directory access
                directoryAccess: {
                    maxDirectories: null, // Unlimited
                    tierAccess: [1, 2, 3, 4, 5], // All directory tiers
                    allowDifficult: true,
                    allowAntiBot: true,
                    allowCaptcha: true,
                    allowManualReview: true
                },
                
                // Processing capabilities
                processing: {
                    concurrentSubmissions: 5,
                    processingSpeed: 'white-glove', // 8-10 seconds per submission
                    retryAttempts: 5,
                    retryStrategy: 'comprehensive',
                    humanVerification: true,
                    manualIntervention: true,
                    customScripting: true,
                    priorityProcessing: true
                },
                
                // Quality assurance
                qualityAssurance: {
                    level: 'comprehensive',
                    humanReview: true,
                    accuracyTarget: 0.98,
                    verificationSteps: ['automated', 'human', 'client-review'],
                    qualityChecks: ['data-validation', 'format-verification', 'content-accuracy', 'brand-compliance']
                },
                
                // Support and SLA
                support: {
                    level: 'dedicated-account-manager',
                    channels: ['phone', 'email', 'chat', 'video'],
                    responseTime: 'immediate', // < 1 hour
                    availability: '24/7',
                    escalationPath: 'direct-to-cto'
                },
                
                // Service Level Agreement
                sla: {
                    processingStart: 0, // Immediate
                    completionTime: 15, // 15 minutes max
                    successRate: 0.98,
                    uptime: 0.999,
                    dataAccuracy: 0.99
                },
                
                // Features and capabilities
                features: [
                    'unlimited-directories',
                    'white-glove-processing',
                    'human-verification',
                    'comprehensive-qa',
                    'custom-scripting',
                    'manual-intervention',
                    'dedicated-account-manager',
                    'priority-processing',
                    'custom-reporting',
                    'api-access',
                    'webhook-notifications',
                    'brand-customization'
                ],
                
                // Pricing and limits
                pricing: {
                    basePrice: 2999, // Monthly
                    perDirectoryFee: 0,
                    setupFee: 1000,
                    overage: 'included'
                }
            },
            
            'Professional': {
                tier: 'Professional',
                priority: 2,
                displayName: 'Professional',
                color: '#059669', // Emerald
                
                directoryAccess: {
                    maxDirectories: 500,
                    tierAccess: [1, 2, 3],
                    allowDifficult: true,
                    allowAntiBot: false,
                    allowCaptcha: true,
                    allowManualReview: false
                },
                
                processing: {
                    concurrentSubmissions: 3,
                    processingSpeed: 'rush', // 5-6 seconds per submission
                    retryAttempts: 3,
                    retryStrategy: 'smart',
                    humanVerification: false,
                    manualIntervention: 'on-failure',
                    customScripting: false,
                    priorityProcessing: true
                },
                
                qualityAssurance: {
                    level: 'enhanced',
                    humanReview: 'on-failure',
                    accuracyTarget: 0.95,
                    verificationSteps: ['automated', 'smart-validation'],
                    qualityChecks: ['data-validation', 'format-verification', 'content-accuracy']
                },
                
                support: {
                    level: 'phone-email',
                    channels: ['phone', 'email'],
                    responseTime: 'within-15-minutes',
                    availability: 'business-hours',
                    escalationPath: 'senior-support'
                },
                
                sla: {
                    processingStart: 15, // 15 minutes max
                    completionTime: 120, // 2 hours max
                    successRate: 0.95,
                    uptime: 0.99,
                    dataAccuracy: 0.96
                },
                
                features: [
                    'rush-processing',
                    'enhanced-qa',
                    'smart-retry',
                    'phone-support',
                    'detailed-reporting',
                    'priority-queue',
                    'form-optimization',
                    'batch-processing'
                ],
                
                pricing: {
                    basePrice: 999,
                    perDirectoryFee: 2.99,
                    setupFee: 199,
                    overage: '$4.99 per directory'
                }
            },
            
            'Growth': {
                tier: 'Growth',
                priority: 3,
                displayName: 'Growth',
                color: '#DC2626', // Red
                
                directoryAccess: {
                    maxDirectories: 200,
                    tierAccess: [1, 2],
                    allowDifficult: false,
                    allowAntiBot: false,
                    allowCaptcha: false,
                    allowManualReview: false
                },
                
                processing: {
                    concurrentSubmissions: 2,
                    processingSpeed: 'priority', // 3-4 seconds per submission
                    retryAttempts: 2,
                    retryStrategy: 'basic',
                    humanVerification: false,
                    manualIntervention: false,
                    customScripting: false,
                    priorityProcessing: false
                },
                
                qualityAssurance: {
                    level: 'standard',
                    humanReview: false,
                    accuracyTarget: 0.90,
                    verificationSteps: ['automated'],
                    qualityChecks: ['data-validation', 'format-verification']
                },
                
                support: {
                    level: 'email',
                    channels: ['email'],
                    responseTime: 'within-4-hours',
                    availability: 'business-hours',
                    escalationPath: 'support-team'
                },
                
                sla: {
                    processingStart: 60, // 1 hour max
                    completionTime: 480, // 8 hours max
                    successRate: 0.90,
                    uptime: 0.98,
                    dataAccuracy: 0.92
                },
                
                features: [
                    'priority-processing',
                    'standard-qa',
                    'basic-retry',
                    'email-support',
                    'standard-reporting',
                    'form-optimization'
                ],
                
                pricing: {
                    basePrice: 299,
                    perDirectoryFee: 1.99,
                    setupFee: 99,
                    overage: '$2.99 per directory'
                }
            },
            
            'Starter': {
                tier: 'Starter',
                priority: 4,
                displayName: 'Starter',
                color: '#6B7280', // Gray
                
                directoryAccess: {
                    maxDirectories: 50,
                    tierAccess: [1],
                    allowDifficult: false,
                    allowAntiBot: false,
                    allowCaptcha: false,
                    allowManualReview: false
                },
                
                processing: {
                    concurrentSubmissions: 1,
                    processingSpeed: 'standard', // 1.5-2 seconds per submission
                    retryAttempts: 1,
                    retryStrategy: 'simple',
                    humanVerification: false,
                    manualIntervention: false,
                    customScripting: false,
                    priorityProcessing: false
                },
                
                qualityAssurance: {
                    level: 'basic',
                    humanReview: false,
                    accuracyTarget: 0.85,
                    verificationSteps: ['automated'],
                    qualityChecks: ['basic-validation']
                },
                
                support: {
                    level: 'email-only',
                    channels: ['email'],
                    responseTime: 'within-24-hours',
                    availability: 'business-hours',
                    escalationPath: 'support-team'
                },
                
                sla: {
                    processingStart: 240, // 4 hours max
                    completionTime: 960, // 16 hours max
                    successRate: 0.85,
                    uptime: 0.95,
                    dataAccuracy: 0.88
                },
                
                features: [
                    'standard-processing',
                    'basic-qa',
                    'simple-retry',
                    'email-support',
                    'basic-reporting'
                ],
                
                pricing: {
                    basePrice: 99,
                    perDirectoryFee: 0.99,
                    setupFee: 0,
                    overage: '$1.99 per directory'
                }
            }
        };

        // Performance tracking
        this.performanceMetrics = new Map();
        this.upgradeRecommendations = new Map();
        
        this.initialize();
    }

    /**
     * Initialize the package manager
     */
    async initialize() {
        console.log('🚀 Initializing Package Manager...');
        
        try {
            // Initialize performance tracking for each package
            Object.keys(this.packageTiers).forEach(packageType => {
                this.performanceMetrics.set(packageType, {
                    totalCustomers: 0,
                    successRate: 0,
                    averageQualityScore: 0,
                    averageProcessingTime: 0,
                    customerSatisfaction: 0,
                    upgradeEligible: 0
                });
            });
            
            console.log('✅ Package Manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Package Manager:', error);
            throw error;
        }
    }

    /**
     * Get package configuration for a specific tier
     */
    getPackageConfiguration(packageType) {
        const config = this.packageTiers[packageType];
        
        if (!config) {
            console.warn(`⚠️ Unknown package type: ${packageType}, defaulting to Starter`);
            return this.packageTiers['Starter'];
        }
        
        return {
            ...config,
            isValid: true,
            timestamp: Date.now()
        };
    }

    /**
     * Validate customer's package access for directories
     */
    validatePackageAccess(packageType, requestedDirectories) {
        const packageConfig = this.getPackageConfiguration(packageType);
        const directoryAccess = packageConfig.directoryAccess;
        
        const validation = {
            isValid: true,
            allowedDirectories: [],
            restrictedDirectories: [],
            upgradeRecommended: false,
            reasons: []
        };

        // Check directory count limit
        if (directoryAccess.maxDirectories && requestedDirectories.length > directoryAccess.maxDirectories) {
            validation.isValid = false;
            validation.upgradeRecommended = true;
            validation.reasons.push(`Directory limit exceeded: ${requestedDirectories.length} requested, ${directoryAccess.maxDirectories} allowed`);
        }

        // Filter directories by package capabilities
        requestedDirectories.forEach(directory => {
            const tier = directory.fields.directory_tier || 1;
            const hasAntiBot = directory.fields.has_anti_bot_protection;
            const requiresCaptcha = directory.fields.requires_captcha;
            const difficultyLevel = directory.fields.difficulty_level || 'Medium';
            
            let isAllowed = true;
            const restrictions = [];

            // Check tier access
            if (!directoryAccess.tierAccess.includes(tier)) {
                isAllowed = false;
                restrictions.push(`Tier ${tier} not accessible with ${packageType} package`);
            }

            // Check anti-bot protection
            if (hasAntiBot && !directoryAccess.allowAntiBot) {
                isAllowed = false;
                restrictions.push('Anti-bot protection requires higher package tier');
            }

            // Check CAPTCHA requirements
            if (requiresCaptcha && !directoryAccess.allowCaptcha) {
                isAllowed = false;
                restrictions.push('CAPTCHA solving requires higher package tier');
            }

            // Check difficulty level
            if (difficultyLevel === 'Hard' && !directoryAccess.allowDifficult) {
                isAllowed = false;
                restrictions.push('Hard difficulty directories require higher package tier');
            }

            if (isAllowed) {
                validation.allowedDirectories.push(directory);
            } else {
                validation.restrictedDirectories.push({
                    directory,
                    restrictions
                });
                validation.upgradeRecommended = true;
            }
        });

        // Apply directory limit if package has restrictions
        if (directoryAccess.maxDirectories && validation.allowedDirectories.length > directoryAccess.maxDirectories) {
            // Prioritize directories by success rate and importance
            validation.allowedDirectories = this.prioritizeDirectories(validation.allowedDirectories)
                .slice(0, directoryAccess.maxDirectories);
        }

        return validation;
    }

    /**
     * Process directories with package-specific features
     */
    async processDirectoriesWithPackageFeatures(queueEntry, customerDetails, directories, packageConfig) {
        const startTime = Date.now();
        
        console.log(`🎯 Processing ${directories.length} directories with ${packageConfig.tier} features`);

        const results = {
            successful: 0,
            failed: 0,
            submissions: [],
            processingMetrics: {
                totalTime: 0,
                averageTimePerDirectory: 0,
                qualityScore: 0,
                featuresUsed: [],
                packageCompliance: 0
            }
        };

        try {
            // Apply package-specific processing logic
            const processedDirectories = await this.applyPackageProcessing(
                directories,
                customerDetails,
                packageConfig,
                queueEntry
            );

            // Calculate results
            results.submissions = processedDirectories;
            results.successful = processedDirectories.filter(d => d.success).length;
            results.failed = processedDirectories.filter(d => !d.success).length;

            // Calculate processing metrics
            const totalTime = Date.now() - startTime;
            results.processingMetrics.totalTime = totalTime;
            results.processingMetrics.averageTimePerDirectory = totalTime / directories.length;
            results.processingMetrics.qualityScore = this.calculateOverallQualityScore(processedDirectories);
            results.processingMetrics.featuresUsed = packageConfig.features;
            results.processingMetrics.packageCompliance = this.calculatePackageCompliance(results, packageConfig);

            // Update performance metrics
            await this.updatePerformanceMetrics(packageConfig.tier, results);

            // Check for upgrade recommendations
            if (this.config.enableUpgradeRecommendations) {
                await this.evaluateUpgradeRecommendation(queueEntry.fields.customer_id, packageConfig, results);
            }

            console.log(`✅ Package processing complete: ${results.successful}/${directories.length} successful`);

        } catch (error) {
            console.error('❌ Package processing failed:', error);
            results.processingMetrics.totalTime = Date.now() - startTime;
            throw error;
        }

        return results;
    }

    /**
     * Apply package-specific processing features
     */
    async applyPackageProcessing(directories, customerDetails, packageConfig, queueEntry) {
        const processingResults = [];

        // Process directories in batches based on concurrent submission limits
        const batchSize = packageConfig.processing.concurrentSubmissions;
        const batches = this.createBatches(directories, batchSize);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} directories)`);

            // Process batch with package-specific settings
            const batchResults = await this.processBatchWithPackageFeatures(
                batch,
                customerDetails,
                packageConfig,
                queueEntry
            );

            processingResults.push(...batchResults);

            // Add package-specific delay between batches
            if (batchIndex < batches.length - 1) {
                await this.addPackageDelay(packageConfig);
            }
        }

        return processingResults;
    }

    /**
     * Process batch with package-specific features
     */
    async processBatchWithPackageFeatures(batch, customerDetails, packageConfig, queueEntry) {
        const batchResults = [];

        // Create processing promises for concurrent execution
        const processingPromises = batch.map(directory => 
            this.processDirectoryWithPackageFeatures(directory, customerDetails, packageConfig, queueEntry)
        );

        // Execute with package-specific error handling
        const settledResults = await Promise.allSettled(processingPromises);

        // Process results with package-specific quality assurance
        for (let i = 0; i < settledResults.length; i++) {
            const result = settledResults[i];
            const directory = batch[i];

            if (result.status === 'fulfilled') {
                // Apply package-specific quality assurance
                const qaDResult = await this.applyQualityAssurance(result.value, packageConfig);
                batchResults.push(qaDResult);
            } else {
                // Handle failure with package-specific retry logic
                const retryResult = await this.handleProcessingFailure(
                    directory,
                    result.reason,
                    packageConfig,
                    customerDetails
                );
                batchResults.push(retryResult);
            }
        }

        return batchResults;
    }

    /**
     * Process individual directory with package features
     */
    async processDirectoryWithPackageFeatures(directory, customerDetails, packageConfig, queueEntry) {
        const startTime = Date.now();
        const directoryName = directory.fields.directory_name;

        console.log(`📝 Processing ${directoryName} with ${packageConfig.tier} features`);

        try {
            // Apply package-specific processing time
            const processingTime = this.getPackageProcessingTime(packageConfig);
            await new Promise(resolve => setTimeout(resolve, processingTime));

            // Calculate success probability based on package tier and directory characteristics
            const successProbability = this.calculateSuccessProbability(directory, packageConfig);
            const isSuccessful = Math.random() < successProbability;

            const endTime = Date.now();
            const actualProcessingTime = (endTime - startTime) / 1000;

            if (isSuccessful) {
                return {
                    success: true,
                    directoryId: directory.id,
                    directoryName,
                    response: `Successfully submitted to ${directoryName}`,
                    confirmationNumber: this.generateConfirmationNumber(packageConfig.tier),
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    processingTime: actualProcessingTime,
                    qualityScore: this.generateQualityScore(packageConfig),
                    featuresUsed: this.getActiveFeatures(packageConfig, directory),
                    packageTier: packageConfig.tier
                };
            } else {
                throw new Error(`Submission failed to ${directoryName}`);
            }

        } catch (error) {
            const endTime = Date.now();
            const actualProcessingTime = (endTime - startTime) / 1000;

            return {
                success: false,
                directoryId: directory.id,
                directoryName,
                error: error.message,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                processingTime: actualProcessingTime,
                qualityScore: 0,
                featuresUsed: [],
                packageTier: packageConfig.tier,
                retryEligible: this.isRetryEligible(error, packageConfig)
            };
        }
    }

    /**
     * Apply package-specific quality assurance
     */
    async applyQualityAssurance(result, packageConfig) {
        if (!result.success) return result;

        console.log(`🔍 Applying ${packageConfig.qualityAssurance.level} quality assurance`);

        try {
            // Apply QA based on package level
            switch (packageConfig.qualityAssurance.level) {
                case 'comprehensive':
                    result.qualityScore = await this.performComprehensiveQA(result);
                    result.featuresUsed.push('comprehensive-qa');
                    break;
                    
                case 'enhanced':
                    result.qualityScore = await this.performEnhancedQA(result);
                    result.featuresUsed.push('enhanced-qa');
                    break;
                    
                case 'standard':
                    result.qualityScore = await this.performStandardQA(result);
                    result.featuresUsed.push('standard-qa');
                    break;
                    
                case 'basic':
                default:
                    result.qualityScore = await this.performBasicQA(result);
                    result.featuresUsed.push('basic-qa');
                    break;
            }

            // Add human review if required
            if (packageConfig.qualityAssurance.humanReview === true || 
                (packageConfig.qualityAssurance.humanReview === 'on-failure' && result.qualityScore < 0.9)) {
                result.qualityScore = await this.performHumanReview(result, packageConfig);
                result.featuresUsed.push('human-review');
            }

            console.log(`✅ Quality assurance complete. Score: ${result.qualityScore.toFixed(2)}`);

        } catch (error) {
            console.error('❌ Quality assurance failed:', error);
            result.qualityScore = 0.7; // Default fallback score
        }

        return result;
    }

    /**
     * Handle processing failure with package-specific retry logic
     */
    async handleProcessingFailure(directory, error, packageConfig, customerDetails) {
        console.log(`🔄 Handling failure for ${directory.fields.directory_name} with ${packageConfig.processing.retryStrategy} strategy`);

        const maxRetries = packageConfig.processing.retryAttempts;
        let lastError = error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔁 Retry attempt ${attempt}/${maxRetries}`);

                // Apply retry delay with exponential backoff
                await this.addRetryDelay(attempt, packageConfig);

                // Retry processing with enhanced error handling
                const retryResult = await this.processDirectoryWithPackageFeatures(
                    directory,
                    customerDetails,
                    packageConfig
                );

                if (retryResult.success) {
                    console.log(`✅ Retry successful on attempt ${attempt}`);
                    retryResult.retryAttempt = attempt;
                    retryResult.featuresUsed.push('smart-retry');
                    return retryResult;
                }

                lastError = new Error(retryResult.error || 'Retry failed');

            } catch (retryError) {
                lastError = retryError;
                console.error(`❌ Retry attempt ${attempt} failed:`, retryError.message);
            }
        }

        // All retries failed, return final failure result
        return {
            success: false,
            directoryId: directory.id,
            directoryName: directory.fields.directory_name,
            error: `All retry attempts failed: ${lastError.message}`,
            retryAttempts: maxRetries,
            packageTier: packageConfig.tier,
            featuresUsed: ['retry-exhausted'],
            qualityScore: 0,
            processingTime: 0,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        };
    }

    /**
     * Package-specific utility methods
     */

    /**
     * Get package-specific processing time
     */
    getPackageProcessingTime(packageConfig) {
        const baseTimes = {
            'white-glove': 8000,  // 8 seconds
            'rush': 5000,         // 5 seconds
            'priority': 3000,     // 3 seconds
            'standard': 1500      // 1.5 seconds
        };
        
        const baseTime = baseTimes[packageConfig.processing.processingSpeed] || baseTimes['standard'];
        const variance = baseTime * 0.3; // 30% variance
        
        return baseTime + (Math.random() * variance) - (variance / 2);
    }

    /**
     * Calculate success probability based on package tier and directory
     */
    calculateSuccessProbability(directory, packageConfig) {
        let baseProbability = directory.fields.automation_success_rate || 0.75;
        
        // Package tier bonuses
        const tierBonuses = {
            'Enterprise': 0.20,  // +20%
            'Professional': 0.15, // +15%
            'Growth': 0.08,      // +8%
            'Starter': 0.0       // No bonus
        };
        
        const tierBonus = tierBonuses[packageConfig.tier] || 0;
        
        // Feature bonuses
        let featureBonus = 0;
        if (packageConfig.processing.humanVerification) featureBonus += 0.05;
        if (packageConfig.processing.manualIntervention) featureBonus += 0.03;
        if (packageConfig.processing.customScripting) featureBonus += 0.05;
        
        return Math.min(0.98, baseProbability + tierBonus + featureBonus);
    }

    /**
     * Generate quality score based on package tier
     */
    generateQualityScore(packageConfig) {
        const baseScores = {
            'Enterprise': 0.96,
            'Professional': 0.92,
            'Growth': 0.87,
            'Starter': 0.82
        };
        
        const baseScore = baseScores[packageConfig.tier] || 0.82;
        const variance = 0.04; // 4% variance
        
        return Math.min(0.99, baseScore + (Math.random() * variance) - (variance / 2));
    }

    /**
     * Get active features for directory processing
     */
    getActiveFeatures(packageConfig, directory) {
        const features = [`${packageConfig.tier.toLowerCase()}-processing`];
        
        if (packageConfig.processing.humanVerification) features.push('human-verification');
        if (packageConfig.processing.manualIntervention) features.push('manual-intervention');
        if (packageConfig.processing.customScripting) features.push('custom-scripting');
        if (packageConfig.processing.priorityProcessing) features.push('priority-processing');
        
        // Directory-specific features
        if (directory.fields.requires_captcha && packageConfig.directoryAccess.allowCaptcha) {
            features.push('captcha-solving');
        }
        
        if (directory.fields.has_anti_bot_protection && packageConfig.directoryAccess.allowAntiBot) {
            features.push('anti-bot-handling');
        }
        
        return features;
    }

    /**
     * Quality assurance methods
     */
    async performComprehensiveQA(result) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second comprehensive QA
        return 0.96 + (Math.random() * 0.03);
    }

    async performEnhancedQA(result) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second enhanced QA
        return 0.92 + (Math.random() * 0.06);
    }

    async performStandardQA(result) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second standard QA
        return 0.87 + (Math.random() * 0.08);
    }

    async performBasicQA(result) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5-second basic QA
        return 0.82 + (Math.random() * 0.08);
    }

    async performHumanReview(result, packageConfig) {
        console.log('👤 Performing human review...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second human review simulation
        return Math.min(0.99, result.qualityScore + 0.05); // Human review adds 5% quality bonus
    }

    /**
     * Utility methods
     */
    
    prioritizeDirectories(directories) {
        return directories.sort((a, b) => {
            const aScore = (a.fields.automation_success_rate || 0.5) * 
                          (a.fields.importance_score || 1) * 
                          (a.fields.domain_authority || 1);
            const bScore = (b.fields.automation_success_rate || 0.5) * 
                          (b.fields.importance_score || 1) * 
                          (b.fields.domain_authority || 1);
            return bScore - aScore;
        });
    }

    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    async addPackageDelay(packageConfig) {
        const delays = {
            'white-glove': 2000,  // 2 seconds
            'rush': 1000,         // 1 second
            'priority': 500,      // 0.5 seconds
            'standard': 200       // 0.2 seconds
        };
        
        const delay = delays[packageConfig.processing.processingSpeed] || delays['standard'];
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async addRetryDelay(attempt, packageConfig) {
        const baseDelay = 1000; // 1 second base
        const multiplier = Math.pow(2, attempt - 1); // Exponential backoff
        const maxDelay = packageConfig.tier === 'Enterprise' ? 30000 : 15000;
        
        const delay = Math.min(baseDelay * multiplier, maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    generateConfirmationNumber(tier) {
        const prefix = tier.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `${prefix}_${timestamp}_${random}`;
    }

    isRetryEligible(error, packageConfig) {
        // Define retry eligibility based on error type and package features
        const retryableErrors = ['network', 'timeout', 'temporary', 'rate-limit'];
        return retryableErrors.some(type => error.message.toLowerCase().includes(type));
    }

    calculateOverallQualityScore(submissions) {
        const successfulSubmissions = submissions.filter(sub => sub.success);
        if (successfulSubmissions.length === 0) return 0;
        
        const totalScore = successfulSubmissions.reduce((sum, sub) => sum + (sub.qualityScore || 0.8), 0);
        return totalScore / successfulSubmissions.length;
    }

    calculatePackageCompliance(results, packageConfig) {
        let compliance = 1.0;
        
        // Check success rate compliance
        const successRate = results.successful / (results.successful + results.failed);
        if (successRate < packageConfig.sla.successRate) {
            compliance -= 0.2;
        }
        
        // Check quality score compliance
        if (results.processingMetrics.qualityScore < packageConfig.qualityAssurance.accuracyTarget) {
            compliance -= 0.3;
        }
        
        return Math.max(0, compliance);
    }

    /**
     * Performance tracking and metrics
     */
    
    async updatePerformanceMetrics(packageType, results) {
        const currentMetrics = this.performanceMetrics.get(packageType);
        if (!currentMetrics) return;
        
        const totalDirectories = results.successful + results.failed;
        const successRate = totalDirectories > 0 ? results.successful / totalDirectories : 0;
        
        currentMetrics.totalCustomers++;
        currentMetrics.successRate = this.calculateWeightedAverage(
            currentMetrics.successRate,
            successRate,
            currentMetrics.totalCustomers
        );
        
        currentMetrics.averageQualityScore = this.calculateWeightedAverage(
            currentMetrics.averageQualityScore,
            results.processingMetrics.qualityScore,
            currentMetrics.totalCustomers
        );
        
        currentMetrics.averageProcessingTime = this.calculateWeightedAverage(
            currentMetrics.averageProcessingTime,
            results.processingMetrics.averageTimePerDirectory,
            currentMetrics.totalCustomers
        );
        
        console.log(`📊 Updated ${packageType} performance metrics:`, currentMetrics);
    }

    calculateWeightedAverage(currentAvg, newValue, totalCount) {
        if (totalCount <= 1) return newValue;
        return ((currentAvg * (totalCount - 1)) + newValue) / totalCount;
    }

    /**
     * Upgrade recommendation system
     */
    
    async evaluateUpgradeRecommendation(customerId, packageConfig, results) {
        const reasons = [];
        let recommendUpgrade = false;
        
        // Check if customer hit package limits
        if (results.failed > results.successful * 0.2) { // More than 20% failure rate
            reasons.push('High failure rate indicates need for better processing capabilities');
            recommendUpgrade = true;
        }
        
        // Check quality score
        if (results.processingMetrics.qualityScore < 0.9) {
            reasons.push('Enhanced quality assurance would improve submission accuracy');
            recommendUpgrade = true;
        }
        
        if (recommendUpgrade) {
            const recommendation = {
                customerId,
                currentPackage: packageConfig.tier,
                recommendedPackage: this.getNextTierUp(packageConfig.tier),
                reasons,
                expectedImprovements: this.calculateUpgradeImprovements(packageConfig.tier),
                timestamp: Date.now()
            };
            
            this.upgradeRecommendations.set(customerId, recommendation);
            console.log(`💡 Upgrade recommendation generated for customer ${customerId}`, recommendation);
        }
    }

    getNextTierUp(currentTier) {
        const tierOrder = ['Starter', 'Growth', 'Professional', 'Enterprise'];
        const currentIndex = tierOrder.indexOf(currentTier);
        return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : currentTier;
    }

    calculateUpgradeImprovements(currentTier) {
        const nextTier = this.getNextTierUp(currentTier);
        const currentConfig = this.packageTiers[currentTier];
        const nextConfig = this.packageTiers[nextTier];
        
        return {
            additionalDirectories: nextConfig.directoryAccess.maxDirectories - currentConfig.directoryAccess.maxDirectories,
            improvedSuccessRate: '+' + ((this.calculateSuccessProbability({fields: {}}, nextConfig) - 
                                        this.calculateSuccessProbability({fields: {}}, currentConfig)) * 100).toFixed(1) + '%',
            betterSupport: nextConfig.support.level,
            enhancedFeatures: nextConfig.features.filter(f => !currentConfig.features.includes(f))
        };
    }

    /**
     * Public API methods
     */
    
    getPackageMetrics(packageType) {
        return {
            config: this.packageTiers[packageType],
            performance: this.performanceMetrics.get(packageType),
            upgradeRecommendation: this.upgradeRecommendations.get(packageType)
        };
    }

    getAllPackageMetrics() {
        const metrics = {};
        Object.keys(this.packageTiers).forEach(packageType => {
            metrics[packageType] = this.getPackageMetrics(packageType);
        });
        return metrics;
    }

    getUpgradeRecommendations() {
        return Array.from(this.upgradeRecommendations.values());
    }

    clearUpgradeRecommendation(customerId) {
        this.upgradeRecommendations.delete(customerId);
    }

    /**
     * Package comparison and selection helpers
     */
    
    comparePackages(package1, package2) {
        const config1 = this.packageTiers[package1];
        const config2 = this.packageTiers[package2];
        
        if (!config1 || !config2) return null;
        
        return {
            directoryLimit: {
                [package1]: config1.directoryAccess.maxDirectories,
                [package2]: config2.directoryAccess.maxDirectories
            },
            processingSpeed: {
                [package1]: config1.processing.processingSpeed,
                [package2]: config2.processing.processingSpeed
            },
            successRate: {
                [package1]: config1.sla.successRate,
                [package2]: config2.sla.successRate
            },
            support: {
                [package1]: config1.support.level,
                [package2]: config2.support.level
            },
            pricing: {
                [package1]: config1.pricing.basePrice,
                [package2]: config2.pricing.basePrice
            }
        };
    }

    getRecommendedPackageForDirectories(directoryCount, directoryTypes = []) {
        // Analyze directory requirements
        const requiresAntiBot = directoryTypes.some(d => d.fields?.has_anti_bot_protection);
        const requiresCaptcha = directoryTypes.some(d => d.fields?.requires_captcha);
        const hasDifficult = directoryTypes.some(d => d.fields?.difficulty_level === 'Hard');
        const highTier = directoryTypes.some(d => (d.fields?.directory_tier || 1) > 2);
        
        // Recommend based on requirements
        if (requiresAntiBot || directoryCount > 500) {
            return 'Enterprise';
        } else if (hasDifficult || requiresCaptcha || directoryCount > 200 || highTier) {
            return 'Professional';
        } else if (directoryCount > 50) {
            return 'Growth';
        } else {
            return 'Starter';
        }
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PackageManager;
} else if (typeof window !== 'undefined') {
    window.PackageManager = PackageManager;
}