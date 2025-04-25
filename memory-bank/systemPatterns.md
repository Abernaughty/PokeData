# System Patterns

## Overview
This document outlines the system architecture, key technical decisions, design patterns, component relationships, and critical implementation paths for the PokeData project.

## System Architecture

### High-Level Architecture
The PokeData application follows a client-side architecture with a focus on offline capabilities and efficient data retrieval:

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

### Component Layer
- **UI Components**: Svelte components for user interface elements
- **Form Controls**: Specialized input components like SearchableSelect
- **Results Display**: Components for showing pricing data
- **Modal Dialogs**: Components like CardVariantSelector for additional interactions

### Service Layer
- **pokeDataService**: Core service for fetching and processing card data
- **dbService**: Service for managing local storage and caching
- **corsProxy**: Utility for handling CORS issues with external APIs

### Data Layer
- **IndexedDB**: Browser-based database for persistent storage
- **API Integration**: Connection to external pricing APIs
- **Mock Data**: Fallback data for development and offline use

### External Integration
- **Card Pricing APIs**: External services providing pricing data
- **CORS Proxy**: Middleware for handling cross-origin requests
- **Browser Storage**: IndexedDB for persistent data caching

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

### Data Flow
1. User selects a set from the SearchableSelect dropdown
2. App loads cards for the selected set (from cache or API)
3. User selects a card from the CardSearchSelect dropdown
4. App fetches pricing data for the selected card (from cache or API)
5. Results are displayed with formatted pricing information

## Key Technical Decisions

### 1. Svelte as Frontend Framework
- **Rationale**: Lightweight, reactive framework with excellent performance characteristics
- **Alternatives Considered**: React, Vue.js
- **Trade-offs**: Smaller ecosystem than React, but better performance and simpler state management

### 2. IndexedDB for Caching
- **Rationale**: Provides robust, persistent storage with larger capacity than localStorage
- **Alternatives Considered**: localStorage, sessionStorage
- **Trade-offs**: More complex API but better performance and storage capacity

### 3. CORS Proxy Implementation
- **Rationale**: Necessary to handle cross-origin requests to external APIs
- **Alternatives Considered**: Server-side API, third-party CORS proxies
- **Trade-offs**: Added complexity but enables client-side only architecture

### 4. Two-Step Search Process
- **Rationale**: Improves user experience by breaking down the search into manageable steps
- **Alternatives Considered**: Single search field with autocomplete
- **Trade-offs**: Additional step in the process but more structured and efficient search

### 5. Client-Side Only Architecture
- **Rationale**: Simplifies deployment and enables offline functionality
- **Alternatives Considered**: Full-stack application with backend API
- **Trade-offs**: Limited by browser capabilities but easier to deploy and maintain

## Design Patterns

### 1. Service Pattern
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

### 2. Repository Pattern
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

### 3. Component Composition
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

### 4. Event Delegation
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

### 5. Adapter Pattern
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

## Component Relationships

### Component Hierarchy
```
App.svelte
├── SearchableSelect (Set Selection)
├── CardSearchSelect (Card Selection)
│   └── SearchableSelect (Base Component)
├── CardVariantSelector (Variant Selection Modal)
└── Results Display (Pricing Information)
```

### Data Flow Between Components
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

### State Management
- **App.svelte**: Manages the main application state
  - selectedSet: Currently selected Pokémon card set
  - selectedCard: Currently selected card
  - priceData: Pricing data for the selected card
  - isLoading: Loading state flags
  - error: Error state and messages

- **SearchableSelect.svelte**: Manages its own internal state
  - searchTerm: Current search input
  - filteredItems: Items filtered by search
  - isOpen: Dropdown open/closed state

- **CardVariantSelector.svelte**: Manages variant selection state
  - selectedVariant: Currently selected variant
  - isVisible: Modal visibility state

## Critical Implementation Paths

### 1. Initial Data Loading
1. App.svelte mounts and initializes
2. onMount hook triggers loading of set list
3. pokeDataService.getSetList() is called
4. dbService checks for cached set list
5. If cache miss, API request is made
6. Set list is processed and stored in cache
7. Set list is displayed in the UI

### 2. Card Search Flow
1. User selects a set from the dropdown
2. handleSetSelect event handler is triggered
3. loadCardsForSet() is called with the selected set
4. pokeDataService.getCardsForSet() fetches cards
5. Cards are processed and stored in cache
6. Card list is displayed in CardSearchSelect

### 3. Price Retrieval Flow
1. User selects a card and clicks "Get Price"
2. fetchCardPrice() is called
3. pokeDataService.getCardPricing() fetches pricing data
4. Pricing data is processed (filtering zero values)
5. Pricing data is stored in cache
6. Results are displayed in the UI

### 4. Error Handling Path
1. API request is made
2. Error occurs during fetch
3. try/catch block captures the error
4. Error state is updated with message
5. UI displays error message
6. Fallback to mock data if available

## Performance Considerations

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

## Security Considerations

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

## Future Architecture Considerations

1. **Collection Management**:
   - Local storage for user collections
   - Data structure for collection items
   - CRUD operations for collection management
   - Collection statistics and valuation

2. **Price History**:
   - Time-series data storage
   - Graph visualization components
   - Historical data API integration
   - Date range selection UI

3. **Dark Mode**:
   - Theme system with CSS variables
   - User preference persistence
   - Smooth theme transitions
   - Consistent styling across themes

4. **Responsive Enhancements**:
   - Optimized mobile layouts
   - Touch-friendly interactions
   - Adaptive component rendering
   - Performance optimizations for mobile devices

---
*This document was created on 4/25/2025 as part of the Memory Bank initialization for the PokeData project.*
