/**
 * Test script for the enhanced GetCardInfo function
 * This demonstrates the PokeData API integration
 */

const axios = require('axios');

// Configuration
const FUNCTION_URL = 'http://localhost:7071/api/cards/sv3pt5-172'; // A valid Pokemon card ID in Pokemon TCG API format
const FORCE_REFRESH = true; // Force refresh to ensure we get latest pricing data

async function testCardInfo() {
    console.log('========================================================');
    console.log('     Testing GetCardInfo with PokeData API Integration');
    console.log('========================================================');
    
    console.log(`Making request to: ${FUNCTION_URL}${FORCE_REFRESH ? '?forceRefresh=true' : ''}`);
    
    try {
        const response = await axios.get(`${FUNCTION_URL}${FORCE_REFRESH ? '?forceRefresh=true' : ''}`);
        
        if (response.data && response.data.data) {
            const card = response.data.data;
            
            console.log('\n✅ Card data retrieved successfully!');
            console.log('\nBasic Card Information:');
            console.log(`- Name: ${card.cardName}`);
            console.log(`- Set: ${card.setName} (${card.setCode})`);
            console.log(`- Number: ${card.cardNumber}`);
            
            // Check for PokeData ID
            console.log('\nPokeData Integration:');
            if (card.pokeDataId) {
                console.log(`- PokeData ID: ${card.pokeDataId} ✅`);
            } else {
                console.log(`- PokeData ID: Not found ❌`);
            }
            
            // Check for raw pricing data
            if (card.pricing) {
                console.log(`- Raw PokeData Pricing: Present ✅`);
                console.log(`- Pricing Last Updated: ${card.pricingLastUpdated}`);
                
                // Show a sample of the pricing data
                console.log('\nSample Raw Pricing Data:');
                const pricingKeys = Object.keys(card.pricing);
                const sampleKeys = pricingKeys.slice(0, Math.min(3, pricingKeys.length));
                sampleKeys.forEach(key => {
                    console.log(`  - ${key}: $${card.pricing[key].value}`);
                });
            } else {
                console.log(`- Raw PokeData Pricing: Not found ❌`);
            }
            
            // Check for enhanced pricing data (the original format)
            if (card.enhancedPricing) {
                console.log(`- Enhanced Pricing: Present ✅`);
                
                // Show some of the enhanced pricing data
                console.log('\nEnhanced Pricing Data:');
                
                if (card.enhancedPricing.psaGrades) {
                    const psaKeys = Object.keys(card.enhancedPricing.psaGrades);
                    console.log(`- PSA Grades: ${psaKeys.length} grades available`);
                    
                    // Show a sample
                    if (psaKeys.length > 0) {
                        const samplePsa = psaKeys[psaKeys.length - 1]; // Usually PSA 10 is most interesting
                        console.log(`  - PSA ${samplePsa}: $${card.enhancedPricing.psaGrades[samplePsa].value}`);
                    }
                }
                
                if (card.enhancedPricing.cgcGrades) {
                    const cgcKeys = Object.keys(card.enhancedPricing.cgcGrades);
                    console.log(`- CGC Grades: ${cgcKeys.length} grades available`);
                    
                    // Show a sample
                    if (cgcKeys.length > 0) {
                        const sampleCgc = cgcKeys[cgcKeys.length - 1]; // Usually CGC 9.5 or 10 is most interesting
                        console.log(`  - CGC ${sampleCgc.replace('_', '.')}: $${card.enhancedPricing.cgcGrades[sampleCgc].value}`);
                    }
                }
                
                if (card.enhancedPricing.ebayRaw) {
                    console.log(`- eBay Raw: $${card.enhancedPricing.ebayRaw.value}`);
                }
            } else {
                console.log(`- Enhanced Pricing: Not found ❌`);
            }
            
        } else {
            console.log('❌ Failed to retrieve card data or unexpected response format');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error fetching card data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testCardInfo().catch(error => {
    console.error('Fatal error during test execution:', error);
});
