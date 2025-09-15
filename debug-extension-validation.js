/**
 * JASON - Extension Validation Debugging Script
 * Tests the customer validation API endpoints to identify the root cause
 */

const fetch = require('node-fetch');

class ExtensionValidationDebugger {
  constructor() {
    this.baseUrl = 'https://directorybolt.com';
    this.testCustomerId = 'DIR-2025-001234'; // Known test customer ID
  }

  async debugValidationFlow() {
    console.log('🔍 JASON - Starting Extension Validation Debug...\n');
    
    // Test 1: Check if the main validation endpoint is accessible
    await this.testEndpoint('/api/extension/validate', 'Main Extension Validation');
    
    // Test 2: Check the customer validation endpoint
    await this.testEndpoint('/api/customer/validate', 'Customer Validation');
    
    // Test 3: Check the secure validation endpoint
    await this.testEndpoint('/api/extension/secure-validate', 'Secure Extension Validation');
    
    // Test 4: Test direct Netlify function
    await this.testNetlifyFunction();
    
    // Test 5: Test Google Sheets connection
    await this.testGoogleSheetsConnection();
    
    console.log('\n🔍 JASON - Debug complete. Check results above for issues.');
  }

  async testEndpoint(endpoint, name) {
    console.log(`\n📡 Testing ${name}: ${this.baseUrl}${endpoint}`);\n    
    try {\n      const response = await fetch(`${this.baseUrl}${endpoint}`, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          'User-Agent': 'DirectoryBolt-Extension-Debug/1.0'\n        },\n        body: JSON.stringify({\n          customerId: this.testCustomerId,\n          extensionVersion: '3.0.1',\n          timestamp: Date.now()\n        })\n      });\n\n      console.log(`   Status: ${response.status} ${response.statusText}`);\n      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));\n      \n      const responseText = await response.text();\n      console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);\n      \n      if (response.ok) {\n        try {\n          const data = JSON.parse(responseText);\n          console.log(`   ✅ Success: Valid=${data.valid}, Customer=${data.customerName || data.businessName}`);\n          if (data.debug) {\n            console.log(`   🔧 Debug Info:`, data.debug);\n          }\n        } catch (e) {\n          console.log(`   ⚠️  Response not JSON:`, e.message);\n        }\n      } else {\n        console.log(`   ❌ Failed: ${response.status}`);\n      }\n      \n    } catch (error) {\n      console.log(`   💥 Network Error: ${error.message}`);\n    }\n  }\n\n  async testNetlifyFunction() {\n    console.log(`\\n🔧 Testing Direct Netlify Function...`);\n    \n    const netlifyUrl = `${this.baseUrl}/.netlify/functions/customer-validate`;\n    \n    try {\n      const response = await fetch(netlifyUrl, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          customerId: this.testCustomerId\n        })\n      });\n\n      console.log(`   Status: ${response.status} ${response.statusText}`);\n      \n      const responseText = await response.text();\n      console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);\n      \n    } catch (error) {\n      console.log(`   💥 Netlify Function Error: ${error.message}`);\n    }\n  }\n\n  async testGoogleSheetsConnection() {\n    console.log(`\\n📊 Testing Google Sheets Connection...`);\n    \n    try {\n      // Test the health endpoint which should check Google Sheets\n      const response = await fetch(`${this.baseUrl}/api/health`, {\n        method: 'GET',\n        headers: {\n          'User-Agent': 'DirectoryBolt-Extension-Debug/1.0'\n        }\n      });\n\n      console.log(`   Health Status: ${response.status} ${response.statusText}`);\n      \n      const responseText = await response.text();\n      console.log(`   Health Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);\n      \n      if (response.ok) {\n        try {\n          const data = JSON.parse(responseText);\n          if (data.googleSheets) {\n            console.log(`   📊 Google Sheets Status: ${data.googleSheets.status}`);\n            if (data.googleSheets.error) {\n              console.log(`   ❌ Google Sheets Error: ${data.googleSheets.error}`);\n            }\n          }\n        } catch (e) {\n          console.log(`   ⚠️  Health response not JSON`);\n        }\n      }\n      \n    } catch (error) {\n      console.log(`   💥 Health Check Error: ${error.message}`);\n    }\n  }\n\n  async testWithRealCustomerId(customerId) {\n    console.log(`\\n🎯 Testing with Real Customer ID: ${customerId}`);\n    \n    const endpoints = [\n      '/api/extension/validate',\n      '/api/customer/validate',\n      '/api/extension/secure-validate'\n    ];\n    \n    for (const endpoint of endpoints) {\n      console.log(`\\n   Testing ${endpoint}:`);\n      \n      try {\n        const response = await fetch(`${this.baseUrl}${endpoint}`, {\n          method: 'POST',\n          headers: {\n            'Content-Type': 'application/json',\n            'User-Agent': 'DirectoryBolt-Extension-Debug/1.0'\n          },\n          body: JSON.stringify({\n            customerId: customerId,\n            extensionVersion: '3.0.1',\n            timestamp: Date.now()\n          })\n        });\n\n        console.log(`     Status: ${response.status}`);\n        \n        const responseText = await response.text();\n        console.log(`     Response: ${responseText.substring(0, 300)}${responseText.length > 300 ? '...' : ''}`);\n        \n      } catch (error) {\n        console.log(`     Error: ${error.message}`);\n      }\n    }\n  }\n}\n\n// Run the debugger\nconst debugger = new ExtensionValidationDebugger();\n\n// Check if a specific customer ID was provided as argument\nconst customerId = process.argv[2];\n\nif (customerId) {\n  console.log(`🎯 JASON - Testing with specific Customer ID: ${customerId}`);\n  debugger.testWithRealCustomerId(customerId).then(() => {\n    console.log('\\n✅ JASON - Specific customer ID test complete.');\n  });\n} else {\n  debugger.debugValidationFlow().then(() => {\n    console.log('\\n✅ JASON - Full validation debug complete.');\n  });\n}\n\n// Export for use in other scripts\nmodule.exports = ExtensionValidationDebugger;\n"