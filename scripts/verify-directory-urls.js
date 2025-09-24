#!/usr/bin/env node

/**
 * DirectoryBolt URL Verification Script
 * Purpose: Verify all 592 directory URLs are accessible and functional
 * Validates HTTP status codes and response times
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read the import summary to get directory count
const summaryPath = path.join(__dirname, '../migrations/directory-import-summary.json');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

console.log('🔍 DirectoryBolt URL Verification Starting...');
console.log(`📊 Total directories to verify: ${summary.totalDirectories}`);
console.log('==========================================');

// Track verification results
const results = {
  total: 0,
  accessible: 0,
  failed: 0,
  timeout: 0,
  details: []
};

// Function to test URL accessibility
function verifyUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'DirectoryBolt-Verification/1.0 (Business Directory Verification)'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          url: url,
          status: res.statusCode,
          responseTime: responseTime,
          accessible: res.statusCode >= 200 && res.statusCode < 400,
          redirected: res.statusCode >= 300 && res.statusCode < 400
        });
        
        req.abort();
      });
      
      req.on('timeout', () => {
        req.abort();
        resolve({
          url: url,
          status: 'TIMEOUT',
          responseTime: timeout,
          accessible: false,
          error: 'Request timeout'
        });
      });
      
      req.on('error', (error) => {
        resolve({
          url: url,
          status: 'ERROR',
          responseTime: Date.now() - startTime,
          accessible: false,
          error: error.message
        });
      });
      
    } catch (error) {
      resolve({
        url: url,
        status: 'INVALID',
        responseTime: 0,
        accessible: false,
        error: 'Invalid URL format'
      });
    }
  });
}

// Extract URLs from SQL file
function extractUrlsFromSql() {
  const sqlPath = path.join(__dirname, '../migrations/025_import_all_directories.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Regex to match URLs in SQL VALUES statements
  const urlRegex = /'(https?:\/\/[^']+)'/g;
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(sqlContent)) !== null) {
    const url = match[1];
    // Skip duplicate URLs
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  
  return urls;
}

// Batch URL verification with concurrency control
async function verifyUrlsBatch(urls, batchSize = 10, delayMs = 100) {
  const results = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`🔍 Verifying batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} (${batch.length} URLs)`);
    
    const batchPromises = batch.map(url => verifyUrl(url));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Progress update
    const verified = results.length;
    const accessible = results.filter(r => r.accessible).length;
    console.log(`   ✅ ${accessible}/${verified} accessible so far`);
    
    // Delay between batches to be respectful
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// Main verification function
async function main() {
  try {
    // Extract URLs from generated SQL
    console.log('📄 Extracting URLs from SQL file...');
    const urls = extractUrlsFromSql();
    console.log(`📊 Found ${urls.length} unique URLs to verify`);
    
    if (urls.length === 0) {
      throw new Error('No URLs found in SQL file');
    }
    
    // Verify all URLs
    console.log('\n🚀 Starting URL verification...');
    const verificationResults = await verifyUrlsBatch(urls, 5, 200); // Conservative batch size
    
    // Analyze results
    results.total = verificationResults.length;
    results.accessible = verificationResults.filter(r => r.accessible).length;
    results.failed = verificationResults.filter(r => !r.accessible && r.status !== 'TIMEOUT').length;
    results.timeout = verificationResults.filter(r => r.status === 'TIMEOUT').length;
    results.details = verificationResults;
    
    // Calculate statistics
    const successRate = (results.accessible / results.total * 100).toFixed(1);
    const avgResponseTime = verificationResults
      .filter(r => r.accessible)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.accessible;
    
    // Generate report
    console.log('\n📊 URL Verification Report');
    console.log('==========================');
    console.log(`Total URLs tested: ${results.total}`);
    console.log(`✅ Accessible: ${results.accessible} (${successRate}%)`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏱️ Timeouts: ${results.timeout}`);
    console.log(`📈 Average response time: ${avgResponseTime.toFixed(0)}ms`);
    
    // Show failed URLs
    const failedUrls = verificationResults.filter(r => !r.accessible);
    if (failedUrls.length > 0) {
      console.log('\n❌ Failed URLs:');
      failedUrls.forEach(result => {
        console.log(`   ${result.url} - ${result.status} (${result.error || 'HTTP error'})`);
      });
    }
    
    // Show slow URLs (>5s response)
    const slowUrls = verificationResults.filter(r => r.accessible && r.responseTime > 5000);
    if (slowUrls.length > 0) {
      console.log('\n⚠️ Slow URLs (>5s):');
      slowUrls.forEach(result => {
        console.log(`   ${result.url} - ${(result.responseTime / 1000).toFixed(1)}s`);
      });
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, '../migrations/url-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        accessible: results.accessible,
        failed: results.failed,
        timeout: results.timeout,
        successRate: parseFloat(successRate),
        averageResponseTime: Math.round(avgResponseTime)
      },
      failedUrls: failedUrls.map(r => ({
        url: r.url,
        status: r.status,
        error: r.error
      })),
      slowUrls: slowUrls.map(r => ({
        url: r.url,
        responseTime: r.responseTime
      })),
      allResults: verificationResults
    }, null, 2));
    
    console.log(`\n📁 Detailed report saved: ${reportPath}`);
    
    // Hudson audit requirements
    if (results.accessible >= 500) {
      console.log('\n✅ HUDSON AUDIT: 500+ directories verified as accessible');
    } else {
      console.log(`\n⚠️ HUDSON AUDIT: Only ${results.accessible} directories accessible (need 500+)`);
    }
    
    if (successRate >= 90) {
      console.log('✅ HUDSON AUDIT: 90%+ success rate achieved');
    } else {
      console.log(`⚠️ HUDSON AUDIT: Success rate ${successRate}% (target: 90%+)`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  main();
}

module.exports = { verifyUrl, extractUrlsFromSql };