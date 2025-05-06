// Direct Cosmos DB import script
const { CosmosClient } = require('@azure/cosmos');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Read settings from local.settings.json
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
const connectionString = localSettings.Values.COSMOSDB_CONNECTION_STRING;
const apiKey = localSettings.Values.POKEMON_TCG_API_KEY;
const apiBaseUrl = localSettings.Values.POKEMON_TCG_API_BASE_URL || 'https://api.pokemontcg.io/v2';
const batchSize = parseInt(localSettings.Values.IMPORT_BATCH_SIZE || '100');
const retryCount = parseInt(localSettings.Values.IMPORT_RETRY_COUNT || '3');
const retryDelay = parseInt(localSettings.Values.IMPORT_RETRY_DELAY || '1000');

// Cosmos DB configuration
const databaseName = 'PokemonCards';
const setsContainerName = 'Sets';
const cardsContainerName = 'Cards';

// Initialize Cosmos client
let client;
let database;
let setsContainer;
let cardsContainer;

/**
 * Initialize Cosmos DB client and containers
 */
async function initializeCosmosClient() {
  console.log('Initializing Cosmos DB client...');
  client = new CosmosClient(connectionString);
  
  // Get database
  console.log(`Getting database: ${databaseName}`);
  database = client.database(databaseName);
  
  // Get containers
  console.log(`Getting sets container: ${setsContainerName}`);
  setsContainer = database.container(setsContainerName);
  
  console.log(`Getting cards container: ${cardsContainerName}`);
  cardsContainer = database.container(cardsContainerName);
}

/**
 * Retry a function with exponential backoff
 */
