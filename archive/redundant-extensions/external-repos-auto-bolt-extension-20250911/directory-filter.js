/**
 * AutoBolt Directory Filter
 * Package-based access restrictions and intelligent directory filtering
 * 
 * This module handles:
 * - Package tier-based directory access control
 * - Directory difficulty and capability filtering
 * - Intelligent directory prioritization and selection
 * - Directory pool management by tiers
 * - Performance-based directory recommendations
 */

class DirectoryFilter {
    constructor(config = {}) {
        this.config = {
            enableIntelligentFiltering: config.enableIntelligentFiltering !== false,
            enablePerformanceTracking: config.enablePerformanceTracking !== false,
            enableDirectoryRanking: config.enableDirectoryRanking !== false,
            enableAdaptiveFiltering: config.enableAdaptiveFiltering !== false,
            maxDirectoriesPerRequest: config.maxDirectoriesPerRequest || 1000,
            ...config
        };

        // Package tier access matrix
        this.packageAccess = {
            'Enterprise': {
                tierAccess: [1, 2, 3, 4, 5], // All tiers
                maxDirectories: null, // Unlimited
                allowDifficultDirectories: true,
                allowAntiBot: true,
                allowCaptcha: true,
                allowManualReview: true,
                allowPremiumDirectories: true,
                allowHighVolumeDirectories: true,
                minSuccessRate: 0.0, // No minimum
                priorityWeight: 1.0
            },
            'Professional': {
                tierAccess: [1, 2, 3],
                maxDirectories: 500,
                allowDifficultDirectories: true,
                allowAntiBot: false,
                allowCaptcha: true,
                allowManualReview: false,
                allowPremiumDirectories: true,
                allowHighVolumeDirectories: true,
                minSuccessRate: 0.70,
                priorityWeight: 0.8
            },
            'Growth': {
                tierAccess: [1, 2],
                maxDirectories: 200,
                allowDifficultDirectories: false,
                allowAntiBot: false,
                allowCaptcha: false,
                allowManualReview: false,
                allowPremiumDirectories: false,
                allowHighVolumeDirectories: false,
                minSuccessRate: 0.75,
                priorityWeight: 0.6
            },
            'Starter': {
                tierAccess: [1],
                maxDirectories: 50,
                allowDifficultDirectories: false,
                allowAntiBot: false,
                allowCaptcha: false,
                allowManualReview: false,
                allowPremiumDirectories: false,
                allowHighVolumeDirectories: false,
                minSuccessRate: 0.80,
                priorityWeight: 0.4
            }
        };

        // Directory difficulty classification
        this.difficultyLevels = {
            'Easy': {
                score: 1,
                characteristics: ['simple_form', 'no_verification', 'auto_approval'],
                successRate: 0.95,
                processingTime: 'fast'
            },
            'Medium': {
                score: 2,
                characteristics: ['standard_form', 'email_verification', 'manual_review'],
                successRate: 0.85,
                processingTime: 'medium'
            },
            'Hard': {
                score: 3,
                characteristics: ['complex_form', 'phone_verification', 'document_upload', 'manual_approval'],
                successRate: 0.70,
                processingTime: 'slow'
            },
            'Expert': {
                score: 4,
                characteristics: ['multi_step_form', 'captcha', 'human_verification', 'premium_listing'],
                successRate: 0.60,
                processingTime: 'very_slow'
            },
            'Enterprise': {
                score: 5,
                characteristics: ['custom_form', 'anti_bot_protection', 'advanced_verification', 'high_value_listing'],
                successRate: 0.50,
                processingTime: 'custom'
            }
        };

        // Directory performance tracking
        this.performanceData = new Map();
        this.directoryMetrics = new Map();
        
        // Filtering rules and patterns
        this.filteringRules = new Map();
        this.adaptiveRules = new Map();
        
        // Directory pools by tier
        this.directoryPools = {
            tier1: new Set(),
            tier2: new Set(),
            tier3: new Set(),
            tier4: new Set(),
            tier5: new Set()
        };

        // Cached directory data
        this.directoryCache = new Map();
        this.lastCacheUpdate = 0;
        this.cacheValidityPeriod = 3600000; // 1 hour
    }

