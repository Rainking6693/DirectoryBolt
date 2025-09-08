import { test, expect } from '@playwright/test'

test.describe('Pricing Tier Feature Access Validation', () => {
  test.describe.configure({ mode: 'serial' })

  const tierConfigurations = {
    free: {
      name: 'Free Preview',
      maxDirectories: 5,
      aiAnalysis: false,
      competitorAnalysis: false,
      revenueProjections: false,
      screenshots: false,
      price: 0
    },
    starter: {
      name: 'Starter Plan',
      maxDirectories: 25,
      aiAnalysis: true,
      competitorAnalysis: false,
      revenueProjections: false,
      screenshots: true,
      price: 99
    },
    growth: {
      name: 'Growth Plan',
      maxDirectories: 75,
      aiAnalysis: true,
      competitorAnalysis: true,
      revenueProjections: true,
      screenshots: true,
      price: 299
    },
    professional: {
      name: 'Professional Plan',
      maxDirectories: 150,
      aiAnalysis: true,
      competitorAnalysis: true,
      revenueProjections: true,
      screenshots: true,
      price: 499
    },
    enterprise: {
      name: 'Enterprise Plan',
      maxDirectories: 500,
      aiAnalysis: true,
      competitorAnalysis: true,
      revenueProjections: true,
      screenshots: true,
      price: 999
    }
  }

  test('Free tier shows correct limitations and upgrade prompts', async ({ page }) => {
    await page.goto('/')
    
    // Start analysis with free tier
    await page.getByPlaceholder('Enter your website URL').fill('https://example-free-tier.com')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    // Wait for free tier results
    await expect(page.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
    
    // Verify free tier limitations
    await expect(page.getByText('Limited to 5 directories')).toBeVisible()
    await expect(page.getByText('Preview only')).toBeVisible()
    await expect(page.getByText('Upgrade required')).toBeVisible()
    
    // Verify directory count limitation
    const directories = page.locator('[data-testid="preview-directory"]')
    await expect(directories).toHaveCount(5)
    
    // Verify AI features are not available
    await expect(page.getByText('AI Analysis')).not.toBeVisible()
    await expect(page.getByText('Competitor Analysis')).not.toBeVisible()
    await expect(page.getByText('Revenue Projections')).not.toBeVisible()
    
    // Verify upgrade prompts are present
    await expect(page.getByRole('button', { name: /Upgrade to Growth Plan/i })).toBeVisible()
    await expect(page.getByText('$299')).toBeVisible()
    
    // Test upgrade button functionality
    await page.getByRole('button', { name: /Upgrade to Growth Plan/i }).click()
    await expect(page.url()).toContain('checkout')
  })

  test('Starter tier provides correct feature set', async ({ page }) => {
    // Mock payment completion for starter tier
    await page.goto('/analyze?tier=starter&mockPaid=true')
    
    await page.getByPlaceholder('Enter your website URL').fill('https://example-starter-tier.com')
    await page.getByRole('button', { name: 'Start Analysis' }).click()
    
    // Wait for analysis completion
    await expect(page.getByText('Analysis Complete')).toBeVisible({ timeout: 90000 })
    
    // Verify starter tier features
    await expect(page.getByText('AI Business Analysis')).toBeVisible()
    await expect(page.getByText('25 Directory Opportunities')).toBeVisible()
    
    // Verify directory count is within limits
    const directoryCount = await page.locator('[data-testid="directory-item"]').count()
    expect(directoryCount).toBeLessThanOrEqual(25)
    expect(directoryCount).toBeGreaterThanOrEqual(15)
    
    // Verify screenshots are available
    await expect(page.locator('[data-testid="website-screenshot"]')).toBeVisible()
    
    // Verify competitor analysis is NOT available
    await expect(page.getByText('Competitor Analysis')).not.toBeVisible()
    await expect(page.getByText('Revenue Projections')).not.toBeVisible()
    
    // Should show upgrade option to growth plan
    await expect(page.getByText('Upgrade to Growth Plan')).toBeVisible()
    await expect(page.getByText('Get competitor analysis')).toBeVisible()
  })

  test('Growth tier includes competitive analysis and revenue projections', async ({ page }) => {
    await page.goto('/analyze?tier=growth&mockPaid=true')
    
    await page.getByPlaceholder('Enter your website URL').fill('https://example-growth-tier.com')
    await page.getByRole('button', { name: 'Start Analysis' }).click()
    
    await expect(page.getByText('Analysis Complete')).toBeVisible({ timeout: 120000 })
    
    // Verify growth tier features
    await expect(page.getByText('Business Intelligence Profile')).toBeVisible()
    await expect(page.getByText('Competitive Analysis')).toBeVisible()
    await expect(page.getByText('Revenue Projections')).toBeVisible()
    await expect(page.getByText('75+ Directory Opportunities')).toBeVisible()
    
    // Verify competitive analysis section
    await expect(page.getByText('Direct Competitors')).toBeVisible()
    await expect(page.getByText('Market Gaps')).toBeVisible()
    await expect(page.getByText('Competitive Advantages')).toBeVisible()
    
    // Verify revenue projections section
    await expect(page.getByText('Conservative Projection')).toBeVisible()
    await expect(page.getByText('Baseline Projection')).toBeVisible()
    await expect(page.getByText('Optimistic Projection')).toBeVisible()
    await expect(page.getByText('Payback Period')).toBeVisible()
    
    // Verify directory count
    const directoryCount = await page.locator('[data-testid="directory-item"]').count()
    expect(directoryCount).toBeLessThanOrEqual(75)
    expect(directoryCount).toBeGreaterThanOrEqual(50)
    
    // Should show upgrade option to professional
    await expect(page.getByText('Upgrade to Professional')).toBeVisible()
  })

  test('Professional tier provides enhanced directory coverage', async ({ page }) => {
    await page.goto('/analyze?tier=professional&mockPaid=true')
    
    await page.getByPlaceholder('Enter your website URL').fill('https://example-professional-tier.com')
    await page.getByRole('button', { name: 'Start Analysis' }).click()
    
    await expect(page.getByText('Analysis Complete')).toBeVisible({ timeout: 120000 })
    
    // Verify professional tier features
    await expect(page.getByText('150+ Directory Opportunities')).toBeVisible()
    await expect(page.getByText('Premium Directory Access')).toBeVisible()
    await expect(page.getByText('Advanced SEO Insights')).toBeVisible()
    
    // Verify enhanced directory count
    const directoryCount = await page.locator('[data-testid="directory-item"]').count()
    expect(directoryCount).toBeLessThanOrEqual(150)
    expect(directoryCount).toBeGreaterThanOrEqual(100)
    
    // Verify premium features
    await expect(page.getByText('Niche Directory Opportunities')).toBeVisible()
    await expect(page.getByText('International Directories')).toBeVisible()
    await expect(page.getByText('Industry-Specific Platforms')).toBeVisible()
    
    // Should show enterprise upgrade option
    await expect(page.getByText('Upgrade to Enterprise')).toBeVisible()
  })

  test('Enterprise tier provides maximum feature set', async ({ page }) => {
    await page.goto('/analyze?tier=enterprise&mockPaid=true')
    
    await page.getByPlaceholder('Enter your website URL').fill('https://example-enterprise-tier.com')
    await page.getByRole('button', { name: 'Start Analysis' }).click()
    
    await expect(page.getByText('Analysis Complete')).toBeVisible({ timeout: 180000 })
    
    // Verify enterprise tier features
    await expect(page.getByText('500+ Directory Opportunities')).toBeVisible()
    await expect(page.getByText('White-Label Options')).toBeVisible()
    await expect(page.getByText('API Access')).toBeVisible()
    await expect(page.getByText('Priority Support')).toBeVisible()
    
    // Verify maximum directory count
    const directoryCount = await page.locator('[data-testid="directory-item"]').count()
    expect(directoryCount).toBeGreaterThanOrEqual(200)
    
    // Verify enterprise-specific features
    await expect(page.getByText('Custom Branding')).toBeVisible()
    await expect(page.getByText('Dedicated Account Manager')).toBeVisible()
    await expect(page.getByText('Custom Integrations')).toBeVisible()
    
    // No upgrade prompts should be shown
    await expect(page.getByText('Upgrade to')).not.toBeVisible()
  })

  test('Tier upgrade flow works correctly', async ({ page }) => {
    // Start with free tier
    await page.goto('/')
    
    await page.getByPlaceholder('Enter your website URL').fill('https://upgrade-flow-test.com')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    await expect(page.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
    
    // Click upgrade to Growth Plan
    await page.getByRole('button', { name: /Upgrade to Growth Plan/i }).click()
    
    // Verify checkout page for Growth Plan
    await expect(page.url()).toContain('checkout')
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('$299')).toBeVisible()
    
    // Verify features listed
    await expect(page.getByText('75+ directories')).toBeVisible()
    await expect(page.getByText('AI analysis')).toBeVisible()
    await expect(page.getByText('Competitor analysis')).toBeVisible()
    await expect(page.getByText('Revenue projections')).toBeVisible()
    
    // Test upgrade to Professional from Growth checkout
    await page.getByRole('button', { name: 'Upgrade to Professional' }).click()
    
    await expect(page.getByText('Professional Plan')).toBeVisible()
    await expect(page.getByText('$499')).toBeVisible()
    await expect(page.getByText('150+ directories')).toBeVisible()
  })

  test('Feature restrictions are properly enforced', async ({ page }) => {
    const testCases = [
      {
        tier: 'starter',
        restrictedFeatures: ['competitor-analysis', 'revenue-projections'],
        allowedFeatures: ['ai-analysis', 'directory-list', 'screenshots']
      },
      {
        tier: 'growth',
        restrictedFeatures: ['premium-directories', 'api-access'],
        allowedFeatures: ['competitor-analysis', 'revenue-projections', 'ai-analysis']
      }
    ]

    for (const testCase of testCases) {
      await page.goto(`/analyze?tier=${testCase.tier}&mockPaid=true`)
      
      await page.getByPlaceholder('Enter your website URL').fill(`https://${testCase.tier}-restriction-test.com`)
      await page.getByRole('button', { name: 'Start Analysis' }).click()
      
      await expect(page.getByText('Analysis Complete')).toBeVisible({ timeout: 120000 })
      
      // Verify restricted features are not accessible
      for (const restrictedFeature of testCase.restrictedFeatures) {
        await expect(page.locator(`[data-testid="${restrictedFeature}"]`)).not.toBeVisible()
      }
      
      // Verify allowed features are accessible
      for (const allowedFeature of testCase.allowedFeatures) {
        await expect(page.locator(`[data-testid="${allowedFeature}"]`)).toBeVisible()
      }
      
      console.log(`✅ ${testCase.tier} tier: Feature restrictions properly enforced`)
    }
  })

  test('Pricing display is accurate across all pages', async ({ page }) => {
    // Check pricing page
    await page.goto('/pricing')
    
    for (const [tierKey, tierConfig] of Object.entries(tierConfigurations)) {
      if (tierConfig.price > 0) {
        await expect(page.getByText(`$${tierConfig.price}`)).toBeVisible()
        await expect(page.getByText(tierConfig.name)).toBeVisible()
        await expect(page.getByText(`${tierConfig.maxDirectories}+ directories`)).toBeVisible()
      }
    }
    
    // Check checkout pages for each tier
    const paidTiers = Object.entries(tierConfigurations).filter(([_, config]) => config.price > 0)
    
    for (const [tierKey, tierConfig] of paidTiers) {
      await page.goto(`/checkout?plan=${tierKey}`)
      
      await expect(page.getByText(tierConfig.name)).toBeVisible()
      await expect(page.getByText(`$${tierConfig.price}`)).toBeVisible()
      
      // Verify feature list accuracy
      if (tierConfig.aiAnalysis) {
        await expect(page.getByText('AI-powered analysis')).toBeVisible()
      }
      
      if (tierConfig.competitorAnalysis) {
        await expect(page.getByText('Competitor analysis')).toBeVisible()
      }
      
      if (tierConfig.revenueProjections) {
        await expect(page.getByText('Revenue projections')).toBeVisible()
      }
    }
  })

  test('Customer dashboard shows tier-appropriate features', async ({ page }) => {
    const tiersToTest = ['starter', 'growth', 'professional', 'enterprise'] as const
    
    for (const tier of tiersToTest) {
      await page.goto(`/dashboard?tier=${tier}&mockAuth=true`)
      
      // Verify tier display
      const tierConfig = tierConfigurations[tier as keyof typeof tierConfigurations]
      await expect(page.getByText(tierConfig.name)).toBeVisible()
      
      // Verify feature availability in dashboard
      if (tierConfig.aiAnalysis) {
        await expect(page.getByText('AI Analysis History')).toBeVisible()
      }
      
      if (tierConfig.competitorAnalysis) {
        await expect(page.getByText('Competitive Insights')).toBeVisible()
      }
      
      if (tierConfig.revenueProjections) {
        await expect(page.getByText('Revenue Tracking')).toBeVisible()
      }
      
      // Verify usage limits display
      await expect(page.getByText(`${tierConfig.maxDirectories} directories available`)).toBeVisible()
      
      console.log(`✅ ${tier} dashboard: Tier-appropriate features displayed`)
    }
  })

  test('Tier changes are reflected immediately', async ({ page }) => {
    // Start with starter tier
    await page.goto('/dashboard?tier=starter&mockAuth=true')
    await expect(page.getByText('Starter Plan')).toBeVisible()
    await expect(page.getByText('25 directories')).toBeVisible()
    
    // Simulate upgrade to growth tier
    await page.getByRole('button', { name: 'Upgrade Plan' }).click()
    await page.getByRole('button', { name: 'Select Growth Plan' }).click()
    
    // Mock successful payment and tier change
    await page.goto('/dashboard?tier=growth&mockAuth=true&upgraded=true')
    
    // Verify tier change reflected
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('75+ directories')).toBeVisible()
    await expect(page.getByText('Competitor analysis now available')).toBeVisible()
    
    // Verify new features are accessible
    await expect(page.getByRole('button', { name: 'Run Competitor Analysis' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate Revenue Projections' })).toBeVisible()
  })
})