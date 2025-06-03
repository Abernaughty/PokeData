"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageEnhancementService = void 0;
/**
 * Service for enhancing PokeData cards with Pokemon TCG images and metadata
 * This is the core service for the PokeData-first architecture
 */
class ImageEnhancementService {
    constructor(mappingService, pokemonTcgService) {
        this.mappingService = mappingService;
        this.pokemonTcgService = pokemonTcgService;
    }
    /**
     * Enhance a PokeData card with Pokemon TCG images and metadata
     * @param pokeDataCard - The PokeData card to enhance
     * @param pokeDataSetId - The PokeData set ID (used for mapping)
     * @returns Enhanced card with images and metadata when available
     */
    async enhanceCardWithImages(pokeDataCard, pokeDataSetId) {
        console.log(`[ImageEnhancementService] Enhancing card: ${pokeDataCard.name} (ID: ${pokeDataCard.id}) from set ${pokeDataSetId}`);
        try {
            // Step 1: Get Pokemon TCG set ID from PokeData set ID
            const tcgSetId = this.mappingService.getTcgSetId(pokeDataSetId);
            if (!tcgSetId) {
                console.log(`[ImageEnhancementService] No TCG mapping found for PokeData set ID ${pokeDataSetId}`);
                return { ...pokeDataCard };
            }
            // Step 2: Construct Pokemon TCG card ID
            const tcgCardId = `${tcgSetId}-${pokeDataCard.num}`;
            console.log(`[ImageEnhancementService] Attempting to fetch TCG card: ${tcgCardId}`);
            // Step 3: Get Pokemon TCG card data
            const tcgCard = await this.pokemonTcgService.getCard(tcgCardId);
            if (!tcgCard) {
                console.log(`[ImageEnhancementService] No TCG card found for ID: ${tcgCardId}`);
                return { ...pokeDataCard };
            }
            // Step 4: Extract images and metadata
            const enhancement = {
                tcgSetId,
                tcgCardId,
                metadata: {
                    hp: tcgCard.cardName ? undefined : tcgCard.cardName, // Will be populated from TCG API response
                    types: [], // Will be populated from TCG API response
                    rarity: tcgCard.rarity
                },
                enhancedAt: new Date().toISOString()
            };
            const enhancedCard = {
                ...pokeDataCard,
                images: {
                    small: tcgCard.imageUrl || '',
                    large: tcgCard.imageUrlHiRes || ''
                },
                enhancement
            };
            console.log(`[ImageEnhancementService] Successfully enhanced card: ${pokeDataCard.name} with images from ${tcgCardId}`);
            return enhancedCard;
        }
        catch (error) {
            console.error(`[ImageEnhancementService] Error enhancing card ${pokeDataCard.name}: ${error.message}`);
            // Return original card if enhancement fails
            return { ...pokeDataCard };
        }
    }
    /**
     * Enhance a PokeData pricing card with Pokemon TCG images and metadata
     * This is used for the GetCardInfo function that includes pricing data
     * @param pokeDataPricing - The PokeData pricing card to enhance
     * @returns Enhanced pricing card with images and metadata when available
     */
    async enhancePricingCardWithImages(pokeDataPricing) {
        console.log(`[ImageEnhancementService] Enhancing pricing card: ${pokeDataPricing.name} (ID: ${pokeDataPricing.id}) from set ${pokeDataPricing.set_id}`);
        try {
            // Step 1: Get Pokemon TCG set ID from PokeData set ID
            const tcgSetId = this.mappingService.getTcgSetId(pokeDataPricing.set_id);
            if (!tcgSetId) {
                console.log(`[ImageEnhancementService] No TCG mapping found for PokeData set ID ${pokeDataPricing.set_id}`);
                return { ...pokeDataPricing };
            }
            // Step 2: Construct Pokemon TCG card ID
            const tcgCardId = `${tcgSetId}-${pokeDataPricing.num}`;
            console.log(`[ImageEnhancementService] Attempting to fetch TCG card: ${tcgCardId}`);
            // Step 3: Get Pokemon TCG card data
            const tcgCard = await this.pokemonTcgService.getCard(tcgCardId);
            if (!tcgCard) {
                console.log(`[ImageEnhancementService] No TCG card found for ID: ${tcgCardId}`);
                return { ...pokeDataPricing };
            }
            // Step 4: Extract images and metadata
            const enhancement = {
                tcgSetId,
                tcgCardId,
                metadata: {
                    rarity: tcgCard.rarity
                },
                enhancedAt: new Date().toISOString()
            };
            const enhancedPricingCard = {
                ...pokeDataPricing,
                images: {
                    small: tcgCard.imageUrl || '',
                    large: tcgCard.imageUrlHiRes || ''
                },
                enhancement
            };
            console.log(`[ImageEnhancementService] Successfully enhanced pricing card: ${pokeDataPricing.name} with images from ${tcgCardId}`);
            return enhancedPricingCard;
        }
        catch (error) {
            console.error(`[ImageEnhancementService] Error enhancing pricing card ${pokeDataPricing.name}: ${error.message}`);
            // Return original card if enhancement fails
            return { ...pokeDataPricing };
        }
    }
    /**
     * Enhance multiple PokeData cards with Pokemon TCG images in batch
     * @param pokeDataCards - Array of PokeData cards to enhance
     * @param pokeDataSetId - The PokeData set ID (used for mapping)
     * @returns Array of enhanced cards
     */
    async enhanceCardsWithImages(pokeDataCards, pokeDataSetId) {
        console.log(`[ImageEnhancementService] Batch enhancing ${pokeDataCards.length} cards from set ${pokeDataSetId}`);
        // Check if mapping exists before processing any cards
        const tcgSetId = this.mappingService.getTcgSetId(pokeDataSetId);
        if (!tcgSetId) {
            console.log(`[ImageEnhancementService] No TCG mapping found for PokeData set ID ${pokeDataSetId}, returning cards without enhancement`);
            return pokeDataCards.map(card => ({ ...card }));
        }
        // Process cards in parallel for better performance
        const enhancementPromises = pokeDataCards.map(card => this.enhanceCardWithImages(card, pokeDataSetId));
        try {
            const enhancedCards = await Promise.all(enhancementPromises);
            const successCount = enhancedCards.filter(card => card.images).length;
            console.log(`[ImageEnhancementService] Successfully enhanced ${successCount}/${pokeDataCards.length} cards with images`);
            return enhancedCards;
        }
        catch (error) {
            console.error(`[ImageEnhancementService] Error in batch enhancement: ${error.message}`);
            // Return original cards if batch enhancement fails
            return pokeDataCards.map(card => ({ ...card }));
        }
    }
    /**
     * Check if a PokeData set can be enhanced with Pokemon TCG images
     * @param pokeDataSetId - The PokeData set ID to check
     * @returns true if enhancement is possible, false otherwise
     */
    canEnhanceSet(pokeDataSetId) {
        return this.mappingService.hasMapping(pokeDataSetId);
    }
    /**
     * Get enhancement statistics for debugging
     * @returns Object with enhancement capabilities info
     */
    getEnhancementStats() {
        const mappedSetIds = this.mappingService.getMappedPokeDataSetIds();
        const unmappedSets = this.mappingService.getUnmappedPokeDataSets();
        return {
            totalMappedSets: mappedSetIds.length,
            totalUnmappedSets: unmappedSets.length,
            mappedSetIds: mappedSetIds.slice(0, 10), // First 10 for debugging
            enhancementCoverage: `${mappedSetIds.length}/${mappedSetIds.length + unmappedSets.length} sets`
        };
    }
}
exports.ImageEnhancementService = ImageEnhancementService;
//# sourceMappingURL=ImageEnhancementService.js.map