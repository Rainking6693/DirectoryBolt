// 🎯 DIRECTORYBOLT PRODUCT CONFIGURATION
// Product definitions for DirectoryBolt checkout system
// Supports one-time packages, subscriptions, and add-ons

/**
 * DirectoryBolt Core Packages (One-time payments)
 * These are one-time purchases for directory submissions
 */
const CORE_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Package',
    price: 4900, // $49.00 in cents
    directory_count: 50,
    description: '50 directory submissions to get your business listed',
    features: [
      '50 high-quality directory submissions',
      'Business profile optimization',
      'Submission confirmation reports',
      'Email support',
      '30-day completion guarantee'
    ],
    // These will be set via environment variables in production
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_dev_mock',
    popular: false
  },
  
  growth: {
    id: 'growth', 
    name: 'Growth Package',
    price: 8900, // $89.00 in cents
    directory_count: 100,
    description: '100 directory submissions for growing businesses',
    features: [
      '100 high-quality directory submissions',
      'Business profile optimization',
      'Submission confirmation reports', 
      'Priority email support',
      'Faster processing (5-7 days)',
      '30-day completion guarantee'
    ],
    stripe_price_id: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_dev_mock',
    popular: true
  },
  
  pro: {
    id: 'pro',
    name: 'Pro Package', 
    price: 15900, // $159.00 in cents
    directory_count: 200,
    description: '200 directory submissions for established businesses',
    features: [
      '200 high-quality directory submissions',
      'Advanced business profile optimization',
      'Detailed submission confirmation reports',
      'Priority email support',
      'Fastest processing (3-5 days)',
      'Monthly performance reports',
      '30-day completion guarantee'
    ],
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_dev_mock',
    popular: false
  }
};

/**
 * DirectoryBolt Subscription Services
 * Recurring monthly services
 */
const SUBSCRIPTION_SERVICES = {
  auto_update: {
    id: 'auto_update',
    name: 'Auto Update & Resubmission',
    price: 4900, // $49.00/month in cents
    billing_interval: 'month',
    description: 'Automatic directory updates and resubmissions',
    features: [
      'Automatic directory monitoring',
      'Profile updates when business info changes',
      'Resubmission to directories that removed listings',
      'Monthly performance reports',
      'Priority support',
      'Cancel anytime'
    ],
    stripe_price_id: process.env.STRIPE_AUTO_UPDATE_PRICE_ID || 'price_auto_update_dev_mock',
    requires_core_package: true // Must purchase core package first
  }
};

/**
 * DirectoryBolt Add-Ons (One-time upsells)
 * These can be added to any core package purchase
 */
const ADD_ONS = {
  fast_track: {
    id: 'fast_track',
    name: 'Fast-track Submission',
    price: 2500, // $25.00 in cents
    description: 'Complete your submissions in 1-2 business days',
    features: [
      'Priority processing queue',
      '1-2 business day completion',
      'Daily progress updates',
      'Dedicated submission specialist'
    ],
    stripe_price_id: process.env.STRIPE_FAST_TRACK_PRICE_ID || 'price_fast_track_dev_mock',
    compatible_packages: ['starter', 'growth', 'pro']
  },
  
  premium_directories: {
    id: 'premium_directories',
    name: 'Premium Directories Only',
    price: 1500, // $15.00 in cents  
    description: 'Submit only to high-authority, premium directories',
    features: [
      'Curated premium directory list',
      'Higher domain authority sites',
      'Better SEO impact',
      'Quality over quantity approach'
    ],
    stripe_price_id: process.env.STRIPE_PREMIUM_DIRECTORIES_PRICE_ID || 'price_premium_directories_dev_mock',
    compatible_packages: ['starter', 'growth', 'pro']
  },
  
  manual_qa: {
    id: 'manual_qa',
    name: 'Manual QA Review',
    price: 1000, // $10.00 in cents
    description: 'Human quality assurance review of all submissions',
    features: [
      'Manual review by QA specialist',
      'Error detection and correction',
      'Submission optimization suggestions',
      'Quality guarantee'
    ],
    stripe_price_id: process.env.STRIPE_MANUAL_QA_PRICE_ID || 'price_manual_qa_dev_mock',
    compatible_packages: ['starter', 'growth', 'pro']
  },
  
  csv_export: {
    id: 'csv_export',
    name: 'CSV Export',
    price: 900, // $9.00 in cents
    description: 'Download detailed CSV report of all submissions',
    features: [
      'Comprehensive CSV export',
      'All submission details',
      'Status tracking information',
      'Import into other tools'
    ],
    stripe_price_id: process.env.STRIPE_CSV_EXPORT_PRICE_ID || 'price_csv_export_dev_mock',
    compatible_packages: ['starter', 'growth', 'pro']
  }
};

