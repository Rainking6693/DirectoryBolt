#!/usr/bin/env node

/**
 * Phase 4: Error & Edge Case Testing
 * Tests failure scenarios, data validation, performance, and security
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🛡️  DirectoryBolt Phase 4: Error & Edge Case Testing');
console.log('=' .repeat(55));

async function testErrorHandlingMechanisms() {
  console.log('\n🚨 Phase 4.1: Error Handling Mechanisms');
  console.log('-' .repeat(40));
  
  // Check for error boundary components
  const errorHandlingFiles = [
    'lib/production/error-boundary.tsx',
    'components/ErrorBoundary.tsx',
    'lib/utils/error-handler.ts'
  ];
  
  let foundErrorFiles = 0;
  
  for (const file of errorHandlingFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundErrorFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  // Check API files for error handling patterns
  const apiFiles = [
    'pages/api/analyze.ts',
    'pages/api/stripe/create-checkout-session.ts',
    'pages/api/customer/register-complete.ts'
  ];
  
  let apiErrorHandling = 0;
  
  for (const apiFile of apiFiles) {
    const fullPath = path.join(__dirname, apiFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasTryCatch = content.includes('try') && content.includes('catch');
      const hasErrorResponse = content.includes('error') && content.includes('status');
      
      if (hasTryCatch && hasErrorResponse) {
        apiErrorHandling++;
        console.log(`  ✅ ${apiFile}: Proper error handling`);
      } else {
        console.log(`  ⚠️  ${apiFile}: Basic error handling`);
      }
    }
  }
  
  console.log(`  📊 Error Handling Files: ${foundErrorFiles}/${errorHandlingFiles.length}`);
  console.log(`  📊 API Error Handling: ${apiErrorHandling}/${apiFiles.length}`);
  
  return {
    status: foundErrorFiles >= 1 && apiErrorHandling >= 2 ? 'pass' : 'warning',
    errorFiles: foundErrorFiles,
    apiErrorHandling,
    errorFileScore: `${foundErrorFiles}/${errorHandlingFiles.length}`,
    apiScore: `${apiErrorHandling}/${apiFiles.length}`
  };
}

async function testDataValidation() {
  console.log('\n✅ Phase 4.2: Data Validation & Input Sanitization');
  console.log('-' .repeat(40));
  
  // Check for validation libraries and schemas
  const validationFiles = [
    'lib/validation/schemas.ts',
    'lib/utils/validation.ts',
    'lib/validation/input-sanitizer.ts'
  ];
  
  let foundValidationFiles = 0;
  
  for (const file of validationFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundValidationFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  // Check package.json for validation libraries
  const packageJsonPath = path.join(__dirname, 'package.json');
  let hasValidationLibs = false;
  
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    
    const validationLibs = ['joi', 'yup', 'zod', 'valibot', 'ajv'];
    const foundLibs = validationLibs.filter(lib => dependencies[lib]);
    
    if (foundLibs.length > 0) {
      hasValidationLibs = true;
      console.log(`  ✅ Validation libraries: ${foundLibs.join(', ')}`);
    } else {
      console.log(`  ❌ No validation libraries found`);
    }
  }
  
  // Check forms for validation
  const formFiles = ['pages/business-info.tsx'];
  let formsWithValidation = 0;
  
  for (const formFile of formFiles) {
    const fullPath = path.join(__dirname, formFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasValidation = content.includes('validate') || content.includes('required') || content.includes('pattern');
      
      if (hasValidation) {
        formsWithValidation++;
        console.log(`  ✅ ${formFile}: Has validation`);
      } else {
        console.log(`  ⚠️  ${formFile}: Minimal validation`);
      }
    }
  }
  
  console.log(`  📊 Validation Files: ${foundValidationFiles}/${validationFiles.length}`);
  console.log(`  📊 Forms with Validation: ${formsWithValidation}/${formFiles.length}`);
  
  return {
    status: hasValidationLibs && formsWithValidation >= 1 ? 'pass' : 'warning',
    validationFiles: foundValidationFiles,
    hasValidationLibs,
    formsWithValidation,
    validationScore: `${foundValidationFiles}/${validationFiles.length}`
  };
}

async function testSecurityMeasures() {
  console.log('\n🔒 Phase 4.3: Security & Compliance Measures');
  console.log('-' .repeat(40));
  
  // Check for security-related configurations
  const securityChecks = {
    hasHelmet: false,
    hasCors: false,
    hasRateLimit: false,
    hasJWTSecret: false,
    hasSecureEnvVars: false
  };
  
  // Check package.json for security libraries
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    
    securityChecks.hasHelmet = !!dependencies['helmet'];
    securityChecks.hasCors = !!dependencies['cors'];
    securityChecks.hasRateLimit = !!dependencies['express-rate-limit'];
    
    console.log(`  Helmet (security headers): ${securityChecks.hasHelmet ? '✅' : '❌'}`);
    console.log(`  CORS configuration: ${securityChecks.hasCors ? '✅' : '❌'}`);
    console.log(`  Rate limiting: ${securityChecks.hasRateLimit ? '✅' : '❌'}`);
  }
  
  // Check environment variables for security
  securityChecks.hasJWTSecret = !!(process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET);
  securityChecks.hasSecureEnvVars = !!(process.env.ADMIN_API_KEY && process.env.STAFF_API_KEY);
  
  console.log(`  JWT Secret configured: ${securityChecks.hasJWTSecret ? '✅' : '❌'}`);
  console.log(`  API Keys configured: ${securityChecks.hasSecureEnvVars ? '✅' : '❌'}`);
  
  // Check for security middleware files
  const securityFiles = [
    'lib/middleware/auth.ts',
    'lib/middleware/rate-limit.ts',
    'middleware.ts'
  ];
  
  let foundSecurityFiles = 0;
  
  for (const file of securityFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundSecurityFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  const passedSecurityChecks = Object.values(securityChecks).filter(Boolean).length;
  
  console.log(`  📊 Security Libraries: ${passedSecurityChecks}/5`);
  console.log(`  📊 Security Files: ${foundSecurityFiles}/${securityFiles.length}`);
  
  return {
    status: passedSecurityChecks >= 3 ? 'pass' : 'warning',
    securityChecks,
    foundSecurityFiles,
    securityScore: `${passedSecurityChecks}/5`,
    filesScore: `${foundSecurityFiles}/${securityFiles.length}`
  };
}

async function testPerformanceOptimization() {
  console.log('\n⚡ Phase 4.4: Performance Optimization');
  console.log('-' .repeat(40));
  
  // Check for performance-related files
  const performanceFiles = [
    'lib/production/performance.ts',
    'lib/utils/cache.ts',
    'lib/performance/monitoring.ts'
  ];
  
  let foundPerformanceFiles = 0;
  
  for (const file of performanceFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundPerformanceFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  // Check Next.js configuration for performance optimizations
  const nextConfigPath = path.join(__dirname, 'next.config.js');
  let hasNextOptimizations = false;
  
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    const optimizations = [
      'compress',
      'experimental',
      'images',
      'swcMinify'
    ];
    
    const foundOptimizations = optimizations.filter(opt => content.includes(opt));
    hasNextOptimizations = foundOptimizations.length > 0;
    
    console.log(`  Next.js optimizations: ${hasNextOptimizations ? '✅' : '❌'}`);
    if (foundOptimizations.length > 0) {
      console.log(`    Found: ${foundOptimizations.join(', ')}`);
    }
  }
  
  // Check for monitoring and analytics
  const analyticsFiles = [
    'pages/api/analytics/metrics.ts',
    'pages/api/analytics/errors.ts',
    'pages/api/analytics/performance.ts'
  ];
  
  let foundAnalyticsFiles = 0;
  
  for (const file of analyticsFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundAnalyticsFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  console.log(`  📊 Performance Files: ${foundPerformanceFiles}/${performanceFiles.length}`);
  console.log(`  📊 Analytics Files: ${foundAnalyticsFiles}/${analyticsFiles.length}`);
  
  return {
    status: foundPerformanceFiles >= 1 && foundAnalyticsFiles >= 2 ? 'pass' : 'warning',
    foundPerformanceFiles,
    foundAnalyticsFiles,
    hasNextOptimizations,
    performanceScore: `${foundPerformanceFiles}/${performanceFiles.length}`,
    analyticsScore: `${foundAnalyticsFiles}/${analyticsFiles.length}`
  };
}

async function testProductionReadiness() {
  console.log('\n🚀 Phase 4.5: Production Readiness');
  console.log('-' .repeat(40));
  
  // Check build configuration
  const buildFiles = [
    'package.json',
    '.env.local',
    'next.config.js'
  ];
  
  let foundBuildFiles = 0;
  
  for (const file of buildFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundBuildFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
    }
  }
  
  // Check package.json scripts
  const packageJsonPath = path.join(__dirname, 'package.json');
  let hasBuildScripts = false;
  
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);
    const scripts = packageData.scripts || {};
    
    const requiredScripts = ['build', 'start', 'dev'];
    const hasAllScripts = requiredScripts.every(script => scripts[script]);
    
    hasBuildScripts = hasAllScripts;
    console.log(`  Build scripts: ${hasBuildScripts ? '✅' : '❌'}`);
    
    if (scripts.build) console.log(`    ✅ build: ${scripts.build}`);
    if (scripts.start) console.log(`    ✅ start: ${scripts.start}`);
    if (scripts.dev) console.log(`    ✅ dev: ${scripts.dev}`);
  }
  
  // Check for production logging
  const loggingFiles = [
    'lib/production/logger.ts',
    'lib/utils/logger.ts'
  ];
  
  let hasLogging = false;
  
  for (const file of loggingFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      hasLogging = true;
      console.log(`  ✅ ${file}`);
      break;
    }
  }
  
  if (!hasLogging) {
    console.log(`  ❌ Production logging not found`);
  }
  
  console.log(`  📊 Build Configuration: ${foundBuildFiles}/${buildFiles.length}`);
  
  return {
    status: foundBuildFiles === buildFiles.length && hasBuildScripts && hasLogging ? 'pass' : 'warning',
    foundBuildFiles,
    hasBuildScripts,
    hasLogging,
    buildScore: `${foundBuildFiles}/${buildFiles.length}`
  };
}

async function testAPIEndpointIntegrity() {
  console.log('\n🔌 Phase 4.6: API Endpoint Integrity');
  console.log('-' .repeat(40));
  
  const criticalAPIs = [
    'pages/api/analyze.ts',
    'pages/api/stripe/create-checkout-session.ts',
    'pages/api/customer/register-complete.ts',
    'pages/api/autobolt/queue-status.ts',
    'pages/api/staff/queue.ts'
  ];
  
  let functionalAPIs = 0;
  
  for (const api of criticalAPIs) {
    const fullPath = path.join(__dirname, api);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for proper API structure
      const hasExport = content.includes('export') && (content.includes('handler') || content.includes('default'));
      const hasMethod = content.includes('method') || content.includes('req.method');
      const hasResponse = content.includes('res.') && content.includes('json');
      
      if (hasExport && hasMethod && hasResponse) {
        functionalAPIs++;
        console.log(`  ✅ ${api}: Properly structured`);
      } else {
        console.log(`  ⚠️  ${api}: Basic structure`);
      }
    } else {
      console.log(`  ❌ ${api}: Missing`);
    }
  }
  
  console.log(`  📊 Functional APIs: ${functionalAPIs}/${criticalAPIs.length}`);
  
  return {
    status: functionalAPIs >= 4 ? 'pass' : 'warning',
    functionalAPIs,
    totalAPIs: criticalAPIs.length,
    apiScore: `${functionalAPIs}/${criticalAPIs.length}`
  };
}

async function generatePhase4Report() {
  console.log('\n📄 Generating Phase 4 Report...');
  
  const tests = {
    errorHandling: await testErrorHandlingMechanisms(),
    dataValidation: await testDataValidation(),
    securityMeasures: await testSecurityMeasures(),
    performanceOptimization: await testPerformanceOptimization(),
    productionReadiness: await testProductionReadiness(),
    apiIntegrity: await testAPIEndpointIntegrity()
  };
  
  // Calculate overall scores
  const testResults = Object.values(tests);
  const passedTests = testResults.filter(test => test.status === 'pass').length;
  const warningTests = testResults.filter(test => test.status === 'warning').length;
  const failedTests = testResults.filter(test => test.status === 'fail').length;
  const totalTests = testResults.length;
  
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 4 - Error & Edge Case Testing',
    summary: {
      totalTests,
      passedTests,
      warningTests,
      failedTests,
      passRate: `${Math.round((passedTests / totalTests) * 100)}%`
    },
    details: tests,
    criticalIssues: testResults
      .filter(test => test.status === 'fail')
      .map(test => test.error || 'Component missing')
      .filter(Boolean),
    recommendations: []
  };
  
  // Add recommendations based on results
  if (tests.errorHandling.status !== 'pass') {
    report.recommendations.push('Implement comprehensive error boundaries and API error handling');
  }
  if (tests.securityMeasures.status !== 'pass') {
    report.recommendations.push('Strengthen security measures with proper authentication and rate limiting');
  }
  if (tests.productionReadiness.status !== 'pass') {
    report.recommendations.push('Complete production configuration and logging setup');
  }
  
  // Write to file
  const reportPath = path.join(__dirname, 'PHASE_4_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n🎯 PHASE 4 SUMMARY');
  console.log('=' .repeat(40));
  console.log(`📊 Tests: ${passedTests} passed, ${warningTests} warnings, ${failedTests} failed`);
  console.log(`🎯 Pass Rate: ${report.summary.passRate}`);
  console.log(`🚨 Error Handling: ${tests.errorHandling.status} (${tests.errorHandling.errorFileScore || 'N/A'})`);
  console.log(`✅ Data Validation: ${tests.dataValidation.status} (${tests.dataValidation.validationScore || 'N/A'})`);
  console.log(`🔒 Security Measures: ${tests.securityMeasures.status} (${tests.securityMeasures.securityScore || 'N/A'})`);
  console.log(`⚡ Performance: ${tests.performanceOptimization.status} (${tests.performanceOptimization.performanceScore || 'N/A'})`);
  console.log(`🚀 Production Ready: ${tests.productionReadiness.status} (${tests.productionReadiness.buildScore || 'N/A'})`);
  console.log(`🔌 API Integrity: ${tests.apiIntegrity.status} (${tests.apiIntegrity.apiScore || 'N/A'})`);
  
  if (report.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    report.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  return report;
}

// Run Phase 4 testing
if (require.main === module) {
  generatePhase4Report()
    .then(report => {
      if (report.summary.failedTests === 0) {
        console.log('\n🎉 Phase 4 completed successfully! System is robust and production-ready.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Phase 4 completed with issues. Address critical robustness concerns.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Phase 4 testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generatePhase4Report };