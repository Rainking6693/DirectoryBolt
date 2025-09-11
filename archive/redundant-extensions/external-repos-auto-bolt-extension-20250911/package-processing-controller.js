/**
 * AutoBolt Package Processing Controller
 * Implements tier-specific processing features, speeds, and resource allocation
 * 
 * This module handles:
 * - Package-based feature access and limitations
 * - Processing speed controls by tier
 * - Resource allocation and concurrent processing limits
 * - Quality assurance and error handling by package level
 * - Performance monitoring and optimization
 */

class PackageProcessingController {
    constructor(queueEngine) {
        this.queueEngine = queueEngine;
        
        // Package tier configurations with detailed feature sets
        this.packageConfigs = {
            'Enterprise': {
                tier: 'Enterprise',
                priority: 1,
                features: {
                    directoryLimit: null, // Unlimited
                    concurrentSubmissions: 5,
                    processingSpeed: 'white-glove',
                    retryAttempts: 5,
                    qualityAssurance: 'comprehensive',
                    errorHandling: 'advanced-escalation',
                    monitoring: 'real-time',
                    reporting: 'detailed-custom',
                    support: 'dedicated-account-manager'
                },
                sla: {
                    responseTime: 0, // Immediate
                    completionTime: 15, // 15 minutes max
                    availability: '24/7',
                    successRate: 0.95 // 95% guarantee
                },
                processing: {
                    humanVerification: true,
                    manualReview: true,
                    customScripting: true,
                    captchaSolving: 'human-assisted',
                    fallbackStrategies: ['manual-intervention', 'custom-solutions']
                },
                costs: {
                    baseProcessingTime: 8000, // 8 seconds per submission
                    qualityCheckTime: 3000,   // 3 seconds additional QA
                    resourceMultiplier: 3.0   // 3x resource allocation
                }
            },
            'Professional': {
                tier: 'Professional',
                priority: 2,
                features: {
                    directoryLimit: 500,
                    concurrentSubmissions: 3,
                    processingSpeed: 'rush',
                    retryAttempts: 3,
                    qualityAssurance: 'enhanced',
                    errorHandling: 'smart-retry',
                    monitoring: 'periodic',
                    reporting: 'detailed-standard',
                    support: 'phone-email'
                },
                sla: {
                    responseTime: 15, // 15 minutes
                    completionTime: 60, // 1 hour max
                    availability: 'business-hours',
                    successRate: 0.90 // 90% guarantee
                },
                processing: {
                    humanVerification: false,
                    manualReview: 'on-failure',
                    customScripting: false,
                    captchaSolving: 'automated-with-fallback',
                    fallbackStrategies: ['smart-retry', 'alternative-approaches']
                },
                costs: {
                    baseProcessingTime: 5000, // 5 seconds per submission
                    qualityCheckTime: 2000,   // 2 seconds QA
                    resourceMultiplier: 2.0   // 2x resource allocation
                }
            },
            'Growth': {
                tier: 'Growth',
                priority: 3,
                features: {
                    directoryLimit: 200,
                    concurrentSubmissions: 2,
                    processingSpeed: 'priority',
                    retryAttempts: 2,
                    qualityAssurance: 'standard',
                    errorHandling: 'basic-retry',
                    monitoring: 'batch-summary',
                    reporting: 'standard',
                    support: 'email'
                },
                sla: {
                    responseTime: 60, // 1 hour
                    completionTime: 240, // 4 hours max
                    availability: 'business-hours',
                    successRate: 0.85 // 85% target
                },
                processing: {
                    humanVerification: false,
                    manualReview: false,
                    customScripting: false,
                    captchaSolving: 'automated-only',
                    fallbackStrategies: ['basic-retry']
                },
                costs: {
                    baseProcessingTime: 3000, // 3 seconds per submission
                    qualityCheckTime: 1000,   // 1 second QA
                    resourceMultiplier: 1.5   // 1.5x resource allocation
                }
            },
            'Starter': {
                tier: 'Starter',
                priority: 4,
                features: {
                    directoryLimit: 50,
                    concurrentSubmissions: 1,
                    processingSpeed: 'standard',
                    retryAttempts: 1,
                    qualityAssurance: 'basic',
                    errorHandling: 'simple-retry',
                    monitoring: 'completion-only',
                    reporting: 'basic',
                    support: 'email-only'
                },
                sla: {
                    responseTime: 240, // 4 hours
                    completionTime: 480, // 8 hours max
                    availability: 'business-hours',
                    successRate: 0.80 // 80% target
                },
                processing: {
                    humanVerification: false,
                    manualReview: false,
                    customScripting: false,
                    captchaSolving: 'skip-on-detection',
                    fallbackStrategies: ['skip-and-continue']
                },
                costs: {
                    baseProcessingTime: 1500, // 1.5 seconds per submission
                    qualityCheckTime: 500,    // 0.5 seconds QA
                    resourceMultiplier: 1.0   // 1x resource allocation
                }
            }
        };

        // Processing state and resource management
        this.processingState = {
            activePackageProcessors: new Map(),
            resourceAllocations: new Map(),
            performanceMetrics: new Map(),
            qualityScores: new Map()
        };

        // Initialize package-specific metrics
        this.initializePackageMetrics();
    }

