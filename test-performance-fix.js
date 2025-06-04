/**
 * GetCardsBySet Performance Optimization Test
 * 
 * This script tests the critical performance bottlenecks identified in the Memory Bank:
 * - Current Performance: 11.9 seconds for 300 cards (unacceptable)
 * - Root Cause: 300 sequential API calls + 300 sequential database writes
 * - Target: Reduce to 2-3 seconds (4x improvement needed)
 * 
 * Performance Analysis from Production Logs (Set 549 - 300 cards):
 * - Cache Operations: 0ms (excellent)
 * - Database Reads: 26ms (good) 
 * - PokeData API Call: 197ms for 300 cards (excellent - 0.66ms per card)
 * - Pricing Enhancement: 2,752ms (5x slower than expected - BOTTLENECK #1)
 * - Database Writes: 8,959ms (18x slower than expected - BOTTLENECK #2)
 * - Cache Writes: 0ms (excellent)
 * 
 * SOLUTIONS TO IMPLEMENT:
 * 1. Batch Database Writes: Use saveCards() instead of individual saves
 * 2. Parallel API Calls: Use Promise.all() with concurrency limits for pricing data
 * 3. Background Processing: Return response immediately, save to DB asynchronously
 * 4. Bulk Pricing API: Investigate if PokeData API supports bulk pricing requests
 */

const dotenv = require('dotenv');
const https = require('https');

// Load environment variables
dotenv.config({ path: 'PokeDataFunc/.env' });

// Test configuration
const TEST_CONFIG = {
    // Use staging environment for testing
    baseUrl: 'https://pokedata-func-staging.azurewebsites.net',
    functionKey: process.env.STAGING_FUNCTION_KEY,
    
    // Test with a smaller set first, then scale up
    testSets: [
        { setId: 557, name: 'Prismatic Evolutions', expectedCards: 447 },
        { setId: 549, name: 'Test Set', expectedCards: 300 } // The problematic set from logs
    ],
    
    // Performance targets
    targets: {
        maxResponseTime: 3000, // 3 seconds maximum
        maxFirstTimeLoad: 5000, // 5 seconds for first-time load (with DB saves)
        maxCachedLoad: 1000,    // 1 second for cached load
        maxApiCallsPerCard: 1,  // Should be 1 API call per card maximum
        maxDbWriteTime: 1000    // 1 second maximum for all database writes
    }
};

/**
 * Test the current GetCardsBySet performance
 */
