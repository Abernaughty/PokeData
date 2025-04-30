# Active Context

## Overview
This document captures the current work focus, recent changes, next steps, active decisions and considerations, important patterns and preferences, and learnings and project insights for the PokeData project.

## Current Work Focus

### Primary Focus
The current primary focus is on transitioning the PokeData application from a client-side architecture to a cloud-based architecture using Azure services:

1. **Planning and implementing cloud architecture migration** to enhance scalability, performance, and reliability.
   - Setting up Azure resources (Cosmos DB, Blob Storage, Redis Cache, Functions, API Management)
   - Designing data migration strategy from client-side to cloud storage
   - Implementing serverless API endpoints with Azure Functions
   - Configuring CDN for optimized image delivery

2. **Implementing hybrid API approach** to leverage multiple data sources.
   - Using Pokémon TCG API as primary source for card metadata and images
   - Leveraging PokeData API for enhanced pricing data and graded card values
   - Normalizing data from different sources for consistent presentation
   - Implementing proper error handling and fallbacks

3. **Enhancing data model** to support more comprehensive card information.
   - Designing Cosmos DB document structure for card metadata and pricing
   - Supporting multiple pricing sources and graded card values
   - Implementing timestamp tracking for data freshness
   - Creating efficient indexing strategy for query performance

4. **Optimizing caching strategy** with Azure Cache for Redis.
   - Implementing Redis caching for frequently accessed data
   - Designing cache invalidation strategy for data freshness
   - Configuring tiered caching approach for different data types
   - Monitoring cache performance and optimizing as needed

### Secondary Focus
While the primary focus is on the cloud architecture migration, we're also addressing:

1. **Improving error handling** to provide better user feedback when API calls fail.
   - Implementing more specific error messages
   - Adding visual indicators for different error states
   - Creating fallback mechanisms for common error scenarios
   - Ensuring consistent error handling across the application

2. **Adding card images in price results** to provide visual confirmation and additional context.
   - Integrating card image URLs from the API
   - Implementing image loading states and fallbacks
   - Optimizing image loading for performance via CDN
   - Ensuring responsive image display across devices

3. **Implementing price history graphs** to show price trends over time.
   - Designing the graph component
   - Integrating historical pricing data
   - Creating interactive visualization
   - Implementing date range selection

## Recent Changes

1. **Implemented Azure Function Service Classes** (2025-04-30):
   - Implemented CosmosDbService with Azure Cosmos DB SDK integration
   - Created BlobStorageService with Azure Storage Blob SDK integration
   - Developed RedisCacheService with Redis client integration
   - Updated PokemonTcgApiService with Axios for API calls
   - Set up GitHub Actions workflow for automated deployment
   - Created deployment guide for Azure resources
   - Result: Fully functional service implementations ready for Azure deployment

2. **Implemented Azure Functions v4 Programming Model** (2025-04-29):
   - Refactored Azure Functions to use the correct v4 programming model
   - Created a central entry point (src/index.ts) for function registration
   - Implemented shared service initialization for better performance
   - Refactored individual function handlers to use shared services
   - Fixed "A function can only be registered during app startup" error
   - Tested all endpoints to verify functionality
   - Result: Working Azure Functions with proper v4 programming model implementation

2. **Defined Cloud Architecture Plan** (2025-04-29):
   - Designed comprehensive cloud-based architecture using Azure services
   - Selected Cosmos DB for card metadata and pricing information
   - Planned Blob Storage with CDN for card images
   - Specified Redis Cache for performance optimization
   - Defined Azure Functions for API endpoints and background processing
   - Configured API Management as unified gateway
   - Result: Clear roadmap for transitioning from client-side to cloud architecture

2. **Designed Hybrid API Approach** (2025-04-29):
   - Planned integration of Pokémon TCG API for metadata and images
   - Specified PokeData API for enhanced pricing data
   - Designed data normalization strategy
   - Created fallback mechanisms for API failures
   - Result: More comprehensive data strategy leveraging multiple sources

3. **Enhanced Data Model Design** (2025-04-29):
   - Created Cosmos DB document structure for card data
   - Added support for graded card values (PSA, CGC)
   - Included multiple pricing sources in a single document
   - Added timestamp tracking for data freshness
   - Result: More comprehensive data model supporting advanced features

4. **Fixed Logger Formatting Issues** (2025-04-27):
   - Identified issue where CSS styling information was appearing directly in console log output
   - Refactored the formatLogArgs function in loggerService.js to properly handle styling parameters
   - Updated all logging methods to use the new formatting approach
   - Added test function in main.js to verify the logger formatting changes
   - Maintained caller information in logs for debugging context
   - Result: Console logs now display properly formatted without showing CSS styling code

