import App from './App.svelte';
import { initializeDebugSystem } from './debug';
import { loggerService, dbLogger } from './services/loggerService';

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
  
  // Initialize debug system in development mode
  if (process.env.NODE_ENV !== 'production') {
    // Initialize the debug system
    window.pokeDataDebug = initializeDebugSystem();
    
    // Run logger test in development mode
    setTimeout(() => {
      testLogger();
    }, 1000);
  }
  
  return app;
}

// Start the application
const app = initializeApp();

export default app;
