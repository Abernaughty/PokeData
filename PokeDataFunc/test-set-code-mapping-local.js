// test-set-code-mapping-local.js
// This script tests the set code mapping in PokeDataApiService without making API calls

// Import the PokeDataApiService class
const { PokeDataApiService } = require('./src/services/PokeDataApiService');

// Create an instance of the service
const pokeDataApiService = new PokeDataApiService('dummy-key');

// Test set codes
const testCodes = [
    'PRE',      // Prismatic Evolutions
    'SV8PT5',   // Prismatic Evolutions (alternative code)
    'sv8pt5',   // Prismatic Evolutions (lowercase)
    'SV8',      // Paradox Rift
    'OBF',      // Obsidian Flames
    'PAL',      // Paldea Evolved
    'SVI',      // Scarlet & Violet
    'UNKNOWN',  // Unknown set code
];

// Test the mapSetCode method
console.log('Testing set code mapping:');
testCodes.forEach(code => {
    const mappedCode = pokeDataApiService.mapSetCode(code);
    console.log(`${code} -> ${mappedCode}`);
});

// Test the extractCardIdentifiers method
const testCardIds = [
    'sv8pt5-155',  // Espeon ex from Prismatic Evolutions
    'PRE-155',     // Same card with different set code format
    'sv8-100',     // Card from Paradox Rift
    '12345',       // Invalid format
];

console.log('\nTesting card identifier extraction:');
testCardIds.forEach(cardId => {
    const identifiers = pokeDataApiService.extractCardIdentifiers(cardId);
    console.log(`${cardId} -> setCode: ${identifiers.setCode}, number: ${identifiers.number}`);
});

// Test the combined workflow
console.log('\nTesting combined workflow:');
testCardIds.forEach(cardId => {
    const identifiers = pokeDataApiService.extractCardIdentifiers(cardId);
    if (identifiers.setCode) {
        const mappedCode = pokeDataApiService.mapSetCode(identifiers.setCode);
        console.log(`${cardId} -> setCode: ${identifiers.setCode} -> mappedCode: ${mappedCode}, number: ${identifiers.number}`);
    } else {
        console.log(`${cardId} -> Invalid format, no setCode extracted`);
    }
});
