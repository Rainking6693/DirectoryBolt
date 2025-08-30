#!/usr/bin/env node
/**
 * 🔍 PRICING VALIDATION TEST: DirectoryBolt Pricing Consistency Check
 * 
 * This script validates pricing consistency between requirements, frontend, and API
 * 
 * Author: Claude QA Engineer
 * Date: 2025-08-30
 */

const fs = require('fs');

function log(message, type = 'info') {
  const prefix = { info: '🔍', success: '✅', warning: '⚠️', error: '❌' };
  console.log(`${prefix[type]} ${message}`);
}

function validatePricing() {
  log('Starting Pricing Validation...', 'info');
  
  // Expected pricing from requirements
  const REQUIREMENTS_PRICING = {
    plans: {
      starter: { price: 49, name: 'Starter' },
      growth: { price: 89, name: 'Growth' },
      pro: { price: 159, name: 'Pro' },
      subscription: { price: 49, name: 'Subscription' }
    },
    addons: {
      fasttrack: { price: 25, name: 'Fast-Track Submission' },
      premium: { price: 15, name: 'Premium Directories Only' },
      qa: { price: 10, name: 'Manual QA Review' },
      csv: { price: 9, name: 'CSV Export' }
    }
  };
  
  // Read actual implementation files
  const apiContent = fs.readFileSync('./pages/api/create-checkout-session-v3.js', 'utf8');
  const pricingContent = fs.readFileSync('./components/PricingPage.tsx', 'utf8');
  
  const issues = [];
  
  log('Checking API Pricing...', 'info');
  
  // Extract API pricing
  const apiPricingMatch = apiContent.match(/const PRICING = {([\s\S]*?)};/);
  if (apiPricingMatch) {
    const apiPricingText = apiPricingMatch[1];
    
    // Check each plan
    Object.entries(REQUIREMENTS_PRICING.plans).forEach(([planId, expected]) => {
      const expectedCents = expected.price * 100;
      
      // Look for the plan in API
      const planRegex = new RegExp(`${planId}:\\s*{[^}]*amount:\\s*(\\d+)`, 'i');
      const planMatch = apiPricingText.match(planRegex);
      
      if (planMatch) {
        const actualCents = parseInt(planMatch[1], 10);
        const actualDollars = actualCents / 100;
        
        if (actualCents !== expectedCents) {
          issues.push({
            type: 'PRICING MISMATCH',
            severity: 'MAJOR',
            plan: planId,
            expected: `$${expected.price}`,
            actual: `$${actualDollars}`,
            location: 'API'
          });
          log(`❌ ${planId}: Expected $${expected.price}, found $${actualDollars} in API`, 'error');
        } else {
          log(`✅ ${planId}: Correct price $${actualDollars} in API`, 'success');
        }
      } else {
        issues.push({
          type: 'MISSING PLAN',
          severity: 'CRITICAL',
          plan: planId,
          location: 'API'
        });
        log(`❌ ${planId}: Not found in API`, 'error');
      }
    });
    
    // Check addons
    Object.entries(REQUIREMENTS_PRICING.addons).forEach(([addonId, expected]) => {
      const expectedCents = expected.price * 100;
      
      const addonRegex = new RegExp(`${addonId}:\\s*{[^}]*amount:\\s*(\\d+)`, 'i');
      const addonMatch = apiPricingText.match(addonRegex);
      
      if (addonMatch) {
        const actualCents = parseInt(addonMatch[1], 10);
        const actualDollars = actualCents / 100;
        
        if (actualCents !== expectedCents) {
          issues.push({
            type: 'ADDON PRICING MISMATCH',
            severity: 'MAJOR',
            addon: addonId,
            expected: `$${expected.price}`,
            actual: `$${actualDollars}`,
            location: 'API'
          });
          log(`❌ Addon ${addonId}: Expected $${expected.price}, found $${actualDollars} in API`, 'error');
        } else {
          log(`✅ Addon ${addonId}: Correct price $${actualDollars} in API`, 'success');
        }
      } else {
        issues.push({
          type: 'MISSING ADDON',
          severity: 'MAJOR',
          addon: addonId,
          location: 'API'
        });
        log(`❌ Addon ${addonId}: Not found in API`, 'error');
      }
    });
  }
  
  log('Checking Frontend Pricing...', 'info');
  
  // Check frontend pricing
  Object.entries(REQUIREMENTS_PRICING.plans).forEach(([planId, expected]) => {
    // Look for price in frontend component
    const priceRegex = new RegExp(`price:\\s*${expected.price}[^\\d]`, 'g');
    const priceMatches = pricingContent.match(priceRegex);
    
    if (priceMatches) {
      log(`✅ ${planId}: Price $${expected.price} found in frontend`, 'success');
    } else {
      // Check if any price is defined for this plan
      const planRegex = new RegExp(`id:\\s*['"]${planId}['"][\\s\\S]*?price:\\s*(\\d+)`, 'i');
      const planMatch = pricingContent.match(planRegex);
      
      if (planMatch) {
        const actualPrice = parseInt(planMatch[1], 10);
        if (actualPrice !== expected.price) {
          issues.push({
            type: 'FRONTEND PRICING MISMATCH',
            severity: 'MAJOR',
            plan: planId,
            expected: `$${expected.price}`,
            actual: `$${actualPrice}`,
            location: 'Frontend Component'
          });
          log(`❌ ${planId}: Expected $${expected.price}, found $${actualPrice} in frontend`, 'error');
        }
      } else {
        issues.push({
          type: 'FRONTEND PRICE NOT FOUND',
          severity: 'MAJOR',
          plan: planId,
          location: 'Frontend Component'
        });
        log(`❌ ${planId}: Price not clearly found in frontend`, 'error');
      }
    }
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
      majorIssues: issues.filter(i => i.severity === 'MAJOR').length,
      status: issues.length === 0 ? 'PASSED' : 'FAILED'
    },
    issues,
    expectedPricing: REQUIREMENTS_PRICING
  };
  
  // Save detailed report
  fs.writeFileSync('pricing_validation_report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('💰 PRICING VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`Status: ${report.summary.status}`);
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`Major Issues: ${report.summary.majorIssues}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.type}`);
      if (issue.plan) console.log(`   Plan: ${issue.plan}`);
      if (issue.addon) console.log(`   Addon: ${issue.addon}`);
      if (issue.expected) console.log(`   Expected: ${issue.expected}`);
      if (issue.actual) console.log(`   Actual: ${issue.actual}`);
      console.log(`   Location: ${issue.location}`);
      console.log('');
    });
  } else {
    console.log('\n✅ All pricing configurations are consistent!');
  }
  
  console.log('📄 Detailed report saved to: pricing_validation_report.json');
  console.log('='.repeat(80));
  
  return report;
}

// Run validation
if (require.main === module) {
  validatePricing();
}

module.exports = { validatePricing };