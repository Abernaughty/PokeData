import { Timer } from "@azure/functions";
import { cosmosDbService, pokeDataApiService, redisCacheService } from "../../index";

// Lightweight card structure for metadata refresh operations
interface PokeDataRefreshCard {
    id: string;
    source: "pokedata";
    pokeDataId: number;
    setId: number;
    setName: string;
    setCode: string;
    cardName: string;
    cardNumber: string;
    secret: boolean;
    language: string;
    releaseDate: string;
    lastUpdated: string;
}

/**
 * Lightweight Metadata Refresh Function
 * 
 * Daily timer-triggered function to refresh set and card metadata in Cosmos DB.
 * This function does NOT fetch pricing data - pricing is fetched on-demand by user-facing functions.
 * 
 * Features:
 * - Smart incremental refresh: only processes new sets (5 credits if no new sets)
 * - Runs daily at midnight for fresh metadata (24-hour max delay)
 * - Implements batch database operations for performance
 * - Cache invalidation for updated metadata
 * - Cost-optimized: ~35 credits/week vs 2,800+ with old approach
 */
export async function refreshData(myTimer: Timer): Promise<void> {
  const timestamp = new Date().toISOString();
  const correlationId = `[refresh-${Date.now()}]`;
  const startTime = Date.now();
  
  console.log(`${correlationId} Lightweight metadata RefreshData function executed at ${timestamp}`);
  
  try {
    // Phase 1: Refresh PokeData sets
    console.log(`${correlationId} Phase 1: Refreshing PokeData sets...`);
    const setsStartTime = Date.now();
    
    const pokeDataSets = await pokeDataApiService.getAllSets();
    if (pokeDataSets.length > 0) {
      // Transform PokeData sets to our Set model format
      const transformedSets = pokeDataSets.map(pokeDataSet => ({
        id: String(pokeDataSet.id), // Convert number to string for Set model
        name: pokeDataSet.name,
        code: pokeDataSet.code || `pokedata-${pokeDataSet.id}`,
        series: 'PokeData', // PokeData API doesn't have series field, use default
        cardCount: 0, // PokeData API doesn't provide card count in sets endpoint
        releaseDate: pokeDataSet.release_date || '',
        isCurrent: isCurrentSet(pokeDataSet),
        lastUpdated: timestamp
      }));
      
      await cosmosDbService.saveSets(transformedSets);
      const setsTime = Date.now() - setsStartTime;
      console.log(`${correlationId} Successfully refreshed ${transformedSets.length} PokeData sets in ${setsTime}ms`);
      
      // Invalidate sets cache
      if (process.env.ENABLE_REDIS_CACHE === "true") {
        await redisCacheService.delete('sets:pokedata:all');
        await redisCacheService.delete('sets:pokedata:current');
        console.log(`${correlationId} Invalidated sets cache`);
      }
    } else {
      console.log(`${correlationId} No PokeData sets found to refresh`);
      return;
    }
    
    // Phase 2: Smart incremental refresh - only refresh new sets
    console.log(`${correlationId} Phase 2: Checking for new sets...`);
    const incrementalResult = await performIncrementalRefresh(pokeDataSets, correlationId);
    
    if (incrementalResult.skipped) {
      console.log(`${correlationId} No new sets detected, refresh completed (${incrementalResult.cost} credits)`);
      const totalTime = Date.now() - startTime;
      console.log(`${correlationId} Metadata refresh completed in ${totalTime}ms:`);
      console.log(`${correlationId} - Sets: ${pokeDataSets.length} checked, 0 new sets found`);
      console.log(`${correlationId} - Cost: ${incrementalResult.cost} credits (smart refresh saved ~${30 - incrementalResult.cost} credits)`);
      return;
    }
    
    const { totalCards = 0, totalSets = 0 } = incrementalResult;
    
    const totalTime = Date.now() - startTime;
    
    console.log(`${correlationId} Metadata refresh completed in ${totalTime}ms:`);
    console.log(`${correlationId} - Sets: ${pokeDataSets.length} refreshed in ${Date.now() - setsStartTime}ms`);
    console.log(`${correlationId} - Card metadata: ${totalCards} refreshed from ${totalSets} new sets`);
    console.log(`${correlationId} - Cost: ${incrementalResult.cost} credits (smart incremental refresh)`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`${correlationId} ERROR in PokeData-first refresh after ${totalTime}ms: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Smart incremental refresh - only refresh new sets
 */
async function performIncrementalRefresh(pokeDataSets: any[], correlationId: string): Promise<{
  skipped: boolean;
  cost: number;
  totalCards?: number;
  totalSets?: number;
}> {
  const cardsStartTime = Date.now();
  
  try {
    // Get existing sets from database
    console.log(`${correlationId} Getting existing sets from database...`);
    const dbSets = await cosmosDbService.getAllSets();
    
    // Enhanced set comparison by ID (not just count)
    const apiSetIds = new Set(pokeDataSets.map(s => String(s.id)));
    const dbSetIds = new Set(dbSets.map(s => s.id));
    
    // Find new sets that exist in API but not in database
    const newSets = pokeDataSets.filter(s => !dbSetIds.has(String(s.id)));
    
    console.log(`${correlationId} Set comparison: API has ${pokeDataSets.length} sets, DB has ${dbSets.length} sets`);
    console.log(`${correlationId} Found ${newSets.length} new sets to refresh`);
    
    // Early exit if no new sets
    if (newSets.length === 0) {
      return {
        skipped: true,
        cost: 5 // Only cost was getAllSets() API call
      };
    }
    
    // Log new sets found
    newSets.forEach(set => {
      console.log(`${correlationId} New set detected: ${set.name} (ID: ${set.id})`);
    });
    
    // Refresh only new sets
    let totalCards = 0;
    let totalSets = 0;
    
    // Process new sets with controlled concurrency
    const CONCURRENT_SETS = 3;
    
    for (let i = 0; i < newSets.length; i += CONCURRENT_SETS) {
      const concurrentSets = newSets.slice(i, i + CONCURRENT_SETS);
      
      const setPromises = concurrentSets.map(async (set) => {
        return await refreshSetCards(set, correlationId);
      });
      
      const setResults = await Promise.all(setPromises);
      
      // Aggregate results
      setResults.forEach(result => {
        totalCards += result.cardCount;
        totalSets += result.success ? 1 : 0;
      });
      
      // Small delay between concurrent groups
      if (i + CONCURRENT_SETS < newSets.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const cardsTime = Date.now() - cardsStartTime;
    const cost = 5 + newSets.length; // getAllSets + getCardsInSet per new set
    
    console.log(`${correlationId} Incremental refresh completed: ${totalCards} cards from ${totalSets} new sets in ${cardsTime}ms`);
    console.log(`${correlationId} Cost: ${cost} credits (saved ~${Math.max(0, 30 - cost)} credits vs full refresh)`);
    
    return {
      skipped: false,
      cost,
      totalCards,
      totalSets
    };
    
  } catch (error) {
    console.error(`${correlationId} ERROR in incremental refresh, falling back to no refresh: ${error}`);
    // Return skipped to avoid cascading failures
    return {
      skipped: true,
      cost: 5 // At least we got the sets list
    };
  }
}

/**
 * Refresh cards for a specific set using PokeData-first approach
 */
async function refreshSetCards(set: any, correlationId: string): Promise<{ success: boolean; cardCount: number; setId: number }> {
  const setStartTime = Date.now();
  const setCorrelationId = `${correlationId}-set-${set.id}`;
  
  try {
    console.log(`${setCorrelationId} Refreshing cards for set: ${set.name} (ID: ${set.id})`);
    
    // Step 1: Get all cards from PokeData for this set
    const pokeDataCards = await pokeDataApiService.getCardsInSet(set.id);
    
    if (!pokeDataCards || pokeDataCards.length === 0) {
      console.log(`${setCorrelationId} No cards found in PokeData for set ${set.name}`);
      return { success: true, cardCount: 0, setId: set.id };
    }
    
    console.log(`${setCorrelationId} Found ${pokeDataCards.length} cards in PokeData`);
    
    // Step 2: Transform cards with basic metadata only (NO PRICING)
    const transformedCards: PokeDataRefreshCard[] = pokeDataCards.map(pokeDataCard => ({
      id: String(pokeDataCard.id),
      source: "pokedata" as const,
      pokeDataId: pokeDataCard.id,
      setId: pokeDataCard.set_id,
      setName: pokeDataCard.set_name,
      setCode: pokeDataCard.set_code || '',
      cardName: pokeDataCard.name,
      cardNumber: pokeDataCard.num,
      secret: pokeDataCard.secret || false,
      language: pokeDataCard.language || 'ENGLISH',
      releaseDate: pokeDataCard.release_date || '',
      lastUpdated: new Date().toISOString()
    }));
    
    // Step 3: Batch save to Cosmos DB
    const saveStartTime = Date.now();
    await cosmosDbService.saveCards(transformedCards as any[]); // Type assertion for compatibility
    const saveTime = Date.now() - saveStartTime;
    
    // Step 4: Invalidate cache for this set
    if (process.env.ENABLE_REDIS_CACHE === "true") {
      const cacheKey = `cards:set:pokedata-${set.id}`;
      await redisCacheService.delete(cacheKey);
    }
    
    const setTime = Date.now() - setStartTime;
    console.log(`${setCorrelationId} Completed: ${transformedCards.length} cards refreshed in ${setTime}ms (save: ${saveTime}ms)`);
    
    return { success: true, cardCount: transformedCards.length, setId: set.id };
    
  } catch (error) {
    const setTime = Date.now() - setStartTime;
    console.error(`${setCorrelationId} ERROR refreshing set after ${setTime}ms: ${error}`);
    return { success: false, cardCount: 0, setId: set.id };
  }
}

/**
 * Determine if a PokeData set should be considered "current"
 */
function isCurrentSet(pokeDataSet: any): boolean {
  if (!pokeDataSet.release_date) return false;
  
  const releaseDate = new Date(pokeDataSet.release_date);
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
  
  return releaseDate >= twoYearsAgo;
}
