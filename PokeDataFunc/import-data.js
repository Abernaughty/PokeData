"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const CosmosDbService_1 = require("./src/services/CosmosDbService");
const PokemonTcgApiService_1 = require("./src/services/PokemonTcgApiService");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Read settings from local.settings.json
const localSettingsPath = path.join(__dirname, 'local.settings.json');
let localSettings;
try {
    localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
    console.log('Successfully loaded local.settings.json');
}
catch (error) {
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
const cosmosDbService = new CosmosDbService_1.CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const pokemonTcgApiService = new PokemonTcgApiService_1.PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY || "", process.env.POKEMON_TCG_API_BASE_URL);
/**
 * Retry a function with exponential backoff
 */
async function retry(fn, maxRetries, delay) {
    try {
        return await fn();
    }
    catch (error) {
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
async function importSets() {
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
    }
    catch (error) {
        console.error('Error importing sets:', error.message || String(error));
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
    }
    catch (error) {
        console.error(`Error importing cards for set ${set.name}:`, error.message || String(error));
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
    }
    catch (error) {
        console.error('Error during import:', error.message || String(error));
        process.exit(1);
    }
}
// Run the import
importData().catch((error) => {
    console.error('Unhandled error during import:', error.message || String(error));
    process.exit(1);
});
//# sourceMappingURL=import-data.js.map