/**
 * Test script for the new PokeData-first GetCardInfo function
 * This tests the complete flow with a real PokeData card ID
 */

const { getCardInfo } = require('./src/functions/GetCardInfo/index-pokedata-first');

// Mock Azure Functions context
const mockContext = {
    log: console.log,
    params: {}
};

// Mock HTTP request for Espeon ex (PokeData ID: 73115)
const mockRequest = {
    params: {
        cardId: '73115' // Espeon ex from Prismatic Evolutions
    },
    query: {
        get: (key) => {
            const queryParams = {
                forceRefresh: 'false'
            };
            return queryParams[key] || null;
        }
    }
};

async function testPokeDataFirstGetCardInfo() {
    console.log('=== Testing PokeData-First GetCardInfo Function ===\n');

    try {
        console.log('Testing with Espeon ex (PokeData ID: 73115)...\n');
        
        const startTime = Date.now();
        const response = await getCardInfo(mockRequest, mockContext);
        const totalTime = Date.now() - startTime;
        
        console.log(`\n=== Response received in ${totalTime}ms ===`);
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
        
        if (response.jsonBody && response.jsonBody.data) {
            const card = response.jsonBody.data;
            
            console.log('\n=== Card Data ===');
            console.log('ID:', card.id);
            console.log('Source:', card.source);
            console.log('PokeData ID:', card.pokeDataId);
            console.log('Card Name:', card.cardName);
            console.log('Card Number:', card.cardNumber);
            console.log('Set:', card.setName);
            console.log('Set Code:', card.setCode);
            console.log('Secret:', card.secret);
            console.log('Release Date:', card.releaseDate);
            
            console.log('\n=== Pricing Data ===');
            if (card.pricing.psa) {
                console.log('PSA Grades:', Object.keys(card.pricing.psa).length);
                if (card.pricing.psa['10']) {
                    console.log('PSA 10:', `$${card.pricing.psa['10']}`);
                }
                if (card.pricing.psa['9']) {
                    console.log('PSA 9:', `$${card.pricing.psa['9']}`);
                }
            }
            
            if (card.pricing.cgc) {
                console.log('CGC Grades:', Object.keys(card.pricing.cgc).length);
                if (card.pricing.cgc['9_0']) {
                    console.log('CGC 9.0:', `$${card.pricing.cgc['9_0']}`);
                }
            }
            
            if (card.pricing.tcgPlayer) {
                console.log('TCGPlayer:', `$${card.pricing.tcgPlayer}`);
            }
            
            if (card.pricing.ebayRaw) {
                console.log('eBay Raw:', `$${card.pricing.ebayRaw}`);
            }
            
            if (card.pricing.pokeDataRaw) {
                console.log('PokeData Raw:', `$${card.pricing.pokeDataRaw}`);
            }
            
            console.log('\n=== Image Enhancement ===');
            if (card.images) {
                console.log('Images Available: YES');
                console.log('Small Image:', card.images.small);
                console.log('Large Image:', card.images.large);
                
                if (card.enhancement) {
                    console.log('Enhancement Details:');
                    console.log('  TCG Set ID:', card.enhancement.tcgSetId);
                    console.log('  TCG Card ID:', card.enhancement.tcgCardId);
                    console.log('  Enhanced At:', card.enhancement.enhancedAt);
                    if (card.enhancement.metadata) {
                        console.log('  Rarity:', card.enhancement.metadata.rarity);
                    }
                }
            } else {
                console.log('Images Available: NO');
            }
            
            console.log('\n=== Cache Information ===');
            console.log('Cached:', response.jsonBody.cached);
            if (response.jsonBody.cacheAge) {
                console.log('Cache Age:', `${response.jsonBody.cacheAge}s`);
            }
            console.log('Timestamp:', response.jsonBody.timestamp);
            
            console.log('\n=== Validation ===');
            const validations = [
                { name: 'Has PokeData ID', pass: !!card.pokeDataId },
                { name: 'Has Card Name', pass: !!card.cardName },
                { name: 'Has Pricing Data', pass: Object.keys(card.pricing).length > 0 },
                { name: 'Has PSA Pricing', pass: !!card.pricing.psa },
                { name: 'Has TCGPlayer Price', pass: !!card.pricing.tcgPlayer },
                { name: 'Source is PokeData', pass: card.source === 'pokedata' },
                { name: 'ID Format Correct', pass: card.id.startsWith('pokedata-') }
            ];
            
            validations.forEach(validation => {
                console.log(`${validation.pass ? '✅' : '❌'} ${validation.name}`);
            });
            
            const passedValidations = validations.filter(v => v.pass).length;
            console.log(`\nValidation Summary: ${passedValidations}/${validations.length} passed`);
            
            if (passedValidations === validations.length) {
                console.log('\n🎉 PokeData-First GetCardInfo function is working perfectly!');
            } else {
                console.log('\n⚠️  Some validations failed - check the implementation');
            }
            
        } else {
            console.log('\n❌ No card data in response');
            console.log('Full response:', JSON.stringify(response, null, 2));
        }
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetCardInfo();
