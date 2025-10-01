/**
 * Pattern Performance Monitor for Auto-Bolt Chrome Extension
 * Monitors content script injection performance and resource usage
 * Validates that specific patterns improve performance over broad matching
 */

class PatternPerformanceMonitor {
    constructor() {
        this.metrics = {
            injectionTimes: [],
            memoryUsage: [],
            patternMatches: 0,
            patternMisses: 0,
            scriptLoadTimes: [],
            resourceLoadTimes: [],
            totalInjections: 0
        };
        
        this.performanceThresholds = {
            maxInjectionTime: 100, // ms
            maxMemoryIncrease: 10, // MB
            maxScriptLoadTime: 50, // ms
            minPatternEfficiency: 0.8 // 80% of injections should be useful
        };
        
        this.monitoringStartTime = Date.now();
        this.isMonitoring = false;
    }
    
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.monitoringStartTime = Date.now();
        
        console.log('📊 Pattern Performance Monitoring started...');
        
        // Monitor content script injections
        this.monitorContentScriptInjection();
        
        // Monitor memory usage periodically
        this.startMemoryMonitoring();
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        return {
            started: true,
            timestamp: this.monitoringStartTime
        };
    }
    
    /**
     * Monitor content script injection performance
     */
    monitorContentScriptInjection() {
        // Override the chrome.scripting API if available for monitoring
        if (typeof chrome !== 'undefined' && chrome.scripting) {
            const originalExecuteScript = chrome.scripting.executeScript;
            
            chrome.scripting.executeScript = async (injection) => {
                const startTime = performance.now();
                
                try {
                    const result = await originalExecuteScript.call(chrome.scripting, injection);
                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    
                    this.recordInjectionMetrics(injection, executionTime, true);
                    
                    return result;
                } catch (error) {
                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    
                    this.recordInjectionMetrics(injection, executionTime, false);
                    throw error;
                }
            };
        }
        
        // Monitor document ready states for injection timing
        if (typeof document !== 'undefined') {
            const injectionStartTime = performance.now();
            
            const recordDocumentInjection = () => {
                const injectionTime = performance.now() - injectionStartTime;
                this.metrics.injectionTimes.push(injectionTime);
                this.metrics.totalInjections++;
                
                // Check if this is a relevant directory site
                const isDirectorySite = this.isDirectorySite(window.location.href);
                
                if (isDirectorySite) {
                    this.metrics.patternMatches++;
                } else {
                    this.metrics.patternMisses++;
                }
                
                console.log(`🎯 Content script injection: ${injectionTime.toFixed(2)}ms on ${window.location.hostname} (${isDirectorySite ? 'MATCH' : 'MISS'})`);
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', recordDocumentInjection);
            } else {
                recordDocumentInjection();
            }
        }
    }
    
    /**
     * Check if current URL is a supported directory site
     */
    isDirectorySite(url) {
        const directoryDomains = [
            'business.google.com',
            'sellercentral.amazon.com',
            'business.amazon.com',
            'youtube.com',
            'business.facebook.com',
            'facebook.com/pages',
            'linkedin.com/company',
            'employers.indeed.com',
            'tripadvisor.com/Owners',
            'crunchbase.com',
            'bbb.org',
            'alibaba.com',
            'producthunt.com',
            'business.trustpilot.com',
            'trustpilot.com',
            'yellowpages.com',
            'listings.yellowpages.com',
            'wellfound.com',
            'glassdoor.com',
            'bingplaces.com',
            'angi.com',
            'capterra.com',
            'houzz.com',
            'thumbtack.com',
            'business.yelp.com',
            'yelp.com',
            'mapsconnect.apple.com',
            'business.foursquare.com',
            'foursquare.com',
            'business.waze.com',
            'waze.com',
            'places.here.com',
            'developer.here.com',
            'g2.com',
            'getapp.com',
            'saasworthy.com',
            'stackshare.io',
            'alternativeto.net',
            'betalist.com',
            'indiehackers.com',
            'startupgrind.com',
            'github.com/sindresorhus/awesome',
            'sitejabber.com',
            'uschamber.com',
            'business.nextdoor.com',
            'nextdoor.com',
            'monster.com',
            'etsy.com/sell',
            'partners.shopify.com',
            'shopify.com',
            'ebay.com/business',
            'ebay.com/sl',
            'medium.com',
            'dev.to',
            'news.ycombinator.com',
            'reddit.com/submit',
            'prnewswire.com',
            'business.pinterest.com',
            'pinterest.com',
            'artists.spotify.com',
            'spotify.com',
            'podcasters.apple.com',
            'podcasts.apple.com',
            'business.twitter.com',
            'twitter.com',
            'business.instagram.com',
            'instagram.com',
            'chrome.google.com/webstore/devconsole',
            'smallbusiness.yahoo.com',
            'superpages.com',
            'whitepages.com'
        ];
        
        return directoryDomains.some(domain => url.includes(domain));
    }
    
    /**
     * Record injection metrics
     */
    recordInjectionMetrics(injection, executionTime, success) {
        this.metrics.injectionTimes.push(executionTime);
        this.metrics.totalInjections++;
        
        if (success) {
            this.metrics.patternMatches++;
        } else {
            this.metrics.patternMisses++;
        }
        
        // Log performance warning if injection is slow
        if (executionTime > this.performanceThresholds.maxInjectionTime) {
            console.warn(`⚠️ Slow content script injection: ${executionTime.toFixed(2)}ms`);
        }
    }
    
    /**
     * Start memory usage monitoring
     */
    startMemoryMonitoring() {
        const measureMemory = () => {
            if (performance.memory) {
                const memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
                    timestamp: Date.now()
                };
                
                this.metrics.memoryUsage.push(memoryInfo);
                
                // Keep only last 100 memory measurements
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }
            }
        };
        
        // Take initial measurement
        measureMemory();
        
        // Monitor memory every 30 seconds
        setInterval(measureMemory, 30000);
    }
    
    /**
     * Monitor resource loading performance
     */
    monitorResourceLoading() {
        if (typeof document !== 'undefined') {
            // Monitor script loading times
            const scripts = document.querySelectorAll('script[src*="auto-bolt"]');
            
            scripts.forEach(script => {
                const startTime = performance.now();
                
                script.addEventListener('load', () => {
                    const loadTime = performance.now() - startTime;
                    this.metrics.scriptLoadTimes.push(loadTime);
                    
                    console.log(`📦 Script loaded in ${loadTime.toFixed(2)}ms: ${script.src}`);
                });
                
                script.addEventListener('error', () => {
                    const loadTime = performance.now() - startTime;
                    console.error(`❌ Script failed to load in ${loadTime.toFixed(2)}ms: ${script.src}`);
                });
            });
        }
    }
    
    /**
     * Calculate performance statistics
     */
    calculateStatistics() {
        const stats = {
            injection: this.calculateInjectionStats(),
            memory: this.calculateMemoryStats(),
            efficiency: this.calculateEfficiencyStats(),
            resources: this.calculateResourceStats()
        };
        
        return stats;
    }
    
    /**
     * Calculate injection performance stats
     */
    calculateInjectionStats() {
        if (this.metrics.injectionTimes.length === 0) {
            return { average: 0, min: 0, max: 0, p95: 0, total: 0 };
        }
        
        const sorted = [...this.metrics.injectionTimes].sort((a, b) => a - b);
        
        return {
            average: this.metrics.injectionTimes.reduce((a, b) => a + b, 0) / this.metrics.injectionTimes.length,
            min: Math.min(...this.metrics.injectionTimes),
            max: Math.max(...this.metrics.injectionTimes),
            p95: sorted[Math.floor(sorted.length * 0.95)],
            total: this.metrics.injectionTimes.length
        };
    }
    
    /**
     * Calculate memory usage stats
     */
    calculateMemoryStats() {
        if (this.metrics.memoryUsage.length === 0) {
            return { average: 0, min: 0, max: 0, latest: 0 };
        }
        
        const usedMemories = this.metrics.memoryUsage.map(m => m.used);
        
        return {
            average: usedMemories.reduce((a, b) => a + b, 0) / usedMemories.length,
            min: Math.min(...usedMemories),
            max: Math.max(...usedMemories),
            latest: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].used,
            samples: this.metrics.memoryUsage.length
        };
    }
    
    /**
     * Calculate pattern matching efficiency
     */
    calculateEfficiencyStats() {
        const total = this.metrics.patternMatches + this.metrics.patternMisses;
        
        return {
            totalInjections: total,
            patternMatches: this.metrics.patternMatches,
            patternMisses: this.metrics.patternMisses,
            efficiency: total > 0 ? (this.metrics.patternMatches / total) : 0,
            wastedInjections: this.metrics.patternMisses
        };
    }
    
    /**
     * Calculate resource loading stats
     */
    calculateResourceStats() {
        return {
            scriptLoadTimes: {
                average: this.metrics.scriptLoadTimes.length > 0 
                    ? this.metrics.scriptLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.scriptLoadTimes.length 
                    : 0,
                count: this.metrics.scriptLoadTimes.length
            }
        };
    }
    
    /**
     * Check if performance meets thresholds
     */
    checkPerformanceThresholds() {
        const stats = this.calculateStatistics();
        const issues = [];
        
        // Check injection time
        if (stats.injection.average > this.performanceThresholds.maxInjectionTime) {
            issues.push({
                type: 'slow_injection',
                severity: 'warning',
                actual: stats.injection.average,
                threshold: this.performanceThresholds.maxInjectionTime,
                description: 'Average content script injection time exceeds threshold'
            });
        }
        
        // Check pattern efficiency
        if (stats.efficiency.efficiency < this.performanceThresholds.minPatternEfficiency) {
            issues.push({
                type: 'low_efficiency',
                severity: 'warning',
                actual: stats.efficiency.efficiency,
                threshold: this.performanceThresholds.minPatternEfficiency,
                description: 'Pattern matching efficiency is below target'
            });
        }
        
        // Check script load times
        if (stats.resources.scriptLoadTimes.average > this.performanceThresholds.maxScriptLoadTime) {
            issues.push({
                type: 'slow_script_loading',
                severity: 'info',
                actual: stats.resources.scriptLoadTimes.average,
                threshold: this.performanceThresholds.maxScriptLoadTime,
                description: 'Script loading time exceeds threshold'
            });
        }
        
        return {
            passes: issues.length === 0,
            issues,
            stats
        };
    }
    
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const stats = this.calculateStatistics();
        const thresholdCheck = this.checkPerformanceThresholds();
        const monitoringDuration = Date.now() - this.monitoringStartTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            monitoringDuration: monitoringDuration,
            summary: {
                performanceGrade: this.calculatePerformanceGrade(thresholdCheck),
                totalInjections: this.metrics.totalInjections,
                averageInjectionTime: stats.injection.average,
                patternEfficiency: stats.efficiency.efficiency,
                memoryUsage: stats.memory.latest
            },
            detailed: {
                injection: stats.injection,
                memory: stats.memory,
                efficiency: stats.efficiency,
                resources: stats.resources
            },
            thresholds: {
                results: thresholdCheck,
                configured: this.performanceThresholds
            },
            recommendations: this.generatePerformanceRecommendations(thresholdCheck),
            comparison: this.generateBroadPatternComparison()
        };
        
        return report;
    }
    
    /**
     * Calculate overall performance grade
     */
    calculatePerformanceGrade(thresholdCheck) {
        if (!thresholdCheck.passes) {
            const criticalIssues = thresholdCheck.issues.filter(i => i.severity === 'critical').length;
            const warningIssues = thresholdCheck.issues.filter(i => i.severity === 'warning').length;
            
            if (criticalIssues > 0) return 'F';
            if (warningIssues > 2) return 'D';
            if (warningIssues > 1) return 'C';
            if (warningIssues > 0) return 'B';
        }
        
        // Check efficiency
        const efficiency = thresholdCheck.stats.efficiency.efficiency;
        if (efficiency >= 0.95) return 'A+';
        if (efficiency >= 0.90) return 'A';
        if (efficiency >= 0.80) return 'B';
        if (efficiency >= 0.70) return 'C';
        if (efficiency >= 0.60) return 'D';
        
        return 'F';
    }
    
    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations(thresholdCheck) {
        const recommendations = [];
        
        thresholdCheck.issues.forEach(issue => {
            switch (issue.type) {
                case 'slow_injection':
                    recommendations.push({
                        priority: 'high',
                        action: 'Optimize content script loading and execution',
                        details: 'Consider lazy loading scripts or reducing initial script size'
                    });
                    break;
                    
                case 'low_efficiency':
                    recommendations.push({
                        priority: 'medium',
                        action: 'Refine URL patterns to reduce wasted injections',
                        details: 'Add more specific path restrictions to patterns'
                    });
                    break;
                    
                case 'slow_script_loading':
                    recommendations.push({
                        priority: 'low',
                        action: 'Optimize script delivery and caching',
                        details: 'Consider script minification or CDN delivery'
                    });
                    break;
            }
        });
        
        return recommendations;
    }
    
    /**
     * Generate comparison with broad pattern approach
     */
    generateBroadPatternComparison() {
        const currentEfficiency = this.metrics.patternMatches / (this.metrics.patternMatches + this.metrics.patternMisses);
        
        return {
            currentApproach: {
                type: 'specific_patterns',
                efficiency: currentEfficiency,
                wastedInjections: this.metrics.patternMisses,
                targetedSites: this.metrics.patternMatches
            },
            broadPatternApproach: {
                type: 'https://*/*',
                estimatedEfficiency: 0.001, // Would inject on 99.9% irrelevant sites
                estimatedWastedInjections: 'Very High',
                securityRisk: 'High',
                performanceImpact: 'High'
            },
            improvement: {
                efficiencyGain: `${((currentEfficiency - 0.001) * 100).toFixed(1)}%`,
                securityImprovement: 'Significant - Limited to business directories only',
                performanceImprovement: 'Major - Eliminates unnecessary script injection'
            }
        };
    }
    
    /**
     * Stop monitoring and generate final report
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        const report = this.generatePerformanceReport();
        
        console.log('📊 Performance Monitoring stopped');
        console.log('📋 Final Performance Report:', report.summary);
        
        return report;
    }
}

// Create singleton instance
const performanceMonitor = new PatternPerformanceMonitor();

// Auto-start monitoring if in extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    performanceMonitor.startMonitoring();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternPerformanceMonitor;
}

// Global access
globalThis.PatternPerformanceMonitor = PatternPerformanceMonitor;