import { Timer } from "@azure/functions";
import { cosmosDbService, pokeDataApiService, redisCacheService } from "../../index";

// PokeData-first card structure for refresh operations
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
    pricing: {
        psa?: { [grade: string]: number };
        cgc?: { [grade: string]: number };
        tcgPlayer?: number;
        ebayRaw?: number;
        pokeDataRaw?: number;
    };
    lastUpdated: string;
}

/**
 * PokeData-First Timer-triggered function to refresh data in Cosmos DB
 * 
 * Updated to use PokeData-first architecture for consistency with live user requests.
 * Features:
 * - Uses PokeData API as primary source for sets and cards with pricing
 * - Implements batch database operations for performance
 * - Parallel processing with concurrency limits
 * - Smart refresh strategy based on set priority
 * - Cache invalidation for updated data
 */
export async function refreshData(myTimer: Timer): Promise<void> {
  const timestamp = new Date().toISOString();
  const correlationId = `[refresh-${Date.now()}]`;
  const startTime = Date.now();
  
  console.log(`${correlationId} PokeData-first RefreshData function executed at ${timestamp}`);
  
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
    
    // Phase 2: Determine sets to refresh based on priority
    console.log(`${correlationId} Phase 2: Determining sets to refresh...`);
    const setsToRefresh = await determineRefreshPriority(pokeDataSets, correlationId);
    console.log(`${correlationId} Selected ${setsToRefresh.length} sets for card refresh based on priority`);
    
    // Phase 3: Refresh cards with parallel processing and batch operations
    console.log(`${correlationId} Phase 3: Refreshing cards with PokeData-first approach...`);
    const cardsStartTime = Date.now();
    
    let totalCards = 0;
    let totalSets = 0;
    
    // Process sets in parallel with controlled concurrency
    const CONCURRENT_SETS = 3; // Process 3 sets simultaneously
    
    for (let i = 0; i < setsToRefresh.length; i += CONCURRENT_SETS) {
      const concurrentSets = setsToRefresh.slice(i, i + CONCURRENT_SETS);
      
      const setPromises = concurrentSets.map(async (set) => {
        return await refreshSetCards(set, correlationId);
      });
      
      const setResults = await Promise.all(setPromises);
      
      // Aggregate results
      setResults.forEach(result => {
        totalCards += result.cardCount;
        totalSets += result.success ? 1 : 0;
      });
      
      // Small delay between concurrent groups to be gentle on APIs
      if (i + CONCURRENT_SETS < setsToRefresh.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const cardsTime = Date.now() - cardsStartTime;
    const totalTime = Date.now() - startTime;
    
    console.log(`${correlationId} PokeData-first refresh completed in ${totalTime}ms:`);
    console.log(`${correlationId} - Sets: ${pokeDataSets.length} refreshed in ${Date.now() - setsStartTime}ms`);
    console.log(`${correlationId} - Cards: ${totalCards} refreshed from ${totalSets} sets in ${cardsTime}ms`);
    console.log(`${correlationId} - Performance: ${(totalCards / (cardsTime / 1000)).toFixed(1)} cards/second`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`${correlationId} ERROR in PokeData-first refresh after ${totalTime}ms: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Determine which sets should be refreshed based on priority and freshness
 */
async function determineRefreshPriority(pokeDataSets: any[], correlationId: string): Promise<any[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  // Categorize sets by priority
  const highPriority = []; // Recent sets (last 6 months)
  const mediumPriority = []; // Current sets (last year)
  const lowPriority = []; // Older sets
  
  for (const set of pokeDataSets) {
    const releaseDate = new Date(set.release_date || '2000-01-01');
    
    if (releaseDate >= sixMonthsAgo) {
      highPriority.push(set);
    } else if (releaseDate >= oneYearAgo) {
      mediumPriority.push(set);
    } else {
      lowPriority.push(set);
    }
  }
  
  console.log(`${correlationId} Set priorities: High=${highPriority.length}, Medium=${mediumPriority.length}, Low=${lowPriority.length}`);
  
  // For this refresh cycle, prioritize recent sets
  // In production, this could be made configurable based on time of day, etc.
  const setsToRefresh = [
    ...highPriority, // Always refresh recent sets
    ...mediumPriority.slice(0, 10), // Refresh up to 10 medium priority sets
    ...lowPriority.slice(0, 5) // Refresh up to 5 older sets
  ];
  
  return setsToRefresh;
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
    
    // Step 2: Transform cards with pricing data (parallel processing)
    const CONCURRENT_CARDS = 10; // Process 10 cards simultaneously for pricing
    const transformedCards: PokeDataRefreshCard[] = [];
    
    for (let i = 0; i < pokeDataCards.length; i += CONCURRENT_CARDS) {
      const concurrentCards = pokeDataCards.slice(i, i + CONCURRENT_CARDS);
      
      const cardPromises = concurrentCards.map(async (pokeDataCard) => {
        try {
          // Get full card details including pricing
          const fullCardData = await pokeDataApiService.getFullCardDetailsById(pokeDataCard.id);
          
          // Transform pricing data (same logic as GetCardsBySet)
          const transformedPricing: any = {};
          
          if (fullCardData && fullCardData.pricing) {
            // Process PSA grades
            const psaGrades: { [grade: string]: number } = {};
            for (let grade = 1; grade <= 10; grade++) {
              const key = `PSA ${grade === 10 ? '10.0' : `${grade}.0`}`;
              if (fullCardData.pricing[key] && fullCardData.pricing[key].value > 0) {
                psaGrades[String(grade)] = fullCardData.pricing[key].value;
              }
            }
            if (Object.keys(psaGrades).length > 0) {
              transformedPricing.psa = psaGrades;
            }
            
            // Process CGC grades
            const cgcGrades: { [grade: string]: number } = {};
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
          }
          
          return {
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
            pricing: transformedPricing,
            lastUpdated: new Date().toISOString()
          };
        } catch (error) {
          console.warn(`${setCorrelationId} Warning: Failed to get pricing for card ${pokeDataCard.id}: ${error}`);
          // Return card with basic info and empty pricing
          return {
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
            pricing: {},
            lastUpdated: new Date().toISOString()
          };
        }
      });
      
      const batchResults = await Promise.all(cardPromises);
      transformedCards.push(...batchResults);
    }
    
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
