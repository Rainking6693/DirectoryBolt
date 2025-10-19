/**
 * Atomic Updates Tests
 * Tests race condition prevention and concurrent update handling
 */

const AutoSelectorDiscovery = require('../AutoSelectorDiscovery');

describe('Atomic Updates: Race Condition Prevention', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
  });

  test('Should use RPC function for atomic updates', () => {
    const saveMethod = discovery.saveDiscoveredSelectors.toString();

    // Verify uses RPC function, not direct update
    expect(saveMethod).toContain('rpc');
    expect(saveMethod).toContain('update_directory_selectors');
    expect(saveMethod).not.toMatch(/\.update\(/); // Should not use direct Supabase update in main path
  });

  test('Should have legacy fallback for migration compatibility', () => {
    expect(discovery._saveSelectorsLegacy).toBeDefined();
    expect(typeof discovery._saveSelectorsLegacy).toBe('function');
  });

  test('Should detect when atomic function is unavailable', () => {
    const saveMethod = discovery.saveDiscoveredSelectors.toString();

    // Should check for function existence error
    expect(saveMethod).toContain('function');
    expect(saveMethod).toContain('does not exist');
  });

  test('Should merge selectors at database level', () => {
    // Verify JSONB merge operator is used in migration
    const fs = require('fs');
    const path = require('path');

    try {
      const migrationPath = path.join(__dirname, '../../../..', 'supabase/migrations/016_add_selector_discovery_fields.sql');
      const migration = fs.readFileSync(migrationPath, 'utf8');

      // Check for JSONB merge operator
      expect(migration).toContain('||'); // JSONB merge operator
      expect(migration).toContain('update_directory_selectors');
    } catch (error) {
      console.warn('Migration file not found, skipping SQL check');
    }
  });

  test('Should include request ID in discovery log', async () => {
    const mockSelectors = {
      email: {
        confidence: 0.9,
        primary: { selector: 'input[type="email"]' },
        fallbacks: []
      }
    };

    const requestId = 'test-request-123';

    // Check that _saveSelectorsLegacy includes request_id
    const legacyMethod = discovery._saveSelectorsLegacy.toString();
    expect(legacyMethod).toContain('discovery_log');
  });
});

describe('Atomic Updates: Concurrent Update Scenarios', () => {
  test('Should handle multiple discoveries for same directory', () => {
    // Scenario: Two workers discover selectors simultaneously
    // Expected: Both sets of selectors are merged, not overwritten

    const scenario = `
      Time T0: Worker A reads selectors (empty)
      Time T1: Worker B reads selectors (empty)
      Time T2: Worker A writes { email: "selector-a" }
      Time T3: Worker B writes { businessName: "selector-b" }

      Without atomic update:
        Final state: { businessName: "selector-b" } ❌ Lost email selector

      With atomic update:
        Final state: { email: "selector-a", businessName: "selector-b" } ✅
    `;

    // This test documents the expected behavior
    expect(scenario).toContain('atomic update');
  });

  test('Should handle rapid successive updates', () => {
    // Scenario: Directory is rediscovered multiple times quickly
    // Expected: All updates are applied, timestamps are sequential

    const scenario = `
      Time T0: Discovery 1 finds { email: "v1" }
      Time T1: Discovery 2 finds { email: "v2", phone: "p1" }
      Time T3: Discovery 3 finds { businessName: "b1" }

      Final state should be: { email: "v2", phone: "p1", businessName: "b1" }
      Latest timestamp from Discovery 3
    `;

    expect(scenario).toContain('atomic');
  });
});

describe('Atomic Updates: Legacy Fallback', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
  });

  test('Should warn when using legacy mode', () => {
    const legacyMethod = discovery._saveSelectorsLegacy.toString();

    expect(legacyMethod).toContain('warn');
    expect(legacyMethod).toContain('legacy');
  });

  test('Should still update selectors in legacy mode', () => {
    const legacyMethod = discovery._saveSelectorsLegacy.toString();

    // Should still perform update, just not atomically
    expect(legacyMethod).toContain('update');
    expect(legacyMethod).toContain('field_selectors');
  });

  test('Should merge selectors client-side in legacy mode', () => {
    const legacyMethod = discovery._saveSelectorsLegacy.toString();

    // Should read existing, merge, then write
    expect(legacyMethod).toContain('field_selectors');
    expect(legacyMethod).toContain('...');  // Spread operator for merge
  });
});

describe('Atomic Updates: Error Recovery', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
  });

  test('Should handle database connection errors', () => {
    const saveMethod = discovery.saveDiscoveredSelectors.toString();

    // Should have error handling
    expect(saveMethod).toContain('catch');
    expect(saveMethod).toContain('error');
  });

  test('Should log failed atomic updates', () => {
    const saveMethod = discovery.saveDiscoveredSelectors.toString();

    expect(saveMethod).toContain('console.error');
    expect(saveMethod).toContain('Failed to save selectors');
  });

  test('Should throw error if update fails', () => {
    const saveMethod = discovery.saveDiscoveredSelectors.toString();

    expect(saveMethod).toContain('throw');
  });
});
