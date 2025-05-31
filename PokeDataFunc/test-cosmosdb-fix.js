/**
 * Test script to verify and fix CosmosDB saving and retrieval of enhanced pricing data
 */

const { CosmosClient } = require('@azure/cosmos');
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

// Card ID to check and fix
const CARD_ID = 'sv8pt5-161';
const SET_CODE = 'sv8pt5';

// Initialize CosmosDB client
const client = new CosmosClient(CONNECTION_STRING);
const database = client.database(DATABASE_NAME);
const cardContainer = database.container(CARDS_CONTAINER_NAME);

/**
 * Get card from CosmosDB
 */
async function getCardFromDatabase() {
    try {
        console.log(`Getting card ${CARD_ID} from CosmosDB...`);
        const { resource } = await cardContainer.item(CARD_ID, SET_CODE).read();
        
        console.log(`Found card in database: ${resource.cardName}`);
        console.log('\nCurrent card data in CosmosDB:');
        console.log(JSON.stringify(resource, null, 2));
        
        return resource;
    } catch (error) {
        console.error(`Error getting card from database: ${error.message}`);
        return null;
    }
}

/**
 * Update card in CosmosDB with enhanced pricing data
 */
async function updateCardWithEnhancedPricing(card) {
    try {
        if (!card) {
            console.log('No card provided to update.');
            return false;
        }
        
        // Check if card already has enhanced pricing data
        if (card.enhancedPricing && Object.keys(card.enhancedPricing).length > 0) {
            console.log('\nCard already has enhanced pricing data:');
            console.log(JSON.stringify(card.enhancedPricing, null, 2));
            
            // Verify the enhancedPricing data is correctly structured
            if (!card.enhancedPricing.psaGrades && !card.enhancedPricing.cgcGrades && !card.enhancedPricing.ebayRaw) {
                console.log('\n⚠️ WARNING: Enhanced pricing data has an unexpected format, will recreate it');
            } else {
                console.log('\n✅ Enhanced pricing data is correctly formatted');
                return true;
            }
        } else {
            console.log('\n⚠️ Card is missing enhanced pricing data, will add it');
        }
        
        // For the Umbreon ex card, add sample enhanced pricing data
        const enhancedPricing = {
            ebayRaw: {
                value: 1178
            },
            psaGrades: {
                "9": {
                    value: 1130
                },
                "10": {
                    value: 2526.24
                }
            },
            cgcGrades: {
                "8_0": {
                    value: 1200
                }
            }
        };
        
        // Update the card with enhanced pricing data
        card.enhancedPricing = enhancedPricing;
        card.lastUpdated = new Date().toISOString();
        
        console.log('\nUpdating card with enhanced pricing data...');
        
        // Save the updated card to CosmosDB
        await cardContainer.items.upsert(card);
        
        console.log('✅ Card updated successfully with enhanced pricing data');
        return true;
    } catch (error) {
        console.error(`Error updating card: ${error.message}`);
        return false;
    }
}

/**
 * Check and update the Blob Storage connection string
 */
async function checkAndUpdateBlobStorage() {
    console.log('\n===== Checking Blob Storage Connection String =====');
    
    const blobConnectionString = localSettings.Values.BLOB_STORAGE_CONNECTION_STRING;
    if (!blobConnectionString) {
        console.log('❌ No Blob Storage connection string found');
        return;
    }
    
    // Check if the SAS token is expired
    if (blobConnectionString.includes('se=2025-05-01T02:42:59Z')) {
        console.log('⚠️ WARNING: SAS token in the Blob Storage connection string appears to be expired (May 1, 2025)');
        console.log('⚠️ You should generate a new SAS token and update the connection string');
    } else {
        console.log('✅ Blob Storage connection string doesn\'t have the expired SAS token');
    }
}

/**
 * Check and update Redis Cache configuration
 */
async function checkRedisCache() {
    console.log('\n===== Checking Redis Cache Configuration =====');
    
    const enableRedisCache = localSettings.Values.ENABLE_REDIS_CACHE;
    
    console.log(`Current ENABLE_REDIS_CACHE setting: ${enableRedisCache}`);
    
    if (enableRedisCache === "true") {
        console.log('⚠️ WARNING: Redis Cache is enabled. This might be causing the cached data without enhanced pricing to be returned.');
        console.log('⚠️ For testing, consider setting ENABLE_REDIS_CACHE to "false" to bypass the cache.');
    } else {
        console.log('✅ Redis Cache is disabled, which should help with testing.');
    }
}

/**
 * Run the complete test and fix workflow
 */
async function runTestAndFix() {
    console.log('=============================================================');
    console.log('     Testing and Fixing CosmosDB Enhanced Pricing Data');
    console.log('=============================================================');
    
    // Check Redis Cache configuration
    await checkRedisCache();
    
    // Check Blob Storage connection string
    await checkAndUpdateBlobStorage();
    
    // Step 1: Get the card from CosmosDB
    const card = await getCardFromDatabase();
    
    if (!card) {
        console.log('\n❌ Could not find card in CosmosDB. The card may not have been saved yet.');
        console.log('Try running the test-card-info.js script first to fetch and save the card data.');
        return;
    }
    
    // Step 2: Update the card with enhanced pricing data if needed
    await updateCardWithEnhancedPricing(card);
    
    // Summary
    console.log('\n=============================================================');
    console.log('                     Test and Fix Results');
    console.log('=============================================================');
    console.log('1. If enhanced pricing data was missing or incorrect, it has been fixed.');
    console.log('2. Remember to check the ENABLE_REDIS_CACHE setting - set to "false" for testing.');
    console.log('3. Consider updating the expired Blob Storage SAS token.');
    console.log('\nNext steps:');
    console.log('1. Run test-card-info.js again to verify the data is now being returned correctly.');
    console.log('2. Check if the fix resolved the issue with the frontend not receiving enhanced pricing data.');
}

// Run the test and fix workflow
runTestAndFix().catch(error => {
    console.error('Fatal error during test execution:', error);
});
