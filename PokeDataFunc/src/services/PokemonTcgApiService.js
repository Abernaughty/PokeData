"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonTcgApiService = void 0;
const axios_1 = __importDefault(require("axios"));
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
            const response = await axios_1.default.get(`${this.baseUrl}/sets`, { headers: this.getHeaders() });
            return response.data.data.map((apiSet) => this.mapApiSetToSet(apiSet));
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting sets: ${error.message}`);
            return [];
        }
    }
    async getSet(setCode) {
        console.log(`[PokemonTcgApiService] Getting set: ${setCode}`);
        try {
            // The API doesn't support direct lookup by set code, so we need to get all sets and filter
            const sets = await this.getAllSets();
            return sets.find(set => set.code === setCode) || null;
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting set ${setCode}: ${error.message}`);
            return null;
        }
    }
    async getCardsBySet(setCode) {
        console.log(`[PokemonTcgApiService] Getting cards for set: ${setCode}`);
        try {
            // Implementation with proper pagination to handle sets with more than 250 cards
            let allCards = [];
            let page = 1;
            let hasMorePages = true;
            const pageSize = 250; // Maximum page size supported by the API
            console.log(`[PokemonTcgApiService] Fetching cards with pagination (pageSize: ${pageSize})`);
            // Keep fetching pages until no more data is returned
            while (hasMorePages) {
                console.log(`[PokemonTcgApiService] Fetching page ${page} for set ${setCode}`);
                const response = await axios_1.default.get(`${this.baseUrl}/cards`, {
                    headers: this.getHeaders(),
                    params: {
                        q: `set.ptcgoCode:${setCode}`,
                        orderBy: 'number',
                        page: page,
                        pageSize: pageSize
                    }
                });
                const pageData = response.data.data || [];
                // Add cards from this page to our collection
                allCards = [...allCards, ...pageData];
                // Check if we need to fetch more pages
                // If we got fewer results than pageSize, we've reached the end
                if (pageData.length < pageSize) {
                    hasMorePages = false;
                    console.log(`[PokemonTcgApiService] Reached the end of pages for set ${setCode} (received ${pageData.length} cards)`);
                }
                else {
                    // If we got a full page, there might be more
                    page++;
                    console.log(`[PokemonTcgApiService] Retrieved ${pageData.length} cards, proceeding to page ${page}`);
                }
            }
            console.log(`[PokemonTcgApiService] Retrieved a total of ${allCards.length} cards for set ${setCode}`);
            // Map API response to our Card model
            return allCards.map((apiCard) => this.mapApiCardToCard(apiCard));
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting cards for set ${setCode}: ${error.message}`);
            return [];
        }
    }
    async getCard(cardId) {
        console.log(`[PokemonTcgApiService] Getting card: ${cardId}`);
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/cards/${cardId}`, { headers: this.getHeaders() });
            return this.mapApiCardToCard(response.data.data);
        }
        catch (error) {
            console.error(`[PokemonTcgApiService] Error getting card ${cardId}: ${error.message}`);
            return null;
        }
    }
    async getCardPricing(cardId) {
        var _a, _b;
        console.log(`[PokemonTcgApiService] Getting pricing for card: ${cardId}`);
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/cards/${cardId}`, { headers: this.getHeaders() });
            return this.mapApiPricingToPriceData((_b = (_a = response.data.data.tcgplayer) === null || _a === void 0 ? void 0 : _a.prices) === null || _b === void 0 ? void 0 : _b.holofoil);
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
        }
        catch (error) {
            console.error(`Error determining if set is current (release date: ${releaseDate}):`, error);
            return false;
        }
    }
}
exports.PokemonTcgApiService = PokemonTcgApiService;
//# sourceMappingURL=PokemonTcgApiService.js.map