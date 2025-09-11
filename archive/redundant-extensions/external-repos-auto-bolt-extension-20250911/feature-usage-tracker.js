/**
 * Feature Usage Analytics Tracker
 * Tracks usage patterns and feature adoption
 * Target: >70% multi-directory usage
 */

class FeatureUsageTracker {
    constructor() {
        this.config = {
            multiDirectoryTarget: 70,    // >70% should use multiple directories
            featureCategories: {
                core: ['form_filling', 'directory_selection', 'auto_fill'],
                advanced: ['multi_directory', 'custom_mapping', 'bulk_processing'],
                productivity: ['keyboard_shortcuts', 'favorites', 'recent_sites'],
                customization: ['field_mapping', 'user_preferences', 'directory_creation']
            },
            trackingWindow: 90,          // Days to track usage data
            engagementLevels: {
                power_user: { sessions: 20, features: 8, directories: 5 },
                regular_user: { sessions: 10, features: 5, directories: 3 },
                casual_user: { sessions: 3, features: 3, directories: 1 },
                new_user: { sessions: 1, features: 1, directories: 1 }
            }
        };
        
        this.usageData = {
            users: new Map(),           // Per-user usage data
            features: new Map(),        // Feature usage statistics
            directories: new Map(),     // Directory usage patterns
            sessions: new Map(),        // Session-based usage
            cohorts: new Map()         // Usage cohort analysis
        };
        
        this.featureDefinitions = new Map();
        this.currentSession = null;
        this.isInitialized = false;
    }
    
    async init() {
        console.log('📊 Initializing Feature Usage Tracker...');
        
        try {
            // Define trackable features
            this.defineFeatures();
            
            // Load existing usage data
            await this.loadUsageData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start session tracking
            this.startSessionTracking();
            
            this.isInitialized = true;
            console.log('✅ Feature Usage Tracker initialized');
            
        } catch (error) {
            console.error('Error initializing Feature Usage Tracker:', error);
        }
    }
    
    defineFeatures() {
        // Core features
        this.featureDefinitions.set('form_filling', {
            name: 'Form Filling',
            category: 'core',
            description: 'Basic form field population',
            weight: 1,
            events: ['form_filled', 'form_started', 'form_completed']
        });
        
        this.featureDefinitions.set('directory_selection', {
            name: 'Directory Selection',
            category: 'core',
            description: 'Choosing data directories',
            weight: 1,
            events: ['directory_selected', 'directory_loaded']
        });
        
        this.featureDefinitions.set('auto_fill', {
            name: 'Auto Fill',
            category: 'core',
            description: 'Automatic form population',
            weight: 1,
            events: ['auto_fill_triggered', 'fields_filled']
        });
        
        // Advanced features
        this.featureDefinitions.set('multi_directory', {
            name: 'Multi-Directory Usage',
            category: 'advanced',
            description: 'Using multiple directories in session',
            weight: 3,
            events: ['multi_directory_used', 'directory_switched']
        });
        
        this.featureDefinitions.set('custom_mapping', {
            name: 'Custom Field Mapping',
            category: 'advanced',
            description: 'Creating custom field mappings',
            weight: 2,
            events: ['mapping_created', 'mapping_modified']
        });
        
        this.featureDefinitions.set('bulk_processing', {
            name: 'Bulk Processing',
            category: 'advanced',
            description: 'Processing multiple forms at once',
            weight: 3,
            events: ['bulk_start', 'bulk_completed']
        });
        
        // Productivity features
        this.featureDefinitions.set('keyboard_shortcuts', {
            name: 'Keyboard Shortcuts',
            category: 'productivity',
            description: 'Using keyboard shortcuts',
            weight: 2,
            events: ['shortcut_used', 'hotkey_triggered']
        });
        
        this.featureDefinitions.set('favorites', {
            name: 'Favorites',
            category: 'productivity',
            description: 'Using favorite directories or sites',
            weight: 2,
            events: ['favorite_used', 'favorite_added']
        });
        
        this.featureDefinitions.set('recent_sites', {
            name: 'Recent Sites',
            category: 'productivity',
            description: 'Accessing recently used sites',
            weight: 1,
            events: ['recent_site_used', 'recent_accessed']
        });
        
        // Customization features
        this.featureDefinitions.set('field_mapping', {
            name: 'Field Mapping',
            category: 'customization',
            description: 'Customizing field mappings',
            weight: 2,
            events: ['mapping_edited', 'field_mapped']
        });
        
        this.featureDefinitions.set('user_preferences', {
            name: 'User Preferences',
            category: 'customization',
            description: 'Configuring user preferences',
            weight: 1,
            events: ['preference_changed', 'settings_modified']
        });
        
        this.featureDefinitions.set('directory_creation', {
            name: 'Directory Creation',
            category: 'customization',
            description: 'Creating new directories',
            weight: 3,
            events: ['directory_created', 'directory_added']
        });
        
        console.log(`📋 Defined ${this.featureDefinitions.size} trackable features`);
    }
    
