# Active Context
# Active Context

## Overview
This document captures the current work focus, recent changes, next steps, active decisions and considerations, important patterns and preferences, and learnings and project insights for the PokeData project.

## Current Work Focus

### Primary Focus
The current primary focus is on transitioning the PokeData application from a client-side architecture to a cloud-based architecture using Azure services:

1. **Implementing cloud architecture migration** to enhance scalability, performance, and reliability.
   - Setting up Azure resources (Cosmos DB, Blob Storage, Redis Cache, Functions, API Management)
   - Implementing serverless API endpoints with Azure Functions (completed initial version)
   - Designing frontend adaptation strategy for cloud APIs
   - Planning the migration from IndexedDB to Cosmos DB and Redis Cache
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
   - Implementing Redis caching for frequently accessed data (completed for Azure Functions)
   - Designing cache invalidation strategy for data freshness
   - Configuring tiered caching approach for different data types
   - Monitoring cache performance and optimizing as needed
   - Testing and confirming on-demand population of card data for older sets

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

1. **Fixed Expansion Grouping in Dropdown Menu** (2025-05-14):
   - Identified issue with expansion grouping in dropdown where each expansion only showed its name again instead of the actual sets
   - Discovered format mismatch between backend and frontend for grouped sets
   - Backend format: `[{type: 'group', name: 'X', items: [...]}, ...]`
   - Frontend expected format: `{'X': [...], 'Y': [...], ...}`
   - Added transformation logic in cloudDataService.getSetList() to convert between formats
   - Implemented detection of grouped sets in API response
   - Added detailed logging to track the transformation process
   - Result: Expansion headers now correctly show all sets under each expansion in the dropdown

2. **Integrated Feature Flag Controls into Debug Panel** (2025-05-14):
   - Identified issue with standalone FeatureFlagDebugPanel component not displaying properly
   - Integrated feature flag controls directly into the existing debug panel UI
   - Modified src/debug/panel/ui.js to add a new "Feature Flags" section with checkboxes for Cloud API, Cloud Images, and Cloud Caching
   - Added "Apply Changes" and "Reset All Flags" buttons that use the featureFlagService
   - Removed the standalone FeatureFlagDebugPanel component from App.svelte
   - Fixed several issues with process.env.NODE_ENV references throughout the codebase that were causing errors during the build process
   - Result: Unified debugging interface with all controls in one place, providing better organization and consistent styling

2. **Confirmed Azure Function and CosmosDB Integration** (2025-05-02):
   - Tested and validated the Azure Function app architecture with CosmosDB
   - Confirmed proper communication between Azure Functions and CosmosDB
   - Verified on-demand population strategy for card data in CosmosDB
   - Clarified the difference between Set ID and Set Code in API endpoints
   - Tested the retrieval of cards for older sets and confirmed database population
   - Developed detailed migration strategy for frontend adaptation
   - Result: Established clear path for client-side to cloud migration with minimal user disruption

2. **Updated Dependencies and Migrated to Svelte 4** (2025-05-02):
   - Updated Svelte from 3.38.3 to 4.2.19 (latest stable in 4.x series)
   - Updated key Rollup plugins to their latest compatible versions:
     - Rollup from 2.30.0 to 2.79.2
     - @rollup/plugin-commonjs from 17.0.0 to 21.1.0
     - @rollup/plugin-node-resolve from 11.0.0 to 13.3.0
   - Fixed accessibility issues in components to comply with Svelte 4's stricter requirements
   - Enhanced keyboard navigation and screen reader support in SearchableSelect, CardSearchSelect, and CardVariantSelector components
   - Added proper ARIA roles and attributes throughout the application
   - Documented the phased approach in dependency-updates.md
   - Result: Application now uses modern framework with improved accessibility while maintaining all functionality

2. **Removed Programmatic Fallback Data Generation** (2025-05-02):
   - Removed code in `App.svelte` that generated dummy card data when API calls failed
   - Added clear error message when no cards are found for a set
   - Improved user experience by showing accurate error messages instead of misleading dummy data
   - Result: Users now only see real data from the API, with clear error messages when data is unavailable

2. **Removed Mock Data Directory** (2025-05-02):
   - Deleted `public/mock/pricing-response.json` and `public/mock/search-response.json` files
   - Removed the now-empty `public/mock` directory
   - Verified no references to these files remain in the codebase
   - Confirmed that the application code had already been updated to not use these files
   - Result: Reduced bundle size, improved security by eliminating exposure of test data, and cleaner project structure

