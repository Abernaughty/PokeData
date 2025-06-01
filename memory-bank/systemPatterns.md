# System Patterns

## Overview
This document outlines the system architecture, key technical decisions, design patterns, component relationships, and critical implementation paths for the PokeData project.

## System Architecture

### Current Client-Side Architecture
The current PokeData application follows a client-side architecture with a focus on offline capabilities and efficient data retrieval:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     Svelte App                          │
│                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │             │     │             │     │           │  │
│  │  Components │◀───▶│   Services  │◀───▶│ External  │  │
│  │             │     │             │     │   APIs    │  │
│  └─────────────┘     └─────────────┘     └───────────┘  │
│         │                   │                  │        │
│         ▼                   ▼                  ▼        │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │             │     │             │     │           │  │
│  │    UI       │     │   Storage   │     │ CORS      │  │
│  │  Rendering  │     │  (IndexedDB)│     │  Proxy    │  │
│  │             │     │             │     │           │  │
│  └─────────────┘     └─────────────┘     └───────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Current Cloud-Based Architecture (Default)
The application now uses a cloud-first architecture with Azure services as the default behavior:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                               Azure Cloud                                   │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐   │
│  │             │     │             │     │           │     │           │   │
│  │  Cosmos DB  │◀───▶│   Azure     │◀───▶│  Azure    │◀───▶│  Azure    │   │
│  │  (Card Data)│     │  Functions  │     │  Cache    │     │   CDN     │   │
│  │             │     │             │     │ (Redis)   │     │           │   │
│  └─────────────┘     └─────────────┘     └───────────┘     └───────────┘   │
│                             │                                    │          │
│                             │                                    │          │
│                      ┌─────────────┐                      ┌─────────────┐   │
│                      │             │                      │             │   │
│                      │    API      │                      │    Blob     │   │
│                      │ Management  │                      │  Storage    │   │
│                      │             │                      │ (Card Images)│   │
│                      └─────────────┘                      └─────────────┘   │
│                             │                                    │          │
└─────────────────────────────│────────────────────────────────────│──────────┘
                              │                                    │
                              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                               Client                                        │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐   │
│  │             │     │             │     │           │     │           │   │
│  │  Svelte     │◀───▶│   API       │◀───▶│  State    │◀───▶│  UI       │   │
│  │  Components │     │   Client    │     │ Management│     │ Rendering │   │
│  │             │     │             │     │           │     │           │   │
│  └─────────────┘     └─────────────┘     └───────────┘     └───────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Repository Structure
The PokeData project is maintained in a standalone Git repository at `C:\Users\maber\Documents\GitHub\PokeData` with the following structure:

```
PokeData/
├── docs/                  # Documentation files
│   ├── azure-deployment.md
│   ├── debugging-guide.md
│   └── quick-debug-guide.md
├── memory-bank/           # Project memory documentation
│   ├── activeContext.md
│   ├── productContext.md
│   ├── progress.md
│   ├── projectbrief.md
│   ├── systemPatterns.md
│   └── techContext.md
├── public/                # Static assets and build output
│   ├── build/             # Compiled JS/CSS
│   ├── data/              # Static data files
│   ├── images/            # Image assets
│   ├── mock/              # Mock data for testing
│   ├── debug-api.js       # Debugging utilities
│   ├── global.css         # Global styles
│   ├── index.html         # Main HTML file
│   └── staticwebapp.config.json  # Azure config
├── src/                   # Source code
│   ├── components/        # UI components
│   ├── data/              # Data utilities
│   ├── services/          # Business logic services
│   ├── App.svelte         # Main application component
│   ├── corsProxy.js       # CORS proxy utility
│   ├── debug-env.js       # Debug environment setup
│   └── main.js            # Application entry point
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── .npmrc                 # NPM configuration
├── build.bat              # Build script
├── build.js               # Build configuration
├── dev.bat                # Development script
├── diagnose-env.bat       # Environment diagnostics
├── fix-node-path.bat      # Node path fix utility
├── node-test.js           # Node environment test
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml         # PNPM lock file
├── README.md              # Project documentation
├── rollup.config.cjs      # Rollup config (CommonJS)
├── rollup.config.js       # Rollup config (ES modules)
├── setup.bat              # Setup script
├── start.bat              # Start script
└── TASKS.md               # Task tracking
```

