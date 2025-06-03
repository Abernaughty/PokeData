/**
 * Test script to verify the set mapping fix for enhanced pricing data
 * This script tests the specific card sv8pt5-150 that was failing before the fix
 */

const axios = require('axios');

// Configuration
const AZURE_FUNCTION_URL = 'https://pokedata-func-staging.azurewebsites.net/api/cards';
const FUNCTION_KEY = 'Uo4vpqa7si7iR1T3LpQfJScDpbIdQ473kbPjlmV-YJgCAzFur2lsFg=='; // Staging function key
const TEST_CARD_ID = 'sv8pt5-150'; // Prismatic Evolutions card that was failing

async function testSetMappingFix() {
    console.log('🧪 Testing Set Mapping Fix for Enhanced Pricing Data');
    console.log('=' .repeat(60));
    
    try {
        console.log(`📋 Testing card: ${TEST_CARD_ID}`);
        console.log(`🌐 Calling: ${AZURE_FUNCTION_URL}/${TEST_CARD_ID}`);
        
        const startTime = Date.now();
        const url = `${AZURE_FUNCTION_URL}/${TEST_CARD_ID}?code=${FUNCTION_KEY}`;
        const response = await axios.get(url, {
            timeout: 30000 // 30 second timeout
        });
        const endTime = Date.now();
        
        console.log(`⏱️  Response time: ${endTime - startTime}ms`);
        console.log(`✅ Status: ${response.status}`);
        
        if (response.data && response.data.data) {
            const card = response.data.data;
            
            console.log('\n📊 Card Information:');
            console.log(`   Name: ${card.cardName || card.name}`);
            console.log(`   Set: ${card.setName || card.set?.name} (${card.setCode || card.set?.id})`);
            console.log(`   Number: ${card.cardNumber || card.number}`);
            console.log(`   Rarity: ${card.rarity}`);
            
            // Check if PokeData ID was mapped
            console.log('\n🔍 PokeData ID Mapping:');
            if (card.pokeDataId) {
                console.log(`   ✅ PokeData ID: ${card.pokeDataId}`);
            } else {
                console.log(`   ❌ PokeData ID: Not found`);
            }
            
            // Check enhanced pricing data
            console.log('\n💰 Enhanced Pricing Data:');
            if (card.enhancedPricing) {
                console.log(`   ✅ Enhanced pricing found!`);
                
                if (card.enhancedPricing.psaGrades) {
                    console.log(`   📈 PSA Grades: ${Object.keys(card.enhancedPricing.psaGrades).length} grades available`);
                    Object.entries(card.enhancedPricing.psaGrades).forEach(([grade, data]) => {
                        console.log(`      PSA ${grade}: $${data.value}`);
                    });
                }
                
                if (card.enhancedPricing.cgcGrades) {
                    console.log(`   📈 CGC Grades: ${Object.keys(card.enhancedPricing.cgcGrades).length} grades available`);
                    Object.entries(card.enhancedPricing.cgcGrades).forEach(([grade, data]) => {
                        const displayGrade = grade.replace('_', '.');
                        console.log(`      CGC ${displayGrade}: $${data.value}`);
                    });
                }
                
                if (card.enhancedPricing.ebayRaw) {
                    console.log(`   📈 eBay Raw: $${card.enhancedPricing.ebayRaw.value}`);
                }
            } else {
                console.log(`   ❌ Enhanced pricing: Not found`);
            }
            
            // Check regular TCG Player pricing
            console.log('\n💵 TCG Player Pricing:');
            if (card.tcgPlayerPrice) {
                console.log(`   ✅ TCG Player pricing found!`);
                if (card.tcgPlayerPrice.market) console.log(`      Market: $${card.tcgPlayerPrice.market}`);
                if (card.tcgPlayerPrice.low) console.log(`      Low: $${card.tcgPlayerPrice.low}`);
                if (card.tcgPlayerPrice.mid) console.log(`      Mid: $${card.tcgPlayerPrice.mid}`);
                if (card.tcgPlayerPrice.high) console.log(`      High: $${card.tcgPlayerPrice.high}`);
            } else {
                console.log(`   ❌ TCG Player pricing: Not found`);
            }
            
            // Summary
            console.log('\n📋 Test Results Summary:');
            console.log('=' .repeat(40));
            
            const hasPokeDataId = !!card.pokeDataId;
            const hasEnhancedPricing = !!card.enhancedPricing;
            const hasTcgPlayerPricing = !!card.tcgPlayerPrice;
            
            console.log(`✅ PokeData ID Mapping: ${hasPokeDataId ? 'PASS' : 'FAIL'}`);
            console.log(`✅ Enhanced Pricing: ${hasEnhancedPricing ? 'PASS' : 'FAIL'}`);
            console.log(`✅ TCG Player Pricing: ${hasTcgPlayerPricing ? 'PASS' : 'FAIL'}`);
            
            if (hasPokeDataId && hasEnhancedPricing) {
                console.log('\n🎉 SUCCESS: Set mapping fix is working! Enhanced pricing data is now available.');
                return true;
            } else if (hasPokeDataId && !hasEnhancedPricing) {
                console.log('\n⚠️  PARTIAL: PokeData ID mapped but enhanced pricing still missing. May be API credit issue.');
                return false;
            } else {
                console.log('\n❌ FAILURE: Set mapping fix did not work. PokeData ID still not mapped.');
                return false;
            }
            
        } else {
            console.log('❌ Error: Invalid response structure');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error testing set mapping fix:', error.message);
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        
        return false;
    }
}

// Run the test
testSetMappingFix().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
        console.log('🎯 OVERALL RESULT: TEST PASSED - Set mapping fix is working!');
        process.exit(0);
    } else {
        console.log('💥 OVERALL RESULT: TEST FAILED - Set mapping fix needs more work.');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 OVERALL RESULT: TEST ERROR -', error.message);
    process.exit(1);
});
