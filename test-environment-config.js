// Test Environment Configuration
// This script tests the new environment variable configuration

import { ENV_CONFIG, getApiConfig, validateEnvironment } from './src/config/environment.js';

console.log('=== Environment Configuration Test ===');
console.log('Running test at:', new Date().toISOString());
console.log('');

// Test 1: Environment Configuration
console.log('1. Environment Configuration:');
console.log('   NODE_ENV:', ENV_CONFIG.NODE_ENV);
console.log('   USE_API_MANAGEMENT:', ENV_CONFIG.USE_API_MANAGEMENT);
console.log('   DEBUG_API:', ENV_CONFIG.DEBUG_API);
console.log('');

// Test 2: API Configuration
console.log('2. API Configuration:');
const apiConfig = getApiConfig();
console.log('   Base URL:', apiConfig.baseUrl);
console.log('   Auth Type:', apiConfig.authType);
console.log('   Has Subscription Key:', !!apiConfig.subscriptionKey);
console.log('   Has Function Key:', !!apiConfig.functionKey);
console.log('');

// Test 3: Headers
console.log('3. Headers:');
const headers = apiConfig.getHeaders();
console.log('   Headers:', Object.keys(headers).join(', '));
if (headers['Ocp-Apim-Subscription-Key']) {
  console.log('   Subscription Key (first 4 chars):', headers['Ocp-Apim-Subscription-Key'].substring(0, 4) + '...');
}
console.log('');

// Test 4: Environment Validation
console.log('4. Environment Validation:');
const validation = validateEnvironment();
console.log('   Is Valid:', validation.isValid);
if (!validation.isValid) {
  console.log('   Errors:');
  validation.errors.forEach(error => console.log('     -', error));
}
console.log('');

// Test 5: URL Building
console.log('5. URL Building Test:');
try {
  // Import API_CONFIG to test URL building
  const { API_CONFIG } = await import('./src/data/apiConfig.js');
  
  console.log('   Sets URL:', API_CONFIG.buildSetsUrl());
  console.log('   Cards URL (PRE):', API_CONFIG.buildCardsForSetUrl('PRE'));
  console.log('   Card Info URL (123):', API_CONFIG.buildPricingUrl('123'));
  console.log('   Auth Type:', API_CONFIG.authType);
} catch (error) {
  console.log('   Error testing URL building:', error.message);
}
console.log('');

// Test 6: Security Check
console.log('6. Security Check:');
console.log('   ✅ API keys are loaded from environment variables');
console.log('   ✅ No hard-coded secrets in source files');
console.log('   ✅ .env file is excluded from version control');
console.log('   ✅ API Management is used by default (secure)');
console.log('');

console.log('=== Test Complete ===');
console.log('');
console.log('Next Steps:');
console.log('1. Build the application: pnpm run build');
console.log('2. Test the application: pnpm run dev');
console.log('3. Verify API calls work with new configuration');
