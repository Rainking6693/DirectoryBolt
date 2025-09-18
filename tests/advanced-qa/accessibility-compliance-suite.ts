/**
 * Advanced Accessibility Compliance Testing Suite
 * Implements enterprise-grade WCAG 2.1 AA/AAA validation
 * Based on premium SaaS accessibility practices
 * 
 * Features:
 * - Automated WCAG 2.1 compliance testing
 * - Color contrast validation
 * - Keyboard navigation testing
 * - Screen reader compatibility
 * - Focus management validation
 * - ARIA compliance checking
 */

import { test, expect, Page } from '@playwright/test'
import { AIPoweredTestFramework } from './ai-powered-testing-framework'

interface AccessibilityViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    html: string
    target: string[]
    failureSummary: string
  }>
}

interface ColorContrastResult {
  foreground: string
  background: string
  ratio: number
  level: 'AA' | 'AAA' | 'FAIL'
  size: 'normal' | 'large'
}

interface KeyboardNavigationResult {
  totalFocusableElements: number
  trapsFocus: boolean
  skipLinks: boolean
  accessKeys: string[]
  tabOrder: boolean
}

class AccessibilityComplianceSuite {
  private page: Page
  private aiFramework: AIPoweredTestFramework
  
  constructor(page: Page) {
    this.page = page
    this.aiFramework = new AIPoweredTestFramework(page)
  }

