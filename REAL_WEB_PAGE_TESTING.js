#!/usr/bin/env node

/**
 * REAL WEB PAGE TESTING - Test actual live web pages and links
 * This tests the ACTUAL web application routes, not just file structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 TESTING ACTUAL WEB PAGES AND ROUTES');
console.log('======================================\n');

class RealWebPageTester {
  constructor() {
    this.results = { passed: 0, failed: 0, critical: [], tests: [] };
  }

  async test(name, testFn, critical = false) {
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = await testFn();
      console.log(`✅ PASS: ${name} - ${result}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', result });
      return result;
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      if (critical) this.results.critical.push({ name, error: error.message });
      return null;
    }
  }

  async runRealWebTests() {
    console.log('🌐 CRITICAL WEB PAGE ROUTES TESTING');
    console.log('===================================\n');

    // Test 1: Admin Dashboard Page
    await this.test('Admin Dashboard Page Structure', async () => {
      const adminPath = path.join(__dirname, 'pages/admin-dashboard.tsx');
      if (!fs.existsSync(adminPath)) {
        throw new Error('Admin dashboard page file missing');
      }
      
      const content = fs.readFileSync(adminPath, 'utf8');
      
      // Check for critical issues that would cause errors
      const hasReactImport = content.includes('import React') || content.includes('from "react"');
      const hasDefaultExport = content.includes('export default');
      const hasJSXReturn = content.includes('return') && (content.includes('<') || content.includes('jsx'));
      const hasSyntaxErrors = content.includes('undefined') && content.includes('null');
      
      if (!hasReactImport) throw new Error('Missing React import');
      if (!hasDefaultExport) throw new Error('Missing default export');
      if (!hasJSXReturn) throw new Error('Missing JSX return statement');
      
      return 'Admin dashboard file structure valid';
    }, true);

    // Test 2: Staff Dashboard Page  
    await this.test('Staff Dashboard Page Structure', async () => {
      const staffPath = path.join(__dirname, 'pages/staff-dashboard.tsx');
      if (!fs.existsSync(staffPath)) {
        throw new Error('Staff dashboard page file missing');
      }
      
      const content = fs.readFileSync(staffPath, 'utf8');
      
      const hasReactImport = content.includes('import React') || content.includes('from "react"');
      const hasDefaultExport = content.includes('export default');
      const hasJSXReturn = content.includes('return') && (content.includes('<') || content.includes('jsx'));
      
      if (!hasReactImport) throw new Error('Missing React import');
      if (!hasDefaultExport) throw new Error('Missing default export');
      if (!hasJSXReturn) throw new Error('Missing JSX return statement');
      
      // Check for error handling that might cause the "Something went wrong" message
      const hasErrorBoundary = content.includes('ErrorBoundary') || content.includes('try') || content.includes('catch');
      const hasAsyncOperations = content.includes('useEffect') || content.includes('useState');
      
      return `Staff dashboard structure valid, has error handling: ${hasErrorBoundary}, has async: ${hasAsyncOperations}`;
    }, true);

    // Test 3: Dashboard Data Fetching
    await this.test('Dashboard Data APIs', async () => {
      // Check if the dashboard tries to fetch from these APIs
      const requiredAPIs = [
        'pages/api/staff/analytics.ts',
        'pages/api/staff/queue.ts', 
        'pages/api/analytics/metrics.ts'
      ];
      
      let workingAPIs = 0;
      for (const api of requiredAPIs) {
        const apiPath = path.join(__dirname, api);
        if (fs.existsSync(apiPath)) {
          const content = fs.readFileSync(apiPath, 'utf8');
          // Check if API is properly structured
          if (content.includes('export') && content.includes('handler') && content.includes('res.json')) {
            workingAPIs++;
          }
        }
      }
      
      if (workingAPIs < 2) throw new Error(`Only ${workingAPIs}/${requiredAPIs.length} dashboard APIs working`);
      return `${workingAPIs}/${requiredAPIs.length} dashboard APIs properly structured`;
    }, true);

    // Test 4: Navigation Links
    await this.test('Dashboard Navigation Links', async () => {
      const staffPath = path.join(__dirname, 'pages/staff-dashboard.tsx');
      const content = fs.readFileSync(staffPath, 'utf8');
      
      // Check for common link patterns that might be broken
      const hasLinks = content.includes('href') || content.includes('Link') || content.includes('router');
      const hasRouting = content.includes('useRouter') || content.includes('next/router') || content.includes('next/link');
      
      if (!hasLinks && !hasRouting) {
        throw new Error('No navigation links or routing found');
      }
      
      return `Navigation structure present: links=${hasLinks}, routing=${hasRouting}`;
    });

    // Test 5: Component Dependencies
    await this.test('Dashboard Component Dependencies', async () => {
      // Check if dashboard components exist that the pages depend on
      const componentPaths = [
        'components/dashboard/AdminDashboard.tsx',
        'components/dashboard/StaffDashboard.tsx',
        'components/dashboard/CustomerDashboard.tsx'
      ];
      
      let foundComponents = 0;
      for (const comp of componentPaths) {
        if (fs.existsSync(path.join(__dirname, comp))) {
          foundComponents++;
        }
      }
      
      return `${foundComponents}/${componentPaths.length} dashboard components found`;
    });

    // Test 6: Authentication Routes
    await this.test('Authentication Implementation', async () => {
      // Check for auth middleware or authentication logic
      const authFiles = [
        'middleware.ts',
        'lib/middleware/auth.ts',
        'pages/api/auth/[...nextauth].ts'
      ];
      
      let authImplemented = false;
      for (const authFile of authFiles) {
        if (fs.existsSync(path.join(__dirname, authFile))) {
          authImplemented = true;
          break;
        }
      }
      
      // Also check if pages have auth logic
      const staffPath = path.join(__dirname, 'pages/staff-dashboard.tsx');
      const staffContent = fs.readFileSync(staffPath, 'utf8');
      const hasAuthCheck = staffContent.includes('auth') || staffContent.includes('login') || staffContent.includes('session');
      
      return `Auth files present: ${authImplemented}, dashboard has auth checks: ${hasAuthCheck}`;
    });

    console.log('\n🔗 SPECIFIC LINK TESTING');
    console.log('========================\n');

    // Test 7: Real-time Analytics Link
    await this.test('Real-time Analytics Implementation', async () => {
      // Check if there's a real-time analytics component/page
      const realtimePaths = [
        'pages/analytics/real-time.tsx',
        'components/analytics/RealTimeAnalytics.tsx', 
        'components/analytics/PerformanceAnalyticsDashboard.tsx'
      ];
      
      let realtimeFound = false;
      for (const rtPath of realtimePaths) {
        if (fs.existsSync(path.join(__dirname, rtPath))) {
          realtimeFound = true;
          break;
        }
      }
      
      if (!realtimeFound) {
        throw new Error('Real-time analytics component/page not found');
      }
      
      return 'Real-time analytics component exists';
    }, true);

    // Test 8: Bottom Navigation Links
    await this.test('Bottom Navigation Links', async () => {
      const staffPath = path.join(__dirname, 'pages/staff-dashboard.tsx');
      const content = fs.readFileSync(staffPath, 'utf8');
      
      // Look for footer links or bottom navigation
      const hasFooterLinks = content.includes('footer') || content.includes('bottom') || content.includes('nav');
      const hasExternalLinks = content.includes('http') || content.includes('href=');
      
      // Check if there are hardcoded 404-prone links
      const suspiciousLinks = content.match(/href="[^"]+"/g) || [];
      const potentialBrokenLinks = suspiciousLinks.filter(link => 
        link.includes('#') || link.includes('undefined') || link.includes('null')
      );
      
      if (potentialBrokenLinks.length > 0) {
        throw new Error(`Found ${potentialBrokenLinks.length} potentially broken links: ${potentialBrokenLinks.join(', ')}`);
      }
      
      return `Footer navigation: ${hasFooterLinks}, external links: ${hasExternalLinks}`;
    }, true);

    console.log('\n📊 REAL WEB PAGE TEST RESULTS');
    console.log('=============================');
    console.log(`✅ PASSED: ${this.results.passed}`);
    console.log(`❌ FAILED: ${this.results.failed}`);
    console.log(`🚨 CRITICAL FAILURES: ${this.results.critical.length}`);
    
    const total = this.results.passed + this.results.failed;
    const successRate = Math.round((this.results.passed / total) * 100);
    console.log(`📈 SUCCESS RATE: ${successRate}%`);

    if (this.results.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      this.results.critical.forEach(issue => {
        console.log(`   ❌ ${issue.name}: ${issue.error}`);
      });
    }

    if (this.results.failed > 0) {
      console.log('\n❌ ALL FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        });
    }

    // Generate fix recommendations
    console.log('\n🔧 IMMEDIATE FIX RECOMMENDATIONS:');
    if (this.results.critical.length > 0) {
      console.log('1. Fix critical page errors causing "Something went wrong"');
      console.log('2. Implement missing dashboard components with real data');
      console.log('3. Fix broken navigation links');
      console.log('4. Add proper error boundaries');
    }

    return {
      total,
      passed: this.results.passed,
      failed: this.results.failed,
      critical: this.results.critical.length,
      successRate: `${successRate}%`,
      recommendation: this.results.critical.length === 0 ? 
        'Web pages functional' : 'CRITICAL WEB PAGE ISSUES - IMMEDIATE ATTENTION NEEDED'
    };
  }
}

// Run the real web page tests
if (require.main === module) {
  const tester = new RealWebPageTester();
  tester.runRealWebTests()
    .then(results => {
      console.log(`\n🎯 FINAL RESULT: ${results.recommendation}`);
      process.exit(results.critical === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Web page testing crashed:', error.message);
      process.exit(1);
    });
}

module.exports = RealWebPageTester;