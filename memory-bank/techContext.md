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
   │   ├── mock/              # Mock data for development
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
   ├── .env.example           # Example environment variables
   ├── .gitignore             # Git ignore file
   ├── .npmrc                 # NPM configuration
   ├── build.bat              # Build script
   ├── build.js               # Build configuration
   ├── dev.bat                # Development server script
   ├── diagnose-env.bat       # Environment diagnostics script
   ├── fix-node-path.bat      # Node.js path fix utility
   ├── node-test.js           # Node.js test script
   ├── package.json           # Package configuration
   ├── pnpm-lock.yaml         # PNPM lock file
   ├── README.md              # Project documentation
   ├── rollup.config.cjs      # Rollup configuration (CommonJS)
   ├── rollup.config.js       # Rollup configuration (ES modules)
   ├── setup.bat              # Setup script
   ├── start.bat              # Start script
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
   - `run-app.bat`: Runs the setup script and then starts the application
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

### Current Dependency Status
The project currently uses fixed dependency versions to ensure stability. As of April 25, 2025, several dependencies are outdated and require evaluation for updates:

| Package | Current Version | Latest Version | Status |
|---------|----------------|----------------|--------|
| PNPM | 8.15.4 | 10.9.0 | Update available |
| Svelte | 3.38.3 | 5.28.2 | Major version update |
| Rollup | 2.30.0 | 4.40.0 | Major version update |
| @rollup/plugin-commonjs | 17.0.0 | 28.0.3 | Major version update |
| @rollup/plugin-node-resolve | 11.0.0 | 16.0.1 | Major version update |
| rollup-plugin-css-only | 3.1.0 | 4.5.2 | Major version update |
| rollup-plugin-livereload | 2.0.0 | 2.0.5 | Minor update |
| rollup-plugin-svelte | 7.0.0 | 7.2.2 | Minor update |
| rollup-plugin-terser | 7.0.0 | 7.0.2 | Patch update |
| sirv-cli | 1.0.0 | 3.0.1 | Major version update |

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
   - Current Version: 8.15.4
   - Latest Version: 10.9.0
   - Purpose: Fast, disk space efficient package manager
   - Features Used: Package installation, script running, dependency management
   - Update Considerations: Command behavior changes, lockfile format changes

4. **sirv-cli**:
   - Current Version: 1.0.0
   - Latest Version: 3.0.1
   - Purpose: Static file server for development and production
   - Features Used: HTTP serving, compression, caching
   - Update Considerations: Command line options may have changed

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
The application uses a simplified API client with hardcoded subscription key defined in `src/data/apiConfig.js`:

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

### Caching Strategy
The application implements a sophisticated hybrid caching strategy:

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
              ...item,
              _groupLabel: group.label // Store the group label for reference
            });
          });
        }
      });
    } else {
      flattenedItems = [...items];
    }
  }
  
  // Update filtered items when items or searchText changes
  $: {
    if (searchText && searchText.trim() !== '' && (!value || searchText !== getDisplayText(value))) {
      const searchLower = searchText.toLowerCase();
      
      if (isGroupedItems) {
        // Filter the flattened items first
        const filteredFlat = flattenedItems.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                               item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        });
        
        // Group the filtered items back into their expansions
        const groupedFiltered = {};
        filteredFlat.forEach(item => {
          const groupLabel = item._groupLabel || 'Other';
          if (!groupedFiltered[groupLabel]) {
            groupedFiltered[groupLabel] = [];
          }
          groupedFiltered[groupLabel].push(item);
        });
        
        // Convert back to the group format
        filteredItems = Object.keys(groupedFiltered).map(label => ({
          type: 'group',
          label,
          items: groupedFiltered[label]
        }));
      } else {
        // Regular filtering for non-grouped items
        filteredItems = items.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                               item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        });
      }
    } else {
      // No search text, show all items
      filteredItems = [...items];
    }
  }
  
  // Get all selectable items in a flat array for keyboard navigation
  $: allSelectableItems = isGroupedItems ? 
    filteredItems.flatMap(group => group.items || []) : 
    filteredItems;
  
  function handleItemSelect(item) {
    if (!item) return;
    
    // Update the internal value and search text
    value = item;
    searchText = getDisplayText(item);
    
    // Close dropdown
    showDropdown = false;
    
    // Dispatch the select event
    dispatch('select', item);
  }
  
  function getDisplayText(item) {
    if (!item) return '';
    if (secondaryField && item[secondaryField]) {
      return `${item[labelField]} (${item[secondaryField]})`;
    }
    return item[labelField];
  }
