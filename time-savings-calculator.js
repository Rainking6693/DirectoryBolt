/**
 * Time Savings Calculator
 * Calculates and tracks time saved through AutoBolt usage
 * Target: 2+ hours saved per user
 */

class TimeSavingsCalculator {
    constructor() {
        this.config = {
            targetSavingsMinutes: 120,    // 2+ hours per user target
            timingEstimates: {
                // Time estimates in milliseconds for manual operations
                fieldTyping: 3000,         // 3 seconds per field manually
                fieldSelection: 1000,      // 1 second to select/click field
                dataLookup: 5000,          // 5 seconds to look up data
                formNavigation: 2000,      // 2 seconds to navigate form
                contextSwitching: 4000,    // 4 seconds to switch between apps/tabs
                errorCorrection: 8000,     // 8 seconds to correct typing errors
                verification: 2000,        // 2 seconds to verify field data
                submission: 3000           // 3 seconds to submit form
            },
            complexityFactors: {
                // Multipliers based on form complexity
                simple: 1.0,      // 1-5 fields
                medium: 1.2,      // 6-15 fields
                complex: 1.5,     // 16-30 fields
                enterprise: 2.0   // 30+ fields
            },
            efficiencyFactors: {
                // AutoBolt efficiency vs manual
                fieldFilling: 0.85,       // 85% time reduction
                dataRetrieval: 0.95,      // 95% time reduction (instant lookup)
                navigation: 0.7,          // 70% time reduction
                errorRate: 0.1,           // 10% of manual error rate
                verification: 0.3         // 30% of manual verification time
            },
            trackingWindow: 90           // Days to track savings data
        };
        
        this.savingsData = {
            users: new Map(),           // Per-user savings data
            sessions: new Map(),        // Session-based savings
            forms: new Map(),          // Form-specific savings
            aggregate: {               // Aggregate savings metrics
                totalTimeSaved: 0,
                totalFormsSaved: 0,
                avgSavingsPerUser: 0,
                avgSavingsPerForm: 0
            }
        };
        
        this.currentUserId = null;
        this.isInitialized = false;
    }
    
    async init(userId) {
        console.log('⏱️ Initializing Time Savings Calculator...');
        
        try {
            this.currentUserId = userId;
            
            // Load existing savings data
            await this.loadSavingsData();
            
            // Initialize user if not exists
            await this.initializeUser(userId);
            
            // Calculate aggregate metrics
            this.calculateAggregateMetrics();
            
            this.isInitialized = true;
            console.log('✅ Time Savings Calculator initialized');
            
        } catch (error) {
            console.error('Error initializing Time Savings Calculator:', error);
        }
    }
    
    async loadSavingsData() {
        try {
            const result = await chrome.storage.local.get([
                'timeSavingsData',
                'savingsMetrics',
                'formTimings'
            ]);
            
            if (result.timeSavingsData) {
                const savingsData = result.timeSavingsData;
                for (const [userId, data] of Object.entries(savingsData)) {
                    this.savingsData.users.set(userId, data);
                }
            }
            
            if (result.savingsMetrics) {
                this.savingsData.aggregate = result.savingsMetrics;
            }
            
            if (result.formTimings) {
                const formData = result.formTimings;
                for (const [formId, data] of Object.entries(formData)) {
                    this.savingsData.forms.set(formId, data);
                }
            }
            
            console.log(`⏱️ Loaded savings data for ${this.savingsData.users.size} users`);
            
        } catch (error) {
            console.error('Error loading savings data:', error);
        }
    }
    
