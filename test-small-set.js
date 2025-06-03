/**
 * Test with a very small set to avoid timeouts
 * This will help us verify the Cosmos DB fix works with smaller datasets
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
                console.log(`   ⏱️  Duration: ${duration}ms, Status: ${res.statusCode}, Size: ${data.length} bytes`);
                
                if (data.length === 0) {
                    resolve({ success: false, error: 'Empty response', duration, status: res.statusCode });
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    const cards = jsonData.data?.items?.length || 0;
                    const cached = jsonData.cached || false;
                    console.log(`   📊 Cards: ${cards}, Cached: ${cached}`);
                    resolve({ success: true, data: jsonData, duration, status: res.statusCode });
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

async function testSmallSet() {
    console.log('🧪 Testing Cosmos DB with Small Dataset');
    console.log('=======================================\n');
    
    const encodedFunctionKey = encodeURIComponent(functionKey);
    
    // Test with just 3 cards to minimize save time
    const setId = 545; // Twilight Masquerade
    console.log(`🎯 Testing Set ${setId} with pageSize=3 to minimize processing time\n`);
    
    // Call 1: Force refresh with small page size
    console.log('📞 CALL 1: Force refresh (3 cards only)');
    const url1 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=3&forceRefresh=true`;
    const result1 = await makeRequest(url1, 'First call - small dataset');
    
    if (!result1.success) {
        console.log('❌ First call failed, stopping test');
        return;
    }
    
    console.log('\n⏳ Waiting 5 seconds for save operations to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Call 2: Should find in Cosmos DB
    console.log('📞 CALL 2: Check Cosmos DB (same 3 cards)');
    const url2 = `${STAGING_URL}/api/sets/${setId}/cards?code=${encodedFunctionKey}&pageSize=3`;
    const result2 = await makeRequest(url2, 'Second call - should hit DB');
    
    console.log('\n📋 Results');
    console.log('==========');
    
    if (result1.success && result2.success) {
        const call1Cards = result1.data?.data?.items?.length || 0;
        const call2Cards = result2.data?.data?.items?.length || 0;
        const call1Cached = result1.data?.cached || false;
        const call2Cached = result2.data?.cached || false;
        
        console.log(`✅ Call 1: ${call1Cards} cards, cached: ${call1Cached}, ${result1.duration}ms`);
        console.log(`✅ Call 2: ${call2Cards} cards, cached: ${call2Cached}, ${result2.duration}ms`);
        
        if (call1Cards === call2Cards && call1Cards > 0) {
            if (result2.duration < result1.duration) {
                console.log('\n🎉 SUCCESS! Cosmos DB persistence working!');
                console.log('⚡ Second call was faster - data retrieved from database');
            } else {
                console.log('\n⚠️  PARTIAL: Same card count but second call not faster');
                console.log('💭 May still be fetching from API instead of DB');
            }
        } else {
            console.log('\n❌ Card counts don\'t match - persistence issue');
        }
    } else {
        console.log('❌ One or both calls failed');
        if (!result1.success) console.log(`   Call 1: ${result1.error}`);
        if (!result2.success) console.log(`   Call 2: ${result2.error}`);
    }
    
    console.log('\n💡 Check Azure Function logs for detailed "[CosmosDbService]" entries');
}

testSmallSet().catch(console.error);
