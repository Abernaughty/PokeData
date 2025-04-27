# PokeData Debugging Guide

This guide explains the enhanced debugging system implemented in the PokeData application. The system provides comprehensive logging, performance monitoring, and debugging tools to help developers identify and fix issues more efficiently.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Logger Service](#logger-service)
3. [Debug Tools](#debug-tools)
4. [Debug Panel](#debug-panel)
5. [Console API](#console-api)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)

## Quick Start

The debugging system is automatically initialized in development mode. You can access it in several ways:

- **Debug Panel**: Press `Alt+D` to toggle the debug panel UI
- **Console API**: Access debugging functions via `window.pokeDataDebug` in the browser console
- **Code Integration**: Import and use the logger and tools in your code

```javascript
// In your code
import { loggerService } from './services/loggerService';
import debugTools from './debug-tools';

// Log messages with different levels
loggerService.debug('Detailed information for debugging');
loggerService.info('General information about application flow');
loggerService.warn('Warning that might need attention');
loggerService.error('Error that needs immediate attention');
loggerService.success('Operation completed successfully');

// Use debug tools
debugTools.inspectObject(someObject);
debugTools.measureExecutionTime(someFunction);
```

## Logger Service

The logger service provides structured, leveled logging with visual enhancements and filtering capabilities.

### Log Levels

- **DEBUG**: Detailed information for debugging purposes
- **INFO**: General information about application flow
- **WARN**: Warnings that might need attention
- **ERROR**: Errors that need immediate attention
- **NONE**: Disable all logging

### Basic Logging

```javascript
import { loggerService } from './services/loggerService';

loggerService.debug('Debug message', { detail: 'Additional information' });
loggerService.info('Info message');
loggerService.warn('Warning message');
loggerService.error('Error message', new Error('Something went wrong'));
loggerService.success('Success message');
```

### Specialized Loggers

The system provides specialized loggers for different parts of the application:

```javascript
import { apiLogger, dbLogger, uiLogger, cacheLogger, networkLogger } from './services/loggerService';

apiLogger.info('API request initiated');
dbLogger.debug('Database query executed');
uiLogger.warn('UI component rendered with warnings');
cacheLogger.info('Cache hit for key:', 'some-key');
networkLogger.error('Network request failed', error);
```

### Timing Operations

```javascript
import { loggerService } from './services/loggerService';

// Start a timer
loggerService.time('operation');

// ... perform operations ...

// Log intermediate time
loggerService.timeLog('operation', 'Intermediate step completed');

// ... perform more operations ...

// End the timer and log the total time
loggerService.timeEnd('operation');
```

### Grouping Logs

```javascript
import { loggerService } from './services/loggerService';

// Create an expanded group
loggerService.group('Operation Details');
loggerService.debug('Step 1');
loggerService.debug('Step 2');
loggerService.debug('Step 3');
loggerService.groupEnd();

// Create a collapsed group (closed by default)
loggerService.groupCollapsed('Advanced Details');
loggerService.debug('Detail 1');
loggerService.debug('Detail 2');
loggerService.groupEnd();
```

### Tabular Data

```javascript
import { loggerService } from './services/loggerService';

const users = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
  { id: 3, name: 'Charlie', role: 'User' }
];

loggerService.table(users);
```

## Debug Tools

The debug tools provide utilities for inspecting objects, measuring performance, and monitoring application behavior.

### Object Inspection

```javascript
import { inspectObject } from './debug-tools';

// Basic inspection
inspectObject(someObject);

// Advanced inspection with options
inspectObject(someObject, {
  depth: 3,                // Maximum depth to inspect (default: 2)
  showMethods: true,       // Show methods (default: false)
  showPrototype: true,     // Show prototype properties (default: false)
  label: 'Custom Label'    // Custom label for the inspection (default: 'Object Inspection')
});
```

### Performance Measurement

```javascript
import { measureExecutionTime } from './debug-tools';

// Measure synchronous function
const result = measureExecutionTime(() => {
  // Expensive operation
  return someExpensiveCalculation();
}, [], 'Expensive Calculation');

// Measure asynchronous function
measureExecutionTime(async () => {
  // Async operation
  return await someAsyncOperation();
}, [], 'Async Operation')
  .then(result => {
    // Use result
  });
```

### Function Logging

```javascript
import { createLoggingFunction } from './debug-tools';

// Create a logging version of a function
const originalFunction = (a, b) => a + b;
const loggingFunction = createLoggingFunction(originalFunction, 'add');

// When called, arguments and result will be logged
const result = loggingFunction(5, 3);
```

### Property Monitoring

```javascript
import { monitorObjectProperties } from './debug-tools';

// Monitor all properties
const monitoredObject = monitorObjectProperties(someObject);

// Monitor specific properties
const monitoredObject = monitorObjectProperties(someObject, ['prop1', 'prop2']);

// Now, accessing or modifying these properties will be logged
monitoredObject.prop1 = 'new value';
console.log(monitoredObject.prop2);
```

### Memory Usage

```javascript
import { logMemoryUsage, getMemoryUsage } from './debug-tools';

// Log current memory usage
logMemoryUsage();

// Get memory usage data
const memoryData = getMemoryUsage();
console.log(`Used: ${memoryData.formattedUsed} / ${memoryData.formattedLimit}`);
```

### Event Listeners

```javascript
import { logEventListeners } from './debug-tools';

// Log event listeners on an element
const button = document.getElementById('my-button');
logEventListeners(button);
```

### Performance Monitoring

```javascript
import { createPerformanceMonitor } from './debug-tools';

// Create and start a performance monitor (logs every 5 seconds)
const monitor = createPerformanceMonitor(5000);
monitor.start();

// Stop monitoring
monitor.stop();

// Get a snapshot of current performance
const snapshot = monitor.getSnapshot();
```

### Network Monitoring

```javascript
import { monitorNetworkRequests } from './debug-tools';

// Start monitoring network requests
const networkMonitor = monitorNetworkRequests();

// Stop monitoring
networkMonitor.restore();
```

## Debug Panel

The debug panel provides a visual interface for controlling debug settings and running debug tools.

### Keyboard Shortcut

Press `Alt+D` to toggle the debug panel.

### Features

- **Log Level Control**: Change the current log level
- **Visual Options**: Toggle timestamps, colors, and other visual enhancements
- **Debug Tools**: Run memory usage logging, performance monitoring, and network monitoring
- **Actions**: Clear the console, enable/disable debug mode

## Console API

The debugging system exposes a global object `window.pokeDataDebug` in the browser console for interactive debugging.

### Available Commands

```javascript
// Get help
pokeDataDebug.help();

// Logger configuration
pokeDataDebug.enableDebugMode();
pokeDataDebug.disableDebugMode();
pokeDataDebug.setLogLevel('DEBUG'); // 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'
pokeDataDebug.getLoggerConfig();

// Debug tools
pokeDataDebug.inspect(document.body);
pokeDataDebug.measure(() => Array(1000000).fill(0).map((_, i) => i));
pokeDataDebug.memory();

// Monitoring
const perfMonitor = pokeDataDebug.monitor.performance();
perfMonitor.stop(); // Stop performance monitoring
const networkMonitor = pokeDataDebug.monitor.network();
networkMonitor.restore(); // Stop network monitoring
pokeDataDebug.monitor.object(someObject);

// Debug panel
pokeDataDebug.panel.show();
pokeDataDebug.panel.hide();
pokeDataDebug.panel.toggle();

// Direct access to services
pokeDataDebug.logger.debug('Custom debug message');
pokeDataDebug.tools.inspectObject(someObject, { depth: 3 });
```

## Performance Monitoring

The debugging system includes several tools for monitoring application performance:

### Execution Time Measurement

```javascript
import { loggerService } from './services/loggerService';

loggerService.time('operation');
// ... perform operations ...
loggerService.timeEnd('operation');
```

### FPS and Memory Monitoring

```javascript
import { createPerformanceMonitor } from './debug-tools';

const monitor = createPerformanceMonitor(5000); // Log every 5 seconds
monitor.start();
```

### Network Request Monitoring

```javascript
import { monitorNetworkRequests } from './debug-tools';

const networkMonitor = monitorNetworkRequests();
```

## Best Practices

### Log Level Usage

- **DEBUG**: Use for detailed information that is only useful during debugging
- **INFO**: Use for general information about application flow
- **WARN**: Use for warnings that might need attention but don't prevent the application from working
- **ERROR**: Use for errors that need immediate attention
- **SUCCESS**: Use for important successful operations

### Structured Logging

Structure your logs to make them more readable and searchable:

```javascript
// Instead of this:
console.log('User logged in: ' + username);

// Do this:
loggerService.info('User logged in', { username, timestamp: new Date() });
```

### Group Related Logs

Use groups to organize related logs:

```javascript
loggerService.groupCollapsed('API Request');
loggerService.debug('URL:', url);
loggerService.debug('Method:', method);
loggerService.debug('Headers:', headers);
loggerService.debug('Body:', body);
loggerService.groupEnd();
```

### Context Loggers

Use context loggers to categorize logs:

```javascript
import { apiLogger } from './services/loggerService';

apiLogger.info('API request initiated', { endpoint, method });
```

### Performance Considerations

- Disable debug logging in production by setting the log level to ERROR
- Use `loggerService.groupCollapsed()` for verbose logs to keep the console clean
- Be mindful of the performance impact of debug tools in production