2. **Refactored Debug Files into Organized Structure** (2025-05-02):
   - Created dedicated `src/debug` directory with clear organization
   - Refactored debug-config.js into src/debug/config.js
   - Split debug-panel.js into src/debug/panel/ui.js and src/debug/panel/styles.js
   - Split debug-tools.js into inspect.js, monitor.js, and performance.js modules
   - Moved debug-env.js to src/debug/utils/env.js
   - Created index.js files for clean exports and public API
   - Centralized debug initialization in src/debug/index.js
   - Updated main.js to use the new debug system structure
   - Removed original debug files after confirming functionality
   - Result: Improved maintainability, better organization, reduced duplication, and easier future extensions

2. **Successfully Tested Azure Functions in Staging Environment** (2025-04-30):
   - Deployed Azure Functions to the staging slot (pokedata-func-staging.azurewebsites.net)
   - Fixed GitHub Actions workflow to target the staging slot correctly
   - Resolved CosmosDB connection string issue causing 500 errors
   - Created test scripts to verify all three API endpoints
   - Confirmed successful operation of GetSetList, GetCardInfo, and GetCardsBySet endpoints
   - Documented response structure differences for proper client integration
   - Verified error handling for invalid card IDs and set codes
   - Result: All Azure Functions now working correctly in the staging environment

3. **Implemented Azure Function Service Classes and CI/CD** (2025-04-30):
   - Implemented CosmosDbService with Azure Cosmos DB SDK integration
   - Created BlobStorageService with Azure Storage Blob SDK integration
   - Developed RedisCacheService with Redis client integration
   - Updated PokemonTcgApiService with Axios for API calls
   - Set up GitHub Actions workflow for automated deployment
   - Created deployment guide for Azure resources
   - Generated package-lock.json for CI/CD pipeline compatibility
   - Configured GitHub Actions workflow in root .github/workflows directory
   - Addressed gitignore issues with package-lock.json for CI/CD
   - Result: Fully functional service implementations ready for Azure deployment with automated CI/CD

4. **Implemented Azure Functions v4 Programming Model** (2025-04-29):
   - Refactored Azure Functions to use the correct v4 programming model
   - Created a central entry point (src/index.ts) for function registration
   - Implemented shared service initialization for better performance
   - Refactored individual function handlers to use shared services
   - Fixed "A function can only be registered during app startup" error
   - Tested all endpoints to verify functionality
   - Result: Working Azure Functions with proper v4 programming model implementation

5. **Defined Cloud Architecture Plan** (2025-04-29):
   - Designed comprehensive cloud-based architecture using Azure services
   - Selected Cosmos DB for card metadata and pricing information
   - Planned Blob Storage with CDN for card images
   - Specified Redis Cache for performance optimization
   - Defined Azure Functions for API endpoints and background processing
   - Configured API Management as unified gateway
   - Result: Clear roadmap for transitioning from client-side to cloud architecture

6. **Designed Hybrid API Approach** (2025-04-29):
   - Planned integration of Pokémon TCG API for metadata and images
   - Specified PokeData API for enhanced pricing data
   - Designed data normalization strategy
   - Created fallback mechanisms for API failures
   - Result: More comprehensive data strategy leveraging multiple sources

7. **Enhanced Data Model Design** (2025-04-29):
   - Created Cosmos DB document structure for card data
   - Added support for graded card values (PSA, CGC)
   - Included multiple pricing sources in a single document
   - Added timestamp tracking for data freshness
   - Result: More comprehensive data model supporting advanced features

8. **Fixed Logger Formatting Issues** (2025-04-27):
   - Identified issue where CSS styling information was appearing directly in console log output
   - Refactored the formatLogArgs function in loggerService.js to properly handle styling parameters
   - Updated all logging methods to use the new formatting approach
   - Added test function in main.js to verify the logger formatting changes
   - Maintained caller information in logs for debugging context
   - Result: Console logs now display properly formatted without showing CSS styling code

9. **Fixed Debug System Issues** (2025-04-27):
   - Fixed context loggers in loggerService.js to include specialized methods like logDbOperation
   - Corrected debug configuration exports in debug-config.js to avoid duplicate exports
   - Updated window.pokeDataDebug object in main.js to use directly imported functions
   - Simplified the help function to use a single console.log with a multi-line string
   - Fixed debug panel button functionality for enabling/disabling debug mode
   - Ensured log level buttons work correctly in the debug panel
   - Result: Debug panel now works correctly, and all debug functions operate as expected

