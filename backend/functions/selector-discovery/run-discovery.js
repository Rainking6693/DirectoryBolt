const AutoSelectorDiscovery = require('./AutoSelectorDiscovery');

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';

  const discovery = new AutoSelectorDiscovery({
    headless: true,
    minConfidence: 0.7
  });

  try {
    if (mode === 'all') {
      // Discover all directories
      console.log('🔍 Discovering selectors for ALL directories...\n');
      await discovery.discoverSelectorsForAllDirectories({
        limit: 10 // Start with first 10
      });

    } else if (mode === 'failed') {
      // Only directories with high failure rates
      console.log('🔍 Discovering selectors for FAILED directories...\n');
      await discovery.discoverSelectorsForAllDirectories({
        onlyFailed: true,
        limit: 20
      });

    } else if (mode === 'single') {
      // Single directory by ID
      const directoryId = args[1];
      if (!directoryId) {
        console.error('❌ Please provide directory ID');
        process.exit(1);
      }

      console.log(`🔍 Discovering selectors for directory: ${directoryId}\n`);
      await discovery.discoverSelectorsForDirectory(directoryId);

    } else {
      console.log(`
Usage:
  node run-discovery.js [mode] [options]

Modes:
  all         - Discover selectors for all directories (default)
  failed      - Only process directories with high failure rates
  single <id> - Process single directory by ID

Examples:
  node run-discovery.js all
  node run-discovery.js failed
  node run-discovery.js single abc-123-def
      `);
      process.exit(0);
    }

    console.log('\n✅ Discovery completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Discovery failed:', error);
    process.exit(1);
  }
}

main();
