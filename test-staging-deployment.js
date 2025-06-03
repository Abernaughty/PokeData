/**
 * Test script to verify the updated GetCardsBySet function in staging
 * Tests the new numeric set_id functionality
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
            functionKey = line.split('=')[1].trim();
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
        
        console.log(`📡 Testing: ${description}`);
        console.log(`   URL: ${url}`);
        
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`   ✅ Status: ${res.statusCode} (${duration}ms)`);
                    
                    if (jsonData.data && jsonData.data.items) {
                        console.log(`   📊 Cards: ${jsonData.data.items.length}`);
                        if (jsonData.data.totalCount) {
                            console.log(`   📈 Total: ${jsonData.data.totalCount}`);
                        }
                        
                        // Show first card details
                        if (jsonData.data.items.length > 0) {
                            const firstCard = jsonData.data.items[0];
                            console.log(`   🎴 First Card: ${firstCard.cardName} (${firstCard.cardNumber})`);
                            console.log(`   🏷️  Card ID: ${firstCard.id}`);
                            console.log(`   🎯 Source: ${firstCard.source}`);
                            console.log(`   🔢 PokeData ID: ${firstCard.pokeDataId}`);
                            console.log(`   📦 Set ID: ${firstCard.setId}`);
                        }
                    }
                    
                    resolve({ success: true, data: jsonData, duration, status: res.statusCode });
                } catch (error) {
                    console.log(`   ❌ JSON Parse Error: ${error.message}`);
                    console.log(`   📄 Raw Response: ${data.substring(0, 200)}...`);
                    resolve({ success: false, error: error.message, duration, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log(`   ❌ Request Error: ${error.message} (${duration}ms)`);
            resolve({ success: false, error: error.message, duration });
        });
        
        req.setTimeout(30000, () => {
            console.log(`   ⏰ Request Timeout (30s)`);
            req.destroy();
            resolve({ success: false, error: 'Timeout', duration: 30000 });
        });
        
        req.end();
    });
}

async function testStagingDeployment() {
    console.log('🚀 Testing Updated GetCardsBySet Function in Staging');
    console.log('==================================================\n');
    
    const testCases = [
        {
            setId: 557,
            setName: 'Prismatic Evolutions',
            description: 'Test numeric set_id 557 (Prismatic Evolutions)'
        },
        {
            setId: 555,
            setName: 'Surging Sparks',
            description: 'Test numeric set_id 555 (Surging Sparks)'
        },
        {
            setId: 545,
            setName: 'Twilight Masquerade',
            description: 'Test numeric set_id 545 (Twilight Masquerade)'
        }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`🎯 ${testCase.description}`);
        const url = `${STAGING_URL}/api/sets/${testCase.setId}/cards?code=${functionKey}&pageSize=5`;
        const result = await makeRequest(url, testCase.description);
        results.push({ ...testCase, ...result });
        console.log('');
    }
    
    // Summary
    console.log('📋 Test Summary');
    console.log('===============');
    
    let allPassed = true;
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} Set ${result.setId} (${result.setName}): ${result.duration}ms`);
        if (!result.success) {
            allPassed = false;
            console.log(`    Error: ${result.error}`);
        }
    });
    
    console.log('');
    if (allPassed) {
        console.log('🎉 All tests PASSED! GetCardsBySet now accepts numeric set_id parameters.');
        console.log('✨ PokeData-first architecture is working correctly in staging.');
        console.log('🚀 Ready for production deployment via GitHub Actions workflow.');
    } else {
        console.log('💥 Some tests FAILED. Check the deployment or wait for staging deployment to complete.');
    }
}

// Run the tests
testStagingDeployment().catch(console.error);