    /**
     * Initialize package-specific performance metrics
     */
    initializePackageMetrics() {
        Object.keys(this.packageConfigs).forEach(packageType => {
            this.processingState.performanceMetrics.set(packageType, {
                totalProcessed: 0,
                successRate: 0,
                averageProcessingTime: 0,
                qualityScore: 0,
                customerSatisfaction: 0,
                resourceUtilization: 0
            });

            this.processingState.qualityScores.set(packageType, {
                submissionAccuracy: 0,
                completionRate: 0,
                errorRate: 0,
                retryRate: 0
            });
        });
    }

    /**
     * Process customer with package-specific features and speeds
     */
    async processCustomerWithPackageFeatures(queueEntry, customerInfo, directories) {
        const packageType = queueEntry.fields.package_type;
        const packageConfig = this.packageConfigs[packageType];

        if (!packageConfig) {
            throw new Error(`Unknown package type: ${packageType}`);
        }

        console.log(`🎯 Processing ${packageType} customer: ${customerInfo.fields.business_name}`);

        // Allocate package-specific resources
        const processorId = await this.allocateProcessingResources(queueEntry.id, packageConfig);
        
        try {
            // Apply package-specific directory filtering
            const processableDirectories = await this.filterDirectoriesByPackage(
                directories, 
                packageConfig
            );

            // Execute package-specific processing pipeline
            const results = await this.executePackageProcessingPipeline(
                queueEntry,
                customerInfo,
                processableDirectories,
                packageConfig,
                processorId
            );

            // Apply package-specific quality assurance
            const qualityResults = await this.performQualityAssurance(
                results,
                packageConfig,
                processorId
            );

            // Update package-specific metrics
            await this.updatePackageMetrics(packageType, qualityResults);

            return qualityResults;

        } finally {
            // Release allocated resources
            await this.releaseProcessingResources(processorId, packageConfig);
        }
    }

    /**
     * Allocate processing resources based on package tier
     */
    async allocateProcessingResources(queueId, packageConfig) {
        const processorId = `pkg_${packageConfig.tier}_${queueId}_${Date.now()}`;
        
        // Calculate resource allocation
        const resourceAllocation = {
            processorId,
            tier: packageConfig.tier,
            cpuWeight: packageConfig.costs.resourceMultiplier,
            memoryWeight: packageConfig.costs.resourceMultiplier,
            networkWeight: packageConfig.costs.resourceMultiplier,
            concurrentSlots: packageConfig.features.concurrentSubmissions,
            startTime: Date.now()
        };

        this.processingState.resourceAllocations.set(processorId, resourceAllocation);
        
        console.log(`🔧 Allocated ${packageConfig.tier} resources for processor ${processorId}`);
        
        return processorId;
    }