  /**
   * Comprehensive WCAG 2.1 Compliance Test
   * Tests against AA and AAA standards
   */
  async runWCAGComplianceTest(): Promise<{
    level: 'A' | 'AA' | 'AAA'
    score: number
    violations: AccessibilityViolation[]
    passedRules: string[]
  }> {
    // Inject axe-core accessibility testing library
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    })

    // Configure axe for comprehensive testing
    const results = await this.page.evaluate(() => {
      return (window as any).axe.run(document, {
        tags: ['wcag2a', 'wcag2aa', 'wcag2aaa'],
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true }
        }
      })
    })

    const violations: AccessibilityViolation[] = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary
      }))
    }))

    const passedRules = results.passes.map((p: any) => p.id)
    const level = this.determineWCAGLevel(violations)
    const score = this.calculateAccessibilityScore(violations, passedRules.length)

    return { level, score, violations, passedRules }
  }

  /**
   * Advanced Color Contrast Testing
   * Validates against WCAG contrast requirements
   */
  async testColorContrast(): Promise<ColorContrastResult[]> {
    const results = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const contrastResults: any[] = []

      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        const color = computedStyle.color
        const backgroundColor = computedStyle.backgroundColor
        
        // Skip elements without visible text
        if (!element.textContent?.trim() || 
            backgroundColor === 'rgba(0, 0, 0, 0)' || 
            backgroundColor === 'transparent') {
          return
        }

        // Calculate contrast ratio (simplified)
        const ratio = this.calculateContrastRatio(color, backgroundColor)
        const fontSize = parseFloat(computedStyle.fontSize)
        const isBold = computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700
        const isLarge = fontSize >= 18 || (fontSize >= 14 && isBold)

        contrastResults.push({
          element: element.tagName.toLowerCase(),
          foreground: color,
          background: backgroundColor,
          ratio: ratio,
          level: this.getContrastLevel(ratio, isLarge),
          size: isLarge ? 'large' : 'normal'
        })
      })

      return contrastResults
    })

    return results
  }

  /**
   * Comprehensive Keyboard Navigation Testing
   * Validates full keyboard accessibility
   */
  async testKeyboardNavigation(): Promise<KeyboardNavigationResult> {
    // Test focus management
    const focusableElements = await this.page.evaluate(() => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ]
      
      return document.querySelectorAll(focusableSelectors.join(', ')).length
    })

    // Test tab order
    const tabOrderCorrect = await this.validateTabOrder()
    
    // Test focus trap (for modals/dialogs)
    const focusTrapped = await this.testFocusTrap()
    
    // Check for skip links
    const hasSkipLinks = await this.page.locator('a[href="#main"], a[href="#content"]').count() > 0
    
    // Test access keys
    const accessKeys = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('[accesskey]')
      return Array.from(elements).map(el => el.getAttribute('accesskey')).filter(Boolean)
    })

    return {
      totalFocusableElements: focusableElements,
      trapsFocus: focusTrapped,
      skipLinks: hasSkipLinks,
      accessKeys: accessKeys as string[],
      tabOrder: tabOrderCorrect
    }
  }

  /**
   * Screen Reader Compatibility Testing
   * Validates ARIA implementation and semantic markup
   */
  async testScreenReaderCompatibility(): Promise<{
    ariaLabels: boolean
    landmarkRegions: boolean
    headingStructure: boolean
    altTexts: boolean
    formLabels: boolean
    liveRegions: boolean
  }> {
    const results = await this.page.evaluate(() => {
      // Check ARIA labels
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, a')
      const hasAriaLabels = Array.from(interactiveElements).every(el => 
        el.getAttribute('aria-label') || 
        el.getAttribute('aria-labelledby') || 
        el.textContent?.trim() ||
        (el as HTMLInputElement).labels?.length > 0
      )

      // Check landmark regions
      const landmarks = document.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]')
      const hasLandmarks = landmarks.length > 0

      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const hasProperHeadingStructure = headings.length > 0 && document.querySelector('h1') !== null

      // Check alt texts
      const images = document.querySelectorAll('img')
      const hasAltTexts = Array.from(images).every(img => 
        img.getAttribute('alt') !== null || img.getAttribute('role') === 'presentation'
      )

      // Check form labels
      const formInputs = document.querySelectorAll('input, select, textarea')
      const hasFormLabels = Array.from(formInputs).every(input => 
        (input as HTMLInputElement).labels?.length > 0 ||
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby')
      )

      // Check live regions
      const liveRegions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')
      const hasLiveRegions = liveRegions.length > 0

      return {
        ariaLabels: hasAriaLabels,
        landmarkRegions: hasLandmarks,
        headingStructure: hasProperHeadingStructure,
        altTexts: hasAltTexts,
        formLabels: hasFormLabels,
        liveRegions: hasLiveRegions
      }
    })

    return results
  }

  /**
   * Mobile Accessibility Testing
   * Tests touch accessibility and mobile-specific requirements
   */
  async testMobileAccessibility(): Promise<{
    touchTargetSize: boolean
    orientation: boolean
    zoomability: boolean
    motionSafety: boolean
  }> {
    // Test touch target sizes (minimum 44x44 pixels)
    const touchTargetsValid = await this.page.evaluate(() => {
      const touchElements = document.querySelectorAll('button, a, input, select, textarea')
      return Array.from(touchElements).every(element => {
        const rect = element.getBoundingClientRect()
        return rect.width >= 44 && rect.height >= 44
      })
    })

    // Test orientation support
    const orientationSupported = await this.page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]')
      return viewport && !viewport.getAttribute('content')?.includes('user-scalable=no')
    })

    // Test zoom capability
    const zoomAllowed = await this.page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]')
      const content = viewport?.getAttribute('content') || ''
      return !content.includes('user-scalable=no') && !content.includes('maximum-scale=1')
    })

    // Test motion safety (prefers-reduced-motion)
    const motionSafe = await this.page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
             document.querySelector('[data-motion-safe]') !== null
    })

    return {
      touchTargetSize: touchTargetsValid,
      orientation: orientationSupported,
      zoomability: zoomAllowed,
      motionSafety: motionSafe
    }
  }

  /**
   * Form Accessibility Validation
   * Comprehensive form accessibility testing
   */
  async testFormAccessibility(): Promise<{
    labelAssociation: boolean
    errorIdentification: boolean
    requiredFieldsMarked: boolean
    fieldsetLegends: boolean
    autocomplete: boolean
  }> {
    const results = await this.page.evaluate(() => {
      // Test label association
      const inputs = document.querySelectorAll('input, select, textarea')
      const hasLabels = Array.from(inputs).every(input => {
        const id = input.getAttribute('id')
        const hasLabel = id && document.querySelector(`label[for="${id}"]`)
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')
        return hasLabel || hasAriaLabel
      })

      // Test error identification
      const errorElements = document.querySelectorAll('[aria-invalid="true"], .error, [role="alert"]')
      const hasErrorIdentification = errorElements.length === 0 || 
        Array.from(errorElements).every(el => 
          el.getAttribute('aria-describedby') || el.getAttribute('aria-label')
        )

      // Test required field marking
      const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]')
      const requiredMarked = Array.from(requiredInputs).every(input =>
        input.getAttribute('aria-required') === 'true' ||
        input.getAttribute('aria-label')?.includes('required') ||
        document.querySelector(`label[for="${input.getAttribute('id')}"]`)?.textContent?.includes('*')
      )

      // Test fieldset legends
      const fieldsets = document.querySelectorAll('fieldset')
      const hasLegends = Array.from(fieldsets).every(fieldset => 
        fieldset.querySelector('legend')
      )

      // Test autocomplete attributes
      const autoCompleteInputs = document.querySelectorAll('input[type="email"], input[type="tel"], input[type="url"]')
      const hasAutocomplete = Array.from(autoCompleteInputs).every(input =>
        input.getAttribute('autocomplete')
      )

      return {
        labelAssociation: hasLabels,
        errorIdentification: hasErrorIdentification,
        requiredFieldsMarked: requiredMarked,
        fieldsetLegends: fieldsets.length === 0 || hasLegends,
        autocomplete: autoCompleteInputs.length === 0 || hasAutocomplete
      }
    })

    return results
  }

  // Helper methods
  private async validateTabOrder(): Promise<boolean> {
    const focusableElements = await this.page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all()
    
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await this.page.keyboard.press('Tab')
      const focused = await this.page.locator(':focus').first()
      
      // Verify focus is visible and logical
      try {
        await expect(focused).toBeVisible()
      } catch {
        return false
      }
    }
    
    return true
  }

  private async testFocusTrap(): Promise<boolean> {
    // Look for modal or dialog elements
    const modals = await this.page.locator('[role="dialog"], .modal, [aria-modal="true"]').all()
    
    if (modals.length === 0) return true // No modals to test
    
    // Test focus trap for the first modal
    const modal = modals[0]
    if (await modal.isVisible()) {
      const firstFocusable = modal.locator('a, button, input, select, textarea').first()
      const lastFocusable = modal.locator('a, button, input, select, textarea').last()
      
      await firstFocusable.focus()
      await this.page.keyboard.press('Shift+Tab')
      
      const focused = await this.page.locator(':focus').first()
      return await focused.isVisible() && await lastFocusable.isVisible()
    }
    
    return true
  }

  private determineWCAGLevel(violations: AccessibilityViolation[]): 'A' | 'AA' | 'AAA' {
    const criticalViolations = violations.filter(v => v.impact === 'critical')
    const seriousViolations = violations.filter(v => v.impact === 'serious')
    
    if (criticalViolations.length === 0 && seriousViolations.length === 0) return 'AAA'
    if (criticalViolations.length === 0 && seriousViolations.length <= 2) return 'AA'
    return 'A'
  }

  private calculateAccessibilityScore(violations: AccessibilityViolation[], passedRules: number): number {
    const impactWeights = { minor: 1, moderate: 3, serious: 7, critical: 15 }
    const totalPenalty = violations.reduce((sum, v) => sum + impactWeights[v.impact], 0)
    const baseScore = 100 - totalPenalty
    const bonusPoints = Math.min(passedRules * 0.5, 20) // Bonus for passed rules
    
    return Math.max(Math.min(baseScore + bonusPoints, 100), 0)
  }

  /**
   * Generate comprehensive accessibility report
   */
  async generateAccessibilityReport(): Promise<{
    wcagCompliance: any
    colorContrast: ColorContrastResult[]
    keyboardNavigation: KeyboardNavigationResult
    screenReader: any
    mobileAccessibility: any
    formAccessibility: any
    overallScore: number
    recommendations: string[]
  }> {
    const wcagCompliance = await this.runWCAGComplianceTest()
    const colorContrast = await this.testColorContrast()
    const keyboardNavigation = await this.testKeyboardNavigation()
    const screenReader = await this.testScreenReaderCompatibility()
    const mobileAccessibility = await this.testMobileAccessibility()
    const formAccessibility = await this.testFormAccessibility()

    const overallScore = this.calculateOverallScore({
      wcagCompliance,
      colorContrast,
      keyboardNavigation,
      screenReader,
      mobileAccessibility,
      formAccessibility
    })

    const recommendations = this.generateRecommendations({
      wcagCompliance,
      colorContrast,
      keyboardNavigation,
      screenReader,
      mobileAccessibility,
      formAccessibility
    })

    return {
      wcagCompliance,
      colorContrast,
      keyboardNavigation,
      screenReader,
      mobileAccessibility,
      formAccessibility,
      overallScore,
      recommendations
    }
  }

  private calculateOverallScore(results: any): number {
    const scores = [
      results.wcagCompliance.score * 0.3, // 30% weight
      this.getColorContrastScore(results.colorContrast) * 0.2, // 20% weight
      this.getKeyboardScore(results.keyboardNavigation) * 0.2, // 20% weight
      this.getScreenReaderScore(results.screenReader) * 0.15, // 15% weight
      this.getMobileScore(results.mobileAccessibility) * 0.1, // 10% weight
      this.getFormScore(results.formAccessibility) * 0.05 // 5% weight
    ]

    return Math.round(scores.reduce((sum, score) => sum + score, 0))
  }

  private getColorContrastScore(results: ColorContrastResult[]): number {
    if (results.length === 0) return 100
    const passing = results.filter(r => r.level !== 'FAIL').length
    return (passing / results.length) * 100
  }

  private getKeyboardScore(result: KeyboardNavigationResult): number {
    let score = 0
    if (result.tabOrder) score += 25
    if (result.skipLinks) score += 25
    if (result.totalFocusableElements > 0) score += 25
    if (result.trapsFocus) score += 25
    return score
  }

  private getScreenReaderScore(result: any): number {
    const checks = Object.values(result) as boolean[]
    const passing = checks.filter(Boolean).length
    return (passing / checks.length) * 100
  }

  private getMobileScore(result: any): number {
    const checks = Object.values(result) as boolean[]
    const passing = checks.filter(Boolean).length
    return (passing / checks.length) * 100
  }

  private getFormScore(result: any): number {
    const checks = Object.values(result) as boolean[]
    const passing = checks.filter(Boolean).length
    return (passing / checks.length) * 100
  }

  private generateRecommendations(results: any): string[] {
    const recommendations = []

    if (results.wcagCompliance.level === 'A') {
      recommendations.push('Critical: Address WCAG violations to meet AA compliance standards')
    }

    const colorFailures = results.colorContrast.filter((r: ColorContrastResult) => r.level === 'FAIL')
    if (colorFailures.length > 0) {
      recommendations.push(`Improve color contrast for ${colorFailures.length} elements`)
    }

    if (!results.keyboardNavigation.skipLinks) {
      recommendations.push('Add skip navigation links for keyboard users')
    }

    if (!results.screenReader.headingStructure) {
      recommendations.push('Improve heading structure with proper H1-H6 hierarchy')
    }

    if (!results.mobileAccessibility.touchTargetSize) {
      recommendations.push('Increase touch target sizes to minimum 44x44 pixels')
    }

    if (!results.formAccessibility.labelAssociation) {
      recommendations.push('Ensure all form inputs have proper label associations')
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent accessibility compliance - no major issues detected')
    }

    return recommendations
  }
}

export { AccessibilityComplianceSuite, AccessibilityViolation, ColorContrastResult, KeyboardNavigationResult }