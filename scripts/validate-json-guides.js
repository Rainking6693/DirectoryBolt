#!/usr/bin/env node

/**
 * JSON Guide Validation Script
 * Validates all JSON files in data/guides directory to prevent build failures
 */

const fs = require('fs')
const path = require('path')

function validateJsonFile(filePath) {
  const filename = path.basename(filePath)
  const results = {
    filename,
    valid: false,
    errors: [],
    warnings: [],
    size: 0
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
      results.errors.push('File is empty')
      return results
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for empty or whitespace-only content
    if (!content.trim()) {
      results.errors.push('File contains only whitespace')
      return results
    }

    // Check for basic JSON structure
    const trimmed = content.trim()
    if (!trimmed.startsWith('{')) {
      results.errors.push('JSON does not start with opening brace')
      return results
    }

    if (!trimmed.endsWith('}')) {
      results.errors.push('JSON does not end with closing brace')
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

    // Check for required fields
    const requiredFields = ['slug', 'title', 'directoryName']
    for (const field of requiredFields) {
      if (!parsed[field]) {
        results.warnings.push(`Missing or empty required field: ${field}`)
      }
    }

    // Check for recommended fields
    const recommendedFields = ['category', 'difficulty', 'estimatedReadTime', 'publishedAt', 'updatedAt']
    for (const field of recommendedFields) {
      if (!parsed[field]) {
        results.warnings.push(`Missing recommended field: ${field}`)
      }
    }

    // If we get here, the file is valid
    results.valid = true

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`)
  }

  return results
}

function validateAllGuides() {
  const guidesDir = path.join(process.cwd(), 'data', 'guides')
  
  console.log('🔍 Validating JSON guide files...')
  console.log(`📁 Directory: ${guidesDir}`)
  
  if (!fs.existsSync(guidesDir)) {
    console.error('❌ Guides directory does not exist!')
    process.exit(1)
  }

  const files = fs.readdirSync(guidesDir).filter(file => file.endsWith('.json'))
  console.log(`📄 Found ${files.length} JSON files`)
  
  const results = {
    total: files.length,
    valid: 0,
    invalid: 0,
    warnings: 0,
    details: []
  }

  for (const file of files) {
    const filePath = path.join(guidesDir, file)
    const validation = validateJsonFile(filePath)
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
      console.log(`❌ ${file} - Invalid`)
      validation.errors.forEach(error => {
        console.log(`   🔴 Error: ${error}`)
      })
    }
  }

  console.log('\n📊 Validation Summary:')
  console.log(`   Total files: ${results.total}`)
  console.log(`   Valid files: ${results.valid}`)
  console.log(`   Invalid files: ${results.invalid}`)
  console.log(`   Files with warnings: ${results.warnings}`)

  if (results.invalid > 0) {
    console.log('\n🚨 Build may fail due to invalid JSON files!')
    console.log('   Please fix the errors above before deploying.')
    process.exit(1)
  } else {
    console.log('\n✅ All JSON files are valid! Build should succeed.')
    process.exit(0)
  }
}

// Run validation if called directly
if (require.main === module) {
  validateAllGuides()
}

module.exports = { validateJsonFile, validateAllGuides }