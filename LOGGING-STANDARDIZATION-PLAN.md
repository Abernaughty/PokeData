# Logging Standardization Plan

## Overview
This document outlines the plan to standardize logging across the PokeData project by replacing console.log usage with the structured loggerService.

## Current State Analysis

### Console Usage Statistics
- **Total instances**: 297 (258 in .js files + 39 in .svelte files)
- **Files affected**: 20+ files across services, stores, and components

### Categories of Console Usage

#### 1. Production Services (HIGH PRIORITY)
- `src/services/hybridDataService.js` - 12 instances
- `src/services/pokeDataService.js` - 89 instances  
- `src/services/cloudDataService.js` - 47 instances
- `src/services/storage/db.js` - 31 instances
- `src/services/setClassifier.js` - 8 instances
- `src/services/expansionMapper.js` - 2 instances
- `src/services/featureFlagService.js` - 3 instances

#### 2. State Management (HIGH PRIORITY)
- `src/stores/setStore.js` - 18 instances
- `src/stores/cardStore.js` - 14 instances
- `src/stores/priceStore.js` - 8 instances
- `src/stores/uiStore.js` - 6 instances

#### 3. UI Components (MEDIUM PRIORITY)
- `src/components/SearchableSelect.svelte` - 25 instances
- `src/components/CardSearchSelect.svelte` - 8 instances
- `src/components/SearchableInput.svelte` - 6 instances

#### 4. Debug-Specific (KEEP AS-IS)
- `src/debug-env.js` - 8 instances (KEEP - debug utility)
- `src/debug/` folder - 12 instances (KEEP - debug tools)
- `src/debug-panel.js` - 2 instances (KEEP - debug panel)
- `src/debug-config.js` - 2 instances (KEEP - debug configuration)

#### 5. Configuration (LOW PRIORITY)
- `src/config/environment.js` - 1 instance
- `src/main.js` - 8 instances (test code)

## LoggerService Capabilities

The existing loggerService provides:

### Core Logging Methods
- `debug()`, `info()`, `warn()`, `error()`, `success()`
- Structured formatting with timestamps and caller info
- Configurable log levels and styling

### Specialized Methods
- `logApiRequest()`, `logApiResponse()`, `logApiError()`
- `logDbOperation()`
- `logLifecycle()`, `logInteraction()`
- `time()`, `timeEnd()`, `timeLog()`
- `group()`, `groupCollapsed()`, `groupEnd()`

### Context Loggers
- `apiLogger`, `dbLogger`, `uiLogger`, `cacheLogger`, `networkLogger`
- `createContextLogger()` for custom contexts

## Implementation Strategy

### Phase 1: High-Priority Services (IMMEDIATE)
1. **API Services**
   - Replace API request/response logging with `logApiRequest()` and `logApiResponse()`
   - Use `apiLogger` context for API-related operations
   - Convert error logging to `logApiError()`

2. **Data Services**
   - Use `dbLogger` for database operations
   - Convert cache operations to `cacheLogger`
   - Use appropriate log levels (debug for verbose, info for important events)

3. **State Management**
   - Use `uiLogger` for store operations
   - Convert lifecycle events to `logLifecycle()`
   - Use `debug()` for state changes, `info()` for important events

### Phase 2: UI Components (FOLLOW-UP)
1. **Component Interactions**
   - Use `logInteraction()` for user interactions
   - Use `uiLogger` context for component-specific logging
   - Convert focus/blur events to debug level

2. **Component Lifecycle**
   - Use `logLifecycle()` for component mount/unmount
   - Use debug level for internal state changes

### Phase 3: Configuration and Utilities (FINAL)
1. **Environment Configuration**
   - Keep minimal console.log for critical startup information
   - Convert detailed logging to debug level

2. **Test Code**
   - Update test logging to use loggerService
   - Maintain test output visibility

## Files to Preserve Console Usage

### Debug-Specific Files (NO CHANGES)
- `src/debug-env.js` - Debug utility script
- `src/debug/` folder - Debug tools and panels
- `src/debug-panel.js` - Debug panel functionality
- `src/debug-config.js` - Debug configuration

### Logger Service Internal (NO CHANGES)
- `src/services/loggerService.js` - Uses console internally (correct)

## Implementation Guidelines

### 1. Context Logger Selection
```javascript
// API operations
import { apiLogger } from '../services/loggerService.js';
apiLogger.logApiRequest('GET', url, options);

// Database operations  
import { dbLogger } from '../services/loggerService.js';
dbLogger.logDbOperation('save', 'cards', cardId, cardData);

// UI interactions
import { uiLogger } from '../services/loggerService.js';
uiLogger.logInteraction('SearchableSelect', 'itemSelected', item);
```

### 2. Log Level Guidelines
- `debug()` - Verbose internal operations, state changes
- `info()` - Important events, successful operations
- `warn()` - Recoverable issues, fallbacks used
- `error()` - Actual errors, failed operations
- `success()` - Successful completion of major operations

### 3. Performance Logging
```javascript
// Replace timing console.log with structured timing
logger.time('apiRequest');
// ... operation ...
logger.timeEnd('apiRequest');
```

### 4. Error Handling
```javascript
// Replace console.error with structured error logging
try {
  // operation
} catch (error) {
  apiLogger.logApiError('GET', url, error);
  throw error;
}
```

## Benefits of Standardization

1. **Consistent Formatting**: All logs have timestamps, caller info, and consistent styling
2. **Configurable Verbosity**: Can adjust log levels without code changes
3. **Better Organization**: Context loggers group related operations
4. **Enhanced Debugging**: Structured data makes debugging more efficient
5. **Production Ready**: Can easily disable verbose logging in production

## Testing Strategy

1. **Incremental Implementation**: Update one service at a time
2. **Functionality Verification**: Ensure all logging information is preserved
3. **Performance Testing**: Verify no performance impact
4. **Log Level Testing**: Test different log levels work correctly

## Success Criteria

- [ ] All production services use loggerService
- [ ] All state management uses structured logging  
- [ ] UI components use appropriate context loggers
- [ ] Debug-specific files remain unchanged
- [ ] No loss of debugging information
- [ ] Consistent log formatting across application
- [ ] Configurable log levels working correctly

## Timeline

- **Phase 1**: 2-3 hours (High-priority services)
- **Phase 2**: 1-2 hours (UI components)  
- **Phase 3**: 30 minutes (Configuration/utilities)
- **Testing**: 1 hour (Comprehensive testing)

**Total Estimated Time**: 4-6 hours
