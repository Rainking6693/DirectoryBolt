// Development configuration for Chrome extension
// This file overrides the default production settings for local testing

window.DevConfig = {
  // Use local development server
  API_BASE: 'http://localhost:3003',
  ENDPOINT: '/api/extension/validate',
  
  // Enable debug logging
  DEBUG: true,
  
  // Test customer IDs available in development
  TEST_CUSTOMER_IDS: [
    'DIR-20250917-000001', // Bennet g - Growth package
    'DIR-20250917-000002'  // Stone b - Professional package
  ]
};

console.log('🔧 Development config loaded:', window.DevConfig);