// Test script for verifying the Azure Function deployment in the staging environment
// This script tests the getCardsBySet endpoint to ensure pagination is working correctly

const axios = require('axios');

// Staging environment URL
const STAGING_URL = 'https://pokedata-func.azurewebsites.net/api';
const SET_CODE = 'PRE'; // Prismatic Evolutions (has more than 100 cards)

// Function key for authentication
// You need to provide a valid function key from the Azure portal
// or set it as an environment variable
const FUNCTION_KEY = "7dq8aHEWt4ngfLOX6p1tL7-c9Dy6B4-ip3up0cNMl07mAzFuKESTuA==";
// https://pokedata-func.azurewebsites.net/api/sets/{setCode}/cards?code=7dq8aHEWt4ngfLOX6p1tL7-c9Dy6B4-ip3up0cNMl07mAzFuKESTuA==
// https://pokedata-func-staging.azurewebsites.net/api/sets/PRE/cards

if (!FUNCTION_KEY) {
  console.error('Error: No function key provided. Set the AZURE_FUNCTION_KEY environment variable.');
  console.error('You can get the function key from the Azure Portal under the Function App > Functions > getCardsBySet > Function Keys.');
  process.exit(1);
}

async function testStagingApi() {
  console.log(`Testing staging environment API for set ${SET_CODE}...`);
  
  try {
    console.time('Request time');
    
    // Make request to the staging environment
    const url = `${STAGING_URL}/sets/${SET_CODE}/cards`;
    console.log(`Making request to: ${url}`);
    
    // Include the function key in the request headers
    const headers = {
      'x-functions-key': FUNCTION_KEY
    };
    
    const response = await axios.get(url, { headers });
    console.timeEnd('Request time');
    
    // Parse the response
    const data = response.data;
    
    // Check if we got all the cards (should be more than 100)
    console.log('\n=== Response Data ===');
    console.log(`Status code: ${response.status}`);
    console.log(`Cards returned: ${data.data.items.length}`);
    console.log(`Total cards: ${data.data.totalCount}`);
    console.log(`Page number: ${data.data.pageNumber}/${data.data.totalPages}`);
    console.log(`Page size: ${data.data.pageSize}`);
    
    if (data.data.items.length > 100) {
      console.log('\n✅ SUCCESS: The API returned more than 100 cards!');
      console.log(`Received ${data.data.items.length} out of ${data.data.totalCount} total cards.`);
      
      // Show a few sample cards
      console.log('\n=== First Few Cards ===');
      data.data.items.slice(0, 3).forEach((card, i) => {
        console.log(`${i+1}. ${card.cardName} (#${card.cardNumber})`);
      });
      
      // Show cards past the 100 mark to verify pagination
      console.log('\n=== Cards Past #100 ===');
      data.data.items.slice(100, 103).forEach((card, i) => {
        console.log(`${i+101}. ${card.cardName} (#${card.cardNumber})`);
      });
      
      // Show the last few cards
      console.log('\n=== Last Few Cards ===');
      data.data.items.slice(-3).forEach((card, i) => {
        console.log(`${data.data.items.length-2+i}. ${card.cardName} (#${card.cardNumber})`);
      });
    } else {
      console.log('\n❌ ERROR: The API returned 100 or fewer cards.');
      console.log('The pagination fix may not be working correctly in the staging environment.');
    }
    
  } catch (error) {
    console.error('Error testing staging API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testStagingApi().catch(err => {
  console.error('Unhandled error:', err);
});
