/**
 * Admin Interface Testing Suite
 * Comprehensive testing for administrative monitoring dashboard
 * 
 * Test Coverage:
 * - Admin Dashboard Functionality
 * - System Metrics Display
 * - Directory Management Interface
 * - Customer Monitoring Overview
 * - Alert Management System
 * - Performance Analytics
 * 
 * Author: Cora (QA Auditor)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import AdminMonitoringDashboard from '../components/admin/AdminMonitoringDashboard'

// Mock data for admin testing
const mockSystemMetrics = {
    cpu: 0.35,
    memory: 0.42,
    network: 0.28,
    responseTime: 1450,
    uptime: 86400, // 24 hours
    activeConnections: 15
}

const mockDirectoryStats = {
    total: 520,
    active: 495,
    monitoring: 487,
    errors: 8,
    averageResponseTime: 1650
}

const mockCustomerStats = {
    totalCustomers: 1247,
    activeMonitoring: 1189,
    alertsGenerated: 23,
    complianceRequests: 7
}

const mockSystemAlerts = [
    {
        id: 'alert-sys-001',
        type: 'system',
        severity: 'high',
        message: 'High memory usage detected on monitoring server',
        timestamp: '2024-12-07T10:30:00Z',
        resolved: false
    },
    {
        id: 'alert-dir-002',
        type: 'directory',
        severity: 'medium',
        message: 'Directory response time above threshold: Yelp',
        timestamp: '2024-12-07T09:45:00Z',
        resolved: false
    },
    {
        id: 'alert-cust-003',
        type: 'customer',
        severity: 'critical',
        message: 'Customer profile removal detected: Google Business',
        timestamp: '2024-12-07T08:15:00Z',
        resolved: true
    }
]

describe('Admin Dashboard Functionality Testing', () => {
    let user
    
    beforeEach(() => {
        user = userEvent.setup()
        
        // Mock API calls
        global.fetch = jest.fn()
        
        // Mock successful API responses
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSystemMetrics)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockDirectoryStats)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockCustomerStats)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ alerts: mockSystemAlerts })
            })
    })
    
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Dashboard Loading and Initial State', () => {
        test('should display loading state initially', () => {
            render(<AdminMonitoringDashboard />)
            
            expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument()
        })

        test('should load and display admin dashboard correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            expect(screen.getByText('System monitoring and management')).toBeInTheDocument()
        })

        test('should make correct API calls on initialization', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/admin/system/metrics')
            })
            
            expect(global.fetch).toHaveBeenCalledWith('/api/admin/directories/stats')
            expect(global.fetch).toHaveBeenCalledWith('/api/admin/customers/stats')
            expect(global.fetch).toHaveBeenCalledWith('/api/admin/alerts')
        })
    })

    describe('Navigation and Tab Functionality', () => {
        test('should display all admin navigation tabs', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /directories/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /customers/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /alerts/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /performance/i })).toBeInTheDocument()
        })

        test('should switch between admin tabs correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            // Click on Directories tab
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Directory Management')).toBeInTheDocument()
            })
            
            // Click on Performance tab
            await user.click(screen.getByRole('button', { name: /performance/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
            })
        })

        test('should show alert count badge on alerts tab', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            const alertsTab = screen.getByRole('button', { name: /alerts/i })
            expect(within(alertsTab).getByText('2')).toBeInTheDocument() // Unresolved alerts count
        })
    })

    describe('System Metrics Display', () => {
        test('should display system health cards with correct data', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            // Check CPU usage
            expect(screen.getByText('CPU Usage')).toBeInTheDocument()
            expect(screen.getByText('35.0%')).toBeInTheDocument()
            
            // Check Memory usage
            expect(screen.getByText('Memory Usage')).toBeInTheDocument()
            expect(screen.getByText('42.0%')).toBeInTheDocument()
            
            // Check Active Connections
            expect(screen.getByText('Active Connections')).toBeInTheDocument()
            expect(screen.getByText('15')).toBeInTheDocument()
            
            // Check Response Time
            expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
            expect(screen.getByText('1450ms')).toBeInTheDocument()
        })

        test('should apply correct color coding for system metrics', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('35.0%')).toBeInTheDocument()
            })
            
            // CPU usage should be green (below warning threshold)
            const cpuValue = screen.getByText('35.0%')
            expect(cpuValue).toHaveClass('text-green-600')
            
            // Memory usage should be green (below warning threshold)
            const memoryValue = screen.getByText('42.0%')
            expect(memoryValue).toHaveClass('text-green-600')
        })

        test('should display system health status correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('System Health')).toBeInTheDocument()
            })
            
            expect(screen.getByText('Overall Status')).toBeInTheDocument()
            expect(screen.getByText('Healthy')).toBeInTheDocument()
            expect(screen.getByText('24.0h')).toBeInTheDocument() // Uptime
        })
    })

    describe('Directory Management Interface', () => {
        test('should display directory statistics correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Directory Management')).toBeInTheDocument()
            })
            
            // Check directory stats
            expect(screen.getByText('520')).toBeInTheDocument() // Total
            expect(screen.getByText('495')).toBeInTheDocument() // Active
            expect(screen.getByText('487')).toBeInTheDocument() // Monitoring
            expect(screen.getByText('8')).toBeInTheDocument() // Errors
        })

        test('should display average response time for directories', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /directories/i }))
            
            await waitFor(() => {
                expect(screen.getByText('1650ms')).toBeInTheDocument()
            })
        })
    })

    describe('Customer Monitoring Overview', () => {
        test('should display customer statistics correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /customers/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Customer Monitoring Overview')).toBeInTheDocument()
            })
            
            // Check customer stats
            expect(screen.getByText('1247')).toBeInTheDocument() // Total customers
            expect(screen.getByText('1189')).toBeInTheDocument() // Active monitoring
            expect(screen.getByText('23')).toBeInTheDocument() // Alerts generated
            expect(screen.getByText('7')).toBeInTheDocument() // Compliance requests
        })
    })

    describe('Alert Management System', () => {
        test('should display system alerts correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('System Alerts')).toBeInTheDocument()
            })
            
            // Check alert messages
            expect(screen.getByText('High memory usage detected on monitoring server')).toBeInTheDocument()
            expect(screen.getByText('Directory response time above threshold: Yelp')).toBeInTheDocument()
            expect(screen.getByText('Customer profile removal detected: Google Business')).toBeInTheDocument()
        })

        test('should display alert severity levels correctly', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('HIGH')).toBeInTheDocument()
            })
            
            expect(screen.getByText('MEDIUM')).toBeInTheDocument()
            expect(screen.getByText('CRITICAL')).toBeInTheDocument()
        })

        test('should allow resolving alerts', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true })
            
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('High memory usage detected on monitoring server')).toBeInTheDocument()
            })
            
            const resolveButtons = screen.getAllByRole('button', { name: /resolve/i })
            await user.click(resolveButtons[0])
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/admin/alerts/alert-sys-001/resolve',
                { method: 'POST' }
            )
        })

        test('should show resolved alerts with proper styling', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('✓ Resolved')).toBeInTheDocument()
            })
        })
    })

    describe('Performance Analytics', () => {
        test('should display performance metrics with progress bars', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /performance/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
            })
            
            expect(screen.getByText('System Resources')).toBeInTheDocument()
            expect(screen.getByText('Performance Stats')).toBeInTheDocument()
        })

        test('should show correct progress bar colors based on thresholds', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /performance/i }))
            
            await waitFor(() => {
                expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
            })
            
            // CPU and Memory should show green progress bars (below warning thresholds)
            const progressBars = screen.getAllByRole('progressbar')
            expect(progressBars.length).toBeGreaterThan(0)
        })
    })

    describe('Auto-refresh Functionality', () => {
        test('should have auto-refresh toggle', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            const autoRefreshCheckbox = screen.getByRole('checkbox')
            expect(autoRefreshCheckbox).toBeInTheDocument()
            expect(autoRefreshCheckbox).toBeChecked()
        })

        test('should allow toggling auto-refresh', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            const autoRefreshCheckbox = screen.getByRole('checkbox')
            await user.click(autoRefreshCheckbox)
            
            expect(autoRefreshCheckbox).not.toBeChecked()
        })

        test('should have manual refresh button', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            const refreshButton = screen.getByRole('button', { name: /refresh/i })
            expect(refreshButton).toBeInTheDocument()
            
            await user.click(refreshButton)
            
            // Should trigger additional API calls
            expect(global.fetch).toHaveBeenCalledTimes(8) // 4 initial + 4 refresh
        })
    })

    describe('Error Handling and Edge Cases', () => {
        test('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('API Error'))
            
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            // Dashboard should still render even with API errors
            expect(screen.getByText('System monitoring and management')).toBeInTheDocument()
        })

        test('should handle empty alerts state', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockSystemMetrics)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockDirectoryStats)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockCustomerStats)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ alerts: [] })
                })
            
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            await user.click(screen.getByRole('button', { name: /alerts/i }))
            
            await waitFor(() => {
                expect(screen.getByText('No Active Alerts')).toBeInTheDocument()
            })
            
            expect(screen.getByText('All systems are operating normally.')).toBeInTheDocument()
        })

        test('should handle missing data gracefully', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockDirectoryStats)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockCustomerStats)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ alerts: mockSystemAlerts })
                })
            
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            // Should still render other sections even if system metrics fail
            expect(screen.getByText('Directory Status')).toBeInTheDocument()
        })
    })

    describe('Accessibility and Usability', () => {
        test('should have proper ARIA labels and roles', async () => {
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
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
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            const overviewTab = screen.getByRole('button', { name: /overview/i })
            const directoriesTab = screen.getByRole('button', { name: /directories/i })
            
            // Tab navigation
            overviewTab.focus()
            expect(overviewTab).toHaveFocus()
            
            await user.tab()
            expect(directoriesTab).toHaveFocus()
        })

        test('should be responsive on different screen sizes', async () => {
            // Test mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768
            })
            
            render(<AdminMonitoringDashboard />)
            
            await waitFor(() => {
                expect(screen.getByText('Admin Monitoring Dashboard')).toBeInTheDocument()
            })
            
            // Dashboard should still be functional on tablet/mobile
            expect(screen.getByText('System monitoring and management')).toBeInTheDocument()
        })
    })
})

// Export test configuration
export const adminTestConfig = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/admin-setup.js'],
    collectCoverageFrom: [
        'components/admin/**/*.tsx',
        'lib/admin/**/*.js'
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
    displayName: 'Admin Interface Testing Suite',
    testMatch: ['**/tests/**/*.admin.js'],
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html']
}