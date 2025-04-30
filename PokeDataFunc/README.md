# PokeData Azure Functions API

This project contains Azure Functions that provide a backend API for the PokeData application. The API provides endpoints for retrieving Pokémon TCG card data, set information, and pricing data.

## Features

- Get list of all Pokémon TCG sets
- Get detailed information for a specific card
- Get all cards for a specific set
- Caching with Redis
- Image processing with Azure Blob Storage
- Integration with external APIs (Pokémon TCG API and PokeData API)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (for deployment)
- [Visual Studio Code](https://code.visualstudio.com/) with the [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) (recommended)

## Project Structure

```
PokeDataFunc/
├── src/
│   ├── functions/           # Azure Functions
│   │   ├── GetSetList/      # Get all sets
│   │   ├── GetCardInfo/     # Get card details
│   │   └── GetCardsBySet/   # Get cards by set
│   ├── models/              # Data models
│   ├── services/            # Service implementations
│   └── utils/               # Utility functions
├── local.settings.json      # Local settings (not in source control)
├── local.settings.sample.json # Sample settings file
├── host.json                # Host configuration
└── tsconfig.json            # TypeScript configuration
```

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `local.settings.json` file based on the sample:

```bash
cp local.settings.sample.json local.settings.json
```

4. Update the `local.settings.json` file with your own values:
   - Cosmos DB connection string
   - Redis connection string
   - Blob Storage connection string
   - API keys for Pokémon TCG API and PokeData API
   - Other configuration values

## Running Locally

To run the functions locally:

```bash
npm start
```

This will start the Azure Functions runtime and host your functions locally. You can access the API at `http://localhost:7071/api/`.

## Available Endpoints

- `GET /api/sets` - Get all sets
  - Query parameters:
    - `groupByExpansion` (boolean) - Group sets by expansion series
    - `forceRefresh` (boolean) - Force refresh from source instead of using cache

- `GET /api/cards/{cardId}` - Get card details
  - Path parameters:
    - `cardId` (string) - The card ID (e.g., "sv8pt5-161")
  - Query parameters:
    - `forceRefresh` (boolean) - Force refresh from source instead of using cache

- `GET /api/sets/{setCode}/cards` - Get cards by set
  - Path parameters:
    - `setCode` (string) - The set code (e.g., "PRE")
  - Query parameters:
    - `page` (number) - Page number (default: 1)
    - `pageSize` (number) - Page size (default: 100, max: 500)
    - `forceRefresh` (boolean) - Force refresh from source instead of using cache

## Building for Production

To build the project for production:

```bash
npm run build
```

This will compile the TypeScript code to JavaScript in the `dist` directory.

## Deployment

### Deploy to Azure Functions

You can deploy the functions to Azure using the Azure Functions extension for VS Code or the Azure CLI:

```bash
func azure functionapp publish <function-app-name>
```

### Infrastructure Requirements

- Azure Cosmos DB (for data storage)
- Azure Redis Cache (for caching)
- Azure Blob Storage (for image storage)
- Azure CDN (optional, for image delivery)

## Environment Variables

See `local.settings.sample.json` for a list of required environment variables.

## License

This project is licensed under the ISC License.
