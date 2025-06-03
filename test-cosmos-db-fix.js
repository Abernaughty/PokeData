/**
 * Test script to verify the Cosmos DB persistence fix
 * This will help us see the enhanced logging and confirm cards are being saved properly
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
            // Use substring to avoid splitting on the == at the end of the key
            functionKey = line.substring('AZURE_FUNCTION_KEY_STAGING='.length).trim();
            break;
        }
    }
} catch (error) {
    console.error('❌ Could not read function key from PokeDataFunc/.env');
    process.exit(1);
}

if (!functionKey) {
    console.error('❌ Missing AZURE_FUNCTION_KEY_STAGING in PokeDataFunc/.env file');
    process.exit(1);
}

const STAGING_URL = 'https://pokedata-func-staging.azurewebsites.net';

async function makeRequest(url, description) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        console.log(`📡 ${description}`);
        console.log(`   URL: ${url}`);
        
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                console.log(`   ⏱️  Duration: ${duration}ms`);
                console.log(`   📊 Status: ${res.statusCode}`);
                console.log(`   📏 Response Size: ${data.length} bytes`);
                
                if (data.length === 0) {
                    console.log(`   ❌ Empty response received`);
                    resolve({ success: false, error: 'Empty response', duration, status: res.statusCode });
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`   ✅ Valid JSON response`);
                    
                    if (jsonData.data && jsonData.data.items) {
                        console.log(`   🎴 Cards returned: ${jsonData.data.items.length}`);
                        console.log(`   📈 Total count: ${jsonData.data.totalCount}`);
                        console.log(`   💾 Cached: ${jsonData.cached}`);
                        
                        if (jsonData.data.items.length > 0) {
                            const firstCard = jsonData.data.items[0];
                            console.log(`   🃏 First card: ${firstCard.cardName} (${firstCard.cardNumber})`);
                            console.log(`   🆔 Card ID: ${firstCard.id}`);
                            console.log(`   🎯 Source: ${firstCard.source}`);
                        }
                    }
                    
                    resolve({ success: true, data: jsonData, duration, status: res.statusCode });
                } catch (error) {
                    console.log(`   ❌ JSON Parse Error: ${error.message}`);
                    console.log(`   📄 Raw Response (first 500 chars): ${data.substring(0, 500)}...`);
                    resolve({ success: false, error: error.message, duration, status: res.statusCode, rawData: data });
                }
            });
        });
        
        req.on('error', (error) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log(`   ❌ Request Error: ${error.message} (${duration}ms)`);
            resolve({ success: false, error: error.message, duration });
        });
        
        req.setTimeout(45000, () => {
            console.log(`   ⏰ Request Timeout (45s)`);
            req.destroy();
            resolve({ success: false, error: 'Timeout', duration: 45000 });
        });
        
        req.end();
    });
}

async function testCosmosDbFix() {
    console.log('🔧 Testing Cosmos DB Persistence Fix');
    console.log('====================================\n');
    
    // Test with a smaller set first to reduce load
    const setId = 545; // Twilight Masquerade - smaller set
    const setName = 'Twilight Masquerade';
    
    console.log(`🎯 Testing with Set ${setId} (${setName})`);
    console.log('This test will make two consecutive calls to check persistence:\n');
    
    // URL encode the function key to handle special characters like ==
    const encodedFunctionKey = encodeURIComponent(functionKey);
    console.log(`🔑 Function key: ${functionKey}`);
    console.log(`🔐 Encoded key: ${encodedFunctionKey}`);
    
    // First call - should fetch from PokeData API and save to Cosmos DB
    console.log('📞 CALL 1: Fresh fetch (should save to Cosmos DB)');
    const url1 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=10&forceRefresh=true`;
    const result1 = await makeRequest(url1, 'First call with forceRefresh=true');
    
    console.log('\n⏳ Waiting 3 seconds before second call...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Second call - should find cards in Cosmos DB
    console.log('📞 CALL 2: Should find in Cosmos DB');
    const url2 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=10`;
    const result2 = await makeRequest(url2, 'Second call (should hit Cosmos DB)');
    
    console.log('\n📋 Test Results');
    console.log('===============');
    
    if (result1.success && result2.success) {
        const call1Cards = result1.data?.data?.items?.length || 0;
        const call2Cards = result2.data?.data?.items?.length || 0;
        const call1Cached = result1.data?.cached || false;
        const call2Cached = result2.data?.cached || false;
        
        console.log(`✅ Call 1: ${call1Cards} cards, cached: ${call1Cached}, duration: ${result1.duration}ms`);
        console.log(`✅ Call 2: ${call2Cards} cards, cached: ${call2Cached}, duration: ${result2.duration}ms`);
        
        if (call1Cards > 0 && call2Cards > 0 && call1Cards === call2Cards) {
            console.log('\n🎉 SUCCESS! Cosmos DB persistence is working!');
            console.log('✨ Cards are being saved and retrieved correctly.');
            
            if (result2.duration < result1.duration) {
                console.log('⚡ Second call was faster, indicating database retrieval is working.');
            }
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Cards returned but counts don\'t match');
            console.log(`   Call 1: ${call1Cards} cards`);
            console.log(`   Call 2: ${call2Cards} cards`);
        }
    } else {
        console.log('\n❌ TEST FAILED');
        if (!result1.success) {
            console.log(`   Call 1 failed: ${result1.error}`);
        }
        if (!result2.success) {
            console.log(`   Call 2 failed: ${result2.error}`);
        }
    }
    
    console.log('\n💡 Check the Azure Function logs for detailed Cosmos DB operation logs.');
    console.log('🔍 Look for "[CosmosDbService]" entries to see save/query operations.');
}

// Run the test
testCosmosDbFix().catch(console.error);
