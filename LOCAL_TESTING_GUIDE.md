# Local Testing Guide for Enhanced GetCardInfo Function

This guide walks you through testing the modified getCardInfo function locally with full logging visibility.

## 🚀 Quick Start

### 1. Start Azure Functions Locally
```bash
cd PokeDataFunc
func start
```

Wait for the function to start. You should see output like:
```
Functions:
    getCardInfo: [GET] http://localhost:7071/api/cards/{cardId}
    ...
Host lock lease acquired by instance ID: ...
```

### 2. Run the Enhanced Test Script
In a new terminal:
```bash
cd ..  # back to root directory
node test-enhanced-getCardInfo.js
```

## 📊 What You'll See

### Function Terminal (Azure Functions)
This is where the **detailed enrichment logs** will appear:
```
[card-sv3pt5-172-1735744800000] ===== STARTING getCardInfo function =====
[card-sv3pt5-172-1735744800000] ENVIRONMENT CONFIG: {
  ENABLE_REDIS_CACHE: 'false',
  POKEDATA_API_BASE_URL: 'https://www.pokedata.io/v0...',
  HAS_POKEDATA_API_KEY: true
}
[card-sv3pt5-172-1735744800000] ENRICHMENT CONDITION EVALUATIONS:
[card-sv3pt5-172-1735744800000] - condition1 (needs PokeData ID): true
[card-sv3pt5-172-1735744800000] 🔍 ENTERING CONDITION 1: Card sv3pt5-172 missing PokeData ID
[card-sv3pt5-172-1735744800000] Calling getCardsInSetByCode for set: sv3pt5
[card-sv3pt5-172-1735744800000] ✅ Retrieved 207 cards from PokeData API for set sv3pt5
[card-sv3pt5-172-1735744800000] 🎯 FOUND MATCHING POKEDATA CARD: {id: 12345, name: "Flareon ex"}
```

### Test Script Terminal (Client)
This shows **structured test results**:
```
================================================================================
  Testing: Card needing PokeData ID (Condition 1)
================================================================================
Request URL: http://localhost:7071/api/cards/sv3pt5-172
✅ Request completed successfully in 2341ms

------------------------------------------------------------
  PokeData Integration Status
------------------------------------------------------------
✅ PokeData ID: 12345

------------------------------------------------------------
  Pricing Data Analysis  
------------------------------------------------------------
✅ Raw PokeData Pricing: Present
- Last Updated: 2025-01-01T15:30:00.000Z
- Number of price points: 23
```

## 🧪 Test Cases Explained

### Test Case 1: Condition 1 (Missing PokeData ID)
- **Card**: `sv3pt5-172` (Flareon ex from 151)
- **Expected**: Should trigger enrichment to find PokeData ID
- **Watch for**: Logs showing `ENTERING CONDITION 1` and API calls to get set cards

### Test Case 2: Condition 2 (Stale Pricing)
- **Card**: `sv8pt5-155` (Espeon ex from Prismatic Evolutions) 
- **Expected**: With `forceRefresh=true`, should refresh pricing data
- **Watch for**: Logs showing `ENTERING CONDITION 2` and pricing API calls

### Test Case 3: Different Set Mapping
- **Card**: `sv4pt5-001` (Different expansion)
- **Expected**: Tests set code mapping for different expansions
- **Watch for**: Different set codes and mapping behavior

## 🔍 Key Things to Look For

### In Function Logs (Azure Functions Terminal):

1. **Environment Configuration**
   ```
   ENVIRONMENT CONFIG: {
     HAS_POKEDATA_API_KEY: true,
     HAS_COSMOSDB_CONNECTION: true
   }
   ```

2. **Condition Evaluation**
   ```
   ENRICHMENT CONDITION EVALUATIONS:
   - condition1 (needs PokeData ID): true/false
   - condition2 (needs pricing refresh): true/false
   - condition3 (missing enhanced pricing): true/false
   ```

3. **API Call Details**
   ```
   Calling getCardsInSetByCode for set: sv3pt5
   PokeData API getCardsInSetByCode completed in 1234ms, returned 207 cards
   🎯 FOUND MATCHING POKEDATA CARD: {id: 12345, name: "Flareon ex"}
   ```

4. **Timing Information**
   ```
   EXECUTION SUMMARY: {
     totalExecutionTime: "2341ms",
     cardFound: true,
     cardUpdated: true
   }
   ```

### In Test Output (Test Script Terminal):

1. **Request Success/Failure**
2. **PokeData ID Status** (✅ found or ❌ missing)
3. **Pricing Data Analysis** (raw + enhanced)
4. **Cache Information**
5. **Performance Metrics**

## 🐛 Troubleshooting

### No Logs Appearing in Function Terminal
- ✅ **Fixed!** We replaced LogManager with context.log()
- You should now see detailed logs with correlation IDs

### Connection Refused Error
```bash
# Make sure Azure Functions is running:
cd PokeDataFunc
func start
```

### Missing API Keys Error
- Check `PokeDataFunc/local.settings.json` has valid API keys
- ✅ Your configuration looks good based on the file we checked

### TypeScript Compilation Errors
```bash
cd PokeDataFunc
npm run build
```

## 📈 Performance Expectations

With the new logging, you may see slightly slower execution times:
- **Without enrichment**: ~200-500ms
- **With PokeData ID lookup**: ~1000-2000ms (depends on set size)
- **With pricing refresh**: ~500-1000ms per pricing API call

The detailed timing logs will help identify bottlenecks.

## 🎯 Success Criteria

After running the tests, you should see:

1. **Detailed Logs**: Every step of the enrichment process logged
2. **Condition Logic**: Clear evaluation of which conditions trigger
3. **API Interactions**: Timing and results of external API calls
4. **Error Handling**: Any issues clearly logged with stack traces
5. **Performance Data**: Execution times for each operation

## 🔄 Iterative Testing

You can modify the test cases in `test-enhanced-getCardInfo.js`:
- Add different card IDs
- Test edge cases (invalid cards, API failures)
- Test with/without forceRefresh
- Test different set codes

The enhanced logging will show you exactly what's happening at each step!
