require('dotenv').config();
const axios = require('axios');

// Configuration
const baseUrl = 'https://pokedata-func-staging.azurewebsites.net/api';
const functionKey = process.env.FUNCTION_KEY;

// Test functions
async function testGetSetList() {
    try {
        console.log('Testing GetSetList...');
        const response = await axios.get(`${baseUrl}/sets?code=${functionKey}`);
        console.log(`Status: ${response.status}`);
        console.log(`Total sets: ${response.data.data.length}`);
        console.log('Sample sets:', response.data.data.slice(0, 3).map(set => set.name));
        console.log('GetSetList test passed!');
        return true;
    } catch (error) {
        console.error('GetSetList test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            if (error.response.headers && error.response.headers['x-ms-error-code']) {
                console.error('Azure Error Code:', error.response.headers['x-ms-error-code']);
            }
        }
        return false;
    }
}

async function testGetCardInfo() {
    try {
        console.log('Testing GetCardInfo...');
        const cardId = 'sv8pt5-161'; // Example card ID (Umbreon ex from Prismatic Evolutions)
        const response = await axios.get(`${baseUrl}/cards/${cardId}?code=${functionKey}`);
        console.log(`Status: ${response.status}`);
        console.log(`Card name: ${response.data.data.cardName}`);
        console.log(`Set name: ${response.data.data.setName}`);
        console.log(`Rarity: ${response.data.data.rarity}`);
        if (response.data.cached) {
            console.log(`Cached: Yes (Age: ${response.data.cacheAge} seconds)`);
        } else {
            console.log('Cached: No');
        }
        console.log('GetCardInfo test passed!');
        return true;
    } catch (error) {
        console.error('GetCardInfo test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            if (error.response.headers && error.response.headers['x-ms-error-code']) {
                console.error('Azure Error Code:', error.response.headers['x-ms-error-code']);
            }
        }
        return false;
    }
}

async function testGetCardsBySet() {
    try {
        console.log('Testing GetCardsBySet...');
        const setCode = 'PRE'; // Example set code (Prismatic Evolutions)
        const response = await axios.get(`${baseUrl}/sets/${setCode}/cards?code=${functionKey}`);
        console.log(`Status: ${response.status}`);
        
        // The cards are in response.data.data.items
        const cards = response.data.data.items;
        console.log(`Total cards: ${response.data.data.totalCount}`);
        console.log(`Cards in response: ${cards.length}`);
        
        if (cards.length > 0) {
            console.log('Sample cards:', cards.slice(0, 3).map(card => card.cardName));
        }
        if (response.data.cached) {
            console.log(`Cached: Yes (Age: ${response.data.cacheAge} seconds)`);
        } else {
            console.log('Cached: No');
        }
        console.log('GetCardsBySet test passed!');
        return true;
    } catch (error) {
        console.error('GetCardsBySet test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            if (error.response.headers && error.response.headers['x-ms-error-code']) {
                console.error('Azure Error Code:', error.response.headers['x-ms-error-code']);
            }
        }
        return false;
    }
}

// Test error handling
async function testInvalidCardId() {
    try {
        console.log('Testing Invalid Card ID...');
        const cardId = 'invalid-card-id';
        const response = await axios.get(`${baseUrl}/cards/${cardId}?code=${functionKey}`);
        console.log(`Status: ${response.status}`);
        console.log('Invalid Card ID test failed - should have returned an error!');
        return false;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('Invalid Card ID test passed - correctly returned 404!');
            console.log(`Error message: ${error.response.data.error}`);
            return true;
        } else {
            console.error('Invalid Card ID test failed with unexpected error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                if (error.response.headers && error.response.headers['x-ms-error-code']) {
                    console.error('Azure Error Code:', error.response.headers['x-ms-error-code']);
                }
            }
            return false;
        }
    }
}

async function testInvalidSetCode() {
    try {
        console.log('Testing Invalid Set Code...');
        const setCode = 'INVALID';
        const response = await axios.get(`${baseUrl}/sets/${setCode}/cards?code=${functionKey}`);
        console.log(`Status: ${response.status}`);
        console.log('Invalid Set Code test failed - should have returned an error!');
        return false;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('Invalid Set Code test passed - correctly returned 404!');
            console.log(`Error message: ${error.response.data.error}`);
            return true;
        } else {
            console.error('Invalid Set Code test failed with unexpected error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                if (error.response.headers && error.response.headers['x-ms-error-code']) {
                    console.error('Azure Error Code:', error.response.headers['x-ms-error-code']);
                }
            }
            return false;
        }
    }
}

// Run all tests
async function runTests() {
    console.log('Starting API tests against Azure Functions staging slot...');
    console.log(`Base URL: ${baseUrl}`);
    console.log('---------------------------------------------------');
    
    const results = {
        getSetList: await testGetSetList(),
        getCardInfo: await testGetCardInfo(),
        getCardsBySet: await testGetCardsBySet(),
        invalidCardId: await testInvalidCardId(),
        invalidSetCode: await testInvalidSetCode()
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
