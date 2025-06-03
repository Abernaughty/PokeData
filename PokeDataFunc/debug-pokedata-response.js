/**
 * Debug script to see the actual PokeData API response structure
 */

const { PokeDataApiService } = require('./src/services/PokeDataApiService');

// Load environment variables
require('dotenv').config();

async function debugPokeDataResponse() {
    console.log('=== Debugging PokeData API Response ===\n');

    const pokeDataApiKey = process.env.POKEDATA_API_KEY;
    if (!pokeDataApiKey) {
        console.error('POKEDATA_API_KEY not found');
        return;
    }

    const pokeDataService = new PokeDataApiService(pokeDataApiKey);

    try {
        const pokeDataCardId = 73115; // Espeon ex
        console.log(`Getting pricing data for PokeData card ID: ${pokeDataCardId}\n`);

        // Get the raw response to see the structure
        const response = await pokeDataService.getCardPricingById(pokeDataCardId);
        
        console.log('Raw API Response:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\nResponse type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        if (response) {
            console.log('\nAnalyzing response structure:');
            console.log('- Has pricing property:', 'pricing' in response);
            console.log('- Has name property:', 'name' in response);
            console.log('- Has set_name property:', 'set_name' in response);
            console.log('- Has id property:', 'id' in response);
            
            if (response.pricing) {
                console.log('\nPricing keys:', Object.keys(response.pricing));
                console.log('PSA 10.0 value:', response.pricing['PSA 10.0']?.value);
                console.log('TCGPlayer value:', response.pricing['TCGPlayer']?.value);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugPokeDataResponse();
