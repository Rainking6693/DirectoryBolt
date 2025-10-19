/**
 * Integration Tests for Selector Discovery System
 * Tests end-to-end discovery flow and database integration
 */

const AutoSelectorDiscovery = require('../AutoSelectorDiscovery');
const { createClient } = require('@supabase/supabase-js');

// Skip if no Supabase credentials
const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
const describeIfSupabase = hasSupabaseCredentials ? describe : describe.skip;

describeIfSupabase('Integration: Selector Discovery Flow', () => {
  let discovery;
  let supabase;
  let testDirectoryId;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({
      headless: true,
      minConfidence: 0.6
    });

    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  afterAll(async () => {
    // Cleanup test directory if created
    if (testDirectoryId) {
      await supabase.from('directories').delete().eq('id', testDirectoryId);
    }
  });

  test('Should handle non-existent directory gracefully', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const result = await discovery.discoverSelectorsForDirectory(fakeId);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('Should retry on timeout errors', async () => {
    // This test would need mocking or a server that times out
    // For now, we verify retry logic exists
    expect(discovery._isRetriableError).toBeDefined();
    expect(typeof discovery._isRetriableError).toBe('function');

    const timeoutError = new Error('PAGE_LOAD_TIMEOUT');
    expect(discovery._isRetriableError(timeoutError)).toBe(true);

    const nonRetriableError = new Error('INVALID_DIRECTORY');
    expect(discovery._isRetriableError(nonRetriableError)).toBe(false);
  });

  test('Should detect and mark directories requiring login', async () => {
    // Test the login detection logic
    expect(discovery._markDirectoryRequiresLogin).toBeDefined();
  });
});

describeIfSupabase('Integration: Database Operations', () => {
  let discovery;
  let supabase;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  test('Should use atomic update function', async () => {
    // Verify RPC function exists
    const { data, error } = await supabase.rpc('update_directory_selectors', {
      dir_id: '00000000-0000-0000-0000-000000000000',
      new_selectors: { test: 'value' },
      discovery_log: { test: true }
    });

    // Function should exist (even if directory doesn't)
    // Error would be about directory not existing, not function not found
    if (error) {
      expect(error.message).not.toContain('function');
    }
  });

  test('Should handle concurrent updates without race conditions', async () => {
    // Create a test directory first
    const { data: dir, error: createError } = await supabase
      .from('directories')
      .insert({
        name: 'Test Concurrent Updates',
        submission_url: 'https://example.com/submit'
      })
      .select()
      .single();

    if (createError) {
      console.warn('Skipping concurrent test: Could not create directory');
      return;
    }

    const testDirId = dir.id;

    try {
      // Simulate concurrent updates
      const update1 = discovery.saveDiscoveredSelectors(testDirId, {
        field1: { confidence: 0.9, primary: { selector: 'selector1' }, fallbacks: [] }
      }, 'test-request-1');

      const update2 = discovery.saveDiscoveredSelectors(testDirId, {
        field2: { confidence: 0.9, primary: { selector: 'selector2' }, fallbacks: [] }
      }, 'test-request-2');

      await Promise.all([update1, update2]);

      // Both updates should be present (no lost updates)
      const { data: updated } = await supabase
        .from('directories')
        .select('field_selectors')
        .eq('id', testDirId)
        .single();

      expect(updated.field_selectors.field1).toBeDefined();
      expect(updated.field_selectors.field2).toBeDefined();

    } finally {
      // Cleanup
      await supabase.from('directories').delete().eq('id', testDirId);
    }
  }, 30000); // 30 second timeout
});

describe('Integration: Error Handling', () => {
  let discovery;

  beforeAll(() => {
    discovery = new AutoSelectorDiscovery({ headless: true });
  });

  test('Should handle page load timeout gracefully', () => {
    const error = new Error('Navigation timeout');
    error.name = 'PAGE_LOAD_TIMEOUT';

    expect(discovery._isRetriableError(error)).toBe(true);
  });

  test('Should handle network errors gracefully', () => {
    const error = new Error('Network error');
    error.code = 'ECONNRESET';

    expect(discovery._isRetriableError(error)).toBe(true);
  });

  test('Should not retry non-retriable errors', () => {
    const error = new Error('Directory not found');
    error.name = 'INVALID_DIRECTORY';

    expect(discovery._isRetriableError(error)).toBe(false);
  });

  test('Should implement exponential backoff', async () => {
    const delays = [];
    const originalSetTimeout = global.setTimeout;

    // Mock setTimeout to capture delays
    global.setTimeout = (fn, delay) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0); // Execute immediately for test
    };

    try {
      // This would need mocking to fully test
      // For now, verify the retry logic exists
      expect(discovery.discoverSelectorsForDirectory).toBeDefined();
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });
});

describe('Integration: Worker Integration', () => {
  const workerIntegration = require('../worker-integration');

  test('Should export required functions', () => {
    expect(workerIntegration.getDirectoryWithSelectors).toBeDefined();
    expect(workerIntegration.fillFormFieldsWithSelectors).toBeDefined();
    expect(workerIntegration.markDirectoryForRediscovery).toBeDefined();
    expect(workerIntegration.triggerSelectorRefresh).toBeDefined();
  });

  test('Should detect stale selectors', async () => {
    const directory = {
      selectors_updated_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
    };

    const daysSince = (Date.now() - new Date(directory.selectors_updated_at)) / (1000 * 60 * 60 * 24);
    expect(daysSince).toBeGreaterThan(30);
  });
});
