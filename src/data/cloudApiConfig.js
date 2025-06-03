// Cloud API Configuration - Updated for PokeData-First Architecture
export const API_CONFIG = {
  // Base URL for the consolidated Azure Functions (PokeData-first endpoints)
  baseUrl: 'https://pokedata-func.azurewebsites.net/api',
  
  // Function key for Azure Functions authentication
  functionKey: '7dq8aHEWt4ngfLOX6p1tL7-c9Dy6B4-ip3up0cNMl07mAzFuKESTuA==',
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      'Content-Type': 'application/json'
      // Note: Azure Functions use query parameter authentication, not headers
    };
  },
  
  // URL builder functions for consolidated PokeData-first endpoints
  buildSetsUrl() {
    return `${this.baseUrl}/sets?code=${encodeURIComponent(this.functionKey)}`;
  },
  
  buildCardsForSetUrl(setId) {
    return `${this.baseUrl}/sets/${encodeURIComponent(setId)}/cards?code=${encodeURIComponent(this.functionKey)}`;
  },
  
  buildCardInfoUrl(cardId) {
    return `${this.baseUrl}/cards/${encodeURIComponent(cardId)}?code=${encodeURIComponent(this.functionKey)}`;
  },
  
  // Added for compatibility with existing code
  buildPricingUrl(id) {
    return `${this.baseUrl}/cards/${encodeURIComponent(id)}?code=${encodeURIComponent(this.functionKey)}`;
  }
};
