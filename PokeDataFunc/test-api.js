const axios = require('axios');

// Configuration
const baseUrl = 'http://localhost:7071/api';

// Test functions
async function testGetSetList() {
    try {
        console.log('Testing GetSetList...');
        const response = await axios.get(`${baseUrl}/sets`);
        console.log(`Status: ${response.status}`);
        console.log(`Total sets: ${response.data.data.items.length}`);
        console.log('GetSetList test passed!');
        return true;
    } catch (error) {
        console.error('GetSetList test failed:', error.message);
        return false;
    }
}

async function testGetCardInfo() {
    try {
        console.log('Testing GetCardInfo...');
        const cardId = 'sv8pt5-161'; // Example card ID
        const response = await axios.get(`${baseUrl}/cards/${cardId}`);
        console.log(`Status: ${response.status}`);
        console.log(`Card name: ${response.data.data.cardName}`);
        console.log('GetCardInfo test passed!');
        return true;
    } catch (error) {
        console.error('GetCardInfo test failed:', error.message);
        return false;
    }
}

async function testGetCardsBySet() {
    try {
        console.log('Testing GetCardsBySet...');
        const setCode = 'PRE'; // Example set code
        const response = await axios.get(`${baseUrl}/sets/${setCode}/cards`);
        console.log(`Status: ${response.status}`);
        console.log(`Total cards: ${response.data.data.totalCount}`);
        console.log('GetCardsBySet test passed!');
        return true;
    } catch (error) {
        console.error('GetCardsBySet test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('Starting API tests...');
    
    const results = {
        getSetList: await testGetSetList(),
        getCardInfo: await testGetCardInfo(),
        getCardsBySet: await testGetCardsBySet()
    };
    
    console.log('\nTest Results:');
    console.log('-------------');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
});
