# Technical Context

## Overview
This document outlines the technologies used, development setup, technical constraints, dependencies, and tool usage patterns for the PokeData project.

## Technologies Used

### Frontend
- **Svelte**: Core UI framework for building the application
- **JavaScript**: Primary programming language
- **HTML/CSS**: Markup and styling
- **IndexedDB**: Browser-based database for persistent storage
- **Fetch API**: For making HTTP requests to external APIs
- **Web Storage API**: For lightweight client-side storage

### Development Tools
- **Rollup**: Module bundler for JavaScript
- **PNPM**: Package manager for Node.js dependencies
- **SirvCLI**: Static file server for development and testing
- **Batch Scripts**: Automation for common development tasks

### External Services
- **Pokémon Card Pricing APIs**: External data sources for card pricing information
- **CORS Proxy**: For handling cross-origin requests to external APIs

## Development Setup

### Local Development Environment
1. **Prerequisites**:
   - Windows operating system
   - Node.js (v14 or higher)
   - PNPM package manager
   - Internet connection (for initial setup and API calls)

2. **Repository Structure**:
   ```
   PokeData/
   ├── src/                  # Source code
   │   ├── components/       # UI components
   │   │   ├── CardSearchSelect.svelte
   │   │   ├── CardVariantSelector.svelte
   │   │   ├── SearchableInput.svelte
   │   │   └── SearchableSelect.svelte
   │   ├── data/             # Static data and configuration
   │   │   ├── apiConfig.js
   │   │   ├── prismaticEvolutionsCards.js
   │   │   └── setList.js
   │   ├── services/         # Business logic and API services
   │   │   ├── pokeDataService.js
   │   │   └── storage/
   │   │       └── db.js
   │   ├── App.svelte        # Main application component
   │   ├── corsProxy.js      # CORS proxy utility
   │   ├── debug-env.js      # Debugging utilities
   │   └── main.js           # Application entry point
   ├── public/               # Static assets
   │   ├── build/            # Compiled code (generated)
   │   ├── images/           # Images
   │   ├── mock/             # Mock data for development
   │   ├── debug-api.js      # API debugging utilities
   │   ├── global.css        # Global styles
   │   ├── index.html        # HTML entry point
   │   └── staticwebapp.config.json # Azure Static Web Apps configuration
   ├── docs/                 # Documentation
   │   ├── azure-deployment.md
   │   ├── debugging-guide.md
   │   └── quick-debug-guide.md
   ├── .env.example          # Example environment variables
   ├── .gitignore            # Git ignore file
   ├── .npmrc                # NPM configuration
   ├── build.bat             # Build script
   ├── build.js              # Build configuration
   ├── dev.bat               # Development server script
   ├── diagnose-env.bat      # Environment diagnostics script
   ├── fix-node-path.bat     # Node.js path fix script
   ├── node-test.js          # Node.js test script
   ├── package.json          # Package configuration
   ├── pnpm-lock.yaml        # PNPM lock file
   ├── README.md             # Project documentation
   ├── rollup.config.cjs     # Rollup configuration (CommonJS)
   ├── rollup.config.js      # Rollup configuration (ES modules)
   ├── setup.bat             # Setup script
   ├── start.bat             # Start script
   └── TASKS.md              # Development tasks and status
   ```

3. **Setup Commands**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd PokeData

   # Install dependencies
   pnpm install

   # Start development server
   pnpm dev
   ```

4. **Automation Scripts**:
   - `setup.bat`: Checks and installs Node.js, pnpm, and project dependencies
   - `dev.bat`: Starts the development server
   - `start.bat`: Starts the production server
   - `build.bat`: Builds the application for production
   - `diagnose-env.bat`: Diagnoses environment issues

### Development Workflow
1. **Local Development**:
   - Run `pnpm dev` or `dev.bat` to start the development server
   - Access the application at http://localhost:3000
   - Changes to source files trigger hot reloading

2. **Building for Production**:
   - Run `pnpm build` or `build.bat` to create a production build
   - Output is generated in the `public/build` directory

3. **Running in Production Mode**:
   - Run `pnpm start` or `start.bat` to serve the production build
   - Access the application at http://localhost:5000

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

### Storage Limitations
- **IndexedDB**: Limited by browser storage allocation (typically 50-100MB)
- **Cache Invalidation**: Required for data freshness
- **Fallback Mechanisms**: Needed for browsers without IndexedDB support

### API Constraints
- **Rate Limiting**: External APIs may have request limits
- **CORS Restrictions**: Cross-origin requests require proxy or proper headers
- **Data Format Variations**: APIs may return inconsistent data structures
- **API Availability**: External services may experience downtime

## Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "svelte": "^3.55.0",
    "idb": "^7.1.0",
    "chart.js": "^4.2.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "rollup": "^3.10.0",
    "rollup-plugin-svelte": "^7.1.0",
    "rollup-plugin-css-only": "^4.3.0",
    "rollup-plugin-terser": "^7.0.2",
    "rollup-plugin-livereload": "^2.0.5",
    "svelte-preprocess": "^5.0.0",
    "sirv-cli": "^2.0.2"
  }
}
```

