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
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "86400"); // 24 hours default
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
                cacheAge = cachedEntry ? (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp) : 0;
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
                // If card found, enhance with pricing data
                if (card) {
                    // Get TCG Player pricing if not already included
                    if (!card.tcgPlayerPrice) {
                        const tcgPlayerPrice = await pokemonTcgApiService.getCardPricing(cardId);
                        if (tcgPlayerPrice) {
                            card.tcgPlayerPrice = tcgPlayerPrice;
                        }
                    }
                    // Get enhanced pricing data
                    const enhancedPricing = await pokeDataApiService.getCardPricing(cardId);
                    if (enhancedPricing) {
                        card.enhancedPricing = enhancedPricing;
                    }
                    // Save to database
                    await cosmosDbService.saveCard(card);
                }
            }
            // Save to cache if found
            if (card && process.env.ENABLE_REDIS_CACHE === "true") {
                await redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(card, cardsTtl), cardsTtl);
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
            cacheAge: cacheHit ? cacheAge : undefined
        };
        return {
            jsonBody: response,
            status: response.status,
            headers: {
                "Cache-Control": `public, max-age=${cardsTtl}`
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