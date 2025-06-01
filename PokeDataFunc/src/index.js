"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pokeDataApiService = exports.pokemonTcgApiService = exports.blobStorageService = exports.redisCacheService = exports.cosmosDbService = void 0;
const functions_1 = require("@azure/functions");
const CosmosDbService_1 = require("./services/CosmosDbService");
const RedisCacheService_1 = require("./services/RedisCacheService");
const BlobStorageService_1 = require("./services/BlobStorageService");
const PokemonTcgApiService_1 = require("./services/PokemonTcgApiService");
const PokeDataApiService_1 = require("./services/PokeDataApiService");
// Initialize shared services
exports.cosmosDbService = new CosmosDbService_1.CosmosDbService(process.env.COSMOSDB_CONNECTION_STRING || "");
exports.redisCacheService = new RedisCacheService_1.RedisCacheService(process.env.REDIS_CONNECTION_STRING || "", process.env.ENABLE_REDIS_CACHE === "true");
exports.blobStorageService = new BlobStorageService_1.BlobStorageService(process.env.BLOB_STORAGE_CONNECTION_STRING || "");
exports.pokemonTcgApiService = new PokemonTcgApiService_1.PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY || "", process.env.POKEMON_TCG_API_BASE_URL);
exports.pokeDataApiService = new PokeDataApiService_1.PokeDataApiService(process.env.POKEDATA_API_KEY || "", process.env.POKEDATA_API_BASE_URL);
// Import function handlers
const GetSetList_1 = require("./functions/GetSetList");
const GetCardInfo_1 = require("./functions/GetCardInfo");
const GetCardsBySet_1 = require("./functions/GetCardsBySet");
const RefreshData_1 = require("./functions/RefreshData");
// Register functions
functions_1.app.http('getSetList', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets',
    handler: GetSetList_1.getSetList
});
functions_1.app.http('getCardInfo', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'cards/{cardId}',
    handler: GetCardInfo_1.getCardInfo
});
functions_1.app.http('getCardsBySet', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets/{setCode}/cards',
    handler: GetCardsBySet_1.getCardsBySet
});
// Register timer-triggered function
functions_1.app.timer('refreshData', {
    schedule: '0 0 */12 * * *',
    handler: RefreshData_1.refreshData
});
//# sourceMappingURL=index.js.map