### Current Component Layer
- **UI Components**: Svelte components for user interface elements
- **Form Controls**: Specialized input components like SearchableSelect
- **Results Display**: Components for showing pricing data
- **Modal Dialogs**: Components like CardVariantSelector for additional interactions

### Current Service Layer
- **pokeDataService**: Core service for fetching and processing card data
- **dbService**: Service for managing local storage and caching
- **corsProxy**: Utility for handling CORS issues with external APIs

### Current Data Layer
- **IndexedDB**: Browser-based database for persistent storage
- **API Integration**: Connection to external pricing APIs
- **Mock Data**: Fallback data for development and offline use

### Planned Cloud Service Layer
- **Azure Cosmos DB**: Primary database for card metadata and pricing information
- **Azure Blob Storage**: Storage for card images
- **Azure CDN**: Fast delivery of card images
- **Azure Cache for Redis**: Cache for frequently accessed data
- **Azure Functions**: Serverless API endpoints and background processing
- **Azure API Management**: API gateway and external API proxy

### Planned Data Layer
- **Cosmos DB Document Structure**: JSON documents for card data with the following schema:
  ```json
  {
    "id": "sv8pt5-161",
    "setCode": "PRE",
    "setId": 557,
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
    },
    "enhancedPricing": {
      "psaGrades": {
        "9": { "value": 1191.66 },
        "10": { "value": 2868.03 }
      },
      "cgcGrades": {
        "8": { "value": 1200.00 }
      },
      "ebayRaw": { "value": 752.58 }
    },
    "lastUpdated": "2025-04-29T12:00:00Z"
  }
  ```

### External Integration
- **Pokémon TCG API**: Primary source for card metadata, set information, and high-quality images
- **PokeData API**: Secondary source for enhanced pricing data and graded card values
- **Azure API Management**: Unified interface for both internal and external APIs

## Current Implementation

The current implementation focuses on a client-side architecture with robust caching and fallback mechanisms:

### Client-Side Architecture
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     App.svelte                          │
│                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │             │     │             │     │           │  │
│  │ SearchUI    │◀───▶│ State       │◀───▶│ API       │  │
│  │ Components  │     │ Management  │     │ Client    │  │
│  │             │     │             │     │           │  │
│  └─────────────┘     └─────────────┘     └───────────┘  │
│                                               │         │
│                                               ▼         │
│                                         ┌───────────┐   │
│                                         │           │   │
│                                         │ Storage   │   │
│                                         │ Service   │   │
│                                         │           │   │
│                                         └───────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component Structure
- **App.svelte**: Main application component that orchestrates the application flow
- **SearchableSelect.svelte**: Reusable dropdown component with search functionality
- **CardSearchSelect.svelte**: Specialized component for card selection
- **CardVariantSelector.svelte**: Modal component for selecting card variants

### Service Structure
- **pokeDataService.js**: Service for fetching and processing card data
  - getSetList(): Fetches list of all Pokémon card sets
  - getCardsForSet(): Fetches cards for a specific set
  - getCardPricing(): Fetches pricing data for a specific card
  - loadMockData(): Loads mock data for testing
- **db.js**: Service for managing IndexedDB storage
  - getSetList(): Retrieves cached set list
  - saveSetList(): Caches set list data
  - getCardsForSet(): Retrieves cached cards for a set
  - saveCardsForSet(): Caches cards for a set
  - getCardPricing(): Retrieves cached pricing data
  - saveCardPricing(): Caches pricing data

