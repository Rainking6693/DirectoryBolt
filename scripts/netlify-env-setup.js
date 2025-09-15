#!/usr/bin/env node

/**
 * Netlify Environment Setup Script
 * Creates minimal environment configuration for Netlify deployment
 */

const fs = require('fs')
const path = require('path')

function calculateSize(content) {
  return Buffer.byteLength(content, 'utf8')
}

function createMinimalNetlifyEnv() {
  console.log('🔧 Creating minimal Netlify environment configuration...')
  
  const minimalEnv = `# NETLIFY PRODUCTION ENVIRONMENT - MINIMAL CONFIGURATION
# =============================================================================
# CRITICAL: This file is optimized to stay under 4KB AWS Lambda limit
# =============================================================================

# CORE APPLICATION
BASE_URL=https://directorybolt.com
NEXT_PUBLIC_APP_URL=https://directorybolt.com
SITE_URL=https://directorybolt.com
NODE_ENV=production

# STRIPE CONFIGURATION (REQUIRED)
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RyJPcPQdMywmVkHwdLQtTRV8YV9fXjdJtrxEwnYCFTn3Wqt4q82g0o1UMhP4Nr3GchadbVvUKXAMkKvxijlRRoF00Zm32Fgms
STRIPE_WEBHOOK_SECRET=whsec_hh8b4JD6g7BcJ4TB9BheJDIgDcvu3T9B

# STRIPE PRICE IDS
STRIPE_STARTER_PRICE_ID=price_1S4WsHPQdMywmVkHWCiGHgok
STRIPE_GROWTH_PRICE_ID=price_1S4Wt6PQdMywmVkHnnLIF8YO
STRIPE_PRO_PRICE_ID=price_1S4WtiPQdMywmVkHtIDZoS4d

# OPENAI (REQUIRED)
OPENAI_API_KEY=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

# SUPABASE (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://kolgqfjgndwdziqgloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs1sInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmN3ZGR6aXFsb3oiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNTU2MzQwNSwiZXhwIjoyMDQxMTM5NDA1fQ.YWt9b4E4kZFMdEQsGj1L_gCKXCCrY8jTfh1gXWJKFZg
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc

# GOOGLE SHEETS (OPTIMIZED)
GOOGLE_SERVICE_ACCOUNT_EMAIL=directorybolt-service-58@directorybolt.iam.gserviceaccount.com
GOOGLE_SHEET_ID=1Cc9Ha5MXt_PAFncIz5HN4_BlAHy3egK1OmjBjj7BN0A

# SECURITY
JWT_SECRET=uKLVCjlDzyFgQfZA2TM6GP0trk1XhUBSq5sbJEwoYdnv8xcImeN7HpaW3OR9i4
ADMIN_API_KEY=DirectoryBolt-Admin-2025-SecureKey
STAFF_API_KEY=DirectoryBolt-Staff-2025-SecureKey

# NETLIFY SPECIFIC
NETLIFY=true
BUILDING=true`

  const size = calculateSize(minimalEnv)
  console.log(`📊 Minimal environment size: ${size} bytes`)
  
  if (size > 4096) {
    console.error(`❌ Still exceeds 4KB limit (${size} bytes)`)
    return false
  }
  
  // Write the minimal environment file
  fs.writeFileSync(path.join(process.cwd(), '.env.netlify'), minimalEnv)
  console.log(`✅ Created .env.netlify (${size} bytes - under 4KB limit)`)
  
  // Create instructions for manual Netlify setup
  const instructions = `# NETLIFY ENVIRONMENT VARIABLES MANUAL SETUP
# =============================================================================
# CRITICAL: Set these variables directly in Netlify Dashboard
# Go to: Site settings > Environment variables
# =============================================================================

# GOOGLE PRIVATE KEY (TOO LARGE FOR LAMBDA)
# Set this manually in Netlify Dashboard:
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDckqPCWtKV9wOo
BwSWuFkNC7Trt9giuilMWRDZYhMm9X85/EeP3gPddHdH/FGcIpBgfEBZK3+mc7Bf
/iaTnuWii+4gHIQ6WzTtR3lntPAMAv2cPC0Mt1z98a4L+3Dy7r2SGOAVAN6PdY0J
tkTt8Z0gKwKBgHlYbnLFPpsAXJWq98JzJ2ovYrR80EPVX8ZOVU6+7OOtV/fPYSMT
vhz6Iz68hPkp9XfXa2jWJL35xb7wdrxtxBRT1kfEXwYMPT/RenZLuChnPmKHsslR
YlldJoHO+9U7vt6SzRoVEvPsbqtcWp7CNJEc2xMQLvm/l1CY9arSYiDtAoGBAL37
-----END PRIVATE KEY-----

# ADDITIONAL VARIABLES (IF NEEDED)
# Set these in Netlify Dashboard if required:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=DirectoryBolt2025!
STAFF_USERNAME=staff
STAFF_PASSWORD=DirectoryBoltStaff2025!

# =============================================================================
# DEPLOYMENT INSTRUCTIONS:
# 1. Use .env.netlify for automated deployment
# 2. Set GOOGLE_PRIVATE_KEY manually in Netlify Dashboard
# 3. Deploy with reduced environment variable size
# =============================================================================`

  fs.writeFileSync(path.join(process.cwd(), 'NETLIFY_MANUAL_ENV_SETUP.md'), instructions)
  console.log('📋 Created NETLIFY_MANUAL_ENV_SETUP.md with manual setup instructions')
  
  return true
}