    async loadUsageData() {
        try {
            const result = await chrome.storage.local.get([
                'featureUsageData',
                'directoryUsageData',
                'sessionUsageData',
                'usageCohorts'
            ]);
            
            if (result.featureUsageData) {
                const usageData = result.featureUsageData;
                for (const [userId, data] of Object.entries(usageData)) {
                    this.usageData.users.set(userId, {
                        ...data,
                        directories: new Set(data.directories || []),
                        features: new Set(data.features || [])
                    });
                }
            }
            
            if (result.directoryUsageData) {
                this.usageData.directories = new Map(Object.entries(result.directoryUsageData));
            }
            
            if (result.sessionUsageData) {
                this.usageData.sessions = new Map(Object.entries(result.sessionUsageData));
            }
            
            if (result.usageCohorts) {
                this.usageData.cohorts = new Map(Object.entries(result.usageCohorts));
            }
            
            console.log(`📊 Loaded usage data for ${this.usageData.users.size} users`);
            
        } catch (error) {
            console.error('Error loading usage data:', error);
        }
    }
    
    setupEventListeners() {
        // Listen for feature usage events
        if (typeof document !== 'undefined') {
            document.addEventListener('autoBoltFeatureUsed', (event) => {
                this.trackFeatureUsage(event.detail);
            });
            
            document.addEventListener('autoBoltDirectoryUsed', (event) => {
                this.trackDirectoryUsage(event.detail);
            });
            
            document.addEventListener('autoBoltSessionEvent', (event) => {
                this.trackSessionEvent(event.detail);
            });
        }
        
        // Listen for Chrome extension messages
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'FEATURE_USAGE') {
                    this.trackFeatureUsage(message.data);
                } else if (message.type === 'DIRECTORY_USAGE') {
                    this.trackDirectoryUsage(message.data);
                }
            });
        }
    }
    
    startSessionTracking() {
        // Create session if not exists
        if (!this.currentSession) {
            this.currentSession = this.createNewSession();
        }
        
        // Update session activity periodically
        this.sessionInterval = setInterval(() => {
            this.updateSessionActivity();
        }, 30000); // Every 30 seconds
        
        // Track page visibility changes
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseSession();
                } else {
                    this.resumeSession();
                }
            });
        }
    }
    
    createNewSession() {
        return {
            id: this.generateSessionId(),
            userId: this.getCurrentUserId(),
            startTime: Date.now(),
            lastActivity: Date.now(),
            endTime: null,
            duration: 0,
            features: new Set(),
            directories: new Set(),
            events: [],
            metrics: {
                formsProcessed: 0,
                directoriesSwitched: 0,
                errorsEncountered: 0,
                featuresUsed: 0
            },
            status: 'active'
        };
    }
    
    updateSessionActivity() {
        if (this.currentSession && this.currentSession.status === 'active') {
            this.currentSession.lastActivity = Date.now();
            this.currentSession.duration = Date.now() - this.currentSession.startTime;
        }
    }
    
    pauseSession() {
        if (this.currentSession && this.currentSession.status === 'active') {
            this.currentSession.status = 'paused';
            this.currentSession.duration = Date.now() - this.currentSession.startTime;
        }
    }
    
    resumeSession() {
        if (this.currentSession && this.currentSession.status === 'paused') {
            this.currentSession.status = 'active';
            this.currentSession.lastActivity = Date.now();
        }
    }
    
    endSession() {
        if (this.currentSession) {
            this.currentSession.status = 'ended';
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            
            // Store session data
            this.storeSessionData(this.currentSession);
            
            // Update user data
            this.updateUserDataFromSession(this.currentSession);
            
            console.log(`📋 Session ended: ${this.currentSession.duration / 1000}s, ${this.currentSession.features.size} features used`);
            
            this.currentSession = null;
        }
    }
    
    // Feature usage tracking
    
    trackFeatureUsage(eventData) {
        const { eventName, userId, properties } = eventData;
        const timestamp = Date.now();
        
        // Find matching feature definition
        const featureId = this.identifyFeature(eventName);
        if (!featureId) {
            console.warn(`Unknown feature event: ${eventName}`);
            return;
        }
        
        const feature = this.featureDefinitions.get(featureId);
        
        // Update current session
        if (this.currentSession) {
            this.currentSession.features.add(featureId);
            this.currentSession.events.push({
                timestamp,
                eventName,
                featureId,
                properties
            });
            this.currentSession.metrics.featuresUsed++;
        }
        
        // Update user data
        this.updateUserFeatureUsage(userId || this.getCurrentUserId(), featureId, eventData);
        
        // Update global feature statistics
        this.updateFeatureStatistics(featureId, eventData);
        
        console.log(`📊 Feature tracked: ${feature.name} (${featureId})`);
    }
    
    identifyFeature(eventName) {
        // Match event name to feature definition
        for (const [featureId, feature] of this.featureDefinitions.entries()) {
            if (feature.events.some(event => eventName.includes(event))) {
                return featureId;
            }
        }
        
        // Check for partial matches
        for (const [featureId, feature] of this.featureDefinitions.entries()) {
            if (eventName.toLowerCase().includes(featureId.toLowerCase())) {
                return featureId;
            }
        }
        
        return null;
    }
    
    updateUserFeatureUsage(userId, featureId, eventData) {
        if (!this.usageData.users.has(userId)) {
            this.usageData.users.set(userId, {
                userId,
                firstUsed: Date.now(),
                lastUsed: Date.now(),
                totalSessions: 0,
                features: new Set(),
                directories: new Set(),
                featureUsage: new Map(),
                engagementLevel: 'new_user',
                usageScore: 0,
                preferences: new Map()
            });
        }
        
        const userData = this.usageData.users.get(userId);
        userData.lastUsed = Date.now();
        userData.features.add(featureId);
        
        // Track feature-specific usage
        if (!userData.featureUsage.has(featureId)) {
            userData.featureUsage.set(featureId, {
                featureId,
                firstUsed: Date.now(),
                lastUsed: Date.now(),
                usageCount: 0,
                sessionsUsed: new Set(),
                avgTimeBetweenUse: 0,
                proficiencyLevel: 'beginner'
            });
        }
        
        const featureUsage = userData.featureUsage.get(featureId);
        featureUsage.lastUsed = Date.now();
        featureUsage.usageCount++;
        
        if (this.currentSession) {
            featureUsage.sessionsUsed.add(this.currentSession.id);
        }
        
        // Calculate proficiency level
        featureUsage.proficiencyLevel = this.calculateProficiencyLevel(featureUsage);
        
        userData.featureUsage.set(featureId, featureUsage);
        
        // Update user engagement level
        userData.engagementLevel = this.calculateEngagementLevel(userData);
        
        // Update usage score
        userData.usageScore = this.calculateUsageScore(userData);
        
        this.usageData.users.set(userId, userData);
    }
    
    updateFeatureStatistics(featureId, eventData) {
        if (!this.usageData.features.has(featureId)) {
            this.usageData.features.set(featureId, {
                featureId,
                totalUsage: 0,
                uniqueUsers: new Set(),
                adoptionRate: 0,
                retentionRate: 0,
                avgUsagePerSession: 0,
                trendData: new Map(),
                lastUsed: Date.now()
            });
        }
        
        const featureStats = this.usageData.features.get(featureId);
        featureStats.totalUsage++;
        featureStats.uniqueUsers.add(eventData.userId || this.getCurrentUserId());
        featureStats.lastUsed = Date.now();
        
        // Calculate adoption rate (unique users / total users)
        featureStats.adoptionRate = (featureStats.uniqueUsers.size / this.getTotalUsers()) * 100;
        
        this.usageData.features.set(featureId, featureStats);
    }
    
    // Directory usage tracking
    
    trackDirectoryUsage(eventData) {
        const { directoryId, directoryName, userId, action } = eventData;
        const timestamp = Date.now();
        
        // Update current session
        if (this.currentSession) {
            this.currentSession.directories.add(directoryId);
            this.currentSession.events.push({
                timestamp,
                eventName: 'directory_used',
                directoryId,
                directoryName,
                action
            });
            
            if (action === 'switched') {
                this.currentSession.metrics.directoriesSwitched++;
            }
            
            // Check for multi-directory usage
            if (this.currentSession.directories.size > 1) {
                this.trackFeatureUsage({
                    eventName: 'multi_directory_used',
                    userId,
                    properties: {
                        directoriesCount: this.currentSession.directories.size,
                        directories: Array.from(this.currentSession.directories)
                    }
                });
            }
        }
        
        // Update user directory usage
        this.updateUserDirectoryUsage(userId || this.getCurrentUserId(), directoryId, directoryName);
        
        // Update directory statistics
        this.updateDirectoryStatistics(directoryId, directoryName, eventData);
        
        console.log(`📂 Directory tracked: ${directoryName} (${directoryId})`);
    }
    
    updateUserDirectoryUsage(userId, directoryId, directoryName) {
        const userData = this.usageData.users.get(userId) || this.createNewUserData(userId);
        userData.directories.add(directoryId);
        
        // Track directory-specific usage
        const directoryUsage = userData.directoryUsage || new Map();
        
        if (!directoryUsage.has(directoryId)) {
            directoryUsage.set(directoryId, {
                directoryId,
                directoryName,
                firstUsed: Date.now(),
                lastUsed: Date.now(),
                usageCount: 0,
                formsProcessed: 0,
                avgTimeBetweenUse: 0
            });
        }
        
        const dirUsage = directoryUsage.get(directoryId);
        dirUsage.lastUsed = Date.now();
        dirUsage.usageCount++;
        
        userData.directoryUsage = directoryUsage;
        userData.lastUsed = Date.now();
        
        this.usageData.users.set(userId, userData);
    }
    
    updateDirectoryStatistics(directoryId, directoryName, eventData) {
        if (!this.usageData.directories.has(directoryId)) {
            this.usageData.directories.set(directoryId, {
                directoryId,
                directoryName,
                totalUsage: 0,
                uniqueUsers: new Set(),
                popularity: 0,
                successRate: 100,
                avgFormsPerSession: 0,
                lastUsed: Date.now(),
                sites: new Set()
            });
        }
        
        const dirStats = this.usageData.directories.get(directoryId);
        dirStats.totalUsage++;
        dirStats.uniqueUsers.add(eventData.userId || this.getCurrentUserId());
        dirStats.lastUsed = Date.now();
        
        if (eventData.siteUrl) {
            dirStats.sites.add(eventData.siteUrl);
        }
        
        // Calculate popularity (usage relative to other directories)
        const totalDirectoryUsage = Array.from(this.usageData.directories.values())
            .reduce((sum, dir) => sum + dir.totalUsage, 0);
        
        dirStats.popularity = totalDirectoryUsage > 0 ? (dirStats.totalUsage / totalDirectoryUsage) * 100 : 0;
        
        this.usageData.directories.set(directoryId, dirStats);
    }
    
    // Session event tracking
    
    trackSessionEvent(eventData) {
        if (!this.currentSession) return;
        
        const { eventName, properties } = eventData;
        
        this.currentSession.events.push({
            timestamp: Date.now(),
            eventName,
            properties
        });
        
        // Update session metrics based on event
        switch (eventName) {
            case 'form_processed':
                this.currentSession.metrics.formsProcessed++;
                break;
            case 'error_occurred':
                this.currentSession.metrics.errorsEncountered++;
                break;
        }
    }
    
    storeSessionData(session) {
        // Convert Sets to Arrays for storage
        const sessionData = {
            ...session,
            features: Array.from(session.features),
            directories: Array.from(session.directories)
        };
        
        this.usageData.sessions.set(session.id, sessionData);
    }
    
    updateUserDataFromSession(session) {
        const userId = session.userId;
        const userData = this.usageData.users.get(userId) || this.createNewUserData(userId);
        
        userData.totalSessions++;
        userData.lastUsed = session.endTime;
        
        // Add session features and directories
        for (const featureId of session.features) {
            userData.features.add(featureId);
        }
        
        for (const directoryId of session.directories) {
            userData.directories.add(directoryId);
        }
        
        // Update engagement level
        userData.engagementLevel = this.calculateEngagementLevel(userData);
        
        this.usageData.users.set(userId, userData);
    }
    
    // Analysis methods
    
    async getFeatureMetrics(timeRange = '30d') {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        // Get users who have used the extension in the time range
        const activeUsers = Array.from(this.usageData.users.values())
            .filter(user => user.lastUsed >= since);
        
        if (activeUsers.length === 0) {
            return this.getEmptyFeatureMetrics();
        }
        
        // Calculate multi-directory usage
        const multiDirectoryUsers = activeUsers
            .filter(user => user.directories.size > 1);
        
        const multiDirectoryRate = (multiDirectoryUsers.length / activeUsers.length) * 100;
        
        // Feature adoption rates
        const featureAdoption = this.calculateFeatureAdoption(activeUsers);
        
        // Directory usage patterns
        const directoryPatterns = this.analyzeDirectoryPatterns(activeUsers);
        
        // User segmentation
        const userSegmentation = this.segmentUsers(activeUsers);
        
        // Usage trends
        const trends = this.analyzeUsageTrends(timeRange);
        
        return {
            multiDirectoryRate,
            target: this.config.multiDirectoryTarget,
            achieved: multiDirectoryRate >= this.config.multiDirectoryTarget,
            totalActiveUsers: activeUsers.length,
            multiDirectoryUsers: multiDirectoryUsers.length,
            featureAdoption,
            directoryPatterns,
            userSegmentation,
            trends,
            insights: this.generateUsageInsights(activeUsers),
            timeRange,
            calculatedAt: now
        };
    }
    
    calculateFeatureAdoption(users) {
        const featureStats = {};
        
        for (const [featureId, feature] of this.featureDefinitions.entries()) {
            const usersWithFeature = users.filter(user => user.features.has(featureId));
            
            featureStats[featureId] = {
                name: feature.name,
                category: feature.category,
                adoptionRate: users.length > 0 ? (usersWithFeature.length / users.length) * 100 : 0,
                usersCount: usersWithFeature.length,
                totalUsers: users.length,
                weight: feature.weight
            };
        }
        
        return featureStats;
    }
    
    analyzeDirectoryPatterns(users) {
        const patterns = {
            singleDirectory: 0,
            multiDirectory: 0,
            powerUser: 0,
            directoryPreferences: new Map(),
            commonCombinations: new Map()
        };
        
        for (const user of users) {
            const dirCount = user.directories.size;
            
            if (dirCount === 1) {
                patterns.singleDirectory++;
            } else if (dirCount > 1) {
                patterns.multiDirectory++;
                
                if (dirCount >= 5) {
                    patterns.powerUser++;
                }
                
                // Track directory combinations
                const combination = Array.from(user.directories).sort().join(',');
                const count = patterns.commonCombinations.get(combination) || 0;
                patterns.commonCombinations.set(combination, count + 1);
            }
            
            // Track individual directory preferences
            for (const directoryId of user.directories) {
                const count = patterns.directoryPreferences.get(directoryId) || 0;
                patterns.directoryPreferences.set(directoryId, count + 1);
            }
        }
        
        // Convert Maps to Objects and get top combinations
        patterns.directoryPreferences = Object.fromEntries(
            Array.from(patterns.directoryPreferences.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        );
        
        patterns.commonCombinations = Object.fromEntries(
            Array.from(patterns.commonCombinations.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        );
        
        return patterns;
    }
    
    segmentUsers(users) {
        const segments = {
            power_users: [],
            regular_users: [],
            casual_users: [],
            new_users: []
        };
        
        for (const user of users) {
            const level = this.calculateEngagementLevel(user);
            segments[level].push(user.userId);
        }
        
        return {
            ...segments,
            segmentSizes: {
                power_users: segments.power_users.length,
                regular_users: segments.regular_users.length,
                casual_users: segments.casual_users.length,
                new_users: segments.new_users.length
            },
            percentages: users.length > 0 ? {
                power_users: (segments.power_users.length / users.length) * 100,
                regular_users: (segments.regular_users.length / users.length) * 100,
                casual_users: (segments.casual_users.length / users.length) * 100,
                new_users: (segments.new_users.length / users.length) * 100
            } : {}
        };
    }
    
    analyzeUsageTrends(timeRange) {
        // This would analyze usage trends over time
        // For now, return basic trend information
        return {
            featureTrend: 'stable',
            directoryTrend: 'increasing',
            engagementTrend: 'stable',
            newFeatureAdoption: 30 // Placeholder percentage
        };
    }
    
    generateUsageInsights(users) {
        const insights = [];
        
        // Multi-directory usage insight
        const multiDirUsers = users.filter(user => user.directories.size > 1);
        const multiDirRate = users.length > 0 ? (multiDirUsers.length / users.length) * 100 : 0;
        
        if (multiDirRate < this.config.multiDirectoryTarget) {
            insights.push({
                type: 'low_multi_directory',
                severity: 'medium',
                message: `Only ${multiDirRate.toFixed(1)}% of users use multiple directories`,
                recommendation: 'Improve directory discovery and showcase benefits of using multiple directories'
            });
        } else {
            insights.push({
                type: 'good_multi_directory',
                severity: 'info',
                message: `${multiDirRate.toFixed(1)}% of users use multiple directories (exceeds ${this.config.multiDirectoryTarget}% target)`,
                recommendation: 'Maintain current multi-directory promotion strategies'
            });
        }
        
        // Feature adoption insights
        const coreFeatures = Array.from(this.featureDefinitions.entries())
            .filter(([id, feature]) => feature.category === 'core');
        
        const lowAdoptionFeatures = [];
        
        for (const [featureId, feature] of coreFeatures) {
            const usersWithFeature = users.filter(user => user.features.has(featureId));
            const adoptionRate = users.length > 0 ? (usersWithFeature.length / users.length) * 100 : 0;
            
            if (adoptionRate < 50) {
                lowAdoptionFeatures.push({ featureId, name: feature.name, adoptionRate });
            }
        }
        
        if (lowAdoptionFeatures.length > 0) {
            insights.push({
                type: 'low_feature_adoption',
                severity: 'high',
                message: `Core features have low adoption: ${lowAdoptionFeatures.map(f => f.name).join(', ')}`,
                recommendation: 'Improve onboarding and feature discoverability'
            });
        }
        
        // User engagement insights
        const powerUsers = users.filter(user => user.engagementLevel === 'power_user');
        const powerUserRate = users.length > 0 ? (powerUsers.length / users.length) * 100 : 0;
        
        if (powerUserRate < 10) {
            insights.push({
                type: 'low_power_users',
                severity: 'medium',
                message: `Only ${powerUserRate.toFixed(1)}% are power users`,
                recommendation: 'Add advanced features and engagement mechanisms for experienced users'
            });
        }
        
        return insights;
    }
    
    // Utility methods
    
    calculateProficiencyLevel(featureUsage) {
        const { usageCount, sessionsUsed } = featureUsage;
        
        if (usageCount >= 50 && sessionsUsed.size >= 10) {
            return 'expert';
        } else if (usageCount >= 20 && sessionsUsed.size >= 5) {
            return 'advanced';
        } else if (usageCount >= 5 && sessionsUsed.size >= 2) {
            return 'intermediate';
        } else {
            return 'beginner';
        }
    }
    
    calculateEngagementLevel(userData) {
        const { totalSessions, features, directories } = userData;
        const levels = this.config.engagementLevels;
        
        if (
            totalSessions >= levels.power_user.sessions &&
            features.size >= levels.power_user.features &&
            directories.size >= levels.power_user.directories
        ) {
            return 'power_user';
        } else if (
            totalSessions >= levels.regular_user.sessions &&
            features.size >= levels.regular_user.features &&
            directories.size >= levels.regular_user.directories
        ) {
            return 'regular_user';
        } else if (
            totalSessions >= levels.casual_user.sessions &&
            features.size >= levels.casual_user.features
        ) {
            return 'casual_user';
        } else {
            return 'new_user';
        }
    }
    
    calculateUsageScore(userData) {
        let score = 0;
        
        // Base score from sessions
        score += userData.totalSessions * 2;
        
        // Feature usage bonus
        for (const featureId of userData.features) {
            const feature = this.featureDefinitions.get(featureId);
            if (feature) {
                score += feature.weight * 5;
            }
        }
        
        // Directory usage bonus
        score += userData.directories.size * 3;
        
        // Multi-directory bonus
        if (userData.directories.size > 1) {
            score += 20;
        }
        
        return score;
    }
    
    createNewUserData(userId) {
        return {
            userId,
            firstUsed: Date.now(),
            lastUsed: Date.now(),
            totalSessions: 0,
            features: new Set(),
            directories: new Set(),
            featureUsage: new Map(),
            directoryUsage: new Map(),
            engagementLevel: 'new_user',
            usageScore: 0,
            preferences: new Map()
        };
    }
    
    getCurrentUserId() {
        // This would get the current user ID from the main analytics system
        return 'current_user'; // Placeholder
    }
    
    getTotalUsers() {
        return Math.max(1, this.usageData.users.size);
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    getEmptyFeatureMetrics() {
        return {
            multiDirectoryRate: 0,
            target: this.config.multiDirectoryTarget,
            achieved: false,
            totalActiveUsers: 0,
            multiDirectoryUsers: 0,
            featureAdoption: {},
            directoryPatterns: {
                singleDirectory: 0,
                multiDirectory: 0,
                powerUser: 0
            },
            userSegmentation: {
                segmentSizes: {
                    power_users: 0,
                    regular_users: 0,
                    casual_users: 0,
                    new_users: 0
                }
            },
            insights: []
        };
    }
    
    // Data persistence
    
    async saveUsageData() {
        try {
            // Convert Sets and Maps to JSON-serializable formats
            const usersData = {};
            for (const [userId, userData] of this.usageData.users.entries()) {
                usersData[userId] = {
                    ...userData,
                    features: Array.from(userData.features),
                    directories: Array.from(userData.directories),
                    featureUsage: Object.fromEntries(userData.featureUsage),
                    directoryUsage: Object.fromEntries(userData.directoryUsage || new Map()),
                    preferences: Object.fromEntries(userData.preferences || new Map())
                };
            }
            
            const directoryData = Object.fromEntries(this.usageData.directories);
            const sessionData = Object.fromEntries(this.usageData.sessions);
            const cohortData = Object.fromEntries(this.usageData.cohorts);
            
            await chrome.storage.local.set({
                featureUsageData: usersData,
                directoryUsageData: directoryData,
                sessionUsageData: sessionData,
                usageCohorts: cohortData
            });
            
        } catch (error) {
            console.error('Error saving usage data:', error);
        }
    }
    
    // Public API
    
    trackFormUsage(eventData) {
        this.trackFeatureUsage({
            eventName: 'form_filled',
            userId: eventData.userId,
            properties: {
                formUrl: eventData.formUrl,
                fieldsCount: eventData.fieldsCount,
                directory: eventData.directory,
                success: eventData.success
            }
        });
        
        if (eventData.directory) {
            this.trackDirectoryUsage({
                directoryId: eventData.directory,
                directoryName: eventData.directoryName || eventData.directory,
                userId: eventData.userId,
                action: 'form_filled'
            });
        }
    }
    
    getUserUsageProfile(userId) {
        const userData = this.usageData.users.get(userId);
        if (!userData) return null;
        
        return {
            userId,
            engagementLevel: userData.engagementLevel,
            usageScore: userData.usageScore,
            featuresUsed: userData.features.size,
            directoriesUsed: userData.directories.size,
            totalSessions: userData.totalSessions,
            isMultiDirectoryUser: userData.directories.size > 1,
            proficiency: this.calculateOverallProficiency(userData),
            recommendations: this.generateUserRecommendations(userData)
        };
    }
    
    calculateOverallProficiency(userData) {
        if (!userData.featureUsage || userData.featureUsage.size === 0) {
            return 'beginner';
        }
        
        const proficiencyLevels = Array.from(userData.featureUsage.values())
            .map(usage => usage.proficiencyLevel);
        
        const expertCount = proficiencyLevels.filter(level => level === 'expert').length;
        const advancedCount = proficiencyLevels.filter(level => level === 'advanced').length;
        
        const total = proficiencyLevels.length;
        
        if (expertCount / total >= 0.5) {
            return 'expert';
        } else if ((expertCount + advancedCount) / total >= 0.5) {
            return 'advanced';
        } else {
            return 'intermediate';
        }
    }
    
    generateUserRecommendations(userData) {
        const recommendations = [];
        
        // Multi-directory recommendation
        if (userData.directories.size === 1) {
            recommendations.push({
                type: 'feature',
                priority: 'medium',
                title: 'Try Multiple Directories',
                description: 'Explore other directories to fill forms faster on different websites',
                action: 'explore_directories'
            });
        }
        
        // Advanced features recommendation
        if (userData.engagementLevel === 'regular_user' || userData.engagementLevel === 'power_user') {
            const advancedFeatures = Array.from(this.featureDefinitions.entries())
                .filter(([id, feature]) => 
                    feature.category === 'advanced' && !userData.features.has(id)
                );
            
            if (advancedFeatures.length > 0) {
                recommendations.push({
                    type: 'feature',
                    priority: 'low',
                    title: 'Unlock Advanced Features',
                    description: `Try ${advancedFeatures[0][1].name} to boost your productivity`,
                    action: `try_${advancedFeatures[0][0]}`
                });
            }
        }
        
        return recommendations;
    }
    
    stop() {
        // End current session
        if (this.currentSession) {
            this.endSession();
        }
        
        // Clear session interval
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        
        // Save usage data
        if (this.isInitialized) {
            this.saveUsageData();
        }
        
        console.log('📊 Feature Usage Tracker stopped');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureUsageTracker;
} else {
    window.FeatureUsageTracker = FeatureUsageTracker;
}