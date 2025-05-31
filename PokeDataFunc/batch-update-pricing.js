/**
 * Batch Update Script for Card Pricing Data
 * 
 * This script updates all cards in the CosmosDB database to ensure they have:
 * 1. PokeData API ID assigned (if available)
 * 2. Enhanced pricing data (PSA, CGC, eBay Raw prices)
 * 
 * The script processes cards in batches to avoid overwhelming the database
 * or the PokeData API.
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

// PokeData API utility functions

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
 * Find a set ID by its code
 * @param {Array} sets - List of sets from PokeData API
 * @param {string} setCode - Set code to find
 * @returns {number|null} Set ID or null if not found
 */
function findSetIdByCode(sets, setCode) {
    if (!setCode) return null;
    
    // Normalize set code for comparison
    const normalizedCode = setCode.toLowerCase();
    
    // Try exact match first
    let matchingSet = sets.find(set => 
        set.code && set.code.toLowerCase() === normalizedCode
    );
    
    // If no exact match, try some common mappings
    if (!matchingSet) {
        // Handle special cases
        if (normalizedCode === 'pre' || normalizedCode === 'sv8pt5') {
            matchingSet = sets.find(set => 
                set.name.includes('Prismatic') || set.name.includes('Evolutions')
            );
        } 
        else if (normalizedCode === 'sv8') {
            matchingSet = sets.find(set => 
                set.name.includes('Paradox') || set.name.includes('Rift')
            );
        }
        else if (normalizedCode === 'obf') {
            matchingSet = sets.find(set => 
                set.name.includes('Obsidian') || set.name.includes('Flames')
            );
        }
        // Add more mappings as needed
    }
    
    return matchingSet ? matchingSet.id : null;
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
 * Helper function to delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all cards from the database
 * @returns {Promise<Array>} List of cards
 */
async function getAllCards() {
    try {
        console.log('Fetching all cards from database...');
        
        const querySpec = {
            query: "SELECT * FROM c"
        };
        
        const { resources: cards } = await cardContainer.items
            .query(querySpec)
            .fetchAll();
        
        console.log(`Retrieved ${cards.length} cards from database`);
        return cards;
    } catch (error) {
        console.error(`Error fetching cards from database: ${error.message}`);
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
 * Process a batch of cards
 * @param {Array} cards - Batch of cards to process
 * @param {Array} allSets - All sets from PokeData API
 * @param {Object} setCardsCache - Cache of cards by set ID
 * @returns {Promise<Object>} Processing statistics
 */
async function processBatch(cards, allSets, setCardsCache) {
    const stats = {
        processed: 0,
        updatedPokeDataId: 0,
        updatedPricing: 0,
        skipped: 0,
        failed: 0
    };
    
    // Process each card in the batch
    for (const card of cards) {
        try {
            console.log(`\nProcessing card: ${card.id} (${card.cardName || card.name || 'Unknown'}) from set ${card.setCode}`);
            
            let cardUpdated = false;
            
            // Check if card needs PokeData ID
            if (!card.pokeDataId) {
                console.log(`Card ${card.id} missing PokeData ID, attempting to find it`);
                
                // Find set ID
                const setId = findSetIdByCode(allSets, card.setCode);
                
                if (setId) {
                    console.log(`Found set ID: ${setId} for set code: ${card.setCode}`);
                    
                    // Get cards in set (from cache if available)
                    let setCards;
                    if (setCardsCache[setId]) {
                        setCards = setCardsCache[setId];
                    } else {
                        setCards = await getCardsInSet(setId);
                        setCardsCache[setId] = setCards; // Update cache
                        await delay(DELAY_BETWEEN_API_CALLS); // Delay after API call
                    }
                    
                    // Find card's PokeData ID
                    const cardNumber = card.cardNumber || card.num;
                    if (cardNumber) {
                        const pokeDataId = await findCardPokeDataId(setId, cardNumber, setCards);
                        
                        if (pokeDataId) {
                            console.log(`Found PokeData ID: ${pokeDataId} for card ${card.id}`);
                            card.pokeDataId = pokeDataId;
                            cardUpdated = true;
                            stats.updatedPokeDataId++;
                            
                            // Now that we have the PokeData ID, fetch pricing data
                            const pricingData = await getCardPricingById(pokeDataId);
                            await delay(DELAY_BETWEEN_API_CALLS); // Delay after API call
                            
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
                            console.log(`Could not find PokeData ID for card ${card.id}`);
                        }
                    }
                } else {
                    console.log(`Could not find set ID for set code: ${card.setCode}`);
                }
            }
            // Check if card has PokeData ID but needs enhanced pricing
            else if (card.pokeDataId && (!card.enhancedPricing || Object.keys(card.enhancedPricing || {}).length === 0)) {
                console.log(`Card ${card.id} has PokeData ID ${card.pokeDataId} but is missing enhanced pricing data`);
                
                // Get pricing data
                const pricingData = await getCardPricingById(card.pokeDataId);
                await delay(DELAY_BETWEEN_API_CALLS); // Delay after API call
                
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
    
    return stats;
}

/**
 * Main function to run the batch update process
 */
async function runBatchUpdate() {
    console.log('=============================================================');
    console.log('     Batch Update of Card PokeData IDs and Enhanced Pricing');
    console.log('=============================================================');
    
    try {
        // Get all sets from PokeData API
        const allSets = await getAllSets();
        if (allSets.length === 0) {
            console.error('Failed to retrieve sets from PokeData API, aborting');
            return;
        }
        
        // Get all cards from the database
        const allCards = await getAllCards();
        if (allCards.length === 0) {
            console.log('No cards found in the database, nothing to update');
            return;
        }
        
        console.log(`Starting batch update of ${allCards.length} cards...`);
        
        // Create a cache for set cards to avoid duplicate API calls
        const setCardsCache = {};
        
        // Initialize overall statistics
        const overallStats = {
            processed: 0,
            updatedPokeDataId: 0,
            updatedPricing: 0,
            skipped: 0,
            failed: 0
        };
        
        // Process cards in batches
        for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
            const batch = allCards.slice(i, i + BATCH_SIZE);
            console.log(`\n=== Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(allCards.length / BATCH_SIZE)} (${batch.length} cards) ===`);
            
            const batchStats = await processBatch(batch, allSets, setCardsCache);
            
            // Update overall statistics
            overallStats.processed += batchStats.processed;
            overallStats.updatedPokeDataId += batchStats.updatedPokeDataId;
            overallStats.updatedPricing += batchStats.updatedPricing;
            overallStats.skipped += batchStats.skipped;
            overallStats.failed += batchStats.failed;
            
            // Display batch statistics
            console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1} results:`);
            console.log(`- Processed: ${batchStats.processed}`);
            console.log(`- Updated PokeData IDs: ${batchStats.updatedPokeDataId}`);
            console.log(`- Updated pricing data: ${batchStats.updatedPricing}`);
            console.log(`- Skipped (already had data): ${batchStats.skipped}`);
            console.log(`- Failed: ${batchStats.failed}`);
            
            // Display overall progress
            const progress = ((i + batch.length) / allCards.length) * 100;
            console.log(`\nOverall progress: ${progress.toFixed(2)}% (${i + batch.length}/${allCards.length} cards)`);
            
            // Delay between batches
            if (i + BATCH_SIZE < allCards.length) {
                console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`);
                await delay(DELAY_BETWEEN_BATCHES);
            }
        }
        
        // Display final statistics
        console.log('\n=============================================================');
        console.log('                     Batch Update Results');
        console.log('=============================================================');
        console.log(`Total cards processed: ${overallStats.processed}/${allCards.length}`);
        console.log(`Updated PokeData IDs: ${overallStats.updatedPokeDataId}`);
        console.log(`Updated pricing data: ${overallStats.updatedPricing}`);
        console.log(`Skipped (already had data): ${overallStats.skipped}`);
        console.log(`Failed: ${overallStats.failed}`);
        
        console.log('\n✅ Batch update completed successfully!');
    } catch (error) {
        console.error(`Unhandled error during batch update: ${error.message}`);
    }
}

// Run the batch update
runBatchUpdate().catch(error => {
    console.error('Fatal error during batch update:', error);
});
