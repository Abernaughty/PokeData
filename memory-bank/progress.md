# Progress

## Overview
This document tracks what works, what's left to build, current status, known issues, and the evolution of project decisions for the PokeData project.

## What Works

The current state of the PokeData project includes the following working features:

1. **Repository Management**:
   - ✅ Standalone Git repository for the PokeData project
   - ✅ Complete file structure with all necessary components
   - ✅ Memory Bank documentation for project continuity
   - ✅ Proper dependency installation and configuration

2. **Core Search Functionality**:
   - ✅ Set selection via searchable dropdown
   - ✅ Card selection within a set via searchable dropdown
   - ✅ Basic card variant support
   - ✅ Two-step search process (set then card)

3. **Pricing Display**:
   - ✅ Fetching pricing data from external APIs
   - ✅ Displaying pricing from multiple sources
   - ✅ Formatting prices with consistent decimal places
   - ✅ Filtering zero-value pricing results

4. **Data Management**:
   - ✅ API integration with error handling
   - ✅ IndexedDB caching for offline use
   - ✅ Fallback to mock data when API fails
   - ✅ Caching of set lists, cards, and pricing data

5. **User Interface**:
   - ✅ Clean, focused design with Pokémon theming
   - ✅ Responsive layout for different screen sizes
   - ✅ Loading and error states
   - ✅ Results display with card details

6. **Components**:
   - ✅ SearchableSelect component for dropdown selection
   - ✅ CardSearchSelect component for card selection
   - ✅ CardVariantSelector component for variant selection
   - ✅ Reusable component architecture

7. **Error Handling**:
   - ✅ Basic error catching and display
   - ✅ Fallback mechanisms for API failures
   - ✅ User-friendly error messages
   - ✅ Console logging for debugging

8. **Cloud Architecture Implementation**:
   - ✅ Azure resource group for PokeData project
   - ✅ Cosmos DB instance with appropriate configuration
   - ✅ Blob Storage account for card images
   - ✅ API Management service setup
   - ✅ Azure Functions implementation with v4 programming model
   - ✅ Service classes for Cosmos DB, Blob Storage, and Redis Cache
   - ✅ CI/CD pipeline with GitHub Actions

9. **Image Migration to Azure Blob Storage**:
   - ✅ PowerShell scripts for uploading card images to Azure Blob Storage
   - ✅ Batch files for running test and full migration scripts
   - ✅ Standardized image path structure (cards/[set_code]/[card_number].jpg)
   - ✅ Authentication with specific tenant ID
   - ✅ Comprehensive documentation for implementation and next steps
   - ✅ Reference file for application code changes (imageUtils.modified.ts)

