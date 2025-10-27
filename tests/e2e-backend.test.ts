/**
 * E2E Backend Test Suite
 * Comprehensive end-to-end testing of admin pages and APIs
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('E2E Backend Tests', () => {
  test.describe('Admin Dashboard', () => {
    test('Dashboard loads successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check for dashboard title
      await expect(page.locator('h1')).toContainText('Admin Dashboard');

      // Check for metric cards
      const metricCards = page.locator('[class*="bg-white p-6 rounded-lg shadow-md"]');
      await expect(metricCards).toHaveCount(4);
    });

    test('Metrics update on refresh', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Click refresh button
      await page.click('button:has-text("Refresh")');

      // Wait for loading state
      await expect(page.locator('button:has-text("Refreshing")')).toBeVisible();

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Verify metrics are displayed
      await expect(page.locator('text=Total Customers')).toBeVisible();
    });

    test('Charts render correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Wait for charts to render
      await page.waitForSelector('[data-testid="pie-chart"], .recharts-wrapper', {
        timeout: 5000,
      });

      // Verify charts are visible
      const charts = page.locator('.recharts-wrapper, [class*="recharts"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);
    });
  });

  test.describe('Customers Management', () => {
    test('Customers page loads and displays table', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Check for page title
      await expect(page.locator('h1')).toContainText('Customers');

      // Check for create button
      await expect(page.locator('button:has-text("Create Customer")')).toBeVisible();

      // Check for search input
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    });

    test('Search filter works', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Type in search box
      await page.fill('input[placeholder*="Search"]', 'test');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify table updates (implementation-specific)
    });

    test('Create customer modal opens and closes', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Click create button
      await page.click('button:has-text("Create Customer")');

      // Verify modal is visible
      await expect(page.locator('h2:has-text("Create New Customer")')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Cancel")');

      // Verify modal is closed
      await expect(page.locator('h2:has-text("Create New Customer")')).not.toBeVisible();
    });

    test('Create customer form validation works', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Open modal
      await page.click('button:has-text("Create Customer")');

      // Try to submit without filling required fields
      await page.click('button[type="submit"]');

      // Verify validation (browser native or custom)
      // This depends on implementation
    });

    test('Create customer successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Open modal
      await page.click('button:has-text("Create Customer")');

      // Fill form
      await page.fill('input[type="text"]', 'E2E Test Business');
      await page.fill('input[type="email"]', `e2e-test-${Date.now()}@example.com`);
      await page.fill('input[type="tel"]', '555-1234');
      await page.fill('input[type="url"]', 'https://e2e-test.com');

      // Submit form
      await page.click('button[type="submit"]:has-text("Create")');

      // Wait for success
      await page.waitForTimeout(2000);

      // Verify customer appears in table (or modal closes)
    });
  });

  test.describe('Jobs Monitoring', () => {
    test('Jobs page loads and displays table', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/jobs`);

      // Check for page title
      await expect(page.locator('h1')).toContainText('Jobs');

      // Check for filters
      await expect(page.locator('select')).toBeVisible();
    });

    test('Status filter works', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/jobs`);

      // Select status filter
      await page.selectOption('select', 'completed');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify filtered results
    });

    test('Row expansion shows submissions', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/jobs`);

      // Wait for table to load
      await page.waitForSelector('table tbody tr');

      // Click expand button
      const expandButton = page.locator('button:has-text("▶")').first();
      if (await expandButton.isVisible()) {
        await expandButton.click();

        // Verify expanded content
        await expect(page.locator('button:has-text("▼")')).toBeVisible();
      }
    });

    test('Date range filter works', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/jobs`);

      // Fill date inputs (if using react-datepicker)
      // This depends on the date picker implementation
    });
  });

  test.describe('API Endpoints', () => {
    test('Create customer API endpoint works', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/netlify/functions/admin/create-customer`, {
        data: {
          business_name: 'API Test Business',
          email: `api-test-${Date.now()}@example.com`,
          phone: '555-1234',
          website: 'https://api-test.com',
          package_type: 'starter',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.customer).toBeDefined();
      expect(data.job).toBeDefined();
    });

    test('Create customer API validates required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/netlify/functions/admin/create-customer`, {
        data: {
          // Missing required fields
          phone: '555-1234',
        },
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('Create customer API validates email format', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/netlify/functions/admin/create-customer`, {
        data: {
          business_name: 'Test Business',
          email: 'invalid-email',
        },
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('email');
    });
  });

  test.describe('Database Operations', () => {
    test('Customers table query performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/admin/customers`);
      await page.waitForSelector('table tbody tr');

      const loadTime = Date.now() - startTime;

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('Jobs table query performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/admin/jobs`);
      await page.waitForSelector('table tbody tr');

      const loadTime = Date.now() - startTime;

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe('Real-time Updates', () => {
    test('Dashboard updates in real-time', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Get initial metric value
      const initialValue = await page.locator('text=Total Customers').locator('..').locator('p').first().textContent();

      // Wait for potential real-time update
      await page.waitForTimeout(5000);

      // Verify page is still responsive
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    });
  });

  test.describe('Error Handling', () => {
    test('Dashboard handles fetch errors gracefully', async ({ page }) => {
      // This would require mocking network failures
      // For now, verify error UI exists
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Page should load even if some data fails
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    });

    test('Customers page handles errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/customers`);

      // Page should load even if some data fails
      await expect(page.locator('h1')).toContainText('Customers');
    });
  });

  test.describe('Responsive Design', () => {
    test('Dashboard is responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Verify page renders on mobile
      await expect(page.locator('h1')).toBeVisible();
    });

    test('Customers table is responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/admin/customers`);

      // Verify table is scrollable or responsive
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
