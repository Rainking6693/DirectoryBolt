/**
 * AutoBolt Emergency Monitoring System Deployment Script
 * 
 * This script deploys the complete emergency monitoring system:
 * 1. Database tables and schemas
 * 2. API endpoints
 * 3. Enhanced monitoring dashboard
 * 4. Chrome extension updates
 * 5. Production configuration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

console.log('🚨 Starting AutoBolt Emergency Monitoring System Deployment...');

const DEPLOYMENT_CONFIG = {
  environment: process.env.NODE_ENV || 'production',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  deploymentTimestamp: new Date().toISOString()
};

async function deployEmergencyMonitoring() {
  try {
    console.log('📋 Deployment Configuration:');
    console.log(`   Environment: ${DEPLOYMENT_CONFIG.environment}`);
    console.log(`   Timestamp: ${DEPLOYMENT_CONFIG.deploymentTimestamp}`);
    console.log('');

    // Step 1: Validate environment
    await validateEnvironment();

    // Step 2: Deploy database schema
    await deployDatabaseSchema();

    // Step 3: Verify API endpoints
    await verifyAPIEndpoints();

    // Step 4: Deploy monitoring dashboard
    await deployMonitoringDashboard();

    // Step 5: Setup production configuration
    await setupProductionConfig();

    // Step 6: Run system health checks
    await runHealthChecks();

    console.log('');
    console.log('✅ Emergency Monitoring System Deployment Complete!');
    console.log('');
    console.log('🔗 Access Points:');
    console.log('   • Admin Dashboard: https://directorybolt.com/admin/emergency-monitoring');
    console.log('   • Chrome Extension: Load from public/autobolt-extension/');
    console.log('   • API Health: https://directorybolt.com/api/autobolt/live-activity');
    console.log('');
    console.log('⚠️  Important Next Steps:');
    console.log('   1. Install the enhanced Chrome extension');
    console.log('   2. Configure staff access to emergency dashboard');
    console.log('   3. Test emergency stop functionality');
    console.log('   4. Set up monitoring alerts');
    console.log('');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function validateEnvironment() {
  console.log('🔍 Step 1: Validating Environment...');

  if (!DEPLOYMENT_CONFIG.supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!DEPLOYMENT_CONFIG.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  // Test Supabase connection
  const supabase = createClient(
    DEPLOYMENT_CONFIG.supabaseUrl,
    DEPLOYMENT_CONFIG.supabaseServiceKey
  );

  const { data, error } = await supabase.from('customers').select('count').limit(1);
  if (error) {
    throw new Error(`Failed to connect to Supabase: ${error.message}`);
  }

  console.log('   ✅ Environment variables validated');
  console.log('   ✅ Supabase connection confirmed');
}

async function deployDatabaseSchema() {
  console.log('🗄️  Step 2: Deploying Database Schema...');

  const supabase = createClient(
    DEPLOYMENT_CONFIG.supabaseUrl,
    DEPLOYMENT_CONFIG.supabaseServiceKey
  );

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '022_create_emergency_monitoring_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }

    console.log('   ✅ Emergency monitoring tables created');

    // Verify table creation
    const tables = [
      'autobolt_activity_log',
      'autobolt_api_log', 
      'autobolt_error_log',
      'autobolt_extension_status',
      'autobolt_active_tabs',
      'autobolt_screenshots',
      'autobolt_system_config',
      'autobolt_commands',
      'system_alerts'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.warn(`   ⚠️  Warning: Could not verify table ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ Table ${table} verified`);
      }
    }

  } catch (error) {
    throw new Error(`Database schema deployment failed: ${error.message}`);
  }
}

async function verifyAPIEndpoints() {
  console.log('🔌 Step 3: Verifying API Endpoints...');

  const endpoints = [
    '/api/autobolt/live-activity',
    '/api/autobolt/debug-mode',
    '/api/autobolt/watch-mode',
    '/api/autobolt/capture-screenshot',
    '/api/autobolt/emergency-stop'
  ];

  for (const endpoint of endpoints) {
    try {
      const filePath = path.join(__dirname, '..', 'pages', endpoint + '.ts');
      await fs.access(filePath);
      console.log(`   ✅ API endpoint ${endpoint} verified`);
    } catch (error) {
      console.warn(`   ⚠️  Warning: API endpoint ${endpoint} file not found`);
    }
  }
}

async function deployMonitoringDashboard() {
  console.log('📊 Step 4: Deploying Monitoring Dashboard...');

  try {
    // Verify dashboard component
    const dashboardPath = path.join(__dirname, '..', 'components', 'admin', 'EmergencyAutoBooltMonitoring.jsx');
    await fs.access(dashboardPath);
    console.log('   ✅ Emergency monitoring dashboard component verified');

    // Verify Chrome extension files
    const extensionFiles = [
      'enhanced-background.js',
      'enhanced-content-script.js',
      'emergency-popup.html',
      'emergency-popup.js',
      'emergency-manifest.json'
    ];

    for (const file of extensionFiles) {
      const filePath = path.join(__dirname, '..', 'public', 'autobolt-extension', file);
      await fs.access(filePath);
      console.log(`   ✅ Extension file ${file} verified`);
    }

  } catch (error) {
    throw new Error(`Dashboard deployment verification failed: ${error.message}`);
  }
}

async function setupProductionConfig() {
  console.log('⚙️  Step 5: Setting up Production Configuration...');

  const supabase = createClient(
    DEPLOYMENT_CONFIG.supabaseUrl,
    DEPLOYMENT_CONFIG.supabaseServiceKey
  );

  try {
    // Initialize system configuration
    const configs = [
      {
        key: 'emergency_monitoring_enabled',
        value: JSON.stringify({
          enabled: true,
          deployedAt: DEPLOYMENT_CONFIG.deploymentTimestamp,
          version: '2.0.0'
        })
      },
      {
        key: 'debug_mode',
        value: JSON.stringify({
          enabled: false,
          defaultState: false
        })
      },
      {
        key: 'watch_mode',
        value: JSON.stringify({
          enabled: false,
          defaultState: false,
          screenshotInterval: 3000
        })
      },
      {
        key: 'emergency_stop',
        value: JSON.stringify({
          enabled: false,
          lastActivated: null
        })
      }
    ];

    for (const config of configs) {
      const { error } = await supabase
        .from('autobolt_system_config')
        .upsert([config]);

      if (error) {
        throw new Error(`Failed to set config ${config.key}: ${error.message}`);
      }

      console.log(`   ✅ Configuration ${config.key} initialized`);
    }

    // Create initial system alert about deployment
    const { error: alertError } = await supabase
      .from('system_alerts')
      .insert([{
        alert_type: 'system_deployment',
        severity: 'info',
        title: 'Emergency Monitoring System Deployed',
        message: `AutoBolt Emergency Monitoring System v2.0.0 has been successfully deployed at ${DEPLOYMENT_CONFIG.deploymentTimestamp}`,
        metadata: {
          version: '2.0.0',
          deployment_timestamp: DEPLOYMENT_CONFIG.deploymentTimestamp,
          environment: DEPLOYMENT_CONFIG.environment
        },
        resolved: false
      }]);

    if (alertError) {
      console.warn(`   ⚠️  Warning: Could not create deployment alert: ${alertError.message}`);
    } else {
      console.log('   ✅ Deployment alert created');
    }

  } catch (error) {
    throw new Error(`Production configuration failed: ${error.message}`);
  }
}

async function runHealthChecks() {
  console.log('🏥 Step 6: Running System Health Checks...');

  const supabase = createClient(
    DEPLOYMENT_CONFIG.supabaseUrl,
    DEPLOYMENT_CONFIG.supabaseServiceKey
  );

  try {
    // Check if we can write to activity log
    const { error: activityError } = await supabase
      .from('autobolt_activity_log')
      .insert([{
        action: 'SYSTEM_DEPLOYMENT_TEST',
        directory: null,
        customer_id: null,
        status: 'success',
        details: 'Emergency monitoring system deployment health check',
        metadata: {
          deployment_test: true,
          timestamp: DEPLOYMENT_CONFIG.deploymentTimestamp
        }
      }]);

    if (activityError) {
      throw new Error(`Activity log test failed: ${activityError.message}`);
    }
    console.log('   ✅ Activity logging system operational');

    // Check if we can create system alerts
    const { error: alertError } = await supabase
      .from('system_alerts')
      .insert([{
        alert_type: 'health_check',
        severity: 'info',
        title: 'Health Check Completed',
        message: 'Emergency monitoring system health check passed',
        metadata: { health_check: true },
        resolved: true
      }]);

    if (alertError) {
      throw new Error(`Alert system test failed: ${alertError.message}`);
    }
    console.log('   ✅ Alert system operational');

    // Check configuration retrieval
    const { data: configData, error: configError } = await supabase
      .from('autobolt_system_config')
      .select('*')
      .limit(5);

    if (configError) {
      throw new Error(`Configuration retrieval test failed: ${configError.message}`);
    }
    console.log(`   ✅ Configuration system operational (${configData.length} configs)`);

    console.log('   ✅ All health checks passed');

  } catch (error) {
    throw new Error(`Health checks failed: ${error.message}`);
  }
}

// Execute deployment
if (require.main === module) {
  deployEmergencyMonitoring()
    .then(() => {
      console.log('🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = {
  deployEmergencyMonitoring,
  DEPLOYMENT_CONFIG
};