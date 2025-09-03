/**
 * User Retention Tracker
 * Tracks user return patterns and retention metrics
 * Target: >60% retention rate
 */

class UserRetentionTracker {
    constructor() {
        this.config = {
            retentionPeriods: [1, 7, 30], // 1-day, 7-day, 30-day retention
            churnThreshold: 14,           // Days without activity = churned
            newUserPeriod: 7,            // Days to consider user "new"
            trackingWindow: 90           // Days of retention data to keep
        };
        
        this.users = new Map();
        this.cohorts = new Map();
        this.retentionData = {
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map()
        };
        
        this.isInitialized = false;
    }
    
    async init(currentUserId) {
        console.log('👥 Initializing User Retention Tracker...');
        
        try {
            this.currentUserId = currentUserId;
            
            // Load existing retention data
            await this.loadRetentionData();
            
            // Initialize current user if not exists
            await this.initializeCurrentUser();
            
            // Clean old data
            this.cleanupOldData();
            
            this.isInitialized = true;
            console.log('✅ User Retention Tracker initialized');
            
        } catch (error) {
            console.error('Error initializing User Retention Tracker:', error);
        }
    }
    
    async loadRetentionData() {
        try {
            const result = await chrome.storage.local.get([
                'userRetentionData',
                'userCohorts',
                'retentionMetrics'
            ]);
            
            // Load user data
            if (result.userRetentionData) {
                const userData = result.userRetentionData;
                for (const [userId, data] of Object.entries(userData)) {
                    this.users.set(userId, {
                        ...data,
                        visitDates: new Set(data.visitDates || []),
                        sessions: data.sessions || []
                    });
                }
            }
            
            // Load cohorts
            if (result.userCohorts) {
                const cohortData = result.userCohorts;
                for (const [cohortKey, data] of Object.entries(cohortData)) {
                    this.cohorts.set(cohortKey, data);
                }
            }
            
            // Load retention metrics
            if (result.retentionMetrics) {
                const metrics = result.retentionMetrics;
                this.retentionData = {
                    daily: new Map(Object.entries(metrics.daily || {})),
                    weekly: new Map(Object.entries(metrics.weekly || {})),
                    monthly: new Map(Object.entries(metrics.monthly || {}))
                };
            }
            
            console.log(`📊 Loaded retention data for ${this.users.size} users`);
            
        } catch (error) {
            console.error('Error loading retention data:', error);
        }
    }
    
    async initializeCurrentUser() {
        if (!this.users.has(this.currentUserId)) {
            // New user
            await this.registerNewUser(this.currentUserId);
        } else {
            // Existing user - record return
            await this.recordReturn(this.currentUserId);
        }
    }
    
    async registerNewUser(userId) {
        const now = Date.now();
        const today = this.getDateKey(now);
        
        const userData = {
            userId,
            registeredAt: now,
            firstVisit: now,
            lastVisit: now,
            visitDates: new Set([today]),
            totalVisits: 1,
            totalSessions: 1,
            sessions: [{
                startTime: now,
                date: today,
                isReturn: false
            }],
            status: 'active',
            cohort: this.getCohortKey(now),
            retentionStatus: {
                day1: false,
                day7: false,
                day30: false
            }
        };
        
        this.users.set(userId, userData);
        
        // Add to cohort
        await this.addToCohort(userData);
        
        // Save immediately for new users
        await this.saveRetentionData();
        
        console.log(`👤 Registered new user: ${userId}`);
    }
    
