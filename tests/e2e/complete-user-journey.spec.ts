import { test, expect } from '@playwright/test'

test.describe('Complete AI-Enhanced User Journey', () => {
  test.describe.configure({ mode: 'serial' })

  test('Free tier user completes analysis and sees upgrade prompt', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Verify main value proposition is visible
    await expect(page.getByText('AI-Enhanced Directory Analysis')).toBeVisible()
    
    // Enter website for analysis (free tier)
    await page.getByPlaceholder('Enter your website URL').fill('https://example-restaurant.com')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    // Wait for analysis results
    await expect(page.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
    
    // Verify free tier limitations are shown
    await expect(page.getByText('Limited to 5 directories')).toBeVisible()
    await expect(page.getByText('Upgrade to Growth Plan')).toBeVisible()
    
    // Verify preview data is displayed
    await expect(page.getByText('Google My Business')).toBeVisible()
    await expect(page.getByText('Yelp')).toBeVisible()
    
    // Click upgrade button
    await page.getByRole('button', { name: /Upgrade to Growth Plan/i }).click()
    
    // Verify redirected to checkout
    await expect(page.url()).toContain('checkout')
    await expect(page.getByText('$299')).toBeVisible()
  })

  test('Paid tier user gets complete AI analysis', async ({ page }) => {
    // Mock payment completion (would normally require Stripe test keys)
    await page.goto('/analyze?tier=growth&mockPaid=true')
    
    // Enter business details
    await page.getByPlaceholder('Enter your website URL').fill('https://example-consulting.com')
    await page.getByRole('button', { name: 'Start AI Analysis' }).click()
    
    // Wait for AI analysis to complete
    await expect(page.getByText('AI Analysis Complete')).toBeVisible({ timeout: 90000 })
    
    // Verify comprehensive analysis features
    await expect(page.getByText('Business Intelligence Profile')).toBeVisible()
    await expect(page.getByText('Competitive Analysis')).toBeVisible()
    await expect(page.getByText('Revenue Projections')).toBeVisible()
    await expect(page.getByText('75+ Directory Opportunities')).toBeVisible()
    
    // Verify AI categorization accuracy
    await expect(page.getByText(/Industry.*Consulting|Professional Services/)).toBeVisible()
    
    // Test directory recommendations
    const directoryList = page.locator('[data-testid="directory-list"]')
    const directoryCount = await directoryList.locator('li').count()
    expect(directoryCount).toBeGreaterThanOrEqual(20)
    
    // Verify priority scoring
    await expect(page.getByText(/Priority.*95|90|85/)).toBeVisible()
    
    // Test export functionality
    await page.getByRole('button', { name: 'Export Analysis' }).click()
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('analysis')
  })

  test('Customer portal access and analysis history', async ({ page }) => {
    // Mock authenticated user session
    await page.goto('/dashboard?mockAuth=true')
    
    // Verify dashboard loads
    await expect(page.getByText('Your Business Analysis')).toBeVisible()
    
    // Check analysis history
    await expect(page.getByText('Analysis History')).toBeVisible()
    const analysisItemCount = await page.locator('[data-testid="analysis-item"]').count()
    expect(analysisItemCount).toBeGreaterThanOrEqual(1)
    
    // Test analysis refresh
    await page.getByRole('button', { name: 'Refresh Analysis' }).click()
    await expect(page.getByText('Analysis updated')).toBeVisible({ timeout: 30000 })
    
    // Test directory submission tracking
    await expect(page.getByText('Directory Submissions')).toBeVisible()
    await expect(page.getByText(/Submitted.*\d+/)).toBeVisible()
  })

  test('Mobile responsive analysis flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Test mobile navigation
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('nav')).toBeVisible()
    
    // Test mobile analysis form
    await page.getByPlaceholder('Enter website URL').fill('https://mobile-test.com')
    await page.getByRole('button', { name: 'Analyze' }).click()
    
    // Verify mobile results display
    await expect(page.getByText('Analysis Results')).toBeVisible({ timeout: 30000 })
    
    // Test mobile upgrade flow
    await page.getByRole('button', { name: /Upgrade/i }).click()
    await expect(page.url()).toContain('checkout')
    
    // Verify mobile checkout form
    await expect(page.getByRole('form')).toBeVisible()
    await expect(page.getByText('$299')).toBeVisible()
  })

  test('Error handling and edge cases', async ({ page }) => {
    await page.goto('/')
    
    // Test invalid URL handling
    await page.getByPlaceholder('Enter your website URL').fill('not-a-valid-url')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    await expect(page.getByText('Please enter a valid URL')).toBeVisible()
    
    // Test private URL blocking
    await page.getByPlaceholder('Enter your website URL').fill('http://localhost:3000')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    await expect(page.getByText('Private URLs are not allowed')).toBeVisible()
    
    // Test rate limiting (simulate multiple requests)
    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('Enter your website URL').fill(`https://test${i}.com`)
      await page.getByRole('button', { name: 'Analyze My Website' }).click()
      await page.waitForTimeout(1000)
    }
    
    // Should see rate limit message
    await expect(page.getByText(/rate limit|too many requests/i)).toBeVisible()
  })

  test('Cross-browser compatibility', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Test basic functionality across browsers
    await page.getByPlaceholder('Enter your website URL').fill('https://cross-browser-test.com')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    await expect(page.getByText('Website Analysis')).toBeVisible({ timeout: 30000 })
    
    // Browser-specific tests
    if (browserName === 'chromium') {
      // Test Chrome-specific features
      await expect(page.locator('[data-chrome-only]')).toBeVisible()
    } else if (browserName === 'firefox') {
      // Test Firefox compatibility
      await expect(page.locator('.analysis-results')).toBeVisible()
    } else if (browserName === 'webkit') {
      // Test Safari compatibility
      await expect(page.locator('.directory-list')).toBeVisible()
    }
  })
})