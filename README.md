# Pokémon Card Price Checker (PokeData)

A full-stack web application for looking up Pokémon card pricing data by set and card name. Combines a Svelte frontend with an Azure Functions backend, backed by Cosmos DB and Azure Blob Storage.

> **Note:** This is the original version of the project. An updated enterprise version with additional features, testing, and CI/CD is maintained in [PCPC](https://github.com/Abernaughty/PCPC).

## Architecture

```
Browser (Svelte SPA)
    │
    ▼
Azure API Management (optional gateway)
    │
    ▼
Azure Functions (Node.js / TypeScript) ── PokeData API
    │                                  ── Pokémon TCG API
    ▼
Cosmos DB + Azure Blob Storage
```

## Features

- Search for cards by set name and card name
- Pricing data from multiple sources (PokeData API, Pokémon TCG API)
- Set grouping by expansion series (Scarlet & Violet, Sword & Shield, etc.)
- Card variant support (1st Edition, Shadowless, Holo, etc.)
- Intelligent caching (Redis + IndexedDB)
- Debug panel and feature flags for development

## Quick Start

```bash
git clone https://github.com/Abernaughty/PokeData.git
cd PokeData
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

**Windows users** can also use the bundled scripts:
```bat
scripts\server.bat
```

## Frontend

Built with **Svelte** and bundled with **Rollup**.

### Scripts

```bash
npm run dev      # Development server with hot reloading (port 3000)
npm run build    # Production build
npm start        # Serve production build
npm run clean    # Clean build artifacts
```

**Windows batch scripts** (`scripts/`) wrap these with additional setup and port management:
- `scripts\server.bat [dev|prod]` — start dev or production server
- `scripts\build-app.bat` — full production build
- `scripts\tools.bat [setup|diagnose|fix-path]` — utilities

### Project Structure

```
src/
├── App.svelte              # Root component
├── components/             # UI components (search, card variants, etc.)
├── services/               # API and data services
│   ├── cloudDataService.js # Azure Functions API client
│   ├── pokeDataService.js  # PokeData API integration
│   ├── hybridDataService.js
│   └── featureFlagService.js
├── data/                   # API config and set list
├── config/                 # Environment configuration
└── debug/                  # Debug panel and tools
public/
├── index.html
├── global.css
└── data/                   # Static JSON data files
```

## Backend (Azure Functions)

The backend is an **Azure Functions v4** app written in **TypeScript**, located in `PokeDataFunc/`.

### API Endpoints

| Function | Trigger | Description |
|---|---|---|
| `GetSetList` | HTTP GET | Returns all available card sets |
| `GetCardsBySet` | HTTP GET | Returns cards for a given set |
| `GetCardInfo` | HTTP GET | Returns pricing data for a specific card |
| `RefreshData` | Timer | Refreshes card/price data from upstream APIs |
| `MonitorCredits` | Timer | Monitors API credit usage |

### Backend Structure

```
PokeDataFunc/
├── src/
│   ├── functions/          # Azure Function handlers
│   ├── services/           # Business logic
│   │   ├── CosmosDbService.ts
│   │   ├── BlobStorageService.ts
│   │   ├── PokeDataApiService.ts
│   │   ├── PokemonTcgApiService.ts
│   │   ├── RedisCacheService.ts
│   │   └── ImageEnhancementService.ts
│   ├── models/             # TypeScript interfaces
│   └── utils/              # Shared utilities
├── data/                   # Bundled set mapping JSON
└── scripts/                # Data management scripts
```

### Backend Setup

```bash
cd PokeDataFunc
npm install
```

For local development, copy and configure `local.settings.json` with your Azure connection strings. See `PokeDataFunc/docs/deployment-guide.md` for full deployment instructions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Svelte, Rollup |
| Backend | Azure Functions v4, TypeScript, Node.js |
| Database | Azure Cosmos DB |
| Cache | Redis, IndexedDB |
| Storage | Azure Blob Storage |
| Gateway | Azure API Management (optional) |

## Documentation

- [Backend Deployment Guide](PokeDataFunc/docs/deployment-guide.md)
- [API Documentation](docs/api-documentation.md)
- [Azure Deployment](docs/azure-deployment.md)
- [CI/CD Guide](docs/cicd-deployment-guide.md)
- [Debugging Guide](docs/debugging-guide.md)

## License

MIT
