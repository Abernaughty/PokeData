"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetList = getSetList;
const cacheUtils_1 = require("../../utils/cacheUtils");
const setUtils_1 = require("../../utils/setUtils");
const errorUtils_1 = require("../../utils/errorUtils");
const index_1 = require("../../index");
async function getSetList(request, context) {
    try {
        context.log("Processing request for set list");
        // Parse query parameters
        const groupByExpansion = request.query.get("groupByExpansion") === "true";
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const setsTtl = parseInt(process.env.CACHE_TTL_SETS || "604800"); // 7 days default
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = (0, cacheUtils_1.getSetListCacheKey)();
        let sets = null;
        let cacheHit = false;
        let cacheAge = 0;
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await index_1.redisCacheService.get(cacheKey);
            sets = (0, cacheUtils_1.parseCacheEntry)(cachedEntry);
            if (sets) {
                context.log("Cache hit for set list");
                cacheHit = true;
                cacheAge = cachedEntry ? (0, cacheUtils_1.getCacheAge)(cachedEntry.timestamp) : 0;
            }
        }
        // If not in cache, check Cosmos DB
        if (!sets) {
            context.log("Cache miss for set list, checking database");
            sets = await index_1.cosmosDbService.getAllSets();
            // If not in database, fetch from external API
            if (!sets || sets.length === 0) {
                context.log("Set list not found in database, fetching from API");
                sets = await index_1.pokemonTcgApiService.getAllSets();
                // Save to database if found
                if (sets && sets.length > 0) {
                    await index_1.cosmosDbService.saveSets(sets);
                }
            }
            // Save to cache if found
            if (sets && sets.length > 0 && process.env.ENABLE_REDIS_CACHE === "true") {
                await index_1.redisCacheService.set(cacheKey, (0, cacheUtils_1.formatCacheEntry)(sets, setsTtl), setsTtl);
            }
        }
        if (!sets || sets.length === 0) {
            const errorResponse = {
                status: 404,
                error: "Set list not found",
                timestamp: new Date().toISOString()
            };
            return {
                jsonBody: errorResponse,
                status: 404
            };
        }
        // Group sets by expansion if requested
        const result = groupByExpansion ? (0, setUtils_1.groupSetsByExpansion)(sets) : sets;
        // Return the set list
        const response = {
            status: 200,
            data: result,
            timestamp: new Date().toISOString(),
            cached: cacheHit,
            cacheAge: cacheHit ? cacheAge : undefined
        };
        return {
            jsonBody: response,
            status: response.status
        };
    }
    catch (error) {
        const errorResponse = (0, errorUtils_1.handleError)(error, "GetSetList");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}
//# sourceMappingURL=index.js.map