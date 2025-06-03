/**
 * Test the updated PokeData-first GetCardInfo Azure Function
 * 
 * This test validates the complete PokeData-first architecture:
 * 1. Uses fixed PokeDataApiService with getFullCardDetailsById
 * 2. Tests image enhancement integration
 * 3. Validates new card structure and response format
 */

const { getCardInfo } = require('./src/functions/GetCardInfo/index.js');

// Mock Azure Functions context
const createMockContext = (cardId) => ({
    log: (message) => console.log(`[CONTEXT] ${message}`),
    invocationId: `test-${cardId}-${Date.now()}`,
    functionName: 'GetCardInfo',
    functionDirectory: __dirname
});

// Mock Azure Functions request
const createMockRequest = (cardId, queryParams = {}) => ({
    params: { cardId },
    query: {
        get: (key) => queryParams[key] || null
    }
});

async function testPokeDataFirstGetCardInfo() {
    console.log('=== Testing Updated PokeData-First GetCardInfo Function ===\n');
    
    // Test card: Espeon ex from Prismatic Evolutions (known to have mapping)
    const testCardId = '73115';
    
    try {
        console.log(`Testing with PokeData card ID: ${testCardId} (Espeon ex)`);
        console.log('Expected: Full card details + pricing + image enhancement\n');
        
        const startTime = Date.now();
        
        // Create mock request and context
        const request = createMockRequest(testCardId, { forceRefresh: 'true' });
        const context = createMockContext(testCardId);
        
        console.log('1. Calling PokeData-first GetCardInfo function...');
        const response = await getCardInfo(request, context);
        
        const totalTime = Date.now() - startTime;
        console.log(`\n✅ Function completed in ${totalTime}ms`);
        
        // Validate response structure
        console.log('\n2. Validating response structure...');
        
        if (response.status !== 200) {
            console.error(`❌ Expected status 200, got ${response.status}`);
            console.error('Response:', JSON.stringify(response.jsonBody, null, 2));
            return;
        }
        
        const responseData = response.jsonBody;
        const card = responseData.data;
        
        // Validate response format
        const validations = [
            { check: responseData.status === 200, name: 'Response Status' },
            { check: !!card, name: 'Card Data Present' },
            { check: card.id === `pokedata-${testCardId}`, name: 'Correct Card ID Format' },
            { check: card.source === 'pokedata', name: 'Correct Source' },
            { check: card.pokeDataId === parseInt(testCardId), name: 'PokeData ID' },
            { check: !!card.cardName, name: 'Card Name' },
            { check: !!card.setName, name: 'Set Name' },
            { check: !!card.setCode, name: 'Set Code' },
            { check: !!card.pricing, name: 'Pricing Data' },
            { check: Object.keys(card.pricing).length > 0, name: 'Pricing Sources Available' },
            { check: !!card.lastUpdated, name: 'Last Updated Timestamp' }
        ];
        
        let passedValidations = 0;
        validations.forEach(({ check, name }) => {
            if (check) {
                console.log(`   ✅ ${name}`);
                passedValidations++;
            } else {
                console.log(`   ❌ ${name}`);
            }
        });
        
        console.log(`\nValidation Summary: ${passedValidations}/${validations.length} passed`);
        
        // Display card details
        console.log('\n3. Card Details:');
        console.log(`   ID: ${card.id}`);
        console.log(`   Name: ${card.cardName}`);
        console.log(`   Number: ${card.cardNumber}`);
        console.log(`   Set: ${card.setName} (${card.setCode})`);
        console.log(`   Secret: ${card.secret}`);
        console.log(`   Language: ${card.language}`);
        console.log(`   Release Date: ${card.releaseDate}`);
        
        // Display pricing information
        console.log('\n4. Pricing Information:');
        const pricingSources = Object.keys(card.pricing);
        console.log(`   Sources Available: ${pricingSources.length}`);
        
        pricingSources.forEach(source => {
            if (source === 'psa' && card.pricing.psa) {
                const grades = Object.keys(card.pricing.psa);
                console.log(`   PSA Grades: ${grades.length} (${grades.join(', ')})`);
                console.log(`   PSA 10: $${card.pricing.psa['10'] || 'N/A'}`);
            } else if (source === 'cgc' && card.pricing.cgc) {
                const grades = Object.keys(card.pricing.cgc);
                console.log(`   CGC Grades: ${grades.length}`);
            } else if (card.pricing[source]) {
                console.log(`   ${source}: $${card.pricing[source]}`);
            }
        });
        
        // Display image enhancement information
        console.log('\n5. Image Enhancement:');
        if (card.images) {
            console.log(`   ✅ Images Available`);
            console.log(`   Small: ${card.images.small}`);
            console.log(`   Large: ${card.images.large}`);
            
            if (card.enhancement) {
                console.log(`   Enhanced with TCG card: ${card.enhancement.tcgCardId}`);
                console.log(`   TCG Set: ${card.enhancement.tcgSetId}`);
                if (card.enhancement.metadata?.rarity) {
                    console.log(`   Rarity: ${card.enhancement.metadata.rarity}`);
                }
                console.log(`   Enhanced at: ${card.enhancement.enhancedAt}`);
            }
        } else {
            console.log(`   ❌ No images available (mapping may not exist)`);
        }
        
        // Display cache information
        console.log('\n6. Cache Information:');
        console.log(`   Cached: ${responseData.cached || false}`);
        if (responseData.cacheAge) {
            console.log(`   Cache Age: ${responseData.cacheAge}s`);
        }
        
        // Test with invalid card ID
        console.log('\n7. Testing error handling with invalid card ID...');
        const invalidRequest = createMockRequest('invalid-id');
        const invalidContext = createMockContext('invalid-id');
        
        const errorResponse = await getCardInfo(invalidRequest, invalidContext);
        
        if (errorResponse.status === 400) {
            console.log('   ✅ Correctly handled invalid card ID format');
        } else {
            console.log(`   ❌ Expected 400 status for invalid ID, got ${errorResponse.status}`);
        }
        
        // Test with non-existent card ID
        console.log('\n8. Testing error handling with non-existent card ID...');
        const nonExistentRequest = createMockRequest('999999999');
        const nonExistentContext = createMockContext('999999999');
        
        const notFoundResponse = await getCardInfo(nonExistentRequest, nonExistentContext);
        
        if (notFoundResponse.status === 404) {
            console.log('   ✅ Correctly handled non-existent card ID');
        } else {
            console.log(`   ❌ Expected 404 status for non-existent ID, got ${notFoundResponse.status}`);
        }
        
        console.log('\n=== Test Complete ===');
        
        if (passedValidations === validations.length) {
            console.log('🎉 All validations passed! PokeData-first GetCardInfo is working perfectly!');
        } else {
            console.log(`⚠️  ${validations.length - passedValidations} validations failed. Please review the implementation.`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetCardInfo().catch(console.error);