    /**
     * Filter directories based on package capabilities
     */
    async filterDirectoriesByPackage(directories, packageConfig) {
        console.log(`🔍 Filtering ${directories.length} directories for ${packageConfig.tier} package`);
        
        let filteredDirectories = [...directories];

        // Apply directory limit
        if (packageConfig.features.directoryLimit) {
            filteredDirectories = this.prioritizeDirectories(
                filteredDirectories.slice(0, packageConfig.features.directoryLimit)
            );
        }

        // Filter based on package capabilities
        filteredDirectories = filteredDirectories.filter(directory => {
            const hasAntiBot = directory.fields.has_anti_bot_protection;
            const requiresCaptcha = directory.fields.requires_captcha;
            const difficultyLevel = directory.fields.difficulty_level || 'Medium';

            // Enterprise can handle everything
            if (packageConfig.tier === 'Enterprise') {
                return true;
            }

            // Professional can handle most directories
            if (packageConfig.tier === 'Professional') {
                return !hasAntiBot || packageConfig.processing.captchaSolving !== 'skip-on-detection';
            }

            // Growth has moderate restrictions
            if (packageConfig.tier === 'Growth') {
                return !hasAntiBot && !requiresCaptcha && difficultyLevel !== 'Hard';
            }

            // Starter has significant restrictions
            if (packageConfig.tier === 'Starter') {
                return !hasAntiBot && !requiresCaptcha && 
                       ['Easy', 'Medium'].includes(difficultyLevel);
            }

            return true;
        });

        console.log(`✅ Filtered to ${filteredDirectories.length} directories for ${packageConfig.tier}`);
        
        return filteredDirectories;
    }

