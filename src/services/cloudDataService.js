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
      
      // Ensure we extract the array of sets from the response
      let setsArray = [];
      
      if (apiResponse && Array.isArray(apiResponse)) {
        // Direct array response
        setsArray = apiResponse;
      } else if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
        // Data wrapper with array
        setsArray = apiResponse.data;
      } else if (apiResponse && apiResponse.sets && Array.isArray(apiResponse.sets)) {
        // Sets wrapper with array
        setsArray = apiResponse.sets;
      } else {
        console.warn('Unexpected API response format:', apiResponse);
        // Return empty array as fallback
        return [];
      }
      
      // Check if the response contains grouped sets (objects with type: 'group')
      if (groupByExpansion && setsArray.length > 0 && setsArray[0].type === 'group') {
        console.log('Transforming grouped sets format from backend to frontend format...');
        
        // Transform from backend format to frontend format
        // Backend: [{type: 'group', name: 'X', items: [...]}, ...]
        // Frontend: {'X': [...], 'Y': [...], ...}
        const transformedGroups = {};
        
        setsArray.forEach(group => {
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
      console.log(`Returning set list as array with ${setsArray.length} sets`);
      return setsArray;
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
      
      // Extract the cards data from the response
      let cardsData = { items: [], totalCount: 0, pageNumber: 1, pageSize: 100, totalPages: 0 };
      
      if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.data && typeof apiResponse.data === 'object') {
          // Data wrapper with pagination info
          cardsData = apiResponse.data;
        } else if (Array.isArray(apiResponse)) {
          // Direct array of cards
          cardsData = { 
            items: apiResponse,
            totalCount: apiResponse.length,
            pageNumber: 1,
            pageSize: apiResponse.length,
            totalPages: 1
          };
        } else if (apiResponse.cards && Array.isArray(apiResponse.cards)) {
          // Cards wrapper with array
          cardsData = {
            items: apiResponse.cards,
            totalCount: apiResponse.cards.length,
            pageNumber: 1,
            pageSize: apiResponse.cards.length,
            totalPages: 1
          };
        }
      }
      
      // Transform card data to match expected format
      if (cardsData.items && Array.isArray(cardsData.items)) {
        cardsData.items = cardsData.items.map(card => {
          // Create a transformed card, mapping properties from API format to frontend format
          const transformedCard = {
            ...card, // Keep all original properties
            // Map cardName to name if it doesn't already exist
            name: card.name || card.cardName || `${card.setName} ${card.cardNumber || card.id}`,
            // Map cardNumber to num if it doesn't already exist
            num: card.num || card.cardNumber || '',
            // Ensure the image URL is available
            image_url: card.image_url || card.imageUrl || (card.images ? (card.images.small || card.images.large) : '')
          };
          
          return transformedCard;
        });
        
        console.log(`Transformed ${cardsData.items.length} cards to match frontend format`);
      }
      
      console.log(`Processed ${cardsData.items ? cardsData.items.length : 0} cards for set ${setCode}`);
      return cardsData;
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
      
      // Extract the card data from the response
      let cardData = null;
      
      if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.data) {
          // Data wrapper
          cardData = apiResponse.data;
        } else if (apiResponse.card) {
          // Card wrapper
          cardData = apiResponse.card;
        } else if (!apiResponse.data && !apiResponse.card && Object.keys(apiResponse).length > 0) {
          // Direct card object
          cardData = apiResponse;
        }
      }
      
      if (!cardData) {
        console.warn(`No valid card data found in API response for card ${cardId}`);
        return null;
      }
      
      // Transform the card data to include pricing in the expected format
      const transformedCard = {
        ...cardData,
        pricing: {} // Create the pricing object expected by the frontend
      };
      
      // Process TCG Player pricing if it exists
      if (cardData.tcgPlayerPrice) {
        // Map TCG Player pricing values to the expected format
        if (cardData.tcgPlayerPrice.market) {
          transformedCard.pricing.market = { value: cardData.tcgPlayerPrice.market, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.low) {
          transformedCard.pricing.low = { value: cardData.tcgPlayerPrice.low, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.mid) {
          transformedCard.pricing.mid = { value: cardData.tcgPlayerPrice.mid, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.high) {
          transformedCard.pricing.high = { value: cardData.tcgPlayerPrice.high, currency: 'USD' };
        }
      }
      
      // Process enhanced pricing if it exists
      if (cardData.enhancedPricing) {
        // Add PSA graded prices if they exist
        if (cardData.enhancedPricing.psaGrades) {
          Object.entries(cardData.enhancedPricing.psaGrades).forEach(([grade, priceInfo]) => {
            transformedCard.pricing[`psa-${grade}`] = priceInfo;
          });
        }
        // Add CGC graded prices if they exist
        if (cardData.enhancedPricing.cgcGrades) {
          Object.entries(cardData.enhancedPricing.cgcGrades).forEach(([grade, priceInfo]) => {
            transformedCard.pricing[`cgc-${grade}`] = priceInfo;
          });
        }
        // Add eBay raw price if it exists
        if (cardData.enhancedPricing.ebayRaw) {
          transformedCard.pricing.ebayRaw = cardData.enhancedPricing.ebayRaw;
        }
      }
      
      console.log(`Successfully processed pricing data for card ${cardId}`);
      console.log('Transformed pricing format:', transformedCard.pricing);
      return transformedCard;
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
      
      // Extract the card data from the response
      let cardData = null;
      
      if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.data) {
          // Data wrapper
          cardData = apiResponse.data;
        } else if (apiResponse.card) {
          // Card wrapper
          cardData = apiResponse.card;
        } else if (!apiResponse.data && !apiResponse.card && Object.keys(apiResponse).length > 0) {
          // Direct card object
          cardData = apiResponse;
        }
      }
      
      if (!cardData) {
        console.warn(`No valid card data found in API response for card ${cardId}`);
        return {
          data: null,
          timestamp: Date.now(),
          fromCache: false,
          cacheAge: 0
        };
      }
      
      // Get metadata from response or use defaults
      const timestamp = apiResponse.timestamp ? new Date(apiResponse.timestamp).getTime() : Date.now();
      const fromCache = apiResponse.cached || false;
      const cacheAge = apiResponse.cacheAge || 0;
      
      console.log(`Successfully processed pricing data for card ${cardId}`);
      // Add stale indicator logic for consistency with local API
      const now = Date.now();
      const dataAge = now - timestamp;
      const isStale = dataAge > 24 * 60 * 60 * 1000; // 24 hours
      
      // Transform the card data to include pricing in the expected format as we do in getCardPricing
      const transformedCard = {
        ...cardData,
        pricing: {} // Create the pricing object expected by the frontend
      };
      
      // Process TCG Player pricing if it exists
      if (cardData.tcgPlayerPrice) {
        // Map TCG Player pricing values to the expected format
        if (cardData.tcgPlayerPrice.market) {
          transformedCard.pricing.market = { value: cardData.tcgPlayerPrice.market, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.low) {
          transformedCard.pricing.low = { value: cardData.tcgPlayerPrice.low, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.mid) {
          transformedCard.pricing.mid = { value: cardData.tcgPlayerPrice.mid, currency: 'USD' };
        }
        if (cardData.tcgPlayerPrice.high) {
          transformedCard.pricing.high = { value: cardData.tcgPlayerPrice.high, currency: 'USD' };
        }
      }
      
      // Process enhanced pricing if it exists
      if (cardData.enhancedPricing) {
        // Add PSA graded prices if they exist
        if (cardData.enhancedPricing.psaGrades) {
          Object.entries(cardData.enhancedPricing.psaGrades).forEach(([grade, priceInfo]) => {
            transformedCard.pricing[`psa-${grade}`] = priceInfo;
          });
        }
        // Add CGC graded prices if they exist
        if (cardData.enhancedPricing.cgcGrades) {
          Object.entries(cardData.enhancedPricing.cgcGrades).forEach(([grade, priceInfo]) => {
            transformedCard.pricing[`cgc-${grade}`] = priceInfo;
          });
        }
        // Add eBay raw price if it exists
        if (cardData.enhancedPricing.ebayRaw) {
          transformedCard.pricing.ebayRaw = cardData.enhancedPricing.ebayRaw;
        }
      }
      
      console.log('Transformed pricing data for with-metadata response');
      
      return {
        data: transformedCard,
        timestamp: timestamp,
        fromCache: fromCache,
        cacheAge: cacheAge,
        isStale: isStale
      };
    } catch (error) {
      console.error(`Error fetching pricing for card ${cardId} from cloud API:`, error);
      throw error;
    }
  }
};
