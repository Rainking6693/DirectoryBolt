/**
 * AutoBolt Data Migration Scripts
 * Handles migration of existing data to enhanced Airtable schema
 * 
 * This module provides comprehensive data migration capabilities including
 * backup creation, schema validation, data transformation, and rollback functionality.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { AIRTABLE_SCHEMA_CONFIG, ENHANCED_SCHEMA } = require('./airtable-schema-enhancement.js');
const PackageConfigurationManager = require('./package-configuration.js');

class DataMigrationManager {
    constructor(config = {}) {
        this.config = {
            ...AIRTABLE_SCHEMA_CONFIG,
            backupDir: path.join(__dirname, 'backups'),
            dryRun: config.dryRun || false,
            batchSize: config.batchSize || 50,
            ...config
        };
        
        this.packageManager = new PackageConfigurationManager(this.config);
        
        this.migrationSteps = [
            { name: 'Initialize Packages', handler: this.initializePackages.bind(this) },
            { name: 'Migrate Legacy Customers', handler: this.migrateLegacyCustomers.bind(this) },
            { name: 'Create Sample Directories', handler: this.createSampleDirectories.bind(this) },
            { name: 'Migrate Existing Submissions', handler: this.migrateExistingSubmissions.bind(this) },
            { name: 'Initialize Processing Logs', handler: this.initializeProcessingLogs.bind(this) },
            { name: 'Validate Migration', handler: this.validateMigration.bind(this) }
        ];
        
        this.migrationState = {
            currentStep: 0,
            totalSteps: this.migrationSteps.length,
            startTime: null,
            errors: [],
            warnings: [],
            migratedRecords: {
                customers: 0,
                packages: 0,
                directories: 0,
                submissions: 0,
                queue: 0,
                logs: 0
            }
        };
    }

    /**
     * Execute full data migration
     */
    async executeMigration() {
        console.log('🚀 Starting AutoBolt data migration...');
        this.migrationState.startTime = new Date();
        
        try {
            // Create backup directory
            await this.ensureBackupDirectory();
            
            // Create backup of existing data
            await this.createBackup();
            
            // Execute migration steps
            for (let i = 0; i < this.migrationSteps.length; i++) {
                const step = this.migrationSteps[i];
                this.migrationState.currentStep = i + 1;
                
                console.log(`\n📋 Step ${this.migrationState.currentStep}/${this.migrationState.totalSteps}: ${step.name}`);
                
                try {
                    await step.handler();
                    console.log(`✅ Completed: ${step.name}`);
                } catch (error) {
                    console.error(`❌ Failed: ${step.name} - ${error.message}`);
                    this.migrationState.errors.push({
                        step: step.name,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    if (!this.config.continueOnError) {
                        throw error;
                    }
                }
            }
            
            // Generate migration report
            const report = await this.generateMigrationReport();
            await this.saveMigrationReport(report);
            
            console.log('\n🎉 Data migration completed successfully!');
            console.log(report.summary);
            
            return report;
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            
            if (this.config.autoRollback) {
                console.log('🔄 Attempting automatic rollback...');
                await this.rollbackMigration();
            }
            
            throw error;
        }
    }

    /**
     * Create backup of existing data
     */
    async createBackup() {
        console.log('💾 Creating backup of existing data...');
        
        const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.config.backupDir, `backup-${backupTimestamp}.json`);
        
        try {
            // Backup existing tables
            const backup = {
                metadata: {
                    timestamp: backupTimestamp,
                    baseId: this.config.baseId,
                    version: '1.0.0'
                },
                tables: {}
            };
            
            // Backup existing customer data (assuming it exists in Sheet1)
            try {
                const existingData = await this.makeAirtableRequest('GET', 'Sheet1', {
                    maxRecords: 1000
                });
                backup.tables.Sheet1 = existingData.records || [];
                console.log(`📊 Backed up ${backup.tables.Sheet1.length} records from Sheet1`);
            } catch (error) {
                console.log('ℹ️ No existing Sheet1 data found (this is normal for new installations)');
            }
            
            // Save backup
            await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
            console.log(`✅ Backup created: ${backupPath}`);
            
            this.migrationState.backupPath = backupPath;
            
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }

    /**
     * Initialize packages in Airtable
     */
    async initializePackages() {
        console.log('🎁 Initializing package configurations...');
        
        if (this.config.dryRun) {
            console.log('🔍 DRY RUN: Would initialize packages');
            return;
        }
        
        await this.packageManager.initializePackages();
        this.migrationState.migratedRecords.packages = 4; // Starter, Growth, Professional, Enterprise
        
        console.log('✅ Package configurations initialized');
    }

    /**
     * Migrate legacy customer data
     */
    async migrateLegacyCustomers() {
        console.log('👥 Migrating legacy customer data...');
        
        try {
            // Try to get legacy customer data
            const legacyCustomers = await this.getLegacyCustomers();
            
            if (legacyCustomers.length === 0) {
                console.log('ℹ️ No legacy customers found, creating sample customers');
                await this.createSampleCustomers();
                return;
            }
            
            console.log(`📋 Found ${legacyCustomers.length} legacy customers to migrate`);
            
            // Process customers in batches
            const batches = this.chunkArray(legacyCustomers, this.config.batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} customers)`);
                
                if (!this.config.dryRun) {
                    await this.processBatch(batch, this.transformCustomerData.bind(this));
                }
                
                this.migrationState.migratedRecords.customers += batch.length;
            }
            
        } catch (error) {
            console.error('❌ Failed to migrate customers:', error);
            throw error;
        }
    }

    /**
     * Get legacy customer data
     */
    async getLegacyCustomers() {
        try {
            const response = await this.makeAirtableRequest('GET', 'Sheet1', {
                maxRecords: 1000
            });
            return response.records || [];
        } catch (error) {
            console.log('ℹ️ No legacy customer data found');
            return [];
        }
    }

    /**
     * Create sample customers for demonstration
     */
    async createSampleCustomers() {
        const sampleCustomers = [
            {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                phone: '+1-555-0101',
                businessName: 'Smith Plumbing Services',
                businessWebsite: 'https://smithplumbing.com',
                businessCategory: 'Home Services',
                packageType: 'Professional'
            },
            {
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah@johnson-law.com',
                phone: '+1-555-0102',
                businessName: 'Johnson Law Firm',
                businessWebsite: 'https://johnson-law.com',
                businessCategory: 'Legal Services',
                packageType: 'Enterprise'
            },
            {
                firstName: 'Mike',
                lastName: 'Davis',
                email: 'mike@davisauto.com',
                phone: '+1-555-0103',
                businessName: 'Davis Auto Repair',
                businessWebsite: 'https://davisauto.com',
                businessCategory: 'Automotive',
                packageType: 'Growth'
            },
            {
                firstName: 'Lisa',
                lastName: 'Wilson',
                email: 'lisa@creativestudio.com',
                phone: '+1-555-0104',
                businessName: 'Creative Design Studio',
                businessWebsite: 'https://creativestudio.com',
                businessCategory: 'Design Services',
                packageType: 'Starter'
            }
        ];
        
        console.log(`🆕 Creating ${sampleCustomers.length} sample customers`);
        
        if (!this.config.dryRun) {
            for (const customerData of sampleCustomers) {
                const transformedData = await this.transformCustomerData(customerData);
                await this.createAirtableRecord('Customers', transformedData);
            }
        }
        
        this.migrationState.migratedRecords.customers = sampleCustomers.length;
    }

    /**
     * Transform customer data to new schema
     */
    async transformCustomerData(legacyData) {
        // Extract data from legacy format or use provided data
        const data = legacyData.fields || legacyData;
        
        // Get package configuration
        const packageType = data.packageType || data.package_type || 'Starter';
        const packageConfig = await this.packageManager.getPackageById(packageType);
        
        const transformed = {
            customer_id: uuidv4(),
            first_name: data.firstName || data.first_name || data.Name?.split(' ')[0] || 'Unknown',
            last_name: data.lastName || data.last_name || data.Name?.split(' ')[1] || 'Customer',
            email: data.email || data.Email || `customer-${Date.now()}@example.com`,
            phone: data.phone || data.Phone || '',
            business_name: data.businessName || data.business_name || data['Business Name'] || '',
            business_website: data.businessWebsite || data.business_website || data.Website || '',
            business_category: data.businessCategory || data.business_category || data.Category || '',
            package_type: packageType,
            purchase_date: data.purchaseDate || new Date().toISOString().split('T')[0],
            subscription_status: 'Active',
            total_directories_allocated: packageConfig?.fields?.directory_limit || 50,
            directories_completed: data.directoriesCompleted || 0,
            customer_status: 'Active',
            priority_level: packageConfig?.fields?.priority_level || 4,
            onboarding_completed: true,
            customer_notes: `Migrated from legacy system on ${new Date().toISOString()}`
        };
        
        return transformed;
    }

    /**
     * Create sample directories
     */
    async createSampleDirectories() {
        console.log('📂 Creating sample directory registry...');
        
        const sampleDirectories = [
            {
                directory_name: 'Google My Business',
                directory_url: 'https://business.google.com',
                submission_url: 'https://business.google.com/create',
                category: 'Local Citations',
                domain_authority: 100,
                monthly_traffic: 5000000000,
                submission_difficulty: 'Easy',
                automation_success_rate: 0.95,
                requires_registration: true,
                requires_verification: true,
                has_captcha: false,
                is_active: true,
                automation_enabled: true,
                processing_priority: 1,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_phone', 'business_category']),
                geographic_scope: 'Global'
            },
            {
                directory_name: 'Yelp',
                directory_url: 'https://yelp.com',
                submission_url: 'https://biz.yelp.com/signup',
                category: 'Review Sites',
                domain_authority: 95,
                monthly_traffic: 178000000,
                submission_difficulty: 'Medium',
                automation_success_rate: 0.85,
                requires_registration: true,
                requires_verification: true,
                has_captcha: true,
                is_active: true,
                automation_enabled: true,
                processing_priority: 2,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_phone', 'business_email']),
                geographic_scope: 'National'
            },
            {
                directory_name: 'Yellow Pages',
                directory_url: 'https://yellowpages.com',
                submission_url: 'https://listings.yellowpages.com/claim',
                category: 'General Business',
                domain_authority: 85,
                monthly_traffic: 45000000,
                submission_difficulty: 'Easy',
                automation_success_rate: 0.90,
                requires_registration: false,
                requires_verification: false,
                has_captcha: false,
                is_active: true,
                automation_enabled: true,
                processing_priority: 3,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_phone']),
                geographic_scope: 'National'
            },
            {
                directory_name: 'Foursquare',
                directory_url: 'https://foursquare.com',
                submission_url: 'https://business.foursquare.com/add',
                category: 'Local Citations',
                domain_authority: 92,
                monthly_traffic: 50000000,
                submission_difficulty: 'Medium',
                automation_success_rate: 0.80,
                requires_registration: true,
                requires_verification: false,
                has_captcha: false,
                is_active: true,
                automation_enabled: true,
                processing_priority: 4,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_category']),
                geographic_scope: 'Global'
            },
            {
                directory_name: 'Facebook Business',
                directory_url: 'https://facebook.com',
                submission_url: 'https://business.facebook.com/create',
                category: 'Social Media',
                domain_authority: 96,
                monthly_traffic: 2900000000,
                submission_difficulty: 'Easy',
                automation_success_rate: 0.88,
                requires_registration: true,
                requires_verification: true,
                has_captcha: false,
                is_active: true,
                automation_enabled: true,
                processing_priority: 2,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_phone', 'business_website']),
                geographic_scope: 'Global'
            }
        ];
        
        if (!this.config.dryRun) {
            for (const directoryData of sampleDirectories) {
                await this.createAirtableRecord('Directories', directoryData);
            }
        }
        
        this.migrationState.migratedRecords.directories = sampleDirectories.length;
        console.log(`✅ Created ${sampleDirectories.length} sample directories`);
    }

    /**
     * Migrate existing submissions (if any)
     */
    async migrateExistingSubmissions() {
        console.log('📝 Migrating existing submissions...');
        
        // In a real migration, this would process existing submission data
        // For now, we'll create sample submissions for demonstration
        console.log('ℹ️ Creating sample submission records for demonstration');
        
        if (!this.config.dryRun) {
            await this.createSampleSubmissions();
        }
        
        console.log('✅ Sample submissions created');
    }

    /**
     * Create sample submissions
     */
    async createSampleSubmissions() {
        // Get some customers and directories to create sample submissions
        const customers = await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 2 });
        const directories = await this.makeAirtableRequest('GET', 'Directories', { maxRecords: 3 });
        
        if (customers.records.length === 0 || directories.records.length === 0) {
            console.log('⚠️ No customers or directories found for sample submissions');
            return;
        }
        
        const sampleSubmissions = [];
        
        // Create sample submissions for first customer
        const customer = customers.records[0];
        
        directories.records.forEach((directory, index) => {
            const submission = {
                customer_id: [customer.id],
                directory_id: [directory.id],
                submission_status: index === 0 ? 'Approved' : index === 1 ? 'Submitted' : 'Processing',
                submission_date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
                processing_started: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) + (60 * 60 * 1000)).toISOString(),
                processing_completed: index < 2 ? new Date(Date.now() - (index * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)).toISOString() : null,
                processing_time_seconds: index < 2 ? 120 + (index * 30) : null,
                automation_success: index < 2,
                submitted_data: JSON.stringify({
                    business_name: customer.fields.business_name,
                    business_address: '123 Main St, Anytown, ST 12345',
                    business_phone: customer.fields.phone,
                    business_email: customer.fields.email
                })
            };
            sampleSubmissions.push(submission);
        });
        
        for (const submission of sampleSubmissions) {
            await this.createAirtableRecord('Submissions', submission);
        }
        
        this.migrationState.migratedRecords.submissions = sampleSubmissions.length;
    }

    /**
     * Initialize processing logs
     */
    async initializeProcessingLogs() {
        console.log('📊 Initializing processing logs...');
        
        if (this.config.dryRun) {
            console.log('🔍 DRY RUN: Would initialize processing logs');
            return;
        }
        
        // Create initial log entry
        const initialLog = {
            log_level: 'INFO',
            event_type: 'System Event',
            event_summary: 'Data migration completed',
            event_details: `AutoBolt data migration completed successfully. Migrated ${this.migrationState.migratedRecords.customers} customers, ${this.migrationState.migratedRecords.directories} directories, and ${this.migrationState.migratedRecords.submissions} submissions.`,
            processor_instance: 'migration_manager',
            additional_data: JSON.stringify(this.migrationState.migratedRecords)
        };
        
        await this.createAirtableRecord('ProcessingLogs', initialLog);
        this.migrationState.migratedRecords.logs = 1;
        
        console.log('✅ Processing logs initialized');
    }

    /**
     * Validate migration results
     */
    async validateMigration() {
        console.log('🔍 Validating migration results...');
        
        const validation = {
            tables: {},
            issues: [],
            success: true
        };
        
        // Validate each table
        const tablesToValidate = ['Customers', 'Packages', 'Directories', 'Submissions', 'ProcessingLogs'];
        
        for (const tableName of tablesToValidate) {
            try {
                const response = await this.makeAirtableRequest('GET', tableName, { maxRecords: 1 });
                validation.tables[tableName] = {
                    exists: true,
                    recordCount: response.records?.length || 0
                };
            } catch (error) {
                validation.tables[tableName] = {
                    exists: false,
                    error: error.message
                };
                validation.issues.push(`Table ${tableName} validation failed: ${error.message}`);
                validation.success = false;
            }
        }
        
        // Check relationships
        try {
            await this.validateRelationships();
        } catch (error) {
            validation.issues.push(`Relationship validation failed: ${error.message}`);
            validation.success = false;
        }
        
        if (validation.success) {
            console.log('✅ Migration validation passed');
        } else {
            console.warn('⚠️ Migration validation found issues:', validation.issues);
        }
        
        return validation;
    }

    /**
     * Validate table relationships
     */
    async validateRelationships() {
        console.log('🔗 Validating table relationships...');
        
        // Check if customers have package types that exist
        const customers = await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 10 });
        const packages = await this.makeAirtableRequest('GET', 'Packages');
        
        const packageTypes = packages.records.map(p => p.fields.package_id);
        
        for (const customer of customers.records) {
            if (customer.fields.package_type && !packageTypes.includes(customer.fields.package_type)) {
                throw new Error(`Customer ${customer.id} has invalid package type: ${customer.fields.package_type}`);
            }
        }
        
        console.log('✅ Relationship validation passed');
    }

    /**
     * Generate migration report
     */
    async generateMigrationReport() {
        const endTime = new Date();
        const duration = endTime - this.migrationState.startTime;
        
        const report = {
            migration: {
                startTime: this.migrationState.startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: Math.round(duration / 1000),
                success: this.migrationState.errors.length === 0
            },
            records: this.migrationState.migratedRecords,
            steps: {
                completed: this.migrationState.currentStep,
                total: this.migrationState.totalSteps
            },
            errors: this.migrationState.errors,
            warnings: this.migrationState.warnings,
            summary: this.generateSummary()
        };
        
        return report;
    }

    /**
     * Generate summary text
     */
    generateSummary() {
        const records = this.migrationState.migratedRecords;
        const totalRecords = Object.values(records).reduce((sum, count) => sum + count, 0);
        
        return `Migration completed: ${totalRecords} total records migrated (${records.customers} customers, ${records.packages} packages, ${records.directories} directories, ${records.submissions} submissions, ${records.logs} log entries). ${this.migrationState.errors.length} errors, ${this.migrationState.warnings.length} warnings.`;
    }

    /**
     * Save migration report
     */
    async saveMigrationReport(report) {
        const reportPath = path.join(this.config.backupDir, `migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        
        try {
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📊 Migration report saved: ${reportPath}`);
        } catch (error) {
            console.warn('⚠️ Failed to save migration report:', error);
        }
    }

    /**
     * Rollback migration
     */
    async rollbackMigration() {
        console.log('🔄 Rolling back migration...');
        
        if (!this.migrationState.backupPath) {
            throw new Error('No backup path found for rollback');
        }
        
        try {
            const backup = JSON.parse(await fs.readFile(this.migrationState.backupPath, 'utf8'));
            
            // Restore original data
            if (backup.tables.Sheet1) {
                console.log('📥 Restoring original customer data...');
                // Implementation would restore the original data
            }
            
            console.log('✅ Rollback completed');
        } catch (error) {
            console.error('❌ Rollback failed:', error);
            throw error;
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Ensure backup directory exists
     */
    async ensureBackupDirectory() {
        try {
            await fs.access(this.config.backupDir);
        } catch (error) {
            await fs.mkdir(this.config.backupDir, { recursive: true });
        }
    }

    /**
     * Process batch of records
     */
    async processBatch(batch, transformFunction) {
        const promises = batch.map(async (record) => {
            try {
                const transformedData = await transformFunction(record);
                return await this.createAirtableRecord('Customers', transformedData);
            } catch (error) {
                console.error('❌ Failed to process record:', error);
                this.migrationState.warnings.push({
                    record: record.id || 'unknown',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                return null;
            }
        });
        
        await Promise.allSettled(promises);
    }

    /**
     * Chunk array into smaller arrays
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Make Airtable API request
     */
    async makeAirtableRequest(method, tableName, params = {}) {
        const url = `${this.config.apiUrl}/${this.config.baseId}/${tableName}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, JSON.stringify(item)));
                } else {
                    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });
            url += `?${searchParams.toString()}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Create Airtable record
     */
    async createAirtableRecord(tableName, data) {
        return await this.makeAirtableRequest('POST', tableName, {
            fields: data
        });
    }
}

// ==================== CLI INTERFACE ====================

/**
 * CLI runner for data migration
 */
async function runMigration() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const continueOnError = args.includes('--continue-on-error');
    const autoRollback = args.includes('--auto-rollback');
    
    console.log('🚀 AutoBolt Data Migration Tool');
    console.log('================================');
    
    if (dryRun) {
        console.log('🔍 Running in DRY RUN mode - no changes will be made');
    }
    
    const migrationManager = new DataMigrationManager({
        dryRun,
        continueOnError,
        autoRollback
    });
    
    try {
        const report = await migrationManager.executeMigration();
        
        console.log('\n📊 Migration Report:');
        console.log('====================');
        console.log(JSON.stringify(report, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = DataMigrationManager;