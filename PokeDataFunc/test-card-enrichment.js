// test-card-enrichment.js
// This script tests the card enrichment logic by querying the GetCardInfo endpoint

const axios = require('axios');

// Test cards
const testCards = [
    'sv8pt5-161', // Umbreon ex from Prismatic Evolutions
    'sv8pt5-155', // Espeon ex from Prismatic Evolutions
    'sv8-100',    // Card from Paradox Rift
];

// Function to test card enrichment
async function testCardEnrichment() {
    console.log('Testing card enrichment logic...');
    
    // Base URL for local testing - adjust as needed
    const baseUrl = 'http://localhost:7071/api';
    
    for (const cardId of testCards) {
        try {
            console.log(`\nTesting card: ${cardId}`);
            
            // First, test with forceRefresh=true to ensure we get fresh data
            console.log(`Fetching with forceRefresh=true...`);
            const refreshResponse = await axios.get(`${baseUrl}/cards/${cardId}?forceRefresh=true`);
            
            console.log(`Status: ${refreshResponse.status}`);
            console.log(`Card name: ${refreshResponse.data.data.cardName}`);
            console.log(`Set: ${refreshResponse.data.data.setName} (${refreshResponse.data.data.setCode})`);
            console.log(`Has pokeDataId: ${!!refreshResponse.data.data.pokeDataId}`);
            console.log(`Has pricing: ${!!refreshResponse.data.data.pricing}`);
            console.log(`Has enhancedPricing: ${!!refreshResponse.data.data.enhancedPricing}`);
            
            // Then test without forceRefresh to check caching
            console.log(`\nFetching without forceRefresh...`);
            const cachedResponse = await axios.get(`${baseUrl}/cards/${cardId}`);
            
            console.log(`Status: ${cachedResponse.status}`);
            console.log(`Cached: ${cachedResponse.data.cached}`);
            console.log(`Cache age: ${cachedResponse.data.cacheAge} seconds`);
            
        } catch (error) {
            console.error(`Error testing card ${cardId}:`, error.message);
            if (error.response) {
                console.error(`Response status: ${error.response.status}`);
                console.error(`Response data:`, error.response.data);
            }
        }
    }
}

// Run the test
testCardEnrichment().catch(error => {
    console.error('Unhandled error:', error);
});
