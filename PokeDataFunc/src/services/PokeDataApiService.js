"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokeDataApiService = void 0;
const axios_1 = __importDefault(require("axios"));
class PokeDataApiService {
    constructor(apiKey, baseUrl = 'https://www.pokedata.io/v0') {
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        // Cache for sets and cards to minimize API calls
        this.setsCache = { data: null, timestamp: 0 };
        this.cardsCache = {};
        // Code to ID mapping cache
        this.setCodeToIdMap = {};
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    isCacheValid(timestamp) {
        return (Date.now() - timestamp) < this.cacheTTL;
    }
    extractCardIdentifiers(cardId) {
        // Extract the set code portion (before the dash) and the numeric portion (after the dash)
        const match = cardId.match(/(.*)-(\d+.*)/);
        if (match) {
            return {
                setCode: match[1], // The set code (e.g., "sv8pt5")
                number: match[2] // The card number (e.g., "155")
            };
        }
        // Fallback if the format doesn't match
        return {
            setCode: '',
            number: cardId
        };
    }
    /**
     * Get all available sets from PokeData API
     * Caches results to minimize API calls (5 credits per call)
     */
    async getAllSets() {
        console.log(`[PokeDataApiService] Getting all sets`);
        // Check cache first
        if (this.setsCache.data && this.isCacheValid(this.setsCache.timestamp)) {
            console.log(`[PokeDataApiService] Using cached sets data`);
            return this.setsCache.data;
        }
        try {
            const url = `${this.baseUrl}/sets`;
            console.log(`[PokeDataApiService] Making request to: ${url}`);
            const response = await axios_1.default.get(url, { headers: this.getHeaders() });
            if (Array.isArray(response.data)) {
                const sets = response.data;
                console.log(`[PokeDataApiService] Retrieved ${sets.length} sets`);
                // Update cache
                this.setsCache = {
                    data: sets,
                    timestamp: Date.now()
                };
                // Update code to ID mapping
                sets.forEach(set => {
                    if (set.code) {
                        this.setCodeToIdMap[set.code.toLowerCase()] = set.id;
                    }
                });
                return sets;
            }
            console.log(`[PokeDataApiService] Unexpected response format for sets`);
            return [];
        }
        catch (error) {
            console.error(`[PokeDataApiService] Error getting sets: ${error.message}`);
            if (error.response) {
                console.error(`[PokeDataApiService] Response status: ${error.response.status}`);
                console.error(`[PokeDataApiService] Response data:`, error.response.data);
            }
            return [];
        }
    }
    /**
     * Get the numeric ID for a set using its code
     * This is a required step for subsequent API calls
     */
    async getSetIdByCode(setCode) {
        const normalizedCode = setCode.toLowerCase();
        // Check if we already have the mapping cached
        if (this.setCodeToIdMap[normalizedCode]) {
            return this.setCodeToIdMap[normalizedCode];
        }
        // If not in cache, fetch all sets
        const sets = await this.getAllSets();
        // Look for the set with matching code
        const matchingSet = sets.find(set => set.code && set.code.toLowerCase() === normalizedCode);
        if (matchingSet) {
            // Cache the mapping
            this.setCodeToIdMap[normalizedCode] = matchingSet.id;
            return matchingSet.id;
        }
        console.log(`[PokeDataApiService] No set found with code: ${setCode}`);
        return null;
    }
    /**
     * Get all cards in a set using the set's numeric ID
     * @param setId The numeric ID of the set
     */
    async getCardsInSet(setId) {
        var _a;
        console.log(`[PokeDataApiService] Getting cards for set ID: ${setId}`);
        // Check cache first
        if (((_a = this.cardsCache[setId]) === null || _a === void 0 ? void 0 : _a.data) && this.isCacheValid(this.cardsCache[setId].timestamp)) {
            console.log(`[PokeDataApiService] Using cached cards data for set ID: ${setId}`);
            return this.cardsCache[setId].data || [];
        }
        try {
            const url = `${this.baseUrl}/set`;
            const params = {
                set_id: setId
            };
            console.log(`[PokeDataApiService] Making request to: ${url}`);
            console.log(`[PokeDataApiService] With params:`, params);
            const response = await axios_1.default.get(url, {
                params,
                headers: this.getHeaders()
            });
            if (response.data && Array.isArray(response.data)) {
                const cards = response.data;
                console.log(`[PokeDataApiService] Found ${cards.length} cards for set ID ${setId}`);
                // Update cache
                this.cardsCache[setId] = {
                    data: cards,
                    timestamp: Date.now()
                };
                return cards;
            }
            console.log(`[PokeDataApiService] Unexpected response format for set cards`);
            return [];
        }
        catch (error) {
            console.error(`[PokeDataApiService] Error getting cards for set ID ${setId}: ${error.message}`);
            if (error.response) {
                console.error(`[PokeDataApiService] Response status: ${error.response.status}`);
                console.error(`[PokeDataApiService] Response data:`, error.response.data);
            }
            return [];
        }
    }
    /**
     * Get all cards in a set using the set's code
     * This is a convenience method that handles the set ID lookup
     * @param setCode The set code (e.g., "sv8pt5")
     */
    async getCardsInSetByCode(setCode) {
        console.log(`[PokeDataApiService] Getting cards for set code: ${setCode}`);
        // First get the set ID
        const setId = await this.getSetIdByCode(setCode);
        if (setId === null) {
            console.log(`[PokeDataApiService] Couldn't find set ID for code: ${setCode}`);
            return [];
        }
        // Then get the cards using the ID
        return this.getCardsInSet(setId);
    }
    /**
     * Find a card's numeric ID using its set ID and card number
     * @param setId The numeric ID of the set
     * @param cardNumber The card number within the set
     */
    async getCardIdBySetAndNumber(setId, cardNumber) {
        console.log(`[PokeDataApiService] Looking for card with number ${cardNumber} in set ID ${setId}`);
        // Get all cards in the set
        const cards = await this.getCardsInSet(setId);
        // Find matching card by number 
        // Note: In PokeData API, 'num' is the card number (like "076")
        // While 'id' is the unique numeric ID used for API operations
        const matchingCard = cards.find(card => card.num && card.num === cardNumber);
        if (matchingCard) {
            console.log(`[PokeDataApiService] Found card ID ${matchingCard.id} for number ${cardNumber} in set ID ${setId}`);
            return matchingCard.id;
        }
        console.log(`[PokeDataApiService] No matching card found for number ${cardNumber} in set ID ${setId}`);
        return null;
    }
    /**
     * Get pricing data using PokeData's numeric ID
     * @param pokeDataId The numeric ID of the card in PokeData's system
     */
    async getCardPricingById(pokeDataId) {
        console.log(`[PokeDataApiService] Getting pricing for PokeData ID: ${pokeDataId}`);
        try {
            const url = `${this.baseUrl}/pricing`;
            const params = {
                id: pokeDataId,
                asset_type: 'CARD'
            };
            console.log(`[PokeDataApiService] Making request to: ${url}`);
            console.log(`[PokeDataApiService] With params:`, params);
            const response = await axios_1.default.get(url, {
                params,
                headers: this.getHeaders()
            });
            if (response.data && response.data.pricing) {
                console.log(`[PokeDataApiService] Successfully retrieved pricing data for ID ${pokeDataId}`);
                return response.data.pricing;
            }
            console.log(`[PokeDataApiService] No pricing data found for ID ${pokeDataId}`);
            return null;
        }
        catch (error) {
            console.error(`[PokeDataApiService] Error getting pricing for ID ${pokeDataId}: ${error.message}`);
            if (error.response) {
                console.error(`[PokeDataApiService] Response status: ${error.response.status}`);
                console.error(`[PokeDataApiService] Response data:`, error.response.data);
            }
            return null;
        }
    }
    /**
     * Get card pricing using the Pokemon TCG API card ID (e.g., "sv8pt5-161")
     * This method will:
     * 1. Try to use provided pokeDataId if available
     * 2. If not, try to find the PokeData ID using the set code and card number
     * 3. Fall back to legacy method if needed (just using card number)
     */
    async getCardPricing(cardId, pokeDataId) {
        console.log(`[PokeDataApiService] Getting enhanced pricing for card: ${cardId}`);
        // If pokeDataId is provided, use it directly
        if (pokeDataId) {
            console.log(`[PokeDataApiService] Using provided PokeData ID: ${pokeDataId}`);
            const pricing = await this.getCardPricingById(pokeDataId);
            if (pricing) {
                return this.mapApiPricingToEnhancedPriceData({ pricing });
            }
            return null;
        }
        // Extract identifiers from card ID
        const identifiers = this.extractCardIdentifiers(cardId);
        // If we have a valid set code, try to find the card ID the proper way
        if (identifiers.setCode) {
            console.log(`[PokeDataApiService] Attempting to find PokeData ID for set ${identifiers.setCode} card ${identifiers.number}`);
            try {
                // Step 1: Get the set ID
                const setId = await this.getSetIdByCode(identifiers.setCode);
                if (setId) {
                    // Step 2: Get the card ID using set ID and card number
                    const cardPokeDataId = await this.getCardIdBySetAndNumber(setId, identifiers.number);
                    if (cardPokeDataId) {
                        // Step 3: Get pricing using the found ID
                        console.log(`[PokeDataApiService] Found PokeData ID ${cardPokeDataId} for card ${cardId}`);
                        const pricing = await this.getCardPricingById(cardPokeDataId);
                        if (pricing) {
                            return this.mapApiPricingToEnhancedPriceData({ pricing });
                        }
                    }
                }
            }
            catch (error) {
                console.error(`[PokeDataApiService] Error in ID-based lookup for ${cardId}: ${error.message}`);
            }
        }
        // Fall back to the legacy method if the proper approach failed
        console.log(`[PokeDataApiService] Falling back to legacy method using card number: ${identifiers.number}`);
        try {
            const url = `${this.baseUrl}/pricing`;
            const params = {
                id: identifiers.number,
                asset_type: 'CARD'
            };
            console.log(`[PokeDataApiService] Making request to: ${url}`);
            console.log(`[PokeDataApiService] With params:`, params);
            const response = await axios_1.default.get(url, {
                params,
                headers: this.getHeaders()
            });
            console.log(`[PokeDataApiService] API response status: ${response.status}`);
            if (response.data && response.data.name) {
                console.log(`[PokeDataApiService] Retrieved data for card: ${response.data.name}`);
                // Add warning if the card appears to be from a different set than expected
                if (identifiers.setCode && !response.data.name.toLowerCase().includes(identifiers.setCode.toLowerCase())) {
                    console.warn(`[PokeDataApiService] Warning: Card from different set than requested. Expected set code ${identifiers.setCode}, got data for ${response.data.name}`);
                }
            }
            return this.mapApiPricingToEnhancedPriceData(response.data);
        }
        catch (error) {
            console.error(`[PokeDataApiService] Error in fallback pricing lookup for card ${cardId}: ${error.message}`);
            if (error.response) {
                console.error(`[PokeDataApiService] Response status: ${error.response.status}`);
                console.error(`[PokeDataApiService] Response data:`, error.response.data);
            }
            return null;
        }
    }
    // Helper methods for mapping API responses to our models
    mapApiPricingToEnhancedPriceData(apiPricing) {
        if (!apiPricing)
            return null;
        console.log(`[PokeDataApiService] Mapping API pricing data:`, JSON.stringify(apiPricing).substring(0, 200) + '...');
        const enhancedPricing = {};
        // Initialize with empty objects for PSA and CGC grades
        const psaGrades = {};
        const cgcGradesObj = {};
        // Process PSA grades
        for (let i = 1; i <= 10; i++) {
            const grade = i === 10 ? '10.0' : `${i}.0`;
            const key = `PSA ${grade}`;
            if (apiPricing.pricing && apiPricing.pricing[key] && apiPricing.pricing[key].value > 0) {
                const gradeKey = String(i); // Store as "1", "2", etc.
                psaGrades[gradeKey] = {
                    value: apiPricing.pricing[key].value
                };
            }
        }
        // Process CGC grades (including half grades)
        const cgcGradeValues = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'];
        cgcGradeValues.forEach(grade => {
            const key = `CGC ${grade}`;
            if (apiPricing.pricing && apiPricing.pricing[key] && apiPricing.pricing[key].value > 0) {
                // Convert "8.5" to "8_5" for storage
                const gradeKey = grade.replace('.', '_');
                cgcGradesObj[gradeKey] = {
                    value: apiPricing.pricing[key].value
                };
            }
        });
        // Process eBay Raw pricing
        if (apiPricing.pricing && apiPricing.pricing['eBay Raw'] && apiPricing.pricing['eBay Raw'].value > 0) {
            enhancedPricing.ebayRaw = {
                value: apiPricing.pricing['eBay Raw'].value
            };
        }
        // Only add grade objects if they have data
        if (Object.keys(psaGrades).length > 0) {
            enhancedPricing.psaGrades = psaGrades;
        }
        if (Object.keys(cgcGradesObj).length > 0) {
            enhancedPricing.cgcGrades = cgcGradesObj;
        }
        return Object.keys(enhancedPricing).length > 0 ? enhancedPricing : null;
    }
}
exports.PokeDataApiService = PokeDataApiService;
//# sourceMappingURL=PokeDataApiService.js.map