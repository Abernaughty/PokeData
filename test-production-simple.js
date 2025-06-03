const https = require('https');

console.log('🔍 Testing Production Environment Access');
console.log('=======================================');

// Test without function key first to see what error we get
const testUrl = 'https://pokedata-func.azurewebsites.net/api/sets';

console.log(`Testing: ${testUrl}`);

const req = https.request(testUrl, { method: 'GET' }, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log(`Response: ${data.substring(0, 500)}...`);
    
    if (res.statusCode === 401) {
      console.log('\n🔑 401 Unauthorized - Function key required');
      console.log('   This confirms the function is deployed but needs authentication');
      console.log('   We need to get the production function key from Azure Portal');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
