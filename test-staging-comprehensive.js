/**
 * Comprehensive Staging Test Suite
 * Tests all 3 Azure Functions to ensure they work correctly before production deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read function key from environment
let functionKey = '';
try {
    const envPath = path.join(__dirname, 'PokeDataFunc', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
        if (line.startsWith('AZURE_FUNCTION_KEY_STAGING=')) {
            functionKey = line.substring('AZURE_FUNCTION_KEY_STAGING='.length).trim();
            break;
        }
    }
} catch (error) {
    console.error('❌ Could not read function key from PokeDataFunc/.env');
    process.exit(1);
}

const STAGING_URL = 'https://pokedata-func-staging.azurewebsites.net';

async function makeRequest(url, description, timeout = 60000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        console.log(`📡 ${description}`);
        console.log(`   URL: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
        
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                console.log(`   ⏱️  Duration: ${duration}ms`);
                console.log(`   📊 Status: ${res.statusCode}`);
                console.log(`   📏 Size: ${data.length} bytes`);
                
                if (res.statusCode !== 200) {
                    console.log(`   ❌ HTTP Error: ${res.statusCode}`);
                    console.log(`   📄 Response: ${data.substring(0, 500)}...`);
                    resolve({ success: false, error: `HTTP ${res.statusCode}`, duration, status: res.statusCode, rawData: data });
                    return;
                }
                
                if (data.length === 0) {
                    console.log(`   ❌ Empty response`);
                    resolve({ success: false, error: 'Empty response', duration, status: res.statusCode });
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`   ✅ Valid JSON response`);
                    resolve({ 
                        success: true, 
                        data: jsonData, 
                        duration, 
                        status: res.statusCode,
                        size: data.length
                    });
                } catch (error) {
                    console.log(`   ❌ JSON Parse Error: ${error.message}`);
                    console.log(`   📄 Raw Response (first 500 chars): ${data.substring(0, 500)}...`);
                    resolve({ success: false, error: error.message, duration, status: res.statusCode, rawData: data });
                }
            });
        });
        
        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            console.log(`   ❌ Request Error: ${error.message} (${duration}ms)`);
            resolve({ success: false, error: error.message, duration });
        });
        
        req.setTimeout(timeout, () => {
            console.log(`   ⏰ Timeout (${timeout/1000}s)`);
            req.destroy();
            resolve({ success: false, error: 'Timeout', duration: timeout });
        });
        
        req.end();
    });
}

async function testGetSetList() {
    console.log('\n🎯 TESTING FUNCTION 1: GetSetList');
    console.log('=====================================');
    
    const encodedFunctionKey = encodeURIComponent(functionKey);
    const url = `${STAGING_URL}/api/sets?code=${encodedFunctionKey}`;
    
    const result = await makeRequest(url, 'GetSetList - Fetch all Pokemon sets');
    
    if (!result.success) {
        console.log('❌ GetSetList FAILED');
        return { function: 'GetSetList', success: false, error: result.error };
    }
    
    const sets = result.data?.data?.sets || result.data?.data || [];
    console.log(`   📊 Sets returned: ${sets.length}`);
    
    if (sets.length > 0) {
        const currentSets = sets.filter(set => set.isCurrent);
        console.log(`   🎯 Current sets: ${currentSets.length}`);
        
        // Log a few sample sets
        console.log('   📋 Sample sets:');
        sets.slice(0, 3).forEach(set => {
            console.log(`      - ${set.name} (${set.code}): ${set.cardCount} cards, Current: ${set.isCurrent}`);
        });
    }
    
    const success = sets.length > 0;
    console.log(`   ${success ? '✅' : '❌'} GetSetList: ${success ? 'PASSED' : 'FAILED'}`);
    
    return { 
        function: 'GetSetList', 
        success, 
        duration: result.duration,
        setsCount: sets.length,
        sampleSet: sets.length > 0 ? sets[0] : null
    };
}

async function testGetCardsBySet() {
    console.log('\n🎯 TESTING FUNCTION 2: GetCardsBySet');
    console.log('====================================');
    
    const encodedFunctionKey = encodeURIComponent(functionKey);
    
    // Test with a known set (Prismatic Evolutions - 557)
    const setId = 557;
    console.log(`Testing with Set ${setId} (Prismatic Evolutions)`);
    
    // Test 1: Small page size for quick test
    console.log('\n📞 Test 2A: Small page size (5 cards)');
    const url1 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=5`;
    const result1 = await makeRequest(url1, 'GetCardsBySet - Small page size');
    
    if (!result1.success) {
        console.log('❌ GetCardsBySet (small) FAILED');
        return { function: 'GetCardsBySet', success: false, error: result1.error };
    }
    
    const cards1 = result1.data?.data?.items || [];
    const totalCount1 = result1.data?.data?.totalCount || 0;
    console.log(`   🎴 Cards returned: ${cards1.length}/${totalCount1}`);
    console.log(`   💾 Cached: ${result1.data?.cached || false}`);
    
    if (cards1.length > 0) {
        const firstCard = cards1[0];
        console.log(`   🃏 First card: ${firstCard.cardName} (${firstCard.cardNumber})`);
        console.log(`   🆔 Card ID: ${firstCard.id} (${firstCard.id.startsWith('pokedata-') ? 'OLD FORMAT' : 'NEW FORMAT'})`);
        console.log(`   🎯 Source: ${firstCard.source}`);
        console.log(`   💰 Has pricing: ${Object.keys(firstCard.pricing || {}).length > 0 ? 'Yes' : 'No'}`);
    }
    
    // Test 2: Check database caching (second call should be faster)
    console.log('\n📞 Test 2B: Database caching test');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const url2 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=5`;
    const result2 = await makeRequest(url2, 'GetCardsBySet - Cache test');
    
    if (!result2.success) {
        console.log('❌ GetCardsBySet (cache) FAILED');
        return { function: 'GetCardsBySet', success: false, error: result2.error };
    }
    
    const cards2 = result2.data?.data?.items || [];
    const speedup = result1.duration / result2.duration;
    
    console.log(`   🎴 Cards returned: ${cards2.length}`);
    console.log(`   ⚡ Speedup: ${speedup.toFixed(1)}x faster`);
    console.log(`   💾 Cached: ${result2.data?.cached || false}`);
    
    const success = cards1.length > 0 && cards2.length > 0 && cards1.length === cards2.length;
    console.log(`   ${success ? '✅' : '❌'} GetCardsBySet: ${success ? 'PASSED' : 'FAILED'}`);
    
    return { 
        function: 'GetCardsBySet', 
        success,
        firstCallDuration: result1.duration,
        secondCallDuration: result2.duration,
        speedup: speedup,
        cardsCount: cards1.length,
        totalCount: totalCount1,
        sampleCard: cards1.length > 0 ? cards1[0] : null
    };
}

async function testGetCardInfo() {
    console.log('\n🎯 TESTING FUNCTION 3: GetCardInfo');
    console.log('==================================');
    
    const encodedFunctionKey = encodeURIComponent(functionKey);
    
    // Test with a known card ID (we'll use a clean numeric ID)
    const cardId = '73092'; // Amarys from Prismatic Evolutions
    console.log(`Testing with Card ID: ${cardId}`);
    
    const url = `${STAGING_URL}/api/cards/${cardId}?code=${encodedFunctionKey}`;
    const result = await makeRequest(url, 'GetCardInfo - Individual card details');
    
    if (!result.success) {
        console.log('❌ GetCardInfo FAILED');
        return { function: 'GetCardInfo', success: false, error: result.error };
    }
    
    const card = result.data?.data || {};
    console.log(`   🃏 Card: ${card.cardName || 'Unknown'} (${card.cardNumber || 'N/A'})`);
    console.log(`   🆔 Card ID: ${card.id || 'N/A'}`);
    console.log(`   🎯 Source: ${card.source || 'N/A'}`);
    console.log(`   🎨 Set: ${card.setName || 'Unknown'} (${card.setCode || 'N/A'})`);
    console.log(`   💰 Pricing sources: ${Object.keys(card.pricing || {}).length}`);
    console.log(`   🖼️  Images: ${card.images ? Object.keys(card.images).length : 0}`);
    console.log(`   💾 Cached: ${result.data?.cached || false}`);
    
    // Check for required fields
    const hasRequiredFields = card.id && card.cardName && card.source;
    const hasPricing = card.pricing && Object.keys(card.pricing).length > 0;
    
    console.log(`   📋 Required fields: ${hasRequiredFields ? '✅' : '❌'}`);
    console.log(`   💰 Has pricing: ${hasPricing ? '✅' : '❌'}`);
    
    const success = hasRequiredFields;
    console.log(`   ${success ? '✅' : '❌'} GetCardInfo: ${success ? 'PASSED' : 'FAILED'}`);
    
    return { 
        function: 'GetCardInfo', 
        success,
        duration: result.duration,
        cardData: {
            id: card.id,
            name: card.cardName,
            setName: card.setName,
            hasPricing: hasPricing,
            hasImages: card.images ? Object.keys(card.images).length > 0 : false
        }
    };
}

async function runComprehensiveTests() {
    console.log('🧪 COMPREHENSIVE STAGING FUNCTION TESTS');
    console.log('========================================');
    console.log(`🔗 Testing against: ${STAGING_URL}`);
    console.log(`🔑 Using function key: ${functionKey.substring(0, 10)}...`);
    console.log('');
    
    const results = [];
    
    try {
        // Test all three functions
        const test1 = await testGetSetList();
        results.push(test1);
        
        const test2 = await testGetCardsBySet();
        results.push(test2);
        
        const test3 = await testGetCardInfo();
        results.push(test3);
        
        // Summary
        console.log('\n📊 TEST SUMMARY');
        console.log('===============');
        
        const allPassed = results.every(r => r.success);
        
        results.forEach(result => {
            const status = result.success ? '✅ PASSED' : '❌ FAILED';
            const duration = result.duration ? ` (${result.duration}ms)` : '';
            console.log(`${status} ${result.function}${duration}`);
            
            if (!result.success) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log('\n🎯 OVERALL RESULT');
        console.log('=================');
        
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED! ✅');
            console.log('✨ Staging environment is ready for production deployment!');
            console.log('');
            console.log('📋 Summary:');
            console.log(`   • GetSetList: ${results[0].setsCount || 0} sets available`);
            console.log(`   • GetCardsBySet: ${results[1].cardsCount || 0} cards tested, ${results[1].speedup?.toFixed(1) || 'N/A'}x speedup`);
            console.log(`   • GetCardInfo: Individual card details working`);
            console.log('');
            console.log('🚀 Ready to swap staging to production!');
        } else {
            console.log('❌ SOME TESTS FAILED!');
            console.log('⚠️  DO NOT deploy to production until all issues are resolved.');
            console.log('');
            console.log('Failed functions:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`   • ${result.function}: ${result.error}`);
            });
        }
        
        return allPassed;
        
    } catch (error) {
        console.log('\n💥 TEST SUITE ERROR');
        console.log('===================');
        console.log(`❌ Unexpected error: ${error.message}`);
        console.log('⚠️  Cannot proceed with production deployment.');
        return false;
    }
}

// Run the comprehensive test suite
runComprehensiveTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