    async recordReturn(userId) {
        const user = this.users.get(userId);
        if (!user) {
            console.warn(`User ${userId} not found for return tracking`);
            return;
        }
        
        const now = Date.now();
        const today = this.getDateKey(now);
        const lastVisitDate = this.getDateKey(user.lastVisit);
        
        // Check if this is a new day visit
        if (today !== lastVisitDate) {
            const daysSinceRegistration = this.getDaysSince(user.registeredAt, now);
            const daysSinceLastVisit = this.getDaysSince(user.lastVisit, now);
            
            // Update user data
            user.lastVisit = now;
            user.visitDates.add(today);
            user.totalVisits++;
            
            // Record session
            user.sessions.push({
                startTime: now,
                date: today,
                isReturn: true,
                daysSinceLastVisit,
                daysSinceRegistration
            });
            
            // Update retention status
            this.updateRetentionStatus(user, daysSinceRegistration);
            
            // Update cohort data
            await this.updateCohortRetention(user, daysSinceRegistration);
            
            // Update daily metrics
            await this.updateDailyMetrics(today, userId, true);
            
            console.log(`🔄 User ${userId} returned after ${daysSinceLastVisit} days`);
        } else {
            // Same day return - just update session count
            user.totalSessions++;
        }
        
        // Always update last activity
        user.lastActivity = now;
        
        // Save updates
        await this.saveRetentionData();
    }
    
    updateRetentionStatus(user, daysSinceRegistration) {
        // Check retention milestones
        if (daysSinceRegistration >= 1 && !user.retentionStatus.day1) {
            user.retentionStatus.day1 = true;
            this.trackRetentionEvent(user.userId, 'day1_retained');
        }
        
        if (daysSinceRegistration >= 7 && !user.retentionStatus.day7) {
            user.retentionStatus.day7 = true;
            this.trackRetentionEvent(user.userId, 'day7_retained');
        }
        
        if (daysSinceRegistration >= 30 && !user.retentionStatus.day30) {
            user.retentionStatus.day30 = true;
            this.trackRetentionEvent(user.userId, 'day30_retained');
        }
    }
    
    async addToCohort(user) {
        const cohortKey = user.cohort;
        
        if (!this.cohorts.has(cohortKey)) {
            this.cohorts.set(cohortKey, {
                cohortKey,
                startDate: user.registeredAt,
                users: [],
                retention: {
                    day0: 0, // Registration day
                    day1: 0,
                    day7: 0,
                    day30: 0
                },
                size: 0
            });
        }
        
        const cohort = this.cohorts.get(cohortKey);
        cohort.users.push(user.userId);
        cohort.size++;
        cohort.retention.day0++; // All users are retained on day 0
        
        this.cohorts.set(cohortKey, cohort);
    }
    
    async updateCohortRetention(user, daysSinceRegistration) {
        const cohort = this.cohorts.get(user.cohort);
        if (!cohort) return;
        
        // Update cohort retention numbers
        if (daysSinceRegistration >= 1 && user.retentionStatus.day1) {
            cohort.retention.day1++;
        }
        
        if (daysSinceRegistration >= 7 && user.retentionStatus.day7) {
            cohort.retention.day7++;
        }
        
        if (daysSinceRegistration >= 30 && user.retentionStatus.day30) {
            cohort.retention.day30++;
        }
        
        this.cohorts.set(user.cohort, cohort);
    }
    
    async updateDailyMetrics(dateKey, userId, isReturn) {
        if (!this.retentionData.daily.has(dateKey)) {
            this.retentionData.daily.set(dateKey, {
                date: dateKey,
                totalUsers: 0,
                newUsers: 0,
                returningUsers: 0,
                retentionRate: 0
            });
        }
        
        const daily = this.retentionData.daily.get(dateKey);
        daily.totalUsers++;
        
        if (isReturn) {
            daily.returningUsers++;
        } else {
            daily.newUsers++;
        }
        
        // Calculate retention rate for the day
        if (daily.totalUsers > 0) {
            daily.retentionRate = (daily.returningUsers / daily.totalUsers) * 100;
        }
        
        this.retentionData.daily.set(dateKey, daily);
    }
    
    getCohortKey(timestamp) {
        const date = new Date(timestamp);
        // Weekly cohorts (start of week)
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        return this.getDateKey(weekStart.getTime());
    }
    
