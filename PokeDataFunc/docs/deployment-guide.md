# PokeData Azure Functions Deployment Guide

This guide provides step-by-step instructions for deploying the PokeData Azure Functions to Azure.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed and configured
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) installed
- [Node.js](https://nodejs.org/) (v18 or later)
- Azure subscription

## Azure Resources

Before deploying the functions, you need to create the following Azure resources:

1. **Resource Group**: A container for all your Azure resources
2. **Cosmos DB Account**: For storing card and set data
3. **Blob Storage Account**: For storing card images
4. **Redis Cache** (optional): For caching API responses
5. **Function App**: For hosting the Azure Functions

## Step 1: Create Azure Resources

### Resource Group

```bash
az group create --name pokedata-rg --location centralus
```

### Cosmos DB Account

```bash
az cosmosdb create --name pokemon-card-pricing-db --resource-group pokedata-rg --kind GlobalDocumentDB --capabilities EnableServerless
```

### Create Cosmos DB Database and Containers

```bash
# Create database
az cosmosdb sql database create --account-name pokemon-card-pricing-db --resource-group pokedata-rg --name PokemonCards

# Create Cards container
az cosmosdb sql container create --account-name pokemon-card-pricing-db --resource-group pokedata-rg --database-name PokemonCards --name Cards --partition-key-path "/setId"

# Create Sets container
az cosmosdb sql container create --account-name pokemon-card-pricing-db --resource-group pokedata-rg --database-name PokemonCards --name Sets --partition-key-path "/series"
```

### Blob Storage Account

```bash
az storage account create --name pokemoncardpricingstore --resource-group pokedata-rg --location centralus --sku Standard_LRS

# Create container for card images
az storage container create --name cards --account-name pokemoncardpricingstore --auth-mode login
```

### Redis Cache (Optional)

```bash
az redis create --name pokedata-cache --resource-group pokedata-rg --location centralus --sku Basic --vm-size C0
```

### Function App

```bash
az functionapp create --name pokedata-func --resource-group pokedata-rg --storage-account pokemoncardpricingstore --consumption-plan-location centralus --runtime node --runtime-version 18 --functions-version 4
```

## Step 2: Configure Function App Settings

Set the required application settings for the Function App:

```bash
az functionapp config appsettings set --name pokedata-func --resource-group pokedata-rg --settings \
  "COSMOSDB_CONNECTION_STRING=<cosmos-db-connection-string>" \
  "BLOB_STORAGE_CONNECTION_STRING=<blob-storage-connection-string>" \
  "REDIS_CONNECTION_STRING=<redis-connection-string>" \
  "POKEMON_TCG_API_KEY=<pokemon-tcg-api-key>" \
  "POKEMON_TCG_API_BASE_URL=https://api.pokemontcg.io/v2" \
  "POKEDATA_API_KEY=<pokedata-api-key>" \
  "POKEDATA_API_BASE_URL=https://api.pokedata.io/v1" \
  "ENABLE_REDIS_CACHE=true" \
  "CACHE_TTL_SETS=604800" \
  "CACHE_TTL_CARDS=86400" \
  "CACHE_TTL_PRICING=3600" \
  "ENABLE_CDN_IMAGES=true" \
  "CDN_ENDPOINT=https://pokemoncardpricingstore.blob.core.windows.net/cards" \
  "IMAGE_SOURCE_STRATEGY=hybrid" \
  "IMPORT_BATCH_SIZE=100" \
  "IMPORT_RETRY_COUNT=3" \
  "IMPORT_RETRY_DELAY=1000"
```

## Step 3: Deploy the Functions

### Option 1: Deploy using Azure Functions Core Tools

```bash
npm run build
func azure functionapp publish pokedata-func
```

### Option 2: Deploy using GitHub Actions

1. Create a GitHub repository for your project
2. Add the following secrets to your GitHub repository:
   - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: The publish profile for your Function App (download from the Azure Portal)

3. Push your code to the repository
4. The GitHub Actions workflow will automatically deploy the functions to Azure

## Step 4: Test the Deployment

Test the deployed functions using the following endpoints:

- Get all sets: `https://pokedata-func.azurewebsites.net/api/sets`
- Get card details: `https://pokedata-func.azurewebsites.net/api/cards/{cardId}`
- Get cards by set: `https://pokedata-func.azurewebsites.net/api/sets/{setCode}/cards`

## Troubleshooting

### Common Issues

1. **Connection String Issues**: Ensure that all connection strings are correctly formatted and have the necessary permissions.
2. **CORS Issues**: If you're accessing the API from a web application, you may need to configure CORS settings in the Function App.
3. **API Key Issues**: Ensure that the API keys for the Pokémon TCG API and PokeData API are valid.

### Viewing Logs

You can view the logs for your Function App in the Azure Portal or using the Azure CLI:

```bash
az functionapp log tail --name pokedata-func --resource-group pokedata-rg
```

## Next Steps

- Set up a custom domain for your Function App
- Configure Azure API Management to manage your API
- Set up Azure CDN for delivering card images
- Configure monitoring and alerts for your Function App
