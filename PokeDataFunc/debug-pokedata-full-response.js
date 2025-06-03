/**
 * Debug script to see the full PokeData API response structure
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config();

async function debugFullPokeDataResponse() {
    console.log('=== Debugging Full PokeData API Response ===\n');

    const pokeDataApiKey = process.env.POKEDATA_API_KEY;
    if (!pokeDataApiKey) {
        console.error('POKEDATA_API_KEY not found');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${pokeDataApiKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const pokeDataCardId = 73115; // Espeon ex
        console.log(`Getting FULL pricing data for PokeData card ID: ${pokeDataCardId}\n`);

        // Get the raw response to see the structure
        const url = 'https://www.pokedata.io/v0/pricing';
        const params = {
            id: pokeDataCardId,
            asset_type: 'CARD'
        };
        
        console.log('Making request to:', url);
        console.log('With params:', params);
        console.log('With headers:', headers);
        
        const response = await axios.get(url, { params, headers });
        
        console.log('\n=== FULL API Response ===');
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
        console.log('\nFull Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        console.log('\nResponse data type:', typeof response.data);
        console.log('Response data keys:', Object.keys(response.data || {}));
        
        if (response.data) {
            console.log('\nAnalyzing full response structure:');
            console.log('- Has pricing property:', 'pricing' in response.data);
            console.log('- Has name property:', 'name' in response.data);
            console.log('- Has set_name property:', 'set_name' in response.data);
            console.log('- Has id property:', 'id' in response.data);
            console.log('- Has num property:', 'num' in response.data);
            console.log('- Has set_id property:', 'set_id' in response.data);
            console.log('- Has language property:', 'language' in response.data);
            console.log('- Has release_date property:', 'release_date' in response.data);
            console.log('- Has secret property:', 'secret' in response.data);
            console.log('- Has set_code property:', 'set_code' in response.data);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        console.error('Stack:', error.stack);
    }
}

debugFullPokeDataResponse();
