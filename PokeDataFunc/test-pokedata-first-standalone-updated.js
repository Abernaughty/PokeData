/**
 * Standalone test for PokeData-first GetCardInfo function
 * 
 * This test bypasses Azure infrastructure dependencies and directly tests
 * the core PokeData-first logic with our fixed services.
 */

// Mock environment variables
process.env.POKEMON_TCG_API_KEY = 'test-key';
process.env.POKEDATA_API_KEY = 'test-key';
process.env.ENABLE_REDIS_CACHE = 'false';

// Import the fixed PokeDataApiService directly
const { PokeDataApiService } = require('./src/services/PokeDataApiService.js');
const { pokeDataToTcgMappingService } = require('./src/services/PokeDataToTcgMappingService.js');
const { PokemonTcgApiService } = require('./src/services/PokemonTcgApiService.js');
const { ImageEnhancementService } = require('./src/services/ImageEnhancementService.js');

// Initialize services
const pokeDataApiService = new PokeDataApiService(process.env.POKEDATA_API_KEY);
const pokemonTcgApiService = new PokemonTcgApiService(process.env.POKEMON_TCG_API_KEY);
const imageEnhancementService = new ImageEnhancementService(
    pokeDataToTcgMappingService,
    pokemonTcgApiService
);

// Mock context for logging
const createMockContext = (cardId) => ({
    log: (message) => console.log(`[CONTEXT] ${message}`),
    invocationId: `test-${cardId}-${Date.now()}`,
    functionName: 'GetCardInfo',
    functionDirectory: __dirname
});