    /**
     * Initialize the directory filter
     */
    async initialize() {
        console.log('🚀 Initializing Directory Filter...');

        try {
            // Load directory data and build pools
            await this.loadDirectoryData();

            // Initialize performance tracking
            if (this.config.enablePerformanceTracking) {
                await this.initializePerformanceTracking();
            }

            // Setup filtering rules
            this.setupFilteringRules();

            // Load adaptive filtering data
            if (this.config.enableAdaptiveFiltering) {
                await this.loadAdaptiveFilteringData();
            }

            console.log('✅ Directory Filter initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Directory Filter:', error);
            throw error;
        }
    }

    /**
     * Filter directories for a specific package tier
     */
    async filterForPackage(directories, packageConfig) {
        console.log(`🔍 Filtering ${directories.length} directories for ${packageConfig.type} package`);

        try {
            const packageAccess = this.packageAccess[packageConfig.type];
            if (!packageAccess) {
                throw new Error(`Unknown package type: ${packageConfig.type}`);
            }

            let filteredDirectories = [...directories];

            // Apply tier-based filtering
            filteredDirectories = this.filterByTierAccess(filteredDirectories, packageAccess);

            // Apply capability-based filtering
            filteredDirectories = this.filterByCapabilities(filteredDirectories, packageAccess);

            // Apply difficulty-based filtering
            filteredDirectories = this.filterByDifficulty(filteredDirectories, packageAccess);

            // Apply performance-based filtering
            if (this.config.enablePerformanceTracking) {
                filteredDirectories = this.filterByPerformance(filteredDirectories, packageAccess);
            }

            // Apply intelligent prioritization
            if (this.config.enableIntelligentFiltering) {
                filteredDirectories = await this.intelligentPrioritization(filteredDirectories, packageConfig);
            }

            // Apply directory limit
            if (packageAccess.maxDirectories && filteredDirectories.length > packageAccess.maxDirectories) {
                filteredDirectories = this.applyDirectoryLimit(filteredDirectories, packageAccess.maxDirectories);
            }

            console.log(`✅ Filtered to ${filteredDirectories.length} directories for ${packageConfig.type} package`);

            // Update filtering statistics
            this.updateFilteringStats(packageConfig.type, directories.length, filteredDirectories.length);

            return filteredDirectories;

        } catch (error) {
            console.error('❌ Directory filtering failed:', error);
            throw error;
        }
    }

    /**
     * Filter directories by tier access
     */
    filterByTierAccess(directories, packageAccess) {
        return directories.filter(directory => {
            const tier = directory.fields.directory_tier || 1;
            return packageAccess.tierAccess.includes(tier);
        });
    }

    /**
     * Filter directories by package capabilities
     */
    filterByCapabilities(directories, packageAccess) {
        return directories.filter(directory => {
            const fields = directory.fields;

            // Check anti-bot protection
            if (fields.has_anti_bot_protection && !packageAccess.allowAntiBot) {
                return false;
            }

            // Check CAPTCHA requirements
            if (fields.requires_captcha && !packageAccess.allowCaptcha) {
                return false;
            }

            // Check manual review requirements
            if (fields.requires_manual_review && !packageAccess.allowManualReview) {
                return false;
            }

            // Check premium directory status
            if (fields.is_premium_directory && !packageAccess.allowPremiumDirectories) {
                return false;
            }

            // Check high volume directory status
            if (fields.is_high_volume && !packageAccess.allowHighVolumeDirectories) {
                return false;
            }

            return true;
        });
    }

