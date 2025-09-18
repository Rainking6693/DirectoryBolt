#!/usr/bin/env node

/**
 * FIX CUSTOMER DATA FIELD ALIGNMENT
 * 
 * This script fixes the data migration issue where Google Sheets fields
 * were mapped to wrong database columns during migration.
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

class DataAlignmentFixer {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    this.client = null;
    this.fixedCount = 0;
    this.errors = [];
  }

  async initialize() {
    console.log('🚀 FIXING CUSTOMER DATA FIELD ALIGNMENT');
    console.log('=' .repeat(50));
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
    console.log('✅ Connected to Supabase');
  }

  async getAllCorruptedCustomers() {
    console.log('\n📋 Finding customers with misaligned data...');
    
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .contains('metadata', { migrated_from_google_sheets: true });

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    console.log(`🔍 Found ${data.length} migrated customers to check`);
    return data;
  }

  fixCustomerFields(customer) {
    // Analyze the corruption pattern based on the data we saw:
    // Current: email=website, phone=address, address=city, city=state, state=zip, zip=package
    
    const corrected = {
      // Keep these as they seem correct
      id: customer.id,
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      business_name: customer.business_name,
      country: customer.country,
      status: customer.status,
      directories_submitted: customer.directories_submitted,
      failed_directories: customer.failed_directories,
      processing_metadata: customer.processing_metadata,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      metadata: customer.metadata,

      // Fix the misaligned fields:
      website: customer.email,        // website was stored in email field
      email: this.extractEmail(customer),  // need to determine real email
      address: customer.phone,        // address was stored in phone field
      phone: this.extractPhone(customer),  // need to determine real phone
      city: customer.address,         // city was stored in address field
      state: customer.city,           // state was stored in city field
      zip: customer.state,            // zip was stored in state field
      package_type: this.normalizePackageType(customer.zip) // package was stored in zip field
    };

    return corrected;
  }

  extractEmail(customer) {
    // Look for email-like patterns in the current data
    // Check if any field contains a real email
    const fields = [customer.email, customer.phone, customer.address, customer.city, customer.state, customer.zip];
    
    for (const field of fields) {
      if (field && typeof field === 'string' && field.includes('@') && field.includes('.')) {
        return field;
      }
    }
    
    // If no email found, check metadata for original data
    if (customer.metadata && customer.metadata.original_email) {
      return customer.metadata.original_email;
    }
    
    // Default fallback
    return '';
  }

  extractPhone(customer) {
    // Look for phone-like patterns (numbers, dashes, parentheses)
    const fields = [customer.phone, customer.address, customer.city, customer.state, customer.zip, customer.email];
    
    for (const field of fields) {
      if (field && typeof field === 'string') {
        // Check if it looks like a phone number
        const phonePattern = /^[\d\s\-\(\)\+]{7,}$/;
        if (phonePattern.test(field.replace(/\s+/g, ''))) {
          return field;
        }
      }
    }
    
    // Check metadata for original data
    if (customer.metadata && customer.metadata.original_phone) {
      return customer.metadata.original_phone;
    }
    
    return '';
  }

  normalizePackageType(value) {
    if (!value || typeof value !== 'string') return 'starter';
    
    const normalized = value.toLowerCase().trim();
    const mapping = {
      'starter': 'starter',
      'basic': 'starter',
      'growth': 'growth',
      'professional': 'professional',
      'pro': 'professional',
      'premium': 'professional',
      'enterprise': 'enterprise',
      'business': 'enterprise'
    };
    
    return mapping[normalized] || 'starter';
  }

  async fixCustomer(customer) {
    try {
      const corrected = this.fixCustomerFields(customer);
      
      console.log(`\n🔧 Fixing customer: ${customer.customer_id}`);
      console.log(`   Original email: ${customer.email}`);
      console.log(`   Corrected website: ${corrected.website}`);
      console.log(`   Corrected email: ${corrected.email}`);
      console.log(`   Corrected package: ${corrected.package_type}`);
      
      // Update the customer in database
      const { data, error } = await this.client
        .from('customers')
        .update({
          email: corrected.email,
          phone: corrected.phone,
          website: corrected.website,
          address: corrected.address,
          city: corrected.city,
          state: corrected.state,
          zip: corrected.zip,
          package_type: corrected.package_type,
          metadata: {
            ...corrected.metadata,
            data_alignment_fixed: true,
            fixed_at: new Date().toISOString(),
            original_corrupted_data: {
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              city: customer.city,
              state: customer.state,
              zip: customer.zip
            }
          }
        })
        .eq('id', customer.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      console.log('   ✅ Successfully fixed');
      this.fixedCount++;
      return true;
      
    } catch (error) {
      console.log(`   ❌ Fix failed: ${error.message}`);
      this.errors.push({
        customerId: customer.customer_id,
        error: error.message
      });
      return false;
    }
  }

  async execute() {
    try {
      await this.initialize();
      
      const customers = await this.getAllCorruptedCustomers();
      
      if (customers.length === 0) {
        console.log('✅ No customers to fix');
        return;
      }

      console.log(`\n🔧 Starting to fix ${customers.length} customers...`);
      
      for (const customer of customers) {
        await this.fixCustomer(customer);
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('\n📊 DATA ALIGNMENT FIX SUMMARY');
      console.log('=' .repeat(30));
      console.log(`✅ Successfully fixed: ${this.fixedCount}`);
      console.log(`❌ Fix failures: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\n❌ FIX ERRORS:');
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.customerId}: ${error.error}`);
        });
      }

      console.log('\n🎉 DATA ALIGNMENT FIX COMPLETED!');
      console.log('✅ Customer data fields are now correctly aligned');
      
    } catch (error) {
      console.error('💥 FIX FAILED:', error.message);
      throw error;
    }
  }
}

async function main() {
  const fixer = new DataAlignmentFixer();
  
  try {
    await fixer.execute();
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DataAlignmentFixer };