</script>

<!-- Component template -->
<div class="searchable-select">
  <div class="input-wrapper">
    <input
      type="text"
      bind:this={inputElement}
      bind:value={searchText}
      on:input={handleInput}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
      placeholder={placeholder}
      autocomplete="off"
    />
    <span class="dropdown-icon">{showDropdown ? '▲' : '▼'}</span>
  </div>
  
  {#if showDropdown}
    <div class="dropdown" bind:this={dropdownElement}>
      {#if isGroupedItems}
        {#if filteredItems.length === 0}
          <div class="no-results">No results found</div>
        {:else}
          {#each filteredItems as group, groupIndex}
            {#if group.type === 'group' && group.items && group.items.length > 0}
              <div class="group-header">{group.label}</div>
              {#each group.items as item, itemIndex}
                <div
                  class="item item-{allSelectableItems.indexOf(item)} indented {highlightedIndex === allSelectableItems.indexOf(item) ? 'highlighted' : ''}"
                  on:click={() => handleItemSelect(item)}
                  on:mouseover={() => highlightedIndex = allSelectableItems.indexOf(item)}
                >
                  <span class="label">
                    {item[labelField]}
                    {#if secondaryField && item[secondaryField]}
                      <span class="secondary">({item[secondaryField]})</span>
                    {/if}
                  </span>
                </div>
              {/each}
            {/if}
          {/each}
        {/if}
      {:else}
        {#if filteredItems.length === 0}
          <div class="no-results">No results found</div>
        {:else}
          {#each filteredItems as item, index}
            <div
              class="item item-{index} {highlightedIndex === index ? 'highlighted' : ''}"
              on:click={() => handleItemSelect(item)}
              on:mouseover={() => highlightedIndex = index}
            >
              <span class="label">
                {item[labelField]}
                {#if secondaryField && item[secondaryField]}
                  <span class="secondary">({item[secondaryField]})</span>
                {/if}
              </span>
            </div>
          {/each}
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    padding-right: 2rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .dropdown-icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 400px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 0 0 4px 4px;
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .group-header {
    padding: 0.5rem;
    font-weight: bold;
    background-color: #f0f0f0;
    color: #3c5aa6; /* Pokemon blue */
    border-bottom: 1px solid #ddd;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  .item {
    padding: 0.5rem;
    cursor: pointer;
    color: #333;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .indented {
    padding-left: 1.5rem;
    position: relative;
  }
  
  .item:hover, .highlighted {
    background-color: #f5f5f5;
    color: #3c5aa6; /* Blue color on hover */
  }
</style>
```

### ExpansionMapper Service
The ExpansionMapper service categorizes sets by their expansion series:

```javascript
// src/services/expansionMapper.js
/**
 * Expansion Mapper Service
 * Maps set codes to their respective expansions for grouping in the UI
 */

// Define expansion patterns based on set codes
const EXPANSION_PATTERNS = [
  { pattern: /^sv|^JTG|^PRE|^SSP/, expansion: "Scarlet & Violet" },
  { pattern: /^sm|^SMP/, expansion: "Sun & Moon" },
  { pattern: /^xy|^XYP/, expansion: "XY" },
  { pattern: /^bw|^BWP/, expansion: "Black & White" },
  { pattern: /^hs|^HSP/, expansion: "HeartGold & SoulSilver" },
  { pattern: /^dp|^DPP/, expansion: "Diamond & Pearl" },
  { pattern: /^ex/, expansion: "EX" },
  { pattern: /^PL|^SV|^RR|^SF|^LA|^MD/, expansion: "Platinum" },
  { pattern: /^CL|^TM|^UD|^UL/, expansion: "Call of Legends" },
  { pattern: /^N\d/, expansion: "Neo" },
  { pattern: /^G\d/, expansion: "Gym" },
  { pattern: /^BS|^B2|^JU|^FO|^RO/, expansion: "Base Set" },
];

// Special cases for sets that don't follow the pattern
const SPECIAL_CASES = {
  "CRZ": "Sword & Shield",
  "SIT": "Sword & Shield",
  // ... more special cases
};

// Fallback expansion for sets that don't match any pattern
const FALLBACK_EXPANSION = "Other";

/**
 * Determine the expansion for a set based on its code or name
 * @param {Object} set - The set object
 * @returns {string} The expansion name
 */
function getExpansionForSet(set) {
  // If the set doesn't have a code, try to determine from the name
  if (!set.code) {
    // Check if the name contains an expansion name
    for (const { expansion } of EXPANSION_PATTERNS) {
      if (set.name && set.name.includes(expansion)) {
        return expansion;
      }
    }
    return FALLBACK_EXPANSION;
  }

  // Check special cases first
  if (SPECIAL_CASES[set.code]) {
    return SPECIAL_CASES[set.code];
  }

  // Check patterns
  for (const { pattern, expansion } of EXPANSION_PATTERNS) {
    if (pattern.test(set.code)) {
      return expansion;
    }
  }

  // If no match found, use the fallback
  return FALLBACK_EXPANSION;
}

/**
 * Group sets by their expansion
 * @param {Array} sets - Array of set objects
 * @returns {Object} Object with expansion names as keys and arrays of sets as values
 */
function groupSetsByExpansion(sets) {
  const groupedSets = {};

  // First pass: group sets by expansion
  sets.forEach(set => {
    const expansion = getExpansionForSet(set);
    if (!groupedSets[expansion]) {
      groupedSets[expansion] = [];
    }
    groupedSets[expansion].push(set);
  });

  // Second pass: sort sets within each expansion by release date (newest first)
  Object.keys(groupedSets).forEach(expansion => {
    groupedSets[expansion].sort((a, b) => {
      // Compare release dates in descending order (newest first)
      const dateA = new Date(a.release_date || 0);
      const dateB = new Date(b.release_date || 0);
      return dateB - dateA;
    });
  });

  return groupedSets;
}

/**
 * Convert grouped sets to a format suitable for the dropdown
 * @param {Object} groupedSets - Object with expansion names as keys and arrays of sets as values
 * @returns {Array} Array of objects with type, label, and items properties
 */
function prepareGroupedSetsForDropdown(groupedSets) {
  // Sort expansions by priority (newest first)
  const expansionPriority = [
    "Scarlet & Violet",
    "Sword & Shield",
    "Sun & Moon",
    "XY",
    "Black & White",
    "HeartGold & SoulSilver",
    "Call of Legends",
    "Platinum",
    "Diamond & Pearl",
    "EX",
    "Neo",
    "Gym",
    "Base Set",
    "Other"
  ];

  // Create an array of group objects
  const result = [];

  // Add groups in priority order
  expansionPriority.forEach(expansion => {
    if (groupedSets[expansion] && groupedSets[expansion].length > 0) {
      result.push({
        type: 'group',
        label: expansion,
        items: groupedSets[expansion]
      });
    }
  });

  return result;
}

export const expansionMapper = {
  getExpansionForSet,
  groupSetsByExpansion,
  prepareGroupedSetsForDropdown
};
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
1. **Dependency Updates**:
   - Update PNPM to version 10.9.0
   - Evaluate and implement updates for Rollup and plugins
   - Research and plan migration to Svelte 5.x
   - Document breaking changes and migration steps

2. **TypeScript Integration**:
   - Add type safety to the codebase
   - Improve developer experience
   - Enhance code quality and maintainability

3. **Testing Framework**:
   - Implement Jest or Vitest for unit testing
   - Add component testing with Testing Library
   - Create end-to-end tests with Cypress

4. **Build Optimization**:
   - Implement code splitting for better performance
   - Add service worker for offline capabilities
   - Optimize asset loading and caching

5. **State Management**:
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
*This document was updated on 4/25/2025 as part of the Memory Bank update for the PokeData project.*
