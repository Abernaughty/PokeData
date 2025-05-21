# PokeData API Integration

## Overview

The PokeData API provides enhanced pricing data for Pokémon cards, including PSA and CGC graded card values, as well as eBay Raw prices. This integration allows our application to display more comprehensive pricing information than is available from the Pokémon TCG API alone.

## API Details

- **Base URL**: `https://www.pokedata.io/v0`
- **Authentication**: Bearer token via API key
- **Key Endpoint**: `/pricing` - Gets enhanced pricing data for a card
  - **Required Parameters**:
    - `id`: Card number (without set code prefix)
    - `asset_type`: Always "CARD" for our use case

## Integration Components

The integration involves multiple components working together:

1. **Backend (Azure Functions)**:
   - `PokeDataApiService.ts`: Service class for making API calls to PokeData
   - `GetCardInfo/index.ts`: Azure Function that calls PokeDataApiService and returns combined data

2. **Frontend**:
   - `cloudDataService.js`: Service for communicating with our Azure Functions
   - `hybridDataService.js`: Service that decides whether to use cloud or local API
   - `featureFlagService.js`: Service that manages feature flags, including "useCloudApi"

## Testing

The integration can be tested in several ways:

1. **Direct API Test**:
   - Run `node PokeDataFunc/test-pokedata-api.js` to test direct API connectivity
   - This bypasses the frontend and tests only the PokeDataApiService

2. **End-to-End Test**:
   - Run the code from `test-enhanced-pricing.js` in browser console
   - This enables the "useCloudApi" feature flag and tests the entire integration flow

3. **Cache-Busting Test**:
   - Use the new debug helper: `window.pokeDataDebug.testCard('sv8pt5-161', true)`
   - The second parameter `true` forces a fresh API call bypassing CosmosDB and Redis caches
   - This is useful when testing changes to the PokeData API integration or when cached data is stale

## Troubleshooting

Common issues include:

1. **No Enhanced Pricing Data Shown**:
   - Check if "useCloudApi" feature flag is enabled (via browser's debug panel)
   - Verify that the Azure Function can connect to the PokeData API (check logs)
   - Confirm the card ID is being correctly converted to the number-only format

2. **Azure Function Returns 500 Error**:
   - Check Azure Function logs for detailed error information
   - Verify the POKEDATA_API_KEY and POKEDATA_API_BASE_URL environment variables
   - Look for specific errors from the PokeData API service

3. **Specific Card Data Missing**:
   - Not all cards have graded pricing data available
   - Check if the card has a valid number that can be extracted correctly

## Implementation Notes

For the API to work correctly:

1. The card ID needs to be converted to just the number portion:
   - Example: From `sv8pt5-161` to `161`
   - This is handled by the `extractCardNumber` method in PokeDataApiService

2. The pricing data is returned in a specific format and needs to be mapped:
   - PSA grades are stored as `PSA 9.0` and mapped to `psaGrades.9`
   - CGC grades are stored as `CGC 9.5` and mapped to `cgcGrades.9_5` (note underscore)
   - Raw prices are stored as `eBay Raw` and mapped to `ebayRaw`

3. The feature flag "useCloudApi" must be enabled for the frontend to use the cloud API:
   - This can be enabled via the debug panel
   - Or by directly setting localStorage: `localStorage.setItem('feature_useCloudApi', 'true')`

4. The feature flag system uses a hybrid approach:
   - When OFF: Uses local pokeDataService.js (no enhanced pricing)
   - When ON: Uses cloudDataService.js (includes enhanced pricing)
