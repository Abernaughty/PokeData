// API Configuration
export const API_CONFIG = {
  // Base URL for the API
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api/v0',
  
  // API key for authentication
  apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzMxNzE0MiwianRpIjoiNjJkNWU1ZjktNTI5ZC00NGIyLTlkMTgtOTY3NWQ3ZTU3NWMwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjJlZGY1N2Y2LWU5OTYtNGNhMy1iZDk5LTFlZDY3MDRkMzJhOSIsIm5iZiI6MTczNzMxNzE0MiwidG9rZW5fdHlwZSI6ImFwaSJ9.y4JduoyU_gG1aiBy4w6frD3h3m-AEoxw_7f6vExYay4',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  // Endpoints
  endpoints: {
    pricing: '/pricing', // Get Info and Pricing for Card or Product
    sets: '/sets',      // List All Sets 
    set: '/set'         // List Cards in Set
  },
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      //'Authorization': `Bearer ${this.apiKey}`,
      //'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'Content-Type': 'application/json'
    };
  },
  
  // URL builder functions
  buildPricingUrl(id) {
    return `${this.baseUrl}${this.endpoints.pricing}?id=${encodeURIComponent(id)}&asset_type=CARD`;
  },
  
  buildSetsUrl() {
    return `${this.baseUrl}${this.endpoints.sets}`;
  },
  
  buildCardsForSetUrl(setId) {
    return `${this.baseUrl}${this.endpoints.set}?set_id=${encodeURIComponent(setId)}`;
  }
};