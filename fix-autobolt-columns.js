/**
 * CRITICAL FIX: Add missing columns to AutoBolt tables
 * The tables exist but are missing columns that the extension requires
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 FIXING AUTOBOLT TABLE COLUMNS');
console.log('================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Check current table structure
 */
async function checkTableStructure(tableName) {
    try {
        console.log(`\n🔍 Checking structure of table: ${tableName}`);
        
        // Get column information
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', tableName)
            .eq('table_schema', 'public');
        
        if (error) {
            console.log(`   ❌ Error getting table structure: ${error.message}`);
            return null;
        }
        
        console.log(`   📋 Found ${data.length} columns:`);
        data.forEach(col => {
            console.log(`      • ${col.column_name} (${col.data_type})`);
        });
        
        return data.map(col => col.column_name);
    } catch (error) {
        console.error(`   ❌ Exception checking table structure: ${error.message}`);
        return null;
    }
}

/**
 * Add missing columns to tables
 */
async function addMissingColumns() {
    console.log('\n🔧 Adding missing columns to AutoBolt tables...');
    
    // Check directory_submissions table
    const dirSubmissionsCols = await checkTableStructure('directory_submissions');
    
    if (dirSubmissionsCols) {
        const requiredCols = [
            'directory_category',
            'directory_tier', 
            'processing_time_seconds',
            'error_message'
        ];
        
        const missingCols = requiredCols.filter(col => !dirSubmissionsCols.includes(col));
        
        if (missingCols.length > 0) {
            console.log(`   📝 Missing columns in directory_submissions: ${missingCols.join(', ')}`);
            
            // Create ALTER statements
            const alterStatements = missingCols.map(col => {
                switch (col) {
                    case 'directory_category':
                        return `ALTER TABLE directory_submissions ADD COLUMN IF NOT EXISTS directory_category VARCHAR(100);`;
                    case 'directory_tier':
                        return `ALTER TABLE directory_submissions ADD COLUMN IF NOT EXISTS directory_tier VARCHAR(50) DEFAULT 'standard' CHECK (directory_tier IN ('standard', 'premium', 'enterprise'));`;
                    case 'processing_time_seconds':
                        return `ALTER TABLE directory_submissions ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER;`;
                    case 'error_message':
                        return `ALTER TABLE directory_submissions ADD COLUMN IF NOT EXISTS error_message TEXT;`;
                    default:
                        return null;
                }
            }).filter(Boolean);
            
            // Write SQL file for manual execution
            const sqlContent = `-- CRITICAL FIX: Add missing columns to AutoBolt tables
-- Execute this SQL in your Supabase SQL Editor

${alterStatements.join('\n')}

-- Update the updated_at trigger to include new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists on directory_submissions
DROP TRIGGER IF EXISTS update_directory_submissions_updated_at ON directory_submissions;
CREATE TRIGGER update_directory_submissions_updated_at 
    BEFORE UPDATE ON directory_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_directory_submissions_category ON directory_submissions(directory_category);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_tier ON directory_submissions(directory_tier);

-- Test the new columns work
INSERT INTO directory_submissions (
    customer_id,
    directory_name,
    directory_category,
    directory_tier,
    submission_status
) VALUES (
    'TEST-COLUMNS-001',
    'Test Directory',
    'Business',
    'standard',
    'pending'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM directory_submissions WHERE customer_id = 'TEST-COLUMNS-001';

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'directory_submissions' 
  AND table_schema = 'public'
  AND column_name IN ('directory_category', 'directory_tier', 'processing_time_seconds', 'error_message');
`;
            
            const fs = require('fs');
            fs.writeFileSync('EXECUTE_AUTOBOLT_COLUMN_FIX.sql', sqlContent);
            
            console.log('   📄 SQL file created: EXECUTE_AUTOBOLT_COLUMN_FIX.sql');
            console.log('   🔧 Please execute this SQL in your Supabase SQL Editor');
            
            return { success: false, sqlFile: 'EXECUTE_AUTOBOLT_COLUMN_FIX.sql' };
        } else {
            console.log('   ✅ All required columns already exist in directory_submissions');
        }
    }
    
    // Check autobolt_processing_queue table
    const queueCols = await checkTableStructure('autobolt_processing_queue');
    
    if (queueCols) {
        const requiredQueueCols = [
            'error_message',
            'started_at',
            'completed_at',
            'processed_by'
        ];
        
        const missingQueueCols = requiredQueueCols.filter(col => !queueCols.includes(col));
        
        if (missingQueueCols.length > 0) {
            console.log(`   📝 Missing columns in autobolt_processing_queue: ${missingQueueCols.join(', ')}`);
            
            // These will be added to the SQL file above
            const queueAlters = missingQueueCols.map(col => {
                switch (col) {
                    case 'error_message':
                        return `ALTER TABLE autobolt_processing_queue ADD COLUMN IF NOT EXISTS error_message TEXT;`;
                    case 'started_at':
                        return `ALTER TABLE autobolt_processing_queue ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;`;
                    case 'completed_at':
                        return `ALTER TABLE autobolt_processing_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;`;
                    case 'processed_by':
                        return `ALTER TABLE autobolt_processing_queue ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100);`;
                    default:
                        return null;
                }
            }).filter(Boolean);
            
            // Append to existing SQL file
            const fs = require('fs');
            let existingSQL = '';
            try {
                existingSQL = fs.readFileSync('EXECUTE_AUTOBOLT_COLUMN_FIX.sql', 'utf8');
            } catch (e) {
                // File doesn't exist yet
            }
            
            const updatedSQL = existingSQL + '\n\n-- Fix autobolt_processing_queue table\n' + queueAlters.join('\n');
            fs.writeFileSync('EXECUTE_AUTOBOLT_COLUMN_FIX.sql', updatedSQL);
            
            return { success: false, sqlFile: 'EXECUTE_AUTOBOLT_COLUMN_FIX.sql' };
        } else {
            console.log('   ✅ All required columns already exist in autobolt_processing_queue');
        }
    }
    
    return { success: true };
}

