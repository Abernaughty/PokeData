"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetListPokeDataFirst = getSetListPokeDataFirst;
const cacheUtils_1 = require("../../utils/cacheUtils");
const errorUtils_1 = require("../../utils/errorUtils");
const index_1 = require("../../index");
async function getSetListPokeDataFirst(request, context) {
    const correlationId = `[setlist-${Date.now()}]`;
    try {
        context.log(`${correlationId} Processing PokeData-first request for set list`);
        // Parse query parameters
        const language = request.query.get("language") || "ENGLISH";
        const includeCardCounts = request.query.get("includeCardCounts") === "true";
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const page = parseInt(request.query.get("page") || "1");
        const pageSize = parseInt(request.query.get("pageSize") || "100");
        // Long TTL for sets since they don't change frequently
        const setsTtl = parseInt(process.env.CACHE_TTL_SETS || "604800"); // 7 days default
        context.log(`${correlationId} Parameters: language=${language}, includeCardCounts=${includeCardCounts}, page=${page}, pageSize=${pageSize}`);
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = `${(0, cacheUtils_1.getSetListCacheKey)()}-pokedata-${language}`;
        let sets = null;
        let cacheHit = false;
        let cacheAge = 0;
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            context.log(`${correlationId} Checking Redis cache with key: ${cacheKey}`);
            const cachedEntry = await index_1.redisCacheService.get(cacheKey);
            sets = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            if (sets) {
                context.log(`${correlationId} Cache hit for PokeData set list (${sets.length} sets)`);
                cacheHit = true;
                cacheAge = cachedEntry ? (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp) : 0;
            }
            else {
                context.log(`${correlationId} Cache miss for PokeData set list`);
            }
        }
        // If not in cache, fetch from PokeData API
        if (!sets) {
            context.log(`${correlationId} Fetching sets from PokeData API`);
            const startTime = Date.now();
            try {
                const allSets = await index_1.pokeDataApiService.getAllSets();
                const apiTime = Date.now() - startTime;
                // Filter by language if specified
                sets = allSets.filter(set => language === "ALL" || set.language === language);
                context.log(`${correlationId} PokeData API returned ${allSets.length} total sets, ${sets.length} for language ${language} (${apiTime}ms)`);
                // Save to cache if found
                if (sets && sets.length > 0 && process.env.ENABLE_REDIS_CACHE === "true") {
                    context.log(`${correlationId} Saving ${sets.length} sets to Redis cache`);
                    await index_1.redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(sets, setsTtl), setsTtl);
                }
            }
            catch (error) {
                context.log(`${correlationId} Error fetching from PokeData API: ${error.message}`);
                throw error;
            }
        }
        if (!sets || sets.length === 0) {
            context.log(`${correlationId} No sets found for language: ${language}`);
            const errorResponse = {
                status: 404,
                error: `No sets found for language: ${language}`,
                timestamp: new Date().toISOString()
            };
            return {
                jsonBody: errorResponse,
                status: 404
            };
        }
        // Enhance sets with additional metadata
        const enhancedSets = sets.map(set => {
            const enhanced = { ...set };
            // Add release year
            if (set.release_date) {
                enhanced.releaseYear = new Date(set.release_date).getFullYear();
            }
            // Mark recent sets (released in last 2 years)
            if (set.release_date) {
                const releaseDate = new Date(set.release_date);
                const twoYearsAgo = new Date();
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                enhanced.isRecent = releaseDate > twoYearsAgo;
            }
            return enhanced;
        });
        // Sort sets by release date (newest first)
        enhancedSets.sort((a, b) => {
            if (!a.release_date || !b.release_date)
                return 0;
            return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        });
        // Apply pagination
        const totalCount = enhancedSets.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        const paginatedSets = enhancedSets.slice(startIndex, endIndex);
        context.log(`${correlationId} Returning page ${page}/${totalPages} with ${paginatedSets.length} sets (${startIndex + 1}-${startIndex + paginatedSets.length} of ${totalCount})`);
        // If card counts are requested, we could fetch them here
        // For now, we'll skip this to maintain fast response times
        // This could be added as a separate endpoint or background process
        if (includeCardCounts) {
            context.log(`${correlationId} Card counts requested but not implemented yet for performance reasons`);
        }
        // Return the set list with pagination metadata
        const response = {
            status: 200,
            data: {
                sets: paginatedSets,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages
                }
            },
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : undefined
        };
        context.log(`${correlationId} Successfully returning ${paginatedSets.length} PokeData sets`);
        return {
            jsonBody: response,
            status: response.status
        };
    }
    catch (error) {
        context.log(`${correlationId} Error in getSetListPokeDataFirst: ${error.message}`);
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetSetListPokeDataFirst");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
//# sourceMappingURL=index-pokedata-first.js.map