10. **Fixed CSS Loading and API Authentication Issues** (2025-04-27):
    - Enhanced CORS proxy implementation to properly handle authentication headers
    - Improved CSS loading sequence to ensure styles are fully loaded before app initialization
    - Added localStorage backup for database version to prevent unnecessary resets
    - Implemented a more robust caching strategy with proper timestamps and TTL
    - Created rebuild scripts to ensure proper application rebuilding
    - Added detailed logging for API requests and CSS loading
    - Result: Application now loads properly with correct styling even when API calls fail

11. **Fixed Error When Clearing Set Selection** (2025-04-26):
    - Modified the handleSetSelect function to properly handle null selections
    - Added specific logic to clear card-related state when set selection is cleared
    - Prevented error message from showing when clearing a selection
    - Improved user experience by allowing users to clear selections without errors
    - Result: Users can now clear the set selection without seeing an error message

12. **Improved Clear Button Design in Search Components** (2025-04-26):
    - Replaced custom SVG X with Material Design close icon for better quality and centering
    - Increased spacing between clear button and dropdown arrow for improved visual separation
    - Updated both SearchableSelect and CardSearchSelect components for consistency
    - Improved CSS styling with proper padding and box-sizing
    - Result: More polished user interface with better visual clarity and professional appearance

13. **Simplified API Authentication Approach** (2025-04-25):
    - Implemented hardcoded subscription key in apiConfig.js instead of using environment variables
    - Removed API key since authentication is handled by API Management service
    - Updated getHeaders() method to only include subscription key header
    - Modified rollup.config.cjs to remove environment variable replacements for API credentials
    - Updated debug tools to reflect the simplified approach
    - Result: Simplified development workflow while maintaining security through API Management restrictions

14. **Created run-app.bat file and updated README.md** (2025-04-25):
    - Created run-app.bat script to simplify application startup
    - Updated README.md with PowerShell command equivalents for all bash commands
    - Corrected repository URL to https://github.com/Abernaughty/PokeData
    - Enhanced documentation with more detailed dependency descriptions
    - Expanded features and project structure sections in README.md
    - Result: Improved documentation and easier application startup for users

15. **Fixed database reset issue causing problems with multiple tabs** (2025-04-25):
    - Identified issue where database was being reset on every page load
    - Replaced reset script with version check script that only resets when necessary
    - Implemented proper database version comparison logic
    - Added error handling for database operations
    - Added logging for database version checks
    - Result: Database now persists properly across page reloads and multiple tabs

16. **Fixed CSS loading and JavaScript syntax issues** (2025-04-25):
    - Improved CSS loading sequence to ensure proper styling
    - Enhanced error handling in SearchableSelect component
    - Fixed JavaScript syntax error in app initialization
    - Implemented proper script loading sequence with error handling
    - Added CSS loading check before app initialization
    - Separated database check and CSS loading into distinct phases
    - Added fallback for script loading errors
    - Result: Application now loads reliably with proper styling and without JavaScript errors

17. **Implemented set grouping by expansion in dropdown menu** (2025-04-25):
    - Created expansionMapper service to categorize sets by expansion
    - Modified SearchableSelect component to support grouped items
    - Implemented indentation for sets under expansion headers
    - Removed bullet points while keeping indentation for cleaner UI
    - Added sticky headers for expansion groups in the dropdown
    - Improved dropdown styling with Pokémon-themed colors
    - Enhanced keyboard navigation for grouped items
    - Result: Sets are now organized by expansion series (Scarlet & Violet, Sword & Shield, etc.) for easier navigation

18. **Moved PokeData project to a new repository location** (2025-04-25):
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

19. **Converted Card Name field to use SearchableSelect component** (2025-03-16):
    - Replaced basic input field with SearchableSelect component
    - Implemented dynamic loading of cards when a set is selected
    - Added filtering and search functionality for card names
    - Improved user experience with dropdown selection
    - Enhanced keyboard navigation and accessibility
    - Result: Users can now more easily find and select cards within a set

20. **Filtered Zero-Value Pricing Results** (2025-03-16):
    - Added logic to filter out pricing sources with $0 or null values
    - Implemented safety checks for null/undefined pricing data
    - Created a dedicated function for filtering valid prices
    - Applied filtering to both API and mock data
    - Added logging for filtered pricing data
    - Result: Pricing results now only show relevant, non-zero values, reducing confusion

## Next Steps

### Immediate Next Steps
1. **Frontend API Service Implementation**:
   - Create a new CloudDataService in src/services/ to communicate with Azure Functions
   - Implement methods mirroring current IndexedDB operations (getSetList, getCardsBySet, getCardPricing)
   - Add proper error handling and retry logic for network requests
   - Update store files to support both IndexedDB and cloud backends during migration

