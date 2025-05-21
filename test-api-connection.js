// Simple test script to check API Management connection
const { default: fetch } = require('node-fetch');

// Test parameters
const API_BASE_URL = 'https://maber-apim-test.azure-api.net/pokedata-api';
const API_KEY = '1c3e73f4352b415c98eb89f91541c4e4';
const endpoints = [
  '/sets',                     // Get set list
  '/sets/PRE/cards',           // Get cards in "Prismatic Evolutions" set
  '/cards/sv8pt5-161'          // Get card info for "Umbreon ex"
];

// Headers
const headers = {
  'Ocp-Apim-Subscription-Key': API_KEY,
  'Content-Type': 'application/json'
};

async function testApiManagementConnection() {
  console.log('Testing API Management connection...\n');
  
  for (const endpoint of endpoints) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Testing endpoint: ${url}`);
    
    try {
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${endpoint} - Status: ${response.status}`);
        const data = await response.json();
        console.log(`   Received ${typeof data === 'object' ? (Array.isArray(data) ? data.length + ' items' : 'object') : 'data'}`);
      } else {
        console.log(`❌ ERROR: ${endpoint} - Status: ${response.status} ${response.statusText}`);
        try {
          const text = await response.text();
          console.log(`   Error details: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        } catch (e) {
          console.log('   Could not parse error details');
        }
      }
    } catch (error) {
      console.log(`❌ NETWORK ERROR: ${endpoint} - ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('Test complete. If all endpoints show SUCCESS, your configuration is correct.');
}

// Run the test
testApiManagementConnection();
