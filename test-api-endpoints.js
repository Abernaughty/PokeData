// Test script for API endpoints
const fetch = require('node-fetch');

// API Configuration
const API_CONFIG = {
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.subscriptionKey
    };
  },
  
  buildSetsUrl() {
    return `${this.baseUrl}/sets`;
  },
  
  buildCardsForSetUrl(setCode) {
    return `${this.baseUrl}/sets/${encodeURIComponent(setCode)}/cards`;
  },
  
  buildCardInfoUrl(cardId) {
    return `${this.baseUrl}/cards/${encodeURIComponent(cardId)}`;
  }
};

// Test function for the sets endpoint
async function testSetsEndpoint() {
  console.log('\n--- Testing Sets Endpoint ---');
  try {
    const url = API_CONFIG.buildSetsUrl();
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`Success! Received ${data.data ? data.data.length : 0} sets.`);
    console.log(`First few sets: ${JSON.stringify(data.data ? data.data.slice(0, 3) : [], null, 2)}`);
    return true;
  } catch (error) {
    console.error('Error testing sets endpoint:', error);
    return false;
  }
}

// Test function for the cards by set endpoint
async function testCardsBySetEndpoint(setCode = 'PRE') {
  console.log(`\n--- Testing Cards by Set Endpoint (Set: ${setCode}) ---`);
  try {
    const url = API_CONFIG.buildCardsForSetUrl(setCode);
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`Success! Received ${data.data && data.data.items ? data.data.items.length : 0} cards.`);
    console.log(`First few cards: ${JSON.stringify(data.data && data.data.items ? data.data.items.slice(0, 3) : [], null, 2)}`);
    return true;
  } catch (error) {
    console.error(`Error testing cards by set endpoint for set ${setCode}:`, error);
    return false;
  }
}

// Test function for the card info endpoint
async function testCardInfoEndpoint(cardId = 'sv8pt5-161') {
  console.log(`\n--- Testing Card Info Endpoint (Card: ${cardId}) ---`);
  try {
    const url = API_CONFIG.buildCardInfoUrl(cardId);
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Success! Received card data:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error testing card info endpoint for card ${cardId}:`, error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API endpoint tests...');
  
  // Test sets endpoint
  const setsResult = await testSetsEndpoint();
  
  // Test cards by set endpoint
  const cardsBySetResult = await testCardsBySetEndpoint('PRE'); // Prismatic Evolutions
  
  // Test card info endpoint
  const cardInfoResult = await testCardInfoEndpoint('sv8pt5-161'); // Umbreon ex
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`Sets Endpoint: ${setsResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Cards by Set Endpoint: ${cardsBySetResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Card Info Endpoint: ${cardInfoResult ? 'PASSED' : 'FAILED'}`);
  
  if (setsResult && cardsBySetResult && cardInfoResult) {
    console.log('\nAll tests PASSED! The API endpoints are working correctly.');
  } else {
    console.log('\nSome tests FAILED. Please check the error messages above.');
  }
}

// Run the tests
runTests();