### Current Data Flow
1. User selects a set from the SearchableSelect dropdown
2. App loads cards for the selected set (from cache or API)
3. User selects a card from the CardSearchSelect dropdown
4. App fetches pricing data for the selected card (from cache or API)
5. Results are displayed with formatted pricing information

### Planned Cloud-Based Data Flow
1. **Initial Load**:
   - App starts → Load set list from Redis cache
   - If not in cache → Query Pokémon TCG API → Store in Redis

2. **Set Selection**:
   - User selects set → Load card list from Redis cache
   - If not in cache → Query Pokémon TCG API → Store in Redis

3. **Card Selection**:
   - User selects card → Parallel operations:
     - Request card image via CDN from Blob Storage
     - Request card data from Azure Function

4. **Data Processing**:
   - Azure Function:
     - Check Cosmos DB for card data
     - If found and recent → Return data
     - If not found or stale → Query both APIs → Merge data → Store in Cosmos DB → Return

5. **Background Updates**:
   - Daily scheduled Azure Function:
     - Fetch latest pricing data from both APIs
     - Update Cosmos DB documents
     - Invalidate relevant Redis cache entries

## Key Technical Decisions

### 1. Cloud Architecture Migration
- **Rationale**: Better scalability, performance, reliability, and feature capabilities
- **Alternatives Considered**: Enhanced client-side architecture, hybrid approach
- **Trade-offs**: Increased complexity and operational costs vs. improved capabilities and performance
- **Implementation**: Phased approach starting with core infrastructure and data migration

### 2. Hybrid API Approach
- **Rationale**: Leverage strengths of both Pokémon TCG API and PokeData API
- **Alternatives Considered**: Single API source, custom API aggregation
- **Trade-offs**: Increased complexity vs. more comprehensive data
- **Implementation**: Use Pokémon TCG API for metadata and images, PokeData API for enhanced pricing

### 3. Cosmos DB for Data Storage
- **Rationale**: Scalable, globally distributed, flexible schema, automatic indexing
- **Alternatives Considered**: SQL Database, Table Storage, MongoDB
- **Trade-offs**: Cost considerations vs. flexibility and performance
- **Implementation**: JSON document model with optimized indexing for card queries

### 4. CDN for Image Delivery
- **Rationale**: Faster image loading, reduced latency, improved user experience
- **Alternatives Considered**: Direct Blob Storage access, third-party image CDN
- **Trade-offs**: Additional configuration vs. performance benefits
- **Implementation**: Azure CDN connected to Blob Storage with appropriate caching rules

### 5. Redis for Caching
- **Rationale**: Faster response times, shared cache across users, better control
- **Alternatives Considered**: In-memory caching in Azure Functions, client-side caching
- **Trade-offs**: Additional service to manage vs. performance benefits
- **Implementation**: Cache set lists, card lists, and popular card data with appropriate TTL

### 6. Standalone Repository Architecture
- **Rationale**: Better isolation, focused development, and clearer project boundaries
- **Alternatives Considered**: Multi-project repository, monorepo approach
- **Trade-offs**: Requires additional setup but provides cleaner project management and better focus
- **Implementation**: Moved from `C:\Users\maber\Documents\GitHub\git-maber\PokeData-repo` to `C:\Users\maber\Documents\GitHub\PokeData`
- **Note**: The directory at `C:\Users\maber\Documents\GitHub\git-maber\PokeData` is a separate static web app workflow directory and should not be modified unless explicitly requested

### 7. Svelte as Frontend Framework
- **Rationale**: Lightweight, reactive framework with excellent performance characteristics
- **Alternatives Considered**: React, Vue.js
- **Trade-offs**: Smaller ecosystem than React, but better performance and simpler state management

### 8. Two-Step Search Process
- **Rationale**: Improves user experience by breaking down the search into manageable steps
- **Alternatives Considered**: Single search field with autocomplete
- **Trade-offs**: Additional step in the process but more structured and efficient search

