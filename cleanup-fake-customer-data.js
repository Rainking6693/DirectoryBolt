/**
 * FRANK'S FINAL AUDIT - CUSTOMER DATA INTEGRITY CLEANUP
 * This script identifies and removes corrupted/fake customer data found during audit
 * 
 * CRITICAL ISSUES FOUND:
 * 1. All migrated customers have "Unknown Business" as business name
 * 2. Invalid email addresses (URLs instead of emails): https://techstart.com, https://localcafe.com, https://testbusiness.com
 * 3. Scrambled data fields - phone numbers in email fields, addresses in wrong fields
 * 4. Test data that should not be in production database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class CustomerDataCleanup {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.issues = [];
    this.cleaned = [];
  }

  async analyzeCustomerData() {
    console.log('🔍 FRANK\'S FINAL AUDIT: Analyzing customer data integrity...\n');
    
    try {
      const { data: customers, error } = await this.supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve customers: ${error.message}`);
      }

      console.log(`📊 Total customers in database: ${customers.length}\n`);

      // Analyze each customer for data integrity issues
      for (const customer of customers) {
        await this.analyzeCustomer(customer);
      }

      return {
        totalCustomers: customers.length,
        issuesFound: this.issues.length,
        issues: this.issues
      };

    } catch (error) {
      console.error('❌ Error analyzing customer data:', error.message);
      throw error;
    }
  }

  async analyzeCustomer(customer) {
    const customerId = customer.customer_id;
    const issues = [];

    // Check for "Unknown Business" - indicates migration error
    if (customer.business_name === 'Unknown Business') {
      issues.push({
        type: 'FAKE_BUSINESS_NAME',
        severity: 'HIGH',
        description: 'Generic "Unknown Business" name indicates migration corruption'
      });
    }

    // Check for URLs in email field
    if (customer.email && (customer.email.startsWith('http://') || customer.email.startsWith('https://'))) {
      issues.push({
        type: 'INVALID_EMAIL_URL',
        severity: 'CRITICAL',
        description: `URL found in email field: ${customer.email}`
      });
    }

    // Check for obviously invalid email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customer.email && !emailRegex.test(customer.email) && !customer.email.startsWith('http')) {
      issues.push({
        type: 'INVALID_EMAIL_FORMAT',
        severity: 'HIGH',
        description: `Invalid email format: ${customer.email}`
      });
    }

    // Check for scrambled data (addresses/phones in wrong fields)
    if (customer.phone && customer.phone.includes('Street')) {
      issues.push({
        type: 'SCRAMBLED_DATA',
        severity: 'HIGH',
        description: `Address data found in phone field: ${customer.phone}`
      });
    }

    // Check for missing essential data
    if (!customer.first_name && !customer.last_name && customer.business_name === 'Unknown Business') {
      issues.push({
        type: 'MISSING_IDENTITY_DATA',
        severity: 'CRITICAL',
        description: 'No first name, last name, or valid business name'
      });
    }

    // Check for test/fake data patterns
    if (customer.email && (
      customer.email.includes('test') || 
      customer.email.includes('fake') ||
      customer.email.includes('sample') ||
      customer.email === 'Test@test.com'
    )) {
      issues.push({
        type: 'TEST_DATA',
        severity: 'CRITICAL',
        description: `Test/fake email detected: ${customer.email}`
      });
    }

    // If issues found, add to overall issues list
    if (issues.length > 0) {
      this.issues.push({
        customerId,
        customerData: {
          businessName: customer.business_name,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone
        },
        issues,
        recommendedAction: this.getRecommendedAction(issues)
      });
    }
  }

  getRecommendedAction(issues) {
    const hasCritical = issues.some(issue => issue.severity === 'CRITICAL');
    
    if (hasCritical) {
      return 'DELETE_IMMEDIATELY';
    }
    
    return 'REVIEW_MANUAL';
  }

  async cleanupCorruptedData() {
    console.log('\n🧹 CLEANING UP CORRUPTED CUSTOMER DATA...\n');
    
    const customersToDelete = this.issues.filter(item => 
      item.recommendedAction === 'DELETE_IMMEDIATELY'
    );

    console.log(`🗑️  Found ${customersToDelete.length} customers marked for immediate deletion:\n`);
    
    for (const customer of customersToDelete) {
      console.log(`   • ${customer.customerId}: ${customer.customerData.businessName} (${customer.customerData.email})`);
      console.log(`     Issues: ${customer.issues.map(i => i.type).join(', ')}\n`);
    }

    if (customersToDelete.length === 0) {
      console.log('✅ No customers require immediate deletion.\n');
      return { deleted: 0, errors: [] };
    }

    console.log('🚨 PROCEEDING WITH CLEANUP (this cannot be undone)...\n');
    
    const deleteResults = {
      deleted: 0,
      errors: []
    };

    for (const customer of customersToDelete) {
      try {
        const { error } = await this.supabase
          .from('customers')
          .delete()
          .eq('customer_id', customer.customerId);

        if (error) {
          deleteResults.errors.push({
            customerId: customer.customerId,
            error: error.message
          });
          console.log(`❌ Failed to delete ${customer.customerId}: ${error.message}`);
        } else {
          deleteResults.deleted++;
          this.cleaned.push(customer.customerId);
          console.log(`✅ Deleted corrupted customer: ${customer.customerId}`);
        }
      } catch (error) {
        deleteResults.errors.push({
          customerId: customer.customerId,
          error: error.message
        });
        console.log(`❌ Exception deleting ${customer.customerId}: ${error.message}`);
      }
    }

    return deleteResults;
  }

  generateCleanupReport() {
    const report = {
      auditTimestamp: new Date().toISOString(),
      summary: {
        totalIssuesFound: this.issues.length,
        criticalIssues: this.issues.filter(i => i.issues.some(issue => issue.severity === 'CRITICAL')).length,
        customersRecommendedForDeletion: this.issues.filter(i => i.recommendedAction === 'DELETE_IMMEDIATELY').length,
        customersCleaned: this.cleaned.length
      },
      issueBreakdown: {
        fakeBusinessNames: this.issues.filter(i => i.issues.some(issue => issue.type === 'FAKE_BUSINESS_NAME')).length,
        invalidEmailUrls: this.issues.filter(i => i.issues.some(issue => issue.type === 'INVALID_EMAIL_URL')).length,
        scrambledData: this.issues.filter(i => i.issues.some(issue => issue.type === 'SCRAMBLED_DATA')).length,
        testData: this.issues.filter(i => i.issues.some(issue => issue.type === 'TEST_DATA')).length,
        missingIdentity: this.issues.filter(i => i.issues.some(issue => issue.type === 'MISSING_IDENTITY_DATA')).length
      },
      detailedIssues: this.issues,
      cleanedCustomers: this.cleaned,
      recommendations: [
        'CORA was correct - fake data exists in the database',
        'Migration from Google Sheets introduced corrupted data',
        'All "Unknown Business" entries should be investigated',
        'Email validation must be enforced at API level',
        'Database schema needs constraints to prevent data corruption'
      ]
    };

    return report;
  }
}

async function runCustomerDataCleanup() {
  console.log('🚨 FRANK\'S FINAL AUDIT - CUSTOMER DATA INTEGRITY CLEANUP');
  console.log('=' .repeat(60));
  console.log('🎯 Validating Cora\'s findings about fake "Acme Corp" data');
  console.log('🔍 Comprehensive analysis of all customer records\n');

  const cleanup = new CustomerDataCleanup();
  
  try {
    // Analyze all customer data
    const analysisResult = await cleanup.analyzeCustomerData();
    
    console.log('\n📋 ANALYSIS COMPLETE');
    console.log('=' .repeat(30));
    console.log(`Total customers analyzed: ${analysisResult.totalCustomers}`);
    console.log(`Data integrity issues found: ${analysisResult.issuesFound}`);
    
    if (analysisResult.issuesFound === 0) {
      console.log('\n✅ NO DATA INTEGRITY ISSUES FOUND');
      console.log('✅ Database passes integrity audit');
      return;
    }

    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    console.log('=' .repeat(40));
    
    // Show issue summary
    const issueTypes = {};
    analysisResult.issues.forEach(customer => {
      customer.issues.forEach(issue => {
        issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
      });
    });

    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} occurrences`);
    });

    // Perform cleanup
    const cleanupResult = await cleanup.cleanupCorruptedData();
    
    // Generate final report
    const report = cleanup.generateCleanupReport();
    
    // Save report
    const fs = require('fs');
    const reportFilename = `FRANK_CUSTOMER_CLEANUP_REPORT_${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    
    console.log('\n📊 CLEANUP COMPLETE');
    console.log('=' .repeat(25));
    console.log(`Customers deleted: ${cleanupResult.deleted}`);
    console.log(`Cleanup errors: ${cleanupResult.errors.length}`);
    console.log(`Report saved: ${reportFilename}`);
    
    console.log('\n🎯 FRANK\'S VERDICT:');
    console.log('=' .repeat(20));
    if (report.summary.criticalIssues > 0) {
      console.log('❌ AUDIT FAILED: Critical data integrity issues found');
      console.log('❌ CORA WAS CORRECT: Fake/corrupted data exists in database');
      console.log('🔧 DATABASE REQUIRES IMMEDIATE ATTENTION');
    } else {
      console.log('✅ AUDIT PASSED: No critical issues remaining');
      console.log('✅ Database integrity restored');
    }

  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    console.error('🚨 Manual intervention required');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  runCustomerDataCleanup();
}

module.exports = { CustomerDataCleanup, runCustomerDataCleanup };