async function testCurrentPerformance() {
    console.log('\n🔍 TESTING CURRENT GETCARDSBYSET PERFORMANCE');
    console.log('=' .repeat(60));
    
    for (const testSet of TEST_CONFIG.testSets) {
        console.log(`\n📊 Testing Set ${testSet.setId} (${testSet.name})`);
        console.log('-'.repeat(40));
        
        try {
            // Test with force refresh to measure worst-case performance
            const startTime = Date.now();
            
            const url = `${TEST_CONFIG.baseUrl}/api/sets/${testSet.setId}/cards?forceRefresh=true&pageSize=500`;
            const response = await makeRequest(url);
            
            const totalTime = Date.now() - startTime;
            
            if (response.status === 200) {
                const data = JSON.parse(response.body);
                const cardCount = data.data.items.length;
                const totalCards = data.data.totalCount;
                
                console.log(`✅ SUCCESS: Retrieved ${cardCount}/${totalCards} cards`);
                console.log(`⏱️  Total Time: ${totalTime}ms`);
                console.log(`📈 Performance: ${(cardCount / (totalTime / 1000)).toFixed(1)} cards/second`);
                console.log(`🎯 Target Met: ${totalTime <= TEST_CONFIG.targets.maxFirstTimeLoad ? '✅' : '❌'} (${TEST_CONFIG.targets.maxFirstTimeLoad}ms target)`);
                
                // Analyze performance breakdown if available
                if (data.cached === false) {
                    console.log(`🔄 Cache Status: MISS (first-time load)`);
                    
                    // Estimate performance breakdown based on card count
                    const estimatedApiTime = cardCount * 9; // 9ms per card from logs
                    const estimatedDbTime = cardCount * 30; // 30ms per card from logs
                    
                    console.log(`📊 Estimated Breakdown:`);
                    console.log(`   - API Calls: ~${estimatedApiTime}ms (${cardCount} cards × 9ms)`);
                    console.log(`   - DB Writes: ~${estimatedDbTime}ms (${cardCount} cards × 30ms)`);
                    console.log(`   - Other: ~${totalTime - estimatedApiTime - estimatedDbTime}ms`);
                    
                    // Check if we're hitting the bottlenecks
                    if (estimatedApiTime > 1000) {
                        console.log(`⚠️  API BOTTLENECK: ${estimatedApiTime}ms for pricing calls (needs parallel processing)`);
                    }
                    if (estimatedDbTime > TEST_CONFIG.targets.maxDbWriteTime) {
                        console.log(`⚠️  DB BOTTLENECK: ${estimatedDbTime}ms for database writes (needs batch operations)`);
                    }
                }
                
                // Test cached performance
                console.log(`\n🔄 Testing cached performance...`);
                const cachedStartTime = Date.now();
                const cachedResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/sets/${testSet.setId}/cards?pageSize=500`);
                const cachedTime = Date.now() - cachedStartTime;
                
                if (cachedResponse.status === 200) {
                    const cachedData = JSON.parse(cachedResponse.body);
                    console.log(`✅ Cached Load: ${cachedTime}ms`);
                    console.log(`🎯 Cached Target Met: ${cachedTime <= TEST_CONFIG.targets.maxCachedLoad ? '✅' : '❌'} (${TEST_CONFIG.targets.maxCachedLoad}ms target)`);
                    console.log(`🔄 Cache Status: ${cachedData.cached ? 'HIT' : 'MISS'}`);
                }
                
            } else {
                console.log(`❌ FAILED: ${response.status} - ${response.body}`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
}

/**
 * Test the performance optimization solutions
 */
async function testPerformanceOptimizations() {
    console.log('\n🚀 TESTING PERFORMANCE OPTIMIZATION SOLUTIONS');
    console.log('=' .repeat(60));
    
    console.log(`\n📋 OPTIMIZATION STRATEGIES TO IMPLEMENT:`);
    console.log(`1. 🔄 Batch Database Operations`);
    console.log(`   - Current: 300 individual saveCard() calls`);
    console.log(`   - Solution: Single saveCards() batch operation`);
    console.log(`   - Expected Improvement: 18x faster DB writes`);
    
    console.log(`\n2. ⚡ Parallel API Calls with Concurrency Limits`);
    console.log(`   - Current: Sequential getFullCardDetailsById() calls`);
    console.log(`   - Solution: Promise.all() with concurrency limit (10-20 concurrent)`);
    console.log(`   - Expected Improvement: 5x faster pricing enhancement`);
    
    console.log(`\n3. 🎯 Background Processing Option`);
    console.log(`   - Current: Return response after DB saves complete`);
    console.log(`   - Solution: Return response immediately, save to DB asynchronously`);
    console.log(`   - Expected Improvement: Instant user response`);
    
    console.log(`\n4. 📦 Bulk Pricing API Investigation`);
    console.log(`   - Current: Individual pricing API calls per card`);
    console.log(`   - Solution: Investigate PokeData bulk pricing endpoints`);
    console.log(`   - Expected Improvement: Potential 10x+ API efficiency`);
    
    console.log(`\n🎯 PERFORMANCE TARGETS:`);
    console.log(`   - Current: 11.9 seconds for 300 cards`);
    console.log(`   - Target: 2-3 seconds for 300 cards (4x improvement)`);
    console.log(`   - Breakdown Target:`);
    console.log(`     • API Calls: <500ms (parallel processing)`);
    console.log(`     • DB Writes: <500ms (batch operations)`);
    console.log(`     • Other: <1000ms (overhead)`);
    console.log(`     • Total: <2000ms (2 seconds)`);
}

/**
 * Create implementation plan for performance fixes
 */
async function createImplementationPlan() {
    console.log('\n📝 IMPLEMENTATION PLAN FOR PERFORMANCE FIXES');
    console.log('=' .repeat(60));
    
    console.log(`\n🔧 STEP 1: Add Batch Database Operations`);
    console.log(`   File: PokeDataFunc/src/services/CosmosDbService.ts`);
    console.log(`   Action: Add saveCards(cards: Card[]): Promise<void> method`);
    console.log(`   Implementation:`);
    console.log(`     - Use Cosmos DB bulk operations API`);
    console.log(`     - Process cards in batches of 100 (Cosmos DB limit)`);
    console.log(`     - Add error handling for partial failures`);
    console.log(`     - Maintain transaction consistency`);
    
    console.log(`\n⚡ STEP 2: Implement Parallel API Processing`);
    console.log(`   File: PokeDataFunc/src/functions/GetCardsBySet/index.ts`);
    console.log(`   Action: Replace sequential Promise.all() with controlled concurrency`);
    console.log(`   Implementation:`);
    console.log(`     - Use p-limit library for concurrency control`);
    console.log(`     - Set concurrency limit to 10-15 (balance speed vs API limits)`);
    console.log(`     - Add retry logic for failed API calls`);
    console.log(`     - Implement circuit breaker for API failures`);
    
    console.log(`\n🎯 STEP 3: Add Background Processing Option`);
    console.log(`   File: PokeDataFunc/src/functions/GetCardsBySet/index.ts`);
    console.log(`   Action: Add backgroundSave query parameter`);
    console.log(`   Implementation:`);
    console.log(`     - Return response immediately after API processing`);
    console.log(`     - Queue database saves for background processing`);
    console.log(`     - Use Azure Service Bus or Storage Queue`);
    console.log(`     - Add monitoring for background job status`);
    
    console.log(`\n📦 STEP 4: Investigate Bulk Pricing API`);
    console.log(`   File: PokeDataFunc/src/services/PokeDataApiService.ts`);
    console.log(`   Action: Research and implement bulk pricing endpoints`);
    console.log(`   Implementation:`);
    console.log(`     - Check PokeData API documentation for bulk endpoints`);
    console.log(`     - Implement getBulkCardPricing(cardIds: number[])`);
    console.log(`     - Add fallback to individual calls if bulk fails`);
    console.log(`     - Optimize for API credit usage`);
    
    console.log(`\n🧪 STEP 5: Performance Testing Framework`);
    console.log(`   File: test-performance-validation.js`);
    console.log(`   Action: Create comprehensive performance testing`);
    console.log(`   Implementation:`);
    console.log(`     - Automated performance regression testing`);
    console.log(`     - Load testing with various set sizes`);
    console.log(`     - Memory usage monitoring`);
    console.log(`     - API rate limit compliance testing`);
}

/**
 * Make HTTP request with proper authentication
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'x-functions-key': TEST_CONFIG.functionKey,
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

/**
 * Main test execution
 */
async function main() {
    console.log('🚨 GETCARDSBYSET PERFORMANCE OPTIMIZATION TEST');
    console.log('=' .repeat(60));
    console.log('Memory Bank Priority: URGENT - Critical performance bottlenecks identified');
    console.log('Current Issue: 11.9 seconds for 300 cards (4x slower than target)');
    console.log('Target: 2-3 seconds for 300 cards');
    console.log('');
    
    if (!TEST_CONFIG.functionKey) {
        console.log('❌ ERROR: STAGING_FUNCTION_KEY not found in environment variables');
        console.log('Please ensure PokeDataFunc/.env contains STAGING_FUNCTION_KEY');
        return;
    }
    
    try {
        // Test current performance to establish baseline
        await testCurrentPerformance();
        
        // Analyze optimization strategies
        await testPerformanceOptimizations();
        
        // Create implementation plan
        await createImplementationPlan();
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Implement batch database operations in CosmosDbService');
        console.log('2. Add parallel processing with concurrency limits');
        console.log('3. Test performance improvements with this script');
        console.log('4. Deploy optimizations to staging for validation');
        console.log('5. Monitor production performance after deployment');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Run the test
if (require.main === module) {
    main();
}

module.exports = {
    testCurrentPerformance,
    testPerformanceOptimizations,
    createImplementationPlan
};
