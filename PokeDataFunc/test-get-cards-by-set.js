// Test script for the GetCardsBySet Azure Function
// This script verifies that the function returns all cards for a set with the increased page size

// Load environment variables
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: '../.env' });

// Import required modules
const axios = require('axios');

// Function URL and key
const functionUrl = process.env.FUNCTION_URL || 'http://localhost:7071/api';
const functionKey = process.env.FUNCTION_KEY || '';
const setCode = process.env.TEST_SET_CODE || 'PRE'; // Prismatic Evolutions has 180 cards

async function testGetCardsBySet() {
    try {
        console.log(`Testing GetCardsBySet function for set: ${setCode}`);
        
        // Construct the URL
        const url = `${functionUrl}/sets/${setCode}/cards`;
        console.log(`Request URL: ${url}`);
        
        // Add function key if available
        const headers = functionKey ? { 'x-functions-key': functionKey } : {};
        
        // Make the request
        console.time('Request time');
        console.log('Making request...');
        const response = await axios.get(url, { headers });
        console.timeEnd('Request time');
        
        // Check the response
        const data = response.data;
        
        console.log('\n=== Response Metadata ===');
        console.log(`Status: ${response.status}`);
        console.log(`Cards returned: ${data.data.items.length}`);
        console.log(`Total cards: ${data.data.totalCount}`);
        console.log(`Page: ${data.data.pageNumber}/${data.data.totalPages}`);
        console.log(`Page size: ${data.data.pageSize}`);
        console.log(`Cached: ${data.cached || false}`);
        
        if (data.data.totalCount > 100 && data.data.items.length > 100) {
            console.log('\n✅ SUCCESS: The function returned more than 100 cards!');
            console.log(`Received ${data.data.items.length} cards out of a total of ${data.data.totalCount}`);
            
            // If all cards were returned in a single page
            if (data.data.items.length === data.data.totalCount) {
                console.log('✅ All cards were returned in a single page.');
            } else {
                console.log(`⚠️ Only partially returned: ${data.data.items.length}/${data.data.totalCount} cards.`);
                console.log(`This may be expected if the total exceeds the maximum page size of 500.`);
            }
        } else if (data.data.totalCount <= 100) {
            console.log('\n⚠️ The test set has 100 or fewer cards, so we cannot conclusively test the fix.');
            console.log(`Received ${data.data.items.length} cards out of a total of ${data.data.totalCount}`);
        } else {
            console.log('\n❌ FAILURE: The function still only returned 100 cards or fewer!');
            console.log(`Received ${data.data.items.length} cards out of a total of ${data.data.totalCount}`);
        }
        
        // Show a few cards from the response
        console.log('\n=== Sample Cards ===');
        if (data.data.items.length > 0) {
            const sampleCards = data.data.items.slice(0, Math.min(3, data.data.items.length));
            sampleCards.forEach((card, index) => {
                console.log(`Card ${index + 1}: ${card.cardName} (#${card.cardNumber})`);
            });
            
            // Show cards past the 100 mark to verify we're getting more than 100
            if (data.data.items.length > 100) {
                console.log('\n=== Cards past #100 ===');
                const pastHundred = data.data.items.slice(100, Math.min(103, data.data.items.length));
                pastHundred.forEach((card, index) => {
                    console.log(`Card ${index + 101}: ${card.cardName} (#${card.cardNumber})`);
                });
            }
            
            // Show the last few cards
            console.log('\n=== Last Few Cards ===');
            const lastCards = data.data.items.slice(-3);
            lastCards.forEach((card, index) => {
                console.log(`Card ${data.data.items.length - 2 + index}: ${card.cardName} (#${card.cardNumber})`);
            });
        } else {
            console.log('No cards returned in the response!');
        }
        
    } catch (error) {
        console.error('Error testing GetCardsBySet function:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Run the test
testGetCardsBySet().catch(err => {
    console.error('Unhandled error:', err);
});
