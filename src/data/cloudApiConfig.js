// Cloud API Configuration
export const API_CONFIG = {
  // Base URL for the Azure Functions API
  baseUrl: 'https://pokedata-func.azurewebsites.net/api',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4', // Same key as current API
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'Content-Type': 'application/json'
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
  }
};
