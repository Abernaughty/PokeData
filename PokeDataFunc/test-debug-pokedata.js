/**
 * Debug script to directly test PokeData API integration
 * This bypasses the Azure Functions host and tests the PokeData API directly
 */

const axios = require('axios');
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
const POKEDATA_API_KEY = localSettings.Values.POKEDATA_API_KEY;
const POKEDATA_API_BASE_URL = localSettings.Values.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';

// Test card data (from database)
const CARD_DATA = {
    "id": "sv9-72",
    "setCode": "JTG",
    "setId": "sv9",
    "setName": "Journey Together",
    "cardId": "sv9-72",
    "cardName": "Morgrem",
    "cardNumber": "72",
    "rarity": "Common"
};

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all sets from PokeData API
 */
async function getAllSets() {
    try {
        console.log(`Getting all sets from PokeData API...`);
        console.log(`API Key: ${POKEDATA_API_KEY}`);

        const response = await axios.get(`${POKEDATA_API_BASE_URL}/sets`, {
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (Array.isArray(response.data)) {
            console.log(`✅ Retrieved ${response.data.length} sets from PokeData API`);
            
            // Find set that matches our card
            console.log(`Looking for set matching our card: ${CARD_DATA.setId} / ${CARD_DATA.setCode}`);
            
            // Try different matching strategies
            console.log("\nTrying to match by code...");
            let matchingSet = response.data.find(set => 
                set.code && set.code.toLowerCase() === CARD_DATA.setCode.toLowerCase()
            );
            
            if (matchingSet) {
                console.log(`✅ Found exact code match: ${matchingSet.name} (ID: ${matchingSet.id}, Code: ${matchingSet.code})`);
            } else {
                console.log("❌ No exact code match found");
                
                // Try to find by name
                console.log("\nTrying to match by name...");
                matchingSet = response.data.find(set => 
                    set.name.toLowerCase().includes("journey") && 
                    set.name.toLowerCase().includes("together")
                );
                
                if (matchingSet) {
                    console.log(`✅ Found name match: ${matchingSet.name} (ID: ${matchingSet.id}, Code: ${matchingSet.code || 'none'})`);
                } else {
                    console.log("❌ No name match found");
                    
                    // Show all potential matches for manual inspection
                    console.log("\nAll sets that might match sv9 or JTG:");
                    const potentialMatches = response.data.filter(set => 
                        (set.code && set.code.toLowerCase().includes("j")) ||
                        set.name.toLowerCase().includes("journey") ||
                        set.name.toLowerCase().includes("together") ||
                        (set.id && set.id.toString().includes("9"))
                    );
                    
                    potentialMatches.forEach(set => {
                        console.log(`- ${set.name} (ID: ${set.id}, Code: ${set.code || 'none'})`);
                    });
                }
            }
            
            // Return all sets for further processing
            return {
                allSets: response.data,
                matchingSet: matchingSet
            };
        }
        
        console.warn('❌ Unexpected response format for sets');
        return { allSets: [], matchingSet: null };
    } catch (error) {
        console.error(`❌ Error getting sets: ${error.message}`);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return { allSets: [], matchingSet: null };
    }
}

/**
 * Get cards in a set from PokeData API
 */
async function getCardsInSet(setId) {
    try {
        console.log(`\nGetting cards for set ID: ${setId}...`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/set`, {
            params: {
                set_id: setId
            },
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (Array.isArray(response.data)) {
            console.log(`✅ Retrieved ${response.data.length} cards for set ID ${setId}`);
            
            // Find card matching our number
            console.log(`Looking for card matching number: ${CARD_DATA.cardNumber}`);
            
            // Try exact match first
            let matchingCard = response.data.find(card => 
                card.num === CARD_DATA.cardNumber
            );
            
            if (matchingCard) {
                console.log(`✅ Found exact match: ${matchingCard.name} (ID: ${matchingCard.id}, Number: ${matchingCard.num})`);
            } else {
                console.log("❌ No exact number match found");
                
                // Try with leading zeros removed
                if (CARD_DATA.cardNumber.startsWith('0')) {
                    const trimmedNumber = CARD_DATA.cardNumber.replace(/^0+/, '');
                    console.log(`Trying with trimmed number: ${trimmedNumber}`);
                    
                    matchingCard = response.data.find(card => 
                        card.num === trimmedNumber
                    );
                    
                    if (matchingCard) {
                        console.log(`✅ Found match with trimmed number: ${matchingCard.name} (ID: ${matchingCard.id}, Number: ${matchingCard.num})`);
                    } else {
                        console.log("❌ No trimmed number match found");
                    }
                }
                
                // If still no match, show some sample cards for debugging
                if (!matchingCard) {
                    console.log("\nSample card numbers from this set:");
                    response.data.slice(0, 10).forEach(card => {
                        console.log(`- ${card.name} (Number: ${card.num}, ID: ${card.id})`);
                    });
                }
            }
            
            return {
                allCards: response.data,
                matchingCard: matchingCard
            };
        }
        
        console.warn('❌ Unexpected response format for cards');
        return { allCards: [], matchingCard: null };
    } catch (error) {
        console.error(`❌ Error getting cards for set ID ${setId}: ${error.message}`);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return { allCards: [], matchingCard: null };
    }
}

/**
 * Get pricing data for a card
 */
async function getCardPricing(cardId) {
    try {
        console.log(`\nGetting pricing for card ID: ${cardId}...`);
        
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
            console.log(`✅ Retrieved pricing data for card ID: ${cardId}`);
            
            // Count pricing data points
            const pricingKeys = Object.keys(response.data.pricing);
            console.log(`Found ${pricingKeys.length} price points`);
            
            // Display sample pricing data
            if (pricingKeys.length > 0) {
                console.log("\nSample pricing data:");
                pricingKeys.slice(0, 5).forEach(key => {
                    console.log(`- ${key}: $${response.data.pricing[key].value}`);
                });
                
                // Map to enhanced pricing format
                const enhancedPricing = mapApiPricingToEnhancedPriceData(response.data);
                
                if (enhancedPricing && Object.keys(enhancedPricing).length > 0) {
                    console.log("\n✅ Successfully mapped to enhanced pricing format:");
                    console.log(JSON.stringify(enhancedPricing, null, 2));
                } else {
                    console.log("\n❌ Failed to map pricing data to enhanced format");
                }
            } else {
                console.log("❌ No pricing data points found");
            }
            
            return response.data;
        }
        
        console.warn('❌ No pricing data found or unexpected format');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return null;
    } catch (error) {
        console.error(`❌ Error getting pricing for card ID ${cardId}: ${error.message}`);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Map PokeData API pricing data to our enhanced pricing format
 */
function mapApiPricingToEnhancedPriceData(apiPricing) {
    if (!apiPricing || !apiPricing.pricing) return null;
    
    console.log(`Mapping API pricing data for ${apiPricing.name || 'unknown card'}`);
    
    const enhancedPricing = {};
    
    // Initialize with empty objects for PSA and CGC grades
    const psaGrades = {};
    const cgcGradesObj = {};
    
    // Process PSA grades
    for (let i = 1; i <= 10; i++) {
        const grade = i === 10 ? '10.0' : `${i}.0`;
        const key = `PSA ${grade}`;
        
        if (apiPricing.pricing[key] && apiPricing.pricing[key].value > 0) {
            const gradeKey = String(i); // Store as "1", "2", etc.
            psaGrades[gradeKey] = { 
                value: apiPricing.pricing[key].value
            };
        }
    }
    
    // Process CGC grades (including half grades)
    const cgcGradeValues = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'];
    
    cgcGradeValues.forEach(grade => {
        const key = `CGC ${grade}`;
        
        if (apiPricing.pricing[key] && apiPricing.pricing[key].value > 0) {
            // Convert "8.5" to "8_5" for storage
            const gradeKey = grade.replace('.', '_');
            cgcGradesObj[gradeKey] = { 
                value: apiPricing.pricing[key].value
            };
        }
    });
    
    // Process eBay Raw pricing
    if (apiPricing.pricing['eBay Raw'] && apiPricing.pricing['eBay Raw'].value > 0) {
        enhancedPricing.ebayRaw = { 
            value: apiPricing.pricing['eBay Raw'].value
        };
    }
    
    // Only add grade objects if they have data
    if (Object.keys(psaGrades).length > 0) {
        enhancedPricing.psaGrades = psaGrades;
    }
    
    if (Object.keys(cgcGradesObj).length > 0) {
        enhancedPricing.cgcGrades = cgcGradesObj;
    }
    
    return Object.keys(enhancedPricing).length > 0 ? enhancedPricing : null;
}

/**
 * Run the complete test workflow
 */
async function runTest() {
    console.log('=============================================================');
    console.log('     Testing PokeData API Integration Directly');
    console.log('=============================================================');
    console.log(`Testing with card: ${CARD_DATA.cardName} (${CARD_DATA.id})`);
    
    try {
        // Step 1: Get all sets and find matching set
        const { allSets, matchingSet } = await getAllSets();
        await delay(500); // Delay to avoid rate limiting
        
        if (!matchingSet) {
            console.error('\n❌ TEST FAILED: Could not find matching set in PokeData API');
            return;
        }
        
        // Step 2: Get cards in the set and find matching card
        const { allCards, matchingCard } = await getCardsInSet(matchingSet.id);
        await delay(500); // Delay to avoid rate limiting
        
        if (!matchingCard) {
            console.error('\n❌ TEST FAILED: Could not find matching card in PokeData API');
            return;
        }
        
        // Step 3: Get pricing data for the card
        const pricingData = await getCardPricing(matchingCard.id);
        
        if (!pricingData) {
            console.error('\n❌ TEST FAILED: Could not retrieve pricing data');
            return;
        }
        
        console.log('\n=============================================================');
        console.log('                      Test Results');
        console.log('=============================================================');
        console.log('✅ SUCCESS: Complete workflow tested successfully');
        console.log(`\nMatching Set: ${matchingSet.name} (ID: ${matchingSet.id})`);
        console.log(`Matching Card: ${matchingCard.name} (ID: ${matchingCard.id})`);
        console.log(`Pricing Data: ${Object.keys(pricingData.pricing).length} price points found`);
        
        // Attach the results to our card
        const enhancedCard = { ...CARD_DATA };
        enhancedCard.pokeDataId = matchingCard.id;
        enhancedCard.pokeDataSetId = matchingSet.id;
        enhancedCard.enhancedPricing = mapApiPricingToEnhancedPriceData(pricingData);
        
        console.log('\nEnhanced Card Data:');
        console.log(JSON.stringify(enhancedCard, null, 2));
        
    } catch (error) {
        console.error('\n❌ Unhandled error during test:', error.message);
    }
}

// Run the test
runTest().catch(err => {
    console.error('Fatal error:', err);
});
