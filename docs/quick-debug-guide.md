# PokeData Quick Debugging Guide

This is a quick reference guide for the PokeData debugging system. For more detailed information, see the [full debugging guide](./debugging-guide.md).

## Debug Panel

- **Toggle Debug Panel**: Press `Alt+D`
- **Change Log Level**: Click on DEBUG, INFO, WARN, ERROR, or NONE buttons
- **Visual Options**: Toggle timestamps, colors, caller info, etc.
- **Debug Tools**: Log memory usage, monitor network, monitor performance
- **Actions**: Clear console, enable/disable debug mode

## Console Commands

Access all debugging features via `window.pokeDataDebug` in the browser console:

```javascript
// Get help
pokeDataDebug.help();

// Logger configuration
pokeDataDebug.enableDebugMode();
pokeDataDebug.disableDebugMode();
pokeDataDebug.setLogLevel('DEBUG'); // 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'

// Debug tools
pokeDataDebug.inspect(someObject);
pokeDataDebug.measure(someFunction);
pokeDataDebug.memory();

// Monitoring
pokeDataDebug.monitor.performance();
pokeDataDebug.monitor.network();
pokeDataDebug.monitor.object(someObject);

// Debug panel
pokeDataDebug.panel.show();
pokeDataDebug.panel.hide();
pokeDataDebug.panel.toggle();
```

## Code Integration

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

```javascript
import { apiLogger, dbLogger, uiLogger, cacheLogger, networkLogger } from './services/loggerService';

apiLogger.info('API request initiated');
dbLogger.debug('Database query executed');
uiLogger.warn('UI component rendered with warnings');
```

### Timing Operations

```javascript
import { loggerService } from './services/loggerService';

loggerService.time('operation');
// ... perform operations ...
loggerService.timeEnd('operation');
```

### Grouping Logs

```javascript
import { loggerService } from './services/loggerService';

loggerService.groupCollapsed('Operation Details');
loggerService.debug('Step 1');
loggerService.debug('Step 2');
loggerService.groupEnd();
```

### Debug Tools

```javascript
import { inspectObject, measureExecutionTime, logMemoryUsage } from './debug-tools';

// Inspect an object
inspectObject(someObject);

// Measure execution time
measureExecutionTime(someFunction);

// Log memory usage
logMemoryUsage();
```

## Log Levels

- **DEBUG**: Detailed information for debugging purposes
- **INFO**: General information about application flow
- **WARN**: Warnings that might need attention
- **ERROR**: Errors that need immediate attention
- **NONE**: Disable all logging

## Best Practices

1. Use appropriate log levels for different types of messages
2. Group related logs using `groupCollapsed` and `groupEnd`
3. Use specialized loggers (apiLogger, dbLogger, etc.) for better categorization
4. Include relevant context in log messages
5. Use `timeEnd` to measure performance of operations
6. Disable debug logging in production by setting the log level to ERROR