10. **Recent Improvements**:
   - ✅ Integrated Feature Flag Controls into Debug Panel (2025-05-14):
     - Identified issue with standalone FeatureFlagDebugPanel component not displaying properly
     - Integrated feature flag controls directly into the existing debug panel UI
     - Modified src/debug/panel/ui.js to add a new "Feature Flags" section with checkboxes
     - Added "Apply Changes" and "Reset All Flags" buttons that use the featureFlagService
     - Removed the standalone FeatureFlagDebugPanel component from App.svelte
     - Fixed several issues with process.env.NODE_ENV references throughout the codebase
     - Result: Unified debugging interface with all controls in one place, providing better organization and consistent styling

   - ✅ Fixed and Enhanced CosmosDB Integration (2025-05-01):
     - Identified and fixed critical issues with CosmosDB service initialization
     - Completely rewrote CosmosDbService class to use direct container access
     - Created import-data-direct.js script for reliable data import
     - Implemented multiple query approaches with fallbacks for resilience
     - Added detailed logging throughout the import process
     - Successfully imported 165 sets and 1,120 cards for current sets
     - Updated import-data.bat to use the new direct import script
     - Enhanced documentation in README.md with troubleshooting information
     - Result: Robust and reliable CosmosDB integration with comprehensive error handling

   - ✅ Implemented CosmosDB Integration and Data Import (2025-04-30):
     - Created import-data.ts script for populating Cosmos DB with data from the Pokémon TCG API
     - Implemented retry logic with exponential backoff for API calls
     - Added batch processing for better performance and reliability
     - Created test-cosmos.js script to verify Cosmos DB connection and operations
     - Fixed environment variable loading to use local.settings.json instead of .env files
     - Added RefreshData timer-triggered function to keep data up-to-date
     - Created build-and-deploy.bat script for easier deployment
     - Updated package.json with new scripts for testing and deployment
     - Enhanced error handling with proper TypeScript typing
     - Added comprehensive documentation in README.md
     - Result: Complete solution for Cosmos DB integration with data import and scheduled refresh

   - ✅ Implemented Azure Blob Storage Configuration and Image Migration (2025-04-30):
     - Created PowerShell scripts for uploading card images to Azure Blob Storage
     - Implemented authentication with specific tenant ID (5f445a68-ec75-42cf-a50f-6ec158ee675c)
     - Designed standardized image path structure (cards/[set_code]/[card_number].jpg)
     - Created batch files for running test and full migration scripts
     - Developed reference file for application code changes (imageUtils.modified.ts)
     - Created comprehensive documentation for implementation and next steps
     - Implemented robust error handling and logging in migration scripts
     - Result: Complete solution for migrating card images to Azure Blob Storage with clear path for application integration

   - ✅ Fixed Environment Variable Configuration in Test Scripts (2025-04-30):
     - Identified issue with environment variables not loading in test scripts
     - Discovered that dotenv was looking for .env file in the wrong directory
     - Implemented path resolution to correctly locate .env file in parent directory
     - Added proper error handling for environment variable loading
     - Updated test scripts to use environment variables for function keys
     - Documented proper approach for multi-directory projects
     - Learned about dotenv's default behavior and limitations
     - Result: Test scripts now correctly use environment variables for secure configuration

   - ✅ Confirmed Azure Function and CosmosDB Integration (2025-05-02):
     - Tested and validated the Azure Function app architecture with CosmosDB
     - Confirmed proper communication between Azure Functions and CosmosDB
     - Verified on-demand population strategy for card data in CosmosDB
     - Clarified the difference between Set ID and Set Code in API endpoints
     - Tested the retrieval of cards for older sets and confirmed database population
     - Developed detailed migration strategy for frontend adaptation
     - Result: Established clear path for client-side to cloud migration with minimal user disruption
   
   - ✅ Implemented Store-Based State Management Architecture (2025-05-02):
     - Created dedicated store modules for different types of state (sets, cards, pricing, UI)
     - Extracted business logic from App.svelte into appropriate store modules
     - Implemented reactive state using Svelte stores
     - Improved separation of concerns for better maintainability
     - Reduced code size in App.svelte by 60%
     - Created clear data flow between UI components and state
     - Enhanced scalability for future feature additions
     - Result: Significantly improved code organization and maintainability

   - ✅ Refactored Debug Files into Organized Structure (2025-05-02):
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

   - ✅ Successfully Tested Azure Functions in Staging Environment (2025-04-30):
     - Deployed Azure Functions to the staging slot (pokedata-func-staging.azurewebsites.net)
     - Fixed GitHub Actions workflow to target the staging slot correctly
     - Resolved CosmosDB connection string issue causing 500 errors
     - Created test scripts to verify all three API endpoints
     - Confirmed successful operation of GetSetList, GetCardInfo, and GetCardsBySet endpoints
     - Documented response structure differences for proper client integration
     - Verified error handling for invalid card IDs and set codes
     - Result: All Azure Functions now working correctly in the staging environment

   - ✅ Implemented Azure Function Service Classes and CI/CD (2025-04-30):
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

   - ✅ Implemented Azure Functions v4 Programming Model (2025-04-29):
     - Refactored Azure Functions to use the correct v4 programming model
     - Created a central entry point (src/index.ts) for function registration
     - Implemented shared service initialization for better performance
     - Refactored individual function handlers to use shared services
     - Fixed "A function can only be registered during app startup" error
     - Tested all endpoints to verify functionality
     - Result: Working Azure Functions with proper v4 programming model implementation

   - ✅ Created Comprehensive Code Review Prompt (2025-04-29):
     - Developed detailed code review guidelines in `memory-bank/codeReviewPrompt.md`
     - Included focus areas for project structure, code quality, architecture, documentation, and more
     - Added specific considerations for cross-session AI integration issues
     - Created usage guidelines for integrating reviews into the development workflow
     - Result: Standardized approach to maintaining code quality and consistency
     
   - ✅ Defined Cloud Architecture Plan (2025-04-29)
     - Designed comprehensive cloud-based architecture using Azure services
     - Selected Cosmos DB for card metadata and pricing information
     - Planned Blob Storage with CDN for card images
     - Specified Redis Cache for performance optimization
     - Defined Azure Functions for API endpoints and background processing
     - Configured API Management as unified gateway
     - Result: Clear roadmap for transitioning from client-side to cloud architecture

   - ✅ Designed Hybrid API Approach (2025-04-29)
     - Planned integration of Pokémon TCG API for metadata and images
     - Specified PokeData API for enhanced pricing data
     - Designed data normalization strategy
     - Created fallback mechanisms for API failures
     - Result: More comprehensive data strategy leveraging multiple sources

   - ✅ Enhanced Data Model Design (2025-04-29)
     - Created Cosmos DB document structure for card data
     - Added support for graded card values (PSA, CGC)
     - Included multiple pricing sources in a single document
     - Added timestamp tracking for data freshness
     - Result: More comprehensive data model supporting advanced features

   - ✅ Improved Development Server Workflow (2025-04-27)
     - Updated rollup.config.cjs to ensure the development server always uses port 3000
     - Created consolidated batch files (dev-server.bat, prod-server.bat, build-app.bat, tools.bat)
     - Implemented robust process termination for port 3000 conflicts
     - Documented the development server workflow in the memory bank
     - Result: Cleaner development workflow with consistent port usage and working livereload

   - ✅ Fixed Logger Formatting Issues (2025-04-27)
     - Identified issue where CSS styling information was appearing directly in console log output
     - Refactored the formatLogArgs function in loggerService.js to properly handle styling parameters
     - Updated all logging methods to use the new formatting approach
     - Added test function in main.js to verify the logger formatting changes
     - Maintained caller information in logs for debugging context
     - Result: Console logs now display properly formatted without showing CSS styling code
   
   - ✅ Fixed Debug System Issues (2025-04-27)
     - Fixed context loggers in loggerService.js to include specialized methods like logDbOperation
     - Corrected debug configuration exports in debug-config.js to avoid duplicate exports
     - Updated window.pokeDataDebug object in main.js to use directly imported functions
     - Simplified the help function to use a single console.log with a multi-line string
     - Fixed debug panel button functionality for enabling/disabling debug mode
     - Fixed log level buttons work correctly in the debug panel
     - Result: Debug panel now works correctly, and all debug functions operate as expected
   
   - ✅ Fixed CSS Loading and API Authentication Issues (2025-04-27)
     - Enhanced CORS proxy implementation to properly handle authentication headers
     - Improved CSS loading sequence to ensure styles are fully loaded before app initialization
     - Added localStorage backup for database version to prevent unnecessary resets
     - Implemented a more robust caching strategy with proper timestamps and TTL
     - Created rebuild scripts to ensure proper application rebuilding
     - Added detailed logging for API requests and CSS loading
     - Result: Application now loads properly with correct styling even when API calls fail
   - ✅ Fixed Error When Clearing Set Selection (2025-04-26)
     - Modified the handleSetSelect function to properly handle null selections
     - Added specific logic to clear card-related state when set selection is cleared
     - Prevented error message from showing when clearing a selection
     - Improved user experience by allowing users to clear selections without errors
     - Result: Users can now clear the set selection without seeing an error message
   - ✅ Improved Clear Button Design in Search Components (2025-04-26)
     - Replaced custom SVG X with Material Design close icon for better quality and centering
     - Increased spacing between clear button and dropdown arrow for improved visual separation
     - Updated both SearchableSelect and CardSearchSelect components for consistency
     - Improved CSS styling with proper padding and box-sizing
     - Result: More polished user interface with better visual clarity and professional appearance
   - ✅ Simplified API Authentication Approach (2025-04-25)
     - Implemented hardcoded subscription key in apiConfig.js instead of using environment variables
     - Removed API key since authentication is handled by API Management service
     - Updated getHeaders() method to only include subscription key header
     - Modified rollup.config.cjs to remove environment variable replacements for API credentials
     - Updated debug tools to reflect the simplified approach
     - Result: Simplified development workflow while maintaining security through API Management restrictions
   - ✅ Created run-app.bat file for simplified application startup (2025-04-25)
   - ✅ Updated README.md with PowerShell command equivalents (2025-04-25)
   - ✅ Corrected repository URL to https://github.com/Abernaughty/PokeData (2025-04-25)
   - ✅ Enhanced documentation with detailed dependency descriptions (2025-04-25)
   - ✅ Expanded features and project structure sections in README.md (2025-04-25)
   - ✅ Fixed database reset issue causing problems with multiple tabs (2025-04-25)
   - ✅ Improved CSS loading sequence to ensure proper styling (2025-04-25)
   - ✅ Enhanced error handling in SearchableSelect component (2025-04-25)
   - ✅ Fixed JavaScript syntax error in app initialization (2025-04-25)
   - ✅ Implemented proper script loading sequence with error handling (2025-04-25)
   - ✅ Implemented set grouping by expansion in dropdown menu (2025-04-25)
   - ✅ Created expansionMapper service to categorize sets by expansion (2025-04-25)
   - ✅ Modified SearchableSelect component to support grouped items (2025-04-25)
   - ✅ Improved dropdown styling with indentation and no bullet points (2025-04-25)
   - ✅ Implemented hybrid caching approach for Scarlet & Violet sets (2025-04-25)
   - ✅ Added TTL-based pricing data caching with 24-hour expiration (2025-04-25)
   - ✅ Created set classifier to identify and prioritize current sets (2025-04-25)
   - ✅ Added background sync for current sets data (2025-04-25)
   - ✅ Implemented automatic cleanup of expired pricing data (2025-04-25)
   - ✅ Added pricing data timestamp display for transparency (2025-04-25)
   - ✅ Moved PokeData project to a new repository location (2025-04-25)
   - ✅ Relocated from `C:\Users\maber\Documents\GitHub\git-maber\PokeData-repo` to `C:\Users\maber\Documents\GitHub\PokeData`
   - ✅ Created GitHub repository at https://github.com/Abernaughty/PokeData (2025-04-25)
   - ✅ Renamed the repository from "PokeData-repo" to "PokeData"
   - ✅ Verified functionality in the new repository environment
   - ✅ Identified outdated dependencies for future updates
   - ✅ Note: The directory at `C:\Users\maber\Documents\GitHub\git-maber\PokeData` is a separate static web app workflow directory
   - ✅ Converted Card Name field to use SearchableSelect component (2025-03-16)
   - ✅ Filtered zero-value pricing results for clearer presentation (2025-03-16)
   - ✅ Formatted price decimal places consistently (2025-03-16)
   - ✅ Enhanced error handling for API failures (2025-03-10)
   - ✅ Optimized set list loading with better caching (2025-03-05)
   - ✅ Improved card variant handling (2025-02-28)

