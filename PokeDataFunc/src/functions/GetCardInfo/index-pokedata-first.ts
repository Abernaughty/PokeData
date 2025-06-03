import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ApiResponse } from "../../models/ApiResponse";
import { getCardCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../../utils/cacheUtils";
import { handleError, createNotFoundError } from "../../utils/errorUtils";
import { 
    cosmosDbService, 
    redisCacheService, 
    pokeDataApiService 
} from "../../index";
import { pokeDataToTcgMappingService } from "../../services/PokeDataToTcgMappingService";
import { PokemonTcgApiService } from "../../services/PokemonTcgApiService";
import { ImageEnhancementService } from "../../services/ImageEnhancementService";

// Initialize services for PokeData-first architecture
const pokemonTcgApiService = new PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY || '');
const imageEnhancementService = new ImageEnhancementService(
    pokeDataToTcgMappingService,
    pokemonTcgApiService
);

// Enhanced card structure for PokeData-first approach
interface PokeDataFirstCard {
    id: string;                    // "pokedata-{cardId}"
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
    pricing: {
        psa?: { [grade: string]: number };
        cgc?: { [grade: string]: number };
        tcgPlayer?: number;
        ebayRaw?: number;
        pokeDataRaw?: number;
    };
    images?: {
        small: string;
        large: string;
    };
    enhancement?: {
        tcgSetId: string;
        tcgCardId: string;
        metadata?: {
            hp?: string;
            types?: string[];
            rarity?: string;
        };
        enhancedAt: string;
    };
    lastUpdated: string;
}

/**
 * PokeData-First GetCardInfo Function
 * 
 * This function implements the new PokeData-first architecture:
 * 1. Expects PokeData card ID as input
 * 2. Gets comprehensive pricing data from PokeData API (guaranteed)
 * 3. Enhances with Pokemon TCG images when mapping exists (optional)
 * 4. Returns complete card data with pricing always available
 */
