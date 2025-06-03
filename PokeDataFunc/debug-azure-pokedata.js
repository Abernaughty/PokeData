// Debug script to test PokeData API directly in Azure environment
const axios = require('axios');

async function debugPokeDataApi() {
    console.log('🔍 Debugging PokeData API in Azure environment');
    
    // Check environment variables
    console.log('Environment variables:');
    console.log('POKEDATA_API_KEY:', process.env.POKEDATA_API_KEY ? 'SET (length: ' + process.env.POKEDATA_API_KEY.length + ')' : 'NOT SET');
    console.log('POKEDATA_API_BASE_URL:', process.env.POKEDATA_API_BASE_URL || 'NOT SET (will use default)');
    
    const apiKey = process.env.POKEDATA_API_KEY || "";
    const baseUrl = process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
    const url = `${baseUrl}/sets`;
    
    console.log('Full URL:', url);
    console.log('API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
    
    try {
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        
        console.log('Making request with headers:', {
            'Authorization': `Bearer ${apiKey.substring(0, 20)}...`,
            'Content-Type': 'application/json'
        });
        
        const response = await axios.get(url, { headers });
        
        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
        console.log('Data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
        
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('First set:', JSON.stringify(response.data[0], null, 2));
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

// Export for use in Azure Functions
module.exports = { debugPokeDataApi };

// Run if called directly
if (require.main === module) {
    debugPokeDataApi().then(result => {
        console.log('Debug complete');
        process.exit(0);
    }).catch(error => {
        console.error('Debug failed:', error);
        process.exit(1);
    });
}
