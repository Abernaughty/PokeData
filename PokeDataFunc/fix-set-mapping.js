/**
 * Set Mapping Fix Script
 * 
 * This script adds specialized mapping for problematic sets that weren't
 * properly matched by the batch update script. It:
 * 
 * 1. Creates a more comprehensive set code mapping
 * 2. Queries cards by setId from the problematic sets
 * 3. Updates them with PokeData IDs and enhanced pricing
 */

const { CosmosClient } = require('@azure/cosmos');
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
const CONNECTION_STRING = localSettings.Values.COSMOSDB_CONNECTION_STRING;
const DATABASE_NAME = 'PokemonCards';
const CARDS_CONTAINER_NAME = 'Cards';
const POKEDATA_API_KEY = localSettings.Values.POKEDATA_API_KEY;
const POKEDATA_API_BASE_URL = localSettings.Values.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';

// Batch processing settings
const BATCH_SIZE = 10; // Process 10 cards at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches to avoid rate limiting
const DELAY_BETWEEN_API_CALLS = 500; // 0.5 seconds between API calls

// Initialize CosmosDB client
const client = new CosmosClient(CONNECTION_STRING);
const database = client.database(DATABASE_NAME);
const cardContainer = database.container(CARDS_CONTAINER_NAME);

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Problematic set IDs from user feedback
const PROBLEMATIC_SET_IDS = [
    'base1',    // Base Set
    'sv3pt5',   // Paldea Evolved
    'sv6',      // Temporal Forces
    'sv6pt5',   // 151
    'sv7',      // Obsidian Flames
    'sv8',      // Paradox Rift
    'sv8pt5',   // Prismatic Evolutions
    'sv9',      // Battle Partners
    'sve'       // Special Expansion
];

// Custom set mapping based on research
const CUSTOM_SET_MAPPING = {
    'base1': {
        pokeDataName: 'Base Set',
        pokeDataCodeHints: ['base']
    },
    'sv3pt5': {
        pokeDataName: 'Paldea Evolved',
        pokeDataCodeHints: ['pal', 'sv3.5']
    },
    'sv6': {
        pokeDataName: 'Temporal Forces',
        pokeDataCodeHints: ['tef', 'sv6']
    },
    'sv6pt5': {
        pokeDataName: '151',
        pokeDataCodeHints: ['151', 'sv6.5']
    },
    'sv7': {
        pokeDataName: 'Obsidian Flames',
        pokeDataCodeHints: ['obf', 'sv7']
    },
    'sv8': {
        pokeDataName: 'Paradox Rift',
        pokeDataCodeHints: ['par', 'sv8']
    },
    'sv8pt5': {
        pokeDataName: 'Prismatic Evolutions',
        pokeDataCodeHints: ['pre', 'sv8.5']
    },
    'sv9': {
        pokeDataName: 'Battle Partners',
        pokeDataCodeHints: ['bap', 'sv9']
    },
    'sve': {
        pokeDataName: 'Scarlet & Violet Special Expansion',
        pokeDataCodeHints: ['sve']
    }
};

/**
 * Get all sets from PokeData API
 * @returns {Promise<Array>} List of sets
 */