/**
 * Calculate total price for a package with add-ons
 */
function calculateTotalPrice(packageId, addOnIds = [], subscriptionIds = []) {
  let total = 0;
  
  // Add core package price
  if (CORE_PACKAGES[packageId]) {
    total += CORE_PACKAGES[packageId].price;
  }
  
  // Add add-on prices
  addOnIds.forEach(addOnId => {
    if (ADD_ONS[addOnId]) {
      total += ADD_ONS[addOnId].price;
    }
  });
  
  return total;
}

/**
 * Validate package and add-on compatibility
 */
function validatePackageConfiguration(packageId, addOnIds = []) {
  const errors = [];
  
  // Validate core package exists
  if (!CORE_PACKAGES[packageId]) {
    errors.push(`Invalid package ID: ${packageId}`);
    return { valid: false, errors };
  }
  
  // Validate add-ons
  addOnIds.forEach(addOnId => {
    const addOn = ADD_ONS[addOnId];
    if (!addOn) {
      errors.push(`Invalid add-on ID: ${addOnId}`);
    } else if (!addOn.compatible_packages.includes(packageId)) {
      errors.push(`Add-on "${addOnId}" is not compatible with package "${packageId}"`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get all line items for Stripe checkout
 */
function getCheckoutLineItems(packageId, addOnIds = []) {
  const lineItems = [];
  
  // Add core package
  if (CORE_PACKAGES[packageId]) {
    lineItems.push({
      price: CORE_PACKAGES[packageId].stripe_price_id,
      quantity: 1
    });
  }
  
  // Add add-ons
  addOnIds.forEach(addOnId => {
    if (ADD_ONS[addOnId]) {
      lineItems.push({
        price: ADD_ONS[addOnId].stripe_price_id,
        quantity: 1
      });
    }
  });
  
  return lineItems;
}

/**
 * Get order summary for display
 */
function getOrderSummary(packageId, addOnIds = []) {
  const summary = {
    package: CORE_PACKAGES[packageId] || null,
    addOns: addOnIds.map(id => ADD_ONS[id]).filter(Boolean),
    totalPrice: calculateTotalPrice(packageId, addOnIds),
    totalDirectories: CORE_PACKAGES[packageId]?.directory_count || 0
  };
  
  return summary;
}

/**
 * Check if environment variables are properly configured
 */
function validateStripeConfiguration() {
  const required = {
    secret_key: process.env.STRIPE_SECRET_KEY,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET
  };
  
  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    return {
      configured: false,
      missing: missing,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  // Check if we have price IDs for core packages
  const corePackagePriceIds = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    growth: process.env.STRIPE_GROWTH_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID
  };
  
  const missingPriceIds = Object.entries(corePackagePriceIds)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  return {
    configured: true,
    development_mode: missingPriceIds.length > 0,
    missing_price_ids: missingPriceIds
  };
}

module.exports = {
  CORE_PACKAGES,
  SUBSCRIPTION_SERVICES,
  ADD_ONS,
  calculateTotalPrice,
  validatePackageConfiguration,
  getCheckoutLineItems,
  getOrderSummary,
  validateStripeConfiguration
};