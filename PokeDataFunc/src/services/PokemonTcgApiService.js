"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonTcgApiService = void 0;
class PokemonTcgApiService {
    constructor(apiKey, baseUrl = 'https://api.pokemontcg.io/v2') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    getHeaders() {
        return {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }
    async getAllSets() {
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
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting sets: ${error.message}`);
            return [];
        }
    }
    async getSet(setCode) {
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
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting set ${setCode}: ${error.message}`);
            return null;
        }
    }
    async getCardsBySet(setCode) {
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
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting cards for set ${setCode}: ${error.message}`);
            return [];
        }
    }
    async getCard(cardId) {
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
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting card ${cardId}: ${error.message}`);
            return null;
        }
    }
    async getCardPricing(cardId) {
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
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting pricing for card ${cardId}: ${error.message}`);
            return null;
        }
    }
    // Helper methods for mapping API responses to our models
    mapApiSetToSet(apiSet) {
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
    mapApiCardToCard(apiCard) {
        var _a, _b;
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
            tcgPlayerPrice: this.mapApiPricingToPriceData((_b = (_a = apiCard.tcgplayer) === null || _a === void 0 ? void 0 : _a.prices) === null || _b === void 0 ? void 0 : _b.holofoil) || undefined
        };
    }
    mapApiPricingToPriceData(apiPricing) {
        if (!apiPricing)
            return null;
        return {
            market: apiPricing.market || 0,
            low: apiPricing.low || 0,
            mid: apiPricing.mid || 0,
            high: apiPricing.high || 0
        };
    }
    isCurrentSet(releaseDate) {
        const releaseTimestamp = new Date(releaseDate).getTime();
        const now = Date.now();
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
        return releaseTimestamp > oneYearAgo;
    }
}
exports.PokemonTcgApiService = PokemonTcgApiService;
//# sourceMappingURL=PokemonTcgApiService.js.map