## What's Left to Build

### High Priority
1. **Cloud Architecture Implementation**:
   - ✅ Create Azure resource group for PokeData project
   - ✅ Provision Cosmos DB instance with appropriate configuration
   - ✅ Set up Blob Storage account for card images
   - ✅ Create Blob Storage container for card images
   - 🔄 Configure Azure Cache for Redis
   - ✅ Deploy initial Azure Functions
   - ✅ Set up API Management service
   - ✅ Test and verify Cosmos DB data population strategy

2. **Image Migration to Azure Blob Storage**:
   - ✅ Create PowerShell scripts for uploading card images
   - ✅ Implement authentication with specific tenant ID
   - ✅ Design standardized image path structure
   - ✅ Create batch files for running migration scripts
   - ✅ Develop reference file for application code changes
   - 🔄 Test the migration with a single set
   - 🔄 Test the migration with multiple sets
   - 🔄 Run the full migration
   - 🔄 Update the application code to use new image paths

3. **Data Migration**:
   - 🔴 Design migration strategy from IndexedDB to Cosmos DB
   - 🔴 Create data mapping between current and new schemas
   - 🔴 Develop migration scripts and utilities
   - 🔴 Plan for data validation and verification

3. **API Development**:
   - ✅ Implement Azure Functions for basic card and set queries
   - 🔄 Set up APIM policies for external API calls
   - 🔄 Configure caching rules and rate limiting
   - 🔄 Enhance error handling and logging