2. **Phased Migration Implementation**:
   - Implement feature flags to gradually switch components to the cloud backend
   - Add proper HTTP cache headers handling in the frontend
   - Create lightweight browser cache for frequently accessed data
   - Develop UI component modifications to handle longer loading times for network requests
   - Add skeleton screens or improved loading indicators for network requests

5. **API Development**:
   - Implement Azure Functions for card queries
   - Set up APIM policies for external API calls
   - Configure caching rules and rate limiting
   - Develop error handling and logging

6. **Frontend Adaptation**:
   - Modify frontend to use new Azure-based APIs
   - Update data fetching logic to work with new endpoints
   - Implement progressive loading for images via CDN
   - Adapt caching strategy to work with Redis

### Short-term Goals (1-2 weeks)
1. **Testing Environment Setup**:
   - Create test environment for migration validation
   - Configure the app to use staging APIs for validation
   - Develop test scripts to validate data consistency between IndexedDB and CosmosDB
   - Test edge cases like offline mode and slow connections

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
   - Implementation: Phased approach with incremental changes and testing at each step
   - Current Status: Successfully implemented and tested Azure Functions with on-demand data population

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
   - Current Status: CosmosDB successfully storing card data with on-demand population strategy

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
   - Current Status: Redis Cache integrated with Azure Functions for efficient data access

6. **Debug System Organization**: Refactoring debug files into a dedicated directory with modular organization.
   - Pros: Better organization, improved maintainability, clearer responsibilities
   - Cons: More complex directory structure, requires more initial setup
   - Decision: Implement modular debug system with clear separation of concerns
   - Implementation: Create dedicated debug directory with subdirectories for different functionality

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
   - Debug utilities in src/debug/
   - Main application in App.svelte

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
   ├── debug/            # Debug utilities
   │   ├── config.js     # Debug configuration
   │   ├── index.js      # Main debug entry point
   │   ├── panel/        # Debug panel UI
   │   ├── tools/        # Debug tools
   │   └── utils/        # Debug utilities
   ├── services/         # Business logic and API services
   │   ├── pokeDataService.js
   │   └── storage/
   │       └── db.js
   ├── App.svelte        # Main application component
   ├── corsProxy.js      # CORS proxy utility
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

5. **Module Organization**:
   - Clear separation of concerns
   - Single responsibility principle
   - Explicit dependencies
   - Consistent exports

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
    - The consolidated batch files (dev-server.bat and prod-server.bat) automatically detect and safely terminate any existing processes on port 3000
    - This ensures the server always runs on port 3000, which is required for API Management service integration
    - The robust process termination approach avoids conflicts and ensures clean server starts
    - When developing, use dev-server.bat which handles port conflicts automatically
    - Livereload functionality works correctly when using the proper development workflow

20. **Cost Management Importance**: Cloud services require careful cost management strategies, including serverless compute, tiered storage, and optimized caching to control operational expenses.

21. **Debug System Organization**: Organizing debug files into a modular structure with clear separation of concerns significantly improves maintainability and makes it easier to extend the debug system in the future.

22. **Development Session Cleanup**: When updating memory banks or completing development tasks:
    - Always remove temporary testing files (such as test scripts, temporary batch files)
    - Stop any running development servers before ending the session
    - Clean up any processes that might be lingering in the background
    - This prevents clutter, resource usage issues, and confusion in future sessions

23. **Azure Function Data Flow**: The Azure Function implementation follows a tiered data access pattern:
    - First checks Redis cache (if enabled and not forced to refresh)
    - If not in cache, checks Cosmos DB
    - If not in database, fetches from external API and populates both Cosmos DB and Redis
    - This provides optimal performance while maintaining data freshness

24. **On-Demand Database Population**: The system uses a "lazy loading" approach for card data:
    - Only stores data that users are actually requesting
    - Current sets (which are requested more frequently) are readily available
    - Older sets are fetched and stored when first requested
    - This optimizes storage resources while still providing good performance

25. **Set ID vs. Set Code Distinction**: There's an important distinction in the naming convention:
    - Set ID: The internal identifier used by the Pokémon TCG API (e.g., "sv8")
    - Set Code: The code used in the Pokémon TCG Online game (e.g., "PAL")
    - The API endpoints expect the Set Code, not the Set ID
    - This distinction needs to be clearly handled in the frontend migration

26. **Phased Migration Benefits**: The incremental migration approach provides several advantages:
    - Allows for testing at each step
    - Reduces risk with smaller, manageable changes
    - Provides opportunity for rollback if issues arise
    - Enables validation of each component before moving to the next

---
*This document was updated on 5/2/2025 as part of the Memory Bank update for the PokeData project.*
