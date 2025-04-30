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
    private setContainer!: Container; // Using definite assignment assertion
    
    constructor(connectionString: string) {
        this.client = new CosmosClient(connectionString);
        this.database = this.client.database('PokemonCards');
        this.cardContainer = this.database.container('Cards');
        
        // Create Sets container if it doesn't exist
        this.initializeSetContainer().catch(error => {
            console.error('Failed to initialize Sets container:', error);
        });
    }
    
    private async initializeSetContainer() {
        try {
            // Check if Sets container exists, create if not
            const containersList = await this.database.containers.readAll().fetchAll();
            const containersArray = containersList.resources;
            const setsContainerExists = containersArray.some((c: any) => c.id === 'Sets');
            
            if (!setsContainerExists) {
                console.log('Creating Sets container...');
                const response: ContainerResponse = await this.database.containers.createIfNotExists({
                    id: 'Sets',
                    partitionKey: { paths: ['/series'] }
                });
                this.setContainer = this.database.container('Sets');
            } else {
                this.setContainer = this.database.container('Sets');
            }
        } catch (error) {
            console.error('Error initializing Sets container:', error);
            // Fallback to using the container even if we couldn't verify/create it
            this.setContainer = this.database.container('Sets');
        }
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
                query: "SELECT * FROM s WHERE s.code = @setCode",
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
            const { resources } = await this.setContainer.items.readAll().fetchAll();
            return resources as Set[];
        } catch (error) {
            console.error(`Error getting all sets:`, error);
            return [];
        }
    }
    
    async getSet(setCode: string): Promise<Set | null> {
        try {
            const querySpec = {
                query: "SELECT * FROM s WHERE s.code = @setCode",
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
            // Use individual upsert operations instead of bulk
            for (const set of sets) {
                await this.setContainer.items.upsert(set);
            }
        } catch (error) {
            console.error(`Error saving sets:`, error);
            throw error;
        }
    }
    
    async getCurrentSets(): Promise<Set[]> {
        try {
            const querySpec = {
                query: "SELECT * FROM s WHERE s.isCurrent = true"
            };
            
            const { resources } = await this.setContainer.items.query(querySpec).fetchAll();
            return resources as Set[];
        } catch (error) {
            console.error(`Error getting current sets:`, error);
            return [];
        }
    }
}
