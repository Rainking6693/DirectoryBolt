#!/usr/bin/env node

/**
 * Content Manager JSON Validation Script
 * Specifically validates JSON files used by the GuideContentManager
 * Addresses the getGuideBySlug SyntaxError: Unexpected end of JSON input
 */

const fs = require('fs')
const path = require('path')

function validateGuideJsonFile(filePath) {
  const filename = path.basename(filePath)
  const results = {
    filename,
    valid: false,
    errors: [],
    warnings: [],
    size: 0,
    hasRequiredFields: false
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      results.errors.push('File does not exist')
      return results
    }

    // Check file size
    const stats = fs.statSync(filePath)
    results.size = stats.size

    if (stats.size === 0) {
      results.errors.push('File is empty - will cause "Unexpected end of JSON input"')
      return results
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for empty or whitespace-only content
    if (!content.trim()) {
      results.errors.push('File contains only whitespace - will cause JSON parsing failure')
      return results
    }

    // Check for basic JSON structure
    const trimmed = content.trim()
    if (!trimmed.startsWith('{')) {
      results.errors.push('JSON does not start with opening brace - malformed structure')
      return results
    }

    if (!trimmed.endsWith('}')) {
      results.errors.push('JSON does not end with closing brace - incomplete JSON')
      return results
    }

    // Check for common JSON issues that cause "Unexpected end of JSON input"
    const openBraces = (content.match(/{/g) || []).length
    const closeBraces = (content.match(/}/g) || []).length
    if (openBraces !== closeBraces) {
      results.errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`)
      return results
    }

    // Attempt to parse JSON
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      results.errors.push(`JSON parsing failed: ${parseError.message}`)
      return results
    }

    // Validate parsed object
    if (typeof parsed !== 'object' || parsed === null) {
      results.errors.push('Parsed JSON is not an object')
      return results
    }

    // Check for required fields that contentManager expects
    const requiredFields = ['slug', 'title', 'directoryName']
    const missingRequired = []
    for (const field of requiredFields) {
      if (!parsed[field]) {
        missingRequired.push(field)
      }
    }

    if (missingRequired.length > 0) {
      results.errors.push(`Missing required fields: ${missingRequired.join(', ')}`)
    } else {
      results.hasRequiredFields = true
    }

    // Check for recommended fields
    const recommendedFields = ['category', 'difficulty', 'estimatedReadTime', 'publishedAt', 'updatedAt', 'content', 'seo']
    for (const field of recommendedFields) {
      if (!parsed[field]) {
        results.warnings.push(`Missing recommended field: ${field}`)
      }
    }

    // Validate nested structure
    if (parsed.content && typeof parsed.content === 'object') {
      if (!parsed.content.sections || !Array.isArray(parsed.content.sections)) {
        results.warnings.push('content.sections should be an array')
      }
    }

    if (parsed.seo && typeof parsed.seo === 'object') {
      if (!parsed.seo.title || !parsed.seo.description) {
        results.warnings.push('SEO object missing title or description')
      }
    }

    // If we get here and no required field errors, the file is valid
    if (missingRequired.length === 0) {
      results.valid = true
    }

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`)
  }

  return results
}

function validateAllContentManagerGuides() {
  const guidesDir = path.join(process.cwd(), 'data', 'guides')
  
  console.log('🔍 Validating Content Manager JSON guide files...')
  console.log(`📁 Directory: ${guidesDir}`)
  
  if (!fs.existsSync(guidesDir)) {
    console.error('❌ Guides directory does not exist!')
    console.log('   This will cause getGuideBySlug to fail during build')
    process.exit(1)
  }

  const files = fs.readdirSync(guidesDir).filter(file => 
    file.endsWith('.json') && !file.startsWith('_')
  )
  console.log(`📄 Found ${files.length} JSON guide files`)
  
  const results = {
    total: files.length,
    valid: 0,
    invalid: 0,
    warnings: 0,
    criticalErrors: 0,
    details: []
  }

  for (const file of files) {
    const filePath = path.join(guidesDir, file)
    const validation = validateGuideJsonFile(filePath)
    results.details.push(validation)

    if (validation.valid) {
      results.valid++
      console.log(`✅ ${file} - Valid (${validation.size} bytes)`)
      
      if (validation.warnings.length > 0) {
        results.warnings++
        console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`)
      }
    } else {
      results.invalid++
      
      // Check for critical errors that cause build failures
      const criticalErrors = validation.errors.filter(error => 
        error.includes('empty') || 
        error.includes('whitespace') || 
        error.includes('parsing failed') ||
        error.includes('incomplete JSON') ||
        error.includes('Mismatched braces')
      )
      
      if (criticalErrors.length > 0) {
        results.criticalErrors++
        console.log(`🚨 ${file} - CRITICAL ERROR (will break getGuideBySlug)`)
      } else {
        console.log(`❌ ${file} - Invalid`)
      }
      
      validation.errors.forEach(error => {
        const isCritical = criticalErrors.includes(error)
        console.log(`   ${isCritical ? '🚨' : '🔴'} ${isCritical ? 'CRITICAL' : 'Error'}: ${error}`)
      })
    }
  }

  console.log('\n📊 Content Manager Validation Summary:')
  console.log(`   Total files: ${results.total}`)
  console.log(`   Valid files: ${results.valid}`)
  console.log(`   Invalid files: ${results.invalid}`)
  console.log(`   Critical errors: ${results.criticalErrors}`)
  console.log(`   Files with warnings: ${results.warnings}`)

  if (results.criticalErrors > 0) {
    console.log('\n🚨 CRITICAL: Build will fail due to JSON parsing errors!')
    console.log('   These files will cause "SyntaxError: Unexpected end of JSON input" in getGuideBySlug')
    console.log('   Fix the critical errors above before deploying.')
    process.exit(1)
  } else if (results.invalid > 0) {
    console.log('\n⚠️  Some files have issues but may not break the build')
    console.log('   Consider fixing these issues for better reliability')
  } else {
    console.log('\n✅ All JSON files are valid! getGuideBySlug should work correctly.')
  }

  // Generate fix recommendations
  if (results.criticalErrors > 0) {
    console.log('\n🔧 Fix Recommendations:')
    console.log('   1. Check for empty or incomplete JSON files')
    console.log('   2. Validate JSON syntax with proper opening/closing braces')
    console.log('   3. Ensure all required fields (slug, title, directoryName) are present')
    console.log('   4. Run this script again after fixes')
  }

  return results.criticalErrors === 0
}

// Run validation if called directly
if (require.main === module) {
  const success = validateAllContentManagerGuides()
  process.exit(success ? 0 : 1)
}

module.exports = { validateGuideJsonFile, validateAllContentManagerGuides }