/**
 * Enhanced Pricing Data Integration Test
 * 
 * This test verifies that the enhanced pricing data from PokeData API
 * is correctly displayed in the web application.
 */

// Import required services
const featureFlagService = window.pokeDataDebug ? 
    window.pokeDataDebug.services.featureFlagService : 
    { getFlag: (name) => localStorage.getItem(`feature_${name}`) === 'true', setFlag: (name, value) => localStorage.setItem(`feature_${name}`, value) };

// Test configuration
const TEST_CARD_ID = 'sv8pt5-161'; // Umbreon ex from Prismatic Evolutions
const FEATURE_FLAG_NAME = 'useCloudApi';

// Main test function
async function testEnhancedPricing() {
    console.group('Enhanced Pricing Data Integration Test');
    console.log('Starting test...');
    
    // Step 1: Check current feature flag status
    const initialFlagValue = featureFlagService.getFlag(FEATURE_FLAG_NAME);
    console.log(`Initial feature flag status (${FEATURE_FLAG_NAME}): ${initialFlagValue}`);
    
    // Step 2: Enable cloud API feature flag
    featureFlagService.setFlag(FEATURE_FLAG_NAME, true);
    console.log(`Feature flag ${FEATURE_FLAG_NAME} set to: true`);
    
    // Step 3: Verify feature flag was set correctly
    const newFlagValue = featureFlagService.getFlag(FEATURE_FLAG_NAME);
    console.log(`Current feature flag status (${FEATURE_FLAG_NAME}): ${newFlagValue}`);
    
    // Step 4: Instructions for manual verification
    console.log('');
    console.log('Test Setup Complete');
    console.log('To verify the enhanced pricing data:');
    console.log('1. Refresh the page');
    console.log(`2. Search for card ${TEST_CARD_ID} (Umbreon ex from Prismatic Evolutions)`);
    console.log('3. Click "Get Price"');
    console.log('4. Verify that PSA/CGC graded prices are displayed in the results');
    console.log('');
    
    console.log('IMPORTANT: If no pricing data appears, try the cache-busting method:');
    console.log('1. Open the browser console');
    console.log('2. Run this command to force a fresh API call bypassing the cache:');
    console.log(`   window.pokeDataDebug.testCard('${TEST_CARD_ID}', true);`);
    console.log('   (The second parameter "true" forces a cache refresh)');
    console.log('');
    
    console.log('Expected Results:');
    console.log('- PSA Graded section should display multiple PSA grades (1-10)');
    console.log('- CGC Graded section should display multiple CGC grades');
    console.log('- eBay Raw price should be displayed');
    
    console.groupEnd();
    
    // Create a test helper function in the global debug object
    if (window.pokeDataDebug) {
        window.pokeDataDebug.testCard = async function(cardId, forceRefresh = false) {
            console.group('Testing card with forceRefresh = ' + forceRefresh);
            
            try {
                // Use the priceStore to fetch the data with forceRefresh
                const fetchCardPrice = window.pokeDataDebug.stores.priceStore.fetchCardPrice;
                
                if (typeof fetchCardPrice === 'function') {
                    console.log(`Fetching pricing data for card ${cardId} with forceRefresh=${forceRefresh}...`);
                    await fetchCardPrice(cardId, forceRefresh);
                    console.log('Price data fetch completed. Check the UI for results.');
                } else {
                    // Direct method if priceStore not available
                    console.log('PriceStore not available, fetching directly...');
                    
                    // Use the hybrid service directly
                    const hybridService = window.pokeDataDebug.services.hybridDataService;
                    if (hybridService) {
                        const result = await hybridService.getCardPricingWithMetadata(cardId, forceRefresh);
                        console.log('API Result:', result);
                    } else {
                        console.error('Unable to access services. Please make sure you are in debug mode.');
                    }
                }
            } catch (error) {
                console.error('Error during test:', error);
            }
            
            console.groupEnd();
        };
        
        console.log('Added test helper: window.pokeDataDebug.testCard(cardId, forceRefresh)');
    }
    
    return true;
}

// Execute the test
testEnhancedPricing()
    .then(result => {
        console.log(`Test initialization ${result ? 'successful' : 'failed'}`);
    })
    .catch(error => {
        console.error('Test execution error:', error);
    });
