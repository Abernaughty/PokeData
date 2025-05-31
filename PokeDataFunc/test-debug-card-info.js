/**
 * Debug script for diagnosing enhanced pricing data issues
 * This script tests each component of the GetCardInfo function separately
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
const CARD_ID = 'sv8pt5-161'; // Umbreon ex from Prismatic Evolutions
const POKEDATA_API_KEY = localSettings.Values.POKEDATA_API_KEY;
const POKEDATA_API_BASE_URL = localSettings.Values.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
const POKEMON_TCG_API_KEY = localSettings.Values.POKEMON_TCG_API_KEY;
const POKEMON_TCG_API_BASE_URL = localSettings.Values.POKEMON_TCG_API_BASE_URL || 'https://api.pokemontcg.io/v2';

// Helper function to extract card identifiers
function extractCardIdentifiers(cardId) {
    const match = cardId.match(/(.*)-(\d+.*)/);
    
    if (match) {
        return {
            setCode: match[1], // The set code (e.g., "sv8pt5")
            number: match[2]   // The card number (e.g., "155")
        };
    }
    
    // Fallback if the format doesn't match
    return {
        setCode: '',
        number: cardId
    };
}

// Step 1: Test direct card data retrieval from Pokemon TCG API
async function testPokemonTcgApiCard() {
    console.log('\n===== Step 1: Testing Pokemon TCG API Card Retrieval =====');
    
    try {
        console.log(`Making request to ${POKEMON_TCG_API_BASE_URL}/cards/${CARD_ID}`);
        
        const response = await axios.get(`${POKEMON_TCG_API_BASE_URL}/cards/${CARD_ID}`, {
            headers: {
                'X-Api-Key': POKEMON_TCG_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.data) {
            console.log('✅ Success! Retrieved card data from Pokemon TCG API');
            console.log('Card details:');
            console.log(`- Name: ${response.data.data.name}`);
            console.log(`- Set: ${response.data.data.set.name}`);
            console.log(`- Number: ${response.data.data.number}`);
            
            // Check for TCG Player pricing
            if (response.data.data.tcgplayer && response.data.data.tcgplayer.prices) {
                console.log('TCG Player pricing found:');
                const prices = response.data.data.tcgplayer.prices;
                Object.entries(prices).forEach(([variant, price]) => {
                    if (price) {
                        console.log(`- ${variant}: market=$${price.market}, low=$${price.low}, mid=$${price.mid}, high=$${price.high}`);
                    }
                });
            } else {
                console.log('No TCG Player pricing found');
            }
            
            return response.data.data;
        } else {
            console.log('❌ Failed to retrieve card from Pokemon TCG API or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting card from Pokemon TCG API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Step 2: Test PokeData API set list retrieval
async function testPokeDataApiSets() {
    console.log('\n===== Step 2: Testing PokeData API Set List Retrieval =====');
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/sets`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/sets`, {
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && Array.isArray(response.data)) {
            const sets = response.data;
            console.log(`✅ Success! Retrieved ${sets.length} sets from PokeData API`);
            
            // Look for set that matches our card
            const identifiers = extractCardIdentifiers(CARD_ID);
            console.log(`Looking for set matching code: ${identifiers.setCode}`);
            
            // Try exact match
            let matchingSet = sets.find(set => 
                set.code && set.code.toLowerCase() === identifiers.setCode.toLowerCase()
            );
            
            if (!matchingSet) {
                console.log(`No exact match for set code ${identifiers.setCode}, trying to find by name`);
                
                // Try finding by name for common sets
                if (identifiers.setCode === 'sv8pt5') {
                    matchingSet = sets.find(set => 
                        set.name.includes('Prismatic') || set.name.includes('Evolutions')
                    );
                }
            }
            
            if (matchingSet) {
                console.log(`Found matching set: ${matchingSet.name} (ID: ${matchingSet.id}, Code: ${matchingSet.code || 'null'})`);
                return matchingSet;
            } else {
                console.log(`❌ No matching set found for ${identifiers.setCode}`);
                return null;
            }
        } else {
            console.log('❌ Failed to retrieve sets from PokeData API or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting sets from PokeData API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Step 3: Test PokeData API card retrieval for a set
async function testPokeDataApiCards(setId) {
    console.log(`\n===== Step 3: Testing PokeData API Card Retrieval for Set ID ${setId} =====`);
    
    if (!setId) {
        console.log('❌ No set ID provided');
        return null;
    }
    
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
            const cards = response.data;
            console.log(`✅ Success! Retrieved ${cards.length} cards from PokeData API for set ID ${setId}`);
            
            // Look for card that matches our card number
            const identifiers = extractCardIdentifiers(CARD_ID);
            console.log(`Looking for card matching number: ${identifiers.number}`);
            
            const matchingCard = cards.find(card => 
                card.num && card.num === identifiers.number
            );
            
            if (matchingCard) {
                console.log(`Found matching card: ${matchingCard.name} (ID: ${matchingCard.id}, Number: ${matchingCard.num})`);
                return matchingCard;
            } else {
                console.log(`❌ No matching card found for number ${identifiers.number}`);
                return null;
            }
        } else {
            console.log('❌ Failed to retrieve cards from PokeData API or unexpected response format');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting cards from PokeData API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Step 4: Test PokeData API pricing retrieval for a card
async function testPokeDataApiPricing(cardId) {
    console.log(`\n===== Step 4: Testing PokeData API Pricing Retrieval for Card ID ${cardId} =====`);
    
    if (!cardId) {
        console.log('❌ No card ID provided');
        return null;
    }
    
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

// Step 5: Test fallback method (using card number directly)
async function testFallbackPricingMethod() {
    console.log(`\n===== Step 5: Testing Fallback Pricing Method =====`);
    
    const identifiers = extractCardIdentifiers(CARD_ID);
    console.log(`Using card number: ${identifiers.number}`);
    
    try {
        console.log(`Making request to ${POKEDATA_API_BASE_URL}/pricing?id=${identifiers.number}&asset_type=CARD`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/pricing`, {
            params: {
                id: identifiers.number,
                asset_type: 'CARD'
            },
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.pricing) {
            console.log(`✅ Success! Retrieved pricing data for card number: ${identifiers.number}`);
            
            // Display card info
            console.log(`\nCard Information:`);
            console.log(`- Name: ${response.data.name}`);
            console.log(`- Number: ${response.data.num}`);
            
            // Warning if the card is from a different set
            if (!response.data.name.toLowerCase().includes(identifiers.setCode.toLowerCase())) {
                console.warn(`⚠️ Warning: Card from different set than requested. Expected set code ${identifiers.setCode}, got data for ${response.data.name}`);
            }
            
            // Count pricing data
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

// Step 6: Test mapping of the pricing data to our format
async function testPricingDataMapping(apiPricing) {
    console.log(`\n===== Step 6: Testing Pricing Data Mapping =====`);
    
    if (!apiPricing || !apiPricing.pricing) {
        console.log('❌ No valid pricing data provided');
        return null;
    }
    
    try {
        console.log(`Mapping API pricing data for ${apiPricing.name}`);
        
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
        
        // Check if we have any enhanced pricing data
        if (Object.keys(enhancedPricing).length > 0) {
            console.log('✅ Success! Mapped pricing data to enhanced pricing format');
            console.log('\nEnhanced Pricing Data:');
            console.log(JSON.stringify(enhancedPricing, null, 2));
            return enhancedPricing;
        } else {
            console.log('❌ No enhanced pricing data after mapping (all values might be 0)');
            return null;
        }
    } catch (error) {
        console.error('❌ Error mapping pricing data:', error.message);
        return null;
    }
}

// Step 7: Local test of the card fetch and enhancement process
async function testLocalCardEnhancement() {
    console.log(`\n===== Step 7: Testing Local Card Enhancement Process =====`);
    
    try {
        // 1. Get card data from Pokemon TCG API
        const card = await testPokemonTcgApiCard();
        if (!card) {
            console.log('❌ Cannot proceed with local enhancement - card data not available');
            return null;
        }
        
        // 2. Convert card data to our format
        const transformedCard = {
            id: card.id,
            setCode: card.set.ptcgoCode || card.set.id.toUpperCase(),
            setId: card.set.id,
            setName: card.set.name,
            cardId: card.id,
            cardName: card.name,
            cardNumber: card.number,
            rarity: card.rarity,
            imageUrl: card.images.small,
            imageUrlHiRes: card.images.large,
            tcgPlayerPrice: null
        };
        
        // 3. Add TCG Player pricing if available
        if (card.tcgplayer && card.tcgplayer.prices && card.tcgplayer.prices.holofoil) {
            const prices = card.tcgplayer.prices.holofoil;
            transformedCard.tcgPlayerPrice = {
                market: prices.market || 0,
                low: prices.low || 0,
                mid: prices.mid || 0,
                high: prices.high || 0
            };
        }
        
        console.log('\nTransformed card data:');
        console.log(JSON.stringify(transformedCard, null, 2));
        
        // 4. Get enhanced pricing from PokeData API
        console.log('\nAttempting to get enhanced pricing from PokeData API...');
        
        // First try the proper workflow
        let enhancedPricing = null;
        
        // Step 4.1: Get set from PokeData API
        const pokeDataSet = await testPokeDataApiSets();
        
        if (pokeDataSet) {
            // Step 4.2: Get cards in the set
            const pokeDataCard = await testPokeDataApiCards(pokeDataSet.id);
            
            if (pokeDataCard) {
                // Step 4.3: Get pricing using the card's ID
                const pricingData = await testPokeDataApiPricing(pokeDataCard.id);
                
                if (pricingData) {
                    // Step 4.4: Map to enhanced pricing format
                    enhancedPricing = await testPricingDataMapping(pricingData);
                }
            }
        }
        
        // If the proper workflow didn't work, try the fallback method
        if (!enhancedPricing) {
            console.log('\nProper workflow failed. Trying fallback method...');
            const fallbackPricingData = await testFallbackPricingMethod();
            
            if (fallbackPricingData) {
                enhancedPricing = await testPricingDataMapping(fallbackPricingData);
            }
        }
        
        // 5. Add enhanced pricing to the card data
        if (enhancedPricing) {
            transformedCard.enhancedPricing = enhancedPricing;
            console.log('\n✅ Successfully added enhanced pricing to card data!');
        } else {
            console.log('\n❌ Failed to get enhanced pricing for the card');
        }
        
        // 6. Complete card data that would be returned by the function
        console.log('\nFinal card data:');
        console.log(JSON.stringify(transformedCard, null, 2));
        
        return transformedCard;
    } catch (error) {
        console.error('❌ Error in local card enhancement process:', error.message);
        return null;
    }
}

// Step 8: Test CosmosDB connection to see if it's saving enhancedPricing properly
async function testCosmosDBConnection() {
    console.log(`\n===== Step 8: Testing CosmosDB Connection =====`);
    
    console.log('Checking local.settings.json for CosmosDB connection string...');
    
    if (!localSettings.Values.COSMOSDB_CONNECTION_STRING) {
        console.log('❌ No CosmosDB connection string found in local.settings.json');
        return false;
    }
    
    console.log('✅ CosmosDB connection string found in local.settings.json');
    console.log('Note: To fully test CosmosDB, you need to check the Azure Function logs');
    
    return true;
}

// Run all the tests in sequence
async function runAllTests() {
    console.log('=============================================================');
    console.log('     Testing GetCardInfo Functionality - Step by Step');
    console.log('=============================================================');
    
    console.log(`Testing with Card ID: ${CARD_ID}`);
    
    // Run the individual steps
    await testPokemonTcgApiCard();
    await testPokeDataApiSets();
    // Further steps are run by testLocalCardEnhancement
    const enhancedCard = await testLocalCardEnhancement();
    await testCosmosDBConnection();
    
    // Results summary
    console.log('\n=============================================================');
    console.log('                     Test Results');
    console.log('=============================================================');
    
    if (enhancedCard && enhancedCard.enhancedPricing) {
        console.log('✅ LOCAL TESTS SUCCESSFUL: The card was enhanced with pricing data');
        console.log('\nThe issue is likely in how the Azure Function is processing the data:');
        console.log('1. Check if the enhanced pricing is being saved to CosmosDB correctly');
        console.log('2. Check if the cached data in CosmosDB has the enhancedPricing property');
        console.log('3. Verify that ENABLE_REDIS_CACHE is "false" so we bypass Redis cache');
        console.log('4. Check for any timeout issues when calling the PokeData API');
    } else {
        console.log('❌ LOCAL TESTS FAILED: Could not enhance the card with pricing data');
        console.log('\nThe issue is likely with the PokeData API integration:');
        console.log('1. Check if the API key is valid and has sufficient permissions');
        console.log('2. Verify that the API is accessible from the Azure Function');
        console.log('3. Check for any timeout issues when calling the API');
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('Fatal error during test execution:', error);
});
