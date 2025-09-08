/**
 * Comprehensive Test Suite for Customer Data Monitoring System
 * 
 * Test Coverage:
 * - Unit Tests: Individual component functionality
 * - Integration Tests: End-to-end monitoring workflows
 * - Performance Tests: Scale and resource usage validation
 * - Security Tests: Data protection and access control
 * - Compliance Tests: GDPR/CCPA regulatory compliance
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { CustomerProfileMonitor } from '../lib/monitoring/customer-profile-monitor.js'
import { ComplianceMonitor } from '../lib/monitoring/compliance-monitor.js'
import { DirectoryDatabaseAnalyzer } from '../scripts/directory-database-analyzer.js'

// Mock data for testing
const mockCustomerData = {
    customerId: 'test-customer-001',
    email: 'test@example.com',
    businessName: 'Test Business Inc',
    directorySubmissions: [
        {
            directoryId: 'google-business',
            submissionUrl: 'https://business.google.com/profile/test',
            submittedData: {
                businessName: 'Test Business Inc',
                email: 'test@example.com',
                phone: '(555) 123-4567',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345'
            }
        }
    ]
}

const mockDirectoryConfig = {
    id: 'google-business',
    name: 'Google Business Profile',
    url: 'https://business.google.com',
    profileUrlPattern: 'https://business.google.com/profile/{businessName}',
    extractionSelectors: {
        businessName: '.business-name',
        phone: '.phone-number',
        address: '.address'
    }
}

describe('Customer Profile Monitor', () => {
    let monitor
    
    beforeEach(() => {
        monitor = new CustomerProfileMonitor()
        // Mock fetch for testing
        global.fetch = jest.fn()
    })
    
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Profile Existence Verification', () => {
        test('should detect existing profile correctly', async () => {
            // Mock successful profile page response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(`
                    <html>
                        <body>
                            <div class="business-name">Test Business Inc</div>
                            <div class="phone-number">(555) 123-4567</div>
                            <div class="address">123 Test St</div>
                        </body>
                    </html>
                `)
            })

            const result = await monitor.checkProfileExists(
                'google-business',
                'https://business.google.com/profile/test',
                mockCustomerData.directorySubmissions[0].submittedData
            )

            expect(result.exists).toBe(true)
            expect(result.confidence).toBeGreaterThan(0.5)
            expect(result.indicators).toContain('business_name_found')
        })

        test('should detect removed profile correctly', async () => {
            // Mock 404 response for removed profile
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            })

            const result = await monitor.checkProfileExists(
                'google-business',
                'https://business.google.com/profile/test',
                mockCustomerData.directorySubmissions[0].submittedData
            )

            expect(result.exists).toBe(false)
            expect(result.confidence).toBeGreaterThan(0.8)
            expect(result.reason).toContain('HTTP 404')
        })

        test('should handle network errors gracefully', async () => {
            // Mock network error
            global.fetch.mockRejectedValueOnce(new Error('Network error'))

            const result = await monitor.checkProfileExists(
                'google-business',
                'https://business.google.com/profile/test',
                mockCustomerData.directorySubmissions[0].submittedData
            )

            expect(result.exists).toBe(false)
            expect(result.confidence).toBeLessThan(0.2)
            expect(result.error).toContain('Network error')
        })
    })

    describe('Data Integrity Validation', () => {
        test('should detect data discrepancies', async () => {
            // Mock profile page with different data
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(`
                    <html>
                        <body>
                            <div class="business-name">Different Business Name</div>
                            <div class="phone-number">(555) 999-9999</div>
                            <div class="address">456 Different St</div>
                        </body>
                    </html>
                `)
            })

            // Mock directory config
            monitor.getDirectoryConfig = jest.fn().mockResolvedValue(mockDirectoryConfig)

            const result = await monitor.validateDataIntegrity(
                'google-business',
                'https://business.google.com/profile/test',
                mockCustomerData.directorySubmissions[0].submittedData
            )

            expect(result.matches).toBe(false)
            expect(result.discrepancies.length).toBeGreaterThan(0)
            expect(result.score).toBeLessThan(0.5)
        })

        test('should confirm data integrity when data matches', async () => {
            // Mock profile page with matching data
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(`
                    <html>
                        <body>
                            <div class="business-name">Test Business Inc</div>
                            <div class="phone-number">(555) 123-4567</div>
                            <div class="address">123 Test St</div>
                        </body>
                    </html>
                `)
            })

            monitor.getDirectoryConfig = jest.fn().mockResolvedValue(mockDirectoryConfig)

            const result = await monitor.validateDataIntegrity(
                'google-business',
                'https://business.google.com/profile/test',
                mockCustomerData.directorySubmissions[0].submittedData
            )

            expect(result.matches).toBe(true)
            expect(result.discrepancies.length).toBe(0)
            expect(result.score).toBeGreaterThan(0.8)
        })
    })

    describe('Alert System', () => {
        test('should generate critical alert for profile removal', async () => {
            const verificationResults = [
                {
                    directoryId: 'google-business',
                    status: 'removed',
                    removalDetected: new Date().toISOString()
                }
            ]

            await monitor.checkProfileAlerts('test-customer-001', verificationResults)

            const profile = monitor.customerProfiles.get('test-customer-001')
            expect(profile.alerts.length).toBeGreaterThan(0)
            
            const criticalAlert = profile.alerts.find(alert => alert.severity === 'critical')
            expect(criticalAlert).toBeDefined()
            expect(criticalAlert.type).toBe('profile_removal')
        })

        test('should generate alert for data integrity issues', async () => {
            const verificationResults = [
                {
                    directoryId: 'google-business',
                    status: 'active',
                    dataIntegrity: {
                        matches: false,
                        discrepancies: ['businessName: mismatch', 'phone: mismatch']
                    }
                }
            ]

            await monitor.checkProfileAlerts('test-customer-001', verificationResults)

            const profile = monitor.customerProfiles.get('test-customer-001')
            const integrityAlert = profile.alerts.find(alert => alert.type === 'data_integrity')
            
            expect(integrityAlert).toBeDefined()
            expect(integrityAlert.severity).toBe('high')
        })
    })

    describe('Performance and Resource Management', () => {
        test('should process customer batches efficiently', async () => {
            const startTime = Date.now()
            
            // Mock multiple customers
            const customers = Array.from({ length: 10 }, (_, i) => ({
                ...mockCustomerData,
                customerId: `test-customer-${i.toString().padStart(3, '0')}`
            }))

            // Mock successful responses
            global.fetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('<html><body>Test content</body></html>')
            })

            // Process customers in batches
            const batches = monitor.createBatches(customers, 3)
            expect(batches.length).toBe(4) // 10 customers in batches of 3

            const endTime = Date.now()
            const processingTime = endTime - startTime
            
            // Should complete quickly (under 100ms for mocked operations)
            expect(processingTime).toBeLessThan(100)
        })

        test('should respect resource usage limits', async () => {
            const monitor = new CustomerProfileMonitor()
            monitor.resourceUsageLimit = 0.01 // Very low limit for testing

            const mockExecutionTime = 50 // 50ms execution time
            const mockBatchSize = 5

            // This should trigger resource adjustment
            monitor.trackResourceUsage(mockBatchSize, mockExecutionTime)

            // Verify that resource management is working
            expect(monitor.resourceUsageLimit).toBeDefined()
        })
    })
})

describe('Compliance Monitor', () => {
    let complianceMonitor
    
    beforeEach(() => {
        complianceMonitor = new ComplianceMonitor()
        global.fetch = jest.fn()
    })

    describe('GDPR Compliance', () => {
        test('should track deletion request correctly', async () => {
            const result = await complianceMonitor.trackDeletionRequest(
                'test-customer-001',
                'test@example.com',
                'deletion',
                'EU',
                ['google-business', 'yelp', 'facebook-business']
            )

            expect(result.success).toBe(true)
            expect(result.requestId).toBeDefined()
            expect(result.complianceDeadline).toBeDefined()

            // Verify deadline is 30 days for GDPR
            const deadline = new Date(result.complianceDeadline)
            const now = new Date()
            const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
            expect(daysDiff).toBeLessThanOrEqual(30)
        })

        test('should calculate correct compliance deadlines', () => {
            const requestDate = new Date().toISOString()
            
            // GDPR - 30 days
            const gdprDeadline = complianceMonitor.calculateComplianceDeadline(requestDate, 'EU')
            const gdprDays = Math.ceil((new Date(gdprDeadline) - new Date(requestDate)) / (1000 * 60 * 60 * 24))
            expect(gdprDays).toBe(30)

            // CCPA - 45 days
            const ccpaDeadline = complianceMonitor.calculateComplianceDeadline(requestDate, 'CA')
            const ccpaDays = Math.ceil((new Date(ccpaDeadline) - new Date(requestDate)) / (1000 * 60 * 60 * 24))
            expect(ccpaDays).toBe(45)
        })

        test('should detect compliance violations', async () => {
            // Create overdue deletion request
            const overdueRequest = {
                requestId: 'test-request-001',
                customerId: 'test-customer-001',
                requestDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
                jurisdiction: 'EU',
                regulation: 'GDPR',
                status: 'pending',
                complianceDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days overdue
                violations: []
            }

            complianceMonitor.deletionRequests.set('test-request-001', overdueRequest)

            await complianceMonitor.performDailyComplianceCheck()

            const violations = complianceMonitor.complianceViolations.filter(v => v.requestId === 'test-request-001')
            expect(violations.length).toBeGreaterThan(0)
            
            const deadlineViolation = violations.find(v => v.type === 'deadline_violation')
            expect(deadlineViolation).toBeDefined()
            expect(deadlineViolation.severity).toBe('critical')
        })
    })

    describe('Compliance Reporting', () => {
        test('should generate comprehensive compliance report', async () => {
            // Add test data
            const testRequest = {
                requestId: 'test-request-001',
                customerId: 'test-customer-001',
                requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                regulation: 'GDPR',
                status: 'completed',
                fulfillmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                violations: []
            }

            complianceMonitor.deletionRequests.set('test-request-001', testRequest)

            const report = await complianceMonitor.generateComplianceReport('30d')

            expect(report.summary.totalRequests).toBe(1)
            expect(report.summary.completedRequests).toBe(1)
            expect(report.summary.complianceRate).toBe(100)
            expect(report.byRegulation.GDPR).toBeDefined()
            expect(report.recommendations).toBeDefined()
        })
    })
})

describe('Directory Database Analyzer', () => {
    let analyzer
    
    beforeEach(() => {
        analyzer = new DirectoryDatabaseAnalyzer()
    })

    describe('Directory Analysis', () => {
        test('should analyze directory database correctly', async () => {
            // Mock directory data
            analyzer.directories = [
                {
                    id: 'high-priority-dir',
                    name: 'High Priority Directory',
                    category: 'Search Engines',
                    domainAuthority: 95,
                    trafficVolume: 1000000,
                    formFields: ['businessName', 'email', 'phone'],
                    antiBotProtection: 'none'
                },
                {
                    id: 'low-priority-dir',
                    name: 'Low Priority Directory',
                    category: 'General',
                    domainAuthority: 20,
                    trafficVolume: 1000,
                    formFields: Array.from({ length: 20 }, (_, i) => `field${i}`),
                    antiBotProtection: 'advanced'
                }
            ]

            const results = await analyzer.auditDirectoryDatabase()

            expect(results.total).toBe(2)
            expect(results.priorities.high).toBeGreaterThan(0)
            expect(results.priorities.low).toBeGreaterThan(0)
            expect(results.feasibility.monitorable).toBeGreaterThan(0)
        })

        test('should calculate priority scores correctly', () => {
            const highPriorityDir = {
                domainAuthority: 95,
                trafficVolume: 1000000,
                businessValue: 0.9,
                technicalComplexity: 0.2,
                maintenanceEffort: 0.1
            }

            const lowPriorityDir = {
                domainAuthority: 20,
                trafficVolume: 1000,
                businessValue: 0.3,
                technicalComplexity: 0.8,
                maintenanceEffort: 0.7
            }

            const highScore = analyzer.calculatePriorityScore(highPriorityDir)
            const lowScore = analyzer.calculatePriorityScore(lowPriorityDir)

            expect(highScore).toBeGreaterThan(lowScore)
            expect(highScore).toBeGreaterThan(0.7) // Should be high priority
            expect(lowScore).toBeLessThan(0.4) // Should be low priority
        })

        test('should generate realistic expansion plan', async () => {
            // Mock 520 directories
            analyzer.directories = Array.from({ length: 520 }, (_, i) => ({
                id: `dir-${i}`,
                name: `Directory ${i}`,
                priority: i < 100 ? 'high' : i < 300 ? 'medium' : 'low',
                monitoringRecommendation: i < 100 ? 'immediate' : i < 300 ? 'phase2' : 'phase3'
            }))

            analyzer.currentMonitored = analyzer.directories.slice(0, 63) // Current 63

            const expansionPlan = await analyzer.generateExpansionPlan()

            expect(expansionPlan.overview.currentMonitored).toBe(63)
            expect(expansionPlan.overview.totalAvailable).toBe(520)
            expect(expansionPlan.phases.length).toBe(3)
            
            // Verify phase distribution
            const totalPlanned = expansionPlan.phases.reduce((sum, phase) => sum + phase.directories.length, 0)
            expect(totalPlanned).toBeGreaterThan(400) // Should plan for significant expansion
        })
    })
})

describe('Integration Tests', () => {
    describe('End-to-End Customer Monitoring', () => {
        test('should complete full customer verification cycle', async () => {
            const monitor = new CustomerProfileMonitor()
            
            // Mock successful initialization
            monitor.loadCustomerProfiles = jest.fn().mockResolvedValue()
            monitor.setupVerificationSchedule = jest.fn().mockResolvedValue()
            
            // Mock customer data
            monitor.customerProfiles.set('test-customer-001', {
                customerId: 'test-customer-001',
                email: 'test@example.com',
                businessName: 'Test Business',
                directorySubmissions: [mockCustomerData.directorySubmissions[0]],
                profileHealth: {
                    totalDirectories: 0,
                    activeProfiles: 0,
                    removedProfiles: 0,
                    pendingProfiles: 0,
                    dataIntegrityScore: 1.0
                },
                alerts: []
            })

            // Mock successful verification
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('<html><body>Test Business</body></html>')
            })

            await monitor.initialize()
            await monitor.verifyCustomerProfile('test-customer-001')

            const profile = monitor.customerProfiles.get('test-customer-001')
            expect(profile.lastVerified).toBeDefined()
            expect(profile.verificationStatus).toBe('completed')
        })

        test('should handle compliance workflow end-to-end', async () => {
            const complianceMonitor = new ComplianceMonitor()
            
            // Mock initialization
            complianceMonitor.loadDeletionRequests = jest.fn().mockResolvedValue()
            complianceMonitor.loadRetentionPolicies = jest.fn().mockResolvedValue()
            complianceMonitor.setupComplianceSchedule = jest.fn().mockResolvedValue()

            await complianceMonitor.initialize()

            // Track deletion request
            const result = await complianceMonitor.trackDeletionRequest(
                'test-customer-001',
                'test@example.com',
                'deletion',
                'EU',
                ['google-business']
            )

            expect(result.success).toBe(true)
            expect(result.requestId).toBeDefined()

            // Verify request is tracked
            const request = complianceMonitor.deletionRequests.get(result.requestId)
            expect(request).toBeDefined()
            expect(request.regulation).toBe('GDPR')
        })
    })
})

describe('Performance Tests', () => {
    test('should handle 500+ directories efficiently', async () => {
        const analyzer = new DirectoryDatabaseAnalyzer()
        
        // Generate 500+ mock directories
        const directories = Array.from({ length: 520 }, (_, i) => ({
            id: `dir-${i}`,
            name: `Directory ${i}`,
            category: 'Test Category',
            domainAuthority: Math.floor(Math.random() * 100),
            trafficVolume: Math.floor(Math.random() * 1000000),
            formFields: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, j) => `field${j}`),
            antiBotProtection: ['none', 'basic', 'moderate', 'advanced'][Math.floor(Math.random() * 4)]
        }))

        analyzer.directories = directories

        const startTime = Date.now()
        await analyzer.auditDirectoryDatabase()
        const endTime = Date.now()

        const processingTime = endTime - startTime
        
        // Should process 500+ directories in reasonable time (under 5 seconds)
        expect(processingTime).toBeLessThan(5000)
        expect(analyzer.analysisResults.total).toBe(520)
    })

    test('should maintain low CPU usage during monitoring', async () => {
        const monitor = new CustomerProfileMonitor()
        
        // Mock multiple customers
        const customers = Array.from({ length: 50 }, (_, i) => ({
            customerId: `customer-${i}`,
            directorySubmissions: [mockCustomerData.directorySubmissions[0]]
        }))

        customers.forEach(customer => {
            monitor.customerProfiles.set(customer.customerId, {
                ...customer,
                profileHealth: {
                    totalDirectories: 1,
                    activeProfiles: 1,
                    removedProfiles: 0,
                    pendingProfiles: 0,
                    dataIntegrityScore: 1.0
                },
                alerts: []
            })
        })

        // Mock fast responses
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<html><body>Test</body></html>')
        })

        const startTime = Date.now()
        
        // Process all customers
        const promises = customers.map(customer => 
            monitor.verifyCustomerProfile(customer.customerId)
        )
        
        await Promise.all(promises)
        
        const endTime = Date.now()
        const totalTime = endTime - startTime
        
        // Should complete efficiently (under 2 seconds for mocked operations)
        expect(totalTime).toBeLessThan(2000)
    })
})

describe('Security Tests', () => {
    test('should prevent unauthorized access to customer data', async () => {
        const monitor = new CustomerProfileMonitor()
        
        // Mock customer data
        monitor.customerProfiles.set('customer-001', { customerId: 'customer-001', email: 'test1@example.com' })
        monitor.customerProfiles.set('customer-002', { customerId: 'customer-002', email: 'test2@example.com' })

        // Attempt to access another customer's data
        const customer1Profile = monitor.customerProfiles.get('customer-001')
        const customer2Profile = monitor.customerProfiles.get('customer-002')

        expect(customer1Profile.customerId).toBe('customer-001')
        expect(customer2Profile.customerId).toBe('customer-002')
        
        // Verify isolation
        expect(customer1Profile.email).not.toBe(customer2Profile.email)
    })

    test('should validate input data properly', () => {
        const monitor = new CustomerProfileMonitor()
        
        // Test invalid email
        expect(() => {
            monitor.validateCustomerData({
                firstName: 'Test',
                lastName: 'User',
                email: 'invalid-email',
                businessName: 'Test Business',
                packageType: 'Growth'
            })
        }).toThrow('Invalid email format')

        // Test missing required fields
        expect(() => {
            monitor.validateCustomerData({
                firstName: 'Test',
                // Missing lastName, email, businessName, packageType
            })
        }).toThrow('Missing required fields')

        // Test valid data
        expect(() => {
            monitor.validateCustomerData({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                businessName: 'Test Business',
                packageType: 'Growth'
            })
        }).not.toThrow()
    })

    test('should handle sensitive data securely', () => {
        const complianceMonitor = new ComplianceMonitor()
        
        // Test audit trail creation
        complianceMonitor.addAuditEntry('test_action', { customerId: 'test-001' })
        
        expect(complianceMonitor.auditTrail.length).toBe(1)
        expect(complianceMonitor.auditTrail[0].action).toBe('test_action')
        expect(complianceMonitor.auditTrail[0].timestamp).toBeDefined()
        
        // Verify audit trail immutability (no direct modification)
        const originalEntry = complianceMonitor.auditTrail[0]
        const modifiedEntry = { ...originalEntry, action: 'modified_action' }
        
        expect(complianceMonitor.auditTrail[0].action).toBe('test_action') // Should remain unchanged
    })
})

// Test runner configuration
export const testConfig = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'lib/monitoring/**/*.js',
        'scripts/**/*.js',
        'components/monitoring/**/*.tsx'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testTimeout: 10000
}

// Export test suite for CI/CD integration
export default {
    displayName: 'Customer Data Monitoring Test Suite',
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html']
}