async function getAllSets() {
    try {
        console.log(`Getting all sets from PokeData API...`);
        
        const response = await axios.get(`${POKEDATA_API_BASE_URL}/sets`, {
            headers: {
                'Authorization': `Bearer ${POKEDATA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (Array.isArray(response.data)) {
            console.log(`Retrieved ${response.data.length} sets from PokeData API`);
            return response.data;
        }
        
        console.warn('Unexpected response format for sets');
        return [];
    } catch (error) {
        console.error(`Error getting sets: ${error.message}`);
        return [];
    }
}

/**
 * Find set ID in PokeData API using advanced matching techniques
 * @param {Array} pokeDataSets - All sets from PokeData API
 * @param {string} ourSetId - Our internal set ID
 * @returns {Object|null} Matching set or null if not found
 */
function findPokeDataSet(pokeDataSets, ourSetId) {
    // Check if we have custom mapping for this set
    const customMapping = CUSTOM_SET_MAPPING[ourSetId];
    
    if (!customMapping) {
        console.log(`No custom mapping for set ${ourSetId}`);
        return null;
    }
    
    console.log(`Using custom mapping for ${ourSetId}: ${customMapping.pokeDataName}`);
    
    // Try to find by name
    let matchingSet = pokeDataSets.find(set => 
        set.name && set.name.toLowerCase().includes(customMapping.pokeDataName.toLowerCase())
    );
    
    // If not found by name, try code hints
    if (!matchingSet && customMapping.pokeDataCodeHints && customMapping.pokeDataCodeHints.length > 0) {
        for (const codeHint of customMapping.pokeDataCodeHints) {
            matchingSet = pokeDataSets.find(set => 
                set.code && set.code.toLowerCase() === codeHint.toLowerCase()
            );
            
            if (matchingSet) {
                console.log(`Found match using code hint ${codeHint}`);
                break;
            }
        }
    }
    
    return matchingSet;
}

/**
 * Get cards in a set from PokeData API
 * @param {number} setId - Set ID
 * @returns {Promise<Array>} List of cards
 */
async function getCardsInSet(setId) {
    try {
        console.log(`Getting cards for set ID: ${setId}...`);
        
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
            console.log(`Retrieved ${response.data.length} cards for set ID ${setId}`);
            return response.data;
        }
        
        console.warn('Unexpected response format for cards');
        return [];
    } catch (error) {
        console.error(`Error getting cards for set ID ${setId}: ${error.message}`);
        return [];
    }
}

/**
 * Find a card's PokeData ID using set ID and card number
 * @param {number} setId - Set ID in PokeData API
 * @param {string} cardNumber - Card number
 * @param {Array} setCards - Optional pre-loaded cards in the set
 * @returns {Promise<number|null>} Card ID or null if not found
 */
async function findCardPokeDataId(setId, cardNumber, setCards = null) {
    try {
        // Get cards in the set if not provided
        const cards = setCards || await getCardsInSet(setId);
        
        if (!cards || cards.length === 0) {
            return null;
        }
        
        // Try exact match first
        let matchingCard = cards.find(card => 
            card.num === cardNumber
        );
        
        // If no exact match, try with leading zeros removed
        if (!matchingCard && cardNumber.startsWith('0')) {
            const trimmedNumber = cardNumber.replace(/^0+/, '');
            matchingCard = cards.find(card => 
                card.num === trimmedNumber
            );
            
            if (matchingCard) {
                console.log(`Found match with trimmed number ${trimmedNumber} (original: ${cardNumber})`);
            }
        }
        
        // If still no match, try partial number matching (for special cards)
        if (!matchingCard) {
            // Try extracting the numeric part for comparison
            const numericPart = cardNumber.match(/\d+/);
            if (numericPart) {
                const baseNumber = numericPart[0];
                console.log(`Trying partial match with base number ${baseNumber}`);
                
                matchingCard = cards.find(card => 
                    card.num && card.num.includes(baseNumber)
                );
                
                if (matchingCard) {
                    console.log(`Found match with partial number ${baseNumber} (original: ${cardNumber}, matched with: ${matchingCard.num})`);
                }
            }
        }
        
        return matchingCard ? matchingCard.id : null;
    } catch (error) {
        console.error(`Error finding card PokeData ID: ${error.message}`);
        return null;
    }
}

/**
 * Get pricing data for a card using its PokeData ID
 * @param {number} cardId - Card ID in PokeData API
 * @returns {Promise<Object|null>} Pricing data or null if not found
 */
async function getCardPricingById(cardId) {
    try {
        console.log(`Getting pricing for card ID: ${cardId}...`);
        
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
            console.log(`Retrieved pricing data for card ID: ${cardId}`);
            return response.data.pricing;
        }
        
        console.warn(`No pricing data found for card ID: ${cardId}`);
        return null;
    } catch (error) {
        console.error(`Error getting pricing for card ID ${cardId}: ${error.message}`);
        return null;
    }
}

/**
 * Map PokeData API pricing data to our enhanced pricing format
 * @param {Object} apiPricing - Pricing data from PokeData API
 * @returns {Object|null} Enhanced pricing data in our format or null if no data
 */
function mapApiPricingToEnhancedPriceData(apiPricing) {
    if (!apiPricing || !apiPricing.pricing) return null;
    
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
 * Get cards from database by set ID
 * @param {string} setId - Set ID
 * @returns {Promise<Array>} Cards in the set
 */
async function getCardsFromDatabaseBySetId(setId) {
    try {
        console.log(`Fetching cards for set ${setId} from database...`);
        
        const querySpec = {
            query: "SELECT * FROM c WHERE c.setId = @setId",
            parameters: [
                {
                    name: "@setId",
                    value: setId
                }
            ]
        };
        
        const { resources: cards } = await cardContainer.items
            .query(querySpec)
            .fetchAll();
        
        console.log(`Retrieved ${cards.length} cards for set ${setId} from database`);
        return cards;
    } catch (error) {
        console.error(`Error fetching cards for set ${setId} from database: ${error.message}`);
        return [];
    }
}

/**
 * Update a card in the database
 * @param {Object} card - Card to update
 * @returns {Promise<boolean>} Success status
 */
async function updateCard(card) {
    try {
        await cardContainer.items.upsert(card);
        return true;
    } catch (error) {
        console.error(`Error updating card ${card.id}: ${error.message}`);
        return false;
    }
}

/**
 * Process cards for a specific set
 * @param {string} ourSetId - Our internal set ID
 * @param {Array} pokeDataSets - All sets from PokeData API
 * @returns {Promise<Object>} Processing statistics
 */
async function processSetCards(ourSetId, pokeDataSets) {
    // Initialize statistics
    const stats = {
        processed: 0,
        updatedPokeDataId: 0,
        updatedPricing: 0,
        skipped: 0,
        failed: 0
    };
    
    // Find the matching PokeData set
    const pokeDataSet = findPokeDataSet(pokeDataSets, ourSetId);
    
    if (!pokeDataSet) {
        console.error(`Could not find matching PokeData set for ${ourSetId}`);
        return stats;
    }
    
    console.log(`Matched ${ourSetId} to PokeData set: ${pokeDataSet.name} (ID: ${pokeDataSet.id}, Code: ${pokeDataSet.code || 'none'})`);
    
    // Get cards in the set from PokeData API
    const pokeDataCards = await getCardsInSet(pokeDataSet.id);
    await delay(DELAY_BETWEEN_API_CALLS);
    
    if (pokeDataCards.length === 0) {
        console.error(`No cards found in PokeData API for set ${pokeDataSet.id}`);
        return stats;
    }
    
    // Get cards from our database
    const ourCards = await getCardsFromDatabaseBySetId(ourSetId);
    
    if (ourCards.length === 0) {
        console.log(`No cards found in database for set ${ourSetId}`);
        return stats;
    }
    
    console.log(`Processing ${ourCards.length} cards from set ${ourSetId}...`);
    
    // Process cards in batches
    for (let i = 0; i < ourCards.length; i += BATCH_SIZE) {
        const batch = ourCards.slice(i, i + BATCH_SIZE);
        console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(ourCards.length / BATCH_SIZE)} (${batch.length} cards)`);
        
        for (const card of batch) {
            try {
                console.log(`\nProcessing card: ${card.id} (${card.cardName || card.name || 'Unknown'}), Number: ${card.cardNumber || card.num || 'Unknown'}`);
                
                let cardUpdated = false;
                
                // Check if card needs PokeData ID
                if (!card.pokeDataId) {
                    console.log(`Card ${card.id} missing PokeData ID, attempting to find it`);
                    
                    const cardNumber = card.cardNumber || card.num;
                    if (cardNumber) {
                        const pokeDataId = await findCardPokeDataId(pokeDataSet.id, cardNumber, pokeDataCards);
                        
                        if (pokeDataId) {
                            console.log(`Found PokeData ID: ${pokeDataId} for card ${card.id}`);
                            card.pokeDataId = pokeDataId;
                            cardUpdated = true;
                            stats.updatedPokeDataId++;
                            
                            // Now that we have the PokeData ID, fetch pricing data
                            const pricingData = await getCardPricingById(pokeDataId);
                            await delay(DELAY_BETWEEN_API_CALLS);
                            
                            if (pricingData) {
                                card.pricing = pricingData;
                                card.pricingLastUpdated = new Date().toISOString();
                                
                                // Convert to enhanced pricing format
                                const enhancedPricing = mapApiPricingToEnhancedPriceData({ pricing: pricingData });
                                if (enhancedPricing) {
                                    card.enhancedPricing = enhancedPricing;
                                    stats.updatedPricing++;
                                    console.log(`Added enhanced pricing data to card ${card.id}`);
                                }
                            }
                        } else {
                            console.log(`Could not find PokeData ID for card ${card.id} (Number: ${cardNumber})`);
                        }
                    } else {
                        console.log(`Card ${card.id} has no number, cannot find PokeData ID`);
                    }
                }
                // Check if card has PokeData ID but needs enhanced pricing
                else if (card.pokeDataId && (!card.enhancedPricing || Object.keys(card.enhancedPricing || {}).length === 0)) {
                    console.log(`Card ${card.id} has PokeData ID ${card.pokeDataId} but is missing enhanced pricing data`);
                    
                    // Get pricing data
                    const pricingData = await getCardPricingById(card.pokeDataId);
                    await delay(DELAY_BETWEEN_API_CALLS);
                    
                    if (pricingData) {
                        card.pricing = pricingData;
                        card.pricingLastUpdated = new Date().toISOString();
                        
                        // Convert to enhanced pricing format
                        const enhancedPricing = mapApiPricingToEnhancedPriceData({ pricing: pricingData });
                        if (enhancedPricing) {
                            card.enhancedPricing = enhancedPricing;
                            cardUpdated = true;
                            stats.updatedPricing++;
                            console.log(`Added enhanced pricing data to card ${card.id}`);
                        }
                    } else {
                        console.log(`Could not fetch pricing data for PokeData ID: ${card.pokeDataId}`);
                    }
                } else {
                    console.log(`Card ${card.id} already has PokeData ID and enhanced pricing data, skipping`);
                    stats.skipped++;
                }
                
                // Update the card in the database if changes were made
                if (cardUpdated) {
                    const updateSuccess = await updateCard(card);
                    if (!updateSuccess) {
                        stats.failed++;
                        console.error(`Failed to update card ${card.id} in database`);
                    }
                }
                
                stats.processed++;
            } catch (error) {
                console.error(`Error processing card ${card.id}: ${error.message}`);
                stats.failed++;
            }
        }
        
        // Delay between batches
        if (i + BATCH_SIZE < ourCards.length) {
            console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`);
            await delay(DELAY_BETWEEN_BATCHES);
        }
    }
    
    return stats;
}

/**
 * Main function to run the set mapping fix process
 */
async function runSetMappingFix() {
    console.log('=============================================================');
    console.log('      Set Mapping Fix for Problematic Sets');
    console.log('=============================================================');
    
    try {
        // Get all sets from PokeData API
        const allSets = await getAllSets();
        if (allSets.length === 0) {
            console.error('Failed to retrieve sets from PokeData API, aborting');
            return;
        }
        
        // Display all PokeData sets for reference
        console.log('\nAll sets from PokeData API:');
        allSets.forEach(set => {
            console.log(`- ${set.name} (ID: ${set.id}, Code: ${set.code || 'none'})`);
        });
        
        // Initialize overall statistics
        const overallStats = {
            sets: {
                processed: 0,
                successful: 0,
                failed: 0
            },
            cards: {
                processed: 0,
                updatedPokeDataId: 0,
                updatedPricing: 0,
                skipped: 0,
                failed: 0
            }
        };
        
        // Process each problematic set
        for (const setId of PROBLEMATIC_SET_IDS) {
            console.log(`\n=============================================================`);
            console.log(`Processing set: ${setId}`);
            console.log(`=============================================================`);
            
            try {
                const setStats = await processSetCards(setId, allSets);
                
                // Update overall statistics
                overallStats.sets.processed++;
                overallStats.cards.processed += setStats.processed;
                overallStats.cards.updatedPokeDataId += setStats.updatedPokeDataId;
                overallStats.cards.updatedPricing += setStats.updatedPricing;
                overallStats.cards.skipped += setStats.skipped;
                overallStats.cards.failed += setStats.failed;
                
                if (setStats.processed > 0 && setStats.failed < setStats.processed) {
                    overallStats.sets.successful++;
                } else {
                    overallStats.sets.failed++;
                }
                
                // Display set statistics
                console.log(`\nSet ${setId} results:`);
                console.log(`- Processed: ${setStats.processed} cards`);
                console.log(`- Updated PokeData IDs: ${setStats.updatedPokeDataId}`);
                console.log(`- Updated pricing data: ${setStats.updatedPricing}`);
                console.log(`- Skipped (already had data): ${setStats.skipped}`);
                console.log(`- Failed: ${setStats.failed}`);
                
                // Delay between sets
                if (PROBLEMATIC_SET_IDS.indexOf(setId) < PROBLEMATIC_SET_IDS.length - 1) {
                    console.log(`\nWaiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next set...\n`);
                    await delay(DELAY_BETWEEN_BATCHES);
                }
            } catch (error) {
                console.error(`Error processing set ${setId}: ${error.message}`);
                overallStats.sets.processed++;
                overallStats.sets.failed++;
            }
        }
        
        // Display final statistics
        console.log('\n=============================================================');
        console.log('                 Set Mapping Fix Results');
        console.log('=============================================================');
        console.log(`Sets processed: ${overallStats.sets.processed}/${PROBLEMATIC_SET_IDS.length}`);
        console.log(`Sets successfully updated: ${overallStats.sets.successful}`);
        console.log(`Sets failed: ${overallStats.sets.failed}`);
        console.log('\nCard statistics:');
        console.log(`- Total processed: ${overallStats.cards.processed}`);
        console.log(`- Updated PokeData IDs: ${overallStats.cards.updatedPokeDataId}`);
        console.log(`- Updated pricing data: ${overallStats.cards.updatedPricing}`);
        console.log(`- Skipped (already had data): ${overallStats.cards.skipped}`);
        console.log(`- Failed: ${overallStats.cards.failed}`);
        
        console.log('\n✅ Set mapping fix completed!');
    } catch (error) {
        console.error(`Unhandled error during set mapping fix: ${error.message}`);
    }
}

// Run the set mapping fix
runSetMappingFix().catch(error => {
    console.error('Fatal error during set mapping fix:', error);
});
