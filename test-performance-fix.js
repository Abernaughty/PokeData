/**
 * Test script to verify the database query performance fix
 * This should show dramatic performance improvement on the second call
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
                console.log(`   📏 Size: ${data.length} bytes`);
                
                if (data.length === 0) {
                    console.log(`   ❌ Empty response`);
                    resolve({ success: false, error: 'Empty response', duration, status: res.statusCode });
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    const cards = jsonData.data?.items?.length || 0;
                    const totalCount = jsonData.data?.totalCount || 0;
                    const cached = jsonData.cached || false;
                    
                    console.log(`   🎴 Cards: ${cards}/${totalCount}`);
                    console.log(`   💾 Cached: ${cached}`);
                    
                    if (cards > 0) {
                        const firstCard = jsonData.data.items[0];
                        console.log(`   🃏 Sample: ${firstCard.cardName} (${firstCard.cardNumber})`);
                    }
                    
                    resolve({ 
                        success: true, 
                        data: jsonData, 
                        duration, 
                        status: res.statusCode,
                        cards,
                        totalCount,
                        cached
                    });
                } catch (error) {
                    console.log(`   ❌ JSON Error: ${error.message}`);
                    resolve({ success: false, error: error.message, duration, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            console.log(`   ❌ Error: ${error.message} (${duration}ms)`);
            resolve({ success: false, error: error.message, duration });
        });
        
        req.setTimeout(60000, () => {
            console.log(`   ⏰ Timeout (60s)`);
            req.destroy();
            resolve({ success: false, error: 'Timeout', duration: 60000 });
        });
        
        req.end();
    });
}

async function testPerformanceFix() {
    console.log('🚀 Testing Database Query Performance Fix');
    console.log('=========================================\n');
    
    const encodedFunctionKey = encodeURIComponent(functionKey);
    
    // Use set 557 (Prismatic Evolutions) which we know has data in the database
    const setId = 557;
    console.log(`🎯 Testing Set ${setId} (Prismatic Evolutions)`);
    console.log('Expected behavior after fix:');
    console.log('- Call 1: ~18s (if cache miss, will fetch and save)');
    console.log('- Call 2: ~200ms (should hit database cache)\n');
    
    // Call 1: This might be slow if it needs to fetch fresh data
    console.log('📞 CALL 1: Testing current state');
    const url1 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=5`;
    const result1 = await makeRequest(url1, 'First call');
    
    if (!result1.success) {
        console.log('❌ First call failed, stopping test');
        console.log(`   Error: ${result1.error}`);
        return;
    }
    
    console.log('\n⏳ Waiting 3 seconds before second call...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Call 2: This should be MUCH faster with the fix
    console.log('📞 CALL 2: Testing database cache performance');
    const url2 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=5`;
    const result2 = await makeRequest(url2, 'Second call - should be fast!');
    
    console.log('\n📊 Performance Analysis');
    console.log('=======================');
    
    if (result1.success && result2.success) {
        const speedup = result1.duration / result2.duration;
        const improvement = ((result1.duration - result2.duration) / result1.duration * 100).toFixed(1);
        
        console.log(`✅ Call 1: ${result1.duration}ms (${result1.cards} cards)`);
        console.log(`✅ Call 2: ${result2.duration}ms (${result2.cards} cards)`);
        console.log(`📈 Speedup: ${speedup.toFixed(1)}x faster`);
        console.log(`📉 Improvement: ${improvement}% reduction in response time`);
        
        if (result2.duration < 1000) {
            console.log('\n🎉 EXCELLENT! Sub-second response time achieved!');
            console.log('✨ Database query fix is working perfectly!');
        } else if (result2.duration < result1.duration * 0.5) {
            console.log('\n🎯 GOOD! Significant performance improvement detected!');
            console.log('✨ Database caching is working!');
        } else if (result2.duration >= result1.duration * 0.9) {
            console.log('\n⚠️  ISSUE: Second call not significantly faster');
            console.log('💭 Database query might still not be working correctly');
            console.log('🔍 Check logs for "[CosmosDbService]" entries');
        } else {
            console.log('\n✅ PARTIAL: Some improvement but could be better');
        }
        
        // Check if cards match
        if (result1.cards === result2.cards && result1.cards > 0) {
            console.log('✅ Consistent data: Same number of cards returned');
        } else {
            console.log('⚠️  Data inconsistency detected');
        }
        
    } else {
        console.log('❌ TEST FAILED');
        if (!result1.success) console.log(`   Call 1: ${result1.error}`);
        if (!result2.success) console.log(`   Call 2: ${result2.error}`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('- Check Azure Function logs for "[CosmosDbService]" entries');
    console.log('- Look for "Querying cards for setId: 557 (converted from...)" messages');
    console.log('- Verify "Found X cards for setId: 557" success messages');
}

testPerformanceFix().catch(console.error);
