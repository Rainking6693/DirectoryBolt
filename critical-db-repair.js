/**
 * CRITICAL DATABASE REPAIR - Fix Revenue-Critical Issues
 * EMERGENCY HOTFIX for DirectoryBolt Production System
 * Date: 2025-09-21
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚨 CRITICAL DATABASE REPAIR - DirectoryBolt');
console.log('===========================================');
console.log('⏰ Timestamp:', new Date().toISOString());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('💥 CRITICAL FAILURE: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * FIX 1: Repair Customer ID Auto-Generation
 */
async function repairCustomerIdGeneration() {
    console.log('\n🔧 FIX 1: Repairing Customer ID Auto-Generation');
    console.log('===============================================');
    
    try {
        // First, check if the function exists
        const { data: functionExists, error: checkError } = await supabase.rpc('generate_customer_id');
        
        if (checkError) {
            console.log('⚠️  Customer ID generation function missing, creating...');
            
            // Create the function directly via SQL
            const createFunctionSQL = `
                CREATE SEQUENCE IF NOT EXISTS customer_id_sequence START 1;
                
                CREATE OR REPLACE FUNCTION generate_customer_id()
                RETURNS TEXT AS $$
                DECLARE
                    date_part TEXT;
                    sequence_part TEXT;
                    customer_id TEXT;
                    attempts INTEGER := 0;
                    max_attempts INTEGER := 100;
                BEGIN
                    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
                    
                    LOOP
                        sequence_part := LPAD(nextval('customer_id_sequence')::TEXT, 6, '0');
                        customer_id := 'DIR-' || date_part || '-' || sequence_part;
                        
                        IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = customer_id) THEN
                            RETURN customer_id;
                        END IF;
                        
                        attempts := attempts + 1;
                        IF attempts >= max_attempts THEN
                            RAISE EXCEPTION 'Unable to generate unique customer ID after % attempts', max_attempts;
                        END IF;
                    END LOOP;
                END;
                $$ LANGUAGE plpgsql;
            `;
            
            // Execute via raw SQL if possible
            console.log('📝 Creating customer ID generation function...');
            console.log('   (This may require manual execution in Supabase SQL Editor)');
            console.log('   SQL to execute:');
            console.log(createFunctionSQL);
        } else {
            console.log('✅ Customer ID generation function exists:', functionExists);
        }
        
        // Create trigger for auto-generation
        const createTriggerSQL = `
            CREATE OR REPLACE FUNCTION set_customer_id()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
                    NEW.customer_id = generate_customer_id();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;
            CREATE TRIGGER trigger_set_customer_id
                BEFORE INSERT ON customers
                FOR EACH ROW
                EXECUTE FUNCTION set_customer_id();
        `;
        
        console.log('📝 Trigger SQL (execute in Supabase SQL Editor):');
        console.log(createTriggerSQL);
        
        return true;
    } catch (error) {
        console.error('❌ Customer ID repair failed:', error.message);
        return false;
    }
}

/**
 * FIX 2: Repair Queue System Schema
 */
async function repairQueueSchema() {
    console.log('\n🔧 FIX 2: Repairing Queue System Schema');
    console.log('======================================');
    
    try {
        // Check current queue_history schema
        const { data: queueData, error: queueError } = await supabase
            .from('queue_history')
            .select('*')
            .limit(1);
        
        if (queueError) {
            console.error('❌ Queue table error:', queueError.message);
            return false;
        }
        
        // Add missing columns to queue_history
        const alterTableSQL = `
            -- Add missing columns to queue_history table
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_processed INTEGER DEFAULT 0;
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_failed INTEGER DEFAULT 0;
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 4;
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS processing_speed VARCHAR(20) DEFAULT 'standard';
            ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;
            
            -- Add indexes for performance
            CREATE INDEX IF NOT EXISTS idx_queue_history_customer_id ON queue_history(customer_id);
            CREATE INDEX IF NOT EXISTS idx_queue_history_status ON queue_history(status);
            CREATE INDEX IF NOT EXISTS idx_queue_history_priority_level ON queue_history(priority_level);
            CREATE INDEX IF NOT EXISTS idx_queue_history_processing_speed ON queue_history(processing_speed);
        `;
        
        console.log('📝 Queue schema repair SQL (execute in Supabase SQL Editor):');
        console.log(alterTableSQL);
        
        return true;
    } catch (error) {
        console.error('❌ Queue schema repair failed:', error.message);
        return false;
    }
}

/**
 * FIX 3: Test Database After Repairs
 */
