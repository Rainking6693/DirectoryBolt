/**
 * Directory Registry System for Auto-Bolt Chrome Extension
 * Manages the master directory list with smart filtering and lookup capabilities
 * Provides comprehensive directory management logic to register, validate, and organize directories
 */

class DirectoryRegistry {
    constructor() {
        this.directories = [];
        this.metadata = {};
        this.initialized = false;
        this.filterCache = new Map();
        this.initializationPromise = null;
        this.version = '1.0.0';
        this.maxCacheSize = 100;
        
        // Centralized tier hierarchy for consistency
        this.tierHierarchy = {
            'starter': 1,
            'growth': 2,
            'professional': 3,
            'enterprise': 4
        };
    }

    /**
     * Initialize the registry with the master directory list
     * Enhanced with concurrent access protection and better error handling
     */
    async initialize() {
        // Prevent concurrent initialization
        if (this.initializationPromise) {
            return await this.initializationPromise;
        }
        
        this.initializationPromise = this._performInitialization();
        try {
            const result = await this.initializationPromise;
            return result;
        } finally {
            this.initializationPromise = null;
        }
    }
    
    /**
     * Internal initialization logic with enhanced error handling
     */
    async _performInitialization() {
        try {
            console.log('🏗️ Initializing Directory Registry...');
            
            // Clear any existing cache and state
            this.clearCache();
            this.directories = [];
            this.metadata = {};
            
            // Try to load expanded directory list first, fallback to original
            let response;
            let dataSource = 'expanded';
            
            try {
                response = await fetch(chrome.runtime.getURL('directories/expanded-master-directory-list.json'));
                if (!response.ok) {
                    throw new Error('Expanded directory list not found, falling back to original');
                }
            } catch (error) {
                console.log('📦 Loading original directory list as fallback...');
                dataSource = 'original';
                response = await fetch(chrome.runtime.getURL('directories/master-directory-list.json'));
                if (!response.ok) {
                    throw new Error(`Failed to load directory list: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            // Validate data structure integrity
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid directory data: not an object');
            }
            
            if (!Array.isArray(data.directories)) {
                throw new Error('Invalid directory data: directories is not an array');
            }
            
            this.directories = data.directories;
            this.metadata = data.metadata || {};
            this.packageTiers = data.metadata?.packageTiers || {};
            
            // Validate package tiers structure
            this._validatePackageTiers();
            
            // Normalize directory data for consistent processing
            const normalizationResult = this.normalizeDirectories();
            
            this.initialized = true;
            console.log(`✅ Directory Registry initialized with ${this.directories.length} directories (source: ${dataSource})`);
            console.log(`📊 Package tiers configured:`, Object.keys(this.packageTiers));
            console.log(`🔧 Normalization result:`, normalizationResult);
            
            return {
                success: true,
                totalDirectories: this.directories.length,
                metadata: this.metadata,
                packageTiers: this.packageTiers,
                dataSource,
                normalizationResult
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize Directory Registry:', error);
            this.initialized = false;
            throw new Error(`Registry initialization failed: ${error.message}`);
        }
    }

    /**
     * Normalize directory data to ensure consistent field structure
     * Enhanced with data validation and corruption detection
     */
    normalizeDirectories() {
        const stats = {
            processed: 0,
            normalized: 0,
            errors: 0,
            skipped: []
        };
        
        const validatedDirectories = [];
        
        for (let i = 0; i < this.directories.length; i++) {
            const dir = this.directories[i];
            stats.processed++;
            
            try {
                // Validate required fields
                if (!dir || typeof dir !== 'object') {
                    stats.errors++;
                    stats.skipped.push({ index: i, reason: 'Invalid directory object' });
                    continue;
                }
                
                if (!dir.id || !dir.name || !dir.url) {
                    stats.errors++;
                    stats.skipped.push({ index: i, reason: 'Missing required fields (id, name, url)', dir: dir.name || 'unnamed' });
                    continue;
                }
                
                // Validate URL format
                try {
                    new URL(dir.url);
                } catch {
                    stats.errors++;
                    stats.skipped.push({ index: i, reason: 'Invalid URL format', dir: dir.name });
                    continue;
                }
                
                // Ensure all required fields exist with proper types
                const normalized = {
                    id: String(dir.id),
                    name: String(dir.name),
                    url: String(dir.url),
                    category: this._validateCategory(dir.category),
                    priority: this._validatePriority(dir.priority),
                    submissionUrl: String(dir.submissionUrl || dir.url),
                    difficulty: this._validateDifficulty(dir.difficulty),
                    estimatedTime: this._validateEstimatedTime(dir.estimatedTime),
                    
                    // Normalize field mapping
                    fieldMapping: this._validateFieldMapping(dir.fieldMapping),
                    
                    // Normalize requirements
                    requirements: this._validateRequirements(dir.requirements),
                    
                    // Normalize boolean flags
                    hasAntiBot: Boolean(dir.hasAntiBot),
                    requiresLogin: Boolean(dir.requiresLogin),
                    
                    // Additional metadata with validation
                    monthlyTraffic: this._validateNumericField(dir.monthlyTraffic, null),
                    domainAuthority: this._validateDomainAuthority(dir.domainAuthority),
                    submissionFee: dir.submissionFee || null,
                    tier: this._validateTier(dir.tier)
                };
                
                validatedDirectories.push(normalized);
                stats.normalized++;
                
            } catch (error) {
                stats.errors++;
                stats.skipped.push({ 
                    index: i, 
                    reason: `Normalization error: ${error.message}`, 
                    dir: dir?.name || 'unnamed' 
                });
                console.warn(`Directory normalization error for ${dir?.name || 'unnamed'}: ${error.message}`);
            }
        }
        
        this.directories = validatedDirectories;
        
        if (stats.errors > 0) {
            console.warn(`Directory normalization completed with ${stats.errors} errors:`, stats.skipped);
        }
        
        return stats;
    }
    
    /**
     * Validation helper methods for directory normalization
     */
    _validateCategory(category) {
        const validCategories = ['tech-startups', 'business-professional', 'traditional-directories', 
                               'local-niche', 'ecommerce-marketplaces', 'content-media', 
                               'search-engines', 'social-media', 'review-sites', 'unknown'];
        return validCategories.includes(category) ? category : 'unknown';
    }
    
    _validatePriority(priority) {
        const validPriorities = ['high', 'medium', 'low'];
        return validPriorities.includes(priority) ? priority : 'medium';
    }
    
    _validateDifficulty(difficulty) {
        const validDifficulties = ['easy', 'medium', 'hard'];
        return validDifficulties.includes(difficulty) ? difficulty : 'medium';
    }
    
    _validateEstimatedTime(time) {
        const numTime = parseInt(time);
        return (numTime > 0 && numTime <= 3600) ? numTime : 300; // Default 5 minutes, max 1 hour
    }
    
    _validateFieldMapping(mapping) {
        if (!mapping || typeof mapping !== 'object') return {};
        
        // Ensure all field mapping values are strings
        const validated = {};
        for (const [key, value] of Object.entries(mapping)) {
            if (typeof value === 'string' && value.trim().length > 0) {
                validated[key] = value.trim();
            }
        }
        return validated;
    }
    
    _validateRequirements(requirements) {
        if (!Array.isArray(requirements)) return [];
        return requirements.filter(req => typeof req === 'string' && req.trim().length > 0);
    }
    
    _validateNumericField(value, defaultValue) {
        const num = parseInt(value);
        return (num >= 0) ? num : defaultValue;
    }
    
    _validateDomainAuthority(da) {
        const numDa = parseInt(da);
        return (numDa >= 0 && numDa <= 100) ? numDa : null;
    }
    
    _validateTier(tier) {
        return this.tierHierarchy.hasOwnProperty(tier) ? tier : 'starter';
    }
    
    _validatePackageTiers() {
        if (!this.packageTiers || typeof this.packageTiers !== 'object') {
            console.warn('Package tiers data missing or invalid, using defaults');
            this.packageTiers = this._getDefaultPackageTiers();
            return;
        }
        
        // Validate each tier has required properties
        for (const [tierName, tierData] of Object.entries(this.packageTiers)) {
            if (!this.tierHierarchy.hasOwnProperty(tierName)) {
                console.warn(`Invalid tier name: ${tierName}`);
                continue;
            }
            
            if (!tierData || typeof tierData !== 'object') {
                console.warn(`Invalid tier data for ${tierName}`);
                this.packageTiers[tierName] = this._getDefaultTierData(tierName);
            }
        }
    }
    
    _getDefaultPackageTiers() {
        return {
            starter: { minDirectories: 50, maxDirectories: 75, monthlySubmissions: 25 },
            growth: { minDirectories: 100, maxDirectories: 125, monthlySubmissions: 50 },
            professional: { minDirectories: 150, maxDirectories: 175, monthlySubmissions: 100 },
            enterprise: { minDirectories: 190, maxDirectories: 190, monthlySubmissions: 'Unlimited' }
        };
    }
    
    _getDefaultTierData(tierName) {
        const defaults = this._getDefaultPackageTiers();
        return defaults[tierName] || defaults.starter;
    }

    /**
     * Get all directories with optional filtering
     * Enhanced with cache management and validation
     */
    getDirectories(filters = {}) {
        if (!this.initialized) {
            console.warn('Directory Registry not initialized');
            return [];
        }
        
        const cacheKey = JSON.stringify(filters);
        
        // Check cache first
        if (this.filterCache.has(cacheKey)) {
            return this.filterCache.get(cacheKey);
        }
        
        let filtered = [...this.directories];
        
        try {
            // Apply filters with validation
            if (filters.category) {
                const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
                filtered = filtered.filter(dir => 
                    categories.includes(dir.category)
                );
            }
            
            if (filters.priority) {
                const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
                filtered = filtered.filter(dir => 
                    priorities.includes(dir.priority)
                );
            }
            
            if (filters.difficulty) {
                const difficulties = Array.isArray(filters.difficulty) ? filters.difficulty : [filters.difficulty];
                filtered = filtered.filter(dir => 
                    difficulties.includes(dir.difficulty)
                );
            }
            
            if (filters.tier) {
                const tiers = Array.isArray(filters.tier) ? filters.tier : [filters.tier];
                filtered = filtered.filter(dir => 
                    tiers.includes(dir.tier)
                );
            }
            
            if (filters.excludeAntiBot) {
                filtered = filtered.filter(dir => !dir.hasAntiBot);
            }
            
            if (filters.excludeLogin) {
                filtered = filtered.filter(dir => !dir.requiresLogin);
            }
            
            if (filters.excludeFees) {
                filtered = filtered.filter(dir => 
                    !dir.submissionFee || 
                    dir.submissionFee === '$0' || 
                    dir.submissionFee === 'Free' ||
                    dir.submissionFee.toLowerCase() === 'free'
                );
            }
            
            if (filters.maxEstimatedTime && typeof filters.maxEstimatedTime === 'number') {
                filtered = filtered.filter(dir => 
                    dir.estimatedTime <= filters.maxEstimatedTime
                );
            }
            
            if (filters.minDomainAuthority && typeof filters.minDomainAuthority === 'number') {
                filtered = filtered.filter(dir => 
                    (dir.domainAuthority || 0) >= filters.minDomainAuthority
                );
            }
            
            if (filters.maxDomainAuthority && typeof filters.maxDomainAuthority === 'number') {
                filtered = filtered.filter(dir => 
                    (dir.domainAuthority || 0) <= filters.maxDomainAuthority
                );
            }
            
            // Manage cache size to prevent memory leaks
            this._manageCacheSize();
            
            // Cache result
            this.filterCache.set(cacheKey, filtered);
            
            return filtered;
            
        } catch (error) {
            console.error('Error filtering directories:', error);
            return [];
        }
    }
    
    /**
     * Manage cache size to prevent memory leaks
     */
    _manageCacheSize() {
        if (this.filterCache.size >= this.maxCacheSize) {
            // Remove oldest entries (FIFO)
            const entriesToRemove = this.filterCache.size - this.maxCacheSize + 10; // Remove 10 extra for buffer
            let removed = 0;
            
            for (const key of this.filterCache.keys()) {
                if (removed >= entriesToRemove) break;
                this.filterCache.delete(key);
                removed++;
            }
        }
    }

    /**
     * Get directory by ID
     */
    getDirectoryById(id) {
        return this.directories.find(dir => dir.id === id);
    }

    /**
     * Get directories by category
     */
    getDirectoriesByCategory(category) {
        return this.getDirectories({ category });
    }

    /**
     * Get directories by package tier with access control
     * Enhanced with validation and error handling
     */
    getDirectoriesByTier(userTier = 'starter') {
        if (!this.initialized) {
            console.warn('Directory Registry not initialized');
            return [];
        }
        
        const userLevel = this.tierHierarchy[userTier];
        if (!userLevel) {
            console.warn(`Invalid user tier: ${userTier}, defaulting to starter`);
            userTier = 'starter';
        }
        
        const actualUserLevel = this.tierHierarchy[userTier];
        
        return this.directories.filter(dir => {
            const dirLevel = this.tierHierarchy[dir.tier] || 1;
            return dirLevel <= actualUserLevel;
        });
    }

    /**
     * Get high-value directories (DA 80+) for premium tiers
     */
    getHighValueDirectories(userTier = 'starter') {
        const tierDirectories = this.getDirectoriesByTier(userTier);
        return tierDirectories.filter(dir => 
            (dir.domainAuthority || 0) >= 80
        );
    }

    /**
     * Get directories suitable for specific business categories
     */
    getDirectoriesForBusinessType(businessType, userTier = 'starter') {
        const tierDirectories = this.getDirectoriesByTier(userTier);
        
        // Business type to category mapping
        const typeMapping = {
            'tech-startup': ['tech-startups', 'business-professional'],
            'local-business': ['local-niche', 'traditional-directories'],
            'ecommerce': ['ecommerce-marketplaces', 'business-professional'],
            'service-business': ['local-niche', 'business-professional'],
            'software': ['tech-startups', 'business-professional'],
            'general': ['traditional-directories', 'business-professional']
        };
        
        const relevantCategories = typeMapping[businessType] || ['traditional-directories'];
        
        return tierDirectories.filter(dir => 
            relevantCategories.includes(dir.category)
        );
    }

    /**
     * Get high-priority directories
     */
    getHighPriorityDirectories() {
        return this.getDirectories({ priority: 'high' });
    }

    /**
     * Get easy-to-process directories (no anti-bot, no login required)
     */
    getEasyDirectories() {
        return this.getDirectories({
            difficulty: 'easy',
            excludeAntiBot: true,
            excludeLogin: true,
            excludeFees: true
        });
    }

    /**
     * Get directories suitable for automated processing
     */
    getAutomatableDirectories() {
        return this.getDirectories({
            excludeAntiBot: true,
            excludeLogin: false, // May include login if we have credentials
            maxEstimatedTime: 600 // 10 minutes max
        });
    }

    /**
     * Get processing recommendations based on criteria
     */
    getProcessingRecommendations(criteria = {}) {
        const {
            maxTime = 3600, // 1 hour max total time
            prioritizeHigh = true,
            excludeComplicated = true,
            allowFees = false
        } = criteria;

        let recommended = this.getDirectories({
            excludeAntiBot: excludeComplicated,
            excludeLogin: excludeComplicated,
            excludeFees: !allowFees
        });

        // Sort by priority and difficulty
        recommended.sort((a, b) => {
            // Priority order: high > medium > low
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Difficulty order: easy > medium > hard
            const difficultyOrder = { easy: 3, medium: 2, hard: 1 };
            return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        });

        // Calculate time budget and recommend subset
        let totalTime = 0;
        const timeBudgetedDirectories = [];
        
        for (const dir of recommended) {
            if (totalTime + dir.estimatedTime <= maxTime) {
                timeBudgetedDirectories.push(dir);
                totalTime += dir.estimatedTime;
            }
        }

        return {
            recommended: timeBudgetedDirectories,
            totalEstimatedTime: totalTime,
            skippedCount: recommended.length - timeBudgetedDirectories.length,
            summary: {
                high: timeBudgetedDirectories.filter(d => d.priority === 'high').length,
                medium: timeBudgetedDirectories.filter(d => d.priority === 'medium').length,
                low: timeBudgetedDirectories.filter(d => d.priority === 'low').length
            }
        };
    }

    /**
     * Get field mapping patterns for auto-form population
     */
    getFieldMappingPatterns() {
        const patterns = {
            businessName: new Set(),
            email: new Set(),
            phone: new Set(),
            website: new Set(),
            address: new Set(),
            description: new Set()
        };

        this.directories.forEach(dir => {
            Object.entries(dir.fieldMapping).forEach(([field, selector]) => {
                if (patterns[field]) {
                    patterns[field].add(selector);
                }
            });
        });

        // Convert sets to arrays and add common fallback patterns
        return {
            businessName: [
                ...Array.from(patterns.businessName),
                'input[name*="business"]',
                'input[name*="company"]',
                'input[name*="name"]',
                'input[name="developer_name"]', // Chrome Web Store
                'input[name="artist_name"]', // Spotify Artists
                'input[name="podcast_title"]', // Apple Podcasts
                'input[name="channel-name"]', // YouTube Creator
                '#businessName',
                '#companyName',
                '.business-name',
                '.company-name'
            ],
            email: [
                ...Array.from(patterns.email),
                'input[type="email"]',
                'input[name*="email"]',
                '#email',
                '.email'
            ],
            phone: [
                ...Array.from(patterns.phone),
                'input[type="tel"]',
                'input[name*="phone"]',
                'input[name*="tel"]',
                '#phone',
                '#telephone',
                '.phone',
                '.tel'
            ],
            website: [
                ...Array.from(patterns.website),
                'input[name*="website"]',
                'input[name*="url"]',
                'input[name*="web"]',
                '#website',
                '#url',
                '.website',
                '.url'
            ],
            address: [
                ...Array.from(patterns.address),
                'input[name*="address"]',
                'textarea[name*="address"]',
                '#address',
                '.address'
            ],
            description: [
                ...Array.from(patterns.description),
                'textarea[name*="description"]',
                'textarea[name*="about"]',
                'textarea[name*="bio"]',
                '#description',
                '#about',
                '.description',
                '.about'
            ]
        };
    }

    /**
     * Get statistics about the directory registry
     */
    getStatistics() {
        if (!this.initialized) {
            return null;
        }

        const stats = {
            total: this.directories.length,
            byCategory: {},
            byPriority: {},
            byDifficulty: {},
            byTier: {},
            byDomainAuthority: {
                '90+': 0,
                '80-89': 0,
                '70-79': 0,
                '60-69': 0,
                '50-59': 0,
                '30-49': 0,
                'unknown': 0
            },
            automatable: 0,
            requiresLogin: 0,
            hasAntiBot: 0,
            hasFees: 0
        };

        this.directories.forEach(dir => {
            // Category stats
            stats.byCategory[dir.category] = (stats.byCategory[dir.category] || 0) + 1;
            
            // Priority stats
            stats.byPriority[dir.priority] = (stats.byPriority[dir.priority] || 0) + 1;
            
            // Difficulty stats
            stats.byDifficulty[dir.difficulty] = (stats.byDifficulty[dir.difficulty] || 0) + 1;
            
            // Tier stats
            stats.byTier[dir.tier] = (stats.byTier[dir.tier] || 0) + 1;
            
            // Domain Authority stats
            const da = dir.domainAuthority || 0;
            if (da >= 90) {
                stats.byDomainAuthority['90+']++;
            } else if (da >= 80) {
                stats.byDomainAuthority['80-89']++;
            } else if (da >= 70) {
                stats.byDomainAuthority['70-79']++;
            } else if (da >= 60) {
                stats.byDomainAuthority['60-69']++;
            } else if (da >= 50) {
                stats.byDomainAuthority['50-59']++;
            } else if (da >= 30) {
                stats.byDomainAuthority['30-49']++;
            } else {
                stats.byDomainAuthority['unknown']++;
            }
            
            // Feature stats
            if (!dir.hasAntiBot && !dir.requiresLogin) {
                stats.automatable++;
            }
            
            if (dir.requiresLogin) {
                stats.requiresLogin++;
            }
            
            if (dir.hasAntiBot) {
                stats.hasAntiBot++;
            }
            
            if (dir.submissionFee && dir.submissionFee !== '$0' && dir.submissionFee !== 'Free') {
                stats.hasFees++;
            }
        });

        return stats;
    }

    /**
     * Clear the filter cache
     * Enhanced with logging and selective clearing options
     */
    clearCache(pattern = null) {
        if (!pattern) {
            const cacheSize = this.filterCache.size;
            this.filterCache.clear();
            if (cacheSize > 0) {
                console.log(`🗑️ Cleared ${cacheSize} cache entries`);
            }
        } else {
            // Selective cache clearing by pattern
            let cleared = 0;
            for (const [key, value] of this.filterCache.entries()) {
                if (key.includes(pattern)) {
                    this.filterCache.delete(key);
                    cleared++;
                }
            }
            if (cleared > 0) {
                console.log(`🗑️ Cleared ${cleared} cache entries matching pattern: ${pattern}`);
            }
        }
    }

    /**
     * Check if registry is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get package tier information
     */
    getPackageTierInfo(tier = 'starter') {
        return this.packageTiers[tier] || null;
    }

    /**
     * Validate user access to directory based on package tier
     * Enhanced with better validation and logging
     */
    validateDirectoryAccess(directoryId, userTier = 'starter') {
        if (!this.initialized) {
            return { access: false, reason: 'Directory Registry not initialized' };
        }
        
        if (!directoryId) {
            return { access: false, reason: 'Directory ID is required' };
        }
        
        const directory = this.getDirectoryById(directoryId);
        if (!directory) {
            return { access: false, reason: 'Directory not found', directoryId };
        }
        
        const userLevel = this.tierHierarchy[userTier];
        if (!userLevel) {
            console.warn(`Invalid user tier: ${userTier}, defaulting to starter`);
            userTier = 'starter';
        }
        
        const actualUserLevel = this.tierHierarchy[userTier];
        const requiredLevel = this.tierHierarchy[directory.tier] || 1;
        
        if (actualUserLevel >= requiredLevel) {
            return { 
                access: true, 
                directory,
                userTier,
                requiredTier: directory.tier
            };
        } else {
            return { 
                access: false, 
                reason: `Requires ${directory.tier} tier or higher`,
                currentTier: userTier,
                requiredTier: directory.tier,
                directoryName: directory.name
            };
        }
    }

    /**
     * Get recommended upgrade path based on usage patterns
     */
    getUpgradeRecommendations(userTier = 'starter', desiredCategories = []) {
        const currentDirectories = this.getDirectoriesByTier(userTier);
        const allDirectories = this.directories;
        
        const upgradeBenefits = {
            'growth': {
                additionalDirectories: this.getDirectoriesByTier('growth').length - currentDirectories.length,
                highValueDirectories: this.getDirectoriesByTier('growth').filter(d => (d.domainAuthority || 0) >= 70).length,
                categories: [...new Set(this.getDirectoriesByTier('growth').map(d => d.category))]
            },
            'professional': {
                additionalDirectories: this.getDirectoriesByTier('professional').length - currentDirectories.length,
                highValueDirectories: this.getDirectoriesByTier('professional').filter(d => (d.domainAuthority || 0) >= 80).length,
                categories: [...new Set(this.getDirectoriesByTier('professional').map(d => d.category))]
            },
            'enterprise': {
                additionalDirectories: allDirectories.length - currentDirectories.length,
                highValueDirectories: allDirectories.filter(d => (d.domainAuthority || 0) >= 90).length,
                categories: [...new Set(allDirectories.map(d => d.category))]
            }
        };
        
        return upgradeBenefits;
    }
}

// Make DirectoryRegistry available globally for service worker
globalThis.DirectoryRegistry = DirectoryRegistry;

// Package Tier Engine for access control
class PackageTierEngine {
    constructor() {
        this.tierLimits = {
            'starter': { maxDirectories: 75, maxSubmissions: 25 },
            'growth': { maxDirectories: 125, maxSubmissions: 50 },
            'professional': { maxDirectories: 175, maxSubmissions: 100 },
            'enterprise': { maxDirectories: -1, maxSubmissions: -1 }
        };
    }
    
    validateAccess(userTier, requestedDirectories) {
        const limits = this.tierLimits[userTier];
        if (!limits) return false;
        
        if (limits.maxDirectories === -1) return true;
        return requestedDirectories <= limits.maxDirectories;
    }
    
    getAvailableDirectories(userTier, registry) {
        return registry.getDirectoriesByTier(userTier);
    }
}

// Create singleton instance
const directoryRegistry = new DirectoryRegistry();
const packageTierEngine = new PackageTierEngine();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryRegistry;
}