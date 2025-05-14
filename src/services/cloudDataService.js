import { API_CONFIG } from '../data/cloudApiConfig';

/**
 * Service for Pokémon data operations using cloud-based Azure Functions
 */
export const cloudDataService = {
  /**
   * Get the list of all Pokémon card sets
   * @param {boolean} forceRefresh - Whether to force a refresh from the API
   * @param {boolean} groupByExpansion - Whether to group sets by expansion series
   * @returns {Promise<Array|Object>} Array of set objects or grouped sets object
   */
  async getSetList(forceRefresh = false, groupByExpansion = true) {
    try {
      console.log('Getting set list from cloud API...');
      
      const url = new URL(API_CONFIG.buildSetsUrl());
      
      // Add query parameters
      if (forceRefresh) {
        url.searchParams.append('forceRefresh', 'true');
      }
      
      if (groupByExpansion) {
        url.searchParams.append('groupByExpansion', 'true');
      }
      
      const response = await fetch(url.toString(), {
        headers: API_CONFIG.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to get error details');
        console.error(`API error: ${response.status} - ${errorText}`);
        throw new Error(`API error: ${response.status}. Details: ${errorText}`);
      }
      
      const apiResponse = await response.json();
      console.log('API response for sets:', apiResponse);
      
      // Check if the response contains grouped sets (objects with type: 'group')
      if (groupByExpansion && apiResponse.data && Array.isArray(apiResponse.data) && 
          apiResponse.data.length > 0 && apiResponse.data[0].type === 'group') {
        
        console.log('Transforming grouped sets format from backend to frontend format...');
        
        // Transform from backend format to frontend format
        // Backend: [{type: 'group', name: 'X', items: [...]}, ...]
        // Frontend: {'X': [...], 'Y': [...], ...}
        const transformedGroups = {};
        
        apiResponse.data.forEach(group => {
          if (group.type === 'group' && group.name && Array.isArray(group.items)) {
            transformedGroups[group.name] = group.items;
            console.log(`Transformed group "${group.name}" with ${group.items.length} sets`);
          } else {
            console.warn('Skipping invalid group in API response:', group);
          }
        });
        
        console.log('Transformation complete. Returning grouped sets object.');
        return transformedGroups;
      }
      
      // Return the data as-is if not grouped
      console.log('Returning set list as array (not grouped or grouping handled by backend).');
      return apiResponse.data;
    } catch (error) {
      console.error('Error fetching sets from cloud API:', error);
      throw error;
    }
  },
  
  /**
   * Get cards for a specific set
   * @param {string} setCode - The set code
   * @param {Object} options - Additional options
   * @param {boolean} options.forceRefresh - Whether to force a refresh from the API
   * @param {number} options.page - Page number for pagination
   * @param {number} options.pageSize - Number of items per page
   * @returns {Promise<Object>} Paginated array of card objects
   */
  async getCardsForSet(setCode, options = {}) {
    try {
      if (!setCode) {
        console.error('Set code is required to fetch cards');
        return { items: [], totalCount: 0, pageNumber: 1, pageSize: 100, totalPages: 0 };
      }
      
      console.log(`Fetching cards for set ${setCode} from cloud API...`);
      
      const url = new URL(API_CONFIG.buildCardsForSetUrl(setCode));
      
      // Add query parameters
      if (options.forceRefresh) {
        url.searchParams.append('forceRefresh', 'true');
      }
      
      if (options.page) {
        url.searchParams.append('page', options.page.toString());
      }
      
      if (options.pageSize) {
        url.searchParams.append('pageSize', options.pageSize.toString());
      }
      
      const response = await fetch(url.toString(), {
        headers: API_CONFIG.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to get error details');
        console.error(`API error for set ${setCode}: ${response.status} - ${errorText}`);
        throw new Error(`API error: ${response.status}. Details: ${errorText}`);
      }
      
      const apiResponse = await response.json();
      console.log(`API response for set ${setCode}:`, apiResponse);
      
      // Return the paginated data from the response
      return apiResponse.data;
    } catch (error) {
      console.error(`Error fetching cards for set ${setCode} from cloud API:`, error);
      throw error;
    }
  },
  
  /**
   * Get pricing data for a specific card
   * @param {string} cardId - The card ID
   * @param {boolean} forceRefresh - Whether to force a refresh from the API
   * @returns {Promise<Object>} Card data with pricing information
   */
  async getCardPricing(cardId, forceRefresh = false) {
    try {
      if (!cardId) {
        throw new Error('Card ID is required to fetch pricing data');
      }

      console.log(`Getting pricing data for card ID: ${cardId} from cloud API`);
      
      const url = new URL(API_CONFIG.buildCardInfoUrl(cardId));
      
      // Add query parameters
      if (forceRefresh) {
        url.searchParams.append('forceRefresh', 'true');
      }
      
      const response = await fetch(url.toString(), {
        headers: API_CONFIG.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to get error details');
        console.error(`API error for card ${cardId}: ${response.status} - ${errorText}`);
        throw new Error(`API error: ${response.status}. Details: ${errorText}`);
      }
      
      const apiResponse = await response.json();
      console.log(`Pricing API response for card ${cardId}:`, apiResponse);
      
      // Return the card data from the response
      return apiResponse.data;
    } catch (error) {
      console.error(`Error fetching pricing for card ${cardId} from cloud API:`, error);
      throw error;
    }
  },
  
  /**
   * Get pricing data for a specific card with metadata
   * @param {string} cardId - The card ID
   * @param {boolean} forceRefresh - Whether to force a refresh from the API
   * @returns {Promise<Object>} Card pricing data with metadata
   */
  async getCardPricingWithMetadata(cardId, forceRefresh = false) {
    try {
      if (!cardId) {
        throw new Error('Card ID is required to fetch pricing data');
      }

      console.log(`Getting pricing data with metadata for card ID: ${cardId} from cloud API`);
      
      const url = new URL(API_CONFIG.buildCardInfoUrl(cardId));
      
      // Add query parameters
      if (forceRefresh) {
        url.searchParams.append('forceRefresh', 'true');
      }
      
      const response = await fetch(url.toString(), {
        headers: API_CONFIG.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to get error details');
        console.error(`API error for card ${cardId}: ${response.status} - ${errorText}`);
        throw new Error(`API error: ${response.status}. Details: ${errorText}`);
      }
      
      const apiResponse = await response.json();
      console.log(`Pricing API response for card ${cardId}:`, apiResponse);
      
      // Return the data with metadata
      return {
        data: apiResponse.data,
        timestamp: new Date(apiResponse.timestamp).getTime(),
        fromCache: apiResponse.cached || false,
        cacheAge: apiResponse.cacheAge || 0
      };
    } catch (error) {
      console.error(`Error fetching pricing for card ${cardId} from cloud API:`, error);
      throw error;
    }
  }
};
