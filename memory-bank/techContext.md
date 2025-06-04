# Technical Context

## Overview
This document outlines the technologies used, development setup, technical constraints, dependencies, and tool usage patterns for the PokeData project.

## Technologies Used

### Current Frontend
- **Svelte**: Core UI framework for building the application
- **JavaScript**: Primary programming language
- **HTML/CSS**: Markup and styling
- **IndexedDB**: Browser-based database for persistent storage
- **Fetch API**: For making HTTP requests to external APIs
- **Web Storage API**: For lightweight client-side storage

### Current Cloud Technologies (Default)
- **Azure Cosmos DB**: Primary database for card metadata and pricing information
- **Azure Blob Storage**: Storage for card images
- **Azure CDN**: Fast delivery of card images
- **Azure Cache for Redis**: Cache for frequently accessed data
- **Azure Functions**: Serverless API endpoints and background processing
- **Azure API Management**: API gateway and external API proxy

### Development Tools
- **Rollup**: Module bundler for JavaScript
- **PNPM**: Package manager for Node.js dependencies
- **SirvCLI**: Static file server for development and testing
- **Batch Scripts**: Automation for common development tasks
- **Azure CLI**: Command-line tools for Azure resource management (planned)
- **Azure Storage Explorer**: Visual tool for managing Azure storage resources (planned)

### External Services
- **Pokémon TCG API**: Primary source for card metadata, set information, and high-quality images
- **PokeData API**: Secondary source for enhanced pricing data and graded card values
- **CORS Proxy**: For handling cross-origin requests to external APIs

## Development Setup

### Local Development Environment
1. **Prerequisites**:
   - Windows operating system
   - Node.js (v14 or higher)
   - PNPM package manager
   - Internet connection (for initial setup and API calls)
   - Azure CLI (planned for cloud resource management)

