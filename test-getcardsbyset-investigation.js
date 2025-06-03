/**
 * Investigation script for GetCardsBySet function behavior
 * Testing both setCode (PRE) and set_id (557) approaches
 */

async function testGetCardsBySet() {
    // Read environment variables from PokeDataFunc/.env manually
    const fs = require('fs');
    const path = require('path');
    
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
        console.error('❌ Could not read PokeDataFunc/.env file');
        return;
    }
    
    const baseUrl = 'https://pokedata-func-staging.azurewebsites.net';
    
    if (!functionKey) {
        console.error('❌ Missing AZURE_FUNCTION_KEY_STAGING in PokeDataFunc/.env file');
        return;
    }
    
    console.log('🔍 Investigating GetCardsBySet function behavior...\n');
    
    // Test 1: Using setCode (PRE) - what user says works
    console.log('📋 TEST 1: Using setCode "PRE" (Pokemon TCG format)');
    try {
        const url1 = `${baseUrl}/api/sets/PRE/cards?pageSize=5`;
        console.log(`🌐 URL: ${url1}`);
        
        const response1 = await fetch(url1, {
            headers: {
                'x-functions-key': functionKey
            }
        });
        console.log(`📊 Status: ${response1.status}`);
        
        if (response1.ok) {
            const data1 = await response1.json();
            console.log(`✅ SUCCESS: Got ${data1.data?.items?.length || 0} cards`);
            if (data1.data?.items?.length > 0) {
                const firstCard = data1.data.items[0];
                console.log(`📄 First card: ${firstCard.cardName} (${firstCard.cardNumber})`);
                console.log(`🏷️  Card ID: ${firstCard.id}`);
                console.log(`🎯 Source: ${firstCard.source}`);
                console.log(`🔢 PokeData ID: ${firstCard.pokeDataId}`);
                console.log(`📦 Set ID: ${firstCard.setId}`);
                console.log(`💰 Pricing keys: ${Object.keys(firstCard.pricing || {}).join(', ')}`);
            }
        } else {
            const errorText = await response1.text();
            console.log(`❌ FAILED: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Test 2: Using set_id (557) - what user says doesn't work
    console.log('📋 TEST 2: Using set_id "557" (PokeData numeric format)');
    try {
        const url2 = `${baseUrl}/api/sets/557/cards?pageSize=5`;
        console.log(`🌐 URL: ${url2}`);
        
        const response2 = await fetch(url2, {
            headers: {
                'x-functions-key': functionKey
            }
        });
        console.log(`📊 Status: ${response2.status}`);
        
        if (response2.ok) {
            const data2 = await response2.json();
            console.log(`✅ SUCCESS: Got ${data2.data?.items?.length || 0} cards`);
            if (data2.data?.items?.length > 0) {
                const firstCard = data2.data.items[0];
                console.log(`📄 First card: ${firstCard.cardName} (${firstCard.cardNumber})`);
                console.log(`🏷️  Card ID: ${firstCard.id}`);
                console.log(`🎯 Source: ${firstCard.source}`);
                console.log(`🔢 PokeData ID: ${firstCard.pokeDataId}`);
                console.log(`📦 Set ID: ${firstCard.setId}`);
                console.log(`💰 Pricing keys: ${Object.keys(firstCard.pricing || {}).join(', ')}`);
            }
        } else {
            const errorText = await response2.text();
            console.log(`❌ FAILED: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Test 3: Check what PokeData API expects for set identification
    console.log('📋 TEST 3: Understanding PokeData API set identification');
    console.log('🔍 Route pattern: /api/sets/{setCode}/cards');
    console.log('📝 Expected: setCode should be the PokeData set code (PRE, SSP, TWM, etc.)');
    console.log('📝 NOT expected: Numeric set_id (557, 555, 545, etc.)');
    console.log('');
    console.log('🎯 ANALYSIS:');
    console.log('   - The function expects setCode parameter from route');
    console.log('   - It calls pokeDataApiService.getCardsInSetByCode(setCode)');
    console.log('   - PokeData API likely expects set codes, not numeric IDs');
    console.log('   - User needs to use PRE instead of 557');
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Test 4: Let's see what the PokeData API service actually does
    console.log('📋 TEST 4: Check if there\'s a mapping issue');
    console.log('🤔 Question: Should the function accept numeric set_id and convert to setCode?');
    console.log('🤔 Or should the user always provide setCode?');
    console.log('');
    console.log('💡 POTENTIAL SOLUTIONS:');
    console.log('   1. Modify function to accept both setCode and set_id');
    console.log('   2. Add set mapping to convert 557 → PRE');
    console.log('   3. Update API documentation to clarify expected format');
    console.log('   4. Create separate endpoint for numeric set_id');
}

// Run the investigation
testGetCardsBySet().catch(console.error);
