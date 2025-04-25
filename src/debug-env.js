// Environment Variables Debug Script
// Include this file in your application to debug environment variables
// IMPORTANT: Remove this file before deploying to production!

(function() {
  console.log('=== Environment Variables Debug ===');
  console.log('Running debug check at:', new Date().toISOString());
  
  // Check Node environment
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  
  // Check API configuration
  console.log('API_BASE_URL exists:', !!process.env.API_BASE_URL);
  if (process.env.API_BASE_URL) {
    console.log('API_BASE_URL:', process.env.API_BASE_URL);
  }
  
  // Safely check API credentials
  console.log('API_KEY exists:', !!process.env.API_KEY);
  if (process.env.API_KEY) {
    console.log('API_KEY length:', process.env.API_KEY.length);
    console.log('API_KEY first 4 chars:', process.env.API_KEY.substring(0, 4) + '...');
  }
  
  console.log('API_SUBSCRIPTION_KEY exists:', !!process.env.API_SUBSCRIPTION_KEY);
  if (process.env.API_SUBSCRIPTION_KEY) {
    console.log('API_SUBSCRIPTION_KEY length:', process.env.API_SUBSCRIPTION_KEY.length);
    console.log('API_SUBSCRIPTION_KEY first 4 chars:', process.env.API_SUBSCRIPTION_KEY.substring(0, 4) + '...');
  }
  
  // Check build information
  console.log('BUILD_TIME:', process.env.BUILD_TIME || 'not set');
  
  console.log('=== End Environment Debug ===');
})();