    /**
     * Filter directories by difficulty level
     */
    filterByDifficulty(directories, packageAccess) {
        return directories.filter(directory => {
            const difficultyLevel = directory.fields.difficulty_level || 'Medium';
            
            // Enterprise can handle everything
            if (!packageAccess.allowDifficultDirectories && 
                ['Hard', 'Expert', 'Enterprise'].includes(difficultyLevel)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Filter directories by performance metrics
     */
    filterByPerformance(directories, packageAccess) {
        if (!packageAccess.minSuccessRate) {
            return directories;
        }

        return directories.filter(directory => {
            const successRate = directory.fields.automation_success_rate;
            
            if (successRate === undefined || successRate === null) {
                // If no success rate data, use default based on difficulty
                const difficulty = directory.fields.difficulty_level || 'Medium';
                const defaultRate = this.difficultyLevels[difficulty]?.successRate || 0.85;
                return defaultRate >= packageAccess.minSuccessRate;
            }

            return successRate >= packageAccess.minSuccessRate;
        });
    }

    /**
     * Apply intelligent prioritization based on multiple factors
     */
    async intelligentPrioritization(directories, packageConfig) {
        console.log(`🧠 Applying intelligent prioritization for ${packageConfig.type}`);

        const packageAccess = this.packageAccess[packageConfig.type];
        const prioritizedDirectories = directories.map(directory => {
            const score = this.calculateDirectoryScore(directory, packageAccess, packageConfig);
            return {
                ...directory,
                priorityScore: score,
                reasoning: this.getScoreReasoning(directory, score)
            };
        });

        // Sort by priority score (higher is better)
        prioritizedDirectories.sort((a, b) => b.priorityScore - a.priorityScore);

        // Apply adaptive filtering if enabled
        if (this.config.enableAdaptiveFiltering) {
            return this.applyAdaptiveFiltering(prioritizedDirectories, packageConfig);
        }

        return prioritizedDirectories;
    }

    /**
     * Calculate priority score for a directory
     */
    calculateDirectoryScore(directory, packageAccess, packageConfig) {
        const fields = directory.fields;
        let score = 0;
        const weights = {
            successRate: 0.30,
            domainAuthority: 0.25,
            importance: 0.20,
            processingSpeed: 0.15,
            cost: 0.10
        };

        // Success rate score
        const successRate = fields.automation_success_rate || this.estimateSuccessRate(directory);
        score += (successRate * 100) * weights.successRate;

        // Domain authority score
        const domainAuthority = fields.domain_authority || fields.directory_authority || 50;
        score += domainAuthority * weights.domainAuthority;

        // Importance score
        const importance = fields.importance_score || this.calculateImportanceScore(directory);
        score += importance * weights.importance;

        // Processing speed score (faster is better for higher tiers)
        const speedScore = this.calculateSpeedScore(directory, packageConfig.type);
        score += speedScore * weights.processingSpeed;

        // Cost-effectiveness score
        const costScore = this.calculateCostScore(directory, packageConfig.type);
        score += costScore * weights.cost;

        // Apply package-specific weight multiplier
        score *= packageAccess.priorityWeight;

        // Add bonus for directories that align with package capabilities
        score += this.getCapabilityBonus(directory, packageAccess);

        return Math.round(score * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Estimate success rate based on directory characteristics
     */
    estimateSuccessRate(directory) {
        const fields = directory.fields;
        let baseRate = 0.85; // Default success rate

        // Adjust based on difficulty
        const difficulty = fields.difficulty_level || 'Medium';
        const difficultyConfig = this.difficultyLevels[difficulty];
        if (difficultyConfig) {
            baseRate = difficultyConfig.successRate;
        }

        // Adjust based on special requirements
        if (fields.has_anti_bot_protection) baseRate -= 0.20;
        if (fields.requires_captcha) baseRate -= 0.15;
        if (fields.requires_manual_review) baseRate -= 0.10;
        if (fields.requires_phone_verification) baseRate -= 0.05;

        // Adjust based on form complexity
        const formComplexity = fields.form_complexity || 'medium';
        switch (formComplexity) {
            case 'simple':
                baseRate += 0.05;
                break;
            case 'complex':
                baseRate -= 0.10;
                break;
            case 'very_complex':
                baseRate -= 0.20;
                break;
        }

        return Math.max(0.1, Math.min(0.99, baseRate));
    }

    /**
     * Calculate importance score based on directory characteristics
     */
    calculateImportanceScore(directory) {
        const fields = directory.fields;
        let importance = fields.importance_score || 50; // Base importance

        // Boost for high-value directories
        if (fields.is_premium_directory) importance += 20;
        if (fields.is_high_traffic) importance += 15;
        if (fields.is_industry_leader) importance += 10;
        if (fields.has_high_domain_authority) importance += 10;

        // Consider business category relevance
        if (fields.business_categories && Array.isArray(fields.business_categories)) {
            if (fields.business_categories.length > 5) {
                importance += 5; // Broader reach
            }
        }

        return Math.min(100, importance);
    }

    /**
     * Calculate speed score based on processing characteristics
     */
    calculateSpeedScore(directory, packageType) {
        const fields = directory.fields;
        let speedScore = 50; // Base speed score

        // Processing time factors
        const estimatedTime = fields.estimated_processing_time || 'medium';
        switch (estimatedTime) {
            case 'fast':
                speedScore = 90;
                break;
            case 'medium':
                speedScore = 60;
                break;
            case 'slow':
                speedScore = 30;
                break;
            case 'very_slow':
                speedScore = 10;
                break;
        }

        // Adjust based on automation requirements
        if (fields.requires_manual_steps) speedScore -= 20;
        if (fields.auto_approval) speedScore += 20;
        if (fields.instant_listing) speedScore += 30;

        // Package-specific speed preferences
        const packageSpeedPreference = {
            'Enterprise': 0.5, // Enterprise less concerned with speed, more with quality
            'Professional': 0.7,
            'Growth': 0.8,
            'Starter': 0.9 // Starter more concerned with speed
        };

        const preference = packageSpeedPreference[packageType] || 0.7;
        speedScore *= preference;

        return Math.max(0, Math.min(100, speedScore));
    }

    /**
     * Calculate cost-effectiveness score
     */
    calculateCostScore(directory, packageType) {
        const fields = directory.fields;
        let costScore = 70; // Base cost score

        // Consider listing fees
        if (fields.has_listing_fee) {
            costScore -= 30;
        } else {
            costScore += 10; // Bonus for free listings
        }

        // Consider subscription requirements
        if (fields.requires_subscription) {
            costScore -= 20;
        }

        // Consider setup complexity (time = money)
        if (fields.complex_setup) {
            costScore -= 15;
        }

        // Package-specific cost considerations
        const packageCostSensitivity = {
            'Enterprise': 0.3, // Less cost-sensitive
            'Professional': 0.5,
            'Growth': 0.7,
            'Starter': 1.0 // Most cost-sensitive
        };

        const sensitivity = packageCostSensitivity[packageType] || 0.7;
        costScore *= sensitivity;

        return Math.max(0, Math.min(100, costScore));
    }

    /**
     * Get capability-based bonus score
     */
    getCapabilityBonus(directory, packageAccess) {
        const fields = directory.fields;
        let bonus = 0;

        // Bonus for directories that match package capabilities
        if (fields.has_anti_bot_protection && packageAccess.allowAntiBot) {
            bonus += 10; // Enterprise can handle these challenging directories
        }

        if (fields.requires_captcha && packageAccess.allowCaptcha) {
            bonus += 5;
        }

        if (fields.is_premium_directory && packageAccess.allowPremiumDirectories) {
            bonus += 15;
        }

        if (fields.is_high_volume && packageAccess.allowHighVolumeDirectories) {
            bonus += 10;
        }

        return bonus;
    }

    /**
     * Get reasoning for directory score
     */
    getScoreReasoning(directory, score) {
        const factors = [];
        const fields = directory.fields;

        if (fields.automation_success_rate > 0.9) {
            factors.push('high-success-rate');
        }

        if (fields.domain_authority > 70) {
            factors.push('high-domain-authority');
        }

        if (fields.is_premium_directory) {
            factors.push('premium-directory');
        }

        if (fields.difficulty_level === 'Easy') {
            factors.push('easy-processing');
        }

        if (fields.auto_approval) {
            factors.push('auto-approval');
        }

        return factors;
    }

    /**
     * Apply adaptive filtering based on historical performance
     */
    applyAdaptiveFiltering(directories, packageConfig) {
        console.log('🔄 Applying adaptive filtering based on historical data');

        // Get adaptive rules for this package type
        const adaptiveRules = this.adaptiveRules.get(packageConfig.type) || [];

        let filteredDirectories = [...directories];

        // Apply each adaptive rule
        for (const rule of adaptiveRules) {
            filteredDirectories = this.applyAdaptiveRule(filteredDirectories, rule);
        }

        return filteredDirectories;
    }

    /**
     * Apply a specific adaptive rule
     */
    applyAdaptiveRule(directories, rule) {
        switch (rule.type) {
            case 'performance_threshold':
                return directories.filter(dir => {
                    const performance = this.getDirectoryPerformance(dir.id);
                    return !performance || performance.successRate >= rule.threshold;
                });

            case 'blacklist':
                return directories.filter(dir => !rule.directoryIds.includes(dir.id));

            case 'whitelist':
                return directories.filter(dir => rule.directoryIds.includes(dir.id));

            case 'category_boost':
                return directories.map(dir => {
                    if (rule.categories.includes(dir.fields.primary_category)) {
                        dir.priorityScore = (dir.priorityScore || 0) + rule.boost;
                    }
                    return dir;
                });

            default:
                return directories;
        }
    }

    /**
     * Apply directory limit with intelligent selection
     */
    applyDirectoryLimit(directories, maxDirectories) {
        if (directories.length <= maxDirectories) {
            return directories;
        }

        console.log(`📊 Applying directory limit: selecting ${maxDirectories} from ${directories.length} directories`);

        // Use top directories by priority score
        return directories
            .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
            .slice(0, maxDirectories);
    }

    /**
     * Get recommended directories for a package type
     */
    async getRecommendedDirectories(packageType, businessCategory, count = 10) {
        console.log(`💡 Getting ${count} recommended directories for ${packageType} package`);

        try {
            const packageAccess = this.packageAccess[packageType];
            if (!packageAccess) {
                throw new Error(`Unknown package type: ${packageType}`);
            }

            // Get all available directories
            const allDirectories = await this.getAllDirectories();

            // Filter for package
            let recommendedDirectories = await this.filterForPackage(allDirectories, { type: packageType });

            // Apply category-specific filtering if provided
            if (businessCategory) {
                recommendedDirectories = this.filterByCategory(recommendedDirectories, businessCategory);
            }

            // Get top recommendations
            const topRecommendations = recommendedDirectories
                .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
                .slice(0, count);

            // Add recommendation reasons
            return topRecommendations.map(directory => ({
                ...directory,
                recommendationReasons: this.getRecommendationReasons(directory, packageType, businessCategory)
            }));

        } catch (error) {
            console.error('❌ Failed to get recommended directories:', error);
            throw error;
        }
    }

    /**
     * Filter directories by business category
     */
    filterByCategory(directories, businessCategory) {
        return directories.filter(directory => {
            const categories = directory.fields.supported_categories || 
                            directory.fields.business_categories || [];
            
            if (!Array.isArray(categories)) {
                return true; // Include if category info not available
            }

            return categories.includes(businessCategory) || 
                   categories.includes('All Categories') ||
                   categories.includes('General');
        });
    }

    /**
     * Get recommendation reasons for a directory
     */
    getRecommendationReasons(directory, packageType, businessCategory) {
        const reasons = [];
        const fields = directory.fields;

        // Success rate reasons
        if (fields.automation_success_rate > 0.9) {
            reasons.push('High success rate (90%+)');
        }

        // Domain authority reasons
        if (fields.domain_authority > 70) {
            reasons.push('High domain authority');
        }

        // Speed reasons
        if (fields.auto_approval) {
            reasons.push('Instant approval');
        }

        // Category match
        if (businessCategory && fields.supported_categories?.includes(businessCategory)) {
            reasons.push(`Excellent match for ${businessCategory}`);
        }

        // Package-specific reasons
        if (packageType === 'Enterprise' && fields.is_premium_directory) {
            reasons.push('Premium directory suitable for Enterprise');
        }

        if (packageType === 'Starter' && fields.difficulty_level === 'Easy') {
            reasons.push('Easy setup, perfect for Starter package');
        }

        return reasons.length > 0 ? reasons : ['Good overall match for your package'];
    }

    /**
     * Performance tracking and analytics
     */
    async updateDirectoryPerformance(directoryId, submissionResult) {
        if (!this.config.enablePerformanceTracking) return;

        let performance = this.performanceData.get(directoryId);
        
        if (!performance) {
            performance = {
                directoryId,
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                successRate: 0,
                averageProcessingTime: 0,
                lastUpdated: Date.now(),
                recentResults: []
            };
        }

        // Update attempt counts
        performance.totalAttempts++;
        if (submissionResult.success) {
            performance.successfulAttempts++;
        } else {
            performance.failedAttempts++;
        }

        // Update success rate
        performance.successRate = performance.successfulAttempts / performance.totalAttempts;

        // Update processing time
        if (submissionResult.processingTime) {
            const currentAvg = performance.averageProcessingTime;
            const totalAttempts = performance.totalAttempts;
            
            performance.averageProcessingTime = 
                ((currentAvg * (totalAttempts - 1)) + submissionResult.processingTime) / totalAttempts;
        }

        // Track recent results (last 10)
        performance.recentResults.push({
            success: submissionResult.success,
            processingTime: submissionResult.processingTime,
            timestamp: Date.now(),
            error: submissionResult.error
        });

        if (performance.recentResults.length > 10) {
            performance.recentResults.shift();
        }

        performance.lastUpdated = Date.now();
        this.performanceData.set(directoryId, performance);

        // Update adaptive rules if needed
        await this.updateAdaptiveRules(directoryId, performance);
    }

    /**
     * Get directory performance data
     */
    getDirectoryPerformance(directoryId) {
        return this.performanceData.get(directoryId) || null;
    }

    /**
     * Update adaptive filtering rules based on performance
     */
    async updateAdaptiveRules(directoryId, performance) {
        // Create performance threshold rules
        if (performance.totalAttempts >= 10) {
            // If success rate is consistently low, add to blacklist for lower tiers
            if (performance.successRate < 0.5) {
                this.addAdaptiveRule('Starter', {
                    type: 'blacklist',
                    directoryIds: [directoryId],
                    reason: 'Low success rate',
                    createdAt: Date.now()
                });

                this.addAdaptiveRule('Growth', {
                    type: 'performance_threshold',
                    threshold: 0.6,
                    directoryIds: [directoryId],
                    reason: 'Performance monitoring',
                    createdAt: Date.now()
                });
            }

            // If success rate is high, boost for all packages
            if (performance.successRate > 0.95) {
                ['Starter', 'Growth', 'Professional', 'Enterprise'].forEach(packageType => {
                    this.addAdaptiveRule(packageType, {
                        type: 'whitelist',
                        directoryIds: [directoryId],
                        reason: 'High success rate',
                        createdAt: Date.now()
                    });
                });
            }
        }
    }

    /**
     * Add an adaptive rule for a package type
     */
    addAdaptiveRule(packageType, rule) {
        if (!this.adaptiveRules.has(packageType)) {
            this.adaptiveRules.set(packageType, []);
        }

        const rules = this.adaptiveRules.get(packageType);
        
        // Avoid duplicate rules
        const existingRule = rules.find(r => 
            r.type === rule.type && 
            JSON.stringify(r.directoryIds) === JSON.stringify(rule.directoryIds)
        );

        if (!existingRule) {
            rules.push(rule);
            console.log(`📝 Added adaptive rule for ${packageType}:`, rule.type);
        }
    }

    /**
     * Data loading and management
     */
    async loadDirectoryData() {
        try {
            console.log('📂 Loading directory data...');

            // This would typically load from the enhanced directory registry
            // For now, we'll create a comprehensive structure
            
            await this.buildDirectoryPools();
            
            console.log('✅ Directory data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load directory data:', error);
            throw error;
        }
    }

    async buildDirectoryPools() {
        // Build tier-based directory pools
        // This would integrate with Nathan's 190+ directory expansion
        
        console.log('🏗️ Building directory pools by tier...');

        // Tier 1: Basic directories (50 directories)
        for (let i = 1; i <= 50; i++) {
            this.directoryPools.tier1.add(`tier1_dir_${i}`);
        }

        // Tier 2: Growth directories (75 additional = 125 total)
        for (let i = 1; i <= 75; i++) {
            this.directoryPools.tier2.add(`tier2_dir_${i}`);
        }

        // Tier 3: Professional directories (50 additional = 175 total)
        for (let i = 1; i <= 50; i++) {
            this.directoryPools.tier3.add(`tier3_dir_${i}`);
        }

        // Tier 4: Advanced directories (15 additional = 190 total)
        for (let i = 1; i <= 15; i++) {
            this.directoryPools.tier4.add(`tier4_dir_${i}`);
        }

        // Tier 5: Enterprise directories (unlimited expansion)
        for (let i = 1; i <= 10; i++) {
            this.directoryPools.tier5.add(`tier5_dir_${i}`);
        }

        console.log(`✅ Built directory pools: Tier 1 (${this.directoryPools.tier1.size}), Tier 2 (${this.directoryPools.tier2.size}), Tier 3 (${this.directoryPools.tier3.size}), Tier 4 (${this.directoryPools.tier4.size}), Tier 5 (${this.directoryPools.tier5.size})`);
    }

    async getAllDirectories() {
        // Return cached data if still valid
        if (this.directoryCache.size > 0 && 
            (Date.now() - this.lastCacheUpdate) < this.cacheValidityPeriod) {
            return Array.from(this.directoryCache.values());
        }

        // Load fresh directory data
        await this.loadDirectoryData();
        return Array.from(this.directoryCache.values());
    }

    async initializePerformanceTracking() {
        console.log('📊 Initializing performance tracking...');

        try {
            // Load existing performance data from storage
            const stored = await chrome.storage.local.get(['directoryPerformance']);
            if (stored.directoryPerformance) {
                this.performanceData = new Map(stored.directoryPerformance);
                console.log(`📈 Loaded performance data for ${this.performanceData.size} directories`);
            }

            // Start performance data persistence
            setInterval(async () => {
                await this.persistPerformanceData();
            }, 300000); // Save every 5 minutes

        } catch (error) {
            console.warn('⚠️ Could not initialize performance tracking:', error);
        }
    }

    async persistPerformanceData() {
        try {
            await chrome.storage.local.set({
                directoryPerformance: Array.from(this.performanceData.entries())
            });
        } catch (error) {
            console.warn('⚠️ Could not persist performance data:', error);
        }
    }

    setupFilteringRules() {
        console.log('📋 Setting up filtering rules...');

        // Basic filtering rules
        this.filteringRules.set('tier_access', (directory, packageAccess) => {
            const tier = directory.fields.directory_tier || 1;
            return packageAccess.tierAccess.includes(tier);
        });

        this.filteringRules.set('anti_bot_check', (directory, packageAccess) => {
            return !directory.fields.has_anti_bot_protection || packageAccess.allowAntiBot;
        });

        this.filteringRules.set('captcha_check', (directory, packageAccess) => {
            return !directory.fields.requires_captcha || packageAccess.allowCaptcha;
        });

        console.log(`✅ Setup ${this.filteringRules.size} filtering rules`);
    }

    async loadAdaptiveFilteringData() {
        try {
            const stored = await chrome.storage.local.get(['adaptiveRules']);
            if (stored.adaptiveRules) {
                this.adaptiveRules = new Map(stored.adaptiveRules);
                console.log(`🔄 Loaded adaptive rules for ${this.adaptiveRules.size} package types`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load adaptive filtering data:', error);
        }
    }

    /**
     * Statistics and reporting
     */
    updateFilteringStats(packageType, originalCount, filteredCount) {
        const stats = {
            packageType,
            originalCount,
            filteredCount,
            filteringRatio: filteredCount / originalCount,
            timestamp: Date.now()
        };

        // Store in metrics
        const key = `${packageType}_${new Date().toDateString()}`;
        this.directoryMetrics.set(key, stats);

        console.log(`📊 Filtering stats for ${packageType}: ${filteredCount}/${originalCount} (${(stats.filteringRatio * 100).toFixed(1)}%)`);
    }

    getFilteringStats() {
        const stats = {
            totalFiltered: 0,
            packageBreakdown: {},
            performanceData: this.performanceData.size,
            adaptiveRules: this.adaptiveRules.size
        };

        for (const [key, metric] of this.directoryMetrics.entries()) {
            stats.totalFiltered += metric.filteredCount;
            
            if (!stats.packageBreakdown[metric.packageType]) {
                stats.packageBreakdown[metric.packageType] = {
                    totalRequests: 0,
                    totalDirectories: 0,
                    averageFilteringRatio: 0
                };
            }

            const breakdown = stats.packageBreakdown[metric.packageType];
            breakdown.totalRequests++;
            breakdown.totalDirectories += metric.filteredCount;
            breakdown.averageFilteringRatio = 
                (breakdown.averageFilteringRatio * (breakdown.totalRequests - 1) + metric.filteringRatio) / breakdown.totalRequests;
        }

        return stats;
    }

    /**
     * Public API methods
     */
    getPackageAccess(packageType) {
        return this.packageAccess[packageType] || null;
    }

    getDirectoryPools() {
        return {
            tier1: this.directoryPools.tier1.size,
            tier2: this.directoryPools.tier2.size,
            tier3: this.directoryPools.tier3.size,
            tier4: this.directoryPools.tier4.size,
            tier5: this.directoryPools.tier5.size
        };
    }

    async validateDirectoryAccess(directoryId, packageType) {
        const packageAccess = this.packageAccess[packageType];
        if (!packageAccess) return false;

        // Get directory info (would be from actual directory data)
        const directory = { fields: { directory_tier: 1 } }; // Placeholder

        // Check tier access
        const tier = directory.fields.directory_tier || 1;
        return packageAccess.tierAccess.includes(tier);
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Directory Filter...');

        // Save performance data
        if (this.config.enablePerformanceTracking) {
            await this.persistPerformanceData();
        }

        // Save adaptive rules
        try {
            await chrome.storage.local.set({
                adaptiveRules: Array.from(this.adaptiveRules.entries())
            });
        } catch (error) {
            console.warn('⚠️ Could not save adaptive rules:', error);
        }

        // Clear caches
        this.directoryCache.clear();
        this.performanceData.clear();
        this.directoryMetrics.clear();

        console.log('✅ Directory Filter shutdown complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryFilter;
} else if (typeof window !== 'undefined') {
    window.DirectoryFilter = DirectoryFilter;
}