async function retry(fn, maxRetries, delay) {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries <= 0) {
      throw error;
    }
    console.log(`Retrying after ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, maxRetries - 1, delay * 2);
  }
}

/**
 * Get all sets from the Pokémon TCG API
 */
async function getAllSets() {
  console.log('Getting all sets from the Pokémon TCG API...');
  
  try {
    const response = await axios.get(`${apiBaseUrl}/sets`, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const sets = response.data.data.map(apiSet => ({
      id: apiSet.id,
      code: apiSet.ptcgoCode || apiSet.id.toUpperCase(),
      name: apiSet.name,
      series: apiSet.series,
      releaseDate: apiSet.releaseDate,
      cardCount: apiSet.total,
      isCurrent: isCurrentSet(apiSet.releaseDate)
    }));
    
    return sets;
  } catch (error) {
    console.error('Error getting sets from the API:', error.message);
    throw error;
  }
}

/**
 * Get cards for a specific set from the Pokémon TCG API
 */
async function getCardsBySet(setCode) {
  console.log(`Getting cards for set ${setCode} from the Pokémon TCG API...`);
  
  try {
    const response = await axios.get(`${apiBaseUrl}/cards`, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      params: {
        q: `set.ptcgoCode:${setCode}`,
        orderBy: 'number',
        page: 1,
        pageSize: 250
      }
    });
    
    const cards = response.data.data.map(apiCard => ({
      id: apiCard.id,
      setCode: apiCard.set.ptcgoCode || apiCard.set.id.toUpperCase(),
      setId: apiCard.set.id,
      setName: apiCard.set.name,
      cardId: apiCard.id,
      cardName: apiCard.name,
      cardNumber: apiCard.number,
      rarity: apiCard.rarity,
      imageUrl: apiCard.images.small,
      imageUrlHiRes: apiCard.images.large,
      tcgPlayerPrice: mapApiPricingToPriceData(apiCard.tcgplayer?.prices?.holofoil) || undefined
    }));
    
    return cards;
  } catch (error) {
    console.error(`Error getting cards for set ${setCode} from the API:`, error.message);
    throw error;
  }
}

/**
 * Map API pricing data to our price data format
 */
function mapApiPricingToPriceData(apiPricing) {
  if (!apiPricing) return null;
  
  return {
    market: apiPricing.market || 0,
    low: apiPricing.low || 0,
    mid: apiPricing.mid || 0,
    high: apiPricing.high || 0
  };
}

/**
 * Determine if a set is current based on its release date
 */
function isCurrentSet(releaseDate) {
  // If no release date is provided, consider it not current
  if (!releaseDate) {
    return false;
  }
  
  try {
    const releaseTimestamp = new Date(releaseDate).getTime();
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    
    // For testing purposes, consider the two most recent sets as current
    // This ensures we have some current sets to import cards for
    const isRecent = releaseTimestamp > oneYearAgo;
    
    console.log(`Set with release date ${releaseDate} is ${isRecent ? 'current' : 'not current'}`);
    
    return isRecent;
  } catch (error) {
    console.error(`Error determining if set is current (release date: ${releaseDate}):`, error);
    return false;
  }
}

/**
 * Import all sets from the Pokémon TCG API to Cosmos DB
 */
async function importSets() {
  console.log('Importing sets...');
  
  try {
    // Get all sets from the API
    const sets = await retry(() => getAllSets(), retryCount, retryDelay);
    
    if (sets.length === 0) {
      console.log('No sets found to import');
      return [];
    }
    
    // Log the isCurrent status of each set
    console.log('Sets to import with isCurrent status:');
    sets.forEach(set => {
      console.log(`- ${set.name} (${set.code}): isCurrent=${set.isCurrent}, releaseDate=${set.releaseDate}`);
    });
    
    // Save sets to Cosmos DB
    console.log(`Saving ${sets.length} sets to Cosmos DB...`);
    
    // Add lastUpdated timestamp to each set
    const setsWithTimestamp = sets.map(set => ({
      ...set,
      lastUpdated: new Date().toISOString()
    }));
    
    // Use individual upsert operations instead of bulk
    for (const set of setsWithTimestamp) {
      await setsContainer.items.upsert(set);
    }
    
    console.log(`Successfully imported ${sets.length} sets`);
    
    // Log some sample sets
    console.log('Sample sets:');
    sets.slice(0, 3).forEach(set => {
      console.log(`- ${set.name} (${set.code}): ${set.cardCount} cards, Series: ${set.series}`);
    });
    
    return sets;
  } catch (error) {
    console.error('Error importing sets:', error.message);
    throw error;
  }
}

/**
 * Import cards for a specific set
 */
async function importCardsForSet(set) {
  console.log(`Importing cards for set ${set.name} (${set.code})...`);
  
  try {
    // Get cards for the set from the API
    const cards = await retry(() => getCardsBySet(set.code), retryCount, retryDelay);
    
    if (cards.length === 0) {
      console.log(`No cards found for set ${set.name}`);
      return 0;
    }
    
    // Save cards to Cosmos DB in batches
    let importedCount = 0;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      for (const card of batch) {
        await cardsContainer.items.upsert(card);
      }
      importedCount += batch.length;
      console.log(`Imported ${importedCount}/${cards.length} cards for set ${set.name}`);
    }
    
    console.log(`Successfully imported ${importedCount} cards for set ${set.name}`);
    return importedCount;
  } catch (error) {
    console.error(`Error importing cards for set ${set.name}:`, error.message);
    throw error;
  }
}

/**
 * Main import function
 */
async function importData() {
  console.log('Starting data import to Cosmos DB...');
  console.log(`Batch size: ${batchSize}, Retry count: ${retryCount}, Retry delay: ${retryDelay}ms`);
  
  try {
    // Initialize Cosmos DB client
    await initializeCosmosClient();
    
    // Import sets
    const sets = await importSets();
    
    // Add a delay to ensure sets are saved before retrieving them
    console.log('Waiting for sets to be saved to Cosmos DB...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get all sets from Cosmos DB
    console.log('Retrieving sets from Cosmos DB...');
    const { resources: allSets } = await setsContainer.items.readAll().fetchAll();
    console.log(`Found ${allSets.length} total sets in Cosmos DB`);
    
    // Filter for current sets to limit initial import
    const currentSets = allSets.filter(set => set.isCurrent === true);
    console.log(`Found ${currentSets.length} current sets out of ${allSets.length} total sets`);
    
    // Log the current sets
    if (currentSets.length > 0) {
      console.log('Current sets:');
      currentSets.forEach(set => {
        console.log(`- ${set.name} (${set.code}): isCurrent=${set.isCurrent}, Series: ${set.series}`);
      });
    }
    
    // Import cards for current sets
    let totalCards = 0;
    for (const set of currentSets) {
      const importedCount = await importCardsForSet(set);
      totalCards += importedCount;
    }
    
    console.log(`Import complete. Imported ${sets.length} sets and ${totalCards} cards.`);
  } catch (error) {
    console.error('Error during import:', error.message);
    process.exit(1);
  }
}

// Run the import
importData().catch(error => {
  console.error('Unhandled error during import:', error.message);
  process.exit(1);
});