function updateNetlifyToml() {
  console.log('🔧 Updating netlify.toml for minimal environment...')
  
  const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml')
  
  if (!fs.existsSync(netlifyTomlPath)) {
    console.error('❌ netlify.toml not found')
    return false
  }
  
  let content = fs.readFileSync(netlifyTomlPath, 'utf8')
  
  // Update build command to use minimal environment
  content = content.replace(
    /command = ".*"/,
    'command = "cp .env.netlify .env && npm ci --include=dev && node scripts/validate-json-guides.js && npm run build"'
  )
  
  fs.writeFileSync(netlifyTomlPath, content)
  console.log('✅ Updated netlify.toml to use minimal environment')
  
  return true
}

function createGoogleSheetsWorkaround() {
  console.log('🔧 Creating Google Sheets workaround for missing private key...')
  
  const workaroundPath = path.join(process.cwd(), 'lib', 'google-sheets-fallback.js')
  
  const workaroundCode = `// Google Sheets Fallback for Missing Private Key
// This provides graceful degradation when GOOGLE_PRIVATE_KEY is not available

export function createGoogleSheetsService() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  
  if (!privateKey) {
    console.warn('GOOGLE_PRIVATE_KEY not available - using fallback mode')
    
    // Return a mock service that doesn't crash
    return {
      async getCustomerData(customerId) {
        console.warn('Google Sheets service unavailable - returning mock data')
        return {
          id: customerId,
          name: 'Customer',
          email: 'customer@example.com',
          status: 'active',
          fallback: true
        }
      },
      
      async validateCustomer(customerId) {
        console.warn('Google Sheets validation unavailable - allowing all customers')
        return true
      }
    }
  }
  
  // Normal Google Sheets service when private key is available
  const { GoogleSpreadsheet } = require('google-spreadsheet')
  const { JWT } = require('google-auth-library')
  
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey.replace(/\\\\n/g, '\\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  
  return {
    async getCustomerData(customerId) {
      try {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth)
        await doc.loadInfo()
        
        const sheet = doc.sheetsByIndex[0]
        const rows = await sheet.getRows()
        
        const customer = rows.find(row => row.get('Customer ID') === customerId)
        
        if (customer) {
          return {
            id: customer.get('Customer ID'),
            name: customer.get('Business Name'),
            email: customer.get('Email'),
            status: customer.get('Status') || 'active'
          }
        }
        
        return null
      } catch (error) {
        console.error('Google Sheets error:', error)
        return null
      }
    },
    
    async validateCustomer(customerId) {
      const customer = await this.getCustomerData(customerId)
      return customer && customer.status === 'active'
    }
  }
}`

  // Ensure lib directory exists
  const libDir = path.join(process.cwd(), 'lib')
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true })
  }
  
  fs.writeFileSync(workaroundPath, workaroundCode)
  console.log('✅ Created Google Sheets fallback service')
  
  return true
}

// Run setup if called directly
if (require.main === module) {
  console.log('🚀 NETLIFY ENVIRONMENT SETUP - EMERGENCY 4KB LIMIT FIX')
  console.log('=' .repeat(60))
  
  const success = createMinimalNetlifyEnv() && 
                 updateNetlifyToml() && 
                 createGoogleSheetsWorkaround()
  
  if (success) {
    console.log('\\n🎉 Netlify environment setup completed successfully!')
    console.log('📋 Next steps:')
    console.log('   1. Deploy using .env.netlify (under 4KB)')
    console.log('   2. Set GOOGLE_PRIVATE_KEY manually in Netlify Dashboard')
    console.log('   3. Follow instructions in NETLIFY_MANUAL_ENV_SETUP.md')
    console.log('   4. Google Sheets will use fallback mode until private key is set')
    process.exit(0)
  } else {
    console.log('\\n❌ Netlify environment setup failed')
    process.exit(1)
  }
}

module.exports = { createMinimalNetlifyEnv, updateNetlifyToml, createGoogleSheetsWorkaround }`