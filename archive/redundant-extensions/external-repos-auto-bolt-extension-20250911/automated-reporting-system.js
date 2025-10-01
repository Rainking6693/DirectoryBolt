/**
 * Automated Reporting System
 * Generates weekly and monthly analytics reports
 * Sends automated reports based on Taylor's success metrics
 */

class AutomatedReportingSystem {
    constructor() {
        this.config = {
            reports: {
                weekly: {
                    enabled: true,
                    schedule: 'monday', // Day of week to send
                    time: '09:00',      // Time to send (24h format)
                    recipients: ['team@company.com'],
                    template: 'weekly_summary'
                },
                monthly: {
                    enabled: true,
                    schedule: 1,        // Day of month to send
                    time: '09:00',      // Time to send
                    recipients: ['management@company.com', 'team@company.com'],
                    template: 'monthly_detailed'
                },
                alerts: {
                    enabled: true,
                    thresholds: {
                        criticalRetention: 40,  // Below 40% retention
                        highSupportRate: 8,     // Above 8% support tickets
                        lowTimeSavings: 60      // Below 1 hour average
                    },
                    recipients: ['alerts@company.com']
                }
            },
            storage: {
                reportHistory: 50,      // Keep last 50 reports
                dataRetention: 180      // Days to keep report data
            },
            templates: {
                formats: ['html', 'json', 'csv'],
                includeCharts: true,
                includeTrends: true,
                includeRecommendations: true
            }
        };
        
        this.analytics = null;
        this.reportHistory = new Map();
        this.scheduledTasks = new Map();
        this.isInitialized = false;
    }
    
    async init(analyticsInstance) {
        console.log('📊 Initializing Automated Reporting System...');
        
        try {
            this.analytics = analyticsInstance;
            
            // Load existing report history
            await this.loadReportHistory();
            
            // Schedule reports
            this.scheduleReports();
            
            // Set up alert monitoring
            this.setupAlertMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Automated Reporting System initialized');
            
        } catch (error) {
            console.error('Error initializing Automated Reporting System:', error);
        }
    }
    
    async loadReportHistory() {
        try {
            const result = await chrome.storage.local.get('reportHistory');
            if (result.reportHistory) {
                const historyData = result.reportHistory;
                for (const [reportId, data] of Object.entries(historyData)) {
                    this.reportHistory.set(reportId, data);
                }
            }
            
            console.log(`📊 Loaded ${this.reportHistory.size} historical reports`);
            
        } catch (error) {
            console.error('Error loading report history:', error);
        }
    }
    
    scheduleReports() {
        // Schedule weekly reports
        if (this.config.reports.weekly.enabled) {
            this.scheduleWeeklyReports();
        }
        
        // Schedule monthly reports
        if (this.config.reports.monthly.enabled) {
            this.scheduleMonthlyReports();
        }
        
        // Schedule daily checks for report generation
        this.scheduleDailyCheck();
    }
    
    scheduleWeeklyReports() {
        const taskId = 'weekly_reports';
        
        // Clear existing task
        if (this.scheduledTasks.has(taskId)) {
            clearInterval(this.scheduledTasks.get(taskId));
        }
        
        // Check every hour if it's time to send weekly report
        const intervalId = setInterval(async () => {
            if (this.shouldSendWeeklyReport()) {
                await this.generateAndSendWeeklyReport();
            }
        }, 3600000); // Check every hour
        
        this.scheduledTasks.set(taskId, intervalId);
        console.log('📅 Weekly reports scheduled');
    }
    
    scheduleMonthlyReports() {
        const taskId = 'monthly_reports';
        
        // Clear existing task
        if (this.scheduledTasks.has(taskId)) {
            clearInterval(this.scheduledTasks.get(taskId));
        }
        
        // Check every hour if it's time to send monthly report
        const intervalId = setInterval(async () => {
            if (this.shouldSendMonthlyReport()) {
                await this.generateAndSendMonthlyReport();
            }
        }, 3600000); // Check every hour
        
        this.scheduledTasks.set(taskId, intervalId);
        console.log('📅 Monthly reports scheduled');
    }
    
