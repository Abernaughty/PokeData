// Simple build script with zero external dependencies
const fs = require('fs');
const path = require('path');

console.log('Starting custom build process...');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'public', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Get environment variables directly with fallbacks
const API_BASE_URL = process.env.API_BASE_URL || 'https://maber-apim-test.azure-api.net/pokedata-api/v0';
const API_KEY = process.env.API_KEY || '';
const API_SUBSCRIPTION_KEY = process.env.API_SUBSCRIPTION_KEY || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const BUILD_TIME = new Date().toISOString();

console.log('Environment variables:');
console.log('- NODE_ENV:', NODE_ENV);
console.log('- API_BASE_URL exists:', !!process.env.API_BASE_URL);
console.log('- API_KEY exists:', !!process.env.API_KEY);
console.log('- API_SUBSCRIPTION_KEY exists:', !!process.env.API_SUBSCRIPTION_KEY);

// Read the main.js file
const mainJsPath = path.join(__dirname, 'src', 'main.js');
let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

// Replace environment variables
mainJsContent = mainJsContent.replace(/process\.env\.NODE_ENV/g, JSON.stringify(NODE_ENV));
mainJsContent = mainJsContent.replace(/process\.env\.API_BASE_URL/g, JSON.stringify(API_BASE_URL));
mainJsContent = mainJsContent.replace(/process\.env\.API_KEY/g, JSON.stringify(API_KEY));
mainJsContent = mainJsContent.replace(/process\.env\.API_SUBSCRIPTION_KEY/g, JSON.stringify(API_SUBSCRIPTION_KEY));
mainJsContent = mainJsContent.replace(/process\.env\.BUILD_TIME/g, JSON.stringify(BUILD_TIME));

// Write the processed main.js to the build directory
fs.writeFileSync(path.join(buildDir, 'bundle.js'), mainJsContent);

// Create a simple CSS file
fs.writeFileSync(path.join(buildDir, 'bundle.css'), '/* Generated CSS */');

console.log('Build completed successfully!');
