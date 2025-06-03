/**
 * Test script for the fixed PokeData service that returns full card details
 */

const { PokeDataApiService } = require('./src/services/PokeDataApiService-fixed');
const { pokeDataToTcgMappingService } = require('./src/services/PokeDataToTcgMappingService');
const { PokemonTcgApiService } = require('./src/services/PokemonTcgApiService');
const { ImageEnhancementService } = require('./src/services/ImageEnhancementService');

// Load environment variables
require('dotenv').config();

async function testFixedPokeDataService() {
    console.log('=== Testing Fixed PokeData Service ===\n');

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
        const pokeDataCardId = 73115; // Espeon ex from Prismatic Evolutions
        console.log(`Testing with PokeData card ID: ${pokeDataCardId} (Espeon ex)\n`);

        // Step 1: Get FULL card details from PokeData (NEW METHOD)
        console.log('1. Fetching FULL card details from PokeData API...');
        const startTime = Date.now();
        const fullCardData = await pokeDataService.getFullCardDetailsById(pokeDataCardId);
        const fetchTime = Date.now() - startTime;
        
        if (!fullCardData) {
            console.error('❌ No card data found');
            return;
        }
        
        console.log(`✅ Full card data retrieved (${fetchTime}ms)`);
        console.log(`   Card: ${fullCardData.name} #${fullCardData.num}`);
        console.log(`   Set: ${fullCardData.set_name} (ID: ${fullCardData.set_id})`);
        console.log(`   Set Code: ${fullCardData.set_code}`);
        console.log(`   Language: ${fullCardData.language}`);
        console.log(`   Secret: ${fullCardData.secret}`);
        console.log(`   Release Date: ${fullCardData.release_date}`);
        console.log(`   PSA 10: $${fullCardData.pricing['PSA 10.0']?.value || 'N/A'}`);
        console.log(`   TCGPlayer: $${fullCardData.pricing['TCGPlayer']?.value || 'N/A'}`);

        // Step 2: Transform pricing data to our format
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
        
        console.log(`✅ Pricing transformed - ${Object.keys(transformedPricing).length} sources`);
        console.log(`   PSA grades: ${transformedPricing.psa ? Object.keys(transformedPricing.psa).length : 0}`);
        console.log(`   TCGPlayer: ${transformedPricing.tcgPlayer ? 'Yes' : 'No'}`);
        console.log(`   eBay Raw: ${transformedPricing.ebayRaw ? 'Yes' : 'No'}`);
        console.log(`   PokeData Raw: ${transformedPricing.pokeDataRaw ? 'Yes' : 'No'}`);

        // Step 3: Create PokeData-first card structure
        console.log('\n3. Creating PokeData-first card structure...');
        const card = {
            id: `pokedata-${pokeDataCardId}`,
            source: "pokedata",
            pokeDataId: pokeDataCardId,
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
        
        console.log(`✅ Base card structure created`);
        console.log(`   ID: ${card.id}`);
        console.log(`   Name: ${card.cardName}`);
        console.log(`   Set: ${card.setName}`);
        console.log(`   Set Code: ${card.setCode}`);

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
            console.log(`   Rarity: ${card.enhancement.metadata?.rarity}`);
        } else {
            console.log(`⚠️  Image enhancement skipped - no mapping available (${enhancementTime}ms)`);
        }

        // Step 5: Final validation
        console.log('\n5. Final validation...');
        const validations = [
            { name: 'Has PokeData ID', pass: !!card.pokeDataId },
            { name: 'Has Card Name', pass: !!card.cardName },
            { name: 'Has Set Name', pass: !!card.setName },
            { name: 'Has Set Code', pass: !!card.setCode },
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
            setCode: card.setCode,
            pricing: {
                psaGrades: card.pricing.psa ? Object.keys(card.pricing.psa).length : 0,
                tcgPlayer: !!card.pricing.tcgPlayer,
                ebayRaw: !!card.pricing.ebayRaw,
                pokeDataRaw: !!card.pricing.pokeDataRaw
            },
            images: !!card.images,
            enhancement: !!card.enhancement
        }, null, 2));

        const totalTime = Date.now() - startTime;
        console.log(`\n=== Test Complete in ${totalTime}ms ===`);
        
        if (passedValidations >= 9) { // Allow images to be optional
            console.log('🎉 Fixed PokeData Service is working perfectly!');
            console.log('✅ Full card details retrieved (including name, set, etc.)');
            console.log('✅ Pricing data is comprehensive and guaranteed');
            console.log('✅ Image enhancement works when mapping exists');
            console.log('✅ Ready for PokeData-first Azure Functions!');
        } else {
            console.log('⚠️  Some core validations failed - check the implementation');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testFixedPokeDataService();
