#!/usr/bin/env node

/**
 * INVESTIGATE FOREIGN KEY CONSTRAINTS ISSUE
 * Discover why directory_submissions is failing FK checks
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class ForeignKeyInvestigator {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        } 
      }
    );
  }

  async investigateCustomersTable() {
    console.log('\n🔍 INVESTIGATING: customers table');
    console.log('='.repeat(50));
    
    try {
      // Check if customers table exists
      const { data, error } = await this.supabase
        .from('customers')
        .select('customer_id, business_name, email')
        .limit(5);
      
      if (error) {
        console.log(`❌ Customers table error: ${error.message}`);
        return null;
      } else {
        console.log(`✅ Found ${data.length} customers`);
        console.log('📊 Sample customer_ids:');
        data.forEach(customer => {
          console.log(`   - ${customer.customer_id} (${customer.business_name})`);
        });
        return data;
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      return null;
    }
  }

  async testDirectorySubmissionWithValidCustomer() {
    console.log('\n🔧 TESTING: directory_submissions with VALID customer');
    console.log('='.repeat(55));
    
    // Get a valid customer_id
    const { data: customers } = await this.supabase
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    if (!customers || customers.length === 0) {
      console.log('❌ No valid customers found');
      return false;
    }
    
    const validCustomerId = customers[0].customer_id;
    console.log(`📋 Using valid customer_id: ${validCustomerId}`);
    
    try {
      const testData = {
        customer_id: validCustomerId,
        directory_name: 'Hudson Valid Customer Test',
        directory_category: 'Business Services',
        directory_tier: 'standard', 
        processing_time_seconds: 90,
        error_message: 'Test message',
        submission_status: 'pending'
      };
      
      const { data, error } = await this.supabase
        .from('directory_submissions')
        .insert(testData)
        .select();
      
      if (error) {
        console.log(`❌ Still failed: ${error.message}`);
        return false;
      } else {
        console.log(`✅ SUCCESS with valid customer_id!`);
        console.log('📊 Verified columns working:');
        console.log(`   - directory_category: ${data[0].directory_category}`);
        console.log(`   - directory_tier: ${data[0].directory_tier}`);
        console.log(`   - processing_time_seconds: ${data[0].processing_time_seconds}`);
        console.log(`   - error_message: ${data[0].error_message}`);
        
        // Clean up
        await this.supabase
          .from('directory_submissions')
          .delete()
          .eq('customer_id', validCustomerId)
          .eq('directory_name', 'Hudson Valid Customer Test');
        
        return true;
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      return false;
    }
  }

  async runFullInvestigation() {
    console.log('🚨 FOREIGN KEY CONSTRAINT INVESTIGATION');
    console.log('='.repeat(45));
    
    // 1. Investigate customers table
    const customers = await this.investigateCustomersTable();
    
    // 2. Test with valid customer
    const validTest = await this.testDirectorySubmissionWithValidCustomer();
    
    console.log('\n📊 INVESTIGATION SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Customers table accessible: ${customers ? 'YES' : 'NO'}`);
    console.log(`✅ Valid customer test passed: ${validTest ? 'YES' : 'NO'}`);
    
    if (validTest) {
      console.log('\n🎉 RESOLUTION: Frank\'s columns exist and work!');
      console.log('❌ ISSUE: His test used invalid customer_id');
      console.log('✅ ALL 4 directory_submissions columns verified');
    }
    
    return validTest;
  }
}

async function main() {
  const investigator = new ForeignKeyInvestigator();
  
  try {
    const success = await investigator.runFullInvestigation();
    
    if (success) {
      console.log('\n🎯 INVESTIGATION COMPLETE: Columns exist, FK issue resolved');
    } else {
      console.log('\n⚠️ INVESTIGATION INCONCLUSIVE');
    }
  } catch (error) {
    console.error('\n❌ INVESTIGATION FAILED:', error.message);
  }
}

if (require.main === module) {
  main();
}