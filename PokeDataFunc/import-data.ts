import { CosmosDbService } from './src/services/CosmosDbService';
import { PokemonTcgApiService } from './src/services/PokemonTcgApiService';
import * as path from 'path';
import * as fs from 'fs';

// Read settings from local.settings.json
const localSettingsPath = path.join(__dirname, 'local.settings.json');
let localSettings;
try {
  localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
  console.log('Successfully loaded local.settings.json');
} catch (error: any) {
  console.error('Error loading local.settings.json:', error.message || String(error));
  process.exit(1);
}

// Set environment variables from local.settings.json
process.env.COSMOSDB_CONNECTION_STRING = localSettings.Values.COSMOSDB_CONNECTION_STRING;
process.env.POKEMON_TCG_API_KEY = localSettings.Values.POKEMON_TCG_API_KEY;
process.env.POKEMON_TCG_API_BASE_URL = localSettings.Values.POKEMON_TCG_API_BASE_URL;
process.env.IMPORT_BATCH_SIZE = localSettings.Values.IMPORT_BATCH_SIZE;
process.env.IMPORT_RETRY_COUNT = localSettings.Values.IMPORT_RETRY_COUNT;
process.env.IMPORT_RETRY_DELAY = localSettings.Values.IMPORT_RETRY_DELAY;

// Configuration
const batchSize = parseInt(process.env.IMPORT_BATCH_SIZE || '100');
const retryCount = parseInt(process.env.IMPORT_RETRY_COUNT || '3');
const retryDelay = parseInt(process.env.IMPORT_RETRY_DELAY || '1000');

// Initialize services
const cosmosDbService = new CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const pokemonTcgApiService = new PokemonTcgApiService(
  process.env.POKEMON_TCG_API_KEY || "",
  process.env.POKEMON_TCG_API_BASE_URL
);

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(fn: () => Promise<T>, maxRetries: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (maxRetries <= 0) {
      throw error;
    }
    console.log(`Retrying after ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, maxRetries - 1, delay * 2);
  }
}

/**
 * Import all sets from the Pokémon TCG API to Cosmos DB
 */
async function importSets(): Promise<void> {
  console.log('Importing sets...');
  
  try {
    // Get all sets from the API
    const sets = await retry(() => pokemonTcgApiService.getAllSets(), retryCount, retryDelay);
    
    if (sets.length === 0) {
      console.log('No sets found to import');
      return;
    }
    
    // Log the isCurrent status of each set
    console.log('Sets to import with isCurrent status:');
    sets.forEach(set => {
      console.log(`- ${set.name} (${set.code}): isCurrent=${set.isCurrent}, releaseDate=${set.releaseDate}`);
    });
    
    // Save sets to Cosmos DB
    await cosmosDbService.saveSets(sets);
    console.log(`Successfully imported ${sets.length} sets`);
    
    // Log some sample sets
    console.log('Sample sets:');
    sets.slice(0, 3).forEach(set => {
      console.log(`- ${set.name} (${set.code}): ${set.cardCount} cards, Series: ${set.series}`);
    });
  } catch (error: any) {
    console.error('Error importing sets:', error.message || String(error));
    throw error;
  }
}

/**
 * Import cards for a specific set
 */
async function importCardsForSet(set: any): Promise<number> {
  console.log(`Importing cards for set ${set.name} (${set.code})...`);
  
  try {
    // Get cards for the set from the API
    const cards = await retry(() => pokemonTcgApiService.getCardsBySet(set.code), retryCount, retryDelay);
    
    if (cards.length === 0) {
      console.log(`No cards found for set ${set.name}`);
      return 0;
    }
    
    // Save cards to Cosmos DB in batches
    let importedCount = 0;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      for (const card of batch) {
        await cosmosDbService.saveCard(card);
      }
      importedCount += batch.length;
      console.log(`Imported ${importedCount}/${cards.length} cards for set ${set.name}`);
    }
    
    console.log(`Successfully imported ${importedCount} cards for set ${set.name}`);
    return importedCount;
  } catch (error: any) {
    console.error(`Error importing cards for set ${set.name}:`, error.message || String(error));
    throw error;
  }
}

/**
 * Main import function
 */
async function importData(): Promise<void> {
  console.log('Starting data import to Cosmos DB...');
  console.log(`Batch size: ${batchSize}, Retry count: ${retryCount}, Retry delay: ${retryDelay}ms`);
  
  try {
    // Import sets
    await importSets();
    
    // Add a delay to ensure sets are saved before retrieving them
    console.log('Waiting for sets to be saved to Cosmos DB...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get all sets from Cosmos DB
    console.log('Retrieving sets from Cosmos DB...');
    const sets = await cosmosDbService.getAllSets();
    
    // Filter for current sets to limit initial import
    const currentSets = sets.filter(set => set.isCurrent);
    console.log(`Found ${currentSets.length} current sets out of ${sets.length} total sets`);
    
    // Import cards for current sets
    let totalCards = 0;
    for (const set of currentSets) {
      const importedCount = await importCardsForSet(set);
      totalCards += importedCount;
    }
    
    console.log(`Import complete. Imported ${sets.length} sets and ${totalCards} cards.`);
  } catch (error: any) {
    console.error('Error during import:', error.message || String(error));
    process.exit(1);
  }
}

// Run the import
importData().catch((error: any) => {
  console.error('Unhandled error during import:', error.message || String(error));
  process.exit(1);
});
