"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardsBySet = getCardsBySet;
const functions_1 = require("@azure/functions");
const cacheUtils_1 = require("../src/utils/cacheUtils");
const imageUtils_1 = require("../src/utils/imageUtils");
const errorUtils_1 = require("../src/utils/errorUtils");
const CosmosDbService_1 = require("../src/services/CosmosDbService");
const RedisCacheService_1 = require("../src/services/RedisCacheService");
const BlobStorageService_1 = require("../src/services/BlobStorageService");
const PokemonTcgApiService_1 = require("../src/services/PokemonTcgApiService");
// Initialize services
const cosmosDbService = new CosmosDbService_1.CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const redisCacheService = new RedisCacheService_1.RedisCacheService(process.env.REDIS_CONNECTION_STRING || "", process.env.ENABLE_REDIS_CACHE === "true");
const blobStorageService = new BlobStorageService_1.BlobStorageService(process.env.BLOB_STORAGE_CONNECTION_STRING || "");
const pokemonTcgApiService = new PokemonTcgApiService_1.PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY || "", process.env.POKEMON_TCG_API_BASE_URL);
async function getCardsBySet(request, context) {
    try {
        // Get set code from route parameters
        const setCode = request.params.setCode;
        if (!setCode) {
            const errorResponse = (0, errorUtils_1.createBadRequestError)("Set code is required", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        context.log(`Processing request for cards in set: ${setCode}`);
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const page = parseInt(request.query.get("page") || "1");
        const pageSize = parseInt(request.query.get("pageSize") || "100");
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "86400"); // 24 hours default
        // Validate pagination parameters
        if (page < 1 || pageSize < 1 || pageSize > 500) {
            const errorResponse = (0, errorUtils_1.createBadRequestError)("Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 500.", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = (0, cacheUtils_1.getCardsForSetCacheKey)(setCode);
        let cards = null;
        let cacheHit = false;
        let cacheAge = 0;
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await redisCacheService.get(cacheKey);
            cards = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            if (cards) {
                context.log(`Cache hit for cards in set: ${setCode}`);
                cacheHit = true;
                cacheAge = cachedEntry ? (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp) : 0;
            }
        }
        // If not in cache, check Cosmos DB
        if (!cards) {
            context.log(`Cache miss for cards in set: ${setCode}, checking database`);
            cards = await cosmosDbService.getCardsBySet(setCode);
            // If not in database, fetch from external API
            if (!cards || cards.length === 0) {
                context.log(`Cards for set not found in database, fetching from API: ${setCode}`);
                cards = await pokemonTcgApiService.getCardsBySet(setCode);
                // Save to database if found
                if (cards && cards.length > 0) {
                    // Save each card to the database
                    for (const card of cards) {
                        await cosmosDbService.saveCard(card);
                    }
                }
            }
            // Save to cache if found
            if (cards && cards.length > 0 && process.env.ENABLE_REDIS_CACHE === "true") {
                await redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(cards, cardsTtl), cardsTtl);
            }
        }
        if (!cards || cards.length === 0) {
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Cards for set", setCode, "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        // Process image URLs for all cards
        const imageOptions = {
            cdnEndpoint: process.env.CDN_ENDPOINT || "",
            sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid"),
            enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
        };
        // Apply pagination
        const totalCount = cards.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        const paginatedCards = cards.slice(startIndex, endIndex);
        // Process image URLs for paginated cards
        const processedCards = [];
        for (const card of paginatedCards) {
            const processedCard = await (0, imageUtils_1.processImageUrls)(card, {
                ...imageOptions,
                blobStorageService
            });
            processedCards.push(processedCard);
        }
        // Create paginated response
        const paginatedResponse = {
            items: processedCards,
            totalCount,
            pageSize,
            pageNumber: page,
            totalPages
        };
        // Return the cards data
        const response = {
            status: 200,
            data: paginatedResponse,
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
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetCardsBySet");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
functions_1.app.http('getCardsBySet', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets/{setCode}/cards',
    handler: getCardsBySet
});
//# sourceMappingURL=index.js.map