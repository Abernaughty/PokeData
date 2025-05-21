/**
 * Test script for PokeData API integration with the correct workflow
 * 
 * This script demonstrates:
 * 1. Fetching all sets from PokeData API
 * 2. Finding a set by its code
 * 3. Getting all cards in a set
 * 4. Finding a card by its number
 * 5. Fetching pricing data using the card ID
 */

// Dependencies
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables
let envVars = {};
try {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        envVars = settings.Values || {};
        console.log('Loaded environment variables from local.settings.json');
    }
} catch (error) {
    console.error('Error loading environment variables:', error);
}

// Test configuration
const POKEDATA_API_KEY = envVars.POKEDATA_API_KEY || process.env.POKEDATA_API_KEY;
const POKEDATA_API_BASE_URL = envVars.POKEDATA_API_BASE_URL || process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
const TEST_SET_CODE = 'sv8'; // Super Electric Breaker
const TEST_CARD_NUMBER = '076'; // Alolan Diglett - we know this exists from our previous test

// Step 1: Get all sets
async function getAllSets() {
    console.log(`\n===== Step 1: Get All Sets =====`);
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/sets`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/sets`, {
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Success! Retrieved ${response.data.length} sets`);
            
            // Display a sample of sets
            console.log('\nSample sets:');
            for (let i = 0; i < Math.min(5, response.data.length); i++) {
                const set = response.data[i];
                console.log(`- ID: ${set.id}, Code: ${set.code}, Name: ${set.name}`);
            }
            
            return response.data;
        } else {
            console.log('❌ Failed to retrieve sets or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting sets:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Step 2: Find set by code
async function findSetByCode(sets, setCode) {
    console.log(`\n===== Step 2: Find Set by Code ${setCode} =====`);
    
    if (!sets || !Array.isArray(sets)) {
        console.log('❌ No valid sets data provided');
        return null;
    }
    
    const matchingSet = sets.find(set => 
        set.code && set.code.toLowerCase() === setCode.toLowerCase()
    );
    
    if (matchingSet) {
        console.log(`✅ Found set "${matchingSet.name}" with ID: ${matchingSet.id}`);
        return matchingSet;
    } else {
        console.log(`❌ No set found with code "${setCode}"`);
        return null;
    }
}

// Step 3: Get cards in set
async function getCardsInSet(setId) {
    console.log(`\n===== Step 3: Get Cards in Set (ID: ${setId}) =====`);
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/set?set_id=${setId}`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/set`, {
            params: {
                set_id: setId
            },
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Success! Found ${response.data.length} cards in set`);
            
            // Display a sample of cards
            console.log('\nSample cards:');
            for (let i = 0; i < Math.min(5, response.data.length); i++) {
                const card = response.data[i];
                console.log(`- ID: ${card.id}, Name: ${card.name}, Number: ${card.num}`);
            }
            
            return response.data;
        } else {
            console.log('❌ Failed to retrieve cards or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting cards in set:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Step 4: Find card by number
async function findCardByNumber(cards, cardNumber) {
    console.log(`\n===== Step 4: Find Card by Number ${cardNumber} =====`);
    
    if (!cards || !Array.isArray(cards)) {
        console.log('❌ No valid cards data provided');
        return null;
    }
    
    const matchingCard = cards.find(card => 
        card.num && card.num.toLowerCase() === cardNumber.toLowerCase()
    );
    
    if (matchingCard) {
        console.log(`✅ Found card "${matchingCard.name}" with ID: ${matchingCard.id}`);
        return matchingCard;
    } else {
        console.log(`❌ No card found with number "${cardNumber}"`);
        return null;
    }
}

// Step 5: Get pricing by card ID
async function getCardPricing(cardId) {
    console.log(`\n===== Step 5: Get Card Pricing (ID: ${cardId}) =====`);
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/pricing?id=${cardId}&asset_type=CARD`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/pricing`, {
            params: {
                id: cardId,
                asset_type: 'CARD'
            },
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.pricing) {
            console.log(`✅ Success! Retrieved pricing data for card ID: ${cardId}`);
            
            // Display card info
            console.log(`\nCard Information:`);
            console.log(`- Name: ${response.data.name}`);
            console.log(`- Number: ${response.data.num}`);
            
            // Count pricing data
            const pricingKeys = Object.keys(response.data.pricing);
            console.log(`\nPricing data: ${pricingKeys.length} price points found`);
            
            // Display PSA grades
            const psaGrades = pricingKeys.filter(key => key.startsWith('PSA '));
            if (psaGrades.length > 0) {
                console.log('\nPSA Grades:');
                psaGrades.forEach(grade => {
                    console.log(`- ${grade}: $${response.data.pricing[grade].value}`);
                });
            }
            
            // Display CGC grades
            const cgcGrades = pricingKeys.filter(key => key.startsWith('CGC '));
            if (cgcGrades.length > 0) {
                console.log('\nCGC Grades:');
                cgcGrades.forEach(grade => {
                    console.log(`- ${grade}: $${response.data.pricing[grade].value}`);
                });
            }
            
            // Display eBay Raw
            if (response.data.pricing['eBay Raw']) {
                console.log('\neBay Raw:');
                console.log(`- $${response.data.pricing['eBay Raw'].value}`);
            }
            
            return response.data;
        } else {
            console.log('❌ Failed to retrieve pricing data or unexpected response format');
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting pricing data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Fallback method - using just card number
async function fallbackPricingMethod(cardNumber) {
    console.log(`\n===== Fallback: Get Pricing by Card Number: ${cardNumber} =====`);
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/pricing with card number: ${cardNumber}`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/pricing`, {
            params: {
                id: cardNumber,
                asset_type: 'CARD'
            },
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.pricing) {
            console.log(`✅ Success! Retrieved pricing data for card number: ${cardNumber}`);
            
            // Display card info
            console.log(`\nCard Information:`);
            console.log(`- Name: ${response.data.name}`);
            console.log(`- Number: ${response.data.num}`);
            
            // Display summary of pricing data
            const pricingKeys = Object.keys(response.data.pricing);
            console.log(`\nPricing data: ${pricingKeys.length} price points found`);
            
            return response.data;
        } else {
            console.log('❌ Failed to retrieve pricing data or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error in fallback pricing method:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Run the complete workflow
async function runCompleteWorkflow() {
    console.log('=============================================================');
    console.log('       Testing PokeData API Integration - Proper Workflow');
    console.log('=============================================================');
    
    console.log(`Using PokeData API Base URL: ${POKEDATA_API_BASE_URL}`);
    console.log(`Using PokeData API Key: ${POKEDATA_API_KEY ? POKEDATA_API_KEY.substring(0, 10) + '...' : 'Not found'}`);
    console.log(`Testing with Set: ${TEST_SET_CODE}, Card: ${TEST_CARD_NUMBER}`);
    
    // Execute each step in sequence
    try {
        // Step 1: Get all sets
        const sets = await getAllSets();
        let correctWorkflowSucceeded = false;
        
        if (sets) {
            // Step 2: Find the target set
            const targetSet = await findSetByCode(sets, TEST_SET_CODE);
            
            if (targetSet) {
                // Step 3: Get cards in the set
                const cards = await getCardsInSet(targetSet.id);
                
                if (cards) {
                    // Step 4: Find the target card
                    const targetCard = await findCardByNumber(cards, TEST_CARD_NUMBER);
                    
                    if (targetCard) {
                        // Step 5: Get pricing data
                        const pricingData = await getCardPricing(targetCard.id);
                        
                        if (pricingData) {
                            correctWorkflowSucceeded = true;
                        }
                    }
                }
            }
        }
        
        // Test the fallback method if the correct workflow failed
        let fallbackSucceeded = false;
        if (!correctWorkflowSucceeded) {
            console.log('\n⚠️ Correct workflow failed or was incomplete. Testing fallback method...');
            const fallbackData = await fallbackPricingMethod(TEST_CARD_NUMBER);
            fallbackSucceeded = !!fallbackData;
        }
        
        // Summary
        console.log('\n=============================================================');
        console.log('                     Test Results');
        console.log('=============================================================');
        console.log(`Correct PokeData API Workflow: ${correctWorkflowSucceeded ? '✅ SUCCEEDED' : '❌ FAILED'}`);
        
        if (!correctWorkflowSucceeded && fallbackSucceeded) {
            console.log(`Fallback Method: ✅ SUCCEEDED`);
            console.log('\n⚠️ The proper workflow failed, but our fallback method works.');
            console.log('⚠️ This means our service will continue to function, but with limited accuracy.');
            console.log('⚠️ The fallback method may return pricing for cards with the same number but from different sets.');
        } else if (!correctWorkflowSucceeded) {
            console.log(`Fallback Method: ❌ FAILED`);
            console.log('\n❌ Both the proper workflow and fallback method failed.');
            console.log('❌ This may indicate API access issues or changes to the API structure.');
        }
        
        if (correctWorkflowSucceeded) {
            console.log('\n🎉 The proper PokeData API workflow succeeded!');
            console.log('This confirms our updated implementation is working correctly.');
            console.log('Our service now follows the correct sequence:');
            console.log('1. Get all sets to find the set ID');
            console.log('2. Use the set ID to get cards in the set');
            console.log('3. Find the specific card by its number');
            console.log('4. Use the card\'s numeric ID to get accurate pricing data');
        }
    } catch (error) {
        console.error('\n❌ Unhandled error during workflow testing:', error.message);
    }
}

// Run the workflow
runCompleteWorkflow().catch(error => {
    console.error('Fatal error during test execution:', error);
});
