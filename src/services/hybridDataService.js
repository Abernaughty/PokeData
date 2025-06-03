import { pokeDataService } from './pokeDataService';
import { cloudDataService } from './cloudDataService';
import { featureFlagService } from './featureFlagService';

/**
 * Hybrid service that can use either local or cloud implementation
 * based on feature flags
 */
export const hybridDataService = {
  /**
   * Get the list of all Pokémon card sets
   * @param {boolean} forceRefresh - Whether to force a refresh from the API
   * @returns {Promise<Array>} Array of set objects
   */
  async getSetList(forceRefresh = false) {
    if (featureFlagService.useCloudApi()) {
      console.log('Using cloud API for set list');
      return cloudDataService.getSetList(forceRefresh, true);
    } else {
      console.log('Using local API for set list');
      return pokeDataService.getSetList(forceRefresh);
    }
  },
  
  /**
   * Get cards for a specific set
   * @param {string} setCode - The set code
   * @param {string} setId - The set ID
   * @returns {Promise<Array>} Array of card objects
   */
  async getCardsForSet(setCode, setId) {
    if (featureFlagService.useCloudApi()) {
      console.log(`Using cloud API for cards in set ${setCode} (ID: ${setId})`);
      // Use setId for PokeData-first backend, fallback to setCode if setId not available
      const identifier = setId || setCode;
      const result = await cloudDataService.getCardsForSet(identifier);
      return result.items || [];
    } else {
      console.log(`Using local API for cards in set ${setCode}`);
      return pokeDataService.getCardsForSet(setCode, setId);
    }
  },
  
  /**
   * Get pricing data for a specific card
   * @param {string} cardId - The card ID
   * @returns {Promise<Object>} Card pricing data
   */
  async getCardPricing(cardId) {
    if (featureFlagService.useCloudApi()) {
      console.log(`Using cloud API for pricing of card ${cardId}`);
      return cloudDataService.getCardPricing(cardId);
    } else {
      console.log(`Using local API for pricing of card ${cardId}`);
      return pokeDataService.getCardPricing(cardId);
    }
  },
  
  /**
   * Get pricing data for a specific card with metadata
   * @param {string} cardId - The card ID
   * @param {boolean} forceRefresh - Whether to force a refresh from the API
   * @returns {Promise<Object>} Card pricing data with metadata
   */
  async getCardPricingWithMetadata(cardId, forceRefresh = false) {
    if (featureFlagService.useCloudApi()) {
      console.log(`Using cloud API for pricing with metadata of card ${cardId}${forceRefresh ? ' (force refresh)' : ''}`);
      return cloudDataService.getCardPricingWithMetadata(cardId, forceRefresh);
    } else {
      console.log(`Using local API for pricing with metadata of card ${cardId}${forceRefresh ? ' (force refresh)' : ''}`);
      return pokeDataService.getCardPricingWithMetadata(cardId, forceRefresh);
    }
  },
  
  /**
   * Preload current sets data
   * @returns {Promise<boolean>} True if successful
   */
  async preloadCurrentSets() {
    if (featureFlagService.useCloudApi()) {
      console.log('Cloud API does not require preloading current sets');
      return true;
    } else {
      console.log('Using local API to preload current sets');
      return pokeDataService.preloadCurrentSets();
    }
  },
  
  /**
   * Update current sets configuration
   * @returns {Promise<boolean>} True if successful
   */
  async updateCurrentSetsConfiguration() {
    if (featureFlagService.useCloudApi()) {
      console.log('Cloud API does not require updating current sets configuration');
      return true;
    } else {
      console.log('Using local API to update current sets configuration');
      return pokeDataService.updateCurrentSetsConfiguration();
    }
  }
};