4. **Frontend Adaptation**:
   - 🔄 Create frontend API service for Azure Functions
   - 🔄 Implement feature flags for gradual migration
   - 🔄 Update data fetching logic to work with new endpoints
   - 🔄 Implement progressive loading for images via CDN
   - 🔄 Adapt caching strategy to work with Redis

5. **Dependency Updates**:
   - ✅ Update PNPM from 8.15.4 to 10.9.0
   - 🔴 Evaluate and plan updates for major dependencies (Svelte 3.x to 5.x)
   - 🔴 Implement incremental updates with testing
   - 🔴 Document compatibility issues and solutions

7. **Card Images in Price Results**:
   - 🔴 Integrate card image URLs from the API
   - 🔴 Create image component with loading and error states
   - 🔴 Implement lazy loading for performance
   - 🔴 Add fallback images for missing card images

8. **Improved Error Handling**:
   - 🔴 Create more specific error messages for different API failure scenarios
   - 🔴 Implement visual error states in the UI
   - 🔴 Add retry functionality for failed requests
   - 🔴 Enhance error logging for debugging

9. **Price History Graphs**:
   - 🔴 Design time-series data storage in Cosmos DB
   - 🔴 Implement data collection for historical prices
   - 🔴 Create graph visualization components
   - 🔴 Add date range selection UI

