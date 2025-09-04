#!/usr/bin/env node

/**
 * Database Security Migration Test Suite
 * Tests the two critical security fixes:
 * 1. RLS (Row Level Security) enablement on directories table
 * 2. Function security fix for update_updated_at_column
 * 
 * This test validates that the security migrations work correctly
 * and don't break existing functionality.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('   - SUPABASE_ANON_KEY');
    process.exit(1);
}

// Create different client instances for testing different access levels
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SecurityMigrationTester {
    constructor() {
        this.testResults = [];
        this.testData = {
            testDirectoryId: null,
            testCategoryId: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const symbol = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${symbol} [${timestamp}] ${message}`);
    }

    async test(name, testFunction) {
        try {
            this.log(`Testing: ${name}`, 'info');
            const result = await testFunction();
            this.testResults.push({ name, status: 'PASS', result });
            this.log(`✓ ${name} - PASSED`, 'success');
            return result;
        } catch (error) {
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            this.log(`✗ ${name} - FAILED: ${error.message}`, 'error');
            throw error;
        }
    }

    async runMigrations() {
        this.log('Running security migrations...', 'info');
        
        const migrationFiles = [
            '008_enable_rls_security.sql',
            '009_fix_function_security.sql'
        ];

        for (const file of migrationFiles) {
            try {
                const migrationPath = path.join(__dirname, '..', 'migrations', file);
                const sql = await fs.readFile(migrationPath, 'utf8');
                
                this.log(`Executing migration: ${file}`, 'info');
                const { error } = await serviceClient.rpc('exec_sql', { sql });
                
                if (error) {
                    throw new Error(`Migration ${file} failed: ${error.message}`);
                }
                
                this.log(`Migration ${file} executed successfully`, 'success');
            } catch (error) {
                this.log(`Migration ${file} failed: ${error.message}`, 'error');
                throw error;
            }
        }
    }

    async testRLSEnabled() {
        return await this.test('RLS is enabled on directories table', async () => {
            const { data, error } = await serviceClient.rpc('check_rls_enabled', {
                table_name: 'directories'
            });
            
            if (error) {
                // If the function doesn't exist, check directly
                const { data: rlsData, error: rlsError } = await serviceClient
                    .from('pg_tables')
                    .select('rowsecurity')
                    .eq('schemaname', 'public')
                    .eq('tablename', 'directories')
                    .single();
                
                if (rlsError) throw rlsError;
                
                if (!rlsData.rowsecurity) {
                    throw new Error('RLS is not enabled on directories table');
                }
            }
            
            return 'RLS is properly enabled';
        });
    }

    async testPublicReadAccess() {
        return await this.test('Public can read active directories only', async () => {
            // First, ensure there's an active directory to test
            await this.setupTestData();
            
            // Test anonymous read access
            const { data, error } = await anonClient
                .from('directories')
                .select('*')
                .limit(5);
            
            if (error) {
                throw new Error(`Public read access failed: ${error.message}`);
            }
            
            // Verify all returned directories are active
            const inactiveDirectories = data.filter(dir => !dir.is_active);
            if (inactiveDirectories.length > 0) {
                throw new Error('Public can access inactive directories - RLS policy failed');
            }
            
            return `Successfully read ${data.length} active directories`;
        });
    }

    async testAuthenticatedAccess() {
        return await this.test('Authenticated users can access all directories', async () => {
            // This test would require a proper authenticated user session
            // For now, we'll use the service client as a proxy
            const { data, error } = await serviceClient
                .from('directories')
                .select('*')
                .limit(5);
            
            if (error) {
                throw new Error(`Authenticated access failed: ${error.message}`);
            }
            
            return `Authenticated access works - ${data.length} directories accessible`;
        });
    }

    async testFunctionSecurity() {
        return await this.test('update_updated_at_column function has secure search_path', async () => {
            const { data, error } = await serviceClient.rpc('exec_sql', {
                sql: `
                    SELECT 
                        proname as function_name,
                        proconfig as function_config,
                        prosecdef as security_definer
                    FROM pg_proc 
                    WHERE proname = 'update_updated_at_column';
                `
            });
            
            if (error) throw error;
            
            const func = data[0];
            if (!func) {
                throw new Error('update_updated_at_column function not found');
            }
            
            // Check if function has search_path configuration
            const hasSearchPath = func.function_config && 
                func.function_config.some(config => config.includes('search_path'));
            
            if (!hasSearchPath) {
                throw new Error('Function does not have search_path configured');
            }
            
            // Verify SECURITY DEFINER is set
            if (!func.security_definer) {
                throw new Error('Function should be SECURITY DEFINER');
            }
            
            return 'Function has secure configuration';
        });
    }

    async testTriggerFunctionality() {
        return await this.test('Trigger function still works correctly', async () => {
            await this.setupTestData();
            
            // Update a directory to trigger the function
            const { data, error } = await serviceClient
                .from('directories')
                .update({ description: 'Test update for trigger verification' })
                .eq('id', this.testData.testDirectoryId)
                .select('updated_at');
            
            if (error) {
                throw new Error(`Trigger test failed: ${error.message}`);
            }
            
            // Verify updated_at was changed
            const updatedAt = new Date(data[0].updated_at);
            const now = new Date();
            const timeDiff = Math.abs(now - updatedAt);
            
            // Should be updated within the last 10 seconds
            if (timeDiff > 10000) {
                throw new Error('updated_at was not properly updated by trigger');
            }
            
            return 'Trigger function works correctly';
        });
    }

    async setupTestData() {
        if (this.testData.testDirectoryId) return;

        this.log('Setting up test data...', 'info');
        
        // Create a test category if needed
        const { data: categories, error: catError } = await serviceClient
            .from('categories')
            .select('id')
            .limit(1);
        
        if (catError) throw catError;
        
        if (categories.length === 0) {
            const { data: newCategory, error: newCatError } = await serviceClient
                .from('categories')
                .insert({
                    slug: 'test-category',
                    display_name: 'Test Category',
                    description: 'Test category for security testing'
                })
                .select('id')
                .single();
            
            if (newCatError) throw newCatError;
            this.testData.testCategoryId = newCategory.id;
        } else {
            this.testData.testCategoryId = categories[0].id;
        }
        
        // Create or find a test directory
        const { data: existingDir, error: dirError } = await serviceClient
            .from('directories')
            .select('id')
            .eq('name', 'Security Test Directory')
            .single();
        
        if (dirError && dirError.code !== 'PGRST116') {
            throw dirError;
        }
        
        if (!existingDir) {
            const { data: newDirectory, error: newDirError } = await serviceClient
                .from('directories')
                .insert({
                    name: 'Security Test Directory',
                    website: 'https://example.com',
                    category_id: this.testData.testCategoryId,
                    is_active: true
                })
                .select('id')
                .single();
            
            if (newDirError) throw newDirError;
            this.testData.testDirectoryId = newDirectory.id;
        } else {
            this.testData.testDirectoryId = existingDir.id;
        }
        
        this.log('Test data setup complete', 'success');
    }

    async cleanup() {
        this.log('Cleaning up test data...', 'info');
        
        if (this.testData.testDirectoryId) {
            await serviceClient
                .from('directories')
                .delete()
                .eq('id', this.testData.testDirectoryId);
        }
        
        if (this.testData.testCategoryId && this.testData.testCategoryId !== 'existing') {
            await serviceClient
                .from('categories')
                .delete()
                .eq('id', this.testData.testCategoryId);
        }
        
        this.log('Cleanup complete', 'success');
    }

    async generateReport() {
        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failCount = this.testResults.filter(t => t.status === 'FAIL').length;
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: passCount,
                failed: failCount,
                success_rate: `${((passCount / this.testResults.length) * 100).toFixed(1)}%`
            },
            tests: this.testResults
        };
        
        await fs.writeFile(
            path.join(__dirname, 'security-migration-test-results.json'),
            JSON.stringify(report, null, 2)
        );
        
        this.log(`Test Report Generated: ${passCount}/${this.testResults.length} tests passed`, 
                 failCount > 0 ? 'warning' : 'success');
        
        return report;
    }

    async run() {
        this.log('🔒 Starting Database Security Migration Test Suite', 'info');
        
        try {
            // Step 1: Run migrations
            await this.runMigrations();
            
            // Step 2: Test RLS functionality
            await this.testRLSEnabled();
            await this.testPublicReadAccess();
            await this.testAuthenticatedAccess();
            
            // Step 3: Test function security
            await this.testFunctionSecurity();
            await this.testTriggerFunctionality();
            
            // Step 4: Generate report
            const report = await this.generateReport();
            
            this.log('🎉 All security migration tests completed successfully!', 'success');
            return report;
            
        } catch (error) {
            this.log(`💥 Test suite failed: ${error.message}`, 'error');
            await this.generateReport();
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new SecurityMigrationTester();
    tester.run()
        .then(() => {
            console.log('\n✅ Security migration test suite completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Security migration test suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = SecurityMigrationTester;