/**
 * Test AutoBolt functionality after fixes
 */
async function testAutoBlotFunctionality() {
    console.log('\n🧪 Testing AutoBolt functionality with all columns...');
    
    try {
        // Test complete directory submission with all fields
        const testSubmission = {
            customer_id: 'TEST-COMPLETE-001',
            directory_name: 'Test Directory Complete',
            directory_category: 'Business',
            directory_tier: 'standard',
            submission_status: 'pending',
            processing_time_seconds: 30,
            error_message: null
        };
        
        const { data, error } = await supabase
            .from('directory_submissions')
            .insert(testSubmission)
            .select('id, directory_name, directory_category, directory_tier')
            .single();
        
        if (error) {
            console.log('   ❌ Test failed:', error.message);
            return false;
        }
        
        console.log('   ✅ Complete submission test passed');
        console.log(`      • Directory: ${data.directory_name}`);
        console.log(`      • Category: ${data.directory_category}`);
        console.log(`      • Tier: ${data.directory_tier}`);
        
        // Clean up
        await supabase.from('directory_submissions').delete().eq('customer_id', 'TEST-COMPLETE-001');
        
        return true;
    } catch (error) {
        console.error('   ❌ Test exception:', error.message);
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    const columnResult = await addMissingColumns();
    
    if (!columnResult.success) {
        console.log('\n🚨 MANUAL ACTION REQUIRED:');
        console.log(`   1. Open your Supabase project dashboard`);
        console.log(`   2. Go to SQL Editor`);
        console.log(`   3. Execute the SQL in: ${columnResult.sqlFile}`);
        console.log(`   4. Re-run this script to verify the fix`);
        return;
    }
    
    const testResult = await testAutoBlotFunctionality();
    
    console.log('\n📋 COLUMN FIX SUMMARY');
    console.log('====================');
    
    if (testResult) {
        console.log('🎉 SUCCESS! AutoBolt tables now have all required columns');
        console.log('✅ The extension should now work correctly');
    } else {
        console.log('❌ Some issues remain. Manual SQL execution may be required.');
    }
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});