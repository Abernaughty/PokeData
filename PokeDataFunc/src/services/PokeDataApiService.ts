
import axios from 'axios';
import { EnhancedPriceData } from '../models/Card';

export interface IPokeDataApiService {
    getCardPricing(cardId: string): Promise<EnhancedPriceData | null>;
}

export class PokeDataApiService implements IPokeDataApiService {
    private apiKey: string;
    private baseUrl: string;
    
    constructor(apiKey: string, baseUrl: string = 'https://api.pokedata.io/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    
    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    
    async getCardPricing(cardId: string): Promise<EnhancedPriceData | null> {
        console.log(`[PokeDataApiService] Getting enhanced pricing for card: ${cardId}`);
        
        try {
            // In a real implementation, this would call the PokeData API
            // const response = await axios.get(`${this.baseUrl}/cards/${cardId}/pricing`, { headers: this.getHeaders() });
            // return this.mapApiPricingToEnhancedPriceData(response.data);
            
            // Mock implementation for local testing
            if (cardId === 'sv8pt5-161') {
                return {
                    psaGrades: {
                        '9': { value: 1191.66 },
                        '10': { value: 2868.03 }
                    },
                    cgcGrades: {
                        '8': { value: 1200.00 }
                    },
                    ebayRaw: { value: 752.58 }
                };
            }
            return null;
        } catch (error: any) {
            console.error(`[PokeDataApiService] Error getting enhanced pricing for card ${cardId}: ${error.message}`);
            return null;
        }
    }
    
    // Helper methods for mapping API responses to our models
    private mapApiPricingToEnhancedPriceData(apiPricing: any): EnhancedPriceData | null {
        if (!apiPricing) return null;
        
        const enhancedPricing: EnhancedPriceData = {};
        
        if (apiPricing.psa) {
            enhancedPricing.psaGrades = {};
            Object.entries(apiPricing.psa).forEach(([grade, value]: [string, any]) => {
                enhancedPricing.psaGrades![grade] = { value: value.price || 0 };
            });
        }
        
        if (apiPricing.cgc) {
            enhancedPricing.cgcGrades = {};
            Object.entries(apiPricing.cgc).forEach(([grade, value]: [string, any]) => {
                enhancedPricing.cgcGrades![grade] = { value: value.price || 0 };
            });
        }
        
        if (apiPricing.ebay) {
            enhancedPricing.ebayRaw = { value: apiPricing.ebay.raw || 0 };
        }
        
        return Object.keys(enhancedPricing).length > 0 ? enhancedPricing : null;
    }
}
