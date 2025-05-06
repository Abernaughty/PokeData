# PokeData Azure Functions

This project contains Azure Functions for the PokeData application, providing API endpoints for retrieving Pokémon card data and pricing information.

## Features

- **GetSetList**: Retrieves a list of all Pokémon card sets
- **GetCardInfo**: Retrieves detailed information about a specific card
- **GetCardsBySet**: Retrieves all cards in a specific set
- **RefreshData**: Timer-triggered function that refreshes data in Cosmos DB every 12 hours

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (for deployment)
- Azure subscription with:
  - Cosmos DB account
  - Blob Storage account
  - Azure Functions app

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Abernaughty/PokeData.git
   cd PokeData/PokeDataFunc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure local settings**:
   - Copy `local.settings.sample.json` to `local.settings.json`
   - Update the connection strings and API keys in `local.settings.json`

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=your-storage-account;AccountKey=your-key;EndpointSuffix=core.windows.net",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       
       "COSMOSDB_CONNECTION_STRING": "AccountEndpoint=https://pokemon-card-pricing-db.documents.azure.com:443/;AccountKey=your-key;",
       "REDIS_CONNECTION_STRING": "",
       "BLOB_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=your-storage-account;AccountKey=your-key;EndpointSuffix=core.windows.net",
       
       "POKEMON_TCG_API_KEY": "your-pokemon-tcg-api-key",
       "POKEMON_TCG_API_BASE_URL": "https://api.pokemontcg.io/v2",
       "POKEDATA_API_KEY": "",
       "POKEDATA_API_BASE_URL": "",
       
       "ENABLE_REDIS_CACHE": "false",
       "CACHE_TTL_SETS": "604800",
       "CACHE_TTL_CARDS": "86400",
       "CACHE_TTL_PRICING": "3600",
       
       "ENABLE_CDN_IMAGES": "true",
       "CDN_ENDPOINT": "https://your-storage-account.blob.core.windows.net/cards",
       "IMAGE_SOURCE_STRATEGY": "hybrid",
       
       "IMPORT_BATCH_SIZE": "100",
       "IMPORT_RETRY_COUNT": "3",
       "IMPORT_RETRY_DELAY": "1000"
     },
     "Host": {
       "CORS": "*",
       "CORSCredentials": false
     }
   }
   ```

## Running Locally

1. **Start the functions**:
   ```bash
   npm start
   ```

2. **Test the functions**:
   - GetSetList: http://localhost:7071/api/sets
   - GetCardInfo: http://localhost:7071/api/cards/{cardId}
   - GetCardsBySet: http://localhost:7071/api/sets/{setCode}/cards

## Data Import

To populate the Cosmos DB with data from the Pokémon TCG API, use the provided import script:

```bash
# Run the import script
import-data.bat
```

This script will:
1. Import all sets from the Pokémon TCG API
2. Import cards for current sets (to limit the initial import size)
3. Save all data to Cosmos DB

The import script uses a direct connection to Cosmos DB for maximum reliability. It includes:
- Retry logic with exponential backoff for API calls
- Batch processing for better performance
- Detailed logging for troubleshooting
- Proper error handling

If you encounter any issues with the import process, you can also run the test scripts:
```bash
# Test the Cosmos DB connection
npm run test:cosmos

# Test the direct Cosmos DB access
node test-direct-cosmos.js
```

## Building and Deploying

To build and deploy the functions to Azure:

```bash
# Build and deploy
build-and-deploy.bat
```

This script will:
1. Build the TypeScript code
2. Copy function.json files to the output directories
3. Optionally deploy to Azure if you choose to do so

## Deployment to Azure

For detailed deployment instructions, see [deployment-guide.md](./docs/deployment-guide.md).

## Project Structure

```
PokeDataFunc/
├── src/                   # Source code
│   ├── functions/         # Function implementations
│   │   ├── GetCardInfo/
│   │   ├── GetCardsBySet/
│   │   ├── GetSetList/
│   │   └── RefreshData/   # Timer-triggered function
│   ├── models/            # Data models
│   ├── services/          # Service implementations
│   └── utils/             # Utility functions
├── GetCardInfo/           # Output directory for GetCardInfo function
├── GetCardsBySet/         # Output directory for GetCardsBySet function
├── GetSetList/            # Output directory for GetSetList function
├── RefreshData/           # Output directory for RefreshData function
├── docs/                  # Documentation
├── import-data.ts         # Data import script
├── import-data.bat        # Batch file to run the import script
├── build-and-deploy.bat   # Batch file to build and deploy
├── copy-function-json.js  # Script to copy function.json files
├── local.settings.json    # Local settings (not in source control)
├── local.settings.sample.json # Sample local settings
├── package.json           # NPM package configuration
└── tsconfig.json          # TypeScript configuration
```

## Cosmos DB Structure

The Cosmos DB database contains the following containers:

1. **Cards**: Contains card data with partition key `/setId`
   ```json
   {
     "id": "sv8pt5-161",
     "setCode": "PRE",
     "setId": "sv8pt5",
     "setName": "Prismatic Evolutions",
     "cardId": "sv8pt5-161",
     "cardName": "Umbreon ex",
     "cardNumber": "161",
     "rarity": "Secret Rare",
     "imageUrl": "https://images.pokemontcg.io/sv8pt5/161.png",
     "imageUrlHiRes": "https://images.pokemontcg.io/sv8pt5/161_hires.png",
     "tcgPlayerPrice": {
       "market": 1414.77,
       "low": 1200.00,
       "mid": 1400.00,
       "high": 1800.00
     }
   }
   ```

2. **Sets**: Contains set data with partition key `/series`
   ```json
   {
     "id": "sv8pt5",
     "code": "PRE",
     "name": "Prismatic Evolutions",
     "series": "Scarlet & Violet",
     "releaseDate": "2025-02-14",
     "cardCount": 183,
     "isCurrent": true
   }
   ```

## Scheduled Data Refresh

The `RefreshData` function runs every 12 hours to keep the data in Cosmos DB up-to-date. It:

1. Refreshes all sets from the Pokémon TCG API
2. Refreshes cards for current sets (to limit API calls)
3. Updates the data in Cosmos DB

## Troubleshooting

### Common Issues

1. **Connection String Issues**: Ensure that all connection strings are correctly formatted and have the necessary permissions.

2. **CORS Issues**: If you're accessing the API from a web application, you may need to configure CORS settings in the Function App.

3. **API Key Issues**: Ensure that the API keys for the Pokémon TCG API are valid.

### Viewing Logs

You can view the logs for your Function App in the Azure Portal or using the Azure CLI:

```bash
az functionapp log tail --name pokedata-func --resource-group pokedata-rg
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
