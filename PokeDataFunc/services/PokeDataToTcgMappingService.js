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
exports.pokeDataToTcgMappingService = exports.PokeDataToTcgMappingService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Service for mapping PokeData set IDs to Pokemon TCG set IDs
 * This is the reverse of the existing SetMappingService and is used
 * for the PokeData-first architecture where we need to enhance
 * PokeData cards with Pokemon TCG images.
 */
class PokeDataToTcgMappingService {
    constructor() {
        this.mappingData = null;
        this.reverseMapping = {}; // PokeData ID -> TCG Set ID
        this.reverseMappingLoaded = false;
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
     * Generate the reverse mapping from PokeData set ID to Pokemon TCG set ID
     */
    generateReverseMapping() {
        if (this.reverseMappingLoaded) {
            return;
        }
        const mappingData = this.loadMappingData();
        this.reverseMapping = {};
        // Iterate through all mappings and create reverse lookup
        Object.entries(mappingData.mappings).forEach(([tcgSetId, mapping]) => {
            this.reverseMapping[mapping.pokeDataId] = tcgSetId;
        });
        this.reverseMappingLoaded = true;
        console.log(`[PokeDataToTcgMappingService] Generated reverse mapping for ${Object.keys(this.reverseMapping).length} sets`);
    }
    /**
     * Get Pokemon TCG set ID from PokeData set ID
     * @param pokeDataSetId - PokeData set ID (e.g., 557)
     * @returns Pokemon TCG set ID (e.g., "sv8pt5") or null if not found
     */
    getTcgSetId(pokeDataSetId) {
        this.generateReverseMapping();
        const tcgSetId = this.reverseMapping[pokeDataSetId];
        if (tcgSetId) {
            console.log(`[PokeDataToTcgMappingService] Mapped PokeData set ID ${pokeDataSetId} to TCG set ID ${tcgSetId}`);
            return tcgSetId;
        }
        console.log(`[PokeDataToTcgMappingService] No mapping found for PokeData set ID ${pokeDataSetId}`);
        return null;
    }
    /**
     * Get complete mapping information for a PokeData set ID
     * @param pokeDataSetId - PokeData set ID (e.g., 557)
     * @returns Complete mapping information or null if not found
     */
    getSetMapping(pokeDataSetId) {
        this.generateReverseMapping();
        const tcgSetId = this.reverseMapping[pokeDataSetId];
        if (!tcgSetId) {
            return null;
        }
        const mappingData = this.loadMappingData();
        return mappingData.mappings[tcgSetId] || null;
    }
    /**
     * Check if a PokeData set ID has a mapping to Pokemon TCG
     * @param pokeDataSetId - PokeData set ID (e.g., 557)
     * @returns true if mapping exists, false otherwise
     */
    hasMapping(pokeDataSetId) {
        this.generateReverseMapping();
        return pokeDataSetId in this.reverseMapping;
    }
    /**
     * Get all available PokeData set IDs that have mappings
     * @returns Array of PokeData set IDs that can be mapped to Pokemon TCG
     */
    getMappedPokeDataSetIds() {
        this.generateReverseMapping();
        return Object.keys(this.reverseMapping).map(id => parseInt(id));
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
     * Get all unmapped PokeData sets (sets that don't have Pokemon TCG equivalents)
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
        this.reverseMappingLoaded = false;
        this.reverseMapping = {};
        this.loadMappingData();
    }
    /**
     * Get the reverse mapping object for debugging purposes
     * @returns The complete reverse mapping object
     */
    getReverseMappingDebug() {
        this.generateReverseMapping();
        return { ...this.reverseMapping };
    }
}
exports.PokeDataToTcgMappingService = PokeDataToTcgMappingService;
// Export a singleton instance
exports.pokeDataToTcgMappingService = new PokeDataToTcgMappingService();
//# sourceMappingURL=PokeDataToTcgMappingService.js.map