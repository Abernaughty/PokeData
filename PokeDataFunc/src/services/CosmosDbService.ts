import { CosmosClient, Container, Database, ContainerResponse } from '@azure/cosmos';
import { Card } from '../models/Card';
import { Set } from '../models/Set';

export interface ICosmosDbService {
    // Card operations
    getCard(cardId: string): Promise<Card | null>;
    getCardsBySet(setCode: string): Promise<Card[]>;
    saveCard(card: Card): Promise<void>;
    updateCard(card: Card): Promise<void>;
    
    // Set operations
    getAllSets(): Promise<Set[]>;
    getSet(setCode: string): Promise<Set | null>;
    saveSets(sets: Set[]): Promise<void>;
    getCurrentSets(): Promise<Set[]>;
}

export class CosmosDbService implements ICosmosDbService {
    private client: CosmosClient;
    private database: Database;
    private cardContainer: Container;
    private setContainer: Container;
    
    // Constants for database and container names
    private readonly DATABASE_NAME = 'PokemonCards';
    private readonly CARDS_CONTAINER_NAME = 'Cards';
    private readonly SETS_CONTAINER_NAME = 'Sets';
    
    constructor(connectionString: string) {
        console.log('Initializing CosmosDbService...');
        this.client = new CosmosClient(connectionString);
        
        // Get database and containers directly
        this.database = this.client.database(this.DATABASE_NAME);
        this.cardContainer = this.database.container(this.CARDS_CONTAINER_NAME);
        this.setContainer = this.database.container(this.SETS_CONTAINER_NAME);
        
        console.log('CosmosDbService initialized');
    }
    
    async getCard(cardId: string): Promise<Card | null> {
        try {
            // Extract setId from cardId (e.g., "sv8pt5-161" -> "sv8pt5")
            const setId = cardId.split('-')[0];
            
            const { resource } = await this.cardContainer.item(cardId, setId).read();
            return resource as Card;
        } catch (error) {
            console.error(`Error getting card ${cardId}:`, error);
            return null;
        }
    }
    
    async getCardsBySet(setCode: string): Promise<Card[]> {
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
            
            const set = sets[0] as Set;
            
            // Query cards by setId
            const cardsQuerySpec = {
                query: "SELECT * FROM c WHERE c.setId = @setId",
                parameters: [
                    { name: "@setId", value: set.id }
                ]
            };
            
            const { resources } = await this.cardContainer.items.query(cardsQuerySpec).fetchAll();
            return resources as Card[];
        } catch (error) {
            console.error(`Error getting cards for set ${setCode}:`, error);
            return [];
        }
    }
    
    async saveCard(card: Card): Promise<void> {
        try {
            await this.cardContainer.items.upsert(card);
        } catch (error) {
            console.error(`Error saving card ${card.id}:`, error);
            throw error;
        }
    }
    
    async updateCard(card: Card): Promise<void> {
        try {
            await this.cardContainer.item(card.id, card.setId).replace(card);
        } catch (error) {
            console.error(`Error updating card ${card.id}:`, error);
            throw error;
        }
    }
    
    async getAllSets(): Promise<Set[]> {
        try {
            console.log('[CosmosDbService] Getting all sets from Cosmos DB');
            
            // Use readAll to get all sets
            const { resources } = await this.setContainer.items.readAll().fetchAll();
            console.log(`[CosmosDbService] Found ${resources.length} sets in Cosmos DB`);
            
            // Log the first few sets for debugging
            if (resources.length > 0) {
                console.log('Sample sets from Cosmos DB:');
                resources.slice(0, Math.min(3, resources.length)).forEach((set: any) => {
                    console.log(`- ${set.name} (${set.code}): ${set.cardCount} cards, Series: ${set.series}, isCurrent: ${set.isCurrent}`);
                });
            }
            
            return resources as Set[];
        } catch (error) {
            console.error(`Error getting all sets:`, error);
            
            // Try using a query as a fallback
            try {
                console.log('Falling back to query approach...');
                const querySpec = {
                    query: "SELECT * FROM c"
                };
                
                const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
                console.log(`[CosmosDbService] Found ${resources.length} sets using query()`);
                
                return resources as Set[];
            } catch (queryError) {
                console.error(`Error querying sets:`, queryError);
                return [];
            }
        }
    }
    
    async getSet(setCode: string): Promise<Set | null> {
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.code = @setCode",
                parameters: [
                    { name: "@setCode", value: setCode }
                ]
            };
            
            const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
            return resources.length > 0 ? resources[0] as Set : null;
        } catch (error) {
            console.error(`Error getting set ${setCode}:`, error);
            return null;
        }
    }
    
    async saveSets(sets: Set[]): Promise<void> {
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
        } catch (error) {
            console.error(`Error saving sets:`, error);
            throw error;
        }
    }
    
    async getCurrentSets(): Promise<Set[]> {
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
        } catch (error) {
            console.error(`Error getting current sets:`, error);
            
            // Try using a query as a fallback
            try {
                console.log('Falling back to query approach for current sets...');
                const querySpec = {
                    query: "SELECT * FROM c WHERE c.isCurrent = true"
                };
                
                const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
                console.log(`[CosmosDbService] Found ${resources.length} current sets using query()`);
                
                return resources as Set[];
            } catch (queryError) {
                console.error(`Error querying current sets:`, queryError);
                return [];
            }
        }
    }
}
