// test-enrichment-function.js
// This script simulates the GetCardInfo function logic with detailed logging

// Mock the card object from CosmosDB
const card = {
    "id": "sv8pt5-155",
    "setCode": "PRE",
    "setId": "sv8pt5",
    "setName": "Prismatic Evolutions",
    "cardId": "sv8pt5-155",
    "cardName": "Espeon ex",
    "cardNumber": "155",
    "rarity": "Special Illustration Rare",
    "imageUrl": "https://images.pokemontcg.io/sv8pt5/155.png",
    "imageUrlHiRes": "https://images.pokemontcg.io/sv8pt5/155_hires.png",
    "tcgPlayerPrice": {
        "market": 344.29,
        "low": 325.5,
        "mid": 375.14,
        "high": 899.95
    },
    "_rid": "WAoyALIZ6AjSBAAAAAAAAA==",
    "_self": "dbs/WAoyAA==/colls/WAoyALIZ6Ag=/docs/WAoyALIZ6AjSBAAAAAAAAA==/",
    "_etag": "\"00006db6-0000-0300-0000-682dc0880000\"",
    "_attachments": "attachments/",
    "_ts": 1747828872
};

// Mock context for logging
const context = {
    log: function(message) {
        console.log(`[LOG] ${message}`);
    }
};

// Mock the pokeDataApiService
const pokeDataApiService = {
    getCardsInSetByCode: async function(setCode) {
        console.log(`[MOCK] Calling pokeDataApiService.getCardsInSetByCode with setCode: ${setCode}`);
        // Return empty array to simulate no cards found
        return [];
    },
    getCardPricingById: async function(pokeDataId) {
        console.log(`[MOCK] Calling pokeDataApiService.getCardPricingById with pokeDataId: ${pokeDataId}`);
        return null;
    },
    'mapApiPricingToEnhancedPriceData': function(data) {
        console.log(`[MOCK] Calling pokeDataApiService.mapApiPricingToEnhancedPriceData`);
        return null;
    }
};

// Mock the cosmosDbService
const cosmosDbService = {
    updateCard: async function(card) {
        console.log(`[MOCK] Calling cosmosDbService.updateCard with card:`, card);
        return true;
    }
};

// Helper function to enrich a card with its PokeData ID
async function enrichCardWithPokeDataId(cardToEnrich, ctx) {
    console.log(`[TEST] Starting enrichCardWithPokeDataId for card ${cardToEnrich.id}`);
    console.log(`[TEST] Card has pokeDataId property: ${cardToEnrich.hasOwnProperty('pokeDataId')}`);
    console.log(`[TEST] Card pokeDataId value: ${cardToEnrich.pokeDataId}`);
    
    try {
        // Get cards in the set from PokeData API
        console.log(`[TEST] Getting cards for set code: ${cardToEnrich.setCode}`);
        const pokeDataCards = await pokeDataApiService.getCardsInSetByCode(cardToEnrich.setCode);
        
        console.log(`[TEST] pokeDataCards result:`, pokeDataCards);
        
        if (pokeDataCards && pokeDataCards.length > 0) {
            // Find the matching card by card number
            // Note: Must use exact matching as card numbers in PokeData are formatted exactly (no padding)
            const matchingCard = pokeDataCards.find(pdc => pdc.num === cardToEnrich.cardNumber);
            
            // If no exact match found, try with leading zeros removed
            // This handles cases where our cardNumber might be "076" but PokeData has "76"
            if (!matchingCard) {
                const trimmedNumber = cardToEnrich.cardNumber.replace(/^0+/, '');
                console.log(`[TEST] No exact match found, trying with trimmed number: ${trimmedNumber}`);
                
                const altMatch = pokeDataCards.find(pdc => pdc.num === trimmedNumber);
                
                if (altMatch) {
                    ctx.log(`[GetCardInfo] Found card with trimmed number ${trimmedNumber} instead of ${cardToEnrich.cardNumber}`);
                    cardToEnrich.pokeDataId = altMatch.id;
                    console.log(`[TEST] Found match with trimmed number, set pokeDataId to: ${cardToEnrich.pokeDataId}`);
                    return true;
                }
            }
            
            if (matchingCard) {
                ctx.log(`[GetCardInfo] Found matching PokeData card: ${matchingCard.name} with ID: ${matchingCard.id}`);
                cardToEnrich.pokeDataId = matchingCard.id;
                console.log(`[TEST] Found exact match, set pokeDataId to: ${cardToEnrich.pokeDataId}`);
                return true;
            }
            else {
                ctx.log(`[GetCardInfo] No matching card found for number ${cardToEnrich.cardNumber} in set ${cardToEnrich.setCode}`);
                console.log(`[TEST] No matching card found`);
            }
        }
        else {
            ctx.log(`[GetCardInfo] No cards returned from PokeData API for set ${cardToEnrich.setCode}`);
            console.log(`[TEST] No cards returned from API`);
        }
    }
    catch (error) {
        ctx.log(`[GetCardInfo] Error enriching card with PokeData ID: ${error.message}`);
        console.log(`[TEST] Error in enrichCardWithPokeDataId:`, error);
    }
    
    console.log(`[TEST] Finished enrichCardWithPokeDataId, returning false`);
    return false;
}

