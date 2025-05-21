// Cloud API Configuration
export const API_CONFIG = {
  // Base URL for the API Management service
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.subscriptionKey
    };
  },
  
  // URL builder functions
  buildSetsUrl() {
    return `${this.baseUrl}/sets`;
  },
  
  buildCardsForSetUrl(setCode) {
    return `${this.baseUrl}/sets/${encodeURIComponent(setCode)}/cards`;
  },
  
  buildCardInfoUrl(cardId) {
    return `${this.baseUrl}/cards/${encodeURIComponent(cardId)}`;
  },
  
  // Added for compatibility with existing code
  buildPricingUrl(id) {
    return `${this.baseUrl}/cards/${encodeURIComponent(id)}`;
  }
};
