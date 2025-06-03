/**
 * Test script to verify the leading zero fix for image enhancement
 * This tests that cards with leading zeros (like "002") can now be mapped correctly
 */

const dotenv = require('dotenv');
dotenv.config({ path: 'PokeDataFunc/.env' });

const API_BASE_URL = process.env.AZURE_FUNCTION_BASE_URL || 'https://pokedata-func-staging.azurewebsites.net';
const API_KEY = process.env.AZURE_FUNCTION_KEY;

if (!API_KEY) {
    console.error('❌ AZURE_FUNCTION_KEY not found in environment variables');
    process.exit(1);
}

/**
 * Test the GetCardInfo function for cards with leading zeros
 */
async function testLeadingZeroFix() {
    console.log('🧪 Testing Leading Zero Fix for Image Enhancement');
    console.log('=' .repeat(60));
    
    // Test cases: cards with leading zeros that should now work
    const testCases = [
        {
            name: 'Exeggcute #002 (Surging Sparks)',
            cardId: '71364',
            expectedTcgId: 'sv8-2', // Should normalize "002" to "2"
            description: 'Card with leading zero that was failing before'
        },
        {
            name: 'Another card #047 (if exists)',
            cardId: '71400', // Example ID - may not exist
            expectedTcgId: 'sv8-47', // Should normalize "047" to "47"
            description: 'Another card with leading zero'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🔍 Testing: ${testCase.name}`);
        console.log(`   Expected TCG ID: ${testCase.expectedTcgId}`);
        console.log(`   Description: ${testCase.description}`);
        
        try {
            const url = `${API_BASE_URL}/api/cards/${testCase.cardId}?forceRefresh=true&code=${API_KEY}`;
            console.log(`   Making request to: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log(`   ❌ HTTP Error: ${response.status} - ${response.statusText}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.status === 200 && data.data) {
                const card = data.data;
                
                console.log(`   ✅ Card found: ${card.cardName} #${card.cardNumber}`);
                console.log(`   📊 Pricing sources: ${Object.keys(card.pricing || {}).length}`);
                
                if (card.images) {
                    console.log(`   🖼️  Images: ✅ SUCCESS - Images loaded!`);
                    console.log(`   🔗 Small image: ${card.images.small}`);
                    console.log(`   🔗 Large image: ${card.images.large}`);
                    
                    if (card.enhancement) {
                        console.log(`   🎯 Enhanced with TCG card: ${card.enhancement.tcgCardId}`);
                        console.log(`   ⏰ Enhanced at: ${card.enhancement.enhancedAt}`);
                        
                        if (card.enhancement.tcgCardId === testCase.expectedTcgId) {
                            console.log(`   ✅ PERFECT MATCH: TCG ID matches expected format!`);
                        } else {
                            console.log(`   ⚠️  TCG ID mismatch: expected ${testCase.expectedTcgId}, got ${card.enhancement.tcgCardId}`);
                        }
                    } else {
                        console.log(`   ⚠️  No enhancement data found`);
                    }
                } else {
                    console.log(`   ❌ Images: MISSING - Fix may not be working yet`);
                }
                
                console.log(`   💾 Cached: ${data.cached ? 'Yes' : 'No'}`);
                console.log(`   ⏱️  Response time: Fast`);
                
            } else {
                console.log(`   ❌ Invalid response structure:`, data);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('   ' + '-'.repeat(50));
    }
}

/**
 * Test a working card for comparison
 */
async function testWorkingCard() {
    console.log(`\n🔍 Testing Working Card for Comparison`);
    console.log(`   Card: Pikachu #247 (Surging Sparks) - should work`);
    
    try {
        const url = `${API_BASE_URL}/api/cards/71609?code=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`   ❌ HTTP Error: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        
        if (data.status === 200 && data.data) {
            const card = data.data;
            console.log(`   ✅ Card: ${card.cardName} #${card.cardNumber}`);
            console.log(`   🖼️  Images: ${card.images ? '✅ Present' : '❌ Missing'}`);
            if (card.enhancement) {
                console.log(`   🎯 TCG ID: ${card.enhancement.tcgCardId}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('🚀 Starting Leading Zero Fix Tests');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);
    console.log(`🔑 Using API Key: ${API_KEY ? '✅ Present' : '❌ Missing'}`);
    console.log('');
    
    // Test the working card first for baseline
    await testWorkingCard();
    
    // Test the leading zero fix
    await testLeadingZeroFix();
    
    console.log('\n🏁 Test Summary');
    console.log('=' .repeat(60));
    console.log('✅ If Exeggcute #002 now shows images, the fix is working!');
    console.log('❌ If it still shows "Image enhancement skipped", the fix needs more work');
    console.log('');
    console.log('💡 Check the Azure Function logs for detailed enhancement logging');
    console.log('🔍 Look for "Normalized card number" messages in the logs');
}

// Run the tests
runTests().catch(console.error);
