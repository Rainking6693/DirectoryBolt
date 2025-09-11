/**
 * AutoBolt Analytics Dashboard
 * Real-time analytics visualization and monitoring
 */

class AnalyticsDashboard {
    constructor() {
        this.config = {
            refreshInterval: 30000,  // 30 seconds
            chartAnimationDuration: 750,
            maxDataPoints: 50,
            colors: {
                primary: '#6366f1',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#0ea5e9'
            }
        };
        
        this.analytics = null;
        this.refreshTimer = null;
        this.currentTimeRange = '7d';
        
        this.init();
    }
    
    async init() {
        console.log('📊 Initializing Analytics Dashboard...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize analytics system
            if (typeof AutoBoltAnalytics !== 'undefined') {
                this.analytics = new AutoBoltAnalytics();
                await this.analytics.init();
            } else {
                console.warn('AutoBoltAnalytics not available, using mock data');
                this.analytics = new MockAnalytics();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            console.log('✅ Analytics Dashboard initialized');
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showErrorState('Failed to initialize dashboard');
        }
    }
    
    setupEventListeners() {
        // Time range selectors
        document.querySelectorAll('.time-selector').forEach(button => {
            button.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                this.changeTimeRange(range);
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshCharts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
        
        // Auto-refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshDashboard();
            }
        });
    }
    
    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Load all metrics in parallel
            const [
                metrics,
                retentionMetrics,
                supportMetrics,
                featureMetrics,
                timeSavingsMetrics
            ] = await Promise.all([
                this.analytics.getMetrics(this.currentTimeRange),
                this.analytics.metrics?.users?.getRetentionMetrics(this.currentTimeRange) || {},
                this.analytics.metrics?.support?.getSupportMetrics(this.currentTimeRange) || {},
                this.analytics.metrics?.features?.getFeatureMetrics(this.currentTimeRange) || {},
                this.analytics.metrics?.timeSavings?.getTimeSavingsMetrics(this.currentTimeRange) || {}
            ]);
            
