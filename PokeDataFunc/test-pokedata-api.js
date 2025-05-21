/**
 * Test script for PokeData API integration
 * This script tests the new PokeData API endpoint configuration
 */

// Load environment variables from the local.settings.json file directly
const fs = require('fs');
const path = require('path');

// More reliable environment loading for testing
let envVars = {};
try {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        envVars = settings.Values || {};
        console.log('Loaded environment variables from local.settings.json');
    } else {
        console.log('local.settings.json not found, falling back to .env file');
        require('dotenv').config();
    }
} catch (error) {
    console.error('Error loading environment variables:', error);
    // Fallback to dotenv
    require('dotenv').config();
}

// Axios for API requests
const axios = require('axios');

// Card ID to test (Umbreon ex from Prismatic Evolutions)
const TEST_CARD_ID = 'sv8pt5-161';

// Extract card number from the card ID (e.g., sv8pt5-161 -> 161)
function extractCardNumber(cardId) {
    const match = cardId.match(/.*-(\d+.*)/);
    return match ? match[1] : cardId;
}

// Function to test direct API call to PokeData API
async function testPokeDataApiDirect() {
    console.log('\nTesting direct PokeData API call with card number...');
    
    try {
        const cardNumber = extractCardNumber(TEST_CARD_ID);
        const setCode = TEST_CARD_ID.split('-')[0];
        console.log(`Extracted card number: ${cardNumber} from ID: ${TEST_CARD_ID} (set code: ${setCode})`);
        
        // Use variables from local.settings.json
        const apiKey = envVars.POKEDATA_API_KEY || process.env.POKEDATA_API_KEY || 'your-test-key';
        const baseUrl = envVars.POKEDATA_API_BASE_URL || process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';

        console.log('Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
        console.log('Using base URL:', baseUrl);
        
        // Make request to PokeData API with just the card number
        console.log(`Making request to: ${baseUrl}/pricing with params: id=${cardNumber}, asset_type=CARD`);
        
        const response = await axios.get(`${baseUrl}/pricing`, {
            params: {
                id: cardNumber,
                asset_type: 'CARD'
            },
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response Status:', response.status);
        
        // Print a sample of the response data
        if (response.data) {
        console.log('Sample response data:');
            console.log(JSON.stringify(response.data).substring(0, 500) + '...');
            
            // Log card name from response to check if it matches what we're looking for
            if (response.data && response.data.name) {
                console.log(`\nRetrieved data for card: ${response.data.name}`);
                
                // Add warning if the card number comes from a different set than expected
                if (!response.data.name.toLowerCase().includes(setCode.toLowerCase())) {
                    console.warn(`\nWARNING: Card from different set than requested!`);
                    console.warn(`Expected set with code ${setCode}, got data for ${response.data.name}`);
                    console.warn(`This is a limitation of the PokeData API which doesn't support set-specific lookups.`);
                    console.warn(`The API will return data for any card with number ${cardNumber}, regardless of set.`);
                }
            }
            
            // Check for pricing data
            if (response.data.pricing) {
                console.log('\nPricing data found:');
                
                // Check for PSA grades
                const psaGrades = Object.keys(response.data.pricing)
                    .filter(key => key.startsWith('PSA ') && response.data.pricing[key].value > 0);
                
                if (psaGrades.length > 0) {
                    console.log('PSA Grades:', psaGrades.join(', '));
                }
                
                // Check for CGC grades
                const cgcGrades = Object.keys(response.data.pricing)
                    .filter(key => key.startsWith('CGC ') && response.data.pricing[key].value > 0);
                
                if (cgcGrades.length > 0) {
                    console.log('CGC Grades:', cgcGrades.join(', '));
                }
                
                // Check for eBay Raw pricing
                if (response.data.pricing['eBay Raw'] && response.data.pricing['eBay Raw'].value > 0) {
                    console.log('eBay Raw pricing:', response.data.pricing['eBay Raw'].value);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error testing PokeData API directly:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('Starting PokeData API integration tests...');
    console.log('Testing with card ID:', TEST_CARD_ID);
    
    // Test direct API call
    const directApiSuccess = await testPokeDataApiDirect();
    
    console.log('\nTest Summary:');
    console.log('Direct PokeData API Call:', directApiSuccess ? 'SUCCESS' : 'FAILED');
    
    if (!directApiSuccess) {
        console.log('\nTroubleshooting Tips:');
        console.log('1. Verify POKEDATA_API_KEY in local.settings.json');
        console.log('2. Verify POKEDATA_API_BASE_URL is set to https://www.pokedata.io/v0');
        console.log('3. Check that your API key has access to the pricing endpoint');
        console.log('4. Verify the ID parameter is formatted correctly (numeric portion of card ID)');
        console.log('5. Make sure asset_type is set to CARD');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Unhandled error during tests:', error);
});
