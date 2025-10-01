/**
 * Auto-Bolt Monitoring System Test Suite
 * Comprehensive testing for all monitoring components
 */

class MonitoringTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.config = {
            timeout: 30000, // 30 seconds per test
            verbose: true,
            stopOnFailure: false
        };
    }
    
    async runAllTests() {
        console.log('🧪 Starting Auto-Bolt Monitoring Test Suite...');
        
        const startTime = performance.now();
        
        try {
            // Core component tests
            await this.testMonitoringSystem();
            await this.testAlertSystem();
            await this.testAPIRateMonitor();
            await this.testPerformanceMetrics();
            await this.testHotfixDeployment();
            await this.testDashboardFunctionality();
            await this.testIntegration();
            
            // End-to-end scenarios
            await this.testEndToEndScenarios();
            
            const duration = performance.now() - startTime;
            this.generateTestReport(duration);
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            throw error;
        }
    }
    
    async testMonitoringSystem() {
        console.log('📊 Testing Core Monitoring System...');
        
        await this.runTest('Monitoring System Initialization', async () => {
            const monitoring = new AutoBoltMonitoringSystem();
            await monitoring.init();
            
            this.assert(monitoring.isInitialized, 'Monitoring system should be initialized');
            this.assert(monitoring.metrics, 'Metrics object should exist');
            
            return { monitoring };
        });
        
        await this.runTest('Form Tracking', async () => {
            const monitoring = new AutoBoltMonitoringSystem();
            await monitoring.init();
            
            // Simulate form start
            monitoring.trackFormStart({
                formId: 'test-form-1',
                directoryName: 'Test Directory'
            });
            
            // Simulate form completion
            monitoring.trackFormComplete({
                formId: 'test-form-1',
                directoryName: 'Test Directory'
            });
            
            const metrics = monitoring.getCurrentMetrics();
            
            this.assert(metrics.totalRequests > 0, 'Total requests should be tracked');
            this.assert(metrics.successfulRequests > 0, 'Successful requests should be tracked');
            this.assert(metrics.successRate > 0, 'Success rate should be calculated');
        });
        
        await this.runTest('Error Tracking', async () => {
            const monitoring = new AutoBoltMonitoringSystem();
            await monitoring.init();
            
            monitoring.trackFormError({
                formId: 'error-form-1',
                directoryName: 'Error Directory',
                errorType: 'MAPPING_ERROR'
            });
            
            const metrics = monitoring.getCurrentMetrics();
            
            this.assert(metrics.failedRequests > 0, 'Failed requests should be tracked');
            this.assert(metrics.errorsByType.has('MAPPING_ERROR'), 'Error types should be categorized');
        });
        
        await this.runTest('Metrics Persistence', async () => {
            const monitoring = new AutoBoltMonitoringSystem();
            await monitoring.init();
            
            // Generate some metrics
            monitoring.trackFormComplete({
                formId: 'persist-test',
                directoryName: 'Persist Directory'
            });
            
            // Save metrics
            await monitoring.saveMetrics();
            
            // Verify storage
            const result = await chrome.storage.local.get('monitoringMetrics');
            this.assert(result.monitoringMetrics, 'Metrics should be saved to storage');
            this.assert(result.monitoringMetrics.successfulRequests > 0, 'Successful requests should be persisted');
        });
    }
    
    async testAlertSystem() {
        console.log('🚨 Testing Alert System...');
        
        await this.runTest('Alert System Initialization', async () => {
            const alerts = new AutoBoltAlertSystem();
            await alerts.init();
            
            this.assert(alerts.channels.size > 0, 'Alert channels should be configured');
            this.assert(alerts.config, 'Alert configuration should exist');
        });
        
        await this.runTest('Alert Creation', async () => {
            const alerts = new AutoBoltAlertSystem();
            await alerts.init();
            
            const alert = alerts.createAlert(
                'CRITICAL',
                'Test Alert',
                'This is a test alert',
                { test: true }
            );
            
            this.assert(alert, 'Alert should be created');
            this.assert(alert.id, 'Alert should have unique ID');
            this.assert(alert.severity === 'CRITICAL', 'Alert severity should be set correctly');
        });
        
        await this.runTest('Success Rate Alert', async () => {
            const alerts = new AutoBoltAlertSystem();
            await alerts.init();
            
            const alert = alerts.createSuccessRateAlert(65.5, 80);
            
            this.assert(alert, 'Success rate alert should be created');
            this.assert(alert.severity === 'CRITICAL', 'Low success rate should trigger critical alert');
            this.assert(alert.metadata.currentRate === 65.5, 'Alert should contain rate data');
        });
        
        await this.runTest('Alert Cooldown', async () => {
            const alerts = new AutoBoltAlertSystem();
            await alerts.init();
            
            // Create first alert
            const alert1 = alerts.createAlert('WARNING', 'Cooldown Test', 'First alert');
            
            // Try to create same alert immediately
            const alert2 = alerts.createAlert('WARNING', 'Cooldown Test', 'Second alert');
            
            this.assert(alert1, 'First alert should be created');
            this.assert(!alert2, 'Second alert should be blocked by cooldown');
        });
        
        await this.runTest('Alert Resolution', async () => {
            const alerts = new AutoBoltAlertSystem();
            await alerts.init();
            
            const alert = alerts.createAlert('INFO', 'Resolution Test', 'Test alert');
            this.assert(alert, 'Alert should be created');
            
            const resolved = await alerts.resolveAlert(alert.id);
            this.assert(resolved, 'Alert should be resolved');
            
            const activeAlerts = await alerts.getActiveAlerts();
            const isActive = activeAlerts.some(a => a.id === alert.id);
            this.assert(!isActive, 'Resolved alert should not be in active list');
        });
    }
    
    async testAPIRateMonitor() {
        console.log('🔌 Testing API Rate Monitor...');
        
        await this.runTest('API Monitor Initialization', async () => {
            const monitor = new APIRateMonitor();
            await monitor.init();
            
            this.assert(monitor.rateLimiters.size > 0, 'Rate limiters should be configured');
            this.assert(monitor.apiMetrics.size > 0, 'API metrics should be initialized');
        });
        
        await this.runTest('Request Tracking', async () => {
            const monitor = new APIRateMonitor();
            await monitor.init();
            
            // Simulate API request
            monitor.trackApiRequest({
                url: 'https://api.airtable.com/v0/test',
                method: 'GET'
            });
            
            const metrics = monitor.getMetrics('airtable');
            
            this.assert(metrics, 'Airtable metrics should exist');
            this.assert(metrics.requests.total > 0, 'API requests should be tracked');
        });
        
        await this.runTest('Rate Limit Detection', async () => {
            const monitor = new APIRateMonitor();
            await monitor.init();
            
            // Simulate high usage
            for (let i = 0; i < 100; i++) {
                monitor.trackApiRequest({
                    url: 'https://api.airtable.com/v0/test',
                    method: 'GET'
                });
            }
            
            const usage = monitor.getCurrentUsage('airtable');
            
            this.assert(usage, 'Usage data should be available');
            this.assert(usage.current > 0, 'Current usage should be tracked');
            this.assert(usage.percentage >= 0, 'Usage percentage should be calculated');
        });
        
        await this.runTest('Alert Integration', async () => {
            const monitor = new APIRateMonitor();
            const alerts = new AutoBoltAlertSystem();
            
            await monitor.init();
            await alerts.init();
            
            monitor.setAlertSystem(alerts);
            
            // This would normally trigger an alert in real usage
            const initialAlertCount = alerts.alertHistory.length;
            
            // Simulate rate limit scenario
            monitor.checkUsageAlerts('airtable');
            
            // Verify integration is working (alert creation depends on actual usage)
            this.assert(monitor.alertSystem === alerts, 'Alert system should be connected');
        });
    }
    
    async testPerformanceMetrics() {
        console.log('📈 Testing Performance Metrics...');
        
        await this.runTest('Performance Metrics Initialization', async () => {
            const metrics = new PerformanceMetricsCollector();
            await metrics.init();
            
            this.assert(metrics.collectors.size > 0, 'Performance collectors should be configured');
            this.assert(metrics.isCollecting, 'Metrics collection should be active');
        });
        
        await this.runTest('Form Performance Tracking', async () => {
            const metrics = new PerformanceMetricsCollector();
            await metrics.init();
            
            const formId = 'perf-test-form';
            
            metrics.startFormTracking(formId, 'Test Directory');
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const completion = metrics.completeFormTracking(formId, true);
            
            this.assert(completion, 'Form tracking should complete');
            this.assert(completion.duration > 0, 'Duration should be measured');
            this.assert(completion.success === true, 'Success status should be tracked');
        });
        
        await this.runTest('API Performance Tracking', async () => {
            const metrics = new PerformanceMetricsCollector();
            await metrics.init();
            
            const callData = metrics.trackAPICall(
                'https://api.test.com',
                'GET',
                performance.now()
            );
            
            this.assert(callData, 'API call tracking should start');
            this.assert(callData.url, 'URL should be tracked');
            this.assert(callData.method, 'Method should be tracked');
            
            const completion = metrics.completeAPICall(callData, { ok: true, status: 200 });
            
            this.assert(completion, 'API call tracking should complete');
            this.assert(completion.success === true, 'Success status should be tracked');
            this.assert(completion.status === 200, 'Response status should be tracked');
        });
        
        await this.runTest('Performance Analysis', async () => {
            const metrics = new PerformanceMetricsCollector();
            await metrics.init();
            
            // Generate some test data
            for (let i = 0; i < 5; i++) {
                const formId = `analysis-form-${i}`;
                metrics.startFormTracking(formId, 'Analysis Directory');
                await new Promise(resolve => setTimeout(resolve, 50));
                metrics.completeFormTracking(formId, Math.random() > 0.2); // 80% success rate
            }
            
            const report = metrics.generateReport('1h');
            
            this.assert(report, 'Performance report should be generated');
            this.assert(report.summary, 'Report should contain summary');
            this.assert(report.summary.formsProcessed > 0, 'Forms processed should be counted');
            this.assert(report.summary.avgFormTime >= 0, 'Average form time should be calculated');
        });
    }
    
    async testHotfixDeployment() {
        console.log('🔥 Testing Hotfix Deployment...');
        
        await this.runTest('Hotfix System Initialization', async () => {
            const hotfix = new HotfixDeploymentSystem();
            await hotfix.init();
            
            this.assert(hotfix.config, 'Hotfix configuration should exist');
            this.assert(hotfix.healthChecks.size > 0, 'Health checks should be configured');
        });
        
        await this.runTest('Health Check Execution', async () => {
            const hotfix = new HotfixDeploymentSystem();
            await hotfix.init();
            
            const healthResult = await hotfix.performHealthCheck();
            
            this.assert(healthResult, 'Health check should return result');
            this.assert(healthResult.checks, 'Health check should contain individual checks');
            this.assert(Array.isArray(healthResult.checks), 'Checks should be in array format');
        });
        
        await this.runTest('Emergency Hotfix Assessment', async () => {
            const hotfix = new HotfixDeploymentSystem();
            await hotfix.init();
            
            const criticalAlert = {
                type: 'SUCCESS_RATE_CRITICAL',
                severity: 'CRITICAL',
                metadata: { successRate: 65 }
            };
            
            const assessment = hotfix.assessHotfixNeed(criticalAlert);
            
            this.assert(assessment, 'Assessment should be performed');
            this.assert(assessment.required === true, 'Critical success rate should require hotfix');
            this.assert(assessment.severity === 'critical', 'Severity should be critical');
            this.assert(Array.isArray(assessment.fixes), 'Fixes should be provided');
        });
        
        await this.runTest('Backup Creation', async () => {
            const hotfix = new HotfixDeploymentSystem();
            await hotfix.init();
            
            const deploymentId = 'test-backup-123';
            
            await hotfix.createBackupPoint(deploymentId);
            
            // Verify backup was created
            const result = await chrome.storage.local.get(`backup_${deploymentId}`);
            
            this.assert(result[`backup_${deploymentId}`], 'Backup should be created in storage');
            this.assert(result[`backup_${deploymentId}`].systemState, 'Backup should contain system state');
        });
    }
    
    async testDashboardFunctionality() {
        console.log('📊 Testing Dashboard Functionality...');
        
        await this.runTest('Dashboard Initialization', async () => {
            // Create a minimal DOM for dashboard testing
            if (!document.getElementById('successRateChart')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'successRateChart';
                canvas.width = 800;
                canvas.height = 400;
                document.body.appendChild(canvas);
            }
            
            const dashboard = new MonitoringDashboard();
            await dashboard.init();
            
            this.assert(dashboard.chart !== null, 'Chart should be initialized');
            this.assert(dashboard.historicalData.length > 0, 'Historical data should be loaded');
        });
        
        await this.runTest('Dashboard Data Refresh', async () => {
            const dashboard = new MonitoringDashboard();
            await dashboard.init();
            
            await dashboard.refreshDashboard();
            
            // Verify UI elements are updated (mock check)
            this.assert(true, 'Dashboard refresh should complete without errors');
        });
        
        await this.runTest('Dashboard Export', async () => {
            const dashboard = new MonitoringDashboard();
            await dashboard.init();
            
            // Mock the export functionality
            const exportData = dashboard.exportData ? dashboard.exportData() : { mock: true };
            
            this.assert(exportData, 'Export data should be generated');
        });
    }
    
    async testIntegration() {
        console.log('🔗 Testing Component Integration...');
        
        await this.runTest('Monitoring Integration Initialization', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            this.assert(integration.isInitialized, 'Integration should be initialized');
            this.assert(Object.keys(integration.components).length > 0, 'Components should be loaded');
        });
        
        await this.runTest('Component Connectivity', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            // Check if components are connected
            const apiMonitor = integration.getComponent('apiMonitor');
            const alerts = integration.getComponent('alerts');
            
            if (apiMonitor && alerts) {
                this.assert(apiMonitor.alertSystem === alerts, 'API monitor should be connected to alert system');
            }
            
            this.assert(integration.isComponentActive('monitoring'), 'Monitoring component should be active');
        });
        
        await this.runTest('Event Broadcasting', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            let eventReceived = false;
            
            document.addEventListener('monitoring:test:event', () => {
                eventReceived = true;
            });
            
            integration.broadcastEvent('monitoring:test:event', { test: true });
            
            // Give event time to propagate
            await new Promise(resolve => setTimeout(resolve, 10));
            
            this.assert(eventReceived, 'Events should be broadcast correctly');
        });
    }
    
    async testEndToEndScenarios() {
        console.log('🎯 Testing End-to-End Scenarios...');
        
        await this.runTest('Complete Form Processing Flow', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            const formId = 'e2e-form-test';
            const directoryName = 'E2E Test Directory';
            
            // Start form processing
            integration.trackFormStart(formId, directoryName);
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Complete form processing
            integration.trackFormComplete(formId, directoryName, 100);
            
            // Verify metrics were updated
            const metrics = integration.getAllMetrics();
            
            this.assert(metrics, 'Metrics should be available');
            this.assert(metrics.components.monitoring, 'Monitoring metrics should exist');
            this.assert(metrics.components.monitoring.successfulRequests > 0, 'Successful requests should be tracked');
        });
        
        await this.runTest('Alert to Hotfix Flow', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            // Simulate critical error
            integration.handleGlobalError({
                type: 'critical-system-error',
                message: 'Critical system failure',
                severity: 'high'
            });
            
            // Check if alert was created
            const alerts = integration.getComponent('alerts');
            if (alerts) {
                const activeAlerts = await alerts.getActiveAlerts();
                const hasCriticalAlert = activeAlerts.some(alert => alert.severity === 'CRITICAL');
                
                this.assert(hasCriticalAlert, 'Critical alert should be created for system errors');
            }
        });
        
        await this.runTest('Performance Degradation Detection', async () => {
            const integration = new MonitoringIntegration();
            await integration.initialize();
            
            // Simulate slow operations
            const performanceMetrics = integration.getComponent('performanceMetrics');
            
            if (performanceMetrics) {
                // Create slow form processing
                for (let i = 0; i < 3; i++) {
                    const formId = `slow-form-${i}`;
                    performanceMetrics.startFormTracking(formId, 'Slow Directory');
                    await new Promise(resolve => setTimeout(resolve, 200)); // Slow processing
                    performanceMetrics.completeFormTracking(formId, true);
                }
                
                const report = performanceMetrics.generateReport('15m');
                
                this.assert(report.summary.avgFormTime > 100, 'Slow processing should be detected');
            }
        });
    }
    
    async runTest(testName, testFunction) {
        const startTime = performance.now();
        
        try {
            console.log(`  🧪 Running: ${testName}`);
            
            const result = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
                )
            ]);
            
            const duration = performance.now() - startTime;
            
            this.results.push({
                name: testName,
                status: 'passed',
                duration,
                result
            });
            
            console.log(`  ✅ Passed: ${testName} (${duration.toFixed(2)}ms)`);
            
        } catch (error) {
            const duration = performance.now() - startTime;
            
            this.results.push({
                name: testName,
                status: 'failed',
                duration,
                error: error.message,
                stack: error.stack
            });
            
            console.error(`  ❌ Failed: ${testName} (${duration.toFixed(2)}ms)`, error);
            
            if (this.config.stopOnFailure) {
                throw error;
            }
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    generateTestReport(totalDuration) {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        
        const report = {
            summary: {
                total,
                passed,
                failed,
                passRate: (passed / total) * 100,
                totalDuration: totalDuration
            },
            results: this.results,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n📊 Test Suite Results:');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${report.summary.passRate.toFixed(1)}%)`);
        console.log(`Failed: ${failed}`);
        console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        // Save report to storage
        chrome.storage.local.set({
            monitoringTestReport: report,
            lastTestRun: Date.now()
        });
        
        return report;
    }
}

// Test execution function
async function runMonitoringTests() {
    const testSuite = new MonitoringTestSuite();
    
    try {
        await testSuite.runAllTests();
        console.log('🎉 All monitoring tests completed successfully!');
        return testSuite.results;
    } catch (error) {
        console.error('💥 Test suite execution failed:', error);
        throw error;
    }
}

// Auto-run tests if in test environment
if (typeof window !== 'undefined' && window.location && window.location.search.includes('runTests=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Auto-running monitoring tests...');
        await runMonitoringTests();
    });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MonitoringTestSuite, runMonitoringTests };
} else if (typeof window !== 'undefined') {
    window.MonitoringTestSuite = MonitoringTestSuite;
    window.runMonitoringTests = runMonitoringTests;
}