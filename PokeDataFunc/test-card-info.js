// Test script for GetCardInfo Azure Function
// This script tests fetching specific card data with enhanced pricing

const axios = require('axios');

// Configuration
const AZURE_URL = 'https://pokedata-func.azurewebsites.net/api';
// Get function key from environment variables or use empty string for anonymous access
// You can set this in your .env file or as a system environment variable:
// AZURE_FUNCTION_KEY=your-key-here
const FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY || "";
const CARD_ID = 'sv8pt5-161'; // Umbreon ex from Prismatic Evolutions
const FORCE_REFRESH = true; // Set to true to bypass cache

async function testGetCardInfo() {
  console.log(`Testing GetCardInfo for card ID: ${CARD_ID}...`);
  
  try {
    console.time('Request time');
    
    // Construct the URL with force refresh parameter if needed
    let url = `${AZURE_URL}/cards/${CARD_ID}`;
    if (FORCE_REFRESH) {
      url += '?forceRefresh=true';
    }
    
    console.log(`Making request to: ${url}`);
    
    // Include the function key in the request headers
    const headers = {
      'x-functions-key': FUNCTION_KEY
    };
    
    const response = await axios.get(url, { headers });
    console.timeEnd('Request time');
    
    // Parse the response
    const data = response.data;
    
    console.log('\n=== Response Data ===');
    console.log(`Status code: ${response.status}`);
    console.log(`Card name: ${data.data.cardName || data.data.name}`);
    console.log(`Set name: ${data.data.setName}`);
    console.log(`Card number: ${data.data.cardNumber || data.data.num}`);
    console.log(`From cache: ${data.cached ? 'Yes' : 'No'}`);
    
    // Check for enhanced pricing data
    if (data.data.enhancedPricing) {
      console.log('\n=== Enhanced Pricing Data ===');
      
      // Check for PSA grades
      if (data.data.enhancedPricing.psaGrades) {
        console.log('\nPSA Grades:');
        Object.entries(data.data.enhancedPricing.psaGrades).forEach(([grade, price]) => {
          console.log(`PSA ${grade}: $${price.value}`);
        });
      } else {
        console.log('No PSA grades found in the response');
      }
      
      // Check for CGC grades
      if (data.data.enhancedPricing.cgcGrades) {
        console.log('\nCGC Grades:');
        Object.entries(data.data.enhancedPricing.cgcGrades).forEach(([grade, price]) => {
          console.log(`CGC ${grade.replace('_', '.')}: $${price.value}`);
        });
      } else {
        console.log('No CGC grades found in the response');
      }
      
      // Check for eBay Raw pricing
      if (data.data.enhancedPricing.ebayRaw) {
        console.log('\neBay Raw pricing:');
        console.log(`$${data.data.enhancedPricing.ebayRaw.value}`);
      } else {
        console.log('No eBay Raw pricing found in the response');
      }
      
      console.log('\n✅ SUCCESS: Enhanced pricing data is present!');
    } else {
      console.log('\n❌ ERROR: No enhanced pricing data found in the response.');
      console.log('The PokeData API integration may not be working correctly.');
    }
    
    // Check the regular pricing data structure
    if (data.data.pricing && Object.keys(data.data.pricing).length > 0) {
      console.log('\n=== Regular Pricing Data ===');
      Object.entries(data.data.pricing).forEach(([source, price]) => {
        console.log(`${source}: $${typeof price === 'object' ? price.value : price}`);
      });
    }
    
    // Print the full response data for debugging
    console.log('\n=== Full Response Data (truncated) ===');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
  } catch (error) {
    console.error('Error testing GetCardInfo:');
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
testGetCardInfo().catch(err => {
  console.error('Unhandled error:', err);
});
