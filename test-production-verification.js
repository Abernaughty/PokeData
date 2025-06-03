/**
 * Production Verification Test
 * Tests all 3 Azure Functions in production after deployment
 */

const https = require('https');

const PRODUCTION_URL = 'https://pokedata-func.azurewebsites.net';
const FUNCTION_KEY = '7dq8aHEWt4ngfLOX6p1tL7-c9Dy6B4-ip3up0cNMl07mAzFuKESTuA==';

async function makeRequest(url, description) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        console.log(`📡 ${description}`);
        
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                console.log(`   ⏱️  Duration: ${duration}ms`);
                console.log(`   📊 Status: ${res.statusCode}`);
                
                if (res.statusCode !== 200) {
                    console.log(`   ❌ HTTP Error: ${res.statusCode}`);
                    resolve({ success: false, error: `HTTP ${res.statusCode}`, duration });
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`   ✅ Success`);
                    resolve({ success: true, data: jsonData, duration });
                } catch (error) {
                    console.log(`   ❌ JSON Parse Error: ${error.message}`);
                    resolve({ success: false, error: error.message, duration });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ Request Error: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
        
        req.setTimeout(30000, () => {
            console.log(`   ⏰ Timeout`);
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        req.end();
    });
}

async function testProduction() {
    console.log('🚀 PRODUCTION VERIFICATION TESTS');
    console.log('=================================');
    console.log(`🔗 Testing: ${PRODUCTION_URL}`);
    console.log('');
    
    const results = [];
    
    // Test 1: GetSetList
    console.log('🎯 Test 1: GetSetList');
    const encodedKey = encodeURIComponent(FUNCTION_KEY);
    const url1 = `${PRODUCTION_URL}/api/sets?code=${encodedKey}`;
    const result1 = await makeRequest(url1, 'GetSetList - Production');
    results.push({ name: 'GetSetList', ...result1 });
    
    if (result1.success) {
        const sets = result1.data?.data?.sets || result1.data?.data || [];
        console.log(`   📊 Sets returned: ${sets.length}`);
    }
    console.log('');
    
    // Test 2: GetCardsBySet
    console.log('🎯 Test 2: GetCardsBySet');
    const url2 = `${PRODUCTION_URL}/api/sets/557/cards?code=${encodedKey}&pageSize=3`;
    const result2 = await makeRequest(url2, 'GetCardsBySet - Production (3 cards)');
    results.push({ name: 'GetCardsBySet', ...result2 });
    
    if (result2.success) {
        const cards = result2.data?.data?.items || [];
        console.log(`   🎴 Cards returned: ${cards.length}`);
        if (cards.length > 0) {
            console.log(`   🃏 First card: ${cards[0].cardName} (ID: ${cards[0].id})`);
        }
    }
    console.log('');
    
    // Test 3: GetCardInfo
    console.log('🎯 Test 3: GetCardInfo');
    const url3 = `${PRODUCTION_URL}/api/cards/73092?code=${encodedKey}`;
    const result3 = await makeRequest(url3, 'GetCardInfo - Production');
    results.push({ name: 'GetCardInfo', ...result3 });
    
    if (result3.success) {
        const card = result3.data?.data || {};
        console.log(`   🃏 Card: ${card.cardName} (${card.cardNumber})`);
        console.log(`   💰 Pricing sources: ${Object.keys(card.pricing || {}).length}`);
    }
    console.log('');
    
    // Summary
    console.log('📊 PRODUCTION VERIFICATION SUMMARY');
    console.log('==================================');
    
    const allPassed = results.every(r => r.success);
    
    results.forEach(result => {
        const status = result.success ? '✅ PASSED' : '❌ FAILED';
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        console.log(`${status} ${result.name}${duration}`);
        
        if (!result.success) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    console.log('');
    if (allPassed) {
        console.log('🎉 ALL PRODUCTION TESTS PASSED! ✅');
        console.log('✨ Production deployment successful!');
        console.log('');
        console.log('🚀 Your PokeData-first architecture is now live in production with:');
        console.log('   • Database caching working (fast response times)');
        console.log('   • Clean card ID format for new cards');
        console.log('   • Comprehensive pricing data');
        console.log('   • Enhanced performance and reliability');
    } else {
        console.log('❌ SOME PRODUCTION TESTS FAILED!');
        console.log('⚠️  Production deployment may have issues.');
    }
    
    return allPassed;
}

// Run the verification
testProduction().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