async function testPokeDataFirstLogic() {
    console.log('=== Testing PokeData-First Logic (Standalone) ===\n');
    
    const testCardId = 73115; // Espeon ex from Prismatic Evolutions
    const correlationId = `[test-${testCardId}-${Date.now()}]`;
    
    try {
        console.log(`${correlationId} Testing with PokeData card ID: ${testCardId} (Espeon ex)`);
        console.log('Expected: Full card details + pricing + image enhancement\n');
        
        const startTime = Date.now();
        
        // Step 1: Test the fixed PokeDataApiService
        console.log('1. Testing PokeDataApiService.getFullCardDetailsById...');
        const apiStartTime = Date.now();
        const fullCardData = await pokeDataApiService.getFullCardDetailsById(testCardId);
        const apiTime = Date.now() - apiStartTime;
        
        if (!fullCardData) {
            console.error('❌ No card data returned from PokeData API');
            return;
        }
        
        console.log(`✅ PokeData API call successful (${apiTime}ms)`);
        console.log(`   Card: ${fullCardData.name} #${fullCardData.num}`);
        console.log(`   Set: ${fullCardData.set_name} (${fullCardData.set_code})`);
        console.log(`   Pricing sources: ${Object.keys(fullCardData.pricing).length}`);
        
        // Step 2: Transform pricing data
        console.log('\n2. Transforming pricing data...');
        const transformedPricing = {};
        
        // Process PSA grades
        const psaGrades = {};
        for (let i = 1; i <= 10; i++) {
            const grade = i === 10 ? '10.0' : `${i}.0`;
            const key = `PSA ${grade}`;
            if (fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                psaGrades[String(i)] = fullCardData.pricing[key].value;
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
            if (fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                const gradeKey = grade.replace('.', '_');
                cgcGrades[gradeKey] = fullCardData.pricing[key].value;
            }
        });
        if (Object.keys(cgcGrades).length > 0) {
            transformedPricing.cgc = cgcGrades;
        }
        
        // Process other pricing sources
        if (fullCardData.pricing['TCGPlayer'] && fullCardData.pricing['TCGPlayer'].value > 0) {
            transformedPricing.tcgPlayer = fullCardData.pricing['TCGPlayer'].value;
        }
        if (fullCardData.pricing['eBay Raw'] && fullCardData.pricing['eBay Raw'].value > 0) {
            transformedPricing.ebayRaw = fullCardData.pricing['eBay Raw'].value;
        }
        if (fullCardData.pricing['Pokedata Raw'] && fullCardData.pricing['Pokedata Raw'].value > 0) {
            transformedPricing.pokeDataRaw = fullCardData.pricing['Pokedata Raw'].value;
        }
        
        console.log(`✅ Pricing transformed - ${Object.keys(transformedPricing).length} sources available`);
        
        // Step 3: Create base card structure
        console.log('\n3. Creating PokeData-first card structure...');
        const card = {
            id: `pokedata-${testCardId}`,
            source: "pokedata",
            pokeDataId: testCardId,
            setId: fullCardData.set_id,
            setName: fullCardData.set_name,
            setCode: fullCardData.set_code || '',
            cardName: fullCardData.name,
            cardNumber: fullCardData.num,
            secret: fullCardData.secret || false,
            language: fullCardData.language || 'ENGLISH',
            releaseDate: fullCardData.release_date || '',
            pricing: transformedPricing,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('✅ Base card structure created');
        
        // Step 4: Test image enhancement
        console.log('\n4. Testing image enhancement...');
        const enhancementStartTime = Date.now();
        
        try {
            const enhancedCard = await imageEnhancementService.enhancePricingCardWithImages({
                id: card.pokeDataId,
                language: card.language,
                name: card.cardName,
                num: card.cardNumber,
                release_date: card.releaseDate,
                secret: card.secret,
                set_code: card.setCode,
                set_id: card.setId,
                set_name: card.setName,
                pricing: {}
            });
            
            const enhancementTime = Date.now() - enhancementStartTime;
            
            if (enhancedCard.images) {
                card.images = enhancedCard.images;
                card.enhancement = enhancedCard.enhancement;
                console.log(`✅ Image enhancement successful (${enhancementTime}ms)`);
                console.log(`   Enhanced with TCG card: ${card.enhancement.tcgCardId}`);
            } else {
                console.log(`⚠️  Image enhancement skipped - no mapping available (${enhancementTime}ms)`);
            }
            
        } catch (error) {
            console.log(`⚠️  Image enhancement failed (non-critical): ${error.message}`);
        }
        
        // Step 5: Validate final card structure
        console.log('\n5. Validating final card structure...');
        
        const validations = [
            { check: card.id === `pokedata-${testCardId}`, name: 'Correct Card ID Format' },
            { check: card.source === 'pokedata', name: 'Correct Source' },
            { check: card.pokeDataId === testCardId, name: 'PokeData ID' },
            { check: !!card.cardName, name: 'Card Name' },
            { check: !!card.setName, name: 'Set Name' },
            { check: !!card.setCode, name: 'Set Code' },
            { check: !!card.pricing, name: 'Pricing Data' },
            { check: Object.keys(card.pricing).length > 0, name: 'Pricing Sources Available' },
            { check: !!card.lastUpdated, name: 'Last Updated Timestamp' }
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
        
        // Step 6: Display final results
        console.log('\n6. Final Card Structure:');
        console.log(`   ID: ${card.id}`);
        console.log(`   Name: ${card.cardName}`);
        console.log(`   Set: ${card.setName} (${card.setCode})`);
        console.log(`   Pricing Sources: ${Object.keys(card.pricing).length}`);
        console.log(`   Images: ${card.images ? 'Yes' : 'No'}`);
        console.log(`   Enhancement: ${card.enhancement ? 'Yes' : 'No'}`);
        
        if (card.pricing.psa) {
            const psaGrades = Object.keys(card.pricing.psa);
            console.log(`   PSA Grades: ${psaGrades.length} (PSA 10: $${card.pricing.psa['10'] || 'N/A'})`);
        }
        
        if (card.pricing.tcgPlayer) {
            console.log(`   TCGPlayer: $${card.pricing.tcgPlayer}`);
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`\n=== Test Complete in ${totalTime}ms ===`);
        
        if (passedValidations === validations.length) {
            console.log('🎉 All validations passed! PokeData-first logic is working perfectly!');
            console.log('✅ Ready for Azure Functions integration');
        } else {
            console.log(`⚠️  ${validations.length - passedValidations} validations failed. Please review the implementation.`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstLogic().catch(console.error);