    async initializeUser(userId) {
        if (!this.savingsData.users.has(userId)) {
            this.savingsData.users.set(userId, {
                userId,
                totalTimeSaved: 0,        // Total milliseconds saved
                totalFormsSaved: 0,       // Number of forms processed
                avgSavingsPerForm: 0,     // Average savings per form
                bestSavings: 0,           // Highest single form savings
                savingsHistory: [],       // Historical savings data
                dailySavings: new Map(),  // Savings per day
                monthlySavings: new Map(), // Savings per month
                efficiencyScore: 0,       // User efficiency score
                lastUpdated: Date.now(),
                milestones: {
                    thirtyMinutes: false,
                    oneHour: false,
                    twoHours: false,
                    fiveHours: false,
                    tenHours: false
                }
            });
            
            console.log(`👤 Initialized time savings for user: ${userId}`);
        }
    }
    
    calculateAggregateMetrics() {
        let totalTimeSaved = 0;
        let totalFormsSaved = 0;
        
        for (const userData of this.savingsData.users.values()) {
            totalTimeSaved += userData.totalTimeSaved;
            totalFormsSaved += userData.totalFormsSaved;
        }
        
        const userCount = this.savingsData.users.size;
        
        this.savingsData.aggregate = {
            totalTimeSaved,
            totalFormsSaved,
            avgSavingsPerUser: userCount > 0 ? totalTimeSaved / userCount : 0,
            avgSavingsPerForm: totalFormsSaved > 0 ? totalTimeSaved / totalFormsSaved : 0,
            totalUsers: userCount,
            lastCalculated: Date.now()
        };
    }
    
    // Core time savings calculation methods
    
    calculateFormSavings(formData) {
        const {
            fieldsCount,
            complexity,
            actualDuration,
            hasErrors,
            dataLookupCount = 0,
            navigationSteps = 0,
            verificationsRequired = 0
        } = formData;
        
        // Calculate estimated manual time
        const manualTime = this.estimateManualTime({
            fieldsCount,
            complexity,
            dataLookupCount,
            navigationSteps,
            verificationsRequired,
            hasErrors
        });
        
        // Calculate AutoBolt time (actual duration with efficiency factors)
        const autoBoltTime = this.estimateAutoBoltTime({
            actualDuration,
            fieldsCount,
            complexity
        });
        
        // Calculate time saved
        const timeSaved = Math.max(0, manualTime - autoBoltTime);
        
        // Calculate efficiency percentage
        const efficiency = manualTime > 0 ? ((timeSaved / manualTime) * 100) : 0;
        
        return {
            manualTime,
            autoBoltTime,
            timeSaved,
            efficiency,
            savings: {
                minutes: timeSaved / 60000,
                seconds: timeSaved / 1000,
                hours: timeSaved / 3600000
            },
            breakdown: this.calculateSavingsBreakdown(formData, manualTime, autoBoltTime)
        };
    }
    
    estimateManualTime(params) {
        const {
            fieldsCount,
            complexity = 'medium',
            dataLookupCount = 0,
            navigationSteps = 0,
            verificationsRequired = 0,
            hasErrors = false
        } = params;
        
        const timings = this.config.timingEstimates;
        const complexityFactor = this.config.complexityFactors[complexity];
        
        let totalTime = 0;
        
        // Field filling time
        totalTime += fieldsCount * (timings.fieldTyping + timings.fieldSelection);
        
        // Data lookup time
        totalTime += dataLookupCount * timings.dataLookup;
        
        // Form navigation time
        totalTime += navigationSteps * timings.formNavigation;
        
        // Context switching (estimated 2 switches per form)
        totalTime += 2 * timings.contextSwitching;
        
        // Verification time
        totalTime += verificationsRequired * timings.verification;
        
        // Error correction time (assume 10% of fields have errors)
        if (hasErrors || fieldsCount > 10) {
            const errorFields = Math.max(1, Math.floor(fieldsCount * 0.1));
            totalTime += errorFields * timings.errorCorrection;
        }
        
        // Form submission time
        totalTime += timings.submission;
        
        // Apply complexity factor
        totalTime *= complexityFactor;
        
        return totalTime;
    }
    
