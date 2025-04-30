import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Card } from "../src/models/Card";
import { ApiResponse } from "../src/models/ApiResponse";
import { ImageOptions, ImageSourceStrategy } from "../src/models/Config";
import { getCardCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../src/utils/cacheUtils";
import { processImageUrls } from "../src/utils/imageUtils";
import { handleError, createNotFoundError } from "../src/utils/errorUtils";
import { CosmosDbService } from "../src/services/CosmosDbService";
import { RedisCacheService } from "../src/services/RedisCacheService";
import { BlobStorageService } from "../src/services/BlobStorageService";
import { PokemonTcgApiService } from "../src/services/PokemonTcgApiService";
import { PokeDataApiService } from "../src/services/PokeDataApiService";

// Initialize services
const cosmosDbService = new CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const redisCacheService = new RedisCacheService(
    process.env.REDIS_CONNECTION_STRING || "",
    process.env.ENABLE_REDIS_CACHE === "true"
);
const blobStorageService = new BlobStorageService(
    process.env.BLOB_STORAGE_CONNECTION_STRING || ""
);
const pokemonTcgApiService = new PokemonTcgApiService(
    process.env.POKEMON_TCG_API_KEY || "",
    process.env.POKEMON_TCG_API_BASE_URL
);
const pokeDataApiService = new PokeDataApiService(
    process.env.POKEDATA_API_KEY || "",
    process.env.POKEDATA_API_BASE_URL
);

export async function getCardInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Get card ID from route parameters
        const cardId = request.params.cardId;
        
        if (!cardId) {
            const errorResponse = createNotFoundError("Card ID", "missing", "GetCardInfo");
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
        const cacheKey = getCardCacheKey(cardId);
        let card: Card | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await redisCacheService.get<{ data: Card; timestamp: number; ttl: number }>(cacheKey);
            card = parseCacheEntry<Card>(cachedEntry);
            
            if (card) {
                context.log(`Cache hit for card: ${cardId}`);
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
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
                await redisCacheService.set(cacheKey, formatCacheEntry(card, cardsTtl), cardsTtl);
            }
        }
        
        if (!card) {
            const errorResponse = createNotFoundError("Card", cardId, "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Process image URLs
        const imageOptions: ImageOptions = {
            cdnEndpoint: process.env.CDN_ENDPOINT || "",
            sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid") as ImageSourceStrategy,
            enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
        };
        
        card = await processImageUrls(card, {
            ...imageOptions,
            blobStorageService
        });
        
        // Return the card data
        const response: ApiResponse<Card> = {
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
    } catch (error: any) {
        const errorResponse = handleError(error, "GetCardInfo");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}

app.http('getCardInfo', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'cards/{cardId}',
    handler: getCardInfo
});
