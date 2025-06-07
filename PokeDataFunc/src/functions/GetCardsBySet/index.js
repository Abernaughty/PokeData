"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardsBySet = getCardsBySet;
const cacheUtils_1 = require("../../utils/cacheUtils");
const errorUtils_1 = require("../../utils/errorUtils");
const index_1 = require("../../index");
/**
 * PokeData-First GetCardsBySet Function
 *
 * This function implements the on-demand image loading strategy:
 * 1. Returns cards with comprehensive pricing data immediately
 * 2. Images are loaded on-demand when individual cards are requested
 * 3. Fast response times (no Pokemon TCG API calls during set browsing)
 * 4. Efficient API usage (only enhance cards that users actually view)
 */
async function getCardsBySet(request, context) {
    const timestamp = Date.now();
    const setIdParam = request.params.setId;
    const correlationId = `[pokedata-set-${setIdParam || 'unknown'}-${timestamp}]`;
    const startTime = Date.now();
    try {
        // Get set ID from route parameters
        if (!setIdParam) {
            context.log(`${correlationId} ERROR: Missing set ID in request`);
            const errorResponse = (0, errorUtils_1.createBadRequestError)("Set ID is required", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        // Parse set ID as integer
        const setId = parseInt(setIdParam);
        if (isNaN(setId)) {
            context.log(`${correlationId} ERROR: Invalid set ID format: ${setIdParam}`);
            const errorResponse = (0, errorUtils_1.createBadRequestError)("Set ID must be a valid number", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        context.log(`${correlationId} Processing PokeData-first request for set ID: ${setId}`);
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const page = parseInt(request.query.get("page") || "1");
        const pageSize = parseInt(request.query.get("pageSize") || "500");
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "86400"); // 24 hours default
        // Validate pagination parameters
        if (page < 1 || pageSize < 1 || pageSize > 500) {
            context.log(`${correlationId} ERROR: Invalid pagination parameters`);
            const errorResponse = (0, errorUtils_1.createBadRequestError)("Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 500.", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        context.log(`${correlationId} Request parameters - setId: ${setId}, page: ${page}, pageSize: ${pageSize}, forceRefresh: ${forceRefresh}`);
        // Check cache first (if enabled and not forcing refresh)
        const cacheKey = (0, cacheUtils_1.getCardsForSetCacheKey)(`pokedata-${setId}`);
        let cards = null;
        let cacheHit = false;
        let cacheAge = 0;
        let cacheStartTime = Date.now();
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`${correlationId} Checking Redis cache for key: ${cacheKey}`);
            const cachedEntry = await index_1.redisCacheService.get(cacheKey);
            cards = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            const cacheTime = Date.now() - cacheStartTime;
            if (cards) {
                context.log(`${correlationId} Cache HIT for set: ${setId} (${cacheTime}ms) - ${cards.length} cards`);
                cacheHit = true;
                cacheAge = cachedEntry ? (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp) : 0;
            }
            else {
                context.log(`${correlationId} Cache MISS for set: ${setId} (${cacheTime}ms)`);
            }
        }
        else {
            context.log(`${correlationId} Skipping cache - forceRefresh: ${forceRefresh}, Redis enabled: ${process.env.ENABLE_REDIS_CACHE}`);
        }
        // If not in cache, check Cosmos DB
        let dbStartTime = Date.now();
        if (!cards) {
            context.log(`${correlationId} Checking Cosmos DB for set: ${setId}`);
            // Query for cards by set ID (stored as number in database)
            const dbCards = await index_1.cosmosDbService.getCardsBySetId(String(setId));
            const dbTime = Date.now() - dbStartTime;
            if (dbCards && dbCards.length > 0) {
                // Convert from stored format to PokeDataFirstCardBasic format if needed
                cards = dbCards.map(card => {
                    const cardAny = card; // Type assertion to access all properties
                    return {
                        id: card.id,
                        source: "pokedata",
                        pokeDataId: card.pokeDataId || (card.id.startsWith('pokedata-') ? parseInt(card.id.replace('pokedata-', '')) : parseInt(card.id)),
                        setId: card.setId,
                        setName: card.setName,
                        setCode: card.setCode,
                        cardName: card.cardName,
                        cardNumber: card.cardNumber,
                        secret: cardAny.secret || false,
                        language: cardAny.language || 'ENGLISH',
                        releaseDate: cardAny.releaseDate || '',
                        pricing: card.pricing || {},
                        lastUpdated: card.lastUpdated || new Date().toISOString()
                    };
                });
                context.log(`${correlationId} Database HIT for set: ${setId} (${dbTime}ms) - ${cards.length} cards`);
            }
            else {
                context.log(`${correlationId} Database MISS for set: ${setId} (${dbTime}ms)`);
            }
        }
        // If not found anywhere, fetch from PokeData API
        if (!cards || cards.length === 0) {
            context.log(`${correlationId} Fetching fresh data from PokeData API for set: ${setId}`);
            try {
                // Step 1: Get all cards from PokeData for this set (basic card info only)
                const apiStartTime = Date.now();
                const pokeDataCards = await index_1.pokeDataApiService.getCardsInSet(setId);
                const apiTime = Date.now() - apiStartTime;
                if (!pokeDataCards || pokeDataCards.length === 0) {
                    context.log(`${correlationId} ERROR: No cards found in PokeData for set: ${setId} (${apiTime}ms)`);
                    const errorResponse = (0, errorUtils_1.createNotFoundError)("Cards for set", String(setId), "GetCardsBySet");
                    return {
                        jsonBody: errorResponse,
                        status: errorResponse.status
                    };
                }
                context.log(`${correlationId} PokeData API returned ${pokeDataCards.length} cards for set ${setId} (${apiTime}ms)`);
                // Step 2: For each card, get full details with pricing
                const transformStartTime = Date.now();
                const cardPromises = pokeDataCards.map(async (pokeDataCard) => {
                    try {
                        // Get full card details including pricing
                        const fullCardData = await index_1.pokeDataApiService.getFullCardDetailsById(pokeDataCard.id);
                        if (!fullCardData) {
                            // If we can't get pricing, create card with basic info and empty pricing
                            return {
                                id: String(pokeDataCard.id),
                                source: "pokedata",
                                pokeDataId: pokeDataCard.id,
                                setId: pokeDataCard.set_id,
                                setName: pokeDataCard.set_name,
                                setCode: pokeDataCard.set_code || '',
                                cardName: pokeDataCard.name,
                                cardNumber: pokeDataCard.num,
                                secret: pokeDataCard.secret || false,
                                language: pokeDataCard.language || 'ENGLISH',
                                releaseDate: pokeDataCard.release_date || '',
                                pricing: {},
                                lastUpdated: new Date().toISOString()
                            };
                        }
                        // Transform pricing data
                        const transformedPricing = {};
                        // Process PSA grades
                        const psaGrades = {};
                        for (let i = 1; i <= 10; i++) {
                            const grade = i === 10 ? '10.0' : `${i}.0`;
                            const key = `PSA ${grade}`;
                            if (fullCardData.pricing && fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                                psaGrades[String(i)] = fullCardData.pricing[key].value;
                            }
                        }
                        if (Object.keys(psaGrades).length > 0) {
                            transformedPricing.psa = psaGrades;
                        }
                        // Process CGC grades
                        const cgcGrades = {};
                        const cgcGradeValues = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'];
                        cgcGradeValues.forEach(grade => {
                            const key = `CGC ${grade}`;
                            if (fullCardData.pricing && fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                                const gradeKey = grade.replace('.', '_');
                                cgcGrades[gradeKey] = fullCardData.pricing[key].value;
                            }
                        });
                        if (Object.keys(cgcGrades).length > 0) {
                            transformedPricing.cgc = cgcGrades;
                        }
                        // Process other pricing sources
                        if (fullCardData.pricing) {
                            if (fullCardData.pricing['TCGPlayer'] && fullCardData.pricing['TCGPlayer'].value > 0) {
                                transformedPricing.tcgPlayer = fullCardData.pricing['TCGPlayer'].value;
                            }
                            if (fullCardData.pricing['eBay Raw'] && fullCardData.pricing['eBay Raw'].value > 0) {
                                transformedPricing.ebayRaw = fullCardData.pricing['eBay Raw'].value;
                            }
                            if (fullCardData.pricing['Pokedata Raw'] && fullCardData.pricing['Pokedata Raw'].value > 0) {
                                transformedPricing.pokeDataRaw = fullCardData.pricing['Pokedata Raw'].value;
                            }
                        }
                        return {
                            id: String(pokeDataCard.id),
                            source: "pokedata",
                            pokeDataId: pokeDataCard.id,
                            setId: pokeDataCard.set_id,
                            setName: pokeDataCard.set_name,
                            setCode: pokeDataCard.set_code || '',
                            cardName: pokeDataCard.name,
                            cardNumber: pokeDataCard.num,
                            secret: pokeDataCard.secret || false,
                            language: pokeDataCard.language || 'ENGLISH',
                            releaseDate: pokeDataCard.release_date || '',
                            pricing: transformedPricing,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                    catch (error) {
                        context.log(`${correlationId} Warning: Failed to get pricing for card ${pokeDataCard.id}: ${error.message}`);
                        // Return card with basic info and empty pricing
                        return {
                            id: String(pokeDataCard.id),
                            source: "pokedata",
                            pokeDataId: pokeDataCard.id,
                            setId: pokeDataCard.set_id,
                            setName: pokeDataCard.set_name,
                            setCode: pokeDataCard.set_code || '',
                            cardName: pokeDataCard.name,
                            cardNumber: pokeDataCard.num,
                            secret: pokeDataCard.secret || false,
                            language: pokeDataCard.language || 'ENGLISH',
                            releaseDate: pokeDataCard.release_date || '',
                            pricing: {},
                            lastUpdated: new Date().toISOString()
                        };
                    }
                });
                // Wait for all card processing to complete
                cards = await Promise.all(cardPromises);
                const transformTime = Date.now() - transformStartTime;
                context.log(`${correlationId} Transformed ${cards.length} cards to PokeData-first format with pricing (${transformTime}ms)`);
                // Step 3: Save to database and cache using batch operations
                const saveStartTime = Date.now();
                // Use batch save for much better performance
                await index_1.cosmosDbService.saveCards(cards); // Type assertion for compatibility
                const saveTime = Date.now() - saveStartTime;
                context.log(`${correlationId} Batch saved ${cards.length} cards to Cosmos DB (${saveTime}ms)`);
                // Save to cache if enabled
                if (process.env.ENABLE_REDIS_CACHE === "true") {
                    const cacheWriteStartTime = Date.now();
                    await index_1.redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(cards, cardsTtl), cardsTtl);
                    const cacheWriteTime = Date.now() - cacheWriteStartTime;
                    context.log(`${correlationId} Cached ${cards.length} cards to Redis (${cacheWriteTime}ms)`);
                }
            }
            catch (error) {
                context.log(`${correlationId} ERROR: PokeData API failed: ${error.message}`);
                const errorResponse = (0, errorUtils_1.handleError)(error, "GetCardsBySet - PokeData API");
                return {
                    jsonBody: errorResponse,
                    status: errorResponse.status
                };
            }
        }
        // Apply pagination
        const totalCount = cards.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        const paginatedCards = cards.slice(startIndex, endIndex);
        context.log(`${correlationId} Applying pagination - Total: ${totalCount}, Page: ${page}/${totalPages}, Showing: ${paginatedCards.length} cards`);
        // Calculate total operation time
        const totalTime = Date.now() - startTime;
        context.log(`${correlationId} PokeData-first GetCardsBySet complete - Total time: ${totalTime}ms`);
        // Create paginated response
        const paginatedResponse = {
            items: paginatedCards,
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
        context.log(`${correlationId} Returning PokeData-first response - cached: ${cacheHit}, total cards: ${totalCount}, page: ${page}, pricing guaranteed: true, images: on-demand`);
        return {
            jsonBody: response,
            status: response.status,
            headers: {
                "Cache-Control": `public, max-age=${cardsTtl}`
            }
        };
    }
    catch (error) {
        const totalTime = Date.now() - startTime;
        context.log(`${correlationId} ERROR after ${totalTime}ms: ${error.message}`);
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetCardsBySet - PokeData-First");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
//# sourceMappingURL=index.js.map