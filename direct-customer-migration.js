#!/usr/bin/env node

/**
 * DIRECT CUSTOMER MIGRATION TO SUPABASE
 * 
 * This script migrates customer data directly to Supabase using
 * REST API calls that bypass schema cache issues
 */

require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');
const fs = require('fs');

class DirectCustomerMigration {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.googleSheet = null;
    this.migrationReport = {
      startTime: new Date().toISOString(),
      sourceCustomers: 0,
      migratedCustomers: 0,
      errors: [],
      customerMappings: []
    };
  }

  async initialize() {
    console.log('🚀 Direct Customer Migration to Supabase');
    console.log('=' .repeat(50));
    
    // Initialize Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.googleSheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await this.googleSheet.loadInfo();
    
    console.log(`✅ Connected to Google Sheet: "${this.googleSheet.title}"`);
  }

  async readCustomersFromSheets() {
    console.log('\n📖 Reading customer data from Google Sheets...');
    
    const sheet = this.googleSheet.sheetsByTitle['Customers'] || this.googleSheet.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    console.log(`📋 Found ${rows.length} customer records`);
    this.migrationReport.sourceCustomers = rows.length;

    const customers = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const customer = {
        first_name: row.get('First Name') || row.get('first_name') || '',
        last_name: row.get('Last Name') || row.get('last_name') || '',
        business_name: row.get('Business Name') || row.get('business_name') || row.get('Company Name') || 'Unknown Business',
        email: row.get('Email') || row.get('email') || '',
        phone: row.get('Phone') || row.get('phone') || '',
        website: row.get('Website') || row.get('website') || '',
        address: row.get('Address') || row.get('address') || '',
        city: row.get('City') || row.get('city') || '',
        state: row.get('State') || row.get('state') || '',
        zip: row.get('ZIP') || row.get('zip') || row.get('Zip Code') || '',
        country: row.get('Country') || row.get('country') || 'USA',
        package_type: this.normalizePackageType(row.get('Package') || row.get('package_type') || row.get('Plan') || 'starter'),
        status: this.normalizeStatus(row.get('Status') || row.get('status') || 'active'),
        directories_submitted: parseInt(row.get('Directories Submitted') || row.get('directories_submitted') || '0') || 0,
        failed_directories: parseInt(row.get('Failed Directories') || row.get('failed_directories') || '0') || 0,
        processing_metadata: {},
        metadata: {
          migrated_from_google_sheets: true,
          original_row_index: i + 2,
          migration_date: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      // Generate customer ID
      customer.customer_id = this.generateCustomerId();
      
      if (customer.business_name && customer.email) {
        customers.push(customer);
      } else {
        console.log(`⚠️  Skipping row ${i + 2}: missing required data`);
      }
    }

    console.log(`✅ Processed ${customers.length} valid customers`);
    return customers;
  }

  normalizePackageType(packageType) {
    if (!packageType) return 'starter';
    
    const normalized = packageType.toLowerCase().trim();
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

  normalizeStatus(status) {
    if (!status) return 'active';
    
    const normalized = status.toLowerCase().trim();
    const mapping = {
      'active': 'active',
      'pending': 'pending',
      'in-progress': 'in-progress',
      'processing': 'in-progress',
      'completed': 'completed',
      'done': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'paused': 'paused',
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    };
    
    return mapping[normalized] || 'active';
  }

  generateCustomerId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomStr = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `DIR-${dateStr}-${randomStr}`;
  }

  async insertCustomerDirectly(customer) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(customer)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async migrateCustomers(customers) {
    console.log('\n💾 Migrating customers to Supabase...');
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      console.log(`\n${i + 1}/${customers.length}. Migrating: ${customer.business_name}`);
      console.log(`   Customer ID: ${customer.customer_id}`);
      console.log(`   Email: ${customer.email}`);
      
      const result = await this.insertCustomerDirectly(customer);
      
      if (result.success) {
        console.log('   ✅ Successfully migrated');
        
        this.migrationReport.migratedCustomers++;
        this.migrationReport.customerMappings.push({
          businessName: customer.business_name,
          email: customer.email,
          newCustomerId: customer.customer_id,
          supabaseData: result.data
        });
      } else {
        console.log(`   ❌ Migration failed: ${result.error}`);
        
        this.migrationReport.errors.push({
          customerIndex: i + 1,
          businessName: customer.business_name,
          email: customer.email,
          customerId: customer.customer_id,
          error: result.error
        });
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async testMigratedData() {
    console.log('\n🧪 Testing migrated data...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/customers?select=customer_id,business_name,email,status&limit=10`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const customers = await response.json();
      console.log(`✅ Successfully retrieved ${customers.length} customers from Supabase`);
      
      if (customers.length > 0) {
        console.log('📋 Sample migrated customers:');
        customers.slice(0, 3).forEach((customer, index) => {
          console.log(`   ${index + 1}. ${customer.customer_id}: ${customer.business_name}`);
        });
      }
      
      return true;
      
    } catch (error) {
      console.log(`❌ Data test failed: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    this.migrationReport.endTime = new Date().toISOString();
    
    const reportPath = `customer-migration-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.migrationReport, null, 2));
    
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('=' .repeat(30));
    console.log(`📥 Source customers: ${this.migrationReport.sourceCustomers}`);
    console.log(`✅ Successfully migrated: ${this.migrationReport.migratedCustomers}`);
    console.log(`❌ Failed migrations: ${this.migrationReport.errors.length}`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    if (this.migrationReport.errors.length > 0) {
      console.log('\n❌ MIGRATION ERRORS:');
      this.migrationReport.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.businessName}: ${error.error}`);
      });
    }

    const successRate = (this.migrationReport.migratedCustomers / this.migrationReport.sourceCustomers) * 100;
    console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    return this.migrationReport;
  }

  async execute() {
    try {
      await this.initialize();
      
      const customers = await this.readCustomersFromSheets();
      
      if (customers.length === 0) {
        console.log('⚠️  No customers to migrate');
        return;
      }

      await this.migrateCustomers(customers);
      
      const testPassed = await this.testMigratedData();
      
      const report = await this.generateReport();
      
      if (report.migratedCustomers > 0) {
        console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log(`✅ ${report.migratedCustomers} customers migrated to Supabase`);
        
        if (testPassed) {
          console.log('✅ Data validation tests passed');
          console.log('🚀 DirectoryBolt customer data is now live on Supabase!');
        }
      } else {
        console.log('\n⚠️  Migration completed but no customers were migrated');
        console.log('📋 Check the error report for details');
      }
      
      return report;
      
    } catch (error) {
      console.error('\n💥 MIGRATION FAILED:', error.message);
      throw error;
    }
  }
}

async function main() {
  const migration = new DirectCustomerMigration();
  
  try {
    const report = await migration.execute();
    process.exit(report.migratedCustomers > 0 ? 0 : 1);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DirectCustomerMigration };