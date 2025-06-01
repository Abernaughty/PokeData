"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardInfo = getCardInfo;
const cacheUtils_1 = require("../../utils/cacheUtils");
const imageUtils_1 = require("../../utils/imageUtils");
const errorUtils_1 = require("../../utils/errorUtils");
const index_1 = require("../../index");
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
            const cachedEntry = await index_1.redisCacheService.get(cacheKey);
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
            card = await index_1.cosmosDbService.getCard(cardId);
            // If not in database, fetch from external API
            if (!card) {
                context.log(`Card not found in database, fetching from API: ${cardId}`);
                card = await index_1.pokemonTcgApiService.getCard(cardId);
                // If card found, enhance with pricing data
                if (card) {
                    // Get TCG Player pricing if not already included
                    if (!card.tcgPlayerPrice) {
                        const tcgPlayerPrice = await index_1.pokemonTcgApiService.getCardPricing(cardId);
                        if (tcgPlayerPrice) {
                            card.tcgPlayerPrice = tcgPlayerPrice;
                        }
                    }
                    // Get enhanced pricing data
                    const enhancedPricing = await index_1.pokeDataApiService.getCardPricing(cardId);
                    if (enhancedPricing) {
                        card.enhancedPricing = enhancedPricing;
                    }
                    // Save to database
                    await index_1.cosmosDbService.saveCard(card);
                }
            }
            // Save to cache if found
            if (card && process.env.ENABLE_REDIS_CACHE === "true") {
                await index_1.redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(card, cardsTtl), cardsTtl);
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
            blobStorageService: index_1.blobStorageService
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
//# sourceMappingURL=index.js.map