    /**
     * Prioritize directories based on success rate and importance
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

    /**
     * Execute package-specific processing pipeline
     */
    async executePackageProcessingPipeline(queueEntry, customerInfo, directories, packageConfig, processorId) {
        console.log(`⚡ Executing ${packageConfig.tier} processing pipeline for ${directories.length} directories`);

        const results = {
            successful: 0,
            failed: 0,
            submissions: [],
            processingMetrics: {
                totalTime: 0,
                averageTimePerDirectory: 0,
                resourceUtilization: 0,
                qualityScore: 0
            }
        };

        const startTime = Date.now();

        // Process directories in batches based on concurrent submission limits
        const batchSize = packageConfig.features.concurrentSubmissions;
        const batches = this.createProcessingBatches(directories, batchSize);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} directories)`);

            // Process batch with package-specific settings
            const batchResults = await this.processBatchWithPackageFeatures(
                batch,
                queueEntry,
                customerInfo,
                packageConfig,
                processorId
            );

            // Aggregate results
            results.successful += batchResults.successful;
            results.failed += batchResults.failed;
            results.submissions.push(...batchResults.submissions);

            // Add package-specific delay between batches
            if (batchIndex < batches.length - 1) {
                await this.addPackageSpecificDelay(packageConfig);
            }
        }

        // Calculate processing metrics
        const totalTime = Date.now() - startTime;
        results.processingMetrics.totalTime = totalTime;
        results.processingMetrics.averageTimePerDirectory = totalTime / directories.length;
        results.processingMetrics.resourceUtilization = this.calculateResourceUtilization(processorId);

        console.log(`✅ ${packageConfig.tier} pipeline completed: ${results.successful}/${directories.length} successful`);

        return results;
    }

    /**
     * Process batch with package-specific features
     */
    async processBatchWithPackageFeatures(batch, queueEntry, customerInfo, packageConfig, processorId) {
        const batchResults = {
            successful: 0,
            failed: 0,
            submissions: []
        };

        // Create concurrent processing promises based on package limits
        const processingPromises = batch.map(directory => 
            this.processDirectoryWithPackageFeatures(
                directory,
                queueEntry,
                customerInfo,
                packageConfig,
                processorId
            )
        );

        // Execute with package-specific timeout
        const timeout = this.calculatePackageTimeout(packageConfig, batch.length);
        const settledResults = await this.executeWithTimeout(processingPromises, timeout);

        // Process results
        settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                batchResults.successful++;
                batchResults.submissions.push(result.value);
            } else {
                batchResults.failed++;
                batchResults.submissions.push({
                    directoryId: batch[index].id,
                    directoryName: batch[index].fields.directory_name,
                    success: false,
                    error: result.reason?.message || 'Processing failed',
                    packageTier: packageConfig.tier
                });
            }
        });

        return batchResults;
    }

    /**
     * Process individual directory with package-specific features
     */
    async processDirectoryWithPackageFeatures(directory, queueEntry, customerInfo, packageConfig, processorId) {
        const startTime = Date.now();
        const directoryName = directory.fields.directory_name;

        console.log(`📝 Processing ${directoryName} with ${packageConfig.tier} features`);

        try {
            // Prepare submission data with package-specific formatting
            const submissionData = this.prepareSubmissionData(
                customerInfo,
                directory,
                packageConfig
            );

            // Execute submission with package-specific retry logic
            const submissionResult = await this.executeSubmissionWithRetry(
                directory,
                submissionData,
                packageConfig,
                processorId
            );

            // Apply package-specific verification
            const verificationResult = await this.verifySubmissionQuality(
                submissionResult,
                packageConfig
            );

            const processingTime = Date.now() - startTime;

            return {
                directoryId: directory.id,
                directoryName,
                success: verificationResult.success,
                response: verificationResult.response,
                processingTime,
                qualityScore: verificationResult.qualityScore,
                packageTier: packageConfig.tier,
                features: verificationResult.featuresUsed
            };

        } catch (error) {
            console.error(`❌ Failed to process ${directoryName}:`, error);

            const processingTime = Date.now() - startTime;

            return {
                directoryId: directory.id,
                directoryName,
                success: false,
                error: error.message,
                processingTime,
                qualityScore: 0,
                packageTier: packageConfig.tier
            };
        }
    }

    /**
     * Execute submission with package-specific retry logic
     */
    async executeSubmissionWithRetry(directory, submissionData, packageConfig, processorId) {
        const maxRetries = packageConfig.features.retryAttempts;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${directory.fields.directory_name}`);

                // Simulate processing time based on package tier
                await this.simulateProcessingTime(packageConfig);

                // Execute the actual submission
                const result = await this.executeDirectorySubmission(
                    directory,
                    submissionData,
                    packageConfig
                );

                if (result.success) {
                    console.log(`✅ Successful submission on attempt ${attempt}`);
                    return result;
                }

                lastError = new Error(result.error || 'Submission failed');

                // Apply package-specific retry delay
                if (attempt < maxRetries) {
                    await this.addRetryDelay(packageConfig, attempt);
                }

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);

                // For Enterprise, try alternative approaches
                if (packageConfig.tier === 'Enterprise' && attempt < maxRetries) {
                    await this.tryAlternativeApproach(directory, submissionData, packageConfig);
                }

                if (attempt < maxRetries) {
                    await this.addRetryDelay(packageConfig, attempt);
                }
            }
        }

        throw lastError || new Error('All retry attempts failed');
    }

    /**
     * Execute actual directory submission (placeholder for real implementation)
     */
    async executeDirectorySubmission(directory, submissionData, packageConfig) {
        // This would integrate with the actual Chrome extension submission logic
        
        // Simulate success rate based on package tier and directory difficulty
        const baseSuccessRate = directory.fields.automation_success_rate || 0.75;
        const packageBonus = this.getPackageSuccessBonus(packageConfig.tier);
        const effectiveSuccessRate = Math.min(0.98, baseSuccessRate + packageBonus);

        const isSuccessful = Math.random() < effectiveSuccessRate;

        if (isSuccessful) {
            return {
                success: true,
                response: `Successfully submitted to ${directory.fields.directory_name}`,
                confirmationNumber: `${packageConfig.tier.toUpperCase()}_${Date.now()}`,
                submissionUrl: directory.fields.submission_url
            };
        } else {
            return {
                success: false,
                error: `Submission failed to ${directory.fields.directory_name}`,
                retryable: true
            };
        }
    }

    /**
     * Get success rate bonus based on package tier
     */
    getPackageSuccessBonus(tier) {
        const bonuses = {
            'Enterprise': 0.15,  // +15% success rate
            'Professional': 0.10, // +10% success rate
            'Growth': 0.05,      // +5% success rate
            'Starter': 0.0       // No bonus
        };
        return bonuses[tier] || 0;
    }

    /**
     * Verify submission quality based on package tier
     */
    async verifySubmissionQuality(submissionResult, packageConfig) {
        const qualityCheck = {
            success: submissionResult.success,
            response: submissionResult.response,
            qualityScore: 0,
            featuresUsed: []
        };

        if (!submissionResult.success) {
            return qualityCheck;
        }

        // Apply package-specific quality verification
        switch (packageConfig.features.qualityAssurance) {
            case 'comprehensive':
                qualityCheck.qualityScore = await this.performComprehensiveQualityCheck(submissionResult);
                qualityCheck.featuresUsed.push('comprehensive-qa');
                break;
                
            case 'enhanced':
                qualityCheck.qualityScore = await this.performEnhancedQualityCheck(submissionResult);
                qualityCheck.featuresUsed.push('enhanced-qa');
                break;
                
            case 'standard':
                qualityCheck.qualityScore = await this.performStandardQualityCheck(submissionResult);
                qualityCheck.featuresUsed.push('standard-qa');
                break;
                
            case 'basic':
            default:
                qualityCheck.qualityScore = 0.8; // Basic quality score
                qualityCheck.featuresUsed.push('basic-qa');
                break;
        }

        // Add package-specific feature tracking
        qualityCheck.featuresUsed.push(`${packageConfig.tier.toLowerCase()}-processing`);

        return qualityCheck;
    }

    /**
     * Perform comprehensive quality assurance (Enterprise)
     */
    async performComprehensiveQualityCheck(submissionResult) {
        // Simulate comprehensive QA process
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second QA
        
        // Enterprise gets highest quality scores
        return 0.95 + (Math.random() * 0.05);
    }

    /**
     * Perform enhanced quality assurance (Professional)
     */
    async performEnhancedQualityCheck(submissionResult) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second QA
        return 0.90 + (Math.random() * 0.08);
    }

    /**
     * Perform standard quality assurance (Growth)
     */
    async performStandardQualityCheck(submissionResult) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second QA
        return 0.85 + (Math.random() * 0.10);
    }

    /**
     * Perform overall quality assurance for processing results
     */
    async performQualityAssurance(results, packageConfig, processorId) {
        console.log(`🔍 Performing ${packageConfig.features.qualityAssurance} quality assurance`);

        const qualityResults = {
            ...results,
            qualityMetrics: {
                overallQualityScore: 0,
                submissionAccuracy: 0,
                completionRate: 0,
                packageCompliance: 0
            }
        };

        // Calculate quality metrics
        const totalSubmissions = results.successful + results.failed;
        qualityResults.qualityMetrics.completionRate = totalSubmissions > 0 ? 
            results.successful / totalSubmissions : 0;

        // Calculate weighted quality score from individual submissions
        const qualityScores = results.submissions
            .filter(sub => sub.success)
            .map(sub => sub.qualityScore || 0.8);
        
        qualityResults.qualityMetrics.overallQualityScore = qualityScores.length > 0 ?
            qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;

        // Verify package compliance
        qualityResults.qualityMetrics.packageCompliance = 
            await this.verifyPackageCompliance(results, packageConfig);

        console.log(`✅ Quality assurance complete. Score: ${qualityResults.qualityMetrics.overallQualityScore.toFixed(2)}`);

        return qualityResults;
    }

    /**
     * Verify package compliance and feature usage
     */
    async verifyPackageCompliance(results, packageConfig) {
        let complianceScore = 1.0;

        // Check directory limits
        const totalDirectories = results.successful + results.failed;
        if (packageConfig.features.directoryLimit && 
            totalDirectories > packageConfig.features.directoryLimit) {
            complianceScore -= 0.2;
        }

        // Check processing time compliance
        const avgProcessingTime = results.processingMetrics.averageTimePerDirectory;
        const expectedTime = packageConfig.costs.baseProcessingTime + 
                           packageConfig.costs.qualityCheckTime;
        
        if (avgProcessingTime > expectedTime * 1.5) {
            complianceScore -= 0.1;
        }

        // Check success rate compliance
        const successRate = totalDirectories > 0 ? results.successful / totalDirectories : 0;
        if (successRate < packageConfig.sla.successRate) {
            complianceScore -= 0.3;
        }

        return Math.max(0, complianceScore);
    }

    /**
     * Update package-specific performance metrics
     */
    async updatePackageMetrics(packageType, results) {
        const currentMetrics = this.processingState.performanceMetrics.get(packageType);
        
        if (!currentMetrics) return;

        const totalDirectories = results.successful + results.failed;
        const successRate = totalDirectories > 0 ? results.successful / totalDirectories : 0;

        // Update metrics with weighted averages
        currentMetrics.totalProcessed += totalDirectories;
        currentMetrics.successRate = this.calculateWeightedAverage(
            currentMetrics.successRate,
            successRate,
            currentMetrics.totalProcessed
        );
        
        currentMetrics.averageProcessingTime = this.calculateWeightedAverage(
            currentMetrics.averageProcessingTime,
            results.processingMetrics.averageTimePerDirectory,
            currentMetrics.totalProcessed
        );

        currentMetrics.qualityScore = this.calculateWeightedAverage(
            currentMetrics.qualityScore,
            results.qualityMetrics.overallQualityScore,
            currentMetrics.totalProcessed
        );

        // Emit metrics update event
        this.queueEngine.emit('package:metrics-updated', {
            packageType,
            metrics: currentMetrics,
            timestamp: Date.now()
        });

        console.log(`📊 Updated ${packageType} metrics:`, currentMetrics);
    }

    /**
     * Calculate weighted average for metrics
     */
    calculateWeightedAverage(currentAvg, newValue, totalCount) {
        if (totalCount <= 1) return newValue;
        return ((currentAvg * (totalCount - 1)) + newValue) / totalCount;
    }

    /**
     * Simulate processing time based on package tier
     */
    async simulateProcessingTime(packageConfig) {
        const baseTime = packageConfig.costs.baseProcessingTime;
        const variance = baseTime * 0.2; // 20% variance
        const actualTime = baseTime + (Math.random() * variance) - (variance / 2);
        
        await new Promise(resolve => setTimeout(resolve, actualTime));
    }

    /**
     * Add package-specific delay between batches
     */
    async addPackageSpecificDelay(packageConfig) {
        const delays = {
            'white-glove': 2000,  // 2 seconds for Enterprise
            'rush': 1000,         // 1 second for Professional
            'priority': 500,      // 0.5 seconds for Growth
            'standard': 200       // 0.2 seconds for Starter
        };

        const delay = delays[packageConfig.features.processingSpeed] || 200;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Add retry delay with exponential backoff
     */
    async addRetryDelay(packageConfig, attempt) {
        const baseDelay = 1000; // 1 second base delay
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const maxDelay = packageConfig.tier === 'Enterprise' ? 10000 : 5000;
        
        const delay = Math.min(exponentialDelay, maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Try alternative processing approach (Enterprise only)
     */
    async tryAlternativeApproach(directory, submissionData, packageConfig) {
        if (packageConfig.tier !== 'Enterprise') return;

        console.log(`🔄 Trying alternative approach for ${directory.fields.directory_name}`);
        
        // Enterprise customers get custom solutions and manual intervention
        // This would trigger specialized processing logic
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate alternative processing
    }

    /**
     * Prepare submission data with package-specific formatting
     */
    prepareSubmissionData(customerInfo, directory, packageConfig) {
        const baseData = {
            businessName: customerInfo.fields.business_name,
            contactPerson: customerInfo.fields.contact_person,
            email: customerInfo.fields.email,
            phone: customerInfo.fields.phone,
            address: customerInfo.fields.address,
            city: customerInfo.fields.city,
            state: customerInfo.fields.state,
            zipCode: customerInfo.fields.zip_code,
            website: customerInfo.fields.website,
            description: customerInfo.fields.business_description
        };

        // Add package-specific enhancements
        switch (packageConfig.tier) {
            case 'Enterprise':
                return {
                    ...baseData,
                    customFields: customerInfo.fields.custom_fields || {},
                    specialInstructions: customerInfo.fields.special_instructions,
                    brandingGuidelines: customerInfo.fields.branding_guidelines,
                    qualityRequirements: 'maximum'
                };

            case 'Professional':
                return {
                    ...baseData,
                    enhancedDescription: this.enhanceBusinessDescription(baseData.description),
                    categoryOptimization: true,
                    qualityRequirements: 'high'
                };

            case 'Growth':
                return {
                    ...baseData,
                    categoryOptimization: false,
                    qualityRequirements: 'standard'
                };

            case 'Starter':
            default:
                return {
                    ...baseData,
                    qualityRequirements: 'basic'
                };
        }
    }

    /**
     * Enhance business description for higher-tier packages
     */
    enhanceBusinessDescription(description) {
        if (!description) return description;
        
        // Simple enhancement logic - in real implementation this would be more sophisticated
        return description + ' Professional service with proven track record of excellence.';
    }

    /**
     * Calculate resource utilization for a processor
     */
    calculateResourceUtilization(processorId) {
        const allocation = this.processingState.resourceAllocations.get(processorId);
        if (!allocation) return 0;

        const runtime = Date.now() - allocation.startTime;
        const expectedRuntime = allocation.concurrentSlots * 5000; // 5 seconds per slot

        return Math.min(1.0, runtime / expectedRuntime);
    }

    /**
     * Release processing resources
     */
    async releaseProcessingResources(processorId, packageConfig) {
        const allocation = this.processingState.resourceAllocations.get(processorId);
        
        if (allocation) {
            const totalTime = Date.now() - allocation.startTime;
            console.log(`🔧 Released ${packageConfig.tier} resources for processor ${processorId} (${totalTime}ms)`);
            
            this.processingState.resourceAllocations.delete(processorId);
        }
    }

    /**
     * Create processing batches based on concurrency limits
     */
    createProcessingBatches(directories, batchSize) {
        const batches = [];
        for (let i = 0; i < directories.length; i += batchSize) {
            batches.push(directories.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Calculate package-specific timeout
     */
    calculatePackageTimeout(packageConfig, directoryCount) {
        const baseTime = packageConfig.costs.baseProcessingTime;
        const qaTime = packageConfig.costs.qualityCheckTime;
        const retryTime = baseTime * packageConfig.features.retryAttempts;
        
        return (baseTime + qaTime + retryTime) * directoryCount * 1.5; // 50% buffer
    }

    /**
     * Execute promises with timeout
     */
    async executeWithTimeout(promises, timeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing timeout')), timeout);
        });

        return await Promise.allSettled([
            Promise.allSettled(promises),
            timeoutPromise
        ]).then(results => {
            if (results[1].status === 'rejected') {
                throw results[1].reason;
            }
            return results[0].value;
        });
    }

    /**
     * Get package configuration
     */
    getPackageConfig(packageType) {
        return this.packageConfigs[packageType] || null;
    }

    /**
     * Get package performance metrics
     */
    getPackageMetrics(packageType) {
        return {
            performance: this.processingState.performanceMetrics.get(packageType),
            quality: this.processingState.qualityScores.get(packageType),
            resourceAllocations: Array.from(this.processingState.resourceAllocations.values())
                .filter(alloc => alloc.tier === packageType)
        };
    }

    /**
     * Get all package metrics
     */
    getAllPackageMetrics() {
        const metrics = {};
        
        Object.keys(this.packageConfigs).forEach(packageType => {
            metrics[packageType] = this.getPackageMetrics(packageType);
        });

        return metrics;
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PackageProcessingController;
} else if (typeof window !== 'undefined') {
    window.PackageProcessingController = PackageProcessingController;
}