2. **Repository Structure**:
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
   ├── public/                # Static assets
   │   ├── build/             # Compiled code (generated)
   │   ├── images/            # Images
   │   ├── data/              # Static data files
   │   ├── debug-api.js       # API debugging utilities
   │   ├── global.css         # Global styles
   │   ├── index.html         # HTML entry point
   │   └── staticwebapp.config.json # Azure Static Web Apps configuration
   ├── src/                   # Source code
   │   ├── components/        # UI components
   │   │   ├── CardSearchSelect.svelte
   │   │   ├── CardVariantSelector.svelte
   │   │   ├── SearchableInput.svelte
   │   │   └── SearchableSelect.svelte
   │   ├── data/              # Static data and configuration
   │   │   ├── apiConfig.js
   │   │   ├── prismaticEvolutionsCards.js
   │   │   └── setList.js
   │   ├── services/          # Business logic and API services
   │   │   ├── pokeDataService.js
   │   │   └── storage/
   │   │       └── db.js
   │   ├── App.svelte         # Main application component
   │   ├── corsProxy.js       # CORS proxy utility
   │   ├── debug-env.js       # Debugging utilities
   │   └── main.js            # Application entry point
   ├── azure/                 # Azure resource templates and scripts (planned)
   │   ├── templates/         # ARM templates for Azure resources
   │   ├── functions/         # Azure Functions code
   │   ├── scripts/           # Deployment and management scripts
   │   └── config/            # Configuration files for Azure resources
   ├── .env.example           # Example environment variables
   ├── .gitignore             # Git ignore file
   ├── .npmrc                 # NPM configuration
   ├── build-app.bat          # Consolidated build tool
   ├── build.js               # Build configuration
   ├── dev-server.bat         # Development server script
   ├── node-test.js           # Node.js test script
   ├── package.json           # Package configuration
   ├── pnpm-lock.yaml         # PNPM lock file
   ├── prod-server.bat        # Production server script
   ├── README.md              # Project documentation
   ├── rollup.config.cjs      # Rollup configuration (CommonJS)
   ├── rollup.config.js       # Rollup configuration (ES modules)
   ├── run-app.bat            # Quick start launcher
   ├── tools.bat              # Consolidated utility tools
   └── TASKS.md               # Development tasks and status
   ```

3. **Setup Commands**:
   
   **Command Prompt:**
   ```bash
   # Clone repository
   git clone https://github.com/Abernaughty/PokeData.git
   cd PokeData

   # Install dependencies
   pnpm install

   # Start development server
   pnpm dev
   ```
   
   **PowerShell:**
   ```powershell
   # Clone repository
   git clone https://github.com/Abernaughty/PokeData.git
   cd PokeData

   # Install dependencies
   pnpm install

   # Start development server
   pnpm dev
   ```

   Note: The PokeData repository is located at `C:\Users\maber\Documents\GitHub\PokeData` and is also available on GitHub at https://github.com/Abernaughty/PokeData. There is a separate static web app workflow directory at `C:\Users\maber\Documents\GitHub\git-maber\PokeData` that should not be modified unless explicitly requested.

4. **Automation Scripts**:
   - **dev-server.bat**: Starts the development server with hot reloading (http://localhost:3000)
     - Automatically detects and safely terminates any existing processes on port 3000
     - Uses a robust process termination approach to avoid conflicts
   - **prod-server.bat**: Starts the production server (http://localhost:3000)
     - Automatically detects and safely terminates any existing processes on port 3000
     - Uses a robust process termination approach to avoid conflicts
   - **build-app.bat**: Builds the application for production
     - Use `build-app.bat` for a full build
     - Use `build-app.bat css` to rebuild only CSS
   - **tools.bat**: Provides utility tools
     - Use `tools.bat setup` to install dependencies
     - Use `tools.bat diagnose` to diagnose environment issues
     - Use `tools.bat fix-path` to fix Node.js path issues
   - **run-app.bat**: Quick start launcher that runs setup and starts the production server

### Development Workflow
1. **Local Development**:
   - Run `pnpm dev` or `dev-server.bat` to start the development server
   - Access the application at http://localhost:3000
   - Changes to source files trigger hot reloading

2. **Building for Production**:
   - Run `pnpm build` or `build-app.bat` to create a production build
   - Output is generated in the `public/build` directory

3. **Running in Production Mode**:
   - Run `pnpm start` or `prod-server.bat` to serve the production build
   - Access the application at http://localhost:3000

### Planned Cloud Development Workflow
1. **Azure Resource Management**:
   - Use Azure CLI or Azure Portal to create and manage resources
   - Deploy Azure Functions using Azure Functions Core Tools
   - Manage Cosmos DB collections and documents using Azure Portal or SDK
   - Configure Azure API Management using Azure Portal or ARM templates

2. **Local Development with Cloud Resources**:
   - Develop and test Azure Functions locally using Azure Functions Core Tools
   - Connect to development instances of Azure resources
   - Use local.settings.json for local configuration
   - Use Azure Storage Emulator for local storage testing

3. **Deployment**:
   - Deploy frontend to Azure Static Web Apps
   - Deploy Azure Functions using GitHub Actions or Azure DevOps
   - Configure API Management using ARM templates
   - Manage Cosmos DB indexes and partitioning using Azure Portal or SDK

## Technical Constraints

### Browser Compatibility
- **Supported Browsers**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Minimum Versions**:
  - Chrome 60+
  - Firefox 55+
  - Safari 11+
  - Edge 16+
- **Features Requiring Modern Browsers**:
  - IndexedDB for storage
  - ES6+ JavaScript features
  - CSS Grid and Flexbox

### Performance Requirements
- **Initial Load Time**: Under 2 seconds on broadband connections
- **Search Response Time**: Under 500ms for local searches
- **API Response Handling**: Graceful loading states for remote data
- **Offline Functionality**: Core features work without internet connection

### Current Storage Limitations
- **IndexedDB**: Limited by browser storage allocation (typically 50-100MB)
- **Cache Invalidation**: Required for data freshness
- **Fallback Mechanisms**: Needed for browsers without IndexedDB support

### Cloud Storage Implementation
- **Cosmos DB**: Configured with card data in Cards container and set data in Sets container
  - On-demand population strategy for efficient storage usage
  - Currently populated with data for Scarlet & Violet sets, with older sets loaded on-demand
  - Cards are stored by Set ID partition key for efficient querying
- **Blob Storage**: Cost-effective storage for card images
- **Redis Cache**: High-performance in-memory cache for frequently accessed data
  - Configured with TTL-based caching (sets: 7 days, cards: 24 hours)
  - Optimized read path with cache-aside pattern
- **CDN**: Edge caching for improved image delivery performance

### API Constraints
- **Rate Limiting**: External APIs may have request limits
- **CORS Restrictions**: Cross-origin requests require proxy or proper headers
- **Data Format Variations**: APIs may return inconsistent data structures
- **API Availability**: External services may experience downtime

### Cloud Service Constraints
- **Cosmos DB RU Limits**: Request Units need to be properly provisioned
- **Azure Functions Execution Time**: Maximum execution time for functions
- **Redis Cache Size**: Memory limits based on selected tier
- **API Management Throughput**: Request limits based on selected tier
- **Cost Management**: Operational costs need to be monitored and optimized

## Dependencies

### Current Dependency Status
The project uses fixed dependency versions to ensure stability. As of May 2, 2025, the dependency status is as follows:

| Package | Current Version | Latest Version | Status |
|---------|----------------|----------------|--------|
| PNPM | 10.9.0 | 10.9.0 | ✅ Up to date |
| Svelte | 4.2.19 | 5.28.2 | Major version update available |
| Rollup | 2.79.2 | 4.40.0 | Major version update available |
| @rollup/plugin-commonjs | 21.1.0 | 28.0.3 | Major version update available |
| @rollup/plugin-node-resolve | 13.3.0 | 16.0.1 | Major version update available |
| @rollup/plugin-replace | 6.0.2 | 6.0.2 | ✅ Up to date |
| rollup-plugin-css-only | 3.1.0 | 4.5.2 | Major version update available |
| rollup-plugin-livereload | 2.0.5 | 2.0.5 | ✅ Up to date |
| rollup-plugin-svelte | 7.2.2 | 7.2.2 | ✅ Up to date |
| rollup-plugin-terser | 7.0.2 | 7.0.2 | ✅ Up to date |
| sirv-cli | 1.0.0 | 3.0.1 | Major version update available |
| dotenv | 16.5.0 | 16.5.0 | ✅ Up to date |
| rimraf | 3.0.2 | 6.0.1 | Major version update available |

### Cloud Architecture Dependencies
For the cloud-based architecture, we've implemented the following dependencies:

| Package | Purpose | Status |
|---------|---------|--------|
| @azure/cosmos | Cosmos DB client for Node.js | ✅ Implemented |
| @azure/storage-blob | Azure Blob Storage client for Node.js | ✅ Implemented |
| axios | HTTP client for API requests | ✅ Implemented |
| @azure/identity | Authentication for Azure services | ✅ Implemented |
| @azure/functions | Azure Functions runtime | ✅ Implemented |
| redis | Redis client for Node.js | ✅ Implemented |
| chart.js | Library for price history visualization | 🔄 Planned |
| azure-functions-core-tools | Local development tools for Azure Functions | ✅ Implemented |

### Dependency Update Plan
1. **Package Manager Update**:
   - Update PNPM from 8.15.4 to 10.9.0
   - Evaluate compatibility with existing scripts and workflows
   - Document any changes to PNPM commands or behavior

2. **Non-Breaking Updates**:
   - Apply patch and minor updates first (rollup-plugin-livereload, rollup-plugin-svelte, rollup-plugin-terser)
   - Test application functionality after each update
   - Document any changes in behavior or configuration

3. **Major Version Updates**:
   - Evaluate each major update separately (Rollup, plugins, sirv-cli)
   - Research breaking changes and migration guides
   - Create migration plan for each dependency
   - Implement updates incrementally with thorough testing

4. **Svelte Framework Update**:
   - Special consideration for Svelte 3.x to 5.x update
   - Research Svelte 5 migration guide
   - Identify breaking changes and required code modifications
   - Create a separate branch for Svelte 5 migration
   - Test thoroughly before merging

5. **Cloud Dependencies Addition**:
   - Add Azure SDK packages as needed for cloud resource integration
   - Implement proper authentication and security practices
   - Create abstraction layers for cloud service interactions
   - Develop local development workflows with cloud emulators where possible

### Production Dependencies
```json
{
  "dependencies": {
    "sirv-cli": "1.0.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@rollup/plugin-commonjs": "17.0.0",
    "@rollup/plugin-node-resolve": "11.0.0",
    "@rollup/plugin-replace": "6.0.2",
    "dotenv": "16.5.0",
    "rimraf": "3.0.2",
    "rollup": "2.30.0",
    "rollup-plugin-css-only": "3.1.0",
    "rollup-plugin-livereload": "2.0.0",
    "rollup-plugin-svelte": "7.0.0",
    "rollup-plugin-terser": "7.0.0",
    "svelte": "3.38.3"
  }
}
```

### Key Dependency Details

1. **Svelte**:
   - Current Version: 3.38.3
   - Latest Version: 5.28.2
   - Purpose: UI framework for building reactive components
   - Features Used: Component system, reactivity, event handling, conditional rendering
   - Update Considerations: Major version jump with significant API changes

2. **Rollup**:
   - Current Version: 2.30.0
   - Latest Version: 4.40.0
   - Purpose: JavaScript module bundler
   - Features Used: Code splitting, tree shaking, plugin system
   - Update Considerations: Configuration changes required for v4

3. **PNPM**:
   - Current Version: 10.9.0 ✅ MIGRATED
   - Latest Version: 10.9.0
   - Purpose: Fast, disk space efficient package manager
   - Features Used: Package installation, script running, dependency management
   - Migration Status: Successfully migrated entire project to pnpm@10.9.0 (2025-06-04)
   - Update Considerations: Migration complete - both frontend and backend now use consistent pnpm@10.9.0

4. **sirv-cli**:
   - Current Version: 1.0.0
   - Latest Version: 3.0.1
   - Purpose: Static file server for development and production
   - Features Used: HTTP serving, compression, caching
   - Update Considerations: Command line options may have changed

## Tool Usage Patterns

### Code Quality and Review
- **Comprehensive Code Review**: Using the standardized prompt in `memory-bank/codeReviewPrompt.md`
- **Review Timing**: Pre-implementation, post-implementation, pre-release, and maintenance reviews
- **Issue Prioritization**: Critical, High, Medium, and Low severity ratings
- **Review Focus Areas**: 16 key areas including project structure, code quality, architecture, security, and more
- **Reporting Format**: Structured format with actionable recommendations and code examples
- **Cross-Session AI Integration**: Special attention to inconsistencies from AI-assisted development

### Version Control
- **Git**: For source code management
- **GitHub**: For repository hosting
- **Branching Strategy**: Feature branches with main as the primary branch
- **Commit Conventions**: Descriptive commit messages with prefixes (feat, fix, docs, etc.)

### Development Patterns
- **Component Development**:
  - One component per file
  - Clear separation of concerns
  - Props for configuration
  - Events for communication

- **Service Development**:
  - Centralized services for data operations
  - Clear error handling
  - Caching strategies
  - Fallback mechanisms

- **Testing Approach**:
  - Manual testing during development
  - Console logging for debugging
  - Mock data for offline testing
  - Browser developer tools for inspection

### Build Process
- **Development Build**:
  - Source maps for debugging
  - Hot module replacement
  - Minimal optimization for faster builds

- **Production Build**:
  - Code minification and optimization
  - CSS extraction and minification
  - Bundle splitting for performance
  - Cache optimization

### Current Deployment
- **Static Hosting**:
  - Azure Static Web Apps (planned)
  - GitHub Pages (alternative)
  - Netlify (alternative)

- **Configuration**:
  - Environment-specific settings
  - Feature flags
  - API endpoints

### Azure Static Web Apps Architecture Insights
- **🔑 CRITICAL DISCOVERY**: Static Web Apps create permanent binding between deployment tokens and workflow file names
  - **Token-Workflow Binding**: Each deployment token is tied to the specific workflow file name that was active during creation
  - **Configuration Persistence**: Mixed configuration states can persist even through Azure CLI disconnect/reconnect operations
  - **Portal UI Limitations**: Azure Portal UI cannot resolve configuration mismatches that Azure CLI can detect and analyze
  - **Clean Resource Strategy**: Creating new resources is more reliable than repairing mixed configuration states
- **📋 SYSTEMATIC DEBUGGING APPROACH**: 
  - **Azure CLI Investigation**: Use `az staticwebapp show` to identify configuration state mismatches
  - **Token Validation**: Use REST API calls to validate deployment token authenticity and binding
  - **Filename Testing**: Temporarily rename workflow files to verify Azure's workflow file expectations
  - **Clean Slate Solution**: Create new resources when configuration repair proves unreliable
- **🛠️ TECHNICAL ARCHITECTURE**: 
  - **Deployment Process**: Azure automatically generates workflow files with embedded API tokens during resource creation
  - **CORS Integration**: Static Web Apps require explicit CORS configuration in connected Azure Functions for API access
  - **GitHub Integration**: Fresh GitHub repository connections create clean, working deployment workflows
  - **Domain Management**: New resources support custom domain configuration and SSL certificates

### Cloud Deployment
- **Frontend**: 
  - Azure Static Web Apps for hosting (✅ implemented - Pokedata-SWA with clean configuration)
  - CDN for static assets and images (planned)
  - Environment-specific configuration (planned)

- **Backend**:
  - Azure Functions for serverless API endpoints (✅ implemented)
  - Azure API Management for API gateway (✅ implemented)
  - GitHub Actions for CI/CD (✅ implemented)

- **Data Storage**:
  - Cosmos DB for card data and pricing (✅ implemented)
  - Blob Storage for card images (✅ configured)
  - Redis Cache for frequently accessed data (✅ implemented)

- **Monitoring**:
  - Azure Monitor for application insights (planned)
  - Log Analytics for log aggregation (planned)
  - Alerts for critical issues (planned)

## Pagination Pattern Implementation

### Client-Side Pagination
The cloudDataService.js implements client-side pagination to handle sets with many cards:

```javascript
async getCardsForSet(setCode, options = {}) {
  // Default options
  const fetchAllPages = options.fetchAllPages !== false; // Default to true
  const pageSize = options.pageSize || 500; // Increased page size to reduce requests
  
  // If we're not fetching all pages, just get the requested page
  if (!fetchAllPages) {
    return this.fetchCardsPage(setCode, initialPage, pageSize, options.forceRefresh);
  }
  
  // If we are fetching all pages, start with page 1
  let allCards = [];
  let currentPage = initialPage;
  let totalPages = 1; // Will be updated after first request
  
  // Fetch first page to get total pages
  const firstPageResult = await this.fetchCardsPage(setCode, currentPage, pageSize, options.forceRefresh);
  
  // Extract pagination info
  totalPages = firstPageResult.totalPages || 1;
  
  // Add cards from first page
  allCards = [...allCards, ...firstPageResult.items];
  
  // Fetch remaining pages if any
  while (currentPage < totalPages) {
    currentPage++;
    const pageResult = await this.fetchCardsPage(setCode, currentPage, pageSize, options.forceRefresh);
    allCards = [...allCards, ...pageResult.items];
  }
  
  // Return all cards with pagination metadata
  const result = {
    items: allCards,
    totalCount: allCards.length,
    pageNumber: 1,
    pageSize: allCards.length,
    totalPages: 1
  };
  
  return result;
}
```

### Server-Side Pagination
The Azure Function implements server-side pagination for delivering card lists in manageable chunks:

```typescript
// Apply pagination
const totalCount = cards.length;
const totalPages = Math.ceil(totalCount / pageSize);
const startIndex = (page - 1) * pageSize;
const endIndex = Math.min(startIndex + pageSize, totalCount);
const paginatedCards = cards.slice(startIndex, endIndex);
```

### Component-Level Display Limits
The CardSearchSelect component implements a display limit for performance when showing large card lists:

```javascript
// When empty, show all cards (up to a reasonable limit)
filteredCards = [...cards].slice(0, 500); // Increased from 100 to 500 to match backend pagination
```

### Key Pagination Lessons
Through troubleshooting pagination issues, we've learned:

1. **Always Explicitly Set Pagination Parameters**: Don't rely on server-side defaults, as they may not be applied consistently
2. **Consistent Page Sizes**: Use the same page size limit (500) on both client and server
3. **Multi-Level Implementation**: Pagination must be properly handled at all levels:
   - Server-side API responses
   - Client-side data retrieval
   - Component-level display
4. **Performance vs. Completeness**: Balance between showing all items and maintaining UI performance

## API Integration

### Current API Configuration
The client-side application uses a simplified API client with hardcoded subscription key defined in `src/data/apiConfig.js`:

```javascript
export const API_CONFIG = {
  // Base URL for the API
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api/v0',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  // Endpoints
  endpoints: {
    pricing: '/pricing', // Get Info and Pricing for Card or Product
    sets: '/sets',      // List All Sets 
    set: '/set'         // List Cards in Set
  },
  
  // Headers function to get standard headers
  getHeaders() {
    return {
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'Content-Type': 'application/json'
    };
  },
  
  // URL builder functions
  buildPricingUrl(id) {
    return `${this.baseUrl}${this.endpoints.pricing}?id=${encodeURIComponent(id)}&asset_type=CARD`;
  },
  
  buildSetsUrl() {
    return `${this.baseUrl}${this.endpoints.sets}`;
  },
  
  buildCardsForSetUrl(setId) {
    return `${this.baseUrl}${this.endpoints.set}?set_id=${encodeURIComponent(setId)}`;
  }
};
```

This approach uses a hardcoded subscription key instead of environment variables, simplifying the development workflow while maintaining security through API Management restrictions (origin limitations, rate limits). Authentication is handled by the API Management service, which adds the actual API key on the server side.

### Implemented Hybrid API Approach
The Azure Function implementation uses a hybrid API approach leveraging both the Pokémon TCG API and PokeData API:

1. **Pokémon TCG API**:
   - Primary source for card metadata and set information
   - Source for high-quality card images
   - Well-documented and reliable API
   - Comprehensive coverage of all Pokémon card sets

2. **PokeData API**:
   - Enhanced pricing data from multiple sources
   - Graded card values (PSA, CGC)
   - Market trends and historical pricing
   - Additional metadata not available in the TCG API

3. **Azure API Management**:
   - Unified interface for both APIs
   - Rate limiting and throttling
   - Caching and response transformation
   - Authentication and authorization
   - Monitoring and analytics

4. **Azure Functions**:
   - Data normalization and transformation (✅ implemented)
   - Error handling and fallback mechanisms (✅ implemented)
   - Caching with Redis and background processing (✅ implemented)
   - On-demand database population strategy (✅ implemented)
   - Tiered cache access pattern (Redis → Cosmos DB → External API) (✅ implemented)

### Enhanced CORS Proxy
The application currently uses an enhanced CORS proxy to handle cross-origin requests and ensure proper header handling:

```javascript
// Enhanced CORS proxy with better header handling
export async function fetchWithProxy(url, options = {}) {
  try {
    console.log(`Fetching from: ${url}`);
    
    // Ensure headers object exists
    if (!options.headers) {
      options.headers = {};
    }
    
    // Log the headers we're trying to send
    console.log('Attempting to send headers:', JSON.stringify(options.headers, null, 2));
    
    // Create a new Headers object to ensure proper header formatting
    const headers = new Headers();
    
    // Add all headers from options
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.append(key, value);
    });
    
    // Ensure content-type is set
    if (!headers.has('Content-Type')) {
      headers.append('Content-Type', 'application/json');
    }
    
    // Create a new options object with the properly formatted headers
    const enhancedOptions = {
      ...options,
      headers: headers,
      mode: 'cors', // Use CORS mode to allow cross-origin requests
      credentials: 'same-origin' // Don't send cookies for cross-origin requests
    };
    
    // Log the actual headers being sent
    console.log('Sending headers:', Array.from(headers.entries()));
    
    // Make the fetch request with enhanced options
    const response = await fetch(url, enhancedOptions);
    
    // Handle non-OK responses
    if (!response.ok) {
      let errorDetails = 'Unable to get error details';
      try {
        // Try to get error details as text
        errorDetails = await response.text();
      } catch (e) {
        console.warn('Could not read error response text:', e);
      }
      
      console.error(`HTTP Error: ${response.status} - ${response.statusText}\nURL: ${url}\nDetails: ${errorDetails}`);
      
      // Special handling for 401 errors
      if (response.status === 401) {
        console.error('Authentication error: Check if subscription key is being sent correctly');
        console.error('Response headers:', Array.from(response.headers.entries()));
      }
      
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Fetch error for URL [${url}]:`, error);
    
    // Provide more helpful error messages for common issues
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      console.error('Network error: Check your internet connection or if CORS is properly configured');
    } else if (error.message.includes('401')) {
      console.error('Authentication error: Check if your API key is valid and being sent correctly');
    }
    
    throw error;
  }
}
```

In the planned architecture, CORS handling will be managed by Azure API Management, eliminating the need for a client-side CORS proxy.

### Error Handling
The application provides clear error messages when API calls fail, rather than generating misleading fallback data:

```javascript
// Example from App.svelte - Error handling when no cards are found
if (!cards || cards.length === 0) {
  console.log('No cards returned for this set');
  error = `No cards found for set "${set.name}". Please try another set or check your connection.`;
  isLoadingCards = false;
  return;
}
```

This approach ensures users only see real data from the API, with clear error messages when data is unavailable. In the planned architecture, comprehensive error handling will be implemented in Azure Functions with detailed logging and monitoring.

## Storage Implementation

### Current IndexedDB Structure
The application currently uses IndexedDB through a service wrapper in `src/services/storage/db.js`:

```javascript
// Database configuration
const DB_NAME = 'poke-data-db';
const DB_VERSION = 2; // Increment version for schema update
const STORES = {
  setList: 'setList',
  cardsBySet: 'cardsBySet',
  cardPricing: 'cardPricing',
  currentSets: 'currentSets',      // New store for current sets
  currentSetCards: 'currentSetCards', // New store for current set cards
  config: 'config'                 // New store for configuration
};

// Example methods
export const dbService = {
  async getSetList() {
    // Implementation to retrieve sets from IndexedDB
  },
  
  async saveSetList(sets) {
    // Implementation to save sets to IndexedDB
  },
  
  async getCardsForSet(setCode) {
    // Implementation to retrieve cards for a set from IndexedDB
  },
  
  async saveCardsForSet(setCode, cards) {
    // Implementation to save cards for a set to IndexedDB
  },
  
  async getCardPricing(cardId) {
    // Implementation to retrieve pricing data from IndexedDB
  },
  
  async saveCardPricing(cardId, pricingData) {
    // Implementation to save pricing data to IndexedDB
  }
};
```

### Planned Cloud Storage Structure

#### Cosmos DB Document Structure
The planned architecture will use Cosmos DB for card data and pricing information:

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

#### Blob Storage Structure
Card images will be stored in Azure Blob Storage with the following structure:

```
container/
├── sets/
│   ├── sv8pt5/
│   │   ├── 161.png
│   │   ├── 161_hires.png
│   │   └── ...
│   ├── sv8/
│   │   ├── 001.png
│   │   ├── 001_hires.png
│   │   └── ...
│   └── ...
└── variants/
    ├── graded/
    │   ├── psa/
    │   │   ├── sv8pt5-161-psa10.png
    │   │   └── ...
    │   └── cgc/
    │       ├── sv8pt5-161-cgc9.5.png
    │       └── ...
    └── special/
        ├── first-edition/
        │   ├── base-4-first-edition.png
        │   └── ...
        └── ...
```

#### Redis Cache Structure
Frequently accessed data will be cached in Azure Cache for Redis:

1. **Set List Cache**:
   - Key: `sets:list`
   - Value: JSON array of set objects
   - TTL: 7 days

2. **Card List Cache**:
   - Key: `cards:set:{setCode}`
   - Value: JSON array of card objects for the set
   - TTL: 24 hours

3. **Popular Card Cache**:
   - Key: `cards:popular`
   - Value: JSON array of popular card objects
   - TTL: 1 hour

4. **User Session Cache**:
   - Key: `session:{sessionId}`
   - Value: JSON object with user session data
   - TTL: 30 minutes

### Current Caching Strategy
The application currently implements a sophisticated hybrid caching strategy:

1. **Set List Caching**:
   - Long-lived cache (days to weeks)
   - Full refresh on version changes
   - Fallback to static data if unavailable
   - Current sets identified and prioritized

2. **Card List Caching - Hybrid Approach**:
   - **Current Sets (Scarlet & Violet era)**:
     - Dedicated storage in currentSetCards store
     - Proactive background loading and caching
     - Automatic refresh via scheduled background sync
     - Higher priority for cache retention
   - **Legacy Sets**:
     - Standard caching in cardsBySet store
     - Loaded on demand when a set is selected
     - Lower priority for cache retention
     - Cached by set code

3. **Pricing Data Caching - TTL-Based**:
   - Time-To-Live (TTL) of 24 hours
   - Cached by card ID with timestamp
   - Automatic expiration and cleanup
   - Metadata for cache status transparency
   - Fallback to stale data when API unavailable

4. **Background Processes**:
   - Automatic sync for current sets (every 24 hours)
   - Cleanup of expired pricing data (every 12 hours)
   - Configuration updates for current sets list (every 7 days)
   - Network status monitoring for offline handling

### Implemented Cloud Caching Strategy
The Azure Function implementation features a multi-tiered caching strategy:

1. **Redis Cache**:
   - In-memory caching for frequently accessed data (✅ implemented)
   - TTL-based cache invalidation (7 days for sets, 24 hours for cards) (✅ implemented)
   - Shared cache across all users (✅ implemented)
   - Cache-aside pattern implementation (✅ implemented)

2. **API Management Cache**:
   - Response caching for API calls (✅ implemented)
   - Cache-Control header management (✅ implemented)
   - Cache invalidation on data updates (🔄 in progress)

3. **CDN Cache**:
   - Edge caching for static assets and images (🔄 in progress)
   - Geographic distribution for reduced latency (🔄 planned)
   - Cache-Control header management (🔄 planned)

4. **Browser Cache**:
   - Local caching for static assets
   - Service worker for offline support
   - IndexedDB for user-specific data
   - Local Storage for user preferences

5. **Background Processes**:
   - Timer-triggered Azure Functions for data updates
   - Event-driven cache invalidation
   - Scheduled cache warming for popular items
   - Monitoring and analytics for cache performance

## Component Implementation

### SearchableSelect Component with Grouping Support
The SearchableSelect component provides a reusable dropdown with search functionality and support for grouped items:

```html
<!-- src/components/SearchableSelect.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  // Props
  export let items = [];
  export let placeholder = 'Search...';
  export let labelField = 'name';
  export let secondaryField = null;
  export let value = null;
  
  // State
  let searchText = '';
  let showDropdown = false;
  let filteredItems = [];
  let flattenedItems = []; // Flattened list of all items for keyboard navigation
  let highlightedIndex = -1;
  let inputElement;
  let dropdownElement;
  
  const dispatch = createEventDispatcher();
  
  // Check if items are grouped (contains objects with type: 'group')
  $: isGroupedItems = items.some(item => item.type === 'group');
  
  // Flatten grouped items for easier filtering and navigation
  $: {
    if (isGroupedItems) {
      flattenedItems = [];
      items.forEach(group => {
        if (group.type === 'group' && Array.isArray(group.items)) {
          group.items.forEach(item => {
            flattenedItems.push({
