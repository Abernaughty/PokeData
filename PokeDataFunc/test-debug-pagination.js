// Test script to debug pagination issues in the GetCardsBySet Azure Function
// This script makes two requests - one with default pageSize and one with explicit pageSize

const axios = require('axios');
require('dotenv').config({ path: './.env' });

// Configuration
const functionUrl = process.env.FUNCTION_URL || 'https://pokedata-func.azurewebsites.net/api';
const functionKey = process.env.FUNCTION_KEY || '';
const setCode = 'PRE'; // Prismatic Evolutions has 180 cards

// Headers for authentication
const headers = {
    'x-functions-key': functionKey,
    'Content-Type': 'application/json'
};

async function testDefaultPageSize() {
    console.log('\n=== Testing with DEFAULT pageSize ===');
    try {
        const url = `${functionUrl}/sets/${setCode}/cards`;
        console.log(`Making request to: ${url}`);
        
        const response = await axios.get(url, { headers });
        
        // Log the pagination details
        const data = response.data;
        console.log('\nResponse pagination details:');
        console.log(`Status: ${response.status}`);
        console.log(`Total count: ${data.data.totalCount}`);
        console.log(`Page size: ${data.data.pageSize}`);
        console.log(`Page number: ${data.data.pageNumber}`);
        console.log(`Total pages: ${data.data.totalPages}`);
        console.log(`Items returned: ${data.data.items.length}`);
        
        return data;
    } catch (error) {
        console.error('Error in default pageSize test:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

async function testExplicitPageSize() {
    console.log('\n=== Testing with EXPLICIT pageSize=500 ===');
    try {
        const url = `${functionUrl}/sets/${setCode}/cards?pageSize=500`;
        console.log(`Making request to: ${url}`);
        
        const response = await axios.get(url, { headers });
        
        // Log the pagination details
        const data = response.data;
        console.log('\nResponse pagination details:');
        console.log(`Status: ${response.status}`);
        console.log(`Total count: ${data.data.totalCount}`);
        console.log(`Page size: ${data.data.pageSize}`);
        console.log(`Page number: ${data.data.pageNumber}`);
        console.log(`Total pages: ${data.data.totalPages}`);
        console.log(`Items returned: ${data.data.items.length}`);
        
        return data;
    } catch (error) {
        console.error('Error in explicit pageSize test:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

async function runTests() {
    console.log('Testing pagination in GetCardsBySet Azure Function...\n');
    
    // Test with default page size
    await testDefaultPageSize();
    
    // Test with explicit page size
    await testExplicitPageSize();
    
    console.log('\nTest completed. Check the Azure Portal logs for detailed information.');
    console.log('Application Insights query: traces | where customDimensions.Category contains "GetCardsBySet"');
}

// Run the tests
runTests().catch(err => {
    console.error('Unhandled error:', err);
});