## Design Patterns

### Current Patterns

#### 1. Service Pattern
- **Implementation**: Centralized services for data operations (pokeDataService, dbService)
- **Benefits**: Separation of concerns, reusable data access logic
- **Example**: The pokeDataService handles all API interactions and data processing

```javascript
// Service pattern example from pokeDataService.js
export const pokeDataService = {
  async getSetList() {
    // Implementation
  },
  
  async getCardsForSet(setCode, setId) {
    // Implementation
  },
  
  async getCardPricing(cardId) {
    // Implementation
  }
};
```

#### 2. Repository Pattern
- **Implementation**: dbService abstracts storage operations
- **Benefits**: Decouples storage implementation from business logic
- **Example**: The dbService provides methods for storing and retrieving data

```javascript
// Repository pattern example from db.js
export const dbService = {
  async getSetList() {
    // Implementation
  },
  
  async saveSetList(sets) {
    // Implementation
  },
  
  async getCardsForSet(setCode) {
    // Implementation
  }
};
```

#### 3. Component Composition
- **Implementation**: Building complex UI from smaller, reusable components
- **Benefits**: Reusability, maintainability, encapsulation
- **Example**: SearchableSelect is used as a base for CardSearchSelect

```html
<!-- Component composition example -->
<SearchableSelect
  items={availableSets}
  labelField="name"
  secondaryField="code"
  placeholder="Search for a set..."
  bind:value={selectedSet}
  on:select={handleSetSelect}
/>
```

#### 4. Event Delegation
- **Implementation**: Components emit events that are handled by parent components
- **Benefits**: Loose coupling, flexible component interaction
- **Example**: SearchableSelect emits 'select' events that App.svelte handles

```javascript
// Event delegation example
function handleSetSelect(event) {
  selectedSet = event.detail;
  loadCardsForSet(selectedSet);
}
```

#### 5. Adapter Pattern
- **Implementation**: Normalizing different API response formats
- **Benefits**: Consistent data structure regardless of source
- **Example**: pokeDataService handles various API response formats

```javascript
// Adapter pattern example
let cards = [];
      
// Check if we have a cards property in the response
if (data && data.cards && Array.isArray(data.cards)) {
  cards = data.cards;
}
// If no cards property, check if the response itself is an array of cards
else if (data && Array.isArray(data)) {
  cards = data;
}
// If we have a data property with an array
else if (data && data.data && Array.isArray(data.data)) {
  cards = data.data;
}
```

### Planned Cloud Architecture Patterns

#### 1. Microservices Pattern
- **Implementation**: Separate Azure Functions for different capabilities
- **Benefits**: Independent scaling and deployment, clear service boundaries
- **Example**: Separate functions for set list retrieval, card data retrieval, and pricing updates

#### 2. CQRS Pattern (Command Query Responsibility Segregation)
- **Implementation**: Separate read and write operations
- **Benefits**: Optimized query paths, event-driven updates
- **Example**: Read operations from Redis cache, write operations to Cosmos DB

#### 3. Cache-Aside Pattern
- **Implementation**: Check cache before database
- **Benefits**: Improved performance, reduced database load
- **Example**: Check Redis cache for set list before querying Cosmos DB

#### 4. Circuit Breaker Pattern
- **Implementation**: Prevent cascading failures
- **Benefits**: Improved resilience, graceful degradation
- **Example**: Implement circuit breaker for external API calls

#### 5. Strangler Fig Pattern
- **Implementation**: Gradually migrate from client-side to cloud architecture
- **Benefits**: Reduced risk, incremental migration
- **Example**: Start with set list and card data migration, then add advanced features

## Component Relationships

### Current Component Hierarchy
```
App.svelte
├── SearchableSelect (Set Selection)
├── CardSearchSelect (Card Selection)
│   └── SearchableSelect (Base Component)
├── CardVariantSelector (Variant Selection Modal)
└── Results Display (Pricing Information)
```

