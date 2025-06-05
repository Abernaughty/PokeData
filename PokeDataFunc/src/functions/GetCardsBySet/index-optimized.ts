import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ApiResponse, PaginatedResponse } from "../../models/ApiResponse";
import { getCardsForSetCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../../utils/cacheUtils";
import { handleError, createNotFoundError, createBadRequestError } from "../../utils/errorUtils";
import { 
    cosmosDbService, 
    redisCacheService, 
    pokeDataApiService 
} from "../../index";

// PokeData-first card structure (basic data only - no pricing)
interface PokeDataFirstCardBasic {
    id: string;                    // Clean numeric ID (e.g., "73092")
    source: "pokedata";
    pokeDataId: number;
    setId: number;
    setName: string;
    setCode: string;
    cardName: string;
    cardNumber: string;
    secret: boolean;
    language: string;
    releaseDate: string;
    // Note: pricing and images are loaded on-demand in GetCardInfo
    lastUpdated: string;
}

/**
 * OPTIMIZED PokeData-First GetCardsBySet Function
 * 
 * This function implements the true on-demand strategy:
 * 1. Returns cards with BASIC DATA ONLY (no pricing calls)
 * 2. Pricing is loaded on-demand when individual cards are requested via GetCardInfo
 * 3. Ultra-fast response times (no individual API calls during set browsing)
 * 4. Massive API efficiency improvement (254 API calls → 1 API call)
 */
export async function getCardsBySetOptimized(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const timestamp = Date.now();
    const setIdParam = request.params.setId;
    const correlationId = `[pokedata-set-${setIdParam || 'unknown'}-${timestamp}]`;
    const startTime = Date.now();
    
    try {
        // Get set ID from route parameters
        if (!setIdParam) {
            context.log(`${correlationId} ERROR: Missing set ID in request`);
            const errorResponse = createBadRequestError("Set ID is required", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Parse set ID as integer
        const setId = parseInt(setIdParam);
        if (isNaN(setId)) {
            context.log(`${correlationId} ERROR: Invalid set ID format: ${setIdParam}`);
            const errorResponse = createBadRequestError("Set ID must be a valid number", "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        context.log(`${correlationId} Processing OPTIMIZED PokeData-first request for set ID: ${setId}`);
        
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const page = parseInt(request.query.get("page") || "1");
        const pageSize = parseInt(request.query.get("pageSize") || "500");
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "604800"); // 7 days for basic card data
        
        // Validate pagination parameters
        if (page < 1 || pageSize < 1 || pageSize > 500) {
            context.log(`${correlationId} ERROR: Invalid pagination parameters`);
            const errorResponse = createBadRequestError(
                "Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 500.",
                "GetCardsBySet"
            );
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        context.log(`${correlationId} Request parameters - setId: ${setId}, page: ${page}, pageSize: ${pageSize}, forceRefresh: ${forceRefresh}`);
        
        // Check cache first (if enabled and not forcing refresh)
        const cacheKey = getCardsForSetCacheKey(`pokedata-basic-${setId}`); // Different cache key for basic data
        let cards: PokeDataFirstCardBasic[] | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        let cacheStartTime = Date.now();
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`${correlationId} Checking Redis cache for key: ${cacheKey}`);
            const cachedEntry = await redisCacheService.get<{ data: PokeDataFirstCardBasic[]; timestamp: number; ttl: number }>(cacheKey);
            cards = parseCacheEntry<PokeDataFirstCardBasic[]>(cachedEntry);
            
            const cacheTime = Date.now() - cacheStartTime;
            
            if (cards) {
                context.log(`${correlationId} Cache HIT for set: ${setId} (${cacheTime}ms) - ${cards.length} cards`);
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
            } else {
                context.log(`${correlationId} Cache MISS for set: ${setId} (${cacheTime}ms)`);
            }
        } else {
            context.log(`${correlationId} Skipping cache - forceRefresh: ${forceRefresh}, Redis enabled: ${process.env.ENABLE_REDIS_CACHE}`);
        }
        
        // If not in cache, check Cosmos DB for basic card data
        let dbStartTime = Date.now();
        if (!cards) {
            context.log(`${correlationId} Checking Cosmos DB for basic card data for set: ${setId}`);
            
            // Query for cards by set ID (stored as number in database)
            const dbCards = await cosmosDbService.getCardsBySetId(String(setId));
            
            const dbTime = Date.now() - dbStartTime;
            
            if (dbCards && dbCards.length > 0) {
                // Convert from stored format to PokeDataFirstCardBasic format (without pricing)
                cards = dbCards.map(card => {
                    const cardAny = card as any; // Type assertion to access all properties
                    return {
                        id: card.id,
                        source: "pokedata" as const,
                        pokeDataId: card.pokeDataId || (card.id.startsWith('pokedata-') ? parseInt(card.id.replace('pokedata-', '')) : parseInt(card.id)),
                        setId: card.setId,
                        setName: card.setName,
                        setCode: card.setCode,
                        cardName: card.cardName,
                        cardNumber: card.cardNumber,
                        secret: cardAny.secret || false,
                        language: cardAny.language || 'ENGLISH',
                        releaseDate: cardAny.releaseDate || '',
                        lastUpdated: card.lastUpdated || new Date().toISOString()
                    };
                });
                
                context.log(`${correlationId} Database HIT for set: ${setId} (${dbTime}ms) - ${cards.length} cards (basic data only)`);
            } else {
                context.log(`${correlationId} Database MISS for set: ${setId} (${dbTime}ms)`);
            }
        }
        
        // If not found anywhere, fetch from PokeData API (BASIC DATA ONLY)
        if (!cards || cards.length === 0) {
            context.log(`${correlationId} Fetching BASIC card data from PokeData API for set: ${setId}`);
            
            try {
                // Step 1: Get all cards from PokeData for this set (basic card info only - NO PRICING)
                const apiStartTime = Date.now();
                const pokeDataCards = await pokeDataApiService.getCardsInSet(setId);
                const apiTime = Date.now() - apiStartTime;
                
                if (!pokeDataCards || pokeDataCards.length === 0) {
                    context.log(`${correlationId} ERROR: No cards found in PokeData for set: ${setId} (${apiTime}ms)`);
                    const errorResponse = createNotFoundError("Cards for set", String(setId), "GetCardsBySet");
                    return {
                        jsonBody: errorResponse,
                        status: errorResponse.status
                    };
                }
                
                context.log(`${correlationId} PokeData API returned ${pokeDataCards.length} cards for set ${setId} (${apiTime}ms)`);
                
                // Step 2: Transform to basic card format (NO PRICING ENHANCEMENT)
                const transformStartTime = Date.now();
                
                cards = pokeDataCards.map((pokeDataCard) => {
                    return {
                        id: String(pokeDataCard.id),
                        source: "pokedata" as const,
                        pokeDataId: pokeDataCard.id,
                        setId: pokeDataCard.set_id,
                        setName: pokeDataCard.set_name,
                        setCode: pokeDataCard.set_code || '',
                        cardName: pokeDataCard.name,
                        cardNumber: pokeDataCard.num,
                        secret: pokeDataCard.secret || false,
                        language: pokeDataCard.language || 'ENGLISH',
                        releaseDate: pokeDataCard.release_date || '',
                        lastUpdated: new Date().toISOString()
                    };
                });
                
                const transformTime = Date.now() - transformStartTime;
                context.log(`${correlationId} Transformed ${cards.length} cards to basic format (NO PRICING) (${transformTime}ms)`);
                
                // Step 3: Save basic card data to database and cache using batch operations
                const saveStartTime = Date.now();
                
                // Create database-compatible format (with empty pricing for compatibility)
                const dbCards = cards.map(card => ({
                    ...card,
                    pricing: {} // Empty pricing object for database compatibility
                }));
                
                // Use batch save for much better performance
                await cosmosDbService.saveCards(dbCards as any[]); // Type assertion for compatibility
                
                const saveTime = Date.now() - saveStartTime;
                context.log(`${correlationId} Batch saved ${cards.length} basic cards to Cosmos DB (${saveTime}ms)`);
                
                // Save to cache if enabled
                if (process.env.ENABLE_REDIS_CACHE === "true") {
                    const cacheWriteStartTime = Date.now();
                    await redisCacheService.set(cacheKey, formatCacheEntry(cards, cardsTtl), cardsTtl);
                    const cacheWriteTime = Date.now() - cacheWriteStartTime;
                    context.log(`${correlationId} Cached ${cards.length} basic cards to Redis (${cacheWriteTime}ms)`);
                }
                
            } catch (error: any) {
                context.log(`${correlationId} ERROR: PokeData API failed: ${error.message}`);
                const errorResponse = handleError(error, "GetCardsBySet - PokeData API");
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
        context.log(`${correlationId} OPTIMIZED PokeData-first GetCardsBySet complete - Total time: ${totalTime}ms`);
        
        // Create paginated response
        const paginatedResponse: PaginatedResponse<PokeDataFirstCardBasic> = {
            items: paginatedCards,
            totalCount,
            pageSize,
            pageNumber: page,
            totalPages
        };
        
        // Return the cards data
        const response: ApiResponse<PaginatedResponse<PokeDataFirstCardBasic>> = {
            status: 200,
            data: paginatedResponse,
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : undefined
        };
        
        context.log(`${correlationId} Returning OPTIMIZED PokeData-first response - cached: ${cacheHit}, total cards: ${totalCount}, page: ${page}, pricing: ON-DEMAND, images: ON-DEMAND`);
        
        return { 
            jsonBody: response,
            status: response.status,
            headers: {
                "Cache-Control": `public, max-age=${cardsTtl}`
            }
        };
        
    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        context.log(`${correlationId} ERROR after ${totalTime}ms: ${error.message}`);
        const errorResponse = handleError(error, "GetCardsBySet - Optimized PokeData-First");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