    estimateAutoBoltTime(params) {
        const { actualDuration, fieldsCount, complexity = 'medium' } = params;
        
        // If we have actual duration, use it as base
        if (actualDuration > 0) {
            return actualDuration;
        }
        
        // Otherwise estimate based on AutoBolt efficiency
        const efficiency = this.config.efficiencyFactors.fieldFilling;
        const baseFillTime = fieldsCount * 500; // 500ms per field with AutoBolt
        const complexityFactor = this.config.complexityFactors[complexity];
        
        return baseFillTime * complexityFactor * efficiency;
    }
    
    calculateSavingsBreakdown(formData, manualTime, autoBoltTime) {
        const { fieldsCount, dataLookupCount = 0 } = formData;
        const timings = this.config.timingEstimates;
        const efficiency = this.config.efficiencyFactors;
        
        const breakdown = {
            fieldFilling: {
                manual: fieldsCount * timings.fieldTyping,
                autoBolt: fieldsCount * (timings.fieldTyping * (1 - efficiency.fieldFilling)),
                saved: 0
            },
            dataLookup: {
                manual: dataLookupCount * timings.dataLookup,
                autoBolt: dataLookupCount * (timings.dataLookup * (1 - efficiency.dataRetrieval)),
                saved: 0
            },
            navigation: {
                manual: 2 * timings.formNavigation,
                autoBolt: 2 * (timings.formNavigation * (1 - efficiency.navigation)),
                saved: 0
            },
            errorCorrection: {
                manual: Math.floor(fieldsCount * 0.1) * timings.errorCorrection,
                autoBolt: Math.floor(fieldsCount * 0.1) * timings.errorCorrection * efficiency.errorRate,
                saved: 0
            }
        };
        
        // Calculate saved time for each category
        for (const category of Object.keys(breakdown)) {
            const item = breakdown[category];
            item.saved = Math.max(0, item.manual - item.autoBolt);
        }
        
        return breakdown;
    }
    
    // Tracking methods
    
    trackFormEvent(eventData) {
        const { eventName, userId, properties } = eventData;
        
        // Only track completion events that represent actual savings
        if (!['form_completed', 'form_filled', 'auto_fill_complete'].includes(eventName)) {
            return;
        }
        
        if (!properties || !properties.fieldsCount) {
            console.warn('Insufficient form data for time savings calculation');
            return;
        }
        
        const formSavings = this.calculateFormSavings({
            fieldsCount: properties.fieldsCount,
            complexity: this.determineComplexity(properties.fieldsCount),
            actualDuration: properties.duration || 0,
            hasErrors: properties.hasErrors || false,
            dataLookupCount: properties.dataLookupCount || Math.ceil(properties.fieldsCount * 0.3),
            navigationSteps: Math.max(1, Math.floor(properties.fieldsCount / 5)),
            verificationsRequired: properties.verificationsRequired || Math.floor(properties.fieldsCount * 0.1)
        });
        
        // Add time savings to user account
        this.addTimeSaved(userId || this.currentUserId, formSavings.timeSaved, {
            formUrl: properties.formUrl,
            directory: properties.directory,
            fieldsCount: properties.fieldsCount,
            duration: properties.duration,
            timestamp: Date.now(),
            savingsBreakdown: formSavings
        });
        
        console.log(`⏱️ Time saved: ${formSavings.savings.minutes.toFixed(1)} minutes on ${properties.fieldsCount} field form`);
    }
    
