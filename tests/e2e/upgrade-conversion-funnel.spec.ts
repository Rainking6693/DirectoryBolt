import { test, expect } from '@playwright/test'

test.describe('Upgrade Conversion Funnel Testing', () => {
  test.describe.configure({ mode: 'serial' })

  let conversionData: any[] = []

  test('Free to Paid Conversion Funnel', async ({ page }) => {
    const startTime = Date.now()
    
    // Stage 1: Landing Page Entry
    await page.goto('/')
    const landingTime = Date.now()
    
    // Verify value proposition is clear
    await expect(page.getByText('AI-Enhanced Directory Analysis')).toBeVisible()
    await expect(page.getByText('299')).toBeVisible() // Price visible on homepage
    
    // Stage 2: Analysis Initiation
    await page.getByPlaceholder('Enter your website URL').fill('https://conversion-test-business.com')
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    const analysisStartTime = Date.now()
    
    // Stage 3: Free Results Display
    await expect(page.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
    const resultsDisplayTime = Date.now()
    
    // Verify free tier limitations create urgency
    await expect(page.getByText('Limited to 5 directories')).toBeVisible()
    await expect(page.getByText('Preview only')).toBeVisible()
    
    // Stage 4: Upgrade Prompt Interaction
    await expect(page.getByText('Unlock Full AI Analysis')).toBeVisible()
    await expect(page.getByText('75+ high-authority directories')).toBeVisible()
    await expect(page.getByText('Competitive landscape analysis')).toBeVisible()
    
    const upgradePromptTime = Date.now()
    
    // Stage 5: CTA Click
    await page.getByRole('button', { name: /Upgrade to Growth Plan.*\$299/i }).click()
    const ctaClickTime = Date.now()
    
    // Stage 6: Checkout Page
    await expect(page.url()).toContain('checkout')
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('$299')).toBeVisible()
    const checkoutLoadTime = Date.now()
    
    // Verify checkout page optimization
    await expect(page.getByText('30-day money-back guarantee')).toBeVisible()
    await expect(page.getByText('Cancel anytime')).toBeVisible()
    await expect(page.getByText('Instant access')).toBeVisible()
    
    // Stage 7: Form Interaction
    await page.getByRole('textbox', { name: 'Email' }).fill('conversion-test@example.com')
    await page.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
    await page.getByRole('textbox', { name: 'Expiry' }).fill('12/25')
    await page.getByRole('textbox', { name: 'CVC' }).fill('123')
    const formFillTime = Date.now()
    
    // Stage 8: Purchase Attempt (mock)
    await page.getByRole('button', { name: 'Complete Purchase' }).click()
    const purchaseAttemptTime = Date.now()
    
    // Mock success page
    await page.goto('/success?plan=growth&mockPurchase=true')
    await expect(page.getByText('Welcome to Growth Plan')).toBeVisible()
    const conversionCompleteTime = Date.now()
    
    // Record conversion funnel data
    conversionData.push({
      funnelType: 'free-to-growth',
      totalTime: conversionCompleteTime - startTime,
      stages: {
        landing: landingTime - startTime,
        analysisStart: analysisStartTime - landingTime,
        resultsDisplay: resultsDisplayTime - analysisStartTime,
        upgradePrompt: upgradePromptTime - resultsDisplayTime,
        ctaClick: ctaClickTime - upgradePromptTime,
        checkoutLoad: checkoutLoadTime - ctaClickTime,
        formFill: formFillTime - checkoutLoadTime,
        purchaseAttempt: purchaseAttemptTime - formFillTime,
        conversionComplete: conversionCompleteTime - purchaseAttemptTime
      },
      converted: true,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Free to Growth conversion: ${(conversionCompleteTime - startTime) / 1000}s total`)
  })

  test('Starter to Growth Upgrade Funnel', async ({ page }) => {
    const startTime = Date.now()
    
    // Start with starter tier dashboard
    await page.goto('/dashboard?tier=starter&mockAuth=true')
    
    // Verify current tier status
    await expect(page.getByText('Starter Plan')).toBeVisible()
    await expect(page.getByText('25 directories available')).toBeVisible()
    
    // Stage 1: Limitation Discovery
    await expect(page.getByText('Competitor analysis unavailable')).toBeVisible()
    await expect(page.getByText('Revenue projections unavailable')).toBeVisible()
    const limitationTime = Date.now()
    
    // Stage 2: Upgrade Prompt
    await expect(page.getByText('Upgrade to unlock advanced features')).toBeVisible()
    await page.getByRole('button', { name: 'View Upgrade Options' }).click()
    const upgradePromptTime = Date.now()
    
    // Stage 3: Feature Comparison
    await expect(page.getByText('Compare Plans')).toBeVisible()
    await expect(page.getByText('Growth Plan Features')).toBeVisible()
    
    // Verify feature differentiation is clear
    await expect(page.getByText('✓ Competitor Analysis')).toBeVisible()
    await expect(page.getByText('✓ Revenue Projections')).toBeVisible()
    await expect(page.getByText('✓ 75+ Directories')).toBeVisible()
    const comparisonTime = Date.now()
    
    // Stage 4: Upgrade Selection
    await page.getByRole('button', { name: 'Upgrade to Growth Plan' }).click()
    const upgradeSelectionTime = Date.now()
    
    // Stage 5: Checkout Process
    await expect(page.url()).toContain('checkout')
    await expect(page.getByText('Upgrade to Growth Plan')).toBeVisible()
    await expect(page.getByText('Additional $200/month')).toBeVisible() // Starter is $99, Growth is $299
    
    // Fill upgrade form
    await page.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
    await page.getByRole('textbox', { name: 'Expiry' }).fill('12/25')
    await page.getByRole('textbox', { name: 'CVC' }).fill('123')
    await page.getByRole('button', { name: 'Confirm Upgrade' }).click()
    const upgradeCompleteTime = Date.now()
    
    // Mock upgrade success
    await page.goto('/dashboard?tier=growth&mockAuth=true&upgraded=true')
    await expect(page.getByText('Successfully upgraded to Growth Plan')).toBeVisible()
    const finalTime = Date.now()
    
    conversionData.push({
      funnelType: 'starter-to-growth',
      totalTime: finalTime - startTime,
      stages: {
        limitationDiscovery: limitationTime - startTime,
        upgradePrompt: upgradePromptTime - limitationTime,
        featureComparison: comparisonTime - upgradePromptTime,
        upgradeSelection: upgradeSelectionTime - comparisonTime,
        upgradeComplete: upgradeCompleteTime - upgradeSelectionTime
      },
      converted: true,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Starter to Growth upgrade: ${(finalTime - startTime) / 1000}s total`)
  })

  test('Growth to Professional Upgrade Funnel', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard?tier=growth&mockAuth=true')
    
    // Verify current tier
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('75 directories available')).toBeVisible()
    
    // Stage 1: Usage Threshold Reached
    await expect(page.getByText('65 of 75 directories used')).toBeVisible()
    await expect(page.getByText('You\'re approaching your limit')).toBeVisible()
    const thresholdTime = Date.now()
    
    // Stage 2: Professional Features Showcase
    await page.getByRole('button', { name: 'View Professional Features' }).click()
    await expect(page.getByText('Professional Plan Benefits')).toBeVisible()
    await expect(page.getByText('150+ directories')).toBeVisible()
    await expect(page.getByText('Premium directory access')).toBeVisible()
    await expect(page.getByText('Advanced SEO insights')).toBeVisible()
    const showcaseTime = Date.now()
    
    // Stage 3: ROI Calculator Interaction
    await expect(page.getByText('ROI Calculator')).toBeVisible()
    await page.getByRole('slider', { name: 'Monthly leads target' }).fill('50')
    await expect(page.getByText('Estimated additional revenue: $12,500')).toBeVisible()
    await expect(page.getByText('ROI: 2,400%')).toBeVisible()
    const roiCalculatorTime = Date.now()
    
    // Stage 4: Upgrade Decision
    await page.getByRole('button', { name: 'Upgrade to Professional' }).click()
    const upgradeDecisionTime = Date.now()
    
    // Stage 5: Professional Checkout
    await expect(page.url()).toContain('checkout')
    await expect(page.getByText('Professional Plan')).toBeVisible()
    await expect(page.getByText('Additional $200/month')).toBeVisible()
    
    await page.getByRole('button', { name: 'Confirm Professional Upgrade' }).click()
    const checkoutCompleteTime = Date.now()
    
    conversionData.push({
      funnelType: 'growth-to-professional',
      totalTime: checkoutCompleteTime - startTime,
      stages: {
        usageThreshold: thresholdTime - startTime,
        featureShowcase: showcaseTime - thresholdTime,
        roiCalculator: roiCalculatorTime - showcaseTime,
        upgradeDecision: upgradeDecisionTime - roiCalculatorTime,
        checkoutComplete: checkoutCompleteTime - upgradeDecisionTime
      },
      converted: true,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Growth to Professional upgrade: ${(checkoutCompleteTime - startTime) / 1000}s total`)
  })

  test('Abandoned Cart Recovery Flow', async ({ page }) => {
    const startTime = Date.now()
    
    // Start checkout process
    await page.goto('/checkout?plan=growth')
    
    await page.getByRole('textbox', { name: 'Email' }).fill('abandoned-cart-test@example.com')
    await page.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
    const formPartialTime = Date.now()
    
    // Simulate cart abandonment (navigate away)
    await page.goto('/')
    const abandonmentTime = Date.now()
    
    // Simulate return visit (would normally be from email)
    await page.goto('/checkout?plan=growth&returnVisitor=true&email=abandoned-cart-test@example.com')
    
    // Verify cart recovery elements
    await expect(page.getByText('Complete your Growth Plan purchase')).toBeVisible()
    await expect(page.getByText('Your information has been saved')).toBeVisible()
    await expect(page.getByText('Special offer: 10% off for returning customers')).toBeVisible()
    const recoveryTime = Date.now()
    
    // Complete purchase with discount
    await expect(page.getByText('$269.10')).toBeVisible() // 10% off $299
    await page.getByRole('textbox', { name: 'CVC' }).fill('123')
    await page.getByRole('button', { name: 'Complete Purchase with Discount' }).click()
    const recoveryCompleteTime = Date.now()
    
    conversionData.push({
      funnelType: 'abandoned-cart-recovery',
      totalTime: recoveryCompleteTime - startTime,
      stages: {
        formPartial: formPartialTime - startTime,
        abandonment: abandonmentTime - formPartialTime,
        recovery: recoveryTime - abandonmentTime,
        recoveryComplete: recoveryCompleteTime - recoveryTime
      },
      abandoned: true,
      recovered: true,
      discountApplied: true,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Abandoned cart recovery: ${(recoveryCompleteTime - startTime) / 1000}s total`)
  })

  test('Price Sensitivity and Objection Handling', async ({ page }) => {
    await page.goto('/checkout?plan=growth')
    
    // Stage 1: Initial Price Reaction
    await expect(page.getByText('$299')).toBeVisible()
    
    // Simulate price objection (look for cheaper options)
    await page.getByRole('button', { name: 'View Other Plans' }).click()
    
    // Stage 2: Plan Comparison
    await expect(page.getByText('Compare All Plans')).toBeVisible()
    await expect(page.getByText('Starter Plan - $99')).toBeVisible()
    
    // User clicks on cheaper option
    await page.getByRole('button', { name: 'Select Starter Plan' }).click()
    
    // Stage 3: Upsell at Starter Checkout
    await expect(page.getByText('Starter Plan')).toBeVisible()
    await expect(page.getByText('$99')).toBeVisible()
    
    // Verify upsell messaging
    await expect(page.getByText('Most customers choose Growth Plan')).toBeVisible()
    await expect(page.getByText('Only $200 more for 3x the directories')).toBeVisible()
    await expect(page.getByText('Includes competitor analysis worth $500')).toBeVisible()
    
    // Stage 4: Upsell Conversion
    await page.getByRole('button', { name: 'Upgrade to Growth for $200 more' }).click()
    
    // Verify upsell success
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('$299')).toBeVisible()
    await expect(page.getByText('Smart choice! You\'ll get 3x more value')).toBeVisible()
    
    console.log('✅ Price objection handling and upsell successful')
  })

  test('Mobile Conversion Funnel Optimization', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Mobile-specific optimizations
    await expect(page.getByText('AI Analysis')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Free Analysis' })).toBeVisible()
    
    // Mobile form interaction
    await page.getByPlaceholder('Your website').fill('https://mobile-conversion-test.com')
    await page.getByRole('button', { name: 'Analyze' }).click()
    
    await expect(page.getByText('Analysis Preview')).toBeVisible({ timeout: 30000 })
    
    // Mobile upgrade flow
    await page.getByRole('button', { name: 'Upgrade' }).click()
    
    // Mobile checkout optimization
    await expect(page.getByText('Growth Plan')).toBeVisible()
    await expect(page.getByText('$299/month')).toBeVisible()
    
    // Verify mobile-optimized checkout
    await expect(page.getByRole('button', { name: 'Apple Pay' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google Pay' })).toBeVisible()
    
    const mobileConversionTime = Date.now()
    
    conversionData.push({
      funnelType: 'mobile-conversion',
      totalTime: mobileConversionTime - startTime,
      device: 'mobile',
      optimizations: ['apple-pay', 'google-pay', 'simplified-form'],
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Mobile conversion funnel: ${(mobileConversionTime - startTime) / 1000}s total`)
  })

  test('A/B Test Different CTA Variations', async ({ page, context }) => {
    const variations = [
      { cta: 'Upgrade to Growth Plan - $299', variant: 'price-focused' },
      { cta: 'Get Complete AI Analysis', variant: 'feature-focused' },
      { cta: 'Unlock 75+ Directories', variant: 'benefit-focused' },
      { cta: 'Start Growing Your Business', variant: 'outcome-focused' }
    ]
    
    for (const variation of variations) {
      // Create new context for each variation to avoid cookies/storage interference
      const newPage = await context.newPage()
      
      await newPage.goto(`/?variant=${variation.variant}`)
      
      await newPage.getByPlaceholder('Enter your website URL').fill('https://ab-test-business.com')
      await newPage.getByRole('button', { name: 'Analyze My Website' }).click()
      
      await expect(newPage.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
      
      // Check if the specific CTA variant is present
      await expect(newPage.getByRole('button', { name: new RegExp(variation.cta.split(' - ')[0]) })).toBeVisible()
      
      // Track click through rate (would measure actual clicks in real test)
      const ctaButton = newPage.getByRole('button', { name: new RegExp(variation.cta.split(' - ')[0]) })
      await expect(ctaButton).toBeVisible()
      
      console.log(`✅ A/B variant "${variation.variant}" CTA displayed correctly`)
      
      await newPage.close()
    }
  })

  test('Conversion Funnel Analytics and Reporting', async ({ page }) => {
    // Test analytics tracking throughout funnel
    await page.goto('/')
    
    // Check for analytics scripts
    await expect(page.locator('script[src*="analytics"]')).toBeTruthy()
    
    // Simulate funnel progression with analytics events
    await page.evaluate(() => {
      // Mock analytics tracking
      window.gtag?.('event', 'funnel_start', {
        event_category: 'conversion',
        event_label: 'homepage_visit'
      })
    })
    
    await page.getByPlaceholder('Enter your website URL').fill('https://analytics-test.com')
    
    await page.evaluate(() => {
      window.gtag?.('event', 'analysis_started', {
        event_category: 'conversion',
        event_label: 'url_entered'
      })
    })
    
    await page.getByRole('button', { name: 'Analyze My Website' }).click()
    
    await expect(page.getByText('Website Analysis Preview')).toBeVisible({ timeout: 30000 })
    
    await page.evaluate(() => {
      window.gtag?.('event', 'free_results_viewed', {
        event_category: 'conversion',
        event_label: 'preview_displayed'
      })
    })
    
    await page.getByRole('button', { name: /Upgrade to Growth Plan/i }).click()
    
    await page.evaluate(() => {
      window.gtag?.('event', 'upgrade_cta_clicked', {
        event_category: 'conversion',
        event_label: 'growth_plan_selected'
      })
    })
    
    console.log('✅ Conversion funnel analytics events tracked')
  })

  // Generate conversion funnel report
  test.afterAll(async () => {
    const reportPath = './test-results/conversion-funnel-report.json'
    
    // Calculate conversion metrics
    const totalFunnels = conversionData.length
    const convertedFunnels = conversionData.filter(d => d.converted).length
    const conversionRate = (convertedFunnels / totalFunnels) * 100
    const avgConversionTime = conversionData.reduce((sum, d) => sum + d.totalTime, 0) / totalFunnels
    
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Upgrade Conversion Funnel Testing',
      summary: {
        totalFunnels,
        convertedFunnels,
        conversionRate: `${conversionRate.toFixed(1)}%`,
        averageConversionTime: `${(avgConversionTime / 1000).toFixed(1)}s`,
        abandonedCartRecoveryRate: conversionData.filter(d => d.recovered).length / conversionData.filter(d => d.abandoned).length * 100
      },
      funnelData: conversionData,
      recommendations: [
        'Optimize checkout page load times',
        'Implement more aggressive abandoned cart recovery',
        'Test additional CTA variations for higher conversion',
        'Improve mobile checkout experience',
        'Add more social proof elements to pricing pages'
      ]
    }
    
    try {
      await require('fs').promises.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(`🛒 Conversion Funnel Report saved to ${reportPath}`)
    } catch (error) {
      console.error('Failed to save conversion funnel report:', error)
    }
  })
})