### Current Data Flow Between Components
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Set         │────▶│ Card        │────▶│ Price       │
│ Selection   │     │ Selection   │     │ Display     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Set Data    │     │ Card Data   │     │ Price Data  │
│ Service     │     │ Service     │     │ Service     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Storage Service                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Planned Cloud-Based Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Set         │────▶│ Card        │────▶│ Price       │
│ Selection   │     │ Selection   │     │ Display     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ API Client  │────▶│ API Client  │────▶│ API Client  │
│ (Sets)      │     │ (Cards)     │     │ (Pricing)   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  API Management                     │
│                                                     │
└─────────────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Azure       │     │ Azure       │     │ Azure       │
│ Functions   │     │ Functions   │     │ Functions   │
│ (Sets)      │     │ (Cards)     │     │ (Pricing)   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Redis Cache │     │ Redis Cache │     │ Cosmos DB   │
│ (Sets)      │     │ (Cards)     │     │ (Card Data) │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │ Blob Storage│
                                        │ (Images)    │
                                        │             │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │ Azure CDN   │
                                        │             │
                                        └─────────────┘
```

### State Management
- **Current App.svelte**: Manages the main application state
  - selectedSet: Currently selected Pokémon card set
  - selectedCard: Currently selected card
  - priceData: Pricing data for the selected card
  - isLoading: Loading state flags
  - error: Error state and messages

- **Planned State Management**:
  - Client-side state for UI interactions
  - Server-side state in Cosmos DB and Redis
  - Reactive updates via API responses
  - Background refresh for frequently accessed data

## Critical Implementation Paths

### Current Implementation Paths

#### 1. Initial Data Loading
1. App.svelte mounts and initializes
2. onMount hook triggers loading of set list
3. pokeDataService.getSetList() is called
4. dbService checks for cached set list
5. If cache miss, API request is made
6. Set list is processed and stored in cache
7. Set list is displayed in the UI

#### 2. Card Search Flow
1. User selects a set from the dropdown
2. handleSetSelect event handler is triggered
3. loadCardsForSet() is called with the selected set
4. pokeDataService.getCardsForSet() fetches cards
5. Cards are processed and stored in cache
6. Card list is displayed in CardSearchSelect

#### 3. Price Retrieval Flow
1. User selects a card and clicks "Get Price"
2. fetchCardPrice() is called
3. pokeDataService.getCardPricing() fetches pricing data
4. Pricing data is processed (filtering zero values)
5. Pricing data is stored in cache
6. Results are displayed in the UI

#### 4. Error Handling Path
1. API request is made
2. Error occurs during fetch
3. try/catch block captures the error
4. Error state is updated with message
5. UI displays error message
6. Fallback to mock data if available

### Planned Cloud Implementation Paths

#### 1. Initial Data Loading
1. App.svelte mounts and initializes
2. onMount hook triggers loading of set list
3. API client calls Azure Function via API Management
4. Azure Function checks Redis cache for set list
5. If cache miss, Function queries Pokémon TCG API
6. Set list is processed, stored in Redis, and returned
7. Set list is displayed in the UI

#### 2. Card Search Flow
1. User selects a set from the dropdown
2. handleSetSelect event handler is triggered
3. API client calls Azure Function via API Management
4. Azure Function checks Redis cache for card list
5. If cache miss, Function queries Pokémon TCG API
6. Card list is processed, stored in Redis, and returned
7. Card list is displayed in CardSearchSelect

#### 3. Price Retrieval Flow
1. User selects a card and clicks "Get Price"
2. API client calls Azure Function via API Management
3. Azure Function checks Cosmos DB for card data
4. If not found or stale, Function queries both APIs
5. Data is merged, stored in Cosmos DB, and returned
6. Card image is loaded from Azure CDN
7. Results are displayed in the UI

#### 4. Background Data Update
1. Timer-triggered Azure Function runs daily
2. Function queries both APIs for latest pricing data
3. Function updates Cosmos DB documents
4. Function invalidates relevant Redis cache entries
5. Next user request gets fresh data

## Pagination Patterns

### Cloud API Pagination Strategy
1. **Server-Side Pagination**:
   - Azure Functions use a slicing approach to return paginated results
   - Default page size set to 500 cards to handle all current sets
   - Key learning: Always explicitly set pageSize parameter in requests rather than relying on server defaults
   - Implementation supports both single-page and multi-page retrieval modes

2. **Client-Side Pagination**:
   - cloudDataService.js implements multiple page fetching when needed
   - Automatic handling to retrieve all pages for complete data sets
   - Response structure includes metadata (`totalCount`, `pageSize`, `pageNumber`, `totalPages`)
   - Aggregation of multiple pages into a single result set

3. **Component-Level Pagination**:
   - CardSearchSelect component implements a display limit (now 500, previously 100)
   - Client-side filtering with fallback to showing first 500 items
   - Avoids UI performance issues with extremely large lists
   - Maintains full dataset in memory for searching functionality

### Pagination Implementation Details
1. **Server-Side Implementation**:
   ```typescript
   // Apply pagination
   const totalCount = cards.length;
   const totalPages = Math.ceil(totalCount / pageSize);
   const startIndex = (page - 1) * pageSize;
   const endIndex = Math.min(startIndex + pageSize, totalCount);
   const paginatedCards = cards.slice(startIndex, endIndex);
   ```

2. **Client-Side Implementation**:
   ```javascript
   // Client-side pagination in cloudDataService.js
   async getCardsForSet(setCode, options = {}) {
     // Default options
     const fetchAllPages = options.fetchAllPages !== false;
     const pageSize = options.pageSize || 500;
     
     if (!fetchAllPages) {
       return this.fetchCardsPage(setCode, initialPage, pageSize, options.forceRefresh);
     }
     
     // If fetching all pages, start with page 1 and continue until all pages are retrieved
     let allCards = [];
     let currentPage = initialPage;
     let totalPages = 1;
     
     // Fetch first page to get total pages
     const firstPageResult = await this.fetchCardsPage(setCode, currentPage, pageSize, options.forceRefresh);
     totalPages = firstPageResult.totalPages || 1;
     allCards = [...allCards, ...firstPageResult.items];
     
     // Fetch remaining pages if any
     while (currentPage < totalPages) {
       currentPage++;
       const pageResult = await this.fetchCardsPage(setCode, currentPage, pageSize, options.forceRefresh);
       allCards = [...allCards, ...pageResult.items];
     }
     
     return {
       items: allCards,
       totalCount: totalCount,
       pageNumber: 1,
       pageSize: allCards.length,
       totalPages: 1
     };
   }
   ```

3. **Component-Level Implementation**:
   ```javascript
   // CardSearchSelect.svelte display limit
   if (searchText && searchText.trim() !== '') {
     // Filter cards based on search text
     filteredCards = cards.filter(card => { /* filtering logic */ });
   } else {
     // When empty, show all cards up to the limit
     filteredCards = [...cards].slice(0, 500);
   }
   ```

## Performance Considerations

### Current Performance Considerations
1. **Caching Strategy**:
   - Set list cached for extended periods
   - Card lists cached by set code
   - Pricing data cached with shorter expiration
   - Cache invalidation on version changes

2. **Lazy Loading**:
   - Cards are only loaded when a set is selected
   - Pricing data is only fetched when requested
   - Images will be lazy loaded (planned feature)

3. **Search Optimization**:
   - Client-side filtering for responsive search
   - Debounced search input to reduce processing
   - Efficient string matching algorithms

4. **Render Efficiency**:
   - Svelte's efficient update mechanism
   - Conditional rendering to minimize DOM updates
   - Proper use of Svelte reactivity

### Planned Cloud Performance Considerations
1. **Multi-Tiered Caching Strategy**:
   - Redis Cache for frequently accessed data (set lists, card lists)
   - CDN for image delivery
   - Browser caching for static assets
   - TTL-based cache invalidation

2. **Optimized Data Access Patterns**:
   - Cosmos DB indexing for common query patterns
   - Partition keys based on access patterns
   - Denormalized data for efficient retrieval

3. **Serverless Scaling**:
   - Consumption-based Azure Functions
   - Automatic scaling based on load
   - Optimized cold start handling

4. **Network Optimization**:
   - CDN for edge caching
   - Compression for API responses
   - Minimized payload sizes
   - Efficient API batching

5. **Cost-Performance Balance**:
   - Tiered storage approach (hot/cool)
   - Consumption-based compute
   - Cache optimization to reduce API calls
   - Monitoring and alerts for cost control

## Security Considerations

### Current Security Considerations
1. **API Key Protection**:
   - API keys stored in configuration
   - CORS proxy to prevent client-side exposure

2. **Data Validation**:
   - Input validation for search terms
   - Response data validation before processing
   - Safe handling of null/undefined values

3. **Error Exposure**:
   - User-friendly error messages
   - Detailed errors logged to console
   - No sensitive information in error messages

4. **Content Security**:
   - Proper Content Security Policy
   - Safe handling of external content
   - Validation of image URLs

### Planned Cloud Security Considerations
1. **Authentication and Authorization**:
   - Azure AD integration for admin functions
   - API Management subscription keys
   - Role-based access control

2. **Data Protection**:
   - Encryption at rest for Cosmos DB and Blob Storage
   - Encryption in transit with HTTPS/TLS
   - Private endpoints for internal services

3. **Network Security**:
   - API Management for request validation
   - IP restrictions for admin endpoints
   - DDoS protection

4. **Monitoring and Auditing**:
   - Azure Monitor for security events
   - Logging of all administrative actions
   - Alerts for suspicious activities

5. **Compliance**:
   - GDPR considerations for user data
   - Regular security reviews
   - Automated vulnerability scanning

## Accessibility Considerations

1. **Keyboard Navigation**:
   - Dropdown components are keyboard accessible
   - Focus management for modal dialogs
   - Proper tab order for form elements

2. **Screen Reader Support**:
   - Semantic HTML elements
   - ARIA attributes for custom components
   - Descriptive labels and announcements

3. **Visual Accessibility**:
   - Sufficient color contrast
   - Text sizing and scaling
   - Focus indicators

4. **Error Handling**:
   - Clear error messages
   - Accessible error notifications
   - Instructions for resolution

## Quality Assurance and Code Review

1. **Comprehensive Code Review Process**:
   - Standardized review using the prompt in `memory-bank/codeReviewPrompt.md`
   - Focus on 16 key areas including project structure, code quality, architecture, security, and more
   - Severity-based issue prioritization (Critical, High, Medium, Low)
   - Structured reporting format with actionable recommendations
   - Integration with development workflow at key milestones
   - Special attention to cross-session AI integration issues

2. **Review Timing**:
   - Pre-implementation reviews to understand patterns
   - Post-implementation reviews to ensure quality
   - Pre-release reviews to catch user-facing issues
   - Periodic maintenance reviews to prevent technical debt
   - Migration-specific reviews for cloud architecture transition

## Future Architecture Considerations

1. **Dependency Management**:
   - Evaluation of major version updates (Svelte 3.x to 5.x)
   - Incremental update strategy for dependencies
   - Testing framework for compatibility verification
   - Documentation of breaking changes and solutions

2. **Collection Management**:
   - Cosmos DB storage for user collections
   - Azure Functions for collection operations
   - UI components for collection management
   - Collection statistics and valuation

3. **Price History**:
   - Time-series data in Cosmos DB
   - Graph visualization components
   - Historical data collection via Azure Functions
   - Date range selection UI
