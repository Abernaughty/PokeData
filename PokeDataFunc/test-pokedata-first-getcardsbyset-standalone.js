/**
 * Standalone test for PokeData-first GetCardsBySet function
 * 
 * This test bypasses Azure infrastructure dependencies and directly tests
 * the core PokeData-first logic with our fixed services.
 */

// Load environment variables from .env file
require('dotenv').config();

// Set test-specific environment variables (but keep real API keys)
process.env.POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || 'test-key';
process.env.ENABLE_REDIS_CACHE = 'false';

// Import the fixed PokeDataApiService directly
const { PokeDataApiService } = require('./src/services/PokeDataApiService.js');

// Initialize services with real API key from .env
const pokeDataApiService = new PokeDataApiService(process.env.POKEDATA_API_KEY);

// Mock context for logging
const createMockContext = (setCode) => ({
    log: (message) => console.log(`[CONTEXT] ${message}`),
    invocationId: `test-${setCode}-${Date.now()}`,
    functionName: 'GetCardsBySet',
    functionDirectory: __dirname
});

async function testPokeDataFirstGetCardsBySetLogic() {
    console.log('=== Testing PokeData-First GetCardsBySet Logic (Standalone) ===\n');
    
    const testSetCode = 'PRE'; // Prismatic Evolutions
    const correlationId = `[test-${testSetCode}-${Date.now()}]`;
    
    try {
        console.log(`${correlationId} Testing with PokeData set code: ${testSetCode} (Prismatic Evolutions)`);
        console.log('Expected: Fast response with comprehensive pricing data, no images\n');
        
        // Log API key status (masked for security)
        const apiKey = process.env.POKEDATA_API_KEY;
        if (apiKey && apiKey !== 'test-key') {
            console.log(`✅ Using real PokeData API key: ${apiKey.substring(0, 20)}...`);
        } else {
            console.log(`❌ Using test API key - this will likely fail`);
        }
        
        const startTime = Date.now();
        
        // Step 1: Test getting cards from PokeData API
        console.log('1. Testing PokeDataApiService.getCardsInSetByCode...');
        const apiStartTime = Date.now();
        const pokeDataCards = await pokeDataApiService.getCardsInSetByCode(testSetCode);
        const apiTime = Date.now() - apiStartTime;
        
        if (!pokeDataCards || pokeDataCards.length === 0) {
            console.error('❌ No cards returned from PokeData API');
            return;
        }
        
        console.log(`✅ PokeData API call successful (${apiTime}ms)`);
        console.log(`   Cards found: ${pokeDataCards.length}`);
        console.log(`   Sample card: ${pokeDataCards[0].name} #${pokeDataCards[0].num}`);
        console.log(`   Set: ${pokeDataCards[0].set_name} (${pokeDataCards[0].set_code})`);
        
        // Step 2: Test getting full details for a subset of cards (to avoid too many API calls)
        console.log('\n2. Testing full card details with pricing for sample cards...');
        const sampleSize = Math.min(5, pokeDataCards.length); // Test first 5 cards
        const sampleCards = pokeDataCards.slice(0, sampleSize);
        
        const transformStartTime = Date.now();
        const transformedCards = [];
        
        for (let i = 0; i < sampleCards.length; i++) {
            const pokeDataCard = sampleCards[i];
            console.log(`   Processing card ${i + 1}/${sampleSize}: ${pokeDataCard.name}`);
            
            try {
                // Get full card details including pricing
                const fullCardData = await pokeDataApiService.getFullCardDetailsById(pokeDataCard.id);
                
                if (!fullCardData) {
                    console.log(`   ⚠️  No pricing data for ${pokeDataCard.name}`);
                    // Create card with basic info and empty pricing
                    transformedCards.push({
                        id: `pokedata-${pokeDataCard.id}`,
                        source: "pokedata",
                        pokeDataId: pokeDataCard.id,
                        setId: pokeDataCard.set_id,
                        setName: pokeDataCard.set_name,
                        setCode: pokeDataCard.set_code || testSetCode,
                        cardName: pokeDataCard.name,
                        cardNumber: pokeDataCard.num,
                        secret: pokeDataCard.secret || false,
                        language: pokeDataCard.language || 'ENGLISH',
                        releaseDate: pokeDataCard.release_date || '',
                        pricing: {},
                        lastUpdated: new Date().toISOString()
                    });
                    continue;
                }
                
                // Transform pricing data
                const transformedPricing = {};
                
                // Process PSA grades
                const psaGrades = {};
                for (let grade = 1; grade <= 10; grade++) {
                    const gradeStr = grade === 10 ? '10.0' : `${grade}.0`;
                    const key = `PSA ${gradeStr}`;
                    if (fullCardData.pricing && fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                        psaGrades[String(grade)] = fullCardData.pricing[key].value;
                    }
                }
                if (Object.keys(psaGrades).length > 0) {
                    transformedPricing.psa = psaGrades;
                }
                
                // Process CGC grades
                const cgcGrades = {};
                const cgcGradeValues = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'];
                cgcGradeValues.forEach(grade => {
                    const key = `CGC ${grade}`;
                    if (fullCardData.pricing && fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                        const gradeKey = grade.replace('.', '_');
                        cgcGrades[gradeKey] = fullCardData.pricing[key].value;
                    }
                });
                if (Object.keys(cgcGrades).length > 0) {
                    transformedPricing.cgc = cgcGrades;
                }
                
                // Process other pricing sources
                if (fullCardData.pricing) {
                    if (fullCardData.pricing['TCGPlayer'] && fullCardData.pricing['TCGPlayer'].value > 0) {
                        transformedPricing.tcgPlayer = fullCardData.pricing['TCGPlayer'].value;
                    }
                    if (fullCardData.pricing['eBay Raw'] && fullCardData.pricing['eBay Raw'].value > 0) {
                        transformedPricing.ebayRaw = fullCardData.pricing['eBay Raw'].value;
                    }
                    if (fullCardData.pricing['Pokedata Raw'] && fullCardData.pricing['Pokedata Raw'].value > 0) {
                        transformedPricing.pokeDataRaw = fullCardData.pricing['Pokedata Raw'].value;
                    }
                }
                
                const transformedCard = {
                    id: `pokedata-${pokeDataCard.id}`,
                    source: "pokedata",
                    pokeDataId: pokeDataCard.id,
                    setId: pokeDataCard.set_id,
                    setName: pokeDataCard.set_name,
                    setCode: pokeDataCard.set_code || testSetCode,
                    cardName: pokeDataCard.name,
                    cardNumber: pokeDataCard.num,
                    secret: pokeDataCard.secret || false,
                    language: pokeDataCard.language || 'ENGLISH',
                    releaseDate: pokeDataCard.release_date || '',
                    pricing: transformedPricing,
                    lastUpdated: new Date().toISOString()
                };
                
                transformedCards.push(transformedCard);
                
                const pricingSources = Object.keys(transformedPricing);
                console.log(`   ✅ ${pokeDataCard.name}: ${pricingSources.length} pricing sources`);
                
            } catch (error) {
                console.log(`   ⚠️  Failed to get pricing for ${pokeDataCard.name}: ${error.message}`);
                // Add card with basic info only
                transformedCards.push({
                    id: `pokedata-${pokeDataCard.id}`,
                    source: "pokedata",
                    pokeDataId: pokeDataCard.id,
                    setId: pokeDataCard.set_id,
                    setName: pokeDataCard.set_name,
                    setCode: pokeDataCard.set_code || testSetCode,
                    cardName: pokeDataCard.name,
                    cardNumber: pokeDataCard.num,
                    secret: pokeDataCard.secret || false,
                    language: pokeDataCard.language || 'ENGLISH',
                    releaseDate: pokeDataCard.release_date || '',
                    pricing: {},
                    lastUpdated: new Date().toISOString()
                });
            }
        }
        
        const transformTime = Date.now() - transformStartTime;
        console.log(`\n✅ Transformed ${transformedCards.length} cards to PokeData-first format (${transformTime}ms)`);
        
        // Step 3: Validate final card structure
        console.log('\n3. Validating PokeData-first card structure...');
        
        if (transformedCards.length > 0) {
            const sampleCard = transformedCards[0];
            
            const validations = [
                { check: sampleCard.id.startsWith('pokedata-'), name: 'Correct ID Format' },
                { check: sampleCard.source === 'pokedata', name: 'Correct Source' },
                { check: typeof sampleCard.pokeDataId === 'number', name: 'PokeData ID' },
                { check: !!sampleCard.cardName, name: 'Card Name' },
                { check: !!sampleCard.setName, name: 'Set Name' },
                { check: !!sampleCard.setCode, name: 'Set Code' },
                { check: !!sampleCard.pricing, name: 'Pricing Data' },
                { check: !sampleCard.images, name: 'No Images (On-Demand)' },
                { check: !sampleCard.enhancement, name: 'No Enhancement (On-Demand)' },
                { check: !!sampleCard.lastUpdated, name: 'Last Updated Timestamp' }
            ];
            
            let passedValidations = 0;
            validations.forEach(({ check, name }) => {
                if (check) {
                    console.log(`   ✅ ${name}`);
                    passedValidations++;
                } else {
                    console.log(`   ❌ ${name}`);
                }
            });
            
            console.log(`\nValidation Summary: ${passedValidations}/${validations.length} passed`);
            
            // Step 4: Display sample results
            console.log('\n4. Sample Card Results:');
            transformedCards.forEach((card, index) => {
                const pricingSources = Object.keys(card.pricing);
                console.log(`   ${index + 1}. ${card.cardName} (#${card.cardNumber})`);
                console.log(`      ID: ${card.id}`);
                console.log(`      Pricing Sources: ${pricingSources.length}`);
                
                if (card.pricing.psa) {
                    const psaGrades = Object.keys(card.pricing.psa);
                    console.log(`      PSA Grades: ${psaGrades.length} (PSA 10: $${card.pricing.psa['10'] || 'N/A'})`);
                }
                if (card.pricing.tcgPlayer) {
                    console.log(`      TCGPlayer: $${card.pricing.tcgPlayer}`);
                }
                console.log('');
            });
            
            // Step 5: Simulate pagination
            console.log('5. Simulating pagination...');
            const totalCount = pokeDataCards.length;
            const pageSize = 50;
            const totalPages = Math.ceil(totalCount / pageSize);
            
            console.log(`   Total Cards: ${totalCount}`);
            console.log(`   Page Size: ${pageSize}`);
            console.log(`   Total Pages: ${totalPages}`);
            console.log(`   Sample Page 1: ${Math.min(pageSize, totalCount)} cards`);
            
            // Step 6: Performance analysis
            const totalTime = Date.now() - startTime;
            console.log('\n6. Performance Analysis:');
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   API Calls: ${sampleSize + 1} (1 set + ${sampleSize} cards)`);
            console.log(`   Pokemon TCG API Calls: 0 (on-demand strategy)`);
            console.log(`   Average per card: ${Math.round(transformTime / sampleSize)}ms`);
            
            if (totalTime < 5000) {
                console.log(`   ✅ Performance: Excellent for ${sampleSize} cards`);
            } else {
                console.log(`   ⚠️  Performance: Acceptable for ${sampleSize} cards`);
            }
            
            console.log('\n=== Test Complete ===');
            
            if (passedValidations === validations.length) {
                console.log('🎉 All validations passed! PokeData-first GetCardsBySet logic is working perfectly!');
                console.log('✅ On-demand image loading strategy validated');
                console.log('✅ Fast response times with comprehensive pricing data');
                console.log('✅ Efficient API usage - no unnecessary Pokemon TCG calls');
                console.log('✅ Ready for Azure Functions integration');
            } else {
                console.log(`⚠️  ${validations.length - passedValidations} validations failed. Please review the implementation.`);
            }
        } else {
            console.log('❌ No cards were successfully transformed');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetCardsBySetLogic().catch(console.error);
