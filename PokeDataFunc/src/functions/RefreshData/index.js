"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshData = refreshData;
const index_1 = require("../../index");
/**
 * Timer-triggered function to refresh data in Cosmos DB
 * Runs on a schedule to keep the database up-to-date with the latest card data
 */
async function refreshData(myTimer) {
    const timestamp = new Date().toISOString();
    console.log(`RefreshData function executed at ${timestamp}`);
    try {
        // Refresh sets
        console.log("Refreshing sets...");
        const sets = await index_1.pokemonTcgApiService.getAllSets();
        if (sets.length > 0) {
            await index_1.cosmosDbService.saveSets(sets);
            console.log(`Successfully refreshed ${sets.length} sets`);
        }
        else {
            console.log("No sets found to refresh");
        }
        // Refresh cards for current sets only to limit API calls
        console.log("Refreshing cards for current sets...");
        const currentSets = sets.filter(set => set.isCurrent);
        console.log(`Found ${currentSets.length} current sets out of ${sets.length} total sets`);
        let totalCards = 0;
        for (const set of currentSets) {
            console.log(`Refreshing cards for set ${set.name} (${set.code})...`);
            const cards = await index_1.pokemonTcgApiService.getCardsBySet(set.code);
            if (cards.length > 0) {
                for (const card of cards) {
                    await index_1.cosmosDbService.saveCard(card);
                }
                totalCards += cards.length;
                console.log(`Refreshed ${cards.length} cards for set ${set.name}`);
            }
            else {
                console.log(`No cards found for set ${set.name}`);
            }
        }
        console.log(`Data refresh completed at ${timestamp}. Refreshed ${sets.length} sets and ${totalCards} cards.`);
    }
    catch (error) {
        console.error(`Error refreshing data: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
//# sourceMappingURL=index.js.map