    addTimeSaved(userId, timeSavedMs, formDetails) {
        const userData = this.savingsData.users.get(userId) || this.createNewUserData(userId);
        
        // Update user totals
        userData.totalTimeSaved += timeSavedMs;
        userData.totalFormsSaved++;
        userData.avgSavingsPerForm = userData.totalTimeSaved / userData.totalFormsSaved;
        userData.lastUpdated = Date.now();
        
        // Track best savings
        if (timeSavedMs > userData.bestSavings) {
            userData.bestSavings = timeSavedMs;
        }
        
        // Add to history
        userData.savingsHistory.push({
            timestamp: formDetails.timestamp,
            timeSaved: timeSavedMs,
            formUrl: formDetails.formUrl,
            directory: formDetails.directory,
            fieldsCount: formDetails.fieldsCount,
            duration: formDetails.duration,
            savings: formDetails.savingsBreakdown.savings
        });
        
        // Keep only recent history (last 100 entries)
        if (userData.savingsHistory.length > 100) {
            userData.savingsHistory.shift();
        }
        
        // Update daily/monthly tracking
        this.updatePeriodSavings(userData, timeSavedMs, formDetails.timestamp);
        
        // Check for milestones
        this.checkMilestones(userData);
        
        // Update efficiency score
        userData.efficiencyScore = this.calculateEfficiencyScore(userData);
        
        this.savingsData.users.set(userId, userData);
        
        // Update aggregate metrics
        this.calculateAggregateMetrics();
        
        // Store form-specific data
        if (formDetails.formUrl) {
            this.storeFormSavings(formDetails);
        }
    }
    
    updatePeriodSavings(userData, timeSavedMs, timestamp) {
        const date = new Date(timestamp);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Update daily savings
        const dailySaved = userData.dailySavings.get(dayKey) || 0;
        userData.dailySavings.set(dayKey, dailySaved + timeSavedMs);
        
        // Update monthly savings
        const monthlySaved = userData.monthlySavings.get(monthKey) || 0;
        userData.monthlySavings.set(monthKey, monthlySaved + timeSavedMs);
        
        // Clean up old data
        this.cleanupOldPeriodData(userData);
    }
    
    cleanupOldPeriodData(userData) {
        const cutoff = Date.now() - (this.config.trackingWindow * 24 * 60 * 60 * 1000);
        const cutoffDate = new Date(cutoff);
        
        // Clean daily data
        for (const [dayKey] of userData.dailySavings.entries()) {
            const dayDate = new Date(dayKey);
            if (dayDate < cutoffDate) {
                userData.dailySavings.delete(dayKey);
            }
        }
        
        // Clean monthly data (keep more months)
        const monthCutoff = new Date(cutoff - (180 * 24 * 60 * 60 * 1000)); // 6 months
        for (const [monthKey] of userData.monthlySavings.entries()) {
            const monthDate = new Date(`${monthKey}-01`);
            if (monthDate < monthCutoff) {
                userData.monthlySavings.delete(monthKey);
            }
        }
    }
    
    checkMilestones(userData) {
        const totalMinutes = userData.totalTimeSaved / 60000;
        const milestones = userData.milestones;
        
        if (totalMinutes >= 30 && !milestones.thirtyMinutes) {
            milestones.thirtyMinutes = true;
            this.dispatchMilestoneEvent(userData.userId, '30_minutes', totalMinutes);
        }
        
        if (totalMinutes >= 60 && !milestones.oneHour) {
            milestones.oneHour = true;
            this.dispatchMilestoneEvent(userData.userId, '1_hour', totalMinutes);
        }
        
        if (totalMinutes >= 120 && !milestones.twoHours) {
            milestones.twoHours = true;
            this.dispatchMilestoneEvent(userData.userId, '2_hours', totalMinutes);
        }
        
        if (totalMinutes >= 300 && !milestones.fiveHours) {
            milestones.fiveHours = true;
            this.dispatchMilestoneEvent(userData.userId, '5_hours', totalMinutes);
        }
        
        if (totalMinutes >= 600 && !milestones.tenHours) {
            milestones.tenHours = true;
            this.dispatchMilestoneEvent(userData.userId, '10_hours', totalMinutes);
        }
    }
    
