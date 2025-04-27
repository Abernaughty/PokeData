import App from './App.svelte';
import debugConfig, { 
  setLogLevel, 
  enableDebugMode, 
  disableDebugMode, 
  getLoggerConfig 
} from './debug-config';
import { loggerService, dbLogger } from './services/loggerService';
import debugTools from './debug-tools';
import debugPanel from './debug-panel';

// Test function to verify logger formatting
function testLogger() {
  console.log("=== Testing Logger Formatting ===");
  
  // Test basic logging
  console.log("--- Basic Logging ---");
  loggerService.debug("This is a debug message");
  loggerService.info("This is an info message");
  loggerService.warn("This is a warning message");
  loggerService.error("This is an error message");
  loggerService.success("This is a success message");
  
  // Test timer functions
  console.log("--- Timer Functions ---");
  loggerService.time("testTimer");
  setTimeout(() => {
    loggerService.timeEnd("testTimer");
  }, 100);
  
  // Test group functions
  console.log("--- Group Functions ---");
  loggerService.group("Test Group");
  loggerService.debug("This is inside a group");
  loggerService.info("Another message inside the group");
  loggerService.groupEnd();
  
  // Test DB operations logging
  console.log("--- DB Operations Logging ---");
  dbLogger.logDbOperation("get", "setList", "pokemonSets", { count: 150, age: "2 hours" });
  
  console.log("=== Logger Test Complete ===");
  console.log("Check that CSS styling information is not visible in the log messages");
}

// Initialize the application with logging
function initializeApp() {
  loggerService.info('Initializing PokeData application');
  
  // Create and mount the app
  const app = new App({
    target: document.body
  });
  
  // Log successful initialization
  loggerService.success('PokeData application initialized successfully');
  
  // Run logger test in development mode
  if (process.env.NODE_ENV !== 'production') {
    // Test the logger formatting
    setTimeout(() => {
      testLogger();
    }, 1000);
    
    window.pokeDataDebug = {
      // Logger configuration
      enableDebugMode: () => {
        enableDebugMode();
        return 'Debug mode enabled';
      },
      disableDebugMode: () => {
        disableDebugMode();
        return 'Debug mode disabled';
      },
      setLogLevel: (level) => {
        setLogLevel(level);
        return `Log level set to ${level}`;
      },
      getLoggerConfig: () => {
        return getLoggerConfig();
      },
      
      // Core logging services
      logger: loggerService,
      
      // Debug tools
      tools: debugTools,
      
      // Debug panel
      panel: {
        show: () => {
          debugPanel.init();
          return 'Debug panel initialized';
        },
        hide: () => {
          debugPanel.hide();
          return 'Debug panel hidden';
        },
        toggle: () => {
          debugPanel.toggle();
          return 'Debug panel toggled';
        }
      },
      
      // Convenience methods
      inspect: debugTools.inspectObject,
      measure: debugTools.measureExecutionTime,
      memory: debugTools.logMemoryUsage,
      monitor: {
        performance: (interval = 5000) => {
          const monitor = debugTools.createPerformanceMonitor(interval);
          monitor.start();
          return monitor;
        },
        network: () => debugTools.monitorNetworkRequests(),
        object: debugTools.monitorObjectProperties
      },
      
      // Help function
      help: () => {
        // Use a single console.log with a multi-line string
        console.log(`PokeData Debug Console
======================

Available commands:

Logger Configuration:
  pokeDataDebug.enableDebugMode()      - Enable debug mode (sets log level to DEBUG)
  pokeDataDebug.disableDebugMode()     - Disable debug mode (sets log level to INFO)
  pokeDataDebug.setLogLevel(level)     - Set log level (DEBUG, INFO, WARN, ERROR, NONE)
  pokeDataDebug.getLoggerConfig()      - Get current logger configuration

Debug Tools:
  pokeDataDebug.inspect(obj, options)  - Inspect an object's properties
  pokeDataDebug.measure(fn, args)      - Measure execution time of a function
  pokeDataDebug.memory()               - Log current memory usage

Monitoring:
  pokeDataDebug.monitor.performance()  - Start performance monitoring
  pokeDataDebug.monitor.network()      - Monitor network requests
  pokeDataDebug.monitor.object(obj)    - Monitor object property access

Debug Panel:
  pokeDataDebug.panel.show()           - Show the debug panel UI
  pokeDataDebug.panel.hide()           - Hide the debug panel UI
  pokeDataDebug.panel.toggle()         - Toggle the debug panel UI

Advanced Tools:
  pokeDataDebug.tools                  - Access all debug tools
  pokeDataDebug.logger                 - Access logger service directly

Examples:
  pokeDataDebug.inspect(document.body)
  pokeDataDebug.measure(() => Array(1000000).fill(0).map((_, i) => i))
  const perfMonitor = pokeDataDebug.monitor.performance()
  perfMonitor.stop()  // Stop performance monitoring`);
        
        return 'Help displayed in console';
      }
    };
    
    // Initialize the debug panel with error handling
    setTimeout(() => {
      try {
        debugPanel.init();
        console.log('Debug panel initialized successfully. Press Alt+D to toggle the panel.');
      } catch (error) {
        console.error('Error initializing debug panel:', error);
      }
    }, 1000);
    
    // Add diagnostic logging
    console.log('Debug configuration initialized:', debugConfig);
    console.log('Logger service configuration:', loggerService.config);
    
    loggerService.info('Debug controls available via window.pokeDataDebug');
    console.log('Debug tools available. Try window.pokeDataDebug.help() for a list of commands');
    
    // Add keyboard shortcut for toggling debug panel
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'd') {
        debugPanel.toggle();
      }
    });
  }
  
  return app;
}

// Start the application
const app = initializeApp();

export default app;