### Key Dependency Details

1. **Svelte**:
   - Version: 3.55.0
   - Purpose: UI framework for building reactive components
   - Features Used: Component system, reactivity, event handling, conditional rendering

2. **idb**:
   - Version: 7.1.0
   - Purpose: IndexedDB wrapper for simpler database operations
   - Features Used: Promise-based API, transaction management, object stores

3. **chart.js** (planned):
   - Version: 4.2.0
   - Purpose: Charting library for price history visualization
   - Features Used: Line charts, time series, responsive sizing

4. **Rollup**:
   - Version: 3.10.0
   - Purpose: JavaScript module bundler
   - Features Used: Code splitting, tree shaking, plugin system

5. **sirv-cli**:
   - Version: 2.0.2
   - Purpose: Static file server for development and production
   - Features Used: HTTP serving, compression, caching

## Tool Usage Patterns

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

### Deployment
- **Static Hosting**:
  - Azure Static Web Apps (planned)
  - GitHub Pages (alternative)
  - Netlify (alternative)

- **Configuration**:
  - Environment-specific settings
  - Feature flags
  - API endpoints

## API Integration

### API Configuration
The application uses a configurable API client defined in `src/data/apiConfig.js`:

```javascript
export const API_CONFIG = {
  // Base URLs for different environments
  baseUrl: 'https://api.pokemoncards.com/v1',
  
  // Endpoint paths
  endpoints: {
    sets: '/sets',
    cards: '/cards',
    pricing: '/pricing'
  },
  
  // Build full URLs for different resources
  buildSetsUrl() {
    return `${this.baseUrl}${this.endpoints.sets}`;
  },
  
  buildCardsForSetUrl(setId) {
    return `${this.baseUrl}${this.endpoints.cards}?set_id=${setId}`;
  },
  
  buildPricingUrl(cardId) {
    return `${this.baseUrl}${this.endpoints.pricing}/${cardId}`;
  },
  
  // Headers for API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
};
```

### CORS Proxy
The application uses a CORS proxy to handle cross-origin requests:

```javascript
// src/corsProxy.js
export async function fetchWithProxy(url, options = {}) {
  // Use a CORS proxy if needed
  const proxyUrl = 'https://corsproxy.io/?';
  
  try {
    // Try direct fetch first
    const directResponse = await fetch(url, options);
    if (directResponse.ok) {
      return directResponse;
    }
    
    // If direct fetch fails with CORS error, try proxy
    console.log(`Direct fetch failed, trying proxy for: ${url}`);
    return fetch(`${proxyUrl}${encodeURIComponent(url)}`, options);
  } catch (error) {
    console.error('Error in fetchWithProxy:', error);
    
    // If the error is likely CORS-related, try the proxy
    if (error.message.includes('CORS') || error.message.includes('network')) {
      console.log(`Trying proxy after error for: ${url}`);
      return fetch(`${proxyUrl}${encodeURIComponent(url)}`, options);
    }
    
    // Otherwise, rethrow the error
    throw error;
  }
}
```

### Mock Data
The application includes mock data for development and fallback purposes:

```javascript
// Example from src/services/pokeDataService.js
async loadMockData(setName, cardName) {
  try {
    const response = await fetch('./mock/pricing-response.json');
    const mockData = await response.json();
    
    // Customize the mock data
    mockData.name = cardName || 'Charizard';
    mockData.set_name = setName || 'Base Set';
    
    return mockData;
  } catch (error) {
    console.error('Error loading mock data:', error);
    
    // Return minimal mock data if JSON file fails to load
    return {
      id: 'mock-id',
      name: cardName || 'Charizard',
      set_name: setName || 'Base Set',
      num: '4/102',
      rarity: 'Rare Holo',
      pricing: {
        'market': { value: 299.99, currency: 'USD' },
        'tcgplayer': { value: 305.42, currency: 'USD' }
      }
    };
  }
}
```

## Storage Implementation

### IndexedDB Structure
The application uses IndexedDB through a service wrapper in `src/services/storage/db.js`:

```javascript
// Database structure
const DB_NAME = 'pokedata-cache';
const DB_VERSION = 1;
const STORES = {
  SETS: 'sets',
  CARDS: 'cards',
  PRICING: 'pricing'
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

### Caching Strategy
The application implements a multi-level caching strategy:

1. **Set List Caching**:
   - Long-lived cache (days to weeks)
   - Full refresh on version changes
   - Fallback to static data if unavailable

2. **Card List Caching**:
   - Medium-lived cache (days)
   - Cached by set code
   - Loaded on demand when a set is selected

3. **Pricing Data Caching**:
   - Short-lived cache (hours)
   - Cached by card ID
   - Refreshed on explicit user action

## Component Implementation

### SearchableSelect Component
The SearchableSelect component provides a reusable dropdown with search functionality:

```html
<!-- src/components/SearchableSelect.svelte -->
<script>
  export let items = [];
  export let labelField = 'name';
  export let secondaryField = null;
  export let placeholder = 'Search...';
  export let value = null;
  
  let searchTerm = '';
  let isOpen = false;
  let inputElement;
  
  $: filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    const label = item[labelField] || '';
    const secondary = secondaryField && item[secondaryField] ? item[secondaryField] : '';
    
    return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           secondary.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  function handleSelect(item) {
    value = item;
    isOpen = false;
    dispatch('select', item);
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<!-- Component template -->
<div class="searchable-select">
  <input
    bind:this={inputElement}
    bind:value={searchTerm}
    {placeholder}
    on:focus={() => isOpen = true}
    on:blur={() => setTimeout(() => isOpen = false, 200)}
  />
  
  {#if isOpen}
    <ul class="dropdown">
      {#each filteredItems as item}
        <li on:mousedown={() => handleSelect(item)}>
          <span class="primary">{item[labelField] || ''}</span>
          {#if secondaryField && item[secondaryField]}
            <span class="secondary">{item[secondaryField]}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  /* Component styles */
</style>
```

### CardSearchSelect Component
The CardSearchSelect component extends SearchableSelect for card-specific functionality:

```html
<!-- src/components/CardSearchSelect.svelte -->
<script>
  import SearchableSelect from './SearchableSelect.svelte';
  
  export let cards = [];
  export let selectedCard = null;
  
  function handleCardSelect(event) {
    selectedCard = event.detail;
    dispatch('select', selectedCard);
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<SearchableSelect
  items={cards}
  labelField="name"
  secondaryField="num"
  placeholder="Search for a card..."
  bind:value={selectedCard}
  on:select={handleCardSelect}
/>
```

## Error Handling

### API Error Handling
The application implements comprehensive error handling for API requests:

```javascript
// Example from pokeDataService.js
async getCardPricing(cardId) {
  try {
    if (!cardId) {
      throw new Error('Card ID is required to fetch pricing data');
    }

    console.log(`Getting pricing data for card ID: ${cardId}`);
    
    // Try to get from cache first
    const cachedPricing = await dbService.getCardPricing(cardId);
    if (cachedPricing) {
      console.log(`Using cached pricing for card ${cardId}`);
      return cachedPricing;
    }
    
    // If not in cache, fetch from API
    const url = API_CONFIG.buildPricingUrl(cardId);
    console.log(`API URL for pricing: ${url}`);
    
    const response = await fetchWithProxy(url, {
      headers: API_CONFIG.getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to get error details');
      console.error(`API error for pricing ${cardId}: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status}. Details: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Pricing API response for card ${cardId}:`, data);
    
    // Process and cache the data
    // ...
    
    return pricingData;
  } catch (error) {
    console.error(`Error fetching pricing for card ${cardId}:`, error);
    throw error;
  }
}
```

### UI Error Handling
The application displays user-friendly error messages in the UI:

```html
<!-- Example from App.svelte -->
{#if error}
  <p class="error">{error}</p>
{/if}

<style>
  .error {
    color: #ee1515;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(238, 21, 21, 0.1);
    border-radius: 4px;
    text-align: center;
  }
</style>
```

## Future Technical Considerations

### Planned Technical Enhancements
1. **TypeScript Integration**:
   - Add type safety to the codebase
   - Improve developer experience
   - Enhance code quality and maintainability

2. **Testing Framework**:
   - Implement Jest or Vitest for unit testing
   - Add component testing with Testing Library
   - Create end-to-end tests with Cypress

3. **Build Optimization**:
   - Implement code splitting for better performance
   - Add service worker for offline capabilities
   - Optimize asset loading and caching

4. **State Management**:
   - Consider adding Svelte stores for global state
   - Implement more structured state management
   - Improve state persistence

### Technical Debt
1. **Error Handling Improvements**:
   - More specific error messages
   - Better error recovery mechanisms
   - Comprehensive error logging

2. **Code Organization**:
   - Refactor large components
   - Improve service modularity
   - Enhance documentation

3. **Performance Optimization**:
   - Optimize search algorithms
   - Improve rendering performance
   - Enhance caching strategies

4. **Accessibility Enhancements**:
   - Improve keyboard navigation
   - Add ARIA attributes
   - Enhance screen reader support

---
*This document was created on 4/25/2025 as part of the Memory Bank initialization for the PokeData project.*
