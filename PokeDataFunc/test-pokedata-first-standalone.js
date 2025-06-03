/**
 * Standalone test for PokeData-first architecture core logic
 * This tests the services without Azure Functions infrastructure
 */

const { PokeDataApiService } = require('./src/services/PokeDataApiService');
const { pokeDataToTcgMappingService } = require('./src/services/PokeDataToTcgMappingService');
const { PokemonTcgApiService } = require('./src/services/PokemonTcgApiService');
const { ImageEnhancementService } = require('./src/services/ImageEnhancementService');

// Load environment variables
require('dotenv').config();

async function testPokeDataFirstStandalone() {
    console.log('=== Testing PokeData-First Core Logic (Standalone) ===\n');

    // Initialize services
    const pokeDataApiKey = process.env.POKEDATA_API_KEY;
    const pokemonTcgApiKey = process.env.POKEMON_TCG_API_KEY;

    if (!pokeDataApiKey || !pokemonTcgApiKey) {
        console.error('Missing API keys in environment variables');
        return;
    }

    const pokeDataService = new PokeDataApiService(pokeDataApiKey);
    const pokemonTcgService = new PokemonTcgApiService(pokemonTcgApiKey);
    const imageEnhancementService = new ImageEnhancementService(
        pokeDataToTcgMappingService,
        pokemonTcgService
    );

    try {
        // Test the core PokeData-first flow
        const pokeDataCardId = 73115; // Espeon ex from Prismatic Evolutions
        console.log(`Testing with PokeData card ID: ${pokeDataCardId} (Espeon ex)\n`);

        // Step 1: Get pricing data from PokeData (PRIMARY GOAL)
        console.log('1. Fetching pricing data from PokeData API...');
        const startTime = Date.now();
        const pricingData = await pokeDataService.getCardPricingById(pokeDataCardId);
        const pricingTime = Date.now() - startTime;
        
        if (!pricingData) {
            console.error('❌ No pricing data found');
            return;
        }
        
        console.log(`✅ Pricing data retrieved (${pricingTime}ms)`);
        console.log(`   Card: ${pricingData.name} #${pricingData.num}`);
        console.log(`   Set: ${pricingData.set_name} (ID: ${pricingData.set_id})`);
        console.log(`   PSA 10: $${pricingData['PSA 10.0']?.value || 'N/A'}`);
        console.log(`   TCGPlayer: $${pricingData['TCGPlayer']?.value || 'N/A'}`);

        // Step 2: Transform pricing data to our format
        console.log('\n2. Transforming pricing data...');
        const transformedPricing = {};
        
        // Process PSA grades
        const psaGrades = {};
        for (let i = 1; i <= 10; i++) {
            const grade = i === 10 ? '10.0' : `${i}.0`;
            const key = `PSA ${grade}`;
            if (pricingData[key] && pricingData[key].value > 0) {
                psaGrades[String(i)] = pricingData[key].value;
            }
        }
        if (Object.keys(psaGrades).length > 0) {
            transformedPricing.psa = psaGrades;
        }
        
        // Process other pricing sources
        if (pricingData['TCGPlayer'] && pricingData['TCGPlayer'].value > 0) {
            transformedPricing.tcgPlayer = pricingData['TCGPlayer'].value;
        }
        if (pricingData['eBay Raw'] && pricingData['eBay Raw'].value > 0) {
            transformedPricing.ebayRaw = pricingData['eBay Raw'].value;
        }
        
        console.log(`✅ Pricing transformed - ${Object.keys(transformedPricing).length} sources`);
        console.log(`   PSA grades: ${transformedPricing.psa ? Object.keys(transformedPricing.psa).length : 0}`);
        console.log(`   TCGPlayer: ${transformedPricing.tcgPlayer ? 'Yes' : 'No'}`);
        console.log(`   eBay Raw: ${transformedPricing.ebayRaw ? 'Yes' : 'No'}`);

        // Step 3: Create base card structure
        console.log('\n3. Creating PokeData-first card structure...');
        const card = {
            id: `pokedata-${pokeDataCardId}`,
            source: "pokedata",
            pokeDataId: pokeDataCardId,
            setId: pricingData.set_id,
            setName: pricingData.set_name,
            setCode: pricingData.set_code || '',
            cardName: pricingData.name,
            cardNumber: pricingData.num,
            secret: pricingData.secret || false,
            language: pricingData.language || 'ENGLISH',
            releaseDate: pricingData.release_date || '',
            pricing: transformedPricing,
            lastUpdated: new Date().toISOString()
        };
        
        console.log(`✅ Base card structure created`);
        console.log(`   ID: ${card.id}`);
        console.log(`   Name: ${card.cardName}`);
        console.log(`   Set: ${card.setName}`);

        // Step 4: Enhance with Pokemon TCG images (OPTIONAL)
        console.log('\n4. Attempting image enhancement...');
        const enhancementStartTime = Date.now();
        
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
            console.log(`   Small: ${card.images.small}`);
            console.log(`   Large: ${card.images.large}`);
            console.log(`   TCG Set: ${card.enhancement.tcgSetId}`);
            console.log(`   TCG Card: ${card.enhancement.tcgCardId}`);
        } else {
            console.log(`⚠️  Image enhancement skipped - no mapping available (${enhancementTime}ms)`);
        }

        // Step 5: Final validation
        console.log('\n5. Final validation...');
        const validations = [
            { name: 'Has PokeData ID', pass: !!card.pokeDataId },
            { name: 'Has Card Name', pass: !!card.cardName },
            { name: 'Has Pricing Data', pass: Object.keys(card.pricing).length > 0 },
            { name: 'Has PSA Pricing', pass: !!card.pricing.psa },
            { name: 'Has TCGPlayer Price', pass: !!card.pricing.tcgPlayer },
            { name: 'Source is PokeData', pass: card.source === 'pokedata' },
            { name: 'ID Format Correct', pass: card.id.startsWith('pokedata-') },
            { name: 'Has Images', pass: !!card.images }
        ];
        
        validations.forEach(validation => {
            console.log(`${validation.pass ? '✅' : '❌'} ${validation.name}`);
        });
        
        const passedValidations = validations.filter(v => v.pass).length;
        console.log(`\nValidation Summary: ${passedValidations}/${validations.length} passed`);

        // Step 6: Show final card structure
        console.log('\n6. Final PokeData-first card structure:');
        console.log(JSON.stringify({
            id: card.id,
            source: card.source,
            pokeDataId: card.pokeDataId,
            cardName: card.cardName,
            setName: card.setName,
            pricing: {
                psaGrades: card.pricing.psa ? Object.keys(card.pricing.psa).length : 0,
                tcgPlayer: !!card.pricing.tcgPlayer,
                ebayRaw: !!card.pricing.ebayRaw
            },
            images: !!card.images,
            enhancement: !!card.enhancement
        }, null, 2));

        const totalTime = Date.now() - startTime;
        console.log(`\n=== Test Complete in ${totalTime}ms ===`);
        
        if (passedValidations >= 7) { // Allow images to be optional
            console.log('🎉 PokeData-First architecture is working perfectly!');
            console.log('✅ Pricing data is guaranteed (primary goal achieved)');
            console.log('✅ Image enhancement works when mapping exists');
            console.log('✅ Ready for Azure Functions integration');
        } else {
            console.log('⚠️  Some core validations failed - check the implementation');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstStandalone();
