import { Timer } from "@azure/functions";
import { cosmosDbService, pokemonTcgApiService } from "../../index";

/**
 * Timer-triggered function to refresh data in Cosmos DB with smart detection
 * Runs daily and only performs expensive operations when new sets are detected
 */
export async function refreshData(myTimer: Timer): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`RefreshData function executed at ${timestamp}`);
  
  try {
    // Step 1: Smart Detection - Check if new sets exist
    console.log("Performing smart detection check...");
    
    // Get current set count from Pokemon TCG API (lightweight)
    console.log("Getting set count from Pokemon TCG API...");
    const apiSets = await pokemonTcgApiService.getAllSets();
    const apiSetCount = apiSets.length;
    console.log(`Pokemon TCG API reports ${apiSetCount} sets`);
    
    // Get current set count from database
    console.log("Getting set count from Cosmos DB...");
    const dbSets = await cosmosDbService.getAllSets();
    const dbSetCount = dbSets.length;
    console.log(`Cosmos DB contains ${dbSetCount} sets`);
    
    // Compare counts to determine if refresh is needed
    const refreshNeeded = apiSetCount !== dbSetCount;
    console.log(`Refresh needed: ${refreshNeeded} (API: ${apiSetCount}, DB: ${dbSetCount})`);
    
    if (!refreshNeeded) {
      console.log("✅ No new sets detected. Skipping expensive refresh operations.");
      console.log(`Smart detection completed at ${timestamp}. No changes required.`);
      return;
    }
    
    // Step 2: Full Refresh - New sets detected, perform full update
    console.log("🔄 New sets detected! Performing full refresh...");
    
    // Refresh sets
    console.log("Refreshing all sets...");
    if (apiSets.length > 0) {
      await cosmosDbService.saveSets(apiSets);
      console.log(`Successfully refreshed ${apiSets.length} sets`);
    } else {
      console.log("No sets found to refresh");
    }
    
    // Refresh cards for current sets only to limit API calls
    console.log("Refreshing cards for current sets...");
    const currentSets = apiSets.filter(set => set.isCurrent);
    console.log(`Found ${currentSets.length} current sets out of ${apiSets.length} total sets`);
    
    let totalCards = 0;
    for (const set of currentSets) {
      console.log(`Refreshing cards for set ${set.name} (${set.code})...`);
      const cards = await pokemonTcgApiService.getCardsBySet(set.code);
      
      if (cards.length > 0) {
        for (const card of cards) {
          await cosmosDbService.saveCard(card);
        }
        totalCards += cards.length;
        console.log(`Refreshed ${cards.length} cards for set ${set.name}`);
      } else {
        console.log(`No cards found for set ${set.name}`);
      }
    }
    
    console.log(`✅ Full refresh completed at ${timestamp}. Refreshed ${apiSets.length} sets and ${totalCards} cards.`);
    
  } catch (error) {
    console.error(`❌ Error during refresh: ${error instanceof Error ? error.message : String(error)}`);
    
    // Log additional error details for debugging
    if (error instanceof Error && error.stack) {
      console.error(`Error stack: ${error.stack}`);
    }
    
    throw error;
  }
}
