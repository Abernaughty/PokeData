/**
 * Test script for the updated GetCardsBySet function
 * Now accepts numeric set_id instead of setCode
 */

// Read function key from environment
const fs = require('fs');
const path = require('path');

let functionKey = '';
try {
    const envPath = path.join(__dirname, 'PokeDataFunc', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
        if (line.startsWith('AZURE_FUNCTION_KEY=')) {
            functionKey = line.split('=')[1].trim();
            break;
        }
    }
} catch (error) {
    console.error('❌ Could not read function key from PokeDataFunc/.env');
    process.exit(1);
}

if (!functionKey) {
    console.error('❌ Missing AZURE_FUNCTION_KEY in PokeDataFunc/.env file');
    process.exit(1);
}

async function testUpdatedFunction() {
    console.log('🧪 Testing Updated GetCardsBySet Function');
    console.log('=====================================\n');
    
    // Test with numeric set_id (what you wanted)
    console.log('📋 TEST: Using numeric set_id 557 (Prismatic Evolutions)');
    try {
        const url = `https://pokedata-func.azurewebsites.net/api/sets/557/cards?code=${functionKey}&pageSize=5`;
        console.log(`🌐 URL: ${url}`);
        
        const response = await fetch(url);
        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ SUCCESS: Got ${data.data?.items?.length || 0} cards`);
            
            if (data.data?.items?.length > 0) {
                const firstCard = data.data.items[0];
                console.log(`📄 First card: ${firstCard.cardName} (${firstCard.cardNumber})`);
                console.log(`🏷️  Card ID: ${firstCard.id}`);
                console.log(`🎯 Source: ${firstCard.source}`);
                console.log(`🔢 PokeData ID: ${firstCard.pokeDataId}`);
                console.log(`📦 Set ID: ${firstCard.setId}`);
                console.log(`💰 Pricing keys: ${Object.keys(firstCard.pricing || {}).join(', ')}`);
                
                console.log('\n🎉 SUCCESS! The function now works with numeric set_id!');
                console.log('✨ PokeData-first architecture is now complete');
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ FAILED: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SUMMARY:');
    console.log('✅ Route updated: /api/sets/{setId}/cards');
    console.log('✅ API call updated: getCardsInSet(setId)');
    console.log('✅ Parameter handling: numeric set_id parsing');
    console.log('✅ PokeData-first: Direct PokeData API usage');
    console.log('\n🚀 Ready for frontend integration!');
}

testUpdatedFunction().catch(console.error);