### Medium Priority
1. **Data Ingestion**:
   - 🔴 Create Azure Function to fetch initial data from both APIs
   - 🔴 Populate Cosmos DB with combined card data
   - 🔴 Upload card images to Blob Storage
   - 🔴 Implement data validation and cleanup

2. **Enhanced Loading Indicators**:
   - 🔴 Create consistent loading animations
   - 🔴 Implement skeleton screens for content loading
   - 🔴 Add progress indicators for long-running operations
   - 🔴 Ensure loading states are accessible

3. **Optimized Caching Strategy**:
   - ✅ Review current implementation for efficiency
   - ✅ Implement smarter cache invalidation with TTL for pricing data
   - ✅ Add cache analytics for monitoring
   - ✅ Create cache management utilities
   - 🔴 Configure Redis for optimal caching of frequently accessed data
   - 🔴 Implement cache invalidation rules
   - 🔴 Set up monitoring for cache performance

4. **Set Grouping in Dropdown**:
   - ✅ Group sets by expansion in dropdown menu
   - ✅ Create expansion mapping service
   - ✅ Implement indented dropdown items
   - ✅ Improve dropdown styling and usability

5. **SearchableSelect Dropdown Positioning**:
   - 🔴 Fix issue with dropdowns appearing off-screen
   - 🔴 Implement smart positioning based on available space
   - 🔴 Add scroll handling for dropdown positioning
   - 🔴 Ensure proper mobile device support

6. **Implement CDN for Images**:
   - 🔴 Configure Azure CDN for Blob Storage
   - 🔴 Set up caching rules for optimal performance
   - 🔴 Implement image optimization
   - 🔴 Add responsive image loading

### Low Priority
1. **Collection Management Feature**:
   - 🔴 Design data structure for collection items in Cosmos DB
   - 🔴 Create UI components for collection management
   - 🔴 Implement Azure Functions for collection operations
   - 🔴 Add collection statistics and valuation

2. **Dark Mode Support**:
   - 🔴 Create color theme variables
   - 🔴 Implement theme switching functionality
   - 🔴 Design dark mode color palette
   - 🔴 Ensure proper contrast and accessibility

3. **Responsive Design Improvements**:
   - 🔴 Enhance mobile experience
   - 🔴 Optimize layout for different screen sizes
   - 🔴 Implement touch-friendly interactions
   - 🔴 Test across various devices

4. **Advanced Search Capabilities**:
   - 🔴 Implement full-text search across card names
   - 🔴 Add filtering by rarity, price range, etc.
   - 🔴 Create advanced search UI
   - 🔴 Optimize search performance

## Current Status

**Project Phase**: Cloud Architecture Implementation and Frontend Migration Planning

**Current Sprint Focus**: Frontend Adaptation Strategy and Migration to Cloud Architecture

**Key Milestones**:
- ✅ Initial project setup completed
- ✅ Basic search functionality implemented
- ✅ Pricing display functionality implemented
- ✅ Caching mechanism implemented
- ✅ SearchableSelect component implemented
- ✅ Zero-value pricing filtering implemented
- ✅ Price decimal formatting implemented
- ✅ Project moved to standalone repository at `C:\Users\maber\Documents\GitHub\PokeData`
- ✅ Cloud architecture plan defined
- ✅ Hybrid API approach designed
- ✅ Enhanced data model created
- ✅ Debug files refactored into organized structure
- ✅ Store-based state management implemented
- ✅ Azure Functions deployed and tested
- ✅ CosmosDB integration verified with on-demand population
- 🔄 Frontend cloud service implementation in progress
- 🔄 Frontend migration strategy in development
- 🔄 Data migration strategy in development
- 🔄 Dependency update evaluation in progress
- 🔄 Error handling improvements in progress
- 🔄 Card image integration in planning

