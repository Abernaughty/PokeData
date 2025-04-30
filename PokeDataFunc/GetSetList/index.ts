import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Set, SetOrGroup } from "../src/models/Set";
import { ApiResponse } from "../src/models/ApiResponse";
import { getSetListCacheKey, formatCacheEntry, parseCacheEntry, getCacheAge } from "../src/utils/cacheUtils";
import { groupSetsByExpansion } from "../src/utils/setUtils";
import { handleError } from "../src/utils/errorUtils";
import { CosmosDbService } from "../src/services/CosmosDbService";
import { RedisCacheService } from "../src/services/RedisCacheService";
import { PokemonTcgApiService } from "../src/services/PokemonTcgApiService";

// Initialize services
const cosmosDbService = new CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
const redisCacheService = new RedisCacheService(
    process.env.REDIS_CONNECTION_STRING || "",
    process.env.ENABLE_REDIS_CACHE === "true"
);
const pokemonTcgApiService = new PokemonTcgApiService(
    process.env.POKEMON_TCG_API_KEY || "",
    process.env.POKEMON_TCG_API_BASE_URL
);

export async function getSetList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log("Processing request for set list");
        
        // Parse query parameters
        const groupByExpansion = request.query.get("groupByExpansion") === "true";
        const forceRefresh = request.query.get("forceRefresh") === "true";
        const setsTtl = parseInt(process.env.CACHE_TTL_SETS || "604800"); // 7 days default
        
        // Check Redis cache first (if enabled and not forcing refresh)
        const cacheKey = getSetListCacheKey();
        let sets: Set[] | null = null;
        let cacheHit = false;
        let cacheAge = 0;
        
        if (!forceRefresh && process.env.ENABLE_REDIS_CACHE === "true") {
            const cachedEntry = await redisCacheService.get<{ data: Set[]; timestamp: number; ttl: number }>(cacheKey);
            sets = parseCacheEntry<Set[]>(cachedEntry);
            
            if (sets) {
                context.log("Cache hit for set list");
                cacheHit = true;
                cacheAge = cachedEntry ? getCacheAge(cachedEntry.timestamp) : 0;
            }
        }
        
        // If not in cache, check Cosmos DB
        if (!sets) {
            context.log("Cache miss for set list, checking database");
            sets = await cosmosDbService.getAllSets();
            
            // If not in database, fetch from external API
            if (!sets || sets.length === 0) {
                context.log("Set list not found in database, fetching from API");
                sets = await pokemonTcgApiService.getAllSets();
                
                // Save to database if found
                if (sets && sets.length > 0) {
                    await cosmosDbService.saveSets(sets);
                }
            }
            
            // Save to cache if found
            if (sets && sets.length > 0 && process.env.ENABLE_REDIS_CACHE === "true") {
                await redisCacheService.set(cacheKey, formatCacheEntry(sets, setsTtl), setsTtl);
            }
        }
        
        if (!sets || sets.length === 0) {
            const errorResponse: ApiResponse<null> = {
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
        const result = groupByExpansion ? groupSetsByExpansion(sets) : sets;
        
        // Return the set list
        const response: ApiResponse<Set[] | SetOrGroup[]> = {
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
    } catch (error: any) {
        const errorResponse = handleError(error, "GetSetList");
        return {
            jsonBody: errorResponse,
            status: errorResponse.status
        };
    }
}

app.http('getSetList', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets',
    handler: getSetList
});