    getDateKey(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    getDaysSince(fromTimestamp, toTimestamp) {
        return Math.floor((toTimestamp - fromTimestamp) / (1000 * 60 * 60 * 24));
    }
    
    trackRetentionEvent(userId, eventType) {
        // Dispatch event for main analytics system
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('autoBoltRetentionEvent', {
                detail: {
                    userId,
                    eventType,
                    timestamp: Date.now()
                }
            }));
        }
    }
    
    // Analysis methods
    
    async getRetentionMetrics(timeRange = '30d') {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        // Get users registered in the time range
        const cohortUsers = Array.from(this.users.values())
            .filter(user => user.registeredAt >= since);
        
        if (cohortUsers.length === 0) {
            return this.getEmptyRetentionMetrics();
        }
        
        // Calculate retention rates
        const metrics = {
            totalUsers: this.users.size,
            newUsers: cohortUsers.length,
            retentionRates: this.calculateRetentionRates(cohortUsers),
            churnAnalysis: this.analyzeChurn(timeRange),
            cohortAnalysis: this.analyzeCohorts(timeRange),
            userSegmentation: this.segmentUsers(timeRange),
            timeRange,
            calculatedAt: now
        };
        
        // Calculate primary retention rate (7-day retention for the target)
        metrics.retentionRate = metrics.retentionRates.day7;
        
        return metrics;
    }
    
    calculateRetentionRates(users) {
        const now = Date.now();
        const rates = {};
        
        for (const period of this.config.retentionPeriods) {
            const eligibleUsers = users.filter(user => {
                const daysSinceRegistration = this.getDaysSince(user.registeredAt, now);
                return daysSinceRegistration >= period;
            });
            
            if (eligibleUsers.length === 0) {
                rates[`day${period}`] = 0;
                continue;
            }
            
            let retainedCount = 0;
            
            for (const user of eligibleUsers) {
                const daysSinceRegistration = this.getDaysSince(user.registeredAt, now);
                
                // Check if user has visited within the retention period
                const hasRecentActivity = daysSinceRegistration >= period && 
                    Array.from(user.visitDates).some(dateStr => {
                        const visitTime = new Date(dateStr).getTime();
                        const daysFromRegistration = this.getDaysSince(user.registeredAt, visitTime);
                        return daysFromRegistration >= period;
                    });
                
                if (hasRecentActivity) {
                    retainedCount++;
                }
            }
            
            rates[`day${period}`] = (retainedCount / eligibleUsers.length) * 100;
        }
        
        return rates;
    }
    
    analyzeChurn(timeRange) {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        const churnThresholdMs = this.config.churnThreshold * 24 * 60 * 60 * 1000;
        const churnedUsers = [];
        const activeUsers = [];
        const atRiskUsers = [];
        
        for (const user of this.users.values()) {
            const daysSinceLastVisit = this.getDaysSince(user.lastVisit, now);
            
            if (daysSinceLastVisit >= this.config.churnThreshold) {
                churnedUsers.push({
                    userId: user.userId,
                    daysSinceLastVisit,
                    totalVisits: user.totalVisits,
                    registeredAt: user.registeredAt
                });
            } else if (daysSinceLastVisit >= 7) {
                atRiskUsers.push({
                    userId: user.userId,
                    daysSinceLastVisit,
                    riskLevel: daysSinceLastVisit >= 10 ? 'high' : 'medium'
                });
            } else {
                activeUsers.push(user.userId);
            }
        }
        
        const totalUsers = this.users.size;
        
        return {
            churnRate: totalUsers > 0 ? (churnedUsers.length / totalUsers) * 100 : 0,
            activeUsers: activeUsers.length,
            churnedUsers: churnedUsers.length,
            atRiskUsers: atRiskUsers.length,
            churnedDetails: churnedUsers,
            atRiskDetails: atRiskUsers,
            churnReasons: this.identifyChurnReasons(churnedUsers)
        };
    }
    
    identifyChurnReasons(churnedUsers) {
        const reasons = {
            earlyChurn: 0,      // Churned within 3 days
            lowEngagement: 0,   // Few visits before churning
            technicalIssues: 0  // High errors before churning
        };
        
        for (const user of churnedUsers) {
            const userObj = this.users.get(user.userId);
            if (!userObj) continue;
            
            const daysSinceRegistration = this.getDaysSince(userObj.registeredAt, Date.now());
            
            // Early churn
            if (daysSinceRegistration <= 3) {
                reasons.earlyChurn++;
            }
            
            // Low engagement
            if (userObj.totalVisits <= 3) {
                reasons.lowEngagement++;
            }
            
            // Technical issues would need error tracking integration
            // This is a placeholder for that analysis
        }
        
        return reasons;
    }
    
    analyzeCohorts(timeRange) {
        const rangeMs = this.parseTimeRange(timeRange);
        const since = Date.now() - rangeMs;
        
        const relevantCohorts = Array.from(this.cohorts.values())
            .filter(cohort => cohort.startDate >= since)
            .sort((a, b) => a.startDate - b.startDate);
        
        return relevantCohorts.map(cohort => ({
            cohortKey: cohort.cohortKey,
            startDate: cohort.startDate,
            size: cohort.size,
            retentionRates: {
                day1: cohort.size > 0 ? (cohort.retention.day1 / cohort.size) * 100 : 0,
                day7: cohort.size > 0 ? (cohort.retention.day7 / cohort.size) * 100 : 0,
                day30: cohort.size > 0 ? (cohort.retention.day30 / cohort.size) * 100 : 0
            },
            retention: cohort.retention
        }));
    }
    
    segmentUsers(timeRange) {
        const now = Date.now();
        const segments = {
            newUsers: [],       // Registered in last 7 days
            activeUsers: [],    // Visited in last 7 days
            returningUsers: [], // Multiple visits
            powerUsers: [],     // High engagement
            atRiskUsers: []     // Haven't visited recently
        };
        
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        for (const user of this.users.values()) {
            const daysSinceRegistration = this.getDaysSince(user.registeredAt, now);
            const daysSinceLastVisit = this.getDaysSince(user.lastVisit, now);
            
            // New users
            if (daysSinceRegistration <= 7) {
                segments.newUsers.push(user.userId);
            }
            
            // Active users
            if (daysSinceLastVisit <= 7) {
                segments.activeUsers.push(user.userId);
            }
            
            // Returning users
            if (user.totalVisits > 1) {
                segments.returningUsers.push(user.userId);
            }
            
            // Power users (high engagement)
            if (user.totalVisits >= 10 && user.visitDates.size >= 7) {
                segments.powerUsers.push(user.userId);
            }
            
            // At risk users
            if (daysSinceLastVisit >= 7 && daysSinceLastVisit < this.config.churnThreshold) {
                segments.atRiskUsers.push(user.userId);
            }
        }
        
        return {
            ...segments,
            segmentSizes: {
                newUsers: segments.newUsers.length,
                activeUsers: segments.activeUsers.length,
                returningUsers: segments.returningUsers.length,
                powerUsers: segments.powerUsers.length,
                atRiskUsers: segments.atRiskUsers.length
            }
        };
    }
    
    getDaysSinceLastVisit(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        return this.getDaysSince(user.lastVisit, Date.now());
    }
    
    getUserRetentionStatus(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        const now = Date.now();
        const daysSinceRegistration = this.getDaysSince(user.registeredAt, now);
        const daysSinceLastVisit = this.getDaysSince(user.lastVisit, now);
        
        let status = 'active';
        
        if (daysSinceLastVisit >= this.config.churnThreshold) {
            status = 'churned';
        } else if (daysSinceLastVisit >= 7) {
            status = 'at_risk';
        } else if (daysSinceRegistration <= this.config.newUserPeriod) {
            status = 'new';
        }
        
        return {
            userId,
            status,
            daysSinceRegistration,
            daysSinceLastVisit,
            totalVisits: user.totalVisits,
            visitDates: user.visitDates.size,
            retentionMilestones: user.retentionStatus
        };
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    getEmptyRetentionMetrics() {
        return {
            totalUsers: 0,
            newUsers: 0,
            retentionRate: 0,
            retentionRates: {
                day1: 0,
                day7: 0,
                day30: 0
            },
            churnAnalysis: {
                churnRate: 0,
                activeUsers: 0,
                churnedUsers: 0,
                atRiskUsers: 0
            },
            cohortAnalysis: [],
            userSegmentation: {
                segmentSizes: {
                    newUsers: 0,
                    activeUsers: 0,
                    returningUsers: 0,
                    powerUsers: 0,
                    atRiskUsers: 0
                }
            }
        };
    }
    
    // Data persistence
    
    async saveRetentionData() {
        try {
            // Convert Sets to Arrays for storage
            const usersData = {};
            for (const [userId, user] of this.users.entries()) {
                usersData[userId] = {
                    ...user,
                    visitDates: Array.from(user.visitDates)
                };
            }
            
            const cohortsData = Object.fromEntries(this.cohorts);
            
            const retentionMetrics = {
                daily: Object.fromEntries(this.retentionData.daily),
                weekly: Object.fromEntries(this.retentionData.weekly),
                monthly: Object.fromEntries(this.retentionData.monthly)
            };
            
            await chrome.storage.local.set({
                userRetentionData: usersData,
                userCohorts: cohortsData,
                retentionMetrics: retentionMetrics
            });
            
        } catch (error) {
            console.error('Error saving retention data:', error);
        }
    }
    
    cleanupOldData() {
        const cutoff = Date.now() - (this.config.trackingWindow * 24 * 60 * 60 * 1000);
        
        // Clean old daily metrics
        for (const [dateKey, data] of this.retentionData.daily.entries()) {
            const date = new Date(dateKey).getTime();
            if (date < cutoff) {
                this.retentionData.daily.delete(dateKey);
            }
        }
        
        // Clean old cohorts
        for (const [cohortKey, cohort] of this.cohorts.entries()) {
            if (cohort.startDate < cutoff) {
                this.cohorts.delete(cohortKey);
            }
        }
        
        console.log('🧹 Cleaned up old retention data');
    }
    
    // Public API
    
    isUserRetained(userId, period = 7) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        const daysSinceRegistration = this.getDaysSince(user.registeredAt, Date.now());
        const daysSinceLastVisit = this.getDaysSince(user.lastVisit, Date.now());
        
        return daysSinceRegistration >= period && daysSinceLastVisit < this.config.churnThreshold;
    }
    
    getRetentionInsights() {
        const insights = [];
        
        // Analyze retention patterns
        const recentMetrics = Array.from(this.retentionData.daily.values())
            .filter(data => Date.now() - new Date(data.date).getTime() < 30 * 24 * 60 * 60 * 1000)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (recentMetrics.length > 7) {
            const avgRetention = recentMetrics.slice(0, 7).reduce((sum, data) => sum + data.retentionRate, 0) / 7;
            
            if (avgRetention < 40) {
                insights.push({
                    type: 'low_retention',
                    severity: 'high',
                    message: `Average retention rate (${avgRetention.toFixed(1)}%) is critically low`,
                    recommendation: 'Urgent: Review onboarding experience and identify friction points'
                });
            } else if (avgRetention < 60) {
                insights.push({
                    type: 'below_target_retention',
                    severity: 'medium',
                    message: `Retention rate (${avgRetention.toFixed(1)}%) is below 60% target`,
                    recommendation: 'Improve user experience and engagement features'
                });
            } else {
                insights.push({
                    type: 'good_retention',
                    severity: 'info',
                    message: `Retention rate (${avgRetention.toFixed(1)}%) meets target`,
                    recommendation: 'Maintain current strategies and optimize further'
                });
            }
        }
        
        return insights;
    }
    
    stop() {
        // Save any pending data
        if (this.isInitialized) {
            this.saveRetentionData();
        }
        
        console.log('👥 User Retention Tracker stopped');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserRetentionTracker;
} else {
    window.UserRetentionTracker = UserRetentionTracker;
}