"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardInfo = getCardInfo;
const cacheUtils_1 = require("../../utils/cacheUtils");
const imageUtils_1 = require("../../utils/imageUtils");
const errorUtils_1 = require("../../utils/errorUtils");
const index_1 = require("../../index");

// Helper function to check if pricing data is stale
function isPricingStale(timestamp) {
    if (!timestamp)
        return true;
    const lastUpdate = new Date(timestamp).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (now - lastUpdate) > oneDayMs;
}

async function getCardInfo(request, context) {
    var _a;
    // Generate a correlation ID for request tracking
    const correlationId = `card-${request.params.cardId || 'unknown'}-${Date.now()}`;
    // Use direct context.log instead of LogManager
    context.log(`[${correlationId}] ===== STARTING getCardInfo function =====`);
    
    // Log environment configuration for debugging
    context.log(`[${correlationId}] ENVIRONMENT CONFIG:`, {
        ENABLE_REDIS_CACHE: process.env.ENABLE_REDIS_CACHE,
        CACHE_TTL_CARDS: process.env.CACHE_TTL_CARDS,
        IMAGE_SOURCE_STRATEGY: process.env.IMAGE_SOURCE_STRATEGY,
        ENABLE_CDN_IMAGES: process.env.ENABLE_CDN_IMAGES,
        POKEDATA_API_BASE_URL: ((_a = process.env.POKEDATA_API_BASE_URL) === null || _a === void 0 ? void 0 : _a.substring(0, 30)) + '...',
        HAS_POKEDATA_API_KEY: !!process.env.POKEDATA_API_KEY,
        HAS_COSMOSDB_CONNECTION: !!process.env.COSMOSDB_CONNECTION_STRING,
        HAS_REDIS_CONNECTION: !!process.env.REDIS_CONNECTION_STRING
    });
    
    // Check service initialization
    context.log(`[${correlationId}] SERVICE INITIALIZATION CHECK:`, {
        cosmosDbService: typeof index_1.cosmosDbService,
        pokeDataApiService: typeof index_1.pokeDataApiService,
        pokeDataApiServiceMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(index_1.pokeDataApiService)),
        hasMapMethod: typeof index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData
    });

    try {
        // Start timing the request
        const startTime = Date.now();
        
        // Get card ID from route parameters
        const cardId = request.params.cardId;
        if (!cardId) {
            context.log(`[${correlationId}] ERROR: Missing card ID in request`);
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Card ID", "missing", "GetCardInfo");
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
        
        context.log(`[${correlationId}] Processing request for card: ${cardId}`);
        
        // Parse query parameters
        const forceRefresh = request.query.get("forceRefresh") === "true";
        context.log(`[${correlationId}] Force refresh requested: ${forceRefresh}`);
        
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = (0, cacheUtils_1.getCardCacheKey)(cardId);
        let card = null;
        let cacheHit = false;
        let cacheAge = 0;
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`[${correlationId}] Checking Redis cache for key: ${cacheKey}`);
            const cacheStartTime = Date.now();
            const cachedEntry = await index_1.redisCacheService.get(cacheKey);
            const cacheEndTime = Date.now();
            context.log(`[${correlationId}] Redis cache lookup completed in ${cacheEndTime - cacheStartTime}ms`);
            
            card = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            if (card) {
                context.log(`[${correlationId}] ✅ Cache HIT for card: ${cardId}`);
                cacheHit = true;
                if (cachedEntry) {
                    cacheAge = (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp);
                    context.log(`[${correlationId}] Cache entry age: ${cacheAge} seconds (${Math.round(cacheAge / 3600)} hours)`);
                }
            }
            else {
                context.log(`[${correlationId}] ❌ Cache MISS for card: ${cardId}`);
            }
        }
        else {
            context.log(`[${correlationId}] Skipping cache check (forceRefresh=${forceRefresh}, cacheEnabled=${process.env.ENABLE_REDIS_CACHE})`);
        }
        
        // If not in cache, check Cosmos DB
        if (!card) {
            context.log(`[${correlationId}] Cache miss for card: ${cardId}, checking Cosmos DB`);
            const dbStartTime = Date.now();
            card = await index_1.cosmosDbService.getCard(cardId);
            const dbEndTime = Date.now();
            context.log(`[${correlationId}] Cosmos DB lookup completed in ${dbEndTime - dbStartTime}ms, result: ${card ? 'FOUND' : 'NOT FOUND'}`);
            
            // If not in database, fetch from external API
            if (!card) {
                context.log(`[${correlationId}] Card not found in database, fetching from Pokemon TCG API: ${cardId}`);
                const apiStartTime = Date.now();
                card = await index_1.pokemonTcgApiService.getCard(cardId);
                const apiEndTime = Date.now();
                context.log(`[${correlationId}] Pokemon TCG API lookup completed in ${apiEndTime - apiStartTime}ms, result: ${card ? 'FOUND' : 'NOT FOUND'}`);
                
                // If card found, save to database
                if (card) {
                    context.log(`[${correlationId}] Card found in Pokemon TCG API, saving to database`);
                    const saveStartTime = Date.now();
                    await index_1.cosmosDbService.saveCard(card);
                    const saveEndTime = Date.now();
                    context.log(`[${correlationId}] Card saved to database in ${saveEndTime - saveStartTime}ms`);
                }
                else {
                    context.log(`[${correlationId}] ❌ Card not found in Pokemon TCG API either`);
                }
            }
        }
        
        // Now that we have the card (from cache, DB, or API), check for enrichment
        if (card) {
            context.log(`[${correlationId}] ✅ Card found, starting enrichment process`);
            
            // Log card state before enrichment
            context.log(`[${correlationId}] CARD STATE BEFORE ENRICHMENT:`, {
                id: card.id,
                cardName: card.cardName || 'N/A',
                setCode: card.setCode,
                cardNumber: card.cardNumber,
                pokeDataId: card.pokeDataId || 'MISSING',
                hasPricing: !!card.pricing,
                pricingKeys: card.pricing ? Object.keys(card.pricing) : [],
                pricingCount: card.pricing ? Object.keys(card.pricing).length : 0,
                pricingLastUpdated: card.pricingLastUpdated || 'NEVER',
                hasEnhancedPricing: !!card.enhancedPricing,
                enhancedPricingKeys: card.enhancedPricing ? Object.keys(card.enhancedPricing) : [],
                enhancedPricingCount: card.enhancedPricing ? Object.keys(card.enhancedPricing).length : 0,
                hasTcgPlayerPrice: !!card.tcgPlayerPrice
            });
            
            let cardUpdated = false;
            
            // Evaluate enrichment conditions with detailed logging
            const condition1 = !card.pokeDataId;
            const condition2 = card.pokeDataId && (forceRefresh || !card.pricing || !card.pricingLastUpdated || isPricingStale(card.pricingLastUpdated));
            const condition3 = card.pokeDataId && (!card.enhancedPricing || Object.keys(card.enhancedPricing || {}).length === 0);
            
            context.log(`[${correlationId}] ENRICHMENT CONDITION EVALUATIONS:`);
            context.log(`[${correlationId}] - condition1 (needs PokeData ID): ${condition1}`);
            context.log(`[${correlationId}] - condition2 (needs pricing refresh): ${condition2}`);
            if (condition2) {
                context.log(`[${correlationId}]   - breakdown: forceRefresh=${forceRefresh}, !pricing=${!card.pricing}, !pricingLastUpdated=${!card.pricingLastUpdated}, isPricingStale=${card.pricingLastUpdated ? isPricingStale(card.pricingLastUpdated) : 'N/A'}`);
                if (card.pricingLastUpdated) {
                    const lastUpdate = new Date(card.pricingLastUpdated).getTime();
                    const now = Date.now();
                    const ageHours = (now - lastUpdate) / (1000 * 60 * 60);
                    context.log(`[${correlationId}]   - pricingLastUpdated: ${card.pricingLastUpdated}, age: ${ageHours.toFixed(2)} hours`);
                }
            }
            context.log(`[${correlationId}] - condition3 (missing enhanced pricing): ${condition3}`);
            if (condition3) {
                context.log(`[${correlationId}]   - enhancedPricing exists: ${!!card.enhancedPricing}, keys count: ${card.enhancedPricing ? Object.keys(card.enhancedPricing).length : 0}`);
            }
            
            // CONDITION 1: Check if card needs PokeData ID
            if (condition1) {
                context.log(`[${correlationId}] 🔍 ENTERING CONDITION 1: Card ${cardId} missing PokeData ID, attempting to find it`);
                try {
                    // Verify service availability before making API calls
                    context.log(`[${correlationId}] Verifying PokeDataApiService:`, {
                        serviceType: typeof index_1.pokeDataApiService,
                        hasGetCardsMethod: typeof index_1.pokeDataApiService.getCardsInSetByCode,
                        hasGetPricingMethod: typeof index_1.pokeDataApiService.getCardPricingById,
                        hasMapMethod: typeof index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData,
                        setCode: card.setCode
                    });
                    
                    context.log(`[${correlationId}] Calling getCardsInSetByCode for set: ${card.setCode}`);
                    const cardsStartTime = Date.now();
                    const pokeDataCards = await index_1.pokeDataApiService.getCardsInSetByCode(card.setCode);
                    const cardsEndTime = Date.now();
                    context.log(`[${correlationId}] PokeData API getCardsInSetByCode completed in ${cardsEndTime - cardsStartTime}ms, returned ${pokeDataCards ? pokeDataCards.length : 0} cards`);
                    
                    if (pokeDataCards && pokeDataCards.length > 0) {
                        context.log(`[${correlationId}] ✅ Retrieved ${pokeDataCards.length} cards from PokeData API for set ${card.setCode}`);
                        
                        // Log sample cards for debugging
                        const sampleCards = pokeDataCards.slice(0, 5).map(c => ({ id: c.id, num: c.num, name: c.name }));
                        context.log(`[${correlationId}] Sample PokeData cards:`, sampleCards);
                        
                        // Find matching card by exact card number first
                        context.log(`[${correlationId}] Looking for card with exact number "${card.cardNumber}"`);
                        let matchingCard = pokeDataCards.find(pdc => pdc.num === card.cardNumber);
                        
                        if (!matchingCard) {
                            // Try with leading zeros removed
                            const trimmedNumber = card.cardNumber.replace(/^0+/, '');
                            context.log(`[${correlationId}] No exact match found, trying with trimmed number: "${trimmedNumber}"`);
                            
                            // Log all card numbers in the set for comparison
                            const allCardNumbers = pokeDataCards.map(c => c.num).sort();
                            context.log(`[${correlationId}] All available card numbers in set:`, allCardNumbers);
                            
                            matchingCard = pokeDataCards.find(pdc => pdc.num === trimmedNumber);
                            if (matchingCard) {
                                context.log(`[${correlationId}] ✅ Found card with trimmed number "${trimmedNumber}" instead of "${card.cardNumber}"`);
                            }
                        }
                        
                        if (matchingCard) {
                            context.log(`[${correlationId}] 🎯 FOUND MATCHING POKEDATA CARD:`, {
                                id: matchingCard.id,
                                name: matchingCard.name,
                                num: matchingCard.num,
                                originalCardNumber: card.cardNumber
                            });
                            
                            card.pokeDataId = matchingCard.id;
                            cardUpdated = true;
                            
                            // Now fetch pricing for the newly found PokeData ID
                            context.log(`[${correlationId}] 💰 Fetching pricing for newly found PokeData ID: ${card.pokeDataId}`);
                            const pricingStartTime = Date.now();
                            
                            try {
                                const freshPricing = await index_1.pokeDataApiService.getCardPricingById(card.pokeDataId);
                                const pricingEndTime = Date.now();
                                context.log(`[${correlationId}] Pricing fetch completed in ${pricingEndTime - pricingStartTime}ms, result: ${!!freshPricing}`);
                                
                                if (freshPricing) {
                                    context.log(`[${correlationId}] ✅ Retrieved pricing data, keys:`, Object.keys(freshPricing));
                                    card.pricing = freshPricing;
                                    card.pricingLastUpdated = new Date().toISOString();
                                    
                                    // Try to generate enhanced pricing
                                    context.log(`[${correlationId}] 🔄 Attempting to generate enhanced pricing...`);
                                    try {
                                        if (typeof index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData === 'function') {
                                            context.log(`[${correlationId}] mapApiPricingToEnhancedPriceData method found, calling it...`);
                                            const enhancedPricing = index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData({ pricing: freshPricing });
                                            card.enhancedPricing = enhancedPricing || undefined;
                                            context.log(`[${correlationId}] ✅ Enhanced pricing generated successfully:`, !!enhancedPricing);
                                            if (enhancedPricing) {
                                                context.log(`[${correlationId}] Enhanced pricing keys:`, Object.keys(enhancedPricing));
                                                context.log(`[${correlationId}] Enhanced pricing sample:`, JSON.stringify(enhancedPricing).substring(0, 200) + '...');
                                            }
                                        }
                                        else {
                                            context.log(`[${correlationId}] ❌ mapApiPricingToEnhancedPriceData method not found or not a function`);
                                            context.log(`[${correlationId}] Available methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(index_1.pokeDataApiService)));
                                        }
                                    }
                                    catch (enhancedError) {
                                        context.log(`[${correlationId}] ❌ Error generating enhanced pricing:`, enhancedError.message);
                                        context.log(`[${correlationId}] Enhanced pricing error stack:`, enhancedError.stack);
                                    }
                                }
                                else {
                                    context.log(`[${correlationId}] ❌ No pricing data returned from PokeData API for ID: ${card.pokeDataId}`);
                                }
                            }
                            catch (pricingError) {
                                context.log(`[${correlationId}] ❌ Error fetching pricing for PokeData ID ${card.pokeDataId}:`, pricingError.message);
                                context.log(`[${correlationId}] Pricing error stack:`, pricingError.stack);
                            }
                        }
                        else {
                            context.log(`[${correlationId}] ❌ No matching card found for number ${card.cardNumber} in set ${card.setCode}`);
                            const allCardNumbers = pokeDataCards.map(c => c.num).sort();
                            context.log(`[${correlationId}] Available card numbers for reference:`, allCardNumbers);
                        }
                    }
                    else {
                        context.log(`[${correlationId}] ❌ No cards returned from PokeData API for set ${card.setCode}`);
                    }
                }
                catch (enrichError) {
                    context.log(`[${correlationId}] ❌ Error during PokeData ID enrichment:`, enrichError.message);
                    context.log(`[${correlationId}] Enrichment error stack:`, enrichError.stack);
                    if (enrichError.response) {
                        context.log(`[${correlationId}] Error response status:`, enrichError.response.status);
                        context.log(`[${correlationId}] Error response data:`, enrichError.response.data);
                    }
                }
            }
            // CONDITION 2: Check if card has PokeData ID but needs pricing refresh
            else if (condition2) {
                context.log(`[${correlationId}] 🔄 ENTERING CONDITION 2: Card has PokeData ID ${card.pokeDataId} but needs pricing refresh`);
                try {
                    const pricingStartTime = Date.now();
                    const freshPricing = await index_1.pokeDataApiService.getCardPricingById(card.pokeDataId);
                    const pricingEndTime = Date.now();
                    context.log(`[${correlationId}] Fresh pricing fetch completed in ${pricingEndTime - pricingStartTime}ms, result: ${!!freshPricing}`);
                    
                    if (freshPricing) {
                        context.log(`[${correlationId}] ✅ Retrieved fresh pricing data, keys:`, Object.keys(freshPricing));
                        card.pricing = freshPricing;
                        card.pricingLastUpdated = new Date().toISOString();
                        
                        // Generate enhanced pricing
                        try {
                            if (typeof index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData === 'function') {
                                const enhancedPricing = index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData({ pricing: freshPricing });
                                card.enhancedPricing = enhancedPricing || undefined;
                                context.log(`[${correlationId}] ✅ Enhanced pricing updated:`, !!enhancedPricing);
                                if (enhancedPricing) {
                                    context.log(`[${correlationId}] Enhanced pricing keys:`, Object.keys(enhancedPricing));
                                }
                            }
                            else {
                                context.log(`[${correlationId}] ❌ mapApiPricingToEnhancedPriceData method not available`);
                            }
                        }
                        catch (enhancedError) {
                            context.log(`[${correlationId}] ❌ Error generating enhanced pricing:`, enhancedError.message);
                        }
                        cardUpdated = true;
                        context.log(`[${correlationId}] ✅ Card pricing refreshed successfully`);
                    }
                    else {
                        context.log(`[${correlationId}] ❌ No fresh pricing data returned`);
                    }
                }
                catch (pricingError) {
                    context.log(`[${correlationId}] ❌ Error fetching fresh pricing:`, pricingError.message);
                    context.log(`[${correlationId}] Pricing refresh error stack:`, pricingError.stack);
                }
            }
            // CONDITION 3: Check if card has PokeData ID but is missing enhanced pricing data
            else if (condition3) {
                context.log(`[${correlationId}] 📊 ENTERING CONDITION 3: Card has PokeData ID ${card.pokeDataId} but missing enhanced pricing`);
                try {
                    const pricingStartTime = Date.now();
                    const freshPricing = await index_1.pokeDataApiService.getCardPricingById(card.pokeDataId);
                    const pricingEndTime = Date.now();
                    context.log(`[${correlationId}] Enhanced pricing fetch completed in ${pricingEndTime - pricingStartTime}ms, result: ${!!freshPricing}`);
                    
                    if (freshPricing) {
                        context.log(`[${correlationId}] ✅ Retrieved pricing data for enhanced pricing generation`);
                        card.pricing = freshPricing;
                        card.pricingLastUpdated = new Date().toISOString();
                        
                        try {
                            if (typeof index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData === 'function') {
                                const enhancedPricing = index_1.pokeDataApiService.mapApiPricingToEnhancedPriceData({ pricing: freshPricing });
                                card.enhancedPricing = enhancedPricing || undefined;
                                context.log(`[${correlationId}] ✅ Enhanced pricing added successfully:`, !!enhancedPricing);
                                if (enhancedPricing) {
                                    context.log(`[${correlationId}] Enhanced pricing keys:`, Object.keys(enhancedPricing));
                                }
                            }
                            else {
                                context.log(`[${correlationId}] ❌ mapApiPricingToEnhancedPriceData method not available`);
                            }
                        }
                        catch (enhancedError) {
                            context.log(`[${correlationId}] ❌ Error generating enhanced pricing:`, enhancedError.message);
                        }
                        cardUpdated = true;
                    }
                    else {
                        context.log(`[${correlationId}] ❌ No pricing data returned for enhanced pricing generation`);
                    }
                }
                catch (pricingError) {
                    context.log(`[${correlationId}] ❌ Error fetching pricing for enhanced pricing:`, pricingError.message);
                    context.log(`[${correlationId}] Enhanced pricing error stack:`, pricingError.stack);
                }
            }
            else {
                context.log(`[${correlationId}] ✅ No enrichment conditions met - card already has all required data`);
            }
            
            // Log card state after enrichment
            context.log(`[${correlationId}] CARD STATE AFTER ENRICHMENT:`, {
                id: card.id,
                pokeDataId: card.pokeDataId || 'STILL MISSING',
                hasPricing: !!card.pricing,
                pricingKeys: card.pricing ? Object.keys(card.pricing) : [],
                pricingLastUpdated: card.pricingLastUpdated || 'STILL NOT SET',
                hasEnhancedPricing: !!card.enhancedPricing,
                enhancedPricingKeys: card.enhancedPricing ? Object.keys(card.enhancedPricing) : [],
                cardUpdated: cardUpdated,
                enrichmentSummary: {
                    hadPokeDataId: !condition1,
                    neededPricingRefresh: condition2,
                    neededEnhancedPricing: condition3,
                    wasUpdated: cardUpdated
                }
            });
            
            // Save the updated card to database if changes were made
            if (cardUpdated) {
                context.log(`[${correlationId}] 💾 Saving updated card to database...`);
                const saveStartTime = Date.now();
                await index_1.cosmosDbService.updateCard(card);
                const saveEndTime = Date.now();
                context.log(`[${correlationId}] ✅ Card saved to database in ${saveEndTime - saveStartTime}ms`);
                
                // Update cache if enabled
                if (process.env.ENABLE_REDIS_CACHE === "true") {
                    context.log(`[${correlationId}] 🗂️ Updating Redis cache...`);
                    const cacheStartTime = Date.now();
                    await index_1.redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(card, 86400), 86400);
                    const cacheEndTime = Date.now();
                    context.log(`[${correlationId}] ✅ Cache updated in ${cacheEndTime - cacheStartTime}ms`);
                }
            }
            
            // Process image URLs
            const imageOptions = {
                cdnEndpoint: process.env.CDN_ENDPOINT || "",
                sourceStrategy: (process.env.IMAGE_SOURCE_STRATEGY || "hybrid"),
                enableCdn: process.env.ENABLE_CDN_IMAGES === "true"
            };
            context.log(`[${correlationId}] 🖼️ Processing image URLs with options:`, imageOptions);
            card = await (0, imageUtils_1.processImageUrls)(card, {
                ...imageOptions,
                blobStorageService: index_1.blobStorageService
            });
            
            // Prepare the response
            const response = {
                status: 200,
                data: card,
                timestamp: new Date().toISOString(),
                cached: cacheHit,
                cacheAge: cacheHit ? cacheAge : 0
            };
            
            // Log the total function execution time and final summary
            const endTime = Date.now();
            context.log(`[${correlationId}] ===== FUNCTION COMPLETED SUCCESSFULLY =====`);
            context.log(`[${correlationId}] EXECUTION SUMMARY:`, {
                totalExecutionTime: `${endTime - startTime}ms`,
                cardFound: true,
                cacheHit: cacheHit,
                cardUpdated: cardUpdated,
                finalPokeDataId: card.pokeDataId || 'MISSING',
                finalHasPricing: !!card.pricing,
                finalHasEnhancedPricing: !!card.enhancedPricing,
                responseStatus: response.status
            });
            
            return {
                jsonBody: response,
                status: response.status,
                headers: {
                    "Cache-Control": `public, max-age=86400`
                }
            };
        }
        else {
            context.log(`[${correlationId}] ❌ Card not found after all lookups (cache, database, and Pokemon TCG API)`);
            const errorResponse = (0, errorUtils_1.createNotFoundError)("Card", cardId, "GetCardInfo");
            context.log(`[${correlationId}] ===== FUNCTION COMPLETED - CARD NOT FOUND =====`);
            return {
                jsonBody: errorResponse,
                status: errorResponse.status
            };
        }
    }
    catch (error) {
        context.log(`[${correlationId}] ❌❌❌ CRITICAL ERROR in getCardInfo:`, error.message);
        context.log(`[${correlationId}] Error type:`, error.constructor.name);
        context.log(`[${correlationId}] Error stack:`, error.stack);
        if (error.response) {
            context.log(`[${correlationId}] Error response status:`, error.response.status);
            context.log(`[${correlationId}] Error response data:`, error.response.data);
        }
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetCardInfo");
        context.log(`[${correlationId}] ===== FUNCTION COMPLETED - ERROR =====`);
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
//# sourceMappingURL=index.js.map
