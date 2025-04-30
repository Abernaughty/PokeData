"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokeDataApiService = void 0;
class PokeDataApiService {
    constructor(apiKey, baseUrl = 'https://api.pokedata.io/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    async getCardPricing(cardId) {
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
        }
        catch (error) {
            console.error(`[PokeDataApiService] Error getting enhanced pricing for card ${cardId}: ${error.message}`);
            return null;
        }
    }
    // Helper methods for mapping API responses to our models
    mapApiPricingToEnhancedPriceData(apiPricing) {
        if (!apiPricing)
            return null;
        const enhancedPricing = {};
        if (apiPricing.psa) {
            enhancedPricing.psaGrades = {};
            Object.entries(apiPricing.psa).forEach(([grade, value]) => {
                enhancedPricing.psaGrades[grade] = { value: value.price || 0 };
            });
        }
        if (apiPricing.cgc) {
            enhancedPricing.cgcGrades = {};
            Object.entries(apiPricing.cgc).forEach(([grade, value]) => {
                enhancedPricing.cgcGrades[grade] = { value: value.price || 0 };
            });
        }
        if (apiPricing.ebay) {
            enhancedPricing.ebayRaw = { value: apiPricing.ebay.raw || 0 };
        }
        return Object.keys(enhancedPricing).length > 0 ? enhancedPricing : null;
    }
}
exports.PokeDataApiService = PokeDataApiService;
//# sourceMappingURL=PokeDataApiService.js.map