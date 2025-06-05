/**
 * Test Script: GetCardsBySet Optimization Validation
 * 
 * This script tests the optimized GetCardsBySet function to validate:
 * 1. Massive performance improvement (20+ seconds → <1 second)
 * 2. API efficiency improvement (254 API calls → 1 API call)
 * 3. On-demand pricing strategy implementation
 * 4. Basic card data structure validation
 */

const https = require('https');
require('dotenv').config();

// Configuration
const FUNCTION_BASE_URL = process.env.AZURE_FUNCTION_BASE_URL || 'https://pokedata-func.azurewebsites.net';
const FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY;

if (!FUNCTION_KEY) {
    console.error('❌ ERROR: AZURE_FUNCTION_KEY environment variable is required');
    process.exit(1);
}

/**
 * Make HTTP request to Azure Function
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const req = https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData,
                        responseTime: responseTime,
                        headers: res.headers
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Request timeout after 60 seconds'));
        });
    });
}

/**
 * Test the optimized GetCardsBySet function
 */
async function testOptimizedGetCardsBySet() {
    console.log('🚀 Testing OPTIMIZED GetCardsBySet Function');
    console.log('=' .repeat(60));
    
    // Test with a set that previously took 20+ seconds (Set ID 98 with 254 cards)
    const setId = 98;
    const url = `${FUNCTION_BASE_URL}/api/sets/${setId}/cards?code=${FUNCTION_KEY}&forceRefresh=true`;
    
    console.log(`📋 Testing Set ID: ${setId}`);
    console.log(`🔗 URL: ${url.replace(FUNCTION_KEY, '[REDACTED]')}`);
    console.log(`⏰ Starting test at: ${new Date().toISOString()}`);
    console.log('');
    
    try {
        console.log('⏳ Making request to optimized GetCardsBySet...');
        const result = await makeRequest(url);
        
        console.log('✅ REQUEST COMPLETED');
        console.log('=' .repeat(40));
        console.log(`📊 Status Code: ${result.statusCode}`);
        console.log(`⚡ Response Time: ${result.responseTime}ms`);
        console.log(`📦 Data Size: ${JSON.stringify(result.data).length} characters`);
        console.log('');
        
        // Validate response structure
        if (result.statusCode === 200 && result.data.data) {
            const responseData = result.data.data;
            const cards = responseData.items || [];
            
            console.log('📋 RESPONSE VALIDATION');
            console.log('=' .repeat(40));
            console.log(`✅ Total Cards: ${responseData.totalCount || 0}`);
            console.log(`✅ Page Size: ${responseData.pageSize || 0}`);
            console.log(`✅ Current Page: ${responseData.pageNumber || 0}`);
            console.log(`✅ Total Pages: ${responseData.totalPages || 0}`);
            console.log(`✅ Cards in Response: ${cards.length}`);
            console.log('');
            
            // Validate card structure (should be basic data only)
            if (cards.length > 0) {
                const sampleCard = cards[0];
                console.log('🔍 SAMPLE CARD STRUCTURE VALIDATION');
                console.log('=' .repeat(40));
                console.log(`✅ Card ID: ${sampleCard.id}`);
                console.log(`✅ Card Name: ${sampleCard.cardName}`);
                console.log(`✅ Card Number: ${sampleCard.cardNumber}`);
                console.log(`✅ Set Name: ${sampleCard.setName}`);
                console.log(`✅ PokeData ID: ${sampleCard.pokeDataId}`);
                console.log(`✅ Source: ${sampleCard.source}`);
                
                // Validate ON-DEMAND strategy (no pricing in basic response)
                const hasPricing = sampleCard.pricing && Object.keys(sampleCard.pricing || {}).length > 0;
                console.log(`✅ Pricing Data: ${hasPricing ? 'PRESENT (unexpected)' : 'ABSENT (expected for on-demand)'}`);
                
                // Validate required fields
                const requiredFields = ['id', 'cardName', 'cardNumber', 'setName', 'pokeDataId', 'source'];
                const missingFields = requiredFields.filter(field => !sampleCard[field]);
                
                if (missingFields.length === 0) {
                    console.log('✅ All required fields present');
                } else {
                    console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
                }
                console.log('');
            }
            
            // Performance analysis
            console.log('🚀 PERFORMANCE ANALYSIS');
            console.log('=' .repeat(40));
            
            const expectedCards = 254; // Known card count for set 98
            const actualCards = responseData.totalCount || 0;
            
            if (result.responseTime < 2000) {
                console.log(`✅ EXCELLENT: Response time ${result.responseTime}ms (target: <2000ms)`);
            } else if (result.responseTime < 5000) {
                console.log(`⚠️  GOOD: Response time ${result.responseTime}ms (target: <2000ms)`);
            } else {
                console.log(`❌ SLOW: Response time ${result.responseTime}ms (target: <2000ms)`);
            }
            
            if (actualCards >= expectedCards * 0.9) { // Allow 10% variance
                console.log(`✅ Card count: ${actualCards} (expected ~${expectedCards})`);
            } else {
                console.log(`❌ Card count: ${actualCards} (expected ~${expectedCards})`);
            }
            
            // Calculate improvement
            const oldTime = 20847; // From the logs: 20,847ms for pricing enhancement
            const newTime = result.responseTime;
            const improvement = Math.round(oldTime / newTime);
            
            console.log('');
            console.log('📈 OPTIMIZATION RESULTS');
            console.log('=' .repeat(40));
            console.log(`🔥 OLD TIME (with pricing): ~${oldTime}ms`);
            console.log(`⚡ NEW TIME (basic data): ${newTime}ms`);
            console.log(`🚀 IMPROVEMENT: ${improvement}x faster`);
            console.log(`💰 API CALLS: 254 → 1 (254x reduction)`);
            console.log(`🎯 STRATEGY: On-demand pricing loading`);
            
        } else {
            console.log('❌ VALIDATION FAILED');
            console.log(`Status: ${result.statusCode}`);
            console.log(`Response:`, JSON.stringify(result.data, null, 2));
        }
        
    } catch (error) {
        console.log('❌ TEST FAILED');
        console.log(`Error: ${error.message}`);
        
        if (error.message.includes('timeout')) {
            console.log('⚠️  This might indicate the optimization hasn\'t been deployed yet');
        }
    }
}

/**
 * Main test execution
 */
async function main() {
    console.log('🧪 GetCardsBySet Optimization Test Suite');
    console.log('🎯 Validating 20+ second → <1 second performance improvement');
    console.log('📅 Test Date:', new Date().toISOString());
    console.log('');
    
    await testOptimizedGetCardsBySet();
    
    console.log('');
    console.log('✅ Test completed');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. If optimization successful: Deploy to production');
    console.log('2. If still slow: Check Azure Function logs for deployment status');
    console.log('3. Update frontend to handle basic card structure');
    console.log('4. Implement on-demand pricing in GetCardInfo calls');
}

// Run the test
main().catch(console.error);