            // Update dashboard components
            this.updateSuccessMetrics(metrics);
            this.updateOverviewStats(metrics);
            this.updateCharts(metrics);
            this.updateInsights(metrics);
            this.updateAlerts(metrics);
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorState('Failed to load dashboard data');
        }
    }
    
    updateSuccessMetrics(metrics) {
        const successMetrics = document.getElementById('successMetrics');
        if (!successMetrics || !metrics.success) return;
        
        const metricCards = [
            {
                title: 'User Retention',
                value: `${metrics.success.userRetention.current?.toFixed(1) || 0}%`,
                target: `Target: ${metrics.success.userRetention.target || 60}%`,
                progress: Math.min(100, metrics.success.userRetention.percentage || 0),
                achieved: metrics.success.userRetention.achieved || false,
                change: this.calculateChange('retention')
            },
            {
                title: 'Support Tickets',
                value: `${metrics.success.supportTickets.current?.toFixed(1) || 0}%`,
                target: `Target: <${metrics.success.supportTickets.target || 5}%`,
                progress: Math.min(100, metrics.success.supportTickets.percentage || 0),
                achieved: metrics.success.supportTickets.achieved || false,
                change: this.calculateChange('support')
            },
            {
                title: 'Multi-Directory Usage',
                value: `${metrics.success.multiDirectoryUsage.current?.toFixed(1) || 0}%`,
                target: `Target: >${metrics.success.multiDirectoryUsage.target || 70}%`,
                progress: Math.min(100, metrics.success.multiDirectoryUsage.percentage || 0),
                achieved: metrics.success.multiDirectoryUsage.achieved || false,
                change: this.calculateChange('multiDirectory')
            },
            {
                title: 'Time Savings',
                value: `${(metrics.success.timeSavings.current / 60)?.toFixed(1) || 0}h`,
                target: `Target: ${(metrics.success.timeSavings.target / 60) || 2}h per user`,
                progress: Math.min(100, metrics.success.timeSavings.percentage || 0),
                achieved: metrics.success.timeSavings.achieved || false,
                change: this.calculateChange('timeSavings')
            }
        ];
        
        successMetrics.innerHTML = metricCards.map(metric => this.createMetricCard(metric)).join('');
    }
    
    createMetricCard(metric) {
        const statusClass = metric.achieved ? 'achieved' : 
                          metric.progress >= 50 ? 'progress' : 'behind';
        
        const changeClass = metric.change > 0 ? 'positive' : 
                           metric.change < 0 ? 'negative' : 'neutral';
        
        const changeSymbol = metric.change > 0 ? '+' : '';
        
        return `
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">${metric.title}</div>
                    <div class="metric-status status-${statusClass}"></div>
                </div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-target">${metric.target}</div>
                <div class="metric-progress">
                    <div class="progress-bar progress-${statusClass}" 
                         style="width: ${metric.progress}%"></div>
                </div>
                <div class="metric-change change-${changeClass}">
                    ${changeSymbol}${metric.change.toFixed(1)}% vs last period
                </div>
            </div>
        `;
    }
    
    updateOverviewStats(metrics) {
        const overview = metrics.overview || {};
        
        this.updateElement('totalUsers', overview.totalUsers || 0);
        this.updateElement('activeToday', overview.activeToday || 0);
        
        // Calculate total forms from different sources
        const totalForms = (metrics.timeSavings?.totalForms || 0) + 
                          (metrics.performance?.forms?.length || 0);
        this.updateElement('totalForms', totalForms);
        
        // Calculate total savings in hours
        const totalHours = (metrics.timeSavings?.totalTimeSaved?.hours || 0);
        this.updateElement('totalSavings', totalHours.toFixed(1));
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    async updateCharts(metrics) {
        // Update activity chart
        await this.updateActivityChart(metrics);
        
        // Update savings chart
        await this.updateSavingsChart(metrics);
    }
    
    async updateActivityChart(metrics) {
        const chartContainer = document.getElementById('activityChart');
        if (!chartContainer) return;
        
        try {
            // Generate sample activity data
            const activityData = this.generateActivityData(metrics);
            
            // Create simple chart visualization
            const chartHtml = this.createActivityChartHTML(activityData);
            chartContainer.innerHTML = chartHtml;
            
        } catch (error) {
            console.error('Error updating activity chart:', error);
            chartContainer.innerHTML = '<div class="error-state">Failed to load chart</div>';
        }
    }
    
    generateActivityData(metrics) {
        // Generate sample data points for the chart
        const days = this.getDaysInRange(this.currentTimeRange);
        const data = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            
            // Generate sample activity data
            const baseActivity = 50 + Math.random() * 100;
            const weekendReduction = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
            const activity = Math.floor(baseActivity * weekendReduction);
            
            data.push({
                date: date.toISOString().split('T')[0],
                activity,
                users: Math.floor(activity * 0.8),
                forms: Math.floor(activity * 1.2)
            });
        }
        
        return data;
    }
    
    createActivityChartHTML(data) {
        const maxActivity = Math.max(...data.map(d => d.activity));
        const chartWidth = 100;
        const chartHeight = 200;
        
        const bars = data.map((point, index) => {
            const height = (point.activity / maxActivity) * chartHeight;
            const x = (index / data.length) * chartWidth;
            const width = chartWidth / data.length * 0.8;
            
            return `
                <div class="chart-bar" 
                     style="
                         position: absolute; 
                         left: ${x}%; 
                         bottom: 0; 
                         width: ${width}%; 
                         height: ${(height / chartHeight) * 100}%; 
                         background: linear-gradient(to top, ${this.config.colors.primary}, ${this.config.colors.info});
                         border-radius: 2px 2px 0 0;
                         transition: all 0.3s ease;
                     "
                     title="${point.date}: ${point.activity} activities">
                </div>
            `;
        }).join('');
        
        return `
            <div style="position: relative; width: 100%; height: 100%; padding: 20px;">
                <div style="position: relative; width: 100%; height: ${chartHeight}px; border-bottom: 1px solid #e5e7eb;">
                    ${bars}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.75rem; color: #64748b;">
                    <span>${data[0]?.date || ''}</span>
                    <span>${data[data.length - 1]?.date || ''}</span>
                </div>
            </div>
        `;
    }
    
    async updateSavingsChart(metrics) {
        const chartContainer = document.getElementById('savingsChart');
        if (!chartContainer) return;
        
        try {
            const savingsData = this.generateSavingsData(metrics);
            const chartHtml = this.createSavingsChartHTML(savingsData);
            chartContainer.innerHTML = chartHtml;
            
        } catch (error) {
            console.error('Error updating savings chart:', error);
            chartContainer.innerHTML = '<div class="error-state">Failed to load chart</div>';
        }
    }
    
    generateSavingsData(metrics) {
        // Generate sample savings distribution data
        return [
            { label: '< 30 min', value: 25, color: '#ef4444' },
            { label: '30-60 min', value: 30, color: '#f59e0b' },
            { label: '1-2 hours', value: 35, color: '#22c55e' },
            { label: '2+ hours', value: 10, color: '#6366f1' }
        ];
    }
    
    createSavingsChartHTML(data) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        const segments = data.map(item => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            return {
                ...item,
                percentage,
                startAngle,
                endAngle: currentAngle
            };
        });
        
        const legend = segments.map(segment => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 12px; height: 12px; background: ${segment.color}; border-radius: 2px;"></div>
                <span style="font-size: 0.875rem; color: #64748b;">${segment.label}: ${segment.percentage.toFixed(1)}%</span>
            </div>
        `).join('');
        
        return `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; gap: 40px;">
                <div style="position: relative; width: 180px; height: 180px;">
                    <svg width="180" height="180" style="transform: rotate(-90deg);">
                        ${this.createPieSlices(segments)}
                    </svg>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 16px; font-weight: 600; color: #1e293b;">Time Savings Distribution</h4>
                    ${legend}
                </div>
            </div>
        `;
    }
    
    createPieSlices(segments) {
        return segments.map(segment => {
            const radius = 70;
            const centerX = 90;
            const centerY = 90;
            
            const startAngleRad = (segment.startAngle * Math.PI) / 180;
            const endAngleRad = (segment.endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = segment.endAngle - segment.startAngle <= 180 ? 0 : 1;
            
            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            
            return `<path d="${pathData}" fill="${segment.color}" stroke="white" stroke-width="2"/>`;
        }).join('');
    }
    
    updateInsights(metrics) {
        const insightsContainer = document.getElementById('insights');
        if (!insightsContainer) return;
        
        const insights = this.generateInsights(metrics);
        
        if (insights.length === 0) {
            insightsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">No insights available</div>';
            return;
        }
        
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.severity}">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-message">${insight.message}</div>
                ${insight.action ? `<div class="insight-action">${insight.action}</div>` : ''}
            </div>
        `).join('');
    }
    
    generateInsights(metrics) {
        const insights = [];
        
        // User retention insights
        if (metrics.success?.userRetention) {
            const retention = metrics.success.userRetention;
            if (retention.current < retention.target) {
                insights.push({
                    severity: 'warning',
                    title: 'User Retention Below Target',
                    message: `Current retention rate (${retention.current.toFixed(1)}%) is below the ${retention.target}% target.`,
                    action: 'Review onboarding experience and identify user pain points'
                });
            } else {
                insights.push({
                    severity: 'success',
                    title: 'Strong User Retention',
                    message: `Retention rate (${retention.current.toFixed(1)}%) exceeds target. Great job!`,
                    action: 'Maintain current strategies and consider raising targets'
                });
            }
        }
        
        // Support ticket insights
        if (metrics.success?.supportTickets) {
            const support = metrics.success.supportTickets;
            if (!support.achieved) {
                insights.push({
                    severity: 'critical',
                    title: 'High Support Ticket Rate',
                    message: `Support tickets (${support.current.toFixed(1)}%) exceed the ${support.target}% threshold.`,
                    action: 'Identify and fix common issues causing support requests'
                });
            }
        }
        
        // Multi-directory usage insights
        if (metrics.success?.multiDirectoryUsage) {
            const multiDir = metrics.success.multiDirectoryUsage;
            if (!multiDir.achieved) {
                insights.push({
                    severity: 'info',
                    title: 'Multi-Directory Usage Opportunity',
                    message: `Only ${multiDir.current.toFixed(1)}% of users utilize multiple directories.`,
                    action: 'Improve directory discovery and showcase benefits'
                });
            }
        }
        
        // Time savings insights
        if (metrics.success?.timeSavings) {
            const timeSavings = metrics.success.timeSavings;
            if (timeSavings.achieved) {
                insights.push({
                    severity: 'success',
                    title: 'Excellent Time Savings',
                    message: `Users save an average of ${(timeSavings.current / 60).toFixed(1)} hours each.`,
                    action: 'Consider promoting these results to attract new users'
                });
            }
        }
        
        return insights.slice(0, 5); // Limit to 5 insights
    }
    
    updateAlerts(metrics) {
        const alertsContainer = document.getElementById('alerts');
        if (!alertsContainer) return;
        
        const alerts = this.generateAlerts(metrics);
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">No recent alerts</div>';
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item">
                <div class="alert-icon" style="background: ${this.getAlertColor(alert.level)};"></div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
    
    generateAlerts(metrics) {
        const alerts = [];
        const now = Date.now();
        
        // Generate sample alerts based on metrics
        if (metrics.success?.supportTickets && !metrics.success.supportTickets.achieved) {
            alerts.push({
                level: 'critical',
                title: 'Support Tickets Above Threshold',
                message: 'Support ticket rate has exceeded the target threshold',
                timestamp: now - 300000 // 5 minutes ago
            });
        }
        
        if (metrics.success?.userRetention && metrics.success.userRetention.current < 50) {
            alerts.push({
                level: 'warning',
                title: 'Low User Retention Detected',
                message: 'User retention has dropped below acceptable levels',
                timestamp: now - 900000 // 15 minutes ago
            });
        }
        
        // Performance alert (sample)
        alerts.push({
            level: 'info',
            title: 'Dashboard Updated',
            message: 'Analytics data has been refreshed with latest metrics',
            timestamp: now - 30000 // 30 seconds ago
        });
        
        return alerts.slice(0, 5); // Limit to 5 alerts
    }
    
    getAlertColor(level) {
        const colors = {
            critical: '#ef4444',
            warning: '#f59e0b',
            info: '#0ea5e9',
            success: '#22c55e'
        };
        return colors[level] || colors.info;
    }
    
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
    
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleString();
        }
    }
    
    changeTimeRange(range) {
        // Update active button
        document.querySelectorAll('.time-selector').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
        
        this.currentTimeRange = range;
        this.refreshDashboard();
    }
    
    async refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }
    
    startAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Start new timer
        this.refreshTimer = setInterval(() => {
            if (!document.hidden) {
                this.refreshDashboard();
            }
        }, this.config.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    calculateChange(metric) {
        // This would calculate actual change from previous period
        // For now, return random values for demonstration
        return (Math.random() - 0.5) * 20; // -10% to +10%
    }
    
    getDaysInRange(range) {
        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        return days[range] || 7;
    }
    
    showErrorState(message) {
        const successMetrics = document.getElementById('successMetrics');
        if (successMetrics) {
            successMetrics.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">⚠️</div>
                    <div>${message}</div>
                    <button class="refresh-btn" onclick="location.reload()" style="margin-top: 16px;">
                        Reload Dashboard
                    </button>
                </div>
            `;
        }
    }
}

// Mock Analytics for testing when real analytics not available
class MockAnalytics {
    async init() {
        console.log('🧪 Using mock analytics data');
    }
    
    async getMetrics(timeRange) {
        // Return mock data structure
        return {
            success: {
                userRetention: {
                    current: 72.5,
                    target: 60,
                    achieved: true,
                    percentage: 121
                },
                supportTickets: {
                    current: 3.2,
                    target: 5,
                    achieved: true,
                    percentage: 64
                },
                multiDirectoryUsage: {
                    current: 68.8,
                    target: 70,
                    achieved: false,
                    percentage: 98
                },
                timeSavings: {
                    current: 145,
                    target: 120,
                    achieved: true,
                    percentage: 121
                }
            },
            overview: {
                totalUsers: 1247,
                activeToday: 89,
                totalEvents: 15637,
                activeUsers: 234
            },
            timeSavings: {
                totalForms: 3456,
                totalTimeSaved: {
                    hours: 1823.5
                }
            },
            performance: {
                forms: new Array(150) // Mock 150 processed forms
            }
        };
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AnalyticsDashboard();
    });
} else {
    new AnalyticsDashboard();
}