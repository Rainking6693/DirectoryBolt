const AutoSelectorDiscovery = require('./AutoSelectorDiscovery');

async function scheduledDiscovery() {
  console.log('🕐 Running scheduled selector discovery...');

  const discovery = new AutoSelectorDiscovery({
    headless: true,
    minConfidence: 0.8 // Higher confidence for auto-updates
  });

  try {
    // Focus on recently failed directories
    await discovery.discoverSelectorsForAllDirectories({
      onlyFailed: true,
      limit: 5 // Process 5 per run to avoid overwhelming system
    });

    console.log('✅ Scheduled discovery complete');

  } catch (error) {
    console.error('❌ Scheduled discovery failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  scheduledDiscovery();
}

module.exports = scheduledDiscovery;
