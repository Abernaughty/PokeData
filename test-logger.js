// Import the logger service
import { loggerService, dbLogger } from './src/services/loggerService.js';

// Test basic logging
console.log("=== Testing Basic Logging ===");
loggerService.debug("This is a debug message");
loggerService.info("This is an info message");
loggerService.warn("This is a warning message");
loggerService.error("This is an error message");
loggerService.success("This is a success message");

// Test timer functions
console.log("\n=== Testing Timer Functions ===");
loggerService.time("testTimer");
setTimeout(() => {
  loggerService.timeEnd("testTimer");
}, 100);

// Test group functions
console.log("\n=== Testing Group Functions ===");
loggerService.group("Test Group");
loggerService.debug("This is inside a group");
loggerService.info("Another message inside the group");
loggerService.groupEnd();

// Test DB operations logging
console.log("\n=== Testing DB Operations Logging ===");
dbLogger.logDbOperation("get", "setList", "pokemonSets", { count: 150, age: "2 hours" });

console.log("\n=== Test Complete ===");
console.log("Check the console output to verify that CSS styling information is not visible in the log messages.");