5. **Fixed Debug System Issues** (2025-04-27):
   - Fixed context loggers in loggerService.js to include specialized methods like logDbOperation
   - Corrected debug configuration exports in debug-config.js to avoid duplicate exports
   - Updated window.pokeDataDebug object in main.js to use directly imported functions
   - Simplified the help function to use a single console.log with a multi-line string
   - Fixed debug panel button functionality for enabling/disabling debug mode
   - Ensured log level buttons work correctly in the debug panel
   - Result: Debug panel now works correctly, and all debug functions operate as expected

6. **Fixed CSS Loading and API Authentication Issues** (2025-04-27):
   - Enhanced CORS proxy implementation to properly handle authentication headers
   - Improved CSS loading sequence to ensure styles are fully loaded before app initialization
   - Added localStorage backup for database version to prevent unnecessary resets
   - Implemented a more robust caching strategy with proper timestamps and TTL
   - Created rebuild scripts to ensure proper application rebuilding
   - Added detailed logging for API requests and CSS loading
   - Result: Application now loads properly with correct styling even when API calls fail

7. **Fixed Error When Clearing Set Selection** (2025-04-26):
   - Modified the handleSetSelect function to properly handle null selections
   - Added specific logic to clear card-related state when set selection is cleared
   - Prevented error message from showing when clearing a selection
   - Improved user experience by allowing users to clear selections without errors
   - Result: Users can now clear the set selection without seeing an error message

8. **Improved Clear Button Design in Search Components** (2025-04-26):
   - Replaced custom SVG X with Material Design close icon for better quality and centering
   - Increased spacing between clear button and dropdown arrow for improved visual separation
   - Updated both SearchableSelect and CardSearchSelect components for consistency
   - Improved CSS styling with proper padding and box-sizing
   - Result: More polished user interface with better visual clarity and professional appearance

9. **Simplified API Authentication Approach** (2025-04-25):
   - Implemented hardcoded subscription key in apiConfig.js instead of using environment variables
   - Removed API key since authentication is handled by API Management service
   - Updated getHeaders() method to only include subscription key header
   - Modified rollup.config.cjs to remove environment variable replacements for API credentials
   - Updated debug tools to reflect the simplified approach
   - Result: Simplified development workflow while maintaining security through API Management restrictions

10. **Created run-app.bat file and updated README.md** (2025-04-25):
    - Created run-app.bat script to simplify application startup
    - Updated README.md with PowerShell command equivalents for all bash commands
    - Corrected repository URL to https://github.com/Abernaughty/PokeData
    - Enhanced documentation with more detailed dependency descriptions
    - Expanded features and project structure sections in README.md
    - Result: Improved documentation and easier application startup for users

11. **Fixed database reset issue causing problems with multiple tabs** (2025-04-25):
    - Identified issue where database was being reset on every page load
    - Replaced reset script with version check script that only resets when necessary
    - Implemented proper database version comparison logic
    - Added error handling for database operations
    - Added logging for database version checks
    - Result: Database now persists properly across page reloads and multiple tabs

12. **Fixed CSS loading and JavaScript syntax issues** (2025-04-25):
    - Improved CSS loading sequence to ensure proper styling
    - Enhanced error handling in SearchableSelect component
    - Fixed JavaScript syntax error in app initialization
    - Implemented proper script loading sequence with error handling
    - Added CSS loading check before app initialization
    - Separated database check and CSS loading into distinct phases
    - Added fallback for script loading errors
    - Result: Application now loads reliably with proper styling and without JavaScript errors

13. **Implemented set grouping by expansion in dropdown menu** (2025-04-25):
    - Created expansionMapper service to categorize sets by expansion
    - Modified SearchableSelect component to support grouped items
    - Implemented indentation for sets under expansion headers
    - Removed bullet points while keeping indentation for cleaner UI
    - Added sticky headers for expansion groups in the dropdown
    - Improved dropdown styling with Pokémon-themed colors
    - Enhanced keyboard navigation for grouped items
    - Result: Sets are now organized by expansion series (Scarlet & Violet, Sword & Shield, etc.) for easier navigation

14. **Moved PokeData project to a new repository location** (2025-04-25):
    - Moved the repository from `C:\Users\maber\Documents\GitHub\git-maber\PokeData-repo` to `C:\Users\maber\Documents\GitHub\PokeData`
    - Renamed the repository from "PokeData-repo" to "PokeData"
    - Created GitHub repository at https://github.com/Abernaughty/PokeData
    - Preserved the memory-bank documentation in the new repository
    - Installed all dependencies using npm
    - Verified the application works correctly in the new repository
    - Tested core functionality (set selection, card search, price display)
    - Identified outdated dependencies for future updates
    - Note: The directory at `C:\Users\maber\Documents\GitHub\git-maber\PokeData` is a separate static web app workflow directory and should not be modified unless explicitly requested
    - Result: Successfully created a standalone PokeData repository with full functionality in a cleaner location