// Helper function to check if pricing data is stale
function isPricingStale(timestamp) {
    if (!timestamp) return true;
    
    const lastUpdate = new Date(timestamp).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return (now - lastUpdate) > oneDayMs;
}

// Simulate the function logic
async function simulateGetCardInfo() {
    console.log(`[TEST] Starting simulateGetCardInfo`);
    console.log(`[TEST] Card object:`, card);
    console.log(`[TEST] Card has pokeDataId property: ${card.hasOwnProperty('pokeDataId')}`);
    console.log(`[TEST] Card pokeDataId value: ${card.pokeDataId}`);
    
    try {
        // Simulate the condition check
        console.log(`[TEST] Evaluating condition: card && !card.pokeDataId`);
        console.log(`[TEST] card is truthy: ${!!card}`);
        console.log(`[TEST] !card.pokeDataId is: ${!card.pokeDataId}`);
        console.log(`[TEST] Combined condition evaluates to: ${card && !card.pokeDataId}`);
        
        // Check if the condition would trigger
        if (card && !card.pokeDataId) {
            console.log(`[TEST] Condition is TRUE - enrichment should trigger`);
            
            // If we have the card but no pokeDataId, try to find and store it
            context.log(`[GetCardInfo] Card ${card.id} missing PokeData ID, attempting to find it`);
            
            console.log(`[TEST] Calling enrichCardWithPokeDataId`);
            const enrichResult = await enrichCardWithPokeDataId(card, context);
            console.log(`[TEST] enrichCardWithPokeDataId result: ${enrichResult}`);
            
            // Check if card now has pokeDataId
            console.log(`[TEST] After enrichment, card has pokeDataId property: ${card.hasOwnProperty('pokeDataId')}`);
            console.log(`[TEST] After enrichment, card pokeDataId value: ${card.pokeDataId}`);
            
            // If we now have a pokeDataId, we can fetch pricing
            if (card.pokeDataId) {
                console.log(`[TEST] Card has pokeDataId, fetching pricing`);
                const freshPricing = await pokeDataApiService.getCardPricingById(card.pokeDataId);
                
                if (freshPricing) {
                    card.pricing = freshPricing;
                    card.pricingLastUpdated = new Date().toISOString();
                    const enhancedPricing = pokeDataApiService['mapApiPricingToEnhancedPriceData']({ pricing: freshPricing });
                    card.enhancedPricing = enhancedPricing || undefined;
                    console.log(`[TEST] Updated card with pricing data`);
                } else {
                    console.log(`[TEST] No pricing data returned`);
                }
            } else {
                console.log(`[TEST] Card still has no pokeDataId after enrichment`);
            }
            
            // Save the updated card
            console.log(`[TEST] Saving updated card to database`);
            await cosmosDbService.updateCard(card);
            console.log(`[TEST] Card saved successfully`);
        } else {
            console.log(`[TEST] Condition is FALSE - enrichment would NOT trigger`);
        }
        
        console.log(`[TEST] Function execution completed successfully`);
    } catch (error) {
        console.error(`[TEST] Error in simulateGetCardInfo:`, error);
    }
}

// Run the simulation
console.log(`[TEST] Starting test simulation`);
simulateGetCardInfo().then(() => {
    console.log(`[TEST] Test simulation completed`);
}).catch(error => {
    console.error(`[TEST] Unhandled error in test:`, error);
});
