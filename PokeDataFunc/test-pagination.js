// Test script for pagination in PokemonTcgApiService
// Run with: node test-pagination.js

// Load environment variables from .env file if available
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: '../.env' });

// Require the compiled JS version of the service
const { PokemonTcgApiService } = require('./src/services/PokemonTcgApiService');

// Set up testing parameters
const setToTest = 'PRE'; // Prismatic Evolutions or use another large set
const apiKey = process.env.POKEMON_TCG_API_KEY || '';

if (!apiKey) {
    console.error('Error: No API key provided. Please set POKEMON_TCG_API_KEY in your environment variables.');
    process.exit(1);
}

// Create service instance
const apiService = new PokemonTcgApiService(apiKey);

// Test function to get cards with pagination and verify the count
async function testPagination() {
    console.log(`\n=== Testing pagination for set ${setToTest} ===\n`);
    
    try {
        console.time('Total time');
        console.log('Fetching all cards...');
        
        // Get cards with pagination
        const cards = await apiService.getCardsBySet(setToTest);
        
        console.log('\n=== Results ===');
        console.log(`Total cards retrieved: ${cards.length}`);
        
        // Log first few cards
        if (cards.length > 0) {
            console.log('\nSample of retrieved cards:');
            cards.slice(0, 3).forEach(card => {
                console.log(`- ${card.cardName} (${card.id}) - ${card.rarity}`);
            });
        }
        
        // Log last few cards to verify we got all pages
        if (cards.length > 3) {
            console.log('\nLast few cards (to verify pagination):');
            cards.slice(-3).forEach(card => {
                console.log(`- ${card.cardName} (${card.id}) - ${card.rarity}`);
            });
        }
        
        // Verify we got all cards
        console.log('\nCard count verification:');
        const cardNumberList = cards.map(card => parseInt(card.cardNumber, 10)).filter(n => !isNaN(n));
        const uniqueCardNumbers = new Set(cardNumberList);
        
        console.log(`Unique card numbers found: ${uniqueCardNumbers.size}`);
        console.log(`Highest card number found: ${Math.max(...cardNumberList)}`);
        console.timeEnd('Total time');
        
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run the test
testPagination().catch(err => {
    console.error('Unhandled error:', err);
});
