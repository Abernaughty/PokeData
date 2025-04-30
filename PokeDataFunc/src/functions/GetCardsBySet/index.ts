import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Card } from "../../models/Card";
import { ApiResponse, PaginatedResponse } from "../../models/ApiResponse";
import { ImageOptions, ImageSourceStrategy } from "../../models/Config";
import { getCardsForSetCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../../utils/cacheUtils";
import { processImageUrls } from "../../utils/imageUtils";
import { handleError, createNotFoundError, createBadRequestError } from "../../utils/errorUtils";
import { 
    cosmosDbService, 
    redisCacheService, 
    blobStorageService, 
    pokemonTcgApiService 
} from "../../index";

export async function getCardsBySet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Get set code from route parameters
        const setCode = request.params.setCode;
        
        if (!setCode) {
            const errorResponse = createBadRequestError("Set code is required", "GetCardsBySet");
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
            const errorResponse = createBadRequestError(
                "Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 500.",
                "GetCardsBySet"
            );
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = getCardsForSetCacheKey(setCode);
        let cards: Card[] | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await redisCacheService.get<{ data: Card[]; timestamp: number; ttl: number }>(cacheKey);
            cards = parseCacheEntry<Card[]>(cachedEntry);
            
            if (cards) {
                context.log(`Cache hit for cards in set: ${setCode}`);
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
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
                await redisCacheService.set(cacheKey, formatCacheEntry(cards, cardsTtl), cardsTtl);
            }
        }
        
        if (!cards || cards.length === 0) {
            const errorResponse = createNotFoundError("Cards for set", setCode, "GetCardsBySet");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Process image URLs for all cards
        const imageOptions: ImageOptions = {
            cdnEndpoint: process.env.CDN_ENDPOINT || "",
            sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid") as ImageSourceStrategy,
            enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
        };
        
        // Apply pagination
        const totalCount = cards.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        const paginatedCards = cards.slice(startIndex, endIndex);
        
        // Process image URLs for paginated cards
        const processedCards: Card[] = [];
        for (const card of paginatedCards) {
            const processedCard = await processImageUrls(card, {
                ...imageOptions,
                blobStorageService
            });
            processedCards.push(processedCard);
        }
        
        // Create paginated response
        const paginatedResponse: PaginatedResponse<Card> = {
            items: processedCards,
            totalCount,
            pageSize,
            pageNumber: page,
            totalPages
        };
        
        // Return the cards data
        const response: ApiResponse<PaginatedResponse<Card>> = {
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
    } catch (error: any) {
        const errorResponse = handleError(error, "GetCardsBySet");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
