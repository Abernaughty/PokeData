"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmosDbService = void 0;
const cosmos_1 = require("@azure/cosmos");
class CosmosDbService {
    constructor(connectionString) {
        // Constants for database and container names
        this.DATABASE_NAME = 'PokemonCards';
        this.CARDS_CONTAINER_NAME = 'Cards';
        this.SETS_CONTAINER_NAME = 'Sets';
        console.log('Initializing CosmosDbService...');
        this.client = new cosmos_1.CosmosClient(connectionString);
        // Get database and containers directly
        this.database = this.client.database(this.DATABASE_NAME);
        this.cardContainer = this.database.container(this.CARDS_CONTAINER_NAME);
        this.setContainer = this.database.container(this.SETS_CONTAINER_NAME);
        console.log('CosmosDbService initialized');
    }
    async getCard(cardId) {
        try {
            // Extract setId from cardId (e.g., "sv8pt5-161" -> "sv8pt5")
            const setId = cardId.split('-')[0];
            const { resource } = await this.cardContainer.item(cardId, setId).read();
            return resource;
        }
        catch (error) {
            console.error(`Error getting card ${cardId}:`, error);
            return null;
        }
    }
    async getCardsBySet(setCode) {
        try {
            // Find the setId that corresponds to the setCode
            const setQuerySpec = {
                query: "SELECT * FROM c WHERE c.code = @setCode",
                parameters: [
                    { name: "@setCode", value: setCode }
                ]
            };
            const { resources: sets } = await this.setContainer.items.query(setQuerySpec).fetchAll();
            if (sets.length === 0) {
                console.log(`Set with code ${setCode} not found`);
                return [];
            }
            const set = sets[0];
            // Query cards by setId
            const cardsQuerySpec = {
                query: "SELECT * FROM c WHERE c.setId = @setId",
                parameters: [
                    { name: "@setId", value: set.id }
                ]
            };
            const { resources } = await this.cardContainer.items.query(cardsQuerySpec).fetchAll();
            return resources;
        }
        catch (error) {
            console.error(`Error getting cards for set ${setCode}:`, error);
            return [];
        }
    }
    async getCardsBySetId(setId) {
        try {
            // Convert string to number for database query (database stores setId as number)
            const setIdNumber = parseInt(setId);
            console.log(`[CosmosDbService] Querying cards for setId: ${setIdNumber} (converted from "${setId}")`);
            // Query cards directly by setId (for PokeData-first approach)
            const cardsQuerySpec = {
                query: "SELECT * FROM c WHERE c.setId = @setId",
                parameters: [
                    { name: "@setId", value: setIdNumber }
                ]
            };
            const { resources } = await this.cardContainer.items.query(cardsQuerySpec).fetchAll();
            console.log(`[CosmosDbService] Found ${resources.length} cards for setId: ${setIdNumber}`);
            return resources;
        }
        catch (error) {
            console.error(`Error getting cards for setId ${setId}:`, error);
            return [];
        }
    }
    async saveCard(card) {
        try {
            console.log(`[CosmosDbService] Attempting to save card: ${card.id} for setId: ${card.setId}`);
            console.log(`[CosmosDbService] Card data preview: ${JSON.stringify({
                id: card.id,
                setId: card.setId,
                cardName: card.cardName,
                cardNumber: card.cardNumber,
                source: card.source
            })}`);
            const result = await this.cardContainer.items.upsert(card);
            console.log(`[CosmosDbService] Successfully saved card ${card.id} - Status: ${result.statusCode}, RU: ${result.requestCharge}`);
        }
        catch (error) {
            console.error(`[CosmosDbService] ERROR saving card ${card.id}:`, error);
            console.error(`[CosmosDbService] Card data that failed:`, JSON.stringify(card, null, 2));
            throw error;
        }
    }
    async updateCard(card) {
        try {
            await this.cardContainer.item(card.id, card.setId).replace(card);
        }
        catch (error) {
            console.error(`Error updating card ${card.id}:`, error);
            throw error;
        }
    }
    async getAllSets() {
        try {
            console.log('[CosmosDbService] Getting all sets from Cosmos DB');
            // Use readAll to get all sets
            const { resources } = await this.setContainer.items.readAll().fetchAll();
            console.log(`[CosmosDbService] Found ${resources.length} sets in Cosmos DB`);
            // Log the first few sets for debugging
            if (resources.length > 0) {
                console.log('Sample sets from Cosmos DB:');
                resources.slice(0, Math.min(3, resources.length)).forEach((set) => {
                    console.log(`- ${set.name} (${set.code}): ${set.cardCount} cards, Series: ${set.series}, isCurrent: ${set.isCurrent}`);
                });
            }
            return resources;
        }
        catch (error) {
            console.error(`Error getting all sets:`, error);
            // Try using a query as a fallback
            try {
                console.log('Falling back to query approach...');
                const querySpec = {
                    query: "SELECT * FROM c"
                };
                const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
                console.log(`[CosmosDbService] Found ${resources.length} sets using query()`);
                return resources;
            }
            catch (queryError) {
                console.error(`Error querying sets:`, queryError);
                return [];
            }
        }
    }
    async getSet(setCode) {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.code = @setCode",
                parameters: [
                    { name: "@setCode", value: setCode }
                ]
            };
            const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
            return resources.length > 0 ? resources[0] : null;
        }
        catch (error) {
            console.error(`Error getting set ${setCode}:`, error);
            return null;
        }
    }
    async saveSets(sets) {
        try {
            console.log(`[CosmosDbService] Saving ${sets.length} sets`);
            // Add lastUpdated timestamp to each set
            const setsWithTimestamp = sets.map(set => ({
                ...set,
                lastUpdated: new Date().toISOString()
            }));
            // Log the first few sets for debugging
            if (setsWithTimestamp.length > 0) {
                console.log('Sample sets being saved:');
                setsWithTimestamp.slice(0, Math.min(3, setsWithTimestamp.length)).forEach(set => {
                    console.log(`- ${set.name} (${set.code}): ${set.cardCount} cards, Series: ${set.series}, isCurrent: ${set.isCurrent}`);
                });
            }
            // Use individual upsert operations instead of bulk
            for (const set of setsWithTimestamp) {
                await this.setContainer.items.upsert(set);
            }
            console.log(`[CosmosDbService] Successfully saved ${sets.length} sets`);
        }
        catch (error) {
            console.error(`Error saving sets:`, error);
            throw error;
        }
    }
    async getCurrentSets() {
        try {
            console.log('[CosmosDbService] Getting current sets from Cosmos DB');
            // Get all sets first
            const allSets = await this.getAllSets();
            // Filter for current sets
            const currentSets = allSets.filter(set => set.isCurrent === true);
            console.log(`[CosmosDbService] Found ${currentSets.length} current sets out of ${allSets.length} total sets`);
            // Log the current sets for debugging
            if (currentSets.length > 0) {
                console.log('Current sets:');
                currentSets.forEach(set => {
                    console.log(`- ${set.name} (${set.code}): isCurrent=${set.isCurrent}, Series: ${set.series}`);
                });
            }
            return currentSets;
        }
        catch (error) {
            console.error(`Error getting current sets:`, error);
            // Try using a query as a fallback
            try {
                console.log('Falling back to query approach for current sets...');
                const querySpec = {
                    query: "SELECT * FROM c WHERE c.isCurrent = true"
                };
                const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
                console.log(`[CosmosDbService] Found ${resources.length} current sets using query()`);
                return resources;
            }
            catch (queryError) {
                console.error(`Error querying current sets:`, queryError);
                return [];
            }
        }
    }
}
exports.CosmosDbService = CosmosDbService;
//# sourceMappingURL=CosmosDbService.js.map