**Timeline**:
- Previous Sprint: Cloud architecture planning and data model enhancement
- Current Sprint: Azure Function implementation and CosmosDB integration
- Next Sprint: Frontend adaptation and phased migration implementation

## Known Issues

1. **Expansion Grouping Format Mismatch**: ✅ FIXED
   - Issue: Expansion headers in dropdown only showed the expansion name again instead of the actual sets
   - Cause: Format mismatch between backend and frontend for grouped sets
     - Backend format: `[{type: 'group', name: 'X', items: [...]}, ...]`
     - Frontend expected format: `{'X': [...], 'Y': [...], ...}`
   - Impact: Poor user experience with unusable expansion grouping in dropdown
   - Solution: Added transformation logic in cloudDataService.getSetList() to convert between formats
   - Status: ✅ Fixed on 2025-05-14

2. **Set ID vs. Set Code API Parameter Issue**: ✅ FIXED
   - Issue: API endpoints expect Set Code (e.g., "OBF") but were being queried with Set ID (e.g., "sv8")
   - Cause: Confusion between the two different identifiers used in the Pokémon TCG system
   - Impact: "No results" errors when querying for sets using the wrong identifier
   - Solution: Clarified the difference between identifiers and updated API usage documentation
   - Status: ✅ Fixed on 2025-05-02

2. **Database Reset Issue**: ✅ FIXED
   - Issue: Database was being reset on every page load, causing problems with multiple tabs
   - Cause: Reset script was running unconditionally on page load
   - Impact: Data loss when using multiple tabs, inconsistent state
   - Solution: Implemented version check that only resets when necessary
   - Status: ✅ Fixed on 2025-04-25

2. **CSS Loading Issue**: ✅ FIXED
   - Issue: Site content sometimes loaded without proper styling
   - Cause: Race condition between CSS loading and app initialization
   - Impact: Poor user experience with unstyled content
   - Solution: Added CSS loading check before app initialization
   - Status: ✅ Fixed on 2025-04-25

3. **JavaScript Syntax Error**: ✅ FIXED
   - Issue: "Unexpected end of input" error in main.js
   - Cause: Race condition in script loading sequence
   - Impact: Application failed to initialize properly
   - Solution: Improved script loading sequence with proper error handling
   - Status: ✅ Fixed on 2025-04-25

4. **Outdated Dependencies**:
   - Issue: Several dependencies are outdated, including major version updates (Svelte 3.x to 5.x)
   - Cause: Project has been maintained with fixed dependency versions
   - Impact: Missing new features, potential security updates, and performance improvements
   - Workaround: Continue using current versions until proper update plan is in place
   - Status: 🔴 Pending evaluation and update plan

5. **SearchableSelect Dropdown Positioning**:
   - Issue: Dropdown sometimes appears off-screen, especially on mobile devices
   - Cause: Fixed positioning without boundary checking
   - Impact: Poor user experience on smaller screens
   - Workaround: Scroll to view the dropdown
   - Status: 🔴 Pending fix

6. **API Response Handling Inconsistencies**:
   - Issue: Different APIs return data in inconsistent formats
   - Cause: Multiple data sources with varying response structures
   - Impact: Requires complex parsing logic and can lead to errors
   - Workaround: Adapter pattern implementation with multiple format checks
   - Status: 🟡 Partially addressed with adapter pattern
   - Future Solution: Standardized data normalization in Azure Functions

7. **Slow Initial Load Time**:
   - Issue: First load of the application can be slow
   - Cause: Multiple API requests and lack of code splitting
   - Impact: Poor first-time user experience
   - Workaround: Caching helps on subsequent visits
   - Status: 🔴 Pending optimization
   - Future Solution: Redis caching and CDN for faster initial loads

8. **Limited Offline Support**:
   - Issue: Some features don't work well offline
   - Cause: Incomplete caching strategy
   - Impact: Reduced functionality without internet connection
   - Workaround: Basic caching provides some offline capability
   - Status: 🟡 Partially implemented with caching
   - Future Solution: Improved offline support with service workers