    dispatchMilestoneEvent(userId, milestone, totalMinutes) {
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('autoBoltTimeSavingsMilestone', {
                detail: {
                    userId,
                    milestone,
                    totalMinutes,
                    totalHours: totalMinutes / 60,
                    timestamp: Date.now()
                }
            }));
        }
        
        console.log(`🎉 Time savings milestone reached: ${milestone} (total: ${totalMinutes.toFixed(1)} minutes)`);
    }
    
    calculateEfficiencyScore(userData) {
        if (userData.totalFormsSaved === 0) return 0;
        
        const avgSavingsMinutes = userData.avgSavingsPerForm / 60000;
        const formCount = userData.totalFormsSaved;
        const consistency = this.calculateConsistency(userData);
        
        // Base score from average savings (0-50 points)
        const avgScore = Math.min(50, avgSavingsMinutes * 10);
        
        // Volume bonus (0-25 points)
        const volumeScore = Math.min(25, formCount * 0.5);
        
        // Consistency bonus (0-25 points)
        const consistencyScore = consistency * 25;
        
        return Math.round(avgScore + volumeScore + consistencyScore);
    }
    
    calculateConsistency(userData) {
        if (userData.savingsHistory.length < 5) return 0.5;
        
        const recentSavings = userData.savingsHistory.slice(-10);
        const avgSavings = recentSavings.reduce((sum, entry) => sum + entry.timeSaved, 0) / recentSavings.length;
        
        // Calculate variance
        const variance = recentSavings.reduce((sum, entry) => {
            const diff = entry.timeSaved - avgSavings;
            return sum + (diff * diff);
        }, 0) / recentSavings.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = avgSavings > 0 ? standardDeviation / avgSavings : 1;
        
        // Lower coefficient of variation = higher consistency
        return Math.max(0, 1 - coefficientOfVariation);
    }
    
    storeFormSavings(formDetails) {
        const formId = this.generateFormId(formDetails.formUrl);
        
        if (!this.savingsData.forms.has(formId)) {
            this.savingsData.forms.set(formId, {
                formId,
                formUrl: formDetails.formUrl,
                directory: formDetails.directory,
                totalSavings: 0,
                totalUses: 0,
                avgSavings: 0,
                avgFieldsCount: 0,
                bestSavings: 0,
                lastUsed: Date.now(),
                savingsHistory: []
            });
        }
        
        const formData = this.savingsData.forms.get(formId);
        formData.totalSavings += formDetails.savingsBreakdown.timeSaved;
        formData.totalUses++;
        formData.avgSavings = formData.totalSavings / formData.totalUses;
        formData.avgFieldsCount = ((formData.avgFieldsCount * (formData.totalUses - 1)) + formDetails.fieldsCount) / formData.totalUses;
        formData.lastUsed = formDetails.timestamp;
        
        if (formDetails.savingsBreakdown.timeSaved > formData.bestSavings) {
            formData.bestSavings = formDetails.savingsBreakdown.timeSaved;
        }
        
        formData.savingsHistory.push({
            timestamp: formDetails.timestamp,
            timeSaved: formDetails.savingsBreakdown.timeSaved,
            fieldsCount: formDetails.fieldsCount
        });
        
        // Keep only recent history
        if (formData.savingsHistory.length > 20) {
            formData.savingsHistory.shift();
        }
        
        this.savingsData.forms.set(formId, formData);
    }
    
    // Analysis methods
    
    async getTimeSavingsMetrics(timeRange = '30d') {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        // Filter users with activity in time range
        const activeUsers = Array.from(this.savingsData.users.values())
            .filter(user => user.lastUpdated >= since);
        
        if (activeUsers.length === 0) {
            return this.getEmptyTimeSavingsMetrics();
        }
        
        // Calculate metrics
        const totalTimeSaved = activeUsers.reduce((sum, user) => sum + user.totalTimeSaved, 0);
        const totalForms = activeUsers.reduce((sum, user) => sum + user.totalFormsSaved, 0);
        const averagePerUser = totalTimeSaved / activeUsers.length;
        const averagePerForm = totalForms > 0 ? totalTimeSaved / totalForms : 0;
        
        // Convert to minutes for target comparison
        const averagePerUserMinutes = averagePerUser / 60000;
        
        // User distribution analysis
        const userDistribution = this.analyzeUserDistribution(activeUsers);
        
        // Top performers
        const topPerformers = this.getTopPerformers(activeUsers);
        
        // Trend analysis
        const trends = this.analyzeSavingsTrends(activeUsers, timeRange);
        
        // Form efficiency analysis
        const formEfficiency = this.analyzeFormEfficiency(timeRange);
        
        return {
            averagePerUser: averagePerUserMinutes,
            target: this.config.targetSavingsMinutes,
            achieved: averagePerUserMinutes >= this.config.targetSavingsMinutes,
            totalUsers: activeUsers.length,
            totalTimeSaved: {
                milliseconds: totalTimeSaved,
                seconds: totalTimeSaved / 1000,
                minutes: totalTimeSaved / 60000,
                hours: totalTimeSaved / 3600000
            },
            totalForms,
            averagePerForm: {
                milliseconds: averagePerForm,
                minutes: averagePerForm / 60000
            },
            userDistribution,
            topPerformers,
            trends,
            formEfficiency,
            milestoneAchievements: this.getMilestoneAchievements(activeUsers),
            projectedSavings: this.projectFutureSavings(activeUsers),
            timeRange,
            calculatedAt: now
        };
    }
    
    analyzeUserDistribution(users) {
        const distribution = {
            underOneHour: 0,
            oneToTwoHours: 0,
            twoToFiveHours: 0,
            overFiveHours: 0
        };
        
        const efficiencyDistribution = {
            low: 0,      // 0-30 score
            medium: 0,   // 31-60 score
            high: 0,     // 61-80 score
            expert: 0    // 81-100 score
        };
        
        for (const user of users) {
            const hours = user.totalTimeSaved / 3600000;
            
            if (hours < 1) {
                distribution.underOneHour++;
            } else if (hours < 2) {
                distribution.oneToTwoHours++;
            } else if (hours < 5) {
                distribution.twoToFiveHours++;
            } else {
                distribution.overFiveHours++;
            }
            
            // Efficiency distribution
            const score = user.efficiencyScore;
            if (score <= 30) {
                efficiencyDistribution.low++;
            } else if (score <= 60) {
                efficiencyDistribution.medium++;
            } else if (score <= 80) {
                efficiencyDistribution.high++;
            } else {
                efficiencyDistribution.expert++;
            }
        }
        
        return {
            timeSaved: distribution,
            efficiency: efficiencyDistribution
        };
    }
    
    getTopPerformers(users) {
        return users
            .sort((a, b) => b.totalTimeSaved - a.totalTimeSaved)
            .slice(0, 10)
            .map(user => ({
                userId: user.userId,
                totalTimeSaved: {
                    hours: user.totalTimeSaved / 3600000,
                    minutes: user.totalTimeSaved / 60000
                },
                formsProcessed: user.totalFormsSaved,
                efficiencyScore: user.efficiencyScore,
                avgSavingsPerForm: user.avgSavingsPerForm / 60000 // in minutes
            }));
    }
    
    analyzeSavingsTrends(users, timeRange) {
        // This would analyze trends over time
        // For now, return basic trend data
        const totalCurrentSavings = users.reduce((sum, user) => sum + user.totalTimeSaved, 0);
        
        return {
            trend: 'increasing', // Would calculate actual trend
            weeklyGrowth: 0,     // Would calculate weekly growth rate
            monthlyGrowth: 0,    // Would calculate monthly growth rate
            projectedTotal: totalCurrentSavings * 1.1 // Simple 10% growth projection
        };
    }
    
    analyzeFormEfficiency(timeRange) {
        const formData = Array.from(this.savingsData.forms.values())
            .filter(form => form.lastUsed >= Date.now() - this.parseTimeRange(timeRange));
        
        if (formData.length === 0) {
            return {
                totalForms: 0,
                avgSavingsPerForm: 0,
                mostEfficientForms: [],
                leastEfficientForms: []
            };
        }
        
        const avgSavings = formData.reduce((sum, form) => sum + form.avgSavings, 0) / formData.length;
        
        const mostEfficient = formData
            .sort((a, b) => b.avgSavings - a.avgSavings)
            .slice(0, 5)
            .map(form => ({
                formUrl: form.formUrl,
                directory: form.directory,
                avgSavings: form.avgSavings / 60000, // minutes
                totalUses: form.totalUses
            }));
        
        const leastEfficient = formData
            .sort((a, b) => a.avgSavings - b.avgSavings)
            .slice(0, 5)
            .map(form => ({
                formUrl: form.formUrl,
                directory: form.directory,
                avgSavings: form.avgSavings / 60000, // minutes
                totalUses: form.totalUses
            }));
        
        return {
            totalForms: formData.length,
            avgSavingsPerForm: avgSavings / 60000, // minutes
            mostEfficientForms: mostEfficient,
            leastEfficientForms: leastEfficient
        };
    }
    
    getMilestoneAchievements(users) {
        const milestones = {
            thirtyMinutes: 0,
            oneHour: 0,
            twoHours: 0,
            fiveHours: 0,
            tenHours: 0
        };
        
        for (const user of users) {
            if (user.milestones.thirtyMinutes) milestones.thirtyMinutes++;
            if (user.milestones.oneHour) milestones.oneHour++;
            if (user.milestones.twoHours) milestones.twoHours++;
            if (user.milestones.fiveHours) milestones.fiveHours++;
            if (user.milestones.tenHours) milestones.tenHours++;
        }
        
        const totalUsers = users.length;
        
        return {
            counts: milestones,
            percentages: {
                thirtyMinutes: totalUsers > 0 ? (milestones.thirtyMinutes / totalUsers) * 100 : 0,
                oneHour: totalUsers > 0 ? (milestones.oneHour / totalUsers) * 100 : 0,
                twoHours: totalUsers > 0 ? (milestones.twoHours / totalUsers) * 100 : 0,
                fiveHours: totalUsers > 0 ? (milestones.fiveHours / totalUsers) * 100 : 0,
                tenHours: totalUsers > 0 ? (milestones.tenHours / totalUsers) * 100 : 0
            }
        };
    }
    
    projectFutureSavings(users) {
        if (users.length === 0) return { daily: 0, weekly: 0, monthly: 0 };
        
        // Calculate average daily savings based on recent activity
        const recentSavings = users.map(user => {
            const recentDays = Array.from(user.dailySavings.entries())
                .filter(([date]) => Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000)
                .map(([, savings]) => savings);
            
            return recentDays.length > 0 ? recentDays.reduce((sum, s) => sum + s, 0) / recentDays.length : 0;
        });
        
        const avgDailySavings = recentSavings.reduce((sum, s) => sum + s, 0) / users.length;
        
        return {
            daily: avgDailySavings / 60000, // minutes
            weekly: (avgDailySavings * 7) / 60000,
            monthly: (avgDailySavings * 30) / 60000
        };
    }
    
    // Utility methods
    
    determineComplexity(fieldsCount) {
        if (fieldsCount <= 5) return 'simple';
        if (fieldsCount <= 15) return 'medium';
        if (fieldsCount <= 30) return 'complex';
        return 'enterprise';
    }
    
    createNewUserData(userId) {
        return {
            userId,
            totalTimeSaved: 0,
            totalFormsSaved: 0,
            avgSavingsPerForm: 0,
            bestSavings: 0,
            savingsHistory: [],
            dailySavings: new Map(),
            monthlySavings: new Map(),
            efficiencyScore: 0,
            lastUpdated: Date.now(),
            milestones: {
                thirtyMinutes: false,
                oneHour: false,
                twoHours: false,
                fiveHours: false,
                tenHours: false
            }
        };
    }
    
    generateFormId(formUrl) {
        // Create a consistent ID based on form URL
        return btoa(formUrl).replace(/[+/=]/g, '').substring(0, 16);
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    getEmptyTimeSavingsMetrics() {
        return {
            averagePerUser: 0,
            target: this.config.targetSavingsMinutes,
            achieved: false,
            totalUsers: 0,
            totalTimeSaved: { hours: 0, minutes: 0, seconds: 0 },
            totalForms: 0,
            averagePerForm: { minutes: 0 },
            userDistribution: {
                timeSaved: { underOneHour: 0, oneToTwoHours: 0, twoToFiveHours: 0, overFiveHours: 0 },
                efficiency: { low: 0, medium: 0, high: 0, expert: 0 }
            },
            topPerformers: [],
            milestoneAchievements: {
                counts: { thirtyMinutes: 0, oneHour: 0, twoHours: 0, fiveHours: 0, tenHours: 0 },
                percentages: { thirtyMinutes: 0, oneHour: 0, twoHours: 0, fiveHours: 0, tenHours: 0 }
            }
        };
    }
    
    // Data persistence
    
    async saveSavingsData() {
        try {
            // Convert Maps to Objects for storage
            const usersData = {};
            for (const [userId, userData] of this.savingsData.users.entries()) {
                usersData[userId] = {
                    ...userData,
                    dailySavings: Object.fromEntries(userData.dailySavings),
                    monthlySavings: Object.fromEntries(userData.monthlySavings)
                };
            }
            
            const formsData = Object.fromEntries(this.savingsData.forms);
            
            await chrome.storage.local.set({
                timeSavingsData: usersData,
                savingsMetrics: this.savingsData.aggregate,
                formTimings: formsData
            });
            
        } catch (error) {
            console.error('Error saving time savings data:', error);
        }
    }
    
    // Public API
    
    getUserTimeSavings(userId) {
        const userData = this.savingsData.users.get(userId);
        if (!userData) return null;
        
        return {
            userId,
            totalSaved: {
                hours: userData.totalTimeSaved / 3600000,
                minutes: userData.totalTimeSaved / 60000,
                seconds: userData.totalTimeSaved / 1000
            },
            formsProcessed: userData.totalFormsSaved,
            avgSavingsPerForm: userData.avgSavingsPerForm / 60000, // minutes
            efficiencyScore: userData.efficiencyScore,
            milestones: userData.milestones,
            reachesTarget: (userData.totalTimeSaved / 60000) >= this.config.targetSavingsMinutes
        };
    }
    
    getTimeSavingsInsights() {
        const insights = [];
        
        const aggregate = this.savingsData.aggregate;
        const avgUserMinutes = aggregate.avgSavingsPerUser / 60000;
        
        if (avgUserMinutes < this.config.targetSavingsMinutes) {
            insights.push({
                type: 'below_target',
                severity: 'medium',
                message: `Average savings (${avgUserMinutes.toFixed(1)} min) below ${this.config.targetSavingsMinutes} min target`,
                recommendation: 'Focus on increasing form processing efficiency and user engagement'
            });
        } else {
            insights.push({
                type: 'target_achieved',
                severity: 'info',
                message: `Average savings (${avgUserMinutes.toFixed(1)} min) exceeds target`,
                recommendation: 'Excellent! Consider raising the target or adding advanced features'
            });
        }
        
        // Check for low efficiency users
        const lowEfficiencyUsers = Array.from(this.savingsData.users.values())
            .filter(user => user.efficiencyScore < 30).length;
        
        if (lowEfficiencyUsers > 0) {
            const totalUsers = this.savingsData.users.size;
            const percentage = (lowEfficiencyUsers / totalUsers) * 100;
            
            insights.push({
                type: 'low_efficiency',
                severity: 'medium',
                message: `${percentage.toFixed(1)}% of users have low efficiency scores`,
                recommendation: 'Provide tutorials and tips to help users maximize time savings'
            });
        }
        
        return insights;
    }
    
    stop() {
        // Save any pending data
        if (this.isInitialized) {
            this.saveSavingsData();
        }
        
        console.log('⏱️ Time Savings Calculator stopped');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeSavingsCalculator;
} else {
    window.TimeSavingsCalculator = TimeSavingsCalculator;
}