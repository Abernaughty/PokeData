import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Card } from "../../models/Card";
import { ApiResponse } from "../../models/ApiResponse";
import { ImageOptions, ImageSourceStrategy } from "../../models/Config";
import { getCardCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../../utils/cacheUtils";
import { processImageUrls } from "../../utils/imageUtils";
import { handleError, createNotFoundError } from "../../utils/errorUtils";
import { 
    cosmosDbService, 
    redisCacheService, 
    blobStorageService, 
    pokemonTcgApiService, 
    pokeDataApiService 
} from "../../index";

export async function getCardInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Generate correlation ID for enhanced logging
    const timestamp = Date.now();
    const correlationId = `[card-${request.params.cardId}-${timestamp}]`;
    const startTime = Date.now();
    
    try {
        // Get card ID from route parameters
        const cardId = request.params.cardId;
        
        if (!cardId) {
            context.log(`${correlationId} ERROR: Missing card ID in request`);
            const errorResponse = createNotFoundError("Card ID", "missing", "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        context.log(`${correlationId} Processing request for card: ${cardId}`);
        context.log(`${correlationId} Environment configuration - Redis: ${process.env.ENABLE_REDIS_CACHE}, CDN: ${process.env.ENABLE_CDN_IMAGES}`);
        
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "86400"); // 24 hours default
        
        context.log(`${correlationId} Request parameters - forceRefresh: ${forceRefresh}, TTL: ${cardsTtl}`);
        
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = getCardCacheKey(cardId);
        let card: Card | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        let cacheStartTime = Date.now();
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`${correlationId} Checking Redis cache for key: ${cacheKey}`);
            const cachedEntry = await redisCacheService.get<{ data: Card; timestamp: number; ttl: number }>(cacheKey);
            card = parseCacheEntry<Card>(cachedEntry);
            
            const cacheTime = Date.now() - cacheStartTime;
            
            if (card) {
                context.log(`${correlationId} Cache HIT for card: ${cardId} (${cacheTime}ms)`);
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
            } else {
                context.log(`${correlationId} Cache MISS for card: ${cardId} (${cacheTime}ms)`);
            }
        } else {
            context.log(`${correlationId} Skipping cache - forceRefresh: ${forceRefresh}, Redis enabled: ${process.env.ENABLE_REDIS_CACHE}`);
        }
        
        // If not in cache, check Cosmos DB
        let dbStartTime = Date.now();
        if (!card) {
            context.log(`${correlationId} Checking Cosmos DB for card: ${cardId}`);
            card = await cosmosDbService.getCard(cardId);
            
            const dbTime = Date.now() - dbStartTime;
            
            if (card) {
                context.log(`${correlationId} Database HIT for card: ${cardId} (${dbTime}ms)`);
            } else {
                context.log(`${correlationId} Database MISS for card: ${cardId} (${dbTime}ms)`);
            }
            
            // If not in database, fetch from external API
            if (!card) {
                context.log(`${correlationId} Card not found in database, fetching from Pokemon TCG API: ${cardId}`);
                let apiStartTime = Date.now();
                card = await pokemonTcgApiService.getCard(cardId);
                const apiTime = Date.now() - apiStartTime;
                
                if (card) {
                    context.log(`${correlationId} Pokemon TCG API SUCCESS for card: ${cardId} (${apiTime}ms)`);
                    
                    // Enhanced enrichment logic with three conditions
                    context.log(`${correlationId} Starting enrichment evaluation for card: ${cardId}`);
                    
                    // Condition 1: TCG Player pricing enrichment
                    let tcgEnrichmentTime = 0;
                    if (!card.tcgPlayerPrice) {
                        context.log(`${correlationId} Enrichment Condition 1: TCG Player pricing missing - ENRICHING`);
                        let tcgStartTime = Date.now();
                        const tcgPlayerPrice = await pokemonTcgApiService.getCardPricing(cardId);
                        tcgEnrichmentTime = Date.now() - tcgStartTime;
                        
                        if (tcgPlayerPrice) {
                            card.tcgPlayerPrice = tcgPlayerPrice;
                            context.log(`${correlationId} Enrichment Condition 1: TCG Player pricing added (${tcgEnrichmentTime}ms)`);
                        } else {
                            context.log(`${correlationId} Enrichment Condition 1: TCG Player pricing unavailable (${tcgEnrichmentTime}ms)`);
                        }
                    } else {
                        context.log(`${correlationId} Enrichment Condition 1: TCG Player pricing already present - SKIPPING`);
                    }
                    
                    // Condition 2: Enhanced pricing data enrichment
                    let enhancedEnrichmentTime = 0;
                    if (!card.enhancedPricing) {
                        context.log(`${correlationId} Enrichment Condition 2: Enhanced pricing missing - ENRICHING`);
                        let enhancedStartTime = Date.now();
                        const enhancedPricing = await pokeDataApiService.getCardPricing(cardId, card.pokeDataId);
                        enhancedEnrichmentTime = Date.now() - enhancedStartTime;
                        
                        if (enhancedPricing) {
                            card.enhancedPricing = enhancedPricing;
                            context.log(`${correlationId} Enrichment Condition 2: Enhanced pricing added (${enhancedEnrichmentTime}ms)`);
                        } else {
                            context.log(`${correlationId} Enrichment Condition 2: Enhanced pricing unavailable (${enhancedEnrichmentTime}ms)`);
                        }
                    } else {
                        context.log(`${correlationId} Enrichment Condition 2: Enhanced pricing already present - SKIPPING`);
                    }
                    
                    // Condition 3: PokeData ID mapping enrichment
                    if (!card.pokeDataId) {
                        context.log(`${correlationId} Enrichment Condition 3: PokeData ID missing - attempting to map`);
                        // This would be where we'd add PokeData ID mapping logic if needed
                        context.log(`${correlationId} Enrichment Condition 3: PokeData ID mapping not implemented - SKIPPING`);
                    } else {
                        context.log(`${correlationId} Enrichment Condition 3: PokeData ID already present (${card.pokeDataId}) - SKIPPING`);
                    }
                    
                    const totalEnrichmentTime = tcgEnrichmentTime + enhancedEnrichmentTime;
                    context.log(`${correlationId} Enrichment complete - Total time: ${totalEnrichmentTime}ms`);
                    
                    // Save enriched card to database
                    let saveStartTime = Date.now();
                    await cosmosDbService.saveCard(card);
                    const saveTime = Date.now() - saveStartTime;
                    context.log(`${correlationId} Card saved to Cosmos DB (${saveTime}ms)`);
                } else {
                    context.log(`${correlationId} Pokemon TCG API FAILED for card: ${cardId} (${apiTime}ms)`);
                }
            }
            
            // Save to cache if found
            if (card && process.env.ENABLE_REDIS_CACHE === "true") {
                let cacheWriteStartTime = Date.now();
                await redisCacheService.set(cacheKey, formatCacheEntry(card, cardsTtl), cardsTtl);
                const cacheWriteTime = Date.now() - cacheWriteStartTime;
                context.log(`${correlationId} Card cached to Redis (${cacheWriteTime}ms)`);
            }
        }
        
        if (!card) {
            context.log(`${correlationId} ERROR: Card not found after all attempts: ${cardId}`);
            const errorResponse = createNotFoundError("Card", cardId, "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Process image URLs
        let imageStartTime = Date.now();
        const imageOptions: ImageOptions = {
            cdnEndpoint: process.env.CDN_ENDPOINT || "",
            sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid") as ImageSourceStrategy,
            enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
        };
        
        card = await processImageUrls(card, {
            ...imageOptions,
            blobStorageService
        });
        
        const imageTime = Date.now() - imageStartTime;
        context.log(`${correlationId} Image processing complete (${imageTime}ms)`);
        
        // Calculate total operation time
        const totalTime = Date.now() - startTime;
        context.log(`${correlationId} Request complete - Total time: ${totalTime}ms`);
        
        // Return the card data
        const response: ApiResponse<Card> = {
            status: 200,
            data: card,
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : undefined
        };
        
        context.log(`${correlationId} Returning response - cached: ${cacheHit}, cacheAge: ${cacheAge}s`);
        
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
        const errorResponse = handleError(error, "GetCardInfo");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