9. **Mobile Usability Issues**:
   - Issue: Interface elements can be difficult to use on small screens
   - Cause: Incomplete responsive design implementation
   - Impact: Poor user experience on mobile devices
   - Workaround: Use in landscape orientation on mobile
   - Status: 🔴 Pending responsive design improvements

10. **Memory Usage Concerns**:
    - Issue: Large datasets can consume significant memory
    - Cause: Storing complete card lists in memory
    - Impact: Potential performance issues with very large sets
    - Workaround: Pagination of results (manual implementation)
    - Status: 🔴 Pending optimization
    - Future Solution: Server-side pagination with Azure Functions

11. **Development Server Port Issues**: ✅ FIXED
    - Issue: Development server sometimes runs on different ports when port 3000 is already in use
    - Cause: Multiple instances of the development server running simultaneously
    - Impact: API calls fail because only port 3000 is whitelisted in the APIM configuration
    - Solution: Updated rollup.config.cjs to ensure consistent port usage and simplified the development workflow
    - Workaround (if issue recurs): Check for running servers on port 3000 before starting a new one
    - Status: ✅ Fixed on 2025-04-27

12. **Complex State Management in App.svelte**: ✅ FIXED
    - Issue: App.svelte managed too much state and logic directly
    - Cause: Initial design did not use store-based architecture
    - Impact: Difficult to maintain and scale the application
    - Solution: Implemented Svelte stores to separate concerns and improve state management
    - Status: ✅ Fixed on 2025-05-02

12. **Azure Authentication Issues**: 🟡 PARTIALLY FIXED
    - Issue: Authentication with Azure services requires specific tenant ID
    - Cause: Azure tenant configuration and security requirements
    - Impact: Scripts fail to authenticate with Azure services
    - Solution: Implemented authentication with specific tenant ID in PowerShell scripts
    - Status: 🟡 Fixed for PowerShell scripts, pending for other components

## Evolution of Project Decisions

### Initial Concept
The project began as a simple tool to check Pokémon card prices from a single source. The initial concept focused on:

- Basic search functionality
- Single pricing source
- Minimal UI
- No offline support

### Architecture Evolution
As the project progressed, the architecture evolved to address more complex requirements:

1. **Repository Management**:
   - Initial Approach: Part of a multi-project repository at `C:\Users\maber\Documents\GitHub\git-maber\PokeData-repo`
     - Pros: Shared infrastructure, easier cross-project references
     - Cons: Less isolation, potential conflicts with other projects
   - Current Approach: Standalone repository at `C:\Users\maber\Documents\GitHub\PokeData`
     - Pros: Better isolation, focused development, clearer project boundaries, cleaner directory structure
     - Cons: Requires additional setup, potential duplication of common code
   - Note: The directory at `C:\Users\maber\Documents\GitHub\git-maber\PokeData` is a separate static web app workflow directory that should not be modified
   - Rationale: Cleaner project management and better focus on PokeData-specific features

2. **Data Retrieval Approach**:
   - Initial Approach: Direct API calls without caching
     - Pros: Simpler implementation
     - Cons: Repeated API calls, no offline support
   - Current Approach: API calls with IndexedDB caching
     - Pros: Reduced API calls, offline support
     - Cons: More complex implementation
   - Planned Approach: Cloud-based architecture with Azure services
     - Pros: Better scalability, performance, reliability, and feature capabilities
     - Cons: Increased complexity and operational costs
   - Rationale: Enhanced capabilities, better performance, and more advanced features

3. **Search Interface**:
   - Initial Approach: Single search field for all cards
     - Pros: Simpler UI
     - Cons: Inefficient for large datasets
   - Current Approach: Two-step search (set then card)
     - Pros: More efficient search, better organization
     - Cons: Additional step in the process
   - Rationale: Improved usability with large card database

4. **Component Architecture**:
   - Initial Approach: Monolithic components
     - Pros: Easier initial development
     - Cons: Limited reusability, harder to maintain
   - Current Approach: Reusable component library
     - Pros: Better maintainability, consistent UI
     - Cons: More upfront development time
   - Rationale: Long-term maintainability and consistency

5. **Data Storage**:
   - Initial Approach: No persistent storage
     - Pros: Simplest implementation
     - Cons: Repeated API calls, poor performance
   - Current Approach: IndexedDB for client-side storage
     - Pros: Offline support, better performance
     - Cons: Limited storage capacity, client-side only
   - Planned Approach: Cosmos DB for cloud storage
     - Pros: Scalable, globally distributed, flexible schema
     - Cons: Operational costs, more complex implementation
   - Rationale: Better scalability, performance, and advanced features

