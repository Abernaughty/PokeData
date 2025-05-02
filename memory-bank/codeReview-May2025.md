# Comprehensive Code Review: PokeData Project (May 2025)

This code review analyzes the PokeData project, a Pokémon card price checker web application built with Svelte. The review follows the structure outlined in the code review prompt, with a focus on identifying issues, inconsistencies, and areas for improvement.

## Executive Summary

The PokeData project is a well-structured Svelte application that allows users to search for Pokémon cards by set and name to view pricing information. The codebase demonstrates good organization with clear separation of concerns between components, services, and data. However, there are several areas that could benefit from improvement, including outdated dependencies, security concerns with hardcoded API keys, inconsistent error handling, and documentation-code alignment issues.

The project is currently in a transition phase, moving from a client-side architecture to a cloud-based architecture using Azure services, which presents an excellent opportunity to address many of the identified issues.

## Critical Issues

1. **Hardcoded API Key** (Security, High)
2. **Outdated Dependencies** (Dependency Management, High)
3. **Complex State Management in App.svelte** (Architecture, High) ✅ FIXED (2025-05-02)
4. **Lack of Automated Tests** (Testing, High)

## Table of Contents

1. [Project Structure & File Organization](#1-project-structure--file-organization)
2. [Code Quality Issues](#2-code-quality-issues)
3. [Architecture & Design](#3-architecture--design)
4. [Documentation & Comments](#4-documentation--comments)
5. [Package & Dependency Management](#5-package--dependency-management)
6. [Performance Considerations](#6-performance-considerations)
7. [Cross-session AI Integration Issues](#7-cross-session-ai-integration-issues)
8. [Svelte-Specific Considerations](#8-svelte-specific-considerations)
9. [Project-Specific Checks](#9-project-specific-checks)
10. [Modern Development Best Practices](#10-modern-development-best-practices)
11. [Security Considerations](#11-security-considerations)
12. [Testing and Quality Assurance](#12-testing-and-quality-assurance)
13. [Build and Deployment Process](#13-build-and-deployment-process)
14. [Code Maintainability and Scalability](#14-code-maintainability-and-scalability)
15. [Developer Experience](#15-developer-experience)
16. [Documentation-Code Alignment](#16-documentation-code-alignment)
17. [Recommendations Summary](#17-recommendations-summary)

## 1. Project Structure & File Organization

### 1.1 Debug Files Proliferation - Medium
- **Location**: `src/debug-*.js` files
- **Description**: Multiple debug-related files (`debug-config.js`, `debug-env.js`, `debug-panel.js`, `debug-tools.js`) create fragmentation of debugging functionality.
- **Impact**: Increases maintenance burden and makes it harder to understand the debugging system as a whole.
- **Recommendation**: Consolidate these files into a single `debug` directory with a clear structure, or at minimum into fewer files with more focused responsibilities.

### 1.2 Batch File Duplication - Low
- **Location**: Root directory (`.bat` files)
- **Description**: Multiple batch files with overlapping functionality (`dev.bat`, `start.bat`, `run-app.bat`).
- **Impact**: Creates confusion about which script to use for which purpose.
- **Recommendation**: Consolidate into fewer scripts with clear documentation on their purpose, or rename for clarity (e.g., `dev-server.bat`, `prod-server.bat`).

### 1.3 Mock Data in Production Build - Low
- **Location**: `public/mock/` directory
- **Description**: Mock data files are included in the public directory, which means they'll be included in production builds.
- **Impact**: Increases bundle size unnecessarily and could potentially expose test data to users.
- **Recommendation**: Move mock data to a separate directory outside of `public/` and use a build configuration to include it only in development builds.

## 2. Code Quality Issues

### 2.1 Excessive Console Logging - Medium
- **Location**: Throughout the codebase, particularly in `App.svelte` and `pokeDataService.js`
- **Description**: Numerous `console.log` statements remain in the code, even though a sophisticated logging system exists.
- **Impact**: Clutters the console in development and could potentially expose sensitive information in production.
- **Recommendation**: Replace direct console.log calls with the appropriate loggerService methods, and ensure log levels are properly set for production.

### 2.2 Duplicate Error Handling Logic - Medium
- **Location**: `pokeDataService.js`
- **Description**: Similar error handling patterns are repeated across multiple methods.
- **Impact**: Makes the code more verbose and increases the chance of inconsistent error handling.
- **Recommendation**: Extract common error handling logic into reusable functions.

**Example**:

Current:
```javascript
// In getSetList method
try {
  // Method implementation
} catch (error) {
  console.error('Error in getSetList:', error);
  
  // Final fallback to static data
  console.log('Using static set list as final fallback');
  const { setList } = await import('../data/setList');
  return sortSetsByReleaseDate(ensureSetsHaveIds(setList));
}

// In getCardsForSet method
try {
  // Method implementation
} catch (error) {
  console.error(`Error fetching cards for set ${setCode}:`, error);
  
  // For current sets, try to get from currentSetCards as a last resort
  if (setClassifier.isCurrentSet(setCode)) {
    const currentSetCards = await dbService.getCurrentSetCards(setCode);
    if (currentSetCards && currentSetCards.length > 0) {
      console.log(`Using cached cards for current set ${setCode} after API error`);
      return currentSetCards;
    }
  }
  
  // For legacy sets, try to get from regular cache as a last resort
  const cachedCards = await dbService.getCardsForSet(setCode);
  if (cachedCards && cachedCards.length > 0) {
    console.log(`Using cached cards for set ${setCode} after API error`);
    return cachedCards;
  }
  
  // If all else fails, return empty array
  return [];
}
```

Recommended:
```javascript
// Reusable error handler function
async function handleApiError(operation, errorMsg, fallbackFn) {
  loggerService.error(`Error in ${operation}: ${errorMsg}`);
  
  try {
    // Try to get data from fallback function
    const fallbackData = await fallbackFn();
    if (fallbackData) {
      loggerService.info(`Using fallback data for ${operation}`);
      return fallbackData;
    }
  } catch (fallbackError) {
    loggerService.error(`Fallback also failed for ${operation}:`, fallbackError);
  }
  
  // Return default value if all else fails
  return operation.includes('set') ? [] : null;
}

// In getSetList method
try {
  // Method implementation
} catch (error) {
  return handleApiError('getSetList', error, async () => {
    const { setList } = await import('../data/setList');
    return sortSetsByReleaseDate(ensureSetsHaveIds(setList));
  });
}

// In getCardsForSet method
try {
  // Method implementation
} catch (error) {
  return handleApiError(`getCardsForSet(${setCode})`, error, async () => {
    // Try cached data
    if (setClassifier.isCurrentSet(setCode)) {
      const currentSetCards = await dbService.getCurrentSetCards(setCode);
      if (currentSetCards?.length > 0) return currentSetCards;
    }
    
    const cachedCards = await dbService.getCardsForSet(setCode);
    if (cachedCards?.length > 0) return cachedCards;
    
    return [];
  });
}
```

### 2.3 Hardcoded API Key - High
- **Location**: `src/data/apiConfig.js`
- **Description**: API subscription key is hardcoded in the source code.
- **Impact**: Security risk if the repository is public, and makes it difficult to use different keys for different environments.
- **Recommendation**: Move to environment variables or a secure configuration system, especially as the project transitions to a cloud architecture.

**Example**:

Current:
```javascript
// API Configuration
export const API_CONFIG = {
  // Base URL for the API
  baseUrl: 'https://maber-apim-test.azure-api.net/pokedata-api/v0',
  
  // Subscription key for API Management
  subscriptionKey: '1c3e73f4352b415c98eb89f91541c4e4',
  
  // ...rest of the configuration
};
```

Recommended:
```javascript
// API Configuration
export const API_CONFIG = {
  // Base URL for the API
  baseUrl: process.env.API_BASE_URL || 'https://maber-apim-test.azure-api.net/pokedata-api/v0',
  
  // Subscription key for API Management
  subscriptionKey: process.env.API_SUBSCRIPTION_KEY,
  
  // ...rest of the configuration
  
  // Validate configuration
  validate() {
    if (!this.subscriptionKey) {
      console.error('API subscription key is missing. Set API_SUBSCRIPTION_KEY environment variable.');
    }
    return this.subscriptionKey != null;
  }
};

// Validate configuration on import
API_CONFIG.validate();
```

### 2.4 Overly Complex Reactive Statements - Medium
- **Location**: `SearchableSelect.svelte`
- **Description**: Complex reactive statements with nested conditionals and error handling.
- **Impact**: Makes the component harder to understand and debug.
- **Recommendation**: Break down complex reactive statements into smaller, more focused functions that can be called from the reactive statement.

**Example**:

Current:
```javascript
// Update filtered items when items or searchText changes
$: {
  try {
    console.log('SearchableSelect: Filtering items with searchText:', searchText);
    
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
        
        console.log(`SearchableSelect: Filtered to ${filteredItems.length} groups`);
      } else {
        // Regular filtering for non-grouped items
        filteredItems = Array.isArray(items) ? items.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                               item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        }) : [];
        
        console.log(`SearchableSelect: Filtered to ${filteredItems.length} items`);
      }
    } else {
      // No search text, show all items
      // Make a defensive copy to avoid reference issues
      filteredItems = Array.isArray(items) ? 
        (isGroupedItems ? 
          items.map(group => ({...group, items: [...(group.items || [])]})) : 
          [...items]
        ) : [];
      
      console.log(`SearchableSelect: No search text, showing all ${isGroupedItems ? 
        filteredItems.reduce((count, group) => count + ((group && group.items) ? group.items.length : 0), 0) : 
        filteredItems.length} items`);
    }
    
    // Reset highlighted index whenever items change
    highlightedIndex = -1;
  } catch (error) {
    console.error('SearchableSelect: Error filtering items', error);
    // Fallback to empty array on error
    filteredItems = [];
    highlightedIndex = -1;
  }
}
```

Recommended:
```javascript
// Helper function to filter items based on search text
function filterItems(items, searchText) {
  if (!searchText || searchText.trim() === '') {
    return Array.isArray(items) ? [...items] : [];
  }
  
  const searchLower = searchText.toLowerCase();
  
  return Array.isArray(items) ? items.filter(item => {
    if (!item || !item[labelField]) return false;
    
    const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
    const secondaryMatch = secondaryField && item[secondaryField] && 
                         item[secondaryField].toLowerCase().includes(searchLower);
    return primaryMatch || secondaryMatch;
  }) : [];
}

// Helper function to filter and group items
function filterGroupedItems(flattenedItems, searchText) {
  const filteredFlat = filterItems(flattenedItems, searchText);
  
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
  return Object.keys(groupedFiltered).map(label => ({
    type: 'group',
    label,
    items: groupedFiltered[label]
  }));
}

// Helper function to make a defensive copy of grouped items
function copyGroupedItems(items) {
  return Array.isArray(items) 
    ? items.map(group => ({...group, items: [...(group.items || [])]}))
    : [];
}

// Update filtered items when items or searchText changes
$: {
  try {
    console.log('SearchableSelect: Filtering items with searchText:', searchText);
    
    const shouldFilter = searchText && searchText.trim() !== '' && 
                        (!value || searchText !== getDisplayText(value));
    
    if (shouldFilter) {
      if (isGroupedItems) {
        filteredItems = filterGroupedItems(flattenedItems, searchText);
        console.log(`SearchableSelect: Filtered to ${filteredItems.length} groups`);
      } else {
        filteredItems = filterItems(items, searchText);
        console.log(`SearchableSelect: Filtered to ${filteredItems.length} items`);
      }
    } else {
      // No search text, show all items
      filteredItems = isGroupedItems ? copyGroupedItems(items) : (Array.isArray(items) ? [...items] : []);
      
      const itemCount = isGroupedItems 
        ? filteredItems.reduce((count, group) => count + ((group && group.items) ? group.items.length : 0), 0)
        : filteredItems.length;
      
      console.log(`SearchableSelect: No search text, showing all ${itemCount} items`);
    }
    
    // Reset highlighted index whenever items change
    highlightedIndex = -1;
  } catch (error) {
    console.error('SearchableSelect: Error filtering items', error);
    // Fallback to empty array on error
    filteredItems = [];
    highlightedIndex = -1;
  }
}
```

## 3. Architecture & Design

### 3.1 Inconsistent Caching Strategy - Medium
- **Location**: `pokeDataService.js` and `db.js`
- **Description**: The caching strategy is complex with different approaches for different types of data (current sets vs. legacy sets).
- **Impact**: Makes the code harder to understand and maintain, and could lead to inconsistent user experiences.
- **Recommendation**: Simplify and standardize the caching approach, especially as the project moves to a cloud-based architecture with Redis.

### 3.2 Tight Coupling Between Components - Medium
- **Location**: `App.svelte`
- **Description**: The main App component directly manages many aspects of the application state and logic.
- **Impact**: Makes the component harder to test and maintain.
- **Recommendation**: Consider implementing a more formal state management approach (like stores in Svelte) to decouple UI components from business logic.

### 3.3 Complex State Management in App.svelte - High ✅ FIXED
- **Location**: `App.svelte`
- **Description**: The main App component manages too much state and logic directly, including set selection, card selection, pricing data fetching, and error handling.
- **Impact**: Makes the application harder to scale and maintain as new features are added.
- **Solution Implemented (2025-05-02)**: Refactored App.svelte to use Svelte stores for state management by:
  - Created dedicated store modules for different types of state (sets, cards, pricing, UI)
  - Extracted business logic from App.svelte into appropriate store modules
  - Implemented reactive state using Svelte stores
  - Created clear separation of concerns with store-specific actions
  - Reduced code size in App.svelte by approximately 60%
  - Created a clear, unidirectional data flow between components and stores

**Implementation Details**:
- Created `setStore.js` to manage set data, selection, and loading
- Created `cardStore.js` to manage card data, selection, and loading
- Created `priceStore.js` to manage price data fetching and formatting
- Created `uiStore.js` to manage UI state, errors, network status, and background tasks
- Modified App.svelte to use these stores and subscribe to their state changes
- Converted direct bindings to store subscriptions with the $ syntax
- Updated event handlers to use store actions instead of local methods
- Simplified lifecycle methods by moving logic to appropriate stores

## 4. Documentation & Comments

### 4.1 Inconsistent JSDoc Comments - Low
- **Location**: Throughout the codebase
- **Description**: Some functions have detailed JSDoc comments while others have minimal or no documentation.
- **Impact**: Makes it harder for new developers to understand the code.
- **Recommendation**: Standardize the approach to function documentation, especially for public APIs and complex functions.

### 4.2 Missing Architecture Documentation - Medium
- **Location**: Project-wide
- **Description**: While there's good documentation in the memory-bank, there's limited documentation about the overall architecture within the code itself.
- **Impact**: Makes it harder to understand how components interact and the overall system design.
- **Recommendation**: Add high-level architecture documentation, possibly as comments in key files or as a dedicated architecture.md file.

## 5. Package & Dependency Management

### 5.1 Outdated Dependencies - High
- **Location**: `package.json`
- **Description**: Several dependencies are significantly outdated, including Svelte (3.38.3 vs. current 5.x), Rollup, and various plugins.
- **Impact**: Missing out on performance improvements, bug fixes, and new features. Could lead to security vulnerabilities.
- **Recommendation**: Implement the planned dependency update strategy outlined in the progress.md file, starting with non-breaking updates.

**Example**:

Current:
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
  },
  "dependencies": {
    "sirv-cli": "1.0.0"
  },
  "packageManager": "pnpm@8.15.4"
}
```

Recommended (phased approach):
```json
// Phase 1: Update non-breaking dependencies
{
  "devDependencies": {
    "@rollup/plugin-commonjs": "17.0.0",
    "@rollup/plugin-node-resolve": "11.0.0",
    "@rollup/plugin-replace": "6.0.2",
    "dotenv": "16.5.0",
    "rimraf": "3.0.2",
    "rollup": "2.30.0",
    "rollup-plugin-css-only": "3.1.0",
    "rollup-plugin-livereload": "2.0.5",
    "rollup-plugin-svelte": "7.2.2",
    "rollup-plugin-terser": "7.0.2",
    "svelte": "3.38.3"
  },
  "dependencies": {
    "sirv-cli": "1.0.0"
  },
  "packageManager": "pnpm@10.9.0"
}

// Phase 2: Update major versions with breaking changes
{
  "devDependencies": {
    "@rollup/plugin-commonjs": "28.0.3",
    "@rollup/plugin-node-resolve": "16.0.1",
    "@rollup/plugin-replace": "6.0.2",
    "dotenv": "16.5.0",
    "rimraf": "3.0.2",
    "rollup": "4.40.0",
    "rollup-plugin-css-only": "4.5.2",
    "rollup-plugin-livereload": "2.0.5",
    "rollup-plugin-svelte": "7.2.2",
    "rollup-plugin-terser": "7.0.2",
    "svelte": "4.2.12"  // Update to Svelte 4 first before Svelte 5
  },
  "dependencies": {
    "sirv-cli": "3.0.1"
  },
  "packageManager": "pnpm@10.9.0"
}
```

### 5.2 Minimal Production Dependencies - Low
- **Location**: `package.json`
- **Description**: Only sirv-cli is listed as a production dependency, which is unusual for a web application.
- **Impact**: Could lead to missing dependencies in production if the build process doesn't properly include all needed code.
- **Recommendation**: Review the dependency classification to ensure all required runtime dependencies are properly categorized.

## 6. Performance Considerations

### 6.1 Inefficient Data Filtering - Medium
- **Location**: `SearchableSelect.svelte` and `CardSearchSelect.svelte`
- **Description**: Filtering of large datasets is done reactively on the client side without pagination or optimization.
- **Impact**: Could lead to performance issues with large sets of cards.
- **Recommendation**: Implement server-side filtering or pagination, especially as part of the cloud migration.

### 6.2 Multiple Background Timers - Low
- **Location**: `App.svelte`
- **Description**: Multiple setInterval timers for background tasks (sync, cleanup, config update).
- **Impact**: Could impact performance, especially on lower-end devices.
- **Recommendation**: Consider consolidating these into a single background task manager or using a more efficient scheduling approach.

**Example**:

Current:
```javascript
// Start background sync for current sets
function startBackgroundSync() {
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Set up background sync every 24 hours
  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      console.log('Running background sync for current sets...');
      await pokeDataService.preloadCurrentSets();
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Also run once at startup if online
  if (navigator.onLine) {
    setTimeout(async () => {
      console.log('Running initial background sync for current sets...');
      await pokeDataService.preloadCurrentSets();
    }, 5000); // Wait 5 seconds after app load
  }
}

// Start cleanup interval for expired pricing data
function startCleanupInterval() {
  // Clear any existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // Set up cleanup interval every 12 hours
  cleanupInterval = setInterval(async () => {
    console.log('Running cleanup for expired pricing data...');
    await dbService.cleanupExpiredPricingData();
  }, 12 * 60 * 60 * 1000); // 12 hours
  
  // Also run once at startup
  setTimeout(async () => {
    console.log('Running initial cleanup for expired pricing data...');
    await dbService.cleanupExpiredPricingData();
  }, 10000); // Wait 10 seconds after app load
}

// Start configuration update interval
function startConfigUpdateInterval() {
  // Clear any existing interval
  if (configUpdateInterval) {
    clearInterval(configUpdateInterval);
  }
  
  // Set up update interval every 7 days
  configUpdateInterval = setInterval(async () => {
    if (navigator.onLine) {
      console.log('Running scheduled update of current sets configuration...');
      await pokeDataService.updateCurrentSetsConfiguration();
    }
  }, 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Also run once at startup if online
  if (navigator.onLine) {
    setTimeout(async () => {
      console.log('Running initial update of current sets configuration...');
      await pokeDataService.updateCurrentSetsConfiguration();
    }, 15000); // Wait 15 seconds after app load
  }
}
```

Recommended:
```javascript
// Background task manager
class BackgroundTaskManager {
  constructor() {
    this.tasks = new Map();
    this.initialized = false;
  }
  
  // Register a task with a name, interval, and callback
  registerTask(name, intervalMs, callback, runImmediately = false, immediateDelay = 0, requiresOnline = false) {
    // Clear existing task if it exists
    this.clearTask(name);
    
    // Create task object
    const task = {
      name,
      intervalMs,
      callback,
      requiresOnline,
      intervalId: null,
      lastRun: null
    };
    
    // Set up interval
    task.intervalId = setInterval(async () => {
      if (task.requiresOnline && !navigator.onLine) {
        console.log(`Skipping task ${name} because device is offline`);
        return;
      }
      
      console.log(`Running scheduled task: ${name}`);
      try {
        await callback();
        task.lastRun = new Date();
      } catch (error) {
        console.error(`Error running task ${name}:`, error);
      }
    }, intervalMs);
    
    // Store task
    this.tasks.set(name, task);
    
    // Run immediately if requested
    if (runImmediately && (!requiresOnline || navigator.onLine)) {
      setTimeout(async () => {
        console.log(`Running initial task: ${name}`);
        try {
          await callback();
          task.lastRun = new Date();
        } catch (error) {
          console.error(`Error running initial task ${name}:`, error);
        }
      }, immediateDelay);
    }
    
    return this;
  }
  
  // Clear a task by name
  clearTask(name) {
    if (this.tasks.has(name)) {
      const task = this.tasks.get(name);
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
      this.tasks.delete(name);
    }
    return this;
  }
  
  // Clear all tasks
  clearAllTasks() {
    for (const name of this.tasks.keys()) {
      this.clearTask(name);
    }
    return this;
  }
  
  // Get task status
  getTaskStatus(name) {
    if (!this.tasks.has(name)) {
      return null;
    }
    
    const task = this.tasks.get(name);
    return {
      name: task.name,
      lastRun: task.lastRun,
      nextRun: task.lastRun ? new Date(task.lastRun.getTime() + task.intervalMs) : null,
      requiresOnline: task.requiresOnline
    };
  }
}

// Usage in App.svelte
const backgroundTasks = new BackgroundTaskManager();

onMount(() => {
  // Register background tasks
  backgroundTasks
    .registerTask(
      'syncCurrentSets',
      24 * 60 * 60 * 1000, // 24 hours
      async () => await pokeDataService.preloadCurrentSets(),
      true, // Run immediately
      5000, // 5 second delay
      true // Requires online
    )
    .registerTask(
      'cleanupExpiredPricing',
      12 * 60 * 60 * 1000, // 12 hours
      async () => await dbService.cleanupExpiredPricingData(),
      true, // Run immediately
      10000 // 10 second delay
    )
    .registerTask(
      'updateConfiguration',
      7 * 24 * 60 * 60 * 1000, // 7 days
      async () => await pokeDataService.updateCurrentSetsConfiguration(),
      true, // Run immediately
      15000, // 15 second delay
      true // Requires online
    );
});

onDestroy(() => {
  // Clean up all tasks
  backgroundTasks.clearAllTasks();
});
```

## 7. Cross-session AI Integration Issues

### 7.1 Inconsistent Error Handling Approaches - Medium
- **Location**: Various files
- **Description**: Different approaches to error handling across the codebase, some using try/catch with specific error messages, others with generic error handling.
- **Impact**: Inconsistent user experience when errors occur.
- **Recommendation**: Standardize error handling patterns across the application.

### 7.2 Varying Component Styles - Low
- **Location**: Svelte components
- **Description**: Different styling approaches and patterns across components.
- **Impact**: Inconsistent visual appearance and harder maintenance.
- **Recommendation**: Establish and document component styling guidelines, possibly with shared CSS variables or a component library.

## 8. Svelte-Specific Considerations

### 8.1 Reactive Statement Complexity - Medium
- **Location**: `SearchableSelect.svelte`
- **Description**: Complex reactive statements with nested conditionals and error handling.
- **Impact**: Makes the component harder to understand and debug.
- **Recommendation**: Break down complex reactive statements into smaller, more focused functions that can be called from the reactive statement.

### 8.2 Lifecycle Method Usage - Low
- **Location**: `App.svelte`
- **Description**: Heavy reliance on onMount for initialization logic.
- **Impact**: Makes the component initialization harder to understand and test.
- **Recommendation**: Consider breaking initialization into smaller, more focused functions that can be tested independently.

## 9. Project-Specific Checks

### 9.1 Inconsistent Price Formatting - Low
- **Location**: `App.svelte`
- **Description**: Price formatting is handled directly in the component rather than
