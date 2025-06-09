"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pokeDataApiService = exports.pokemonTcgApiService = exports.blobStorageService = exports.redisCacheService = exports.cosmosDbService = void 0;
const azureFunctions = __importStar(require("@azure/functions"));
const { app } = azureFunctions;
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
app.http('getSetList', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets',
    handler: GetSetList_1.getSetList
});
app.http('getCardInfo', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'cards/{cardId}',
    handler: GetCardInfo_1.getCardInfo
});
app.http('getCardsBySet', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets/{setId}/cards',
    handler: GetCardsBySet_1.getCardsBySet
});
// Register timer-triggered function
app.timer('refreshData', {
    schedule: '0 0 */12 * * *',
    handler: RefreshData_1.refreshData
});
//# sourceMappingURL=index.js.map