6. **Debug System Organization**:
   - Initial Approach: Flat file structure with separate debug files in the src directory
     - Pros: Simple initial implementation, easy to find files
     - Cons: Poor organization, harder to maintain as system grows
   - Current Approach: Dedicated debug directory with modular organization
     - Pros: Better organization, improved maintainability, clearer responsibilities
     - Cons: More files to manage, more complex directory structure
   - Rationale: Improved maintainability and organization as the debug system grows

7. **State Management**:
   - Initial Approach: Direct state management in App.svelte
     - Pros: Simple initial implementation, centralized location
     - Cons: Component became too large, mixing UI and business logic
   - Current Approach: Store-based architecture using Svelte stores
     - Pros: Better separation of concerns, improved maintainability, clearer data flow
     - Cons: More files to manage, more complex structure initially
   - Rationale: Improved scalability, maintainability, and clearer responsibilities

### Feature Prioritization Evolution
Feature priorities evolved based on user feedback and development insights:

1. **Initial Priority**: Basic search and price display
2. **Current Priority**: Cloud architecture migration, data model enhancement, and API integration
3. **Future Priority**: Advanced features like collection management, price history, and enhanced search
4. **Rationale**: Focus on building a robust, scalable foundation before adding advanced features

### Technical Approach Evolution
The technical implementation approach has also evolved:

1. **API Authentication Approach**:
   - Initial Approach: Environment variables for API key and subscription key
     - Pros: Follows best practices for configuration management
     - Cons: More complex setup, requires .env file management
   - Current Approach: Hardcoded subscription key with API Management service handling authentication
     - Pros: Simplified development workflow, no environment variables to manage
     - Cons: Less flexibility for different environments
   - Planned Approach: Azure API Management with subscription keys
     - Pros: Centralized management, rate limiting, monitoring
     - Cons: Additional service to manage
   - Rationale: Better security, monitoring, and management capabilities

2. **Storage Strategy**:
   - Initial Approach: localStorage for simple caching
     - Pros: Simple API, easy implementation
     - Cons: Limited storage space, string-only storage
   - Current Approach: IndexedDB for robust client-side storage
     - Pros: Larger storage capacity, structured data
     - Cons: More complex API
   - Planned Approach: Multi-tiered storage with Cosmos DB, Redis, and Blob Storage
     - Pros: Scalable, performant, comprehensive
     - Cons: More complex architecture, operational costs
   - Rationale: Need for more robust, scalable storage solution

3. **Error Handling**:
   - Initial Approach: Basic try/catch blocks
     - Pros: Simple implementation
     - Cons: Limited error information for users
   - Current Approach: Comprehensive error handling with fallbacks
     - Pros: Better user experience, more resilient application
     - Cons: More complex code
   - Planned Approach: Centralized error handling in Azure Functions with detailed logging
     - Pros: Consistent error handling, better monitoring
     - Cons: Additional implementation complexity
   - Rationale: Improved reliability, user experience, and debugging capabilities

4. **UI Implementation**:
   - Initial Approach: Basic HTML forms
     - Pros: Quick to implement
     - Cons: Limited functionality and poor UX
   - Current Approach: Custom components with enhanced functionality
     - Pros: Better user experience, more control
     - Cons: More development effort
   - Planned Approach: Enhanced UI with card images, price history graphs, and collection management
     - Pros: Comprehensive feature set, better user experience
     - Cons: Increased complexity and development effort
   - Rationale: Need for more sophisticated user interface and advanced features

5. **Debug System Architecture**:
   - Initial Approach: Monolithic debug files with overlapping responsibilities
     - Pros: Simple initial implementation, fewer files to manage
     - Cons: Poor separation of concerns, harder to maintain
   - Current Approach: Modular debug system with clear separation of concerns
     - Pros: Better maintainability, clearer responsibilities, easier to extend
     - Cons: More files to manage, more complex directory structure
   - Rationale: Improved maintainability and organization as the debug system grows

6. **State Management Architecture**:
   - Initial Approach: Manage state directly in App.svelte
     - Pros: Simple implementation, no additional files
     - Cons: Component became large and complex, mixing concerns
   - Current Approach: Use Svelte stores for state management
     -
