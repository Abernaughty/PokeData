// API Configuration
export const API_CONFIG = {
  // Base URL for the API
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'Content-Type': 'application/json'
    };
  },
  
  // URL builder functions - Updated to match API Management endpoints
  buildPricingUrl(id) {
    return `${this.baseUrl}/cards/${encodeURIComponent(id)}`;
  },
  
  buildSetsUrl() {
    return `${this.baseUrl}/sets`;
  },
  
  buildCardsForSetUrl(setCode) {
    return `${this.baseUrl}/sets/${encodeURIComponent(setCode)}/cards`;
  }
};
