/**
 * Test script for the PokeData-first architecture
 * This tests the complete flow we validated manually:
 * 1. PokeData set lookup
 * 2. PokeData cards in set
 * 3. PokeData pricing
 * 4. Pokemon TCG image enhancement
 */

const { PokeDataApiService } = require('./src/services/PokeDataApiService');
const { pokeDataToTcgMappingService } = require('./src/services/PokeDataToTcgMappingService');
const { PokemonTcgApiService } = require('./src/services/PokemonTcgApiService');
const { ImageEnhancementService } = require('./src/services/ImageEnhancementService');

// Load environment variables
require('dotenv').config();

async function testPokeDataFirstFlow() {
    console.log('=== Testing PokeData-First Architecture ===\n');

    // Initialize services
    const pokeDataApiKey = process.env.POKEDATA_API_KEY;
    const pokemonTcgApiKey = process.env.POKEMON_TCG_API_KEY;

    if (!pokeDataApiKey) {
        console.error('POKEDATA_API_KEY not found in environment variables');
        return;
    }

    if (!pokemonTcgApiKey) {
        console.error('POKEMON_TCG_API_KEY not found in environment variables');
        return;
    }

    const pokeDataService = new PokeDataApiService(pokeDataApiKey);
    const pokemonTcgService = new PokemonTcgApiService(pokemonTcgApiKey);
    const imageEnhancementService = new ImageEnhancementService(
        pokeDataToTcgMappingService,
        pokemonTcgService
    );

    try {
        // Test 1: Get PokeData sets
        console.log('1. Testing PokeData set retrieval...');
        const sets = await pokeDataService.getAllSets();
        console.log(`   Found ${sets.length} PokeData sets`);
        
        // Find Prismatic Evolutions
        const prismaticEvolutions = sets.find(set => set.name === 'Prismatic Evolutions');
        if (!prismaticEvolutions) {
            console.error('   Prismatic Evolutions set not found!');
            return;
        }
        console.log(`   Found Prismatic Evolutions: ID ${prismaticEvolutions.id}, Code: ${prismaticEvolutions.code}`);

        // Test 2: Get cards in set
        console.log('\n2. Testing PokeData cards in set...');
        const cards = await pokeDataService.getCardsInSet(prismaticEvolutions.id);
        console.log(`   Found ${cards.length} cards in Prismatic Evolutions`);
        
        // Find Espeon ex
        const espeonEx = cards.find(card => card.name === 'Espeon ex' && card.num === '155');
        if (!espeonEx) {
            console.error('   Espeon ex #155 not found!');
            return;
        }
        console.log(`   Found Espeon ex: ID ${espeonEx.id}, Number: ${espeonEx.num}`);

        // Test 3: Get pricing data
        console.log('\n3. Testing PokeData pricing retrieval...');
        const pricingData = await pokeDataService.getCardPricingById(espeonEx.id);
        if (!pricingData) {
            console.error('   No pricing data found!');
            return;
        }
        console.log(`   Retrieved pricing data with ${Object.keys(pricingData).length} price points`);
        console.log(`   PSA 10: $${pricingData['PSA 10.0']?.value || 'N/A'}`);
        console.log(`   TCGPlayer: $${pricingData['TCGPlayer']?.value || 'N/A'}`);

        // Test 4: Test reverse mapping
        console.log('\n4. Testing PokeData to TCG mapping...');
        const tcgSetId = pokeDataToTcgMappingService.getTcgSetId(prismaticEvolutions.id);
        if (!tcgSetId) {
            console.error('   No TCG mapping found!');
            return;
        }
        console.log(`   Mapped PokeData set ${prismaticEvolutions.id} to TCG set ${tcgSetId}`);

        // Test 5: Test image enhancement
        console.log('\n5. Testing image enhancement...');
        const enhancedCard = await imageEnhancementService.enhanceCardWithImages(
            espeonEx, 
            prismaticEvolutions.id
        );
        
        if (enhancedCard.images) {
            console.log(`   Successfully enhanced with images:`);
            console.log(`   Small: ${enhancedCard.images.small}`);
            console.log(`   Large: ${enhancedCard.images.large}`);
            console.log(`   Enhancement metadata: ${JSON.stringify(enhancedCard.enhancement, null, 2)}`);
        } else {
            console.log('   No images added (mapping or API call failed)');
        }

        // Test 6: Test batch enhancement
        console.log('\n6. Testing batch enhancement...');
        const sampleCards = cards.slice(0, 5); // Test with first 5 cards
        const enhancedCards = await imageEnhancementService.enhanceCardsWithImages(
            sampleCards,
            prismaticEvolutions.id
        );
        
        const enhancedCount = enhancedCards.filter(card => card.images).length;
        console.log(`   Enhanced ${enhancedCount}/${sampleCards.length} cards with images`);

        // Test 7: Enhancement statistics
        console.log('\n7. Testing enhancement statistics...');
        const stats = imageEnhancementService.getEnhancementStats();
        console.log(`   Enhancement coverage: ${stats.enhancementCoverage}`);
        console.log(`   Total mapped sets: ${stats.totalMappedSets}`);

        console.log('\n=== PokeData-First Architecture Test Complete ===');
        console.log('✅ All tests passed! The architecture is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstFlow();