    scheduleDailyCheck() {
        const taskId = 'daily_check';
        
        // Check every 6 hours for any pending reports or alerts
        const intervalId = setInterval(async () => {
            await this.performDailyCheck();
        }, 21600000); // Every 6 hours
        
        this.scheduledTasks.set(taskId, intervalId);
        console.log('📅 Daily checks scheduled');
    }
    
    setupAlertMonitoring() {
        if (!this.config.reports.alerts.enabled) return;
        
        // Monitor metrics every 30 minutes for alert conditions
        const alertInterval = setInterval(async () => {
            await this.checkAlertConditions();
        }, 1800000); // Every 30 minutes
        
        this.scheduledTasks.set('alert_monitoring', alertInterval);
        console.log('🚨 Alert monitoring enabled');
    }
    
    shouldSendWeeklyReport() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Check if it's Monday (1) and the right time
        const shouldSend = dayOfWeek === 1 && currentTime === this.config.reports.weekly.time;
        
        // Also check if we haven't sent a report this week
        const lastWeeklyReport = this.getLastReport('weekly');
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        return shouldSend && (!lastWeeklyReport || lastWeeklyReport.generatedAt < weekAgo);
    }
    
    shouldSendMonthlyReport() {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Check if it's the 1st of the month and the right time
        const shouldSend = dayOfMonth === this.config.reports.monthly.schedule && 
                          currentTime === this.config.reports.monthly.time;
        
        // Also check if we haven't sent a report this month
        const lastMonthlyReport = this.getLastReport('monthly');
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        return shouldSend && (!lastMonthlyReport || lastMonthlyReport.generatedAt < monthAgo);
    }
    
    getLastReport(type) {
        const reports = Array.from(this.reportHistory.values())
            .filter(report => report.type === type)
            .sort((a, b) => b.generatedAt - a.generatedAt);
        
        return reports[0] || null;
    }
    
    async generateAndSendWeeklyReport() {
        console.log('📊 Generating weekly report...');
        
        try {
            const report = await this.generateReport('weekly');
            
            // Store report
            await this.storeReport(report);
            
            // Send report
            await this.sendReport(report);
            
            console.log(`✅ Weekly report sent: ${report.id}`);
            
        } catch (error) {
            console.error('Error generating weekly report:', error);
            await this.sendErrorNotification('weekly_report_failed', error);
        }
    }
    
    async generateAndSendMonthlyReport() {
        console.log('📊 Generating monthly report...');
        
        try {
            const report = await this.generateReport('monthly');
            
            // Store report
            await this.storeReport(report);
            
            // Send report
            await this.sendReport(report);
            
            console.log(`✅ Monthly report sent: ${report.id}`);
            
        } catch (error) {
            console.error('Error generating monthly report:', error);
            await this.sendErrorNotification('monthly_report_failed', error);
        }
    }
    
    async generateReport(type) {
        const timeRange = type === 'weekly' ? '7d' : '30d';
        const reportId = this.generateReportId(type);
        
        // Gather all metrics
        const [
            overallMetrics,
            retentionMetrics,
            supportMetrics,
            featureMetrics,
            timeSavingsMetrics
        ] = await Promise.all([
            this.analytics.getMetrics(timeRange),
            this.analytics.metrics.users.getRetentionMetrics(timeRange),
            this.analytics.metrics.support.getSupportMetrics(timeRange),
            this.analytics.metrics.features.getFeatureMetrics(timeRange),
            this.analytics.metrics.timeSavings.getTimeSavingsMetrics(timeRange)
        ]);
        
        const report = {
            id: reportId,
            type,
            generatedAt: Date.now(),
            period: {
                start: Date.now() - this.parseTimeRange(timeRange),
                end: Date.now(),
                timeRange
            },
            metrics: {
                overall: overallMetrics,
                retention: retentionMetrics,
                support: supportMetrics,
                features: featureMetrics,
                timeSavings: timeSavingsMetrics
            },
            summary: await this.generateSummary(overallMetrics, type),
            insights: await this.generateInsights(overallMetrics),
            recommendations: await this.generateRecommendations(overallMetrics),
            alerts: await this.generateAlerts(overallMetrics),
            trends: await this.analyzeTrends(type),
            attachments: await this.generateAttachments(overallMetrics, type)
        };
        
        return report;
    }
    
    async generateSummary(metrics, type) {
        const success = metrics.success || {};
        const period = type === 'weekly' ? 'week' : 'month';
        
        const summary = {
            period,
            status: 'good',
            highlights: [],
            concerns: [],
            keyNumbers: {
                totalUsers: metrics.overview?.totalUsers || 0,
                activeUsers: metrics.overview?.activeUsers || 0,
                retentionRate: success.userRetention?.current || 0,
                supportRate: success.supportTickets?.current || 0,
                multiDirUsage: success.multiDirectoryUsage?.current || 0,
                avgTimeSaved: (success.timeSavings?.current || 0) / 60 // Convert to hours
            }
        };
        
        // Determine overall status
        const targetsAchieved = [
            success.userRetention?.achieved,
            success.supportTickets?.achieved,
            success.multiDirectoryUsage?.achieved,
            success.timeSavings?.achieved
        ].filter(Boolean).length;
        
        if (targetsAchieved >= 3) {
            summary.status = 'excellent';
        } else if (targetsAchieved >= 2) {
            summary.status = 'good';
        } else if (targetsAchieved >= 1) {
            summary.status = 'fair';
        } else {
            summary.status = 'needs_attention';
        }
        
        // Generate highlights
        if (success.userRetention?.achieved) {
            summary.highlights.push(`User retention at ${success.userRetention.current.toFixed(1)}% (exceeds ${success.userRetention.target}% target)`);
        }
        
        if (success.timeSavings?.achieved) {
            const hours = (success.timeSavings.current / 60).toFixed(1);
            summary.highlights.push(`Users save an average of ${hours} hours each`);
        }
        
        if (success.supportTickets?.achieved) {
            summary.highlights.push(`Support tickets remain low at ${success.supportTickets.current.toFixed(1)}%`);
        }
        
        // Generate concerns
        if (!success.userRetention?.achieved) {
            summary.concerns.push(`User retention at ${success.userRetention.current.toFixed(1)}% needs improvement`);
        }
        
        if (!success.supportTickets?.achieved) {
            summary.concerns.push(`Support ticket rate at ${success.supportTickets.current.toFixed(1)}% is above threshold`);
        }
        
        return summary;
    }
    
    async generateInsights(metrics) {
        const insights = [];
        
        // Add insights based on metric trends and patterns
        if (metrics.success) {
            const success = metrics.success;
            
            // User engagement insights
            if (success.userRetention?.achieved && success.multiDirectoryUsage?.achieved) {
                insights.push({
                    category: 'user_engagement',
                    type: 'positive',
                    title: 'Strong User Engagement',
                    description: 'Users are both staying engaged and exploring multiple directories',
                    impact: 'high'
                });
            }
            
            // Efficiency insights
            if (success.timeSavings?.achieved && success.supportTickets?.achieved) {
                insights.push({
                    category: 'efficiency',
                    type: 'positive',
                    title: 'High Efficiency Operation',
                    description: 'Extension saves significant time while maintaining low support burden',
                    impact: 'high'
                });
            }
            
            // Growth opportunity insights
            if (!success.multiDirectoryUsage?.achieved) {
                insights.push({
                    category: 'growth_opportunity',
                    type: 'neutral',
                    title: 'Directory Usage Potential',
                    description: 'Opportunity to increase multi-directory adoption through better UX',
                    impact: 'medium'
                });
            }
        }
        
        return insights;
    }
    
    async generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.success) {
            const success = metrics.success;
            
            // Retention recommendations
            if (!success.userRetention?.achieved) {
                recommendations.push({
                    priority: 'high',
                    category: 'retention',
                    title: 'Improve User Retention',
                    description: 'Implement onboarding improvements and user engagement features',
                    estimatedImpact: '15-25% retention improvement',
                    timeline: '2-4 weeks'
                });
            }
            
            // Support recommendations
            if (!success.supportTickets?.achieved) {
                recommendations.push({
                    priority: 'high',
                    category: 'support',
                    title: 'Reduce Support Burden',
                    description: 'Address top user issues and improve error handling',
                    estimatedImpact: '30-50% support reduction',
                    timeline: '1-2 weeks'
                });
            }
            
            // Feature adoption recommendations
            if (!success.multiDirectoryUsage?.achieved) {
                recommendations.push({
                    priority: 'medium',
                    category: 'features',
                    title: 'Increase Multi-Directory Adoption',
                    description: 'Improve directory discovery UI and user education',
                    estimatedImpact: '20-30% adoption increase',
                    timeline: '2-3 weeks'
                });
            }
            
            // Optimization recommendations
            if (success.timeSavings?.achieved) {
                recommendations.push({
                    priority: 'low',
                    category: 'optimization',
                    title: 'Advanced Features Development',
                    description: 'Consider adding bulk processing and automation features',
                    estimatedImpact: '50-100% time savings increase',
                    timeline: '4-6 weeks'
                });
            }
        }
        
        return recommendations;
    }
    
    async generateAlerts(metrics) {
        const alerts = [];
        const thresholds = this.config.reports.alerts.thresholds;
        
        if (metrics.success) {
            const success = metrics.success;
            
            // Critical retention alert
            if (success.userRetention?.current < thresholds.criticalRetention) {
                alerts.push({
                    level: 'critical',
                    type: 'user_retention',
                    title: 'Critical User Retention',
                    message: `Retention rate (${success.userRetention.current.toFixed(1)}%) is critically low`,
                    action: 'Immediate intervention required'
                });
            }
            
            // High support rate alert
            if (success.supportTickets?.current > thresholds.highSupportRate) {
                alerts.push({
                    level: 'warning',
                    type: 'support_rate',
                    title: 'High Support Ticket Rate',
                    message: `Support rate (${success.supportTickets.current.toFixed(1)}%) exceeds threshold`,
                    action: 'Review top issues and implement fixes'
                });
            }
            
            // Low time savings alert
            if ((success.timeSavings?.current || 0) < thresholds.lowTimeSavings) {
                alerts.push({
                    level: 'warning',
                    type: 'time_savings',
                    title: 'Low Time Savings',
                    message: `Average time savings below 1 hour per user`,
                    action: 'Review and optimize form processing efficiency'
                });
            }
        }
        
        return alerts;
    }
    
    async analyzeTrends(type) {
        // Get historical reports for trend analysis
        const historicalReports = Array.from(this.reportHistory.values())
            .filter(report => report.type === type)
            .sort((a, b) => a.generatedAt - b.generatedAt)
            .slice(-4); // Last 4 reports
        
        if (historicalReports.length < 2) {
            return { available: false, reason: 'Insufficient historical data' };
        }
        
        const trends = {
            available: true,
            userRetention: this.calculateTrend(historicalReports, 'retention.retentionRate'),
            supportTickets: this.calculateTrend(historicalReports, 'support.ticketRate'),
            multiDirectoryUsage: this.calculateTrend(historicalReports, 'features.multiDirectoryRate'),
            timeSavings: this.calculateTrend(historicalReports, 'timeSavings.averagePerUser'),
            overallDirection: 'stable'
        };
        
        // Determine overall trend direction
        const trendValues = [
            trends.userRetention.direction,
            trends.timeSavings.direction
        ];
        
        const upTrends = trendValues.filter(t => t === 'increasing').length;
        const downTrends = trendValues.filter(t => t === 'decreasing').length;
        
        if (upTrends > downTrends) {
            trends.overallDirection = 'improving';
        } else if (downTrends > upTrends) {
            trends.overallDirection = 'declining';
        }
        
        return trends;
    }
    
    calculateTrend(reports, metricPath) {
        const values = reports.map(report => {
            const pathParts = metricPath.split('.');
            let value = report.metrics;
            
            for (const part of pathParts) {
                value = value?.[part];
                if (value === undefined) break;
            }
            
            return value || 0;
        });
        
        if (values.length < 2) {
            return { direction: 'stable', change: 0, confidence: 'low' };
        }
        
        // Simple linear trend calculation
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        let direction = 'stable';
        if (Math.abs(change) > 5) {
            direction = change > 0 ? 'increasing' : 'decreasing';
        }
        
        return {
            direction,
            change: Math.abs(change),
            confidence: values.length >= 4 ? 'high' : 'medium',
            values
        };
    }
    
    async generateAttachments(metrics, type) {
        const attachments = [];
        
        // Generate CSV export
        if (this.config.templates.formats.includes('csv')) {
            const csvData = await this.generateCSVReport(metrics);
            attachments.push({
                type: 'csv',
                filename: `autobolt-${type}-report.csv`,
                content: csvData
            });
        }
        
        // Generate JSON export
        if (this.config.templates.formats.includes('json')) {
            attachments.push({
                type: 'json',
                filename: `autobolt-${type}-report.json`,
                content: JSON.stringify(metrics, null, 2)
            });
        }
        
        return attachments;
    }
    
    async generateCSVReport(metrics) {
        const csvLines = [];
        
        // Header
        csvLines.push('Metric,Current Value,Target,Achieved,Percentage of Target');
        
        // Success metrics
        if (metrics.success) {
            const success = metrics.success;
            
            csvLines.push(`User Retention,${success.userRetention?.current?.toFixed(1) || 0}%,${success.userRetention?.target || 0}%,${success.userRetention?.achieved || false},${success.userRetention?.percentage?.toFixed(1) || 0}%`);
            
            csvLines.push(`Support Tickets,${success.supportTickets?.current?.toFixed(1) || 0}%,${success.supportTickets?.target || 0}%,${success.supportTickets?.achieved || false},${success.supportTickets?.percentage?.toFixed(1) || 0}%`);
            
            csvLines.push(`Multi-Directory Usage,${success.multiDirectoryUsage?.current?.toFixed(1) || 0}%,${success.multiDirectoryUsage?.target || 0}%,${success.multiDirectoryUsage?.achieved || false},${success.multiDirectoryUsage?.percentage?.toFixed(1) || 0}%`);
            
            csvLines.push(`Time Savings,${((success.timeSavings?.current || 0) / 60).toFixed(1)}h,${((success.timeSavings?.target || 0) / 60).toFixed(1)}h,${success.timeSavings?.achieved || false},${success.timeSavings?.percentage?.toFixed(1) || 0}%`);
        }
        
        return csvLines.join('\\n');
    }
    
    async storeReport(report) {
        // Store in memory
        this.reportHistory.set(report.id, report);
        
        // Cleanup old reports
        await this.cleanupOldReports();
        
        // Save to storage
        await this.saveReportHistory();
        
        console.log(`💾 Report stored: ${report.id}`);
    }
    
    async cleanupOldReports() {
        const reports = Array.from(this.reportHistory.values())
            .sort((a, b) => b.generatedAt - a.generatedAt);
        
        // Keep only the most recent reports
        if (reports.length > this.config.storage.reportHistory) {
            const toRemove = reports.slice(this.config.storage.reportHistory);
            
            for (const report of toRemove) {
                this.reportHistory.delete(report.id);
            }
        }
        
        // Remove reports older than retention period
        const cutoff = Date.now() - (this.config.storage.dataRetention * 24 * 60 * 60 * 1000);
        
        for (const [reportId, report] of this.reportHistory.entries()) {
            if (report.generatedAt < cutoff) {
                this.reportHistory.delete(reportId);
            }
        }
    }
    
    async saveReportHistory() {
        try {
            const historyData = Object.fromEntries(this.reportHistory);
            await chrome.storage.local.set({ reportHistory: historyData });
        } catch (error) {
            console.error('Error saving report history:', error);
        }
    }
    
    async sendReport(report) {
        console.log(`📧 Sending ${report.type} report...`);
        
        try {
            // Get recipients for this report type
            const recipients = this.config.reports[report.type].recipients;
            
            // Generate email content
            const emailContent = await this.generateEmailContent(report);
            
            // Send via backend API
            const response = await this.sendEmail({
                to: recipients,
                subject: `AutoBolt ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report - ${new Date(report.generatedAt).toLocaleDateString()}`,
                content: emailContent,
                attachments: report.attachments
            });
            
            if (response.success) {
                console.log(`✅ ${report.type} report sent successfully`);
            } else {
                throw new Error(response.error || 'Failed to send email');
            }
            
        } catch (error) {
            console.error(`Error sending ${report.type} report:`, error);
            throw error;
        }
    }
    
    async generateEmailContent(report) {
        const template = this.config.reports[report.type].template;
        
        if (template === 'weekly_summary') {
            return this.generateWeeklyEmailTemplate(report);
        } else if (template === 'monthly_detailed') {
            return this.generateMonthlyEmailTemplate(report);
        }
        
        return this.generateDefaultEmailTemplate(report);
    }
    
    generateWeeklyEmailTemplate(report) {
        const summary = report.summary;
        const success = report.metrics.overall.success || {};
        
        return `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
                    .metric { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; }
                    .achieved { border-left: 4px solid #22c55e; }
                    .not-achieved { border-left: 4px solid #ef4444; }
                    .highlights { background: #d4fdd4; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .concerns { background: #fed7d7; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>AutoBolt Weekly Report</h1>
                    <p>${new Date(report.generatedAt).toLocaleDateString()} - ${summary.status.toUpperCase()}</p>
                </div>
                
                <div style="padding: 20px;">
                    <h2>Executive Summary</h2>
                    <p>This week's performance shows ${summary.status} results across our key success metrics.</p>
                    
                    <h3>Key Metrics</h3>
                    <div class="metric ${success.userRetention?.achieved ? 'achieved' : 'not-achieved'}">
                        <strong>User Retention:</strong> ${success.userRetention?.current?.toFixed(1) || 0}% 
                        (Target: ${success.userRetention?.target || 60}%)
                    </div>
                    
                    <div class="metric ${success.supportTickets?.achieved ? 'achieved' : 'not-achieved'}">
                        <strong>Support Tickets:</strong> ${success.supportTickets?.current?.toFixed(1) || 0}% 
                        (Target: <${success.supportTickets?.target || 5}%)
                    </div>
                    
                    <div class="metric ${success.multiDirectoryUsage?.achieved ? 'achieved' : 'not-achieved'}">
                        <strong>Multi-Directory Usage:</strong> ${success.multiDirectoryUsage?.current?.toFixed(1) || 0}% 
                        (Target: >${success.multiDirectoryUsage?.target || 70}%)
                    </div>
                    
                    <div class="metric ${success.timeSavings?.achieved ? 'achieved' : 'not-achieved'}">
                        <strong>Time Savings:</strong> ${((success.timeSavings?.current || 0) / 60).toFixed(1)}h per user 
                        (Target: ${((success.timeSavings?.target || 0) / 60).toFixed(1)}h)
                    </div>
                    
                    ${summary.highlights.length > 0 ? `
                        <div class="highlights">
                            <h3>🎉 Highlights</h3>
                            <ul>
                                ${summary.highlights.map(h => `<li>${h}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${summary.concerns.length > 0 ? `
                        <div class="concerns">
                            <h3>⚠️ Areas for Attention</h3>
                            <ul>
                                ${summary.concerns.map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${report.recommendations.length > 0 ? `
                        <h3>📋 Recommendations</h3>
                        ${report.recommendations.map(rec => `
                            <div class="metric">
                                <strong>${rec.title}</strong> (${rec.priority} priority)<br>
                                ${rec.description}<br>
                                <small>Expected impact: ${rec.estimatedImpact} | Timeline: ${rec.timeline}</small>
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
                
                <div style="padding: 20px; background: #f8f9fa; text-align: center; margin-top: 20px;">
                    <small>Generated by AutoBolt Analytics System</small>
                </div>
            </body>
            </html>
        `;
    }
    
    generateMonthlyEmailTemplate(report) {
        // More detailed template for monthly reports
        const template = this.generateWeeklyEmailTemplate(report);
        
        // Add trend analysis section
        const trendSection = report.trends.available ? `
            <h3>📈 Trend Analysis</h3>
            <div class="metric">
                <strong>Overall Direction:</strong> ${report.trends.overallDirection}<br>
                <strong>User Retention Trend:</strong> ${report.trends.userRetention.direction} 
                (${report.trends.userRetention.change.toFixed(1)}% change)<br>
                <strong>Support Trend:</strong> ${report.trends.supportTickets.direction} 
                (${report.trends.supportTickets.change.toFixed(1)}% change)<br>
                <strong>Feature Usage Trend:</strong> ${report.trends.multiDirectoryUsage.direction} 
                (${report.trends.multiDirectoryUsage.change.toFixed(1)}% change)
            </div>
        ` : '<p>Trend analysis requires more historical data.</p>';
        
        return template.replace('</div>', trendSection + '</div>');
    }
    
    generateDefaultEmailTemplate(report) {
        return this.generateWeeklyEmailTemplate(report);
    }
    
    async sendEmail(emailData) {
        try {
            // Send to backend API
            const response = await fetch('/.netlify/functions/send-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }
    
    async checkAlertConditions() {
        if (!this.config.reports.alerts.enabled) return;
        
        try {
            const metrics = await this.analytics.getMetrics('24h');
            const alerts = await this.generateAlerts(metrics);
            
            // Send critical alerts immediately
            const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
            
            if (criticalAlerts.length > 0) {
                await this.sendAlertNotification(criticalAlerts);
            }
            
        } catch (error) {
            console.error('Error checking alert conditions:', error);
        }
    }
    
    async sendAlertNotification(alerts) {
        console.log(`🚨 Sending ${alerts.length} critical alerts...`);
        
        const emailContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .alert { background: #fed7d7; border: 1px solid #ef4444; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚨 AutoBolt Critical Alerts</h1>
                    <p>Immediate attention required</p>
                </div>
                
                <div style="padding: 20px;">
                    ${alerts.map(alert => `
                        <div class="alert">
                            <h3>${alert.title}</h3>
                            <p>${alert.message}</p>
                            <strong>Required Action:</strong> ${alert.action}
                        </div>
                    `).join('')}
                    
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;
        
        await this.sendEmail({
            to: this.config.reports.alerts.recipients,
            subject: `🚨 AutoBolt Critical Alert - ${new Date().toLocaleDateString()}`,
            content: emailContent,
            attachments: []
        });
    }
    
    async sendErrorNotification(type, error) {
        console.log(`❌ Sending error notification: ${type}`);
        
        const emailContent = `
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="background: #fed7d7; border: 1px solid #ef4444; padding: 20px; border-radius: 5px;">
                    <h2>AutoBolt Reporting System Error</h2>
                    <p><strong>Error Type:</strong> ${type}</p>
                    <p><strong>Error Message:</strong> ${error.message}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Stack Trace:</strong></p>
                    <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
                </div>
            </body>
            </html>
        `;
        
        await this.sendEmail({
            to: ['admin@company.com'],
            subject: `AutoBolt Reporting Error - ${type}`,
            content: emailContent,
            attachments: []
        });
    }
    
    async performDailyCheck() {
        console.log('🔍 Performing daily check...');
        
        try {
            // Check if any reports are overdue
            await this.checkOverdueReports();
            
            // Check system health
            await this.checkSystemHealth();
            
            // Clean up old data
            await this.cleanupOldReports();
            
        } catch (error) {
            console.error('Error in daily check:', error);
        }
    }
    
    async checkOverdueReports() {
        const now = new Date();
        
        // Check if weekly report is overdue
        const lastWeekly = this.getLastReport('weekly');
        const weeksSinceLastWeekly = lastWeekly ? 
            Math.floor((Date.now() - lastWeekly.generatedAt) / (7 * 24 * 60 * 60 * 1000)) : 1;
        
        if (weeksSinceLastWeekly > 1) {
            console.warn(`⚠️ Weekly report overdue by ${weeksSinceLastWeekly - 1} weeks`);
        }
        
        // Check if monthly report is overdue
        const lastMonthly = this.getLastReport('monthly');
        const monthsSinceLastMonthly = lastMonthly ? 
            Math.floor((Date.now() - lastMonthly.generatedAt) / (30 * 24 * 60 * 60 * 1000)) : 1;
        
        if (monthsSinceLastMonthly > 1) {
            console.warn(`⚠️ Monthly report overdue by ${monthsSinceLastMonthly - 1} months`);
        }
    }
    
    async checkSystemHealth() {
        // Basic system health checks
        const health = {
            analytics: this.analytics ? 'ok' : 'error',
            storage: 'ok',
            scheduling: this.scheduledTasks.size > 0 ? 'ok' : 'error'
        };
        
        const issues = Object.entries(health)
            .filter(([key, status]) => status === 'error')
            .map(([key]) => key);
        
        if (issues.length > 0) {
            console.warn(`⚠️ System health issues detected: ${issues.join(', ')}`);
        }
    }
    
    // Utility methods
    
    generateReportId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `${type}_${timestamp}_${random}`;
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    // Public API
    
    async generateManualReport(type, recipients = null) {
        console.log(`📊 Generating manual ${type} report...`);
        
        try {
            const report = await this.generateReport(type);
            
            // Override recipients if provided
            if (recipients) {
                report.recipients = recipients;
            }
            
            await this.storeReport(report);
            await this.sendReport(report);
            
            return report;
            
        } catch (error) {
            console.error(`Error generating manual ${type} report:`, error);
            throw error;
        }
    }
    
    getReportHistory(type = null, limit = 10) {
        let reports = Array.from(this.reportHistory.values())
            .sort((a, b) => b.generatedAt - a.generatedAt);
        
        if (type) {
            reports = reports.filter(report => report.type === type);
        }
        
        return reports.slice(0, limit);
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Re-schedule reports with new config
        this.scheduleReports();
        
        console.log('📊 Reporting configuration updated');
    }
    
    stop() {
        // Stop all scheduled tasks
        for (const [taskId, intervalId] of this.scheduledTasks.entries()) {
            clearInterval(intervalId);
            console.log(`⏹️ Stopped scheduled task: ${taskId}`);
        }
        
        this.scheduledTasks.clear();
        
        // Save any pending data
        this.saveReportHistory();
        
        console.log('📊 Automated Reporting System stopped');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedReportingSystem;
} else {
    window.AutomatedReportingSystem = AutomatedReportingSystem;
}