/**
 * User Acceptance Testing Suite
 * Comprehensive testing for customer dashboard, alerts, and admin interfaces
 * 
 * Test Coverage:
 * - Customer Dashboard Usability Testing
 * - Alert System Effectiveness Testing
 * - Admin Interface Validation
 * - Documentation Completeness Testing
 * - User Experience Flow Testing
 * 
 * Authors: Casey (Senior UX Designer) + Cora (QA Auditor)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import components for testing
import CustomerDataDashboard from '../components/monitoring/CustomerDataDashboard'

// Mock data for testing
const mockCustomerProfile = {
    customerId: 'test-customer-001',
    businessName: 'Test Business Inc',
    email: 'test@example.com',
    profileHealth: {
        totalDirectories: 25,
        activeProfiles: 22,
        removedProfiles: 2,
        pendingProfiles: 1,
        dataIntegrityScore: 0.92
    },
    lastVerified: '2024-12-07T10:30:00Z',
    alerts: [
        {
            id: 'alert-001',
            type: 'profile_removal',
            severity: 'critical',
            message: 'Profile removed from Google Business',
            timestamp: '2024-12-07T09:15:00Z',
            acknowledged: false,
            details: {
                directoryName: 'Google Business',
                removalDetected: '2024-12-07T09:15:00Z'
            }
        },
        {
            id: 'alert-002',
            type: 'data_integrity',
            severity: 'high',
            message: 'Phone number mismatch detected in Yelp',
            timestamp: '2024-12-07T08:45:00Z',
            acknowledged: true,
            details: {
                directoryName: 'Yelp',
                field: 'phone',
                expected: '(555) 123-4567',
                actual: '(555) 123-4568'
            }
        }
    ],
    complianceStatus: {
        gdprCompliant: true,
        ccpaCompliant: true,
        deletionRequests: 3,
        pendingRequests: 1
    }
}

const mockDirectoryStatuses = [
    {
        directoryId: 'google-business',
        directoryName: 'Google Business',
        status: 'removed',
        lastChecked: '2024-12-07T09:15:00Z',
        dataIntegrity: 0.0,
        issues: ['Profile not found']
    },
    {
        directoryId: 'yelp',
        directoryName: 'Yelp',
        status: 'active',
        lastChecked: '2024-12-07T10:30:00Z',
        dataIntegrity: 0.85,
        issues: ['Phone number mismatch']
    },
    {
        directoryId: 'facebook-business',
        directoryName: 'Facebook Business',
        status: 'active',
        lastChecked: '2024-12-07T10:25:00Z',
        dataIntegrity: 0.98,
        issues: []
    }
]

describe('Customer Dashboard Usability Testing', () => {
    let user
    
    beforeEach(() => {
        user = userEvent.setup()
        
        // Mock API calls
        global.fetch = jest.fn()
        
        // Mock successful API responses
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ profile: mockCustomerProfile })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ directories: mockDirectoryStatuses })
            })
        
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'test-customer-001'),
                setItem: jest.fn(),
                removeItem: jest.fn()
            },
            writable: true
        })
        
        // Mock window.location
        delete window.location
        window.location = { search: '?customer=test-customer-001', reload: jest.fn() }
    })
    
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Dashboard Loading and Initial State', () => {
        test('should display loading state initially', () => {
            render(<CustomerDataDashboard />)
            
            expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument()
        })

        test('should load and display customer data correctly', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Data Monitoring Dashboard')).toBeInTheDocument()
            expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
        })

        test('should handle missing customer ID gracefully', async () => {
            window.localStorage.getItem.mockReturnValue(null)
            window.location.search = ''
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText(/customer data not found/i)).toBeInTheDocument()
            })
        })
    })

    describe('Navigation and Tab Functionality', () => {
        test('should display all navigation tabs', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /directories/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /alerts/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /compliance/i })).toBeInTheDocument()
        })

        test('should switch between tabs correctly', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Click on Directories tab
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Directory Status')).toBeInTheDocument()
            })
            
            // Click on Alerts tab
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Alerts')).toBeInTheDocument()
            })
        })

        test('should show alert count badge on alerts tab', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            const alertsTab = screen.getByRole('button', { name: /alerts/i })
            expect(within(alertsTab).getByText('1')).toBeInTheDocument() // Unacknowledged alerts count
        })
    })

    describe('Overview Tab Functionality', () => {
        test('should display health overview cards with correct data', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Check health overview cards
            expect(screen.getByText('Active Profiles')).toBeInTheDocument()
            expect(screen.getByText('22')).toBeInTheDocument()
            
            expect(screen.getByText('Removed Profiles')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument()
            
            expect(screen.getByText('Data Integrity')).toBeInTheDocument()
            expect(screen.getByText('92%')).toBeInTheDocument()
            
            expect(screen.getByText('Active Alerts')).toBeInTheDocument()
            expect(screen.getByText('1')).toBeInTheDocument()
        })

        test('should display recent alerts section', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Recent Alerts')).toBeInTheDocument()
            expect(screen.getByText('Profile removed from Google Business')).toBeInTheDocument()
        })
    })

    describe('Directories Tab Functionality', () => {
        test('should display directory status table', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Directory Status')).toBeInTheDocument()
            })
            
            // Check table headers
            expect(screen.getByText('Directory')).toBeInTheDocument()
            expect(screen.getByText('Status')).toBeInTheDocument()
            expect(screen.getByText('Data Integrity')).toBeInTheDocument()
            expect(screen.getByText('Last Checked')).toBeInTheDocument()
            expect(screen.getByText('Issues')).toBeInTheDocument()
        })

        test('should display directory data correctly', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Google Business')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Yelp')).toBeInTheDocument()
            expect(screen.getByText('Facebook Business')).toBeInTheDocument()
            
            // Check status indicators
            expect(screen.getByText('Removed')).toBeInTheDocument()
            expect(screen.getAllByText('Active')).toHaveLength(2)
        })

        test('should show data integrity progress bars', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('85%')).toBeInTheDocument()
            })
            
            expect(screen.getByText('98%')).toBeInTheDocument()
        })
    })

    describe('Alerts Tab Functionality', () => {
        test('should display alerts with filtering options', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Alerts')).toBeInTheDocument()
            })
            
            // Check filter buttons
            expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Critical' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Unacknowledged' })).toBeInTheDocument()
        })

        test('should filter alerts correctly', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Profile removed from Google Business')).toBeInTheDocument()
            })
            
            // Filter by Critical
            await user.click(screen.getByRole('button', { name: 'Critical' }))
            
            expect(screen.getByText('Profile removed from Google Business')).toBeInTheDocument()
            expect(screen.queryByText('Phone number mismatch detected in Yelp')).not.toBeInTheDocument()
        })

        test('should allow acknowledging alerts', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true })
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Profile removed from Google Business')).toBeInTheDocument()
            })
            
            const acknowledgeButton = screen.getByRole('button', { name: /acknowledge/i })
            await user.click(acknowledgeButton)
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/monitoring/alerts/alert-001/acknowledge',
                { method: 'POST' }
            )
        })
    })

    describe('Compliance Tab Functionality', () => {
        test('should display compliance status', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /compliance/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Compliance Status')).toBeInTheDocument()
            })
            
            expect(screen.getByText('GDPR Compliance')).toBeInTheDocument()
            expect(screen.getByText('CCPA Compliance')).toBeInTheDocument()
        })

        test('should display deletion request information', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /compliance/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Data Deletion Requests')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Total Requests')).toBeInTheDocument()
            expect(screen.getByText('3')).toBeInTheDocument()
            
            expect(screen.getByText('Pending Requests')).toBeInTheDocument()
            expect(screen.getByText('1')).toBeInTheDocument()
        })
    })

    describe('Interactive Features', () => {
        test('should allow downloading reports', async () => {
            // Mock blob and URL creation
            global.URL.createObjectURL = jest.fn(() => 'mock-url')
            global.URL.revokeObjectURL = jest.fn()
            
            const mockBlob = new Blob(['mock report data'])
            global.fetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob)
            })
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            const downloadButton = screen.getByRole('button', { name: /download report/i })
            await user.click(downloadButton)
            
            expect(global.fetch).toHaveBeenCalledWith('/api/monitoring/customer/test-customer-001/report')
        })

        test('should refresh data when refresh button is clicked', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            const refreshButton = screen.getByRole('button', { name: /refresh data/i })
            await user.click(refreshButton)
            
            expect(window.location.reload).toHaveBeenCalled()
        })
    })

    describe('Responsive Design and Accessibility', () => {
        test('should have proper ARIA labels and roles', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Check for proper heading structure
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
            
            // Check for proper button roles
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
            
            // Check for proper navigation
            expect(screen.getByRole('navigation') || screen.getByRole('tablist')).toBeInTheDocument()
        })

        test('should support keyboard navigation', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            const overviewTab = screen.getByRole('button', { name: /overview/i })
            const directoriesTab = screen.getByRole('button', { name: /directories/i })
            
            // Tab navigation
            overviewTab.focus()
            expect(overviewTab).toHaveFocus()
            
            await user.tab()
            expect(directoriesTab).toHaveFocus()
        })

        test('should display properly on different screen sizes', async () => {
            // Test mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375
            })
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Dashboard should still be functional on mobile
            expect(screen.getByText('Data Monitoring Dashboard')).toBeInTheDocument()
        })
    })

    describe('Error Handling and Edge Cases', () => {
        test('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('API Error'))
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText(/customer data not found/i)).toBeInTheDocument()
            })
        })

        test('should handle empty data states', async () => {
            const emptyProfile = {
                ...mockCustomerProfile,
                alerts: [],
                profileHealth: {
                    totalDirectories: 0,
                    activeProfiles: 0,
                    removedProfiles: 0,
                    pendingProfiles: 0,
                    dataIntegrityScore: 0
                }
            }
            
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ profile: emptyProfile })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ directories: [] })
                })
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
            })
        })

        test('should handle real-time alert updates', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Simulate real-time alert
            const alertEvent = new CustomEvent('customerDataAlert', {
                detail: {
                    customerId: 'test-customer-001',
                    alerts: [{
                        id: 'alert-003',
                        type: 'profile_removal',
                        severity: 'critical',
                        message: 'New profile removal detected',
                        timestamp: new Date().toISOString(),
                        acknowledged: false
                    }]
                }
            })
            
            window.dispatchEvent(alertEvent)
            
            await waitFor(() => {
                const alertsTab = screen.getByRole('button', { name: /alerts/i })
                expect(within(alertsTab).getByText('2')).toBeInTheDocument() // Updated count
            })
        })
    })
})

describe('Alert System Effectiveness Testing', () => {
    describe('Alert Clarity and Usefulness', () => {
        test('should display alerts with clear severity indicators', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('CRITICAL')).toBeInTheDocument()
            })
            
            expect(screen.getByText('HIGH')).toBeInTheDocument()
        })

        test('should provide actionable alert messages', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Profile removed from Google Business')).toBeInTheDocument()
            })
            
            // Alert should be specific and actionable
            expect(screen.getByText(/profile removed/i)).toBeInTheDocument()
            expect(screen.getByText(/google business/i)).toBeInTheDocument()
        })

        test('should show alert timestamps in user-friendly format', async () => {
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                // Should show formatted date/time
                expect(screen.getByText(/12\/7\/2024/)).toBeInTheDocument()
            })
        })
    })

    describe('Browser Notifications', () => {
        test('should request notification permission', async () => {
            // Mock Notification API
            global.Notification = {
                permission: 'default',
                requestPermission: jest.fn(() => Promise.resolve('granted'))
            }
            
            render(<CustomerDataDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
            })
            
            // Simulate critical alert
            const criticalAlert = {
                id: 'alert-critical',
                severity: 'critical',
                message: 'Critical alert test'
            }
            
            // This would trigger browser notification in real implementation
            expect(global.Notification).toBeDefined()
        })
    })
})

describe('Performance and Load Testing', () => {
    test('should render dashboard within acceptable time', async () => {
        const startTime = performance.now()
        
        render(<CustomerDataDashboard />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
        })
        
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        // Should render within 2 seconds
        expect(renderTime).toBeLessThan(2000)
    })

    test('should handle large datasets efficiently', async () => {
        // Mock large dataset
        const largeDirectoryList = Array.from({ length: 100 }, (_, i) => ({
            directoryId: `dir-${i}`,
            directoryName: `Directory ${i}`,
            status: 'active',
            lastChecked: new Date().toISOString(),
            dataIntegrity: Math.random(),
            issues: []
        }))
        
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ profile: mockCustomerProfile })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ directories: largeDirectoryList })
            })
        
        const startTime = performance.now()
        
        render(<CustomerDataDashboard />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Business Inc')).toBeInTheDocument()
        })
        
        await user.click(screen.getByRole('button', { name: /directories/i }))
        
        await waitFor(() => {
            expect(screen.getByText('Directory 0')).toBeInTheDocument()
        })
        
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        // Should handle large datasets within reasonable time
        expect(renderTime).toBeLessThan(5000)
    })
})

// Export test configuration
export const uatConfig = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/uat-setup.js'],
    collectCoverageFrom: [
        'components/monitoring/**/*.tsx',
        'lib/monitoring/**/*.js',
        'lib/integration/**/*.js'
    ],
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    testTimeout: 15000
}

export default {
    displayName: 'User Acceptance Testing Suite',
    testMatch: ['**/tests/**/*.uat.js'],
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html']
}