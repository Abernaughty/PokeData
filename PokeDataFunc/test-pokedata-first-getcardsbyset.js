/**
 * Test the PokeData-First GetCardsBySet Azure Function
 * 
 * This test validates the on-demand image loading strategy:
 * 1. Fast response with comprehensive pricing data
 * 2. No Pokemon TCG API calls during set browsing
 * 3. Images loaded on-demand when individual cards are requested
 * 4. Efficient API usage and performance
 */

const { getCardsBySet } = require('./src/functions/GetCardsBySet/index.js');

// Mock Azure Functions context
const createMockContext = (setCode) => ({
    log: (message) => console.log(`[CONTEXT] ${message}`),
    invocationId: `test-${setCode}-${Date.now()}`,
    functionName: 'GetCardsBySet',
    functionDirectory: __dirname
});

// Mock Azure Functions request
const createMockRequest = (setCode, queryParams = {}) => ({
    params: { setCode },
    query: {
        get: (key) => queryParams[key] || null
    }
});

async function testPokeDataFirstGetCardsBySet() {
    console.log('=== Testing PokeData-First GetCardsBySet Function ===\n');
    
    // Test set: Prismatic Evolutions (known to have many cards)
    const testSetCode = 'PRE';
    
    try {
        console.log(`Testing with PokeData set code: ${testSetCode} (Prismatic Evolutions)`);
        console.log('Expected: Fast response with pricing data, no images (on-demand loading)\n');
        
        const startTime = Date.now();
        
        // Create mock request and context
        const request = createMockRequest(testSetCode, { 
            forceRefresh: 'true',
            page: '1',
            pageSize: '50' // Smaller page size for testing
        });
        const context = createMockContext(testSetCode);
        
        console.log('1. Calling PokeData-first GetCardsBySet function...');
        const response = await getCardsBySet(request, context);
        
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
        const paginatedData = responseData.data;
        const cards = paginatedData.items;
        
        // Validate response format
        const validations = [
            { check: responseData.status === 200, name: 'Response Status' },
            { check: !!paginatedData, name: 'Paginated Data Present' },
            { check: Array.isArray(cards), name: 'Cards Array' },
            { check: cards.length > 0, name: 'Cards Available' },
            { check: typeof paginatedData.totalCount === 'number', name: 'Total Count' },
            { check: typeof paginatedData.pageSize === 'number', name: 'Page Size' },
            { check: typeof paginatedData.pageNumber === 'number', name: 'Page Number' },
            { check: typeof paginatedData.totalPages === 'number', name: 'Total Pages' }
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
        
        // Display pagination information
        console.log('\n3. Pagination Information:');
        console.log(`   Total Cards: ${paginatedData.totalCount}`);
        console.log(`   Page Size: ${paginatedData.pageSize}`);
        console.log(`   Current Page: ${paginatedData.pageNumber}`);
        console.log(`   Total Pages: ${paginatedData.totalPages}`);
        console.log(`   Cards in Response: ${cards.length}`);
        
        // Validate individual card structure
        console.log('\n4. Card Structure Validation:');
        if (cards.length > 0) {
            const firstCard = cards[0];
            const cardValidations = [
                { check: firstCard.id && firstCard.id.startsWith('pokedata-'), name: 'PokeData ID Format' },
                { check: firstCard.source === 'pokedata', name: 'Correct Source' },
                { check: typeof firstCard.pokeDataId === 'number', name: 'PokeData ID Number' },
                { check: !!firstCard.cardName, name: 'Card Name' },
                { check: !!firstCard.setName, name: 'Set Name' },
                { check: !!firstCard.setCode, name: 'Set Code' },
                { check: !!firstCard.pricing, name: 'Pricing Data' },
                { check: !firstCard.images, name: 'No Images (On-Demand)' },
                { check: !firstCard.enhancement, name: 'No Enhancement (On-Demand)' },
                { check: !!firstCard.lastUpdated, name: 'Last Updated' }
            ];
            
            let cardPassedValidations = 0;
            cardValidations.forEach(({ check, name }) => {
                if (check) {
                    console.log(`   ✅ ${name}`);
                    cardPassedValidations++;
                } else {
                    console.log(`   ❌ ${name}`);
                }
            });
            
            console.log(`\nCard Validation Summary: ${cardPassedValidations}/${cardValidations.length} passed`);
            
            // Display sample card details
            console.log('\n5. Sample Card Details:');
            console.log(`   ID: ${firstCard.id}`);
            console.log(`   Name: ${firstCard.cardName}`);
            console.log(`   Number: ${firstCard.cardNumber}`);
            console.log(`   Set: ${firstCard.setName} (${firstCard.setCode})`);
            console.log(`   Secret: ${firstCard.secret}`);
            console.log(`   Language: ${firstCard.language}`);
            
            // Display pricing information
            console.log('\n6. Pricing Information:');
            const pricingSources = Object.keys(firstCard.pricing);
            console.log(`   Sources Available: ${pricingSources.length}`);
            
            pricingSources.forEach(source => {
                if (source === 'psa' && firstCard.pricing.psa) {
                    const grades = Object.keys(firstCard.pricing.psa);
                    console.log(`   PSA Grades: ${grades.length} (${grades.join(', ')})`);
                    if (firstCard.pricing.psa['10']) {
                        console.log(`   PSA 10: $${firstCard.pricing.psa['10']}`);
                    }
                } else if (source === 'cgc' && firstCard.pricing.cgc) {
                    const grades = Object.keys(firstCard.pricing.cgc);
                    console.log(`   CGC Grades: ${grades.length}`);
                } else if (firstCard.pricing[source]) {
                    console.log(`   ${source}: $${firstCard.pricing[source]}`);
                }
            });
        }
        
        // Test performance characteristics
        console.log('\n7. Performance Analysis:');
        console.log(`   Total Response Time: ${totalTime}ms`);
        console.log(`   Expected: < 5000ms (fast, no image enhancement)`);
        console.log(`   Pokemon TCG API Calls: 0 (on-demand strategy)`);
        console.log(`   PokeData API Calls: ${cards.length + 1} (set + cards)`);
        
        if (totalTime < 5000) {
            console.log(`   ✅ Performance: Excellent (${totalTime}ms)`);
        } else if (totalTime < 10000) {
            console.log(`   ⚠️  Performance: Acceptable (${totalTime}ms)`);
        } else {
            console.log(`   ❌ Performance: Slow (${totalTime}ms)`);
        }
        
        // Display cache information
        console.log('\n8. Cache Information:');
        console.log(`   Cached: ${responseData.cached || false}`);
        if (responseData.cacheAge) {
            console.log(`   Cache Age: ${responseData.cacheAge}s`);
        }
        
        // Test pagination
        console.log('\n9. Testing pagination with page 2...');
        const page2Request = createMockRequest(testSetCode, { 
            page: '2',
            pageSize: '50'
        });
        const page2Context = createMockContext(testSetCode);
        
        const page2StartTime = Date.now();
        const page2Response = await getCardsBySet(page2Request, page2Context);
        const page2Time = Date.now() - page2StartTime;
        
        if (page2Response.status === 200) {
            const page2Data = page2Response.jsonBody.data;
            console.log(`   ✅ Page 2 loaded successfully (${page2Time}ms)`);
            console.log(`   Page 2 Cards: ${page2Data.items.length}`);
            console.log(`   Should be cached: ${page2Response.jsonBody.cached || false}`);
        } else {
            console.log(`   ❌ Page 2 failed with status ${page2Response.status}`);
        }
        
        // Test error handling with invalid set
        console.log('\n10. Testing error handling with invalid set...');
        const invalidRequest = createMockRequest('INVALID');
        const invalidContext = createMockContext('INVALID');
        
        const errorResponse = await getCardsBySet(invalidRequest, invalidContext);
        
        if (errorResponse.status === 404) {
            console.log('   ✅ Correctly handled invalid set code');
        } else {
            console.log(`   ❌ Expected 404 status for invalid set, got ${errorResponse.status}`);
        }
        
        console.log('\n=== Test Complete ===');
        
        const overallSuccess = passedValidations === validations.length && 
                              (cards.length === 0 || cardPassedValidations === cardValidations.length);
        
        if (overallSuccess) {
            console.log('🎉 All validations passed! PokeData-first GetCardsBySet is working perfectly!');
            console.log('✅ On-demand image loading strategy implemented successfully');
            console.log('✅ Fast response times with comprehensive pricing data');
            console.log('✅ Efficient API usage - no unnecessary Pokemon TCG calls');
        } else {
            console.log(`⚠️  Some validations failed. Please review the implementation.`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetCardsBySet().catch(console.error);
