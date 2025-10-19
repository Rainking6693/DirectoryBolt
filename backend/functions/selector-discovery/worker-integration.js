/**
 * Worker Integration for Selector Discovery System
 *
 * This module provides helper functions for workers to use discovered selectors
 * and trigger selector refresh when needed.
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Get directory with discovered selectors
 * @param {string} directoryId - Directory UUID
 * @returns {Promise<Object>} Directory data with selectors
 */
async function getDirectoryWithSelectors(directoryId) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('directories')
    .select(`
      id,
      name,
      submission_url,
      field_selectors,
      requires_login,
      has_captcha,
      failure_rate,
      selectors_updated_at
    `)
    .eq('id', directoryId)
    .single();

  if (error) throw error;

  // Check if selectors are stale (>30 days old)
  if (data.selectors_updated_at) {
    const lastUpdate = new Date(data.selectors_updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 30) {
      console.log(`⚠️ Selectors for ${data.name} are ${Math.floor(daysSinceUpdate)} days old, triggering refresh`);
      // Trigger background refresh (don't wait for it)
      triggerSelectorRefresh(directoryId).catch(err =>
        console.error('Failed to trigger selector refresh:', err)
      );
    }
  }

  return data;
}

/**
 * Trigger background selector refresh
 * @param {string} directoryId - Directory UUID
 */
async function triggerSelectorRefresh(directoryId) {
  const AutoSelectorDiscovery = require('./AutoSelectorDiscovery');
  const discovery = new AutoSelectorDiscovery({ headless: true });

  // Run in background, don't block worker
  discovery.discoverSelectorsForDirectory(directoryId)
    .then(result => {
      if (result.success) {
        console.log(`✅ Selector refresh complete for ${directoryId}`);
      } else {
        console.error(`❌ Selector refresh failed for ${directoryId}:`, result.error);
      }
    })
    .catch(err => {
      console.error(`❌ Selector refresh error for ${directoryId}:`, err);
    });
}

/**
 * Fill form fields using discovered selectors
 * @param {Page} page - Playwright page object
 * @param {Object} directory - Directory data with field_selectors
 * @param {Object} jobData - Job data with business information
 * @returns {Promise<Object>} Result with filled count and failures
 */
async function fillFormFieldsWithSelectors(page, directory, jobData) {
  const selectors = directory.field_selectors || {};

  const fieldsToFill = {
    businessName: jobData.businessName || jobData.business_name,
    email: jobData.email,
    website: jobData.website,
    phone: jobData.phone,
    description: jobData.description,
    address: jobData.address,
    city: jobData.city,
    state: jobData.state,
    zip: jobData.zip || jobData.zipCode,
    category: jobData.category
  };

  let filledCount = 0;
  const failedFields = [];

  for (const [field, value] of Object.entries(fieldsToFill)) {
    if (!value) continue; // Skip empty values

    // Get selector for this field
    const selector = selectors[field];
    if (!selector) {
      failedFields.push({ field, reason: 'no_selector' });
      continue;
    }

    try {
      // Try to fill the field with human-like typing
      await humanType(page, selector, value);
      filledCount++;

      // Random delay between fields (human-like behavior)
      await randomDelay(500, 1500);

    } catch (error) {
      failedFields.push({
        field,
        reason: 'selector_failed',
        selector,
        error: error.message
      });

      console.warn(`⚠️ Failed to fill ${field} with selector: ${selector}`, error.message);
    }
  }

  // If too many failures, mark directory for re-discovery
  if (failedFields.length > 2) {
    await markDirectoryForRediscovery(directory.id, failedFields);
  }

  return { filledCount, failedFields, totalAttempted: Object.keys(fieldsToFill).filter(k => fieldsToFill[k]).length };
}

/**
 * Human-like typing function
 * @param {Page} page - Playwright page
 * @param {string} selector - CSS selector
 * @param {string} value - Value to type
 */
async function humanType(page, selector, value) {
  const element = await page.$(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Check if element is visible and enabled
  const isVisible = await element.isVisible();
  const isEnabled = await element.isEnabled();

  if (!isVisible) {
    throw new Error(`Element not visible: ${selector}`);
  }

  if (!isEnabled) {
    throw new Error(`Element not enabled: ${selector}`);
  }

  // Clear existing value
  await element.fill('');

  // Type with human-like delay
  await element.type(value, { delay: Math.random() * 50 + 30 }); // 30-80ms per character
}

/**
 * Random delay (human-like behavior)
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 */
async function randomDelay(min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Mark directory for selector re-discovery
 * @param {string} directoryId - Directory UUID
 * @param {Array} failedFields - Array of failed field attempts
 */
async function markDirectoryForRediscovery(directoryId, failedFields) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await supabase.from('directories').update({
      selector_discovery_log: {
        needs_refresh: true,
        failed_fields: failedFields.map(f => ({
          field: f.field,
          reason: f.reason,
          selector: f.selector
        })),
        marked_at: new Date().toISOString()
      }
    }).eq('id', directoryId);

    console.log(`🔄 Marked ${directoryId} for selector re-discovery (${failedFields.length} failures)`);

    // Trigger immediate re-discovery if many failures
    if (failedFields.length >= 3) {
      triggerSelectorRefresh(directoryId);
    }

  } catch (error) {
    console.error('Failed to mark directory for re-discovery:', error);
  }
}

/**
 * Get directories that need selector refresh
 * @param {number} daysOld - Age threshold in days (default: 30)
 * @param {number} limit - Maximum number of directories to return
 * @returns {Promise<Array>} Array of directories needing refresh
 */
async function getStaleDirectories(daysOld = 30, limit = 10) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase.rpc('get_stale_selector_directories', {
      days_old: daysOld
    });

    if (error) {
      // Fallback if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('directories')
        .select('id, name, submission_url, selectors_updated_at')
        .not('submission_url', 'is', null)
        .not('selectors_updated_at', 'is', null)
        .lt('selectors_updated_at', new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString())
        .limit(limit);

      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return (data || []).slice(0, limit);

  } catch (error) {
    console.error('Failed to get stale directories:', error);
    return [];
  }
}

module.exports = {
  getDirectoryWithSelectors,
  triggerSelectorRefresh,
  fillFormFieldsWithSelectors,
  humanType,
  randomDelay,
  markDirectoryForRediscovery,
  getStaleDirectories
};