export async function getCardInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const timestamp = Date.now();
    const correlationId = `[pokedata-card-${request.params.cardId}-${timestamp}]`;
    const startTime = Date.now();
    
    try {
        // Get PokeData card ID from route parameters
        const pokeDataCardId = request.params.cardId;
        
        if (!pokeDataCardId) {
            context.log(`${correlationId} ERROR: Missing PokeData card ID in request`);
            const errorResponse = createNotFoundError("PokeData Card ID", "missing", "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        // Validate that it's a numeric PokeData ID
        const cardIdNum = parseInt(pokeDataCardId);
        if (isNaN(cardIdNum)) {
            context.log(`${correlationId} ERROR: Invalid PokeData card ID format: ${pokeDataCardId}`);
            const errorResponse = createNotFoundError("PokeData Card ID", pokeDataCardId, "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        context.log(`${correlationId} Processing PokeData-first request for card ID: ${pokeDataCardId}`);
        
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const cardsTtl = parseInt(process.env.CACHE_TTL_CARDS || "86400"); // 24 hours default
        
        // Check cache first (if enabled and not forcing refresh)
        const cacheKey = getCardCacheKey(`pokedata-${pokeDataCardId}`);
        let card: PokeDataFirstCard | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`${correlationId} Checking Redis cache for key: ${cacheKey}`);
            const cachedEntry = await redisCacheService.get<{ data: PokeDataFirstCard; timestamp: number; ttl: number }>(cacheKey);
            card = parseCacheEntry<PokeDataFirstCard>(cachedEntry);
            
            if (card) {
                context.log(`${correlationId} Cache HIT for PokeData card: ${pokeDataCardId}`);
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
            } else {
                context.log(`${correlationId} Cache MISS for PokeData card: ${pokeDataCardId}`);
            }
        }
        
        // If not in cache, check Cosmos DB
        if (!card) {
            context.log(`${correlationId} Checking Cosmos DB for PokeData card: ${pokeDataCardId}`);
            const dbCard = await cosmosDbService.getCard(`pokedata-${pokeDataCardId}`);
            
            if (dbCard) {
                // Convert from old Card format to new PokeDataFirstCard format if needed
                card = dbCard as any; // Type assertion for now
                context.log(`${correlationId} Database HIT for PokeData card: ${pokeDataCardId}`);
            } else {
                context.log(`${correlationId} Database MISS for PokeData card: ${pokeDataCardId}`);
            }
        }
        
        // If not found anywhere, fetch from PokeData API
        if (!card) {
            context.log(`${correlationId} Fetching fresh data from PokeData API for card ID: ${pokeDataCardId}`);
            
            try {
                // Step 1: Get pricing data from PokeData (PRIMARY GOAL)
                const pricingStartTime = Date.now();
                const pricingData = await pokeDataApiService.getCardPricingById(cardIdNum);
                const pricingTime = Date.now() - pricingStartTime;
                
                if (!pricingData) {
                    context.log(`${correlationId} ERROR: No pricing data found in PokeData for card ID: ${pokeDataCardId}`);
                    const errorResponse = createNotFoundError("PokeData Card", pokeDataCardId, "GetCardInfo");
                    return {
                        jsonBody: errorResponse,
                        status: errorResponse.status
                    };
                }
                
                context.log(`${correlationId} PokeData pricing retrieved successfully (${pricingTime}ms)`);
                
                // Step 2: Transform PokeData pricing to our format
                const transformedPricing: any = {};
                
                // Process PSA grades
                const psaGrades: { [grade: string]: number } = {};
                for (let i = 1; i <= 10; i++) {
                    const grade = i === 10 ? '10.0' : `${i}.0`;
                    const key = `PSA ${grade}`;
                    if (pricingData[key] && pricingData[key].value > 0) {
                        psaGrades[String(i)] = pricingData[key].value;
                    }
                }
                if (Object.keys(psaGrades).length > 0) {
                    transformedPricing.psa = psaGrades;
                }
                
                // Process CGC grades
                const cgcGrades: { [grade: string]: number } = {};
                const cgcGradeValues = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'];
                cgcGradeValues.forEach(grade => {
                    const key = `CGC ${grade}`;
                    if (pricingData[key] && pricingData[key].value > 0) {
                        const gradeKey = grade.replace('.', '_');
                        cgcGrades[gradeKey] = pricingData[key].value;
                    }
                });
                if (Object.keys(cgcGrades).length > 0) {
                    transformedPricing.cgc = cgcGrades;
                }
                
                // Process other pricing sources
                if (pricingData['TCGPlayer'] && pricingData['TCGPlayer'].value > 0) {
                    transformedPricing.tcgPlayer = pricingData['TCGPlayer'].value;
                }
                if (pricingData['eBay Raw'] && pricingData['eBay Raw'].value > 0) {
                    transformedPricing.ebayRaw = pricingData['eBay Raw'].value;
                }
                if (pricingData['Pokedata Raw'] && pricingData['Pokedata Raw'].value > 0) {
                    transformedPricing.pokeDataRaw = pricingData['Pokedata Raw'].value;
                }
                
                // Step 3: Create base card structure
                card = {
                    id: `pokedata-${pokeDataCardId}`,
                    source: "pokedata",
                    pokeDataId: cardIdNum,
                    setId: pricingData.set_id,
                    setName: pricingData.set_name,
                    setCode: pricingData.set_code || '',
                    cardName: pricingData.name,
                    cardNumber: pricingData.num,
                    secret: pricingData.secret || false,
                    language: pricingData.language || 'ENGLISH',
                    releaseDate: pricingData.release_date || '',
                    pricing: transformedPricing,
                    lastUpdated: new Date().toISOString()
                };
                
                context.log(`${correlationId} Base PokeData card structure created`);
                
            } catch (error: any) {
                context.log(`${correlationId} ERROR: PokeData API failed: ${error.message}`);
                const errorResponse = handleError(error, "GetCardInfo - PokeData API");
                return {
                    jsonBody: errorResponse,
                    status: errorResponse.status
                };
            }
        }
        
        // Step 4: Enhance with Pokemon TCG images (OPTIONAL)
        if (card) {
            context.log(`${correlationId} Attempting image enhancement for card: ${card.cardName}`);
            
            try {
                const enhancementStartTime = Date.now();
                
                // Use the ImageEnhancementService to add images
                const enhancedCard = await imageEnhancementService.enhancePricingCardWithImages({
                    id: card.pokeDataId,
                    language: card.language,
                    name: card.cardName,
                    num: card.cardNumber,
                    release_date: card.releaseDate,
                    secret: card.secret,
                    set_code: card.setCode,
                    set_id: card.setId,
                    set_name: card.setName,
                    pricing: {} // Not used in enhancement
                });
                
                const enhancementTime = Date.now() - enhancementStartTime;
                
                // Update card with enhancement data
                if (enhancedCard.images) {
                    card.images = enhancedCard.images;
                    card.enhancement = enhancedCard.enhancement;
                    context.log(`${correlationId} Image enhancement successful (${enhancementTime}ms)`);
                } else {
                    context.log(`${correlationId} Image enhancement skipped - no mapping available (${enhancementTime}ms)`);
                }
                
            } catch (error: any) {
                context.log(`${correlationId} Image enhancement failed (non-critical): ${error.message}`);
                // Continue without images - pricing data is still available
            }
        }
        
        // Step 5: Save to database and cache
        if (card) {
            // Save to Cosmos DB
            const saveStartTime = Date.now();
            await cosmosDbService.saveCard(card as any); // Type assertion for compatibility
            const saveTime = Date.now() - saveStartTime;
            context.log(`${correlationId} Card saved to Cosmos DB (${saveTime}ms)`);
            
            // Save to cache if enabled
            if (process.env.ENABLE_REDIS_CACHE === "true") {
                const cacheWriteStartTime = Date.now();
                await redisCacheService.set(cacheKey, formatCacheEntry(card, cardsTtl), cardsTtl);
                const cacheWriteTime = Date.now() - cacheWriteStartTime;
                context.log(`${correlationId} Card cached to Redis (${cacheWriteTime}ms)`);
            }
        }
        
        // Calculate total operation time
        const totalTime = Date.now() - startTime;
        context.log(`${correlationId} PokeData-first request complete - Total time: ${totalTime}ms`);
        
        // Return the enhanced card data
        const response: ApiResponse<PokeDataFirstCard> = {
            status: 200,
            data: card!,
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : undefined
        };
        
        context.log(`${correlationId} Returning PokeData-first response - cached: ${cacheHit}, pricing sources: ${Object.keys(card!.pricing).length}, images: ${!!card!.images}`);
        
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
        const errorResponse = handleError(error, "GetCardInfo - PokeData-First");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
