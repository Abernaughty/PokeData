import axios from 'axios';
import { Card } from '../models/Card';
import { Set } from '../models/Set';
import { PriceData } from '../models/Card';

export interface IPokemonTcgApiService {
    getAllSets(): Promise<Set[]>;
    getSet(setCode: string): Promise<Set | null>;
    getCardsBySet(setCode: string): Promise<Card[]>;
    getCard(cardId: string): Promise<Card | null>;
    getCardPricing(cardId: string): Promise<PriceData | null>;
}

export class PokemonTcgApiService implements IPokemonTcgApiService {
    private apiKey: string;
    private baseUrl: string;
    
    constructor(apiKey: string, baseUrl: string = 'https://api.pokemontcg.io/v2') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    
    private getHeaders() {
        return {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }
    
    async getAllSets(): Promise<Set[]> {
        console.log(`[PokemonTcgApiService] Getting all sets`);
        
        try {
            // In a real implementation, this would call the Pokémon TCG API
            // const response = await axios.get(`${this.baseUrl}/sets`, { headers: this.getHeaders() });
            // return response.data.data.map(this.mapApiSetToSet);
            
            // Mock implementation for local testing
            return [
                {
                    id: 'sv8pt5',
                    code: 'PRE',
                    name: 'Prismatic Evolutions',
                    series: 'Scarlet & Violet',
                    releaseDate: '2025-02-14',
                    cardCount: 200,
                    isCurrent: true
                },
                {
                    id: 'sv8',
                    code: 'PAF',
                    name: 'Paldean Fates',
                    series: 'Scarlet & Violet',
                    releaseDate: '2025-01-26',
                    cardCount: 162,
                    isCurrent: true
                }
            ];
        } catch (error: any) {
            console.error(`[PokemonTcgApiService] Error getting sets: ${error.message}`);
            return [];
        }
    }
    
    async getSet(setCode: string): Promise<Set | null> {
        console.log(`[PokemonTcgApiService] Getting set: ${setCode}`);
        
        try {
            // In a real implementation, this would call the Pokémon TCG API
            // const response = await axios.get(`${this.baseUrl}/sets/${setCode}`, { headers: this.getHeaders() });
            // return this.mapApiSetToSet(response.data.data);
            
            // Mock implementation for local testing
            if (setCode === 'PRE') {
                return {
                    id: 'sv8pt5',
                    code: 'PRE',
                    name: 'Prismatic Evolutions',
                    series: 'Scarlet & Violet',
                    releaseDate: '2025-02-14',
                    cardCount: 200,
                    isCurrent: true
                };
            }
            return null;
        } catch (error: any) {
            console.error(`[PokemonTcgApiService] Error getting set ${setCode}: ${error.message}`);
            return null;
        }
    }
    
    async getCardsBySet(setCode: string): Promise<Card[]> {
        console.log(`[PokemonTcgApiService] Getting cards for set: ${setCode}`);
        
        try {
            // In a real implementation, this would call the Pokémon TCG API
            // const response = await axios.get(`${this.baseUrl}/cards?q=set.id:${setCode}`, { headers: this.getHeaders() });
            // return response.data.data.map(this.mapApiCardToCard);
            
            // Mock implementation for local testing
            if (setCode === 'PRE') {
                return [
                    {
                        id: 'sv8pt5-161',
                        setCode: 'PRE',
                        setId: 557,
                        setName: 'Prismatic Evolutions',
                        cardId: 'sv8pt5-161',
                        cardName: 'Umbreon ex',
                        cardNumber: '161',
                        rarity: 'Secret Rare',
                        imageUrl: 'https://images.pokemontcg.io/sv8pt5/161.png',
                        imageUrlHiRes: 'https://images.pokemontcg.io/sv8pt5/161_hires.png'
                    }
                ];
            }
            return [];
        } catch (error: any) {
            console.error(`[PokemonTcgApiService] Error getting cards for set ${setCode}: ${error.message}`);
            return [];
        }
    }
    
    async getCard(cardId: string): Promise<Card | null> {
        console.log(`[PokemonTcgApiService] Getting card: ${cardId}`);
        
        try {
            // In a real implementation, this would call the Pokémon TCG API
            // const response = await axios.get(`${this.baseUrl}/cards/${cardId}`, { headers: this.getHeaders() });
            // return this.mapApiCardToCard(response.data.data);
            
            // Mock implementation for local testing
            if (cardId === 'sv8pt5-161') {
                return {
                    id: 'sv8pt5-161',
                    setCode: 'PRE',
                    setId: 557,
                    setName: 'Prismatic Evolutions',
                    cardId: 'sv8pt5-161',
                    cardName: 'Umbreon ex',
                    cardNumber: '161',
                    rarity: 'Secret Rare',
                    imageUrl: 'https://images.pokemontcg.io/sv8pt5/161.png',
                    imageUrlHiRes: 'https://images.pokemontcg.io/sv8pt5/161_hires.png'
                };
            }
            return null;
        } catch (error: any) {
            console.error(`[PokemonTcgApiService] Error getting card ${cardId}: ${error.message}`);
            return null;
        }
    }
    
    async getCardPricing(cardId: string): Promise<PriceData | null> {
        console.log(`[PokemonTcgApiService] Getting pricing for card: ${cardId}`);
        
        try {
            // In a real implementation, this would call the Pokémon TCG API
            // const response = await axios.get(`${this.baseUrl}/cards/${cardId}`, { headers: this.getHeaders() });
            // return this.mapApiPricingToPriceData(response.data.data.tcgplayer?.prices?.holofoil);
            
            // Mock implementation for local testing
            if (cardId === 'sv8pt5-161') {
                return {
                    market: 1414.77,
                    low: 1200.00,
                    mid: 1400.00,
                    high: 1800.00
                };
            }
            return null;
        } catch (error: any) {
            console.error(`[PokemonTcgApiService] Error getting pricing for card ${cardId}: ${error.message}`);
            return null;
        }
    }
    
    // Helper methods for mapping API responses to our models
    private mapApiSetToSet(apiSet: any): Set {
        return {
            id: apiSet.id,
            code: apiSet.ptcgoCode || apiSet.id.toUpperCase(),
            name: apiSet.name,
            series: apiSet.series,
            releaseDate: apiSet.releaseDate,
            cardCount: apiSet.total,
            isCurrent: this.isCurrentSet(apiSet.releaseDate)
        };
    }
    
    private mapApiCardToCard(apiCard: any): Card {
        return {
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
            tcgPlayerPrice: this.mapApiPricingToPriceData(apiCard.tcgplayer?.prices?.holofoil) || undefined
        };
    }
    
    private mapApiPricingToPriceData(apiPricing: any): PriceData | null {
        if (!apiPricing) return null;
        
        return {
            market: apiPricing.market || 0,
            low: apiPricing.low || 0,
            mid: apiPricing.mid || 0,
            high: apiPricing.high || 0
        };
    }
    
    private isCurrentSet(releaseDate: string): boolean {
        const releaseTimestamp = new Date(releaseDate).getTime();
        const now = Date.now();
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
        
        return releaseTimestamp > oneYearAgo;
    }
}
