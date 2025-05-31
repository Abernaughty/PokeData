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
async function enrichCardWithPokeDataId(cardToEnrich, context, correlationId) {
    try {
        context.log(`[${correlationId}] ENTER enrichCardWithPokeDataId for card ${cardToEnrich.id} with setCode ${cardToEnrich.setCode}`);
        // Get cards in the set from PokeData API
        const apiStartTime = Date.now();
        context.log(`[${correlationId}] Fetching cards for set ${cardToEnrich.setCode} from PokeData API`);
        const pokeDataCards = await pokeDataApiService.getCardsInSetByCode(cardToEnrich.setCode);
        const apiEndTime = Date.now();
        context.log(`[${correlationId}] API call to get cards completed in ${apiEndTime - apiStartTime}ms`);
        if (pokeDataCards && pokeDataCards.length > 0) {
            context.log(`[${correlationId}] Retrieved ${pokeDataCards.length} cards from PokeData API for set ${cardToEnrich.setCode}`);
            // Log first few cards for debugging
            if (pokeDataCards.length > 0) {
                context.log(`[${correlationId}] Sample cards: ${JSON.stringify(pokeDataCards.slice(0, 3).map(c => ({ id: c.id, num: c.num, name: c.name })))}`);
            }
            // Find the matching card by card number
            // Note: Must use exact matching as card numbers in PokeData are formatted exactly (no padding)
            context.log(`[${correlationId}] Looking for card with number "${cardToEnrich.cardNumber}" in set`);
            const matchingCard = pokeDataCards.find(pdc => pdc.num === cardToEnrich.cardNumber);
            // If no exact match found, try with leading zeros removed
            // This handles cases where our cardNumber might be "076" but PokeData has "76"
            if (!matchingCard) {
                const trimmedNumber = cardToEnrich.cardNumber.replace(/^0+/, '');
                context.log(`[${correlationId}] No exact match found, trying with trimmed number: "${trimmedNumber}"`);
                // Log all card numbers in the set for comparison
                const allCardNumbers = pokeDataCards.map(c => c.num).sort();
                context.log(`[${correlationId}] All card numbers in set: ${JSON.stringify(allCardNumbers)}`);
                const altMatch = pokeDataCards.find(pdc => pdc.num === trimmedNumber);
                if (altMatch) {
                    context.log(`[${correlationId}] Found card with trimmed number "${trimmedNumber}" instead of "${cardToEnrich.cardNumber}". Card details: ${JSON.stringify({ id: altMatch.id, name: altMatch.name, num: altMatch.num })}`);
                    cardToEnrich.pokeDataId = altMatch.id;
                    return true;
                }
                else {
                    context.log(`[${correlationId}] No match found even with trimmed number "${trimmedNumber}"`);
                }
            }
            if (matchingCard) {
                context.log(`[${correlationId}] Found matching PokeData card: ${matchingCard.name} with ID: ${matchingCard.id}`);
                cardToEnrich.pokeDataId = matchingCard.id;
                return true;
            }
            else {
                context.log(`[${correlationId}] No matching card found for number ${cardToEnrich.cardNumber} in set ${cardToEnrich.setCode}`);
            }
        }
        else {
            context.log(`[${correlationId}] No cards returned from PokeData API for set ${cardToEnrich.setCode}`);
        }
    }
    catch (error) {
        context.log(`[${correlationId}] ERROR: Error enriching card with PokeData ID: ${error.message}`);
        context.log(`[${correlationId}] ERROR: Error stack: ${error.stack}`);
        // If there's a response object, log that too
        if (error.response) {
            context.log(`[${correlationId}] ERROR: Error response status: ${error.response.status}`);
            context.log(`[${correlationId}] ERROR: Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }
    const success = false;
    context.log(`[${correlationId}] EXIT enrichCardWithPokeDataId, result: ${success}`);
    return success;
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
// Helper function to log card state for debugging
function logCardState(card, stage, context, correlationId) {
    context.log(`[${correlationId}] CARD STATE at ${stage}: ${JSON.stringify({
        id: card.id,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        pokeDataId: card.pokeDataId,
        hasPricing: !!card.pricing,
        pricingCount: card.pricing ? Object.keys(card.pricing).length : 0,
        pricingLastUpdated: card.pricingLastUpdated,
        hasEnhancedPricing: !!card.enhancedPricing,
        enhancedPricingKeys: card.enhancedPricing ? Object.keys(card.enhancedPricing) : [],
        enhancedPricingCount: card.enhancedPricing ? Object.keys(card.enhancedPricing).length : 0
    })}`);
}
async function getCardInfo(request, context) {
    var _a;
    // Generate a correlation ID for request tracking
    const correlationId = `card-${request.params.cardId || 'unknown'}-${Date.now()}`;
    // Log environment configuration
    context.log(`[${correlationId}] CONFIGURATION:
    ENABLE_REDIS_CACHE: ${process.env.ENABLE_REDIS_CACHE}
    CACHE_TTL_CARDS: ${process.env.CACHE_TTL_CARDS}
    IMAGE_SOURCE_STRATEGY: ${process.env.IMAGE_SOURCE_STRATEGY}
    ENABLE_CDN_IMAGES: ${process.env.ENABLE_CDN_IMAGES}
    POKEDATA_API_BASE_URL: ${(_a = process.env.POKEDATA_API_BASE_URL) === null || _a === void 0 ? void 0 : _a.substring(0, 20)}...
`);
    try {
        // Start timing the request
        const startTime = Date.now();
        // Get card ID from route parameters
        const cardId = request.params.cardId;
        if (!cardId) {
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Card ID", "missing", "GetCardInfo");
            context.log(`[${correlationId}] Missing card ID in request`);
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        context.log(`[${correlationId}] Processing request for card: ${cardId}`);
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        // Ensure cardsTtl is a valid number
        let cardsTtl = 86400; // 24 hours default
        try {
            const ttlFromEnv = parseInt(process.env.CACHE_TTL_CARDS || "86400");
            cardsTtl = !isNaN(ttlFromEnv) ? ttlFromEnv : 86400;
        }
        catch (e) {
            context.log(`[${correlationId}] Error parsing CACHE_TTL_CARDS, using default: ${e.message}`);
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
                context.log(`[${correlationId}] Cache hit for card: ${cardId}`);
                cacheHit = true;
                // Ensure cachedEntry is not null before calling getCacheAge
                if (cachedEntry) {
                    cacheAge = (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp);
                    context.log(`[${correlationId}] Cache entry age: ${cacheAge} seconds (${Math.round(cacheAge / 3600)} hours)`);
                }
            }
        }
        // If not in cache, check Cosmos DB
        if (!card) {
            context.log(`[${correlationId}] Cache miss for card: ${cardId}, checking database`);
            const dbStartTime = Date.now();
            card = await cosmosDbService.getCard(cardId);
            const dbEndTime = Date.now();
            context.log(`[${correlationId}] Database lookup completed in ${dbEndTime - dbStartTime}ms, found: ${!!card}`);
            // If not in database, fetch from external API
            if (!card) {
                context.log(`[${correlationId}] Card not found in database, fetching from Pokemon TCG API: ${cardId}`);
                const apiStartTime = Date.now();
                card = await pokemonTcgApiService.getCard(cardId);
                const apiEndTime = Date.now();
                context.log(`[${correlationId}] Pokemon TCG API call completed in ${apiEndTime - apiStartTime}ms, card found: ${!!card}`);
                // If card found, save to database
                if (card) {
                    context.log(`[${correlationId}] Card found in Pokemon TCG API, saving to database`);
                    const dbSaveStart = Date.now();
                    await cosmosDbService.saveCard(card);
                    const dbSaveEnd = Date.now();
                    context.log(`[${correlationId}] Card saved to database in ${dbSaveEnd - dbSaveStart}ms`);
                    // Log the initial state of the card
                    logCardState(card, "INITIAL_FROM_TCG_API", context, correlationId);
                }
            }
        }
        // Now that we have the card (from cache, DB, or API), check for enrichment
        if (card) {
            // Log card state before enrichment using our helper
            logCardState(card, "BEFORE_ENRICHMENT", context, correlationId);
            let cardUpdated = false;
            // Evaluate and log all condition results
            const condition1 = !card.pokeDataId;
            const condition2 = card.pokeDataId && (forceRefresh || !card.pricing || !card.pricingLastUpdated || isPricingStale(card.pricingLastUpdated));
            const condition3 = card.pokeDataId && (!card.enhancedPricing || Object.keys(card.enhancedPricing || {}).length === 0);
            context.log(`[${correlationId}] Enrichment condition evaluations:`);
            context.log(`[${correlationId}] - condition1 (!card.pokeDataId): ${condition1}`);
            if (condition2) {
                context.log(`[${correlationId}] - condition2 breakdown: forceRefresh=${forceRefresh}, !card.pricing=${!card.pricing}, !card.pricingLastUpdated=${!card.pricingLastUpdated}, isPricingStale=${card.pricingLastUpdated ? isPricingStale(card.pricingLastUpdated) : 'N/A'}`);
                if (card.pricingLastUpdated) {
                    const lastUpdate = new Date(card.pricingLastUpdated).getTime();
                    const now = Date.now();
                    const oneDayMs = 24 * 60 * 60 * 1000;
                    context.log(`[${correlationId}] - pricingLastUpdated: ${card.pricingLastUpdated}, age: ${(now - lastUpdate) / oneDayMs} days`);
                }
            }
            context.log(`[${correlationId}] - condition3 (missing enhanced pricing): ${condition3}`);
            if (condition3) {
                context.log(`[${correlationId}] - enhancedPricing check: enhancedPricing exists=${!!card.enhancedPricing}, keys count=${card.enhancedPricing ? Object.keys(card.enhancedPricing).length : 0}`);
            }
            if (card.enhancedPricing) {
                context.log(`[${correlationId}] Enhanced pricing keys: ${Object.keys(card.enhancedPricing).join(', ')}`);
                context.log(`[${correlationId}] Enhanced pricing size: ${Object.keys(card.enhancedPricing).length}`);
                // If there are any keys, log a sample of the data
                const keys = Object.keys(card.enhancedPricing);
                if (keys.length > 0) {
                    const sampleKey = keys[0];
                    // Use a type assertion to tell TypeScript this is valid
                    const sampleData = card.enhancedPricing[sampleKey];
                    context.log(`[${correlationId}] Sample enhanced pricing data for key ${sampleKey}: ${JSON.stringify(sampleData)}`);
                }
            }
            // Check if card needs PokeData ID
            if (!card.pokeDataId) {
                context.log(`[${correlationId}] Card ${cardId} missing PokeData ID, attempting to find it`);
                const enrichStartTime = Date.now();
                const enrichResult = await enrichCardWithPokeDataId(card, context, correlationId);
                const enrichEndTime = Date.now();
                context.log(`[${correlationId}] PokeData ID enrichment completed in ${enrichEndTime - enrichStartTime}ms with result: ${enrichResult}`);
                if (enrichResult) {
                    context.log(`[${correlationId}] Successfully added PokeData ID: ${card.pokeDataId} to card ${cardId}`);
                    cardUpdated = true;
                    // If we now have a pokeDataId, we can fetch pricing
                    // Ensure pokeDataId is not undefined
                    if (card.pokeDataId) {
                        context.log(`[${correlationId}] Fetching pricing data for newly found PokeData ID: ${card.pokeDataId}`);
                        const pricingStartTime = Date.now();
                        const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                        const pricingEndTime = Date.now();
                        context.log(`[${correlationId}] Pricing data fetch completed in ${pricingEndTime - pricingStartTime}ms, pricing found: ${!!freshPricing}`);
                        if (freshPricing) {
                            context.log(`[${correlationId}] Retrieved pricing data for PokeData ID: ${card.pokeDataId}`);
                            card.pricing = freshPricing;
                            card.pricingLastUpdated = new Date().toISOString();
                            const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                            card.enhancedPricing = enhancedPricing || undefined;
                        }
                        else {
                            context.log(`[${correlationId}] No pricing data available for PokeData ID: ${card.pokeDataId}`);
                        }
                    }
                }
                else {
                    context.log(`[${correlationId}] Failed to find PokeData ID for card ${cardId}`);
                }
            }
            // Check if card has PokeData ID but needs pricing refresh
            else if (condition2) {
                context.log(`[${correlationId}] Entering condition2 branch (needs pricing refresh)`);
                context.log(`[${correlationId}] Card has PokeData ID ${card.pokeDataId} but needs pricing refresh`);
                // Get pricing directly using the PokeData ID
                const pricingStartTime = Date.now();
                const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                const pricingEndTime = Date.now();
                context.log(`[${correlationId}] Pricing data fetch completed in ${pricingEndTime - pricingStartTime}ms, pricing found: ${!!freshPricing}`);
                if (freshPricing) {
                    // Update the card's pricing data
                    card.pricing = freshPricing;
                    card.pricingLastUpdated = new Date().toISOString();
                    // For backward compatibility - convert null to undefined if needed
                    const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                    card.enhancedPricing = enhancedPricing || undefined;
                    cardUpdated = true;
                    context.log(`[${correlationId}] Updated card ${cardId} with fresh pricing data`);
                    // Log the updated card state after pricing refresh
                    logCardState(card, "AFTER_PRICING_REFRESH", context, correlationId);
                }
                else {
                    context.log(`[${correlationId}] Failed to fetch pricing data for PokeData ID: ${card.pokeDataId}`);
                }
            }
            // Check if card has PokeData ID but is missing enhanced pricing data
            else if (condition3) {
                context.log(`[${correlationId}] Entering condition3 branch (missing enhanced pricing)`);
                context.log(`[${correlationId}] Card has PokeData ID ${card.pokeDataId} but is missing enhanced pricing data`);
                // Get pricing directly using the PokeData ID
                const pricingStartTime = Date.now();
                const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                const pricingEndTime = Date.now();
                context.log(`[${correlationId}] Pricing data fetch completed in ${pricingEndTime - pricingStartTime}ms, pricing found: ${!!freshPricing}`);
                if (freshPricing) {
                    // Update the card's pricing data
                    card.pricing = freshPricing;
                    card.pricingLastUpdated = new Date().toISOString();
                    // For backward compatibility - convert null to undefined if needed
                    const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                    card.enhancedPricing = enhancedPricing || undefined;
                    cardUpdated = true;
                    context.log(`[${correlationId}] Added enhanced pricing data to card ${cardId}`);
                    // Log the updated card state after pricing refresh
                    logCardState(card, "AFTER_ENHANCED_PRICING_ADDED", context, correlationId);
                }
                else {
                    context.log(`[${correlationId}] Failed to fetch enhanced pricing data for PokeData ID: ${card.pokeDataId}`);
                }
            }
            else {
                context.log(`[${correlationId}] No enrichment conditions were met, card already has all data`);
            }
            // Save the updated card to database if changes were made
            if (cardUpdated) {
                context.log(`[${correlationId}] Saving updated card to database`);
                const dbUpdateStart = Date.now();
                await cosmosDbService.updateCard(card);
                const dbUpdateEnd = Date.now();
                context.log(`[${correlationId}] Card updated in database in ${dbUpdateEnd - dbUpdateStart}ms`);
                // Update cache if enabled
                if (process.env.ENABLE_REDIS_CACHE === "true") {
                    context.log(`[${correlationId}] Updating card in cache`);
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