15. **Converted Card Name field to use SearchableSelect component** (2025-03-16):
    - Replaced basic input field with SearchableSelect component
    - Implemented dynamic loading of cards when a set is selected
    - Added filtering and search functionality for card names
    - Improved user experience with dropdown selection
    - Enhanced keyboard navigation and accessibility
    - Result: Users can now more easily find and select cards within a set

16. **Filtered Zero-Value Pricing Results** (2025-03-16):
    - Added logic to filter out pricing sources with $0 or null values
    - Implemented safety checks for null/undefined pricing data
    - Created a dedicated function for filtering valid prices
    - Applied filtering to both API and mock data
    - Added logging for filtered pricing data
    - Result: Pricing results now only show relevant, non-zero values, reducing confusion

17. **Formatted Price Decimal Places** (2025-03-16):
    - Implemented toFixed(2) formatting for consistent decimal display
    - Created a formatPrice utility function
    - Applied formatting to all price displays
    - Ensured proper handling of null/undefined values
    - Added safety checks to prevent NaN errors
    - Result: All prices now display with 2 decimal places for consistency

18. **Enhanced error handling for API failures** (2025-03-10):
    - Improved error catching in API requests
    - Added more detailed error logging
    - Implemented fallback to mock data when API fails
    - Added user-friendly error messages
    - Result: Application now gracefully handles API failures with clear user feedback

19. **Optimized set list loading** (2025-03-05):
    - Improved caching of set list data
    - Added sorting by release date
    - Ensured all sets have unique IDs
    - Fixed issues with missing set codes
    - Added fallback to imported data when API fails
    - Result: Set list loads faster and more reliably, with better organization

20. **Improved card variant handling** (2025-02-28):
    - Enhanced CardVariantSelector component
    - Added support for multiple variant types
    - Implemented variant confirmation workflow
    - Connected variant selection to pricing data
    - Result: Users can now select specific card variants for more accurate pricing

## Next Steps

### Immediate Next Steps
1. **Infrastructure Setup**:
   - Create Azure resource group for PokeData project
   - Provision Cosmos DB instance with appropriate configuration
   - Set up Blob Storage containers for card images
   - Configure Azure Cache for Redis
   - Deploy initial Azure Functions
   - Set up API Management service

2. **Data Migration Planning**:
   - Design migration strategy from IndexedDB to Cosmos DB
   - Create data mapping between current and new schemas
   - Develop migration scripts and utilities
   - Plan for data validation and verification

3. **API Development**:
   - Implement Azure Functions for card queries
   - Set up APIM policies for external API calls
   - Configure caching rules and rate limiting
   - Develop error handling and logging

4. **Frontend Adaptation**:
   - Modify frontend to use new Azure-based APIs
   - Update data fetching logic to work with new endpoints
   - Implement progressive loading for images via CDN
   - Adapt caching strategy to work with Redis

### Short-term Goals (1-2 weeks)
1. **Data Ingestion**:
   - Create Azure Function to fetch initial data from both APIs
   - Populate Cosmos DB with combined card data
   - Upload card images to Blob Storage
   - Implement data validation and cleanup

2. **Optimize Caching Strategy**:
   - Configure Redis for optimal caching of frequently accessed data
   - Implement cache invalidation rules
   - Set up monitoring for cache performance
   - Create cache management utilities

3. **Enhance Error Handling**:
   - Implement comprehensive error handling in Azure Functions
   - Create fallback mechanisms for API failures
   - Add detailed logging and monitoring
   - Develop user-friendly error messages

4. **Implement CDN for Images**:
   - Configure Azure CDN for Blob Storage
   - Set up caching rules for optimal performance
   - Implement image optimization
   - Add responsive image loading

### Medium-term Goals (2-4 weeks)
1. **Price History Implementation**:
   - Design time-series data storage in Cosmos DB
   - Implement data collection for historical prices
   - Create graph visualization components
   - Add date range selection UI

2. **Collection Management Feature**:
   - Design data structure for collection items
   - Create UI components for collection management
   - Implement storage for collection data
   - Add collection statistics and valuation

3. **Advanced Search Capabilities**:
   - Implement full-text search across card names
   - Add filtering by rarity, price range, etc.
   - Create advanced search UI
   - Optimize search performance

