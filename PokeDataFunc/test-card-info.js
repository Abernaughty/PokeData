// Test script for GetCardInfo Azure Function
// This script tests fetching specific card data with enhanced pricing

const axios = require('axios');

// Dependencies
const fs = require('fs');
const path = require('path');

// Load settings from local.settings.json
const localSettingsPath = path.join(__dirname, 'local.settings.json');
let localSettings;
try {
    localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
    console.log('Successfully loaded local.settings.json');
} catch (error) {
    console.error('Error loading local.settings.json:', error.message);
    process.exit(1);
}

// Configuration
const AZURE_URL = 'https://pokedata-func.azurewebsites.net/api';
const CARD_ID = 'sv9-72'; // Morgrem from Journey Together - Missing enhancedPricing property
const FORCE_REFRESH = true; // Set to true to bypass cache

// Test locally by default since we're debugging
const LOCAL_URL = 'http://localhost:7071/api';
const USE_LOCAL = true; // Set to true to test locally
const API_URL = USE_LOCAL ? LOCAL_URL : AZURE_URL;

// Function key - use from env var if set, otherwise try to use master key from local.settings.json
const FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY || "";

console.log(`Using API URL: ${API_URL}`);
console.log(`Testing with card ID: ${CARD_ID}`);

async function testGetCardInfo() {
  console.log(`Testing GetCardInfo for card ID: ${CARD_ID}...`);
  
  try {
    console.time('Request time');
    
    // Construct the URL with force refresh parameter if needed
    let url = `${API_URL}/cards/${CARD_ID}`;
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