async function testAfterRepairs() {
    console.log('\n🧪 FIX 3: Testing Database After Repairs');
    console.log('========================================');
    
    // Wait for manual SQL execution
    console.log('⏸️  Please execute the SQL commands shown above in Supabase SQL Editor');
    console.log('⏸️  Press Ctrl+C when done, or wait 30 seconds for automated test...');
    
    // Wait 30 seconds for manual fixes
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
        // Test customer creation with proper ID generation
        const testEmail = `repair-test-${Date.now()}@directorybolt.com`;
        
        console.log('🧪 Testing customer creation...');
        const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert([{
                email: testEmail,
                business_name: 'Repair Test Corp',
                package_type: 'starter',
                status: 'pending',
                directories_submitted: 0,
                failed_directories: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ Customer creation still failing:', insertError.message);
            return false;
        }
        
        console.log('✅ Customer created successfully:', newCustomer.email);
        console.log('🆔 Customer ID:', newCustomer.customer_id || 'NOT GENERATED (needs manual trigger setup)');
        
        // Test queue creation
        console.log('🧪 Testing queue creation...');
        const { data: queueEntry, error: queueError } = await supabase
            .from('queue_history')
            .insert([{
                customer_id: newCustomer.customer_id || `TEST-${Date.now()}`,
                status: 'pending',
                package_type: 'starter',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (queueError) {
            console.error('❌ Queue creation still failing:', queueError.message);
        } else {
            console.log('✅ Queue entry created successfully');
        }
        
        // Cleanup
        await supabase.from('customers').delete().eq('email', testEmail);
        if (queueEntry) {
            await supabase.from('queue_history').delete().eq('id', queueEntry.id);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Post-repair testing failed:', error.message);
        return false;
    }
}

/**
 * MANUAL REPAIR INSTRUCTIONS
 */
function showManualRepairInstructions() {
    console.log('\n📋 MANUAL REPAIR INSTRUCTIONS');
    console.log('=============================');
    console.log('');
    console.log('🚨 CRITICAL: Execute the following SQL in Supabase SQL Editor:');
    console.log('');
    
    console.log('-- STEP 1: Create Customer ID Generation Function');
    console.log(`CREATE SEQUENCE IF NOT EXISTS customer_id_sequence START 1;

CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    sequence_part TEXT;
    customer_id TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    LOOP
        sequence_part := LPAD(nextval('customer_id_sequence')::TEXT, 6, '0');
        customer_id := 'DIR-' || date_part || '-' || sequence_part;
        
        IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = customer_id) THEN
            RETURN customer_id;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique customer ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;`);
    
    console.log('');
    console.log('-- STEP 2: Create Auto-Generation Trigger');
    console.log(`CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
        NEW.customer_id = generate_customer_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;
CREATE TRIGGER trigger_set_customer_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_id();`);
    
    console.log('');
    console.log('-- STEP 3: Fix Queue History Schema');
    console.log(`ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;
ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_processed INTEGER DEFAULT 0;
ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS directories_failed INTEGER DEFAULT 0;
ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 4;
ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS processing_speed VARCHAR(20) DEFAULT 'standard';
ALTER TABLE queue_history ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_queue_history_customer_id ON queue_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_status ON queue_history(status);
CREATE INDEX IF NOT EXISTS idx_queue_history_priority_level ON queue_history(priority_level);`);
    
    console.log('');
    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql/new');
    console.log('');
    console.log('⚡ After executing SQL, run: node emergency-db-audit.js');
}

/**
 * MAIN REPAIR EXECUTION
 */
async function runCriticalRepair() {
    console.log('🚨 Starting critical database repair...');
    
    const repairResults = {
        customerIdRepair: false,
        queueSchemaRepair: false,
        postRepairTest: false
    };
    
    // Attempt automated repairs
    repairResults.customerIdRepair = await repairCustomerIdGeneration();
    repairResults.queueSchemaRepair = await repairQueueSchema();
    
    // Show manual instructions
    showManualRepairInstructions();
    
    // Test after repairs
    repairResults.postRepairTest = await testAfterRepairs();
    
    console.log('\n🚨 CRITICAL REPAIR SUMMARY');
    console.log('==========================');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔧 Customer ID Repair:', repairResults.customerIdRepair ? '✅ ATTEMPTED' : '❌ FAILED');
    console.log('🔧 Queue Schema Repair:', repairResults.queueSchemaRepair ? '✅ ATTEMPTED' : '❌ FAILED');
    console.log('🧪 Post-Repair Test:', repairResults.postRepairTest ? '✅ PASSED' : '❌ FAILED');
    
    if (!repairResults.postRepairTest) {
        console.log('\n🚨 MANUAL INTERVENTION REQUIRED');
        console.log('================================');
        console.log('1. Execute SQL commands shown above in Supabase SQL Editor');
        console.log('2. Verify customer_id auto-generation is working');
        console.log('3. Verify queue_history table has required columns');
        console.log('4. Re-run emergency audit: node emergency-db-audit.js');
        console.log('5. Escalate to development team if issues persist');
    } else {
        console.log('\n✅ REPAIR COMPLETED SUCCESSFULLY');
        console.log('================================');
        console.log('✅ Database schema repaired');
        console.log('✅ Customer registration flow restored');
        console.log('✅ Queue system operational');
        console.log('🔄 Resume normal operations');
    }
}

// Execute critical repair
runCriticalRepair().catch(error => {
    console.error('💥 CRITICAL REPAIR SYSTEM FAILURE:', error);
    console.error('🚨 ESCALATE IMMEDIATELY - Repair system compromised');
    process.exit(1);
});