## Active Decisions and Considerations

### Architecture Decisions
1. **Cloud Architecture Migration**: Transitioning from client-side to Azure-based cloud architecture.
   - Pros: Better scalability, performance, reliability, and feature capabilities
   - Cons: Increased complexity, operational costs, and deployment considerations
   - Decision: Proceed with cloud migration to enable advanced features and better performance
   - Implementation: Phased approach starting with core infrastructure and data migration

2. **Hybrid API Approach**: Using both Pokémon TCG API and PokeData API.
   - Pros: More comprehensive data, better image quality, enhanced pricing information
   - Cons: Increased complexity, multiple points of failure, data normalization challenges
   - Decision: Implement hybrid approach to leverage strengths of both APIs
   - Implementation: Use Pokémon TCG API for metadata and images, PokeData API for enhanced pricing

3. **Cosmos DB for Data Storage**: Using Cosmos DB instead of client-side IndexedDB.
   - Pros: Scalable, globally distributed, flexible schema, automatic indexing
   - Cons: Cost considerations, more complex implementation
   - Decision: Proceed with Cosmos DB to enable advanced querying and scaling
   - Implementation: JSON document model with optimized indexing for card queries

4. **CDN for Image Delivery**: Using Azure CDN connected to Blob Storage.
   - Pros: Faster image loading, reduced latency, improved user experience
   - Cons: Additional configuration, potential cost
   - Decision: Implement CDN for optimal image delivery
   - Implementation: Connect CDN to Blob Storage with appropriate caching rules

5. **Redis for Caching**: Using Azure Cache for Redis instead of browser caching.
   - Pros: Faster response times, shared cache across users, better control
   - Cons: Additional service to manage, cost considerations
   - Decision: Implement Redis caching for frequently accessed data
   - Implementation: Cache set lists, card lists, and popular card data with appropriate TTL

### Design Considerations
1. **UI/UX Approach**:
   - Focus on simplicity and efficiency
   - Progressive disclosure of information
   - Clear visual hierarchy
   - Consistent feedback for user actions

2. **Visual Design**:
   - Pokémon-themed color palette (blue, red, white)
   - Clean, card-based layout
   - Responsive design with mobile-first approach
   - Accessible contrast and typography

### Technical Considerations
1. **Performance Optimization**:
   - CDN for image delivery
   - Redis caching for API responses
   - Optimized Cosmos DB queries
   - Efficient frontend rendering

2. **Error Handling**:
   - Comprehensive error handling in Azure Functions
   - Fallback mechanisms for API failures
   - Detailed logging and monitoring
   - User-friendly error messages

3. **Cost Management**:
   - Serverless compute where possible
   - Tiered storage approach (hot/cool)
   - Optimized caching to reduce API calls
   - Monitoring and alerts for cost control

4. **Security Considerations**:
   - Proper authentication and authorization
   - Secure API Management policies
   - Data encryption at rest and in transit
   - Monitoring for security events

## Important Patterns and Preferences

### Code Quality and Review
1. **Comprehensive Code Review Process**:
   - Periodic code reviews using the comprehensive prompt in `memory-bank/codeReviewPrompt.md`
   - Focus on identifying technical debt, debugging artifacts, and inconsistencies
   - Particular attention to cross-session AI integration issues
   - Standardized review format with actionable recommendations
   - Integration with development workflow at key milestones

### Cloud Architecture Patterns
1. **Microservices Pattern**:
   - Separate Azure Functions for different capabilities
   - Independent scaling and deployment
   - Clear service boundaries
   - API-driven communication

2. **CQRS Pattern**:
   - Separate read and write operations
   - Optimized query paths
   - Event-driven updates
   - Eventual consistency where appropriate

3. **Cache-Aside Pattern**:
   - Check cache before database
   - Update cache on database changes
   - TTL-based cache invalidation
   - Background refresh for popular items

4. **Circuit Breaker Pattern**:
   - Prevent cascading failures
   - Graceful degradation
   - Automatic recovery
   - Fallback mechanisms

### Code Organization
1. **File Structure**:
   - Components in src/components/
   - Services in src/services/
   - Data utilities in src/data/
   - Main application in App.svelte
   - New expansionMapper service in src/services/

2. **Naming Conventions**:
   - PascalCase for component files (SearchableSelect.svelte)
   - camelCase for JavaScript files (pokeDataService.js)
   - camelCase for functions and variables
   - Descriptive, action-oriented function names

3. **Component Structure**:
   ```
   src/
   ├── components/       # UI components
   │   ├── CardSearchSelect.svelte
   │   ├── CardVariantSelector.svelte
   │   ├── SearchableInput.svelte
   │   └── SearchableSelect.svelte
   ├── data/             # Static data and configuration
   │   ├── apiConfig.js
   │   ├── prismaticEvolutionsCards.js
   │   └── setList.js
   ├── services/         # Business logic and API services
   │   ├── pokeDataService.js
   │   └── storage/
   │       └── db.js
   ├── App.svelte        # Main application component
   ├── corsProxy.js      # CORS proxy utility
   ├── debug-env.js      # Debugging utilities
   └── main.js           # Application entry point
   ```

### Coding Patterns
1. **Service Pattern**:
   - Centralized services for data operations
   - Clear separation from UI components
   - Consistent error handling
   - Caching and optimization

2. **Component Composition**:
   - Small, focused components
   - Props for configuration
   - Events for communication
   - Slots for content projection

3. **Error Handling**:
   - Try/catch blocks for async operations
   - Fallback data when APIs fail
   - User-friendly error messages
   - Detailed console logging

4. **Caching Strategy**:
   - Redis for server-side caching
   - TTL (Time To Live) for cache invalidation
   - Prioritized caching for frequently accessed data
   - Background refresh for critical data

### Styling Approach
1. **CSS Organization**:
   - Component-scoped styles in Svelte
   - Global styles in public/global.css
   - Consistent color variables
   - Mobile-first responsive design

2. **Design Elements**:
   - Card-based UI components
   - Consistent spacing and typography
   - Pokémon-themed color palette
   - Clear visual hierarchy

## Learnings and Project Insights

We've gained several insights during the implementation and planning:

1. **Cloud Architecture Benefits**: Moving to a cloud-based architecture provides significant advantages in scalability, reliability, and feature capabilities compared to client-side only approaches.

2. **Hybrid API Value**: Leveraging multiple APIs allows us to combine the strengths of each, providing more comprehensive data and better user experience.

3. **Data Model Importance**: A well-designed data model is critical for supporting advanced features like graded card values and price history.

4. **Caching Strategy Complexity**: Effective caching requires a multi-tiered approach with different strategies for different data types and access patterns.

5. **Expansion Grouping Value**: Organizing sets by expansion series significantly improves user navigation and reduces cognitive load when searching for specific sets.

6. **Repository Management**: Creating a standalone repository for the project improves focus and clarity but requires careful setup to ensure all dependencies and configurations are properly transferred.

7. **Dependency Management**: The project has several outdated dependencies, including major version updates (Svelte 3.x to 5.x). Updating these requires careful planning and incremental testing to avoid breaking changes.

8. **API Integration Challenges**: Working with external card pricing APIs presents challenges with inconsistent data formats, requiring robust parsing and normalization.

9. **Search UX Importance**: The two-step search process (set then card) significantly improves user experience compared to a single search field.

10. **Error Handling Significance**: Comprehensive error handling with user-friendly messages and fallbacks is crucial for maintaining a positive user experience.

11. **Performance Considerations**: Large datasets of card information require optimization techniques like pagination, filtering, and efficient rendering.

12. **Component Reusability**: Investing in reusable components like SearchableSelect pays dividends across the application.

13. **Variant Handling Complexity**: Pokémon cards often have multiple variants with different pricing, requiring special handling in the UI and data model.

14. **Offline Support Value**: Users appreciate the ability to access previously viewed data when offline or when APIs are unavailable.

15. **Feedback Importance**: Clear loading states, error messages, and success indicators significantly improve user confidence in the application.

16. **Data Normalization Necessity**: Different API responses require normalization to provide a consistent user experience.

17. **UI Organization Importance**: Hierarchical organization of data (like grouping sets by expansion) significantly improves usability for large datasets.

18. **Component Flexibility**: Designing components to handle both flat and hierarchical data structures (like SearchableSelect) provides greater reusability across the application.

19. **Development Server Workflow**: The development server has specific behavior patterns that affect the workflow:
    - The server is configured to run on port 3000, which is whitelisted in the APIM configuration
    - If port 3000 is already in use (by a previous instance of the dev server), it will choose a different port
    - Using a different port causes issues because it's not whitelisted in the APIM configuration
    - When developing, it's important to check if the server is already running on port 3000 before starting a new one
    - If it's already running, use the existing server instead of starting a new one
    - If a restart is needed, ensure the previous server is fully stopped before starting a new one
    - Livereload functionality works correctly when using the proper development workflow (`pnpm dev`)

20. **Cost Management Importance**: Cloud services require careful cost management strategies, including serverless compute, tiered storage, and optimized caching to control operational expenses.

---
*This document was updated on 4/29/2025 as part of the Memory Bank update for the PokeData project.*
