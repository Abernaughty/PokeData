"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardInfo = getCardInfo;
const functions_1 = require("@azure/functions");
const cacheUtils_1 = require("../src/utils/cacheUtils");
const imageUtils_1 = require("../src/utils/imageUtils");
const errorUtils_1 = require("../src/utils/errorUtils");
const CosmosDbService_1 = require("../src/services/CosmosDbService");
const RedisCacheService_1 = require("../src/services/RedisCacheService");
const BlobStorageService_1 = require("../src/services/BlobStorageService");
const PokemonTcgApiService_1 = require("../src/services/PokemonTcgApiService");
const PokeDataApiService_1 = require("../src/services/PokeDataApiService");
// Initialize services
const cosmosDbService = new CosmosDbService_1.CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const redisCacheService = new RedisCacheService_1.RedisCacheService(process.env.REDIS_CONNECTION_STRING || "", process.env.ENABLE_REDIS_CACHE === "true");
const blobStorageService = new BlobStorageService_1.BlobStorageService(process.env.BLOB_STORAGE_CONNECTION_STRING || "");
const pokemonTcgApiService = new PokemonTcgApiService_1.PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY || "", process.env.POKEMON_TCG_API_BASE_URL);
const pokeDataApiService = new PokeDataApiService_1.PokeDataApiService(process.env.POKEDATA_API_KEY || "", process.env.POKEDATA_API_BASE_URL);
// Helper function to enrich a card with its PokeData ID
async function enrichCardWithPokeDataId(cardToEnrich, ctx) {
    try {
        ctx.log(`[GetCardInfo] Starting enrichment for card ${cardToEnrich.id} with setCode ${cardToEnrich.setCode}`);
        // Get cards in the set from PokeData API
        const pokeDataCards = await pokeDataApiService.getCardsInSetByCode(cardToEnrich.setCode);
        if (pokeDataCards && pokeDataCards.length > 0) {
            ctx.log(`[GetCardInfo] Retrieved ${pokeDataCards.length} cards from PokeData API for set ${cardToEnrich.setCode}`);
            // Find the matching card by card number
            // Note: Must use exact matching as card numbers in PokeData are formatted exactly (no padding)
            const matchingCard = pokeDataCards.find(pdc => pdc.num === cardToEnrich.cardNumber);
            // If no exact match found, try with leading zeros removed
            // This handles cases where our cardNumber might be "076" but PokeData has "76"
            if (!matchingCard) {
                const trimmedNumber = cardToEnrich.cardNumber.replace(/^0+/, '');
                ctx.log(`[GetCardInfo] No exact match found, trying with trimmed number: ${trimmedNumber}`);
                const altMatch = pokeDataCards.find(pdc => pdc.num === trimmedNumber);
                if (altMatch) {
                    ctx.log(`[GetCardInfo] Found card with trimmed number ${trimmedNumber} instead of ${cardToEnrich.cardNumber}`);
                    cardToEnrich.pokeDataId = altMatch.id;
                    return true;
                }
            }
            if (matchingCard) {
                ctx.log(`[GetCardInfo] Found matching PokeData card: ${matchingCard.name} with ID: ${matchingCard.id}`);
                cardToEnrich.pokeDataId = matchingCard.id;
                return true;
            }
            else {
                ctx.log(`[GetCardInfo] No matching card found for number ${cardToEnrich.cardNumber} in set ${cardToEnrich.setCode}`);
            }
        }
        else {
            ctx.log(`[GetCardInfo] No cards returned from PokeData API for set ${cardToEnrich.setCode}`);
        }
    }
    catch (error) {
        ctx.log(`[GetCardInfo] Error enriching card with PokeData ID: ${error.message}`);
    }
    return false;
}
// Helper function to check if pricing data is stale
function isPricingStale(timestamp) {
    if (!timestamp)
        return true;
    const lastUpdate = new Date(timestamp).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (now - lastUpdate) > oneDayMs;
}
async function getCardInfo(request, context) {
    try {
        // Get card ID from route parameters
        const cardId = request.params.cardId;
        if (!cardId) {
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Card ID", "missing", "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        context.log(`Processing request for card: ${cardId}`);
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        // Ensure cardsTtl is a valid number
        let cardsTtl = 86400; // 24 hours default
        try {
            const ttlFromEnv = parseInt(process.env.CACHE_TTL_CARDS || "86400");
            cardsTtl = !isNaN(ttlFromEnv) ? ttlFromEnv : 86400;
        }
        catch (e) {
            context.log(`[GetCardInfo] Error parsing CACHE_TTL_CARDS, using default: ${e.message}`);
        }
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = (0, cacheUtils_1.getCardCacheKey)(cardId);
        let card = null;
        let cacheHit = false;
        let cacheAge = 0;
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await redisCacheService.get(cacheKey);
            card = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            if (card) {
                context.log(`Cache hit for card: ${cardId}`);
                cacheHit = true;
                // Ensure cachedEntry is not null before calling getCacheAge
                if (cachedEntry) {
                    cacheAge = (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp);
                }
            }
        }
        // If not in cache, check Cosmos DB
        if (!card) {
            context.log(`Cache miss for card: ${cardId}, checking database`);
            card = await cosmosDbService.getCard(cardId);
            // If not in database, fetch from external API
            if (!card) {
                context.log(`Card not found in database, fetching from API: ${cardId}`);
                card = await pokemonTcgApiService.getCard(cardId);
                // If card found, save to database
                if (card) {
                    context.log(`[GetCardInfo] Card found in Pokemon TCG API, saving to database`);
                    await cosmosDbService.saveCard(card);
                }
            }
        }
        // Now that we have the card (from cache, DB, or API), check for enrichment
        if (card) {
            // Log card state before enrichment
            context.log(`[GetCardInfo] Card state before enrichment check: id=${card.id}, setCode=${card.setCode}, hasPokeDataId=${!!card.pokeDataId}, hasPricing=${!!card.pricing}`);
            let cardUpdated = false;
            // Check if card needs PokeData ID
            if (!card.pokeDataId) {
                context.log(`[GetCardInfo] Card ${cardId} missing PokeData ID, attempting to find it`);
                const enrichResult = await enrichCardWithPokeDataId(card, context);
                if (enrichResult) {
                    context.log(`[GetCardInfo] Successfully added PokeData ID: ${card.pokeDataId} to card ${cardId}`);
                    cardUpdated = true;
                    // If we now have a pokeDataId, we can fetch pricing
                    // Ensure pokeDataId is not undefined
                    if (card.pokeDataId) {
                        const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                        if (freshPricing) {
                            context.log(`[GetCardInfo] Retrieved pricing data for PokeData ID: ${card.pokeDataId}`);
                            card.pricing = freshPricing;
                            card.pricingLastUpdated = new Date().toISOString();
                            const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                            card.enhancedPricing = enhancedPricing || undefined;
                        }
                        else {
                            context.log(`[GetCardInfo] No pricing data available for PokeData ID: ${card.pokeDataId}`);
                        }
                    }
                }
                else {
                    context.log(`[GetCardInfo] Failed to find PokeData ID for card ${cardId}`);
                }
            }
            // Check if card has PokeData ID but needs pricing refresh
            else if (card.pokeDataId && (forceRefresh || !card.pricing || !card.pricingLastUpdated || isPricingStale(card.pricingLastUpdated))) {
                context.log(`[GetCardInfo] Card has PokeData ID ${card.pokeDataId} but needs pricing refresh`);
                // Get pricing directly using the PokeData ID
                const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                if (freshPricing) {
                    // Update the card's pricing data
                    card.pricing = freshPricing;
                    card.pricingLastUpdated = new Date().toISOString();
                    // For backward compatibility - convert null to undefined if needed
                    const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                    card.enhancedPricing = enhancedPricing || undefined;
                    cardUpdated = true;
                    context.log(`[GetCardInfo] Updated card ${cardId} with fresh pricing data`);
                }
                else {
                    context.log(`[GetCardInfo] Failed to fetch pricing data for PokeData ID: ${card.pokeDataId}`);
                }
            }
            // Save the updated card to database if changes were made
            if (cardUpdated) {
                context.log(`[GetCardInfo] Saving updated card to database`);
                await cosmosDbService.updateCard(card);
                // Update cache if enabled
                if (process.env.ENABLE_REDIS_CACHE === "true") {
                    context.log(`[GetCardInfo] Updating card in cache`);
                    // Use a hardcoded number for the ttl parameter
                    await redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(card, 86400), 86400);
                }
            }
        }
        if (!card) {
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Card", cardId, "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        // Process image URLs
        const imageOptions = {
            cdnEndpoint: process.env.CDN_ENDPOINT || "",
            sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid"),
            enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
        };
        card = await (0, imageUtils_1.processImageUrls)(card, {
            ...imageOptions,
            blobStorageService
        });
        // Return the card data
        const response = {
            status: 200,
            data: card,
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : 0
        };
        return {
            jsonBody: response,
            status: response.status,
            headers: {
                "Cache-Control": `public, max-age=86400`
            }
        };
    }
    catch (error) {
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetCardInfo");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
functions_1.app.http('getCardInfo', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'cards/{cardId}',
    handler: getCardInfo
});
//# sourceMappingURL=index.js.map