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
exports.setMappingService = exports.SetMappingService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SetMappingService {
    constructor() {
        this.mappingData = null;
        this.mappingFilePath = path.join(__dirname, '../../data/set-mapping.json');
    }
    /**
     * Load the set mapping data from the JSON file
     */
    loadMappingData() {
        if (this.mappingData) {
            return this.mappingData;
        }
        try {
            const mappingContent = fs.readFileSync(this.mappingFilePath, 'utf8');
            this.mappingData = JSON.parse(mappingContent);
            return this.mappingData;
        }
        catch (error) {
            console.error('Failed to load set mapping data:', error);
            // Return empty mapping data as fallback
            return {
                metadata: {
                    generated: new Date().toISOString(),
                    totalMappings: 0,
                    unmappedTcg: 0,
                    unmappedPokeData: 0
                },
                mappings: {},
                unmapped: {
                    pokemonTcg: [],
                    pokeData: []
                }
            };
        }
    }
    /**
     * Get PokeData set ID from Pokemon TCG set code
     * @param tcgSetCode - Pokemon TCG set code (e.g., "sv8pt5")
     * @returns PokeData set ID or null if not found
     */
    getPokeDataSetId(tcgSetCode) {
        const mappingData = this.loadMappingData();
        const mapping = mappingData.mappings[tcgSetCode];
        if (mapping) {
            return mapping.pokeDataId;
        }
        return null;
    }
    /**
     * Get PokeData set code from Pokemon TCG set code
     * @param tcgSetCode - Pokemon TCG set code (e.g., "sv8pt5")
     * @returns PokeData set code or null if not found
     */
    getPokeDataSetCode(tcgSetCode) {
        const mappingData = this.loadMappingData();
        const mapping = mappingData.mappings[tcgSetCode];
        if (mapping) {
            return mapping.pokeDataCode;
        }
        return null;
    }
    /**
     * Get complete mapping information for a Pokemon TCG set code
     * @param tcgSetCode - Pokemon TCG set code (e.g., "sv8pt5")
     * @returns Complete mapping information or null if not found
     */
    getSetMapping(tcgSetCode) {
        const mappingData = this.loadMappingData();
        return mappingData.mappings[tcgSetCode] || null;
    }
    /**
     * Check if a Pokemon TCG set code has a mapping
     * @param tcgSetCode - Pokemon TCG set code (e.g., "sv8pt5")
     * @returns true if mapping exists, false otherwise
     */
    hasMapping(tcgSetCode) {
        const mappingData = this.loadMappingData();
        return tcgSetCode in mappingData.mappings;
    }
    /**
     * Get mapping statistics
     * @returns Mapping metadata
     */
    getMappingStats() {
        const mappingData = this.loadMappingData();
        return mappingData.metadata;
    }
    /**
     * Get all unmapped Pokemon TCG sets
     * @returns Array of unmapped Pokemon TCG sets
     */
    getUnmappedTcgSets() {
        const mappingData = this.loadMappingData();
        return mappingData.unmapped.pokemonTcg;
    }
    /**
     * Get all unmapped PokeData sets
     * @returns Array of unmapped PokeData sets
     */
    getUnmappedPokeDataSets() {
        const mappingData = this.loadMappingData();
        return mappingData.unmapped.pokeData;
    }
    /**
     * Reload mapping data from file (useful for updates)
     */
    reloadMappingData() {
        this.mappingData = null;
        this.loadMappingData();
    }
}
exports.SetMappingService = SetMappingService;
// Export a singleton instance
exports.setMappingService = new SetMappingService();
//# sourceMappingURL=SetMappingService.js.map