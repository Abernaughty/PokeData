/**
 * Comprehensive test script for the enhanced GetCardInfo function
 * This tests the new logging and enrichment logic locally
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:7071/api/cards';

// Test cases - different scenarios to validate enrichment logic
const TEST_CASES = [
    {
        name: "Card needing PokeData ID (Condition 1)",
        cardId: "sv8pt5-161", // Umbreon ex from Prismatic Evolutions
        description: "This card should trigger condition 1 (missing PokeData ID)",
        forceRefresh: false
    },
    {
        name: "Card needing pricing refresh (Condition 2)", 
        cardId: "sv8pt5-155", // Espeon ex from Prismatic Evolutions
        description: "This card may trigger condition 2 (stale pricing)",
        forceRefresh: true // Force refresh to ensure we test pricing logic
    },
    {
        name: "Different set mapping test",
        cardId: "sv4pt5-001", // Test different set code
        description: "Test set code mapping for different expansion",
        forceRefresh: false
    }
];

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSectionHeader(title) {
    console.log('\n' + '='.repeat(80));
    colorLog('bright', `  ${title}`);
    console.log('='.repeat(80));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(60));
    colorLog('cyan', `  ${title}`);
    console.log('-'.repeat(60));
}

async function testCardInfo(testCase) {
    logSectionHeader(`Testing: ${testCase.name}`);
    
    const url = `${BASE_URL}/${testCase.cardId}${testCase.forceRefresh ? '?forceRefresh=true' : ''}`;
    colorLog('blue', `Request URL: ${url}`);
    colorLog('yellow', `Description: ${testCase.description}`);
    
    const startTime = Date.now();
    
    try {
        const response = await axios.get(url);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        colorLog('green', `✅ Request completed successfully in ${duration}ms`);
        
        if (response.data && response.data.data) {
            const card = response.data.data;
            
            logSubSection('Basic Card Information');
            console.log(`- Card ID: ${card.id}`);
            console.log(`- Name: ${card.cardName}`);
            console.log(`- Set: ${card.setName} (${card.setCode})`);
            console.log(`- Number: ${card.cardNumber}`);
            console.log(`- Rarity: ${card.rarity || 'N/A'}`);
            
            logSubSection('PokeData Integration Status');
            if (card.pokeDataId) {
                colorLog('green', `✅ PokeData ID: ${card.pokeDataId}`);
            } else {
                colorLog('red', `❌ PokeData ID: Missing`);
            }
            
            logSubSection('Pricing Data Analysis');
            
            
            // Enhanced pricing
            if (card.enhancedPricing) {
                colorLog('green', `✅ Enhanced Pricing: Present`);
                
                // PSA grades
                if (card.enhancedPricing.psaGrades) {
                    const psaKeys = Object.keys(card.enhancedPricing.psaGrades);
                    console.log(`- PSA Grades: ${psaKeys.length} available`);
                    if (psaKeys.length > 0) {
                        // Show highest grade
                        const highestGrade = psaKeys.sort((a, b) => parseInt(b) - parseInt(a))[0];
                        const psaPrice = card.enhancedPricing.psaGrades[highestGrade];
                        console.log(`  - PSA ${highestGrade}: $${psaPrice.value}`);
                    }
                }
                
                // CGC grades
                if (card.enhancedPricing.cgcGrades) {
                    const cgcKeys = Object.keys(card.enhancedPricing.cgcGrades);
                    console.log(`- CGC Grades: ${cgcKeys.length} available`);
                    if (cgcKeys.length > 0) {
                        // Show a sample high grade
                        const sampleKey = cgcKeys[cgcKeys.length - 1];
                        const cgcPrice = card.enhancedPricing.cgcGrades[sampleKey];
                        console.log(`  - CGC ${sampleKey.replace('_', '.')}: $${cgcPrice.value}`);
                    }
                }
                
                // Raw prices
                if (card.enhancedPricing.ebayRaw) {
                    console.log(`- eBay Raw: $${card.enhancedPricing.ebayRaw.value}`);
                }
                if (card.enhancedPricing.tcgPlayerRaw) {
                    console.log(`- TCGPlayer Raw: $${card.enhancedPricing.tcgPlayerRaw.value}`);
                }
            } else {
                colorLog('red', `❌ Enhanced Pricing: Missing`);
            }
            
            logSubSection('Cache Information');
            console.log(`- Cache Hit: ${response.data.cached ? 'Yes' : 'No'}`);
            if (response.data.cached && response.data.cacheAge) {
                console.log(`- Cache Age: ${response.data.cacheAge} seconds`);
            }
            
            logSubSection('Response Metadata');
            console.log(`- Status: ${response.data.status}`);
            console.log(`- Timestamp: ${response.data.timestamp}`);
            console.log(`- Response Size: ${JSON.stringify(response.data).length} bytes`);
            
        } else {
            colorLog('red', '❌ Invalid response format');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        colorLog('red', `❌ Request failed after ${duration}ms`);
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 'ECONNREFUSED') {
            colorLog('yellow', '⚠️  Make sure Azure Functions Core Tools is running: func start');
        }
    }
}

async function runAllTests() {
    logSectionHeader('Enhanced GetCardInfo Function Testing');
    colorLog('cyan', 'This script tests the new logging and enrichment logic');
    colorLog('yellow', 'Make sure Azure Functions is running locally: cd PokeDataFunc && func start');
    
    console.log('\nTest Configuration:');
    console.log(`- Base URL: ${BASE_URL}`);
    console.log(`- Number of test cases: ${TEST_CASES.length}`);
    console.log(`- Testing enhanced logging and enrichment conditions`);
    
    // Wait a moment for user to read
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (let i = 0; i < TEST_CASES.length; i++) {
        await testCardInfo(TEST_CASES[i]);
        
        // Pause between tests
        if (i < TEST_CASES.length - 1) {
            colorLog('magenta', '\nPress Enter to continue to next test...');
            await new Promise(resolve => {
                process.stdin.once('data', () => resolve());
            });
        }
    }
    
    logSectionHeader('Testing Complete');
    colorLog('green', '✅ All tests completed');
    colorLog('cyan', 'Check the Azure Functions terminal for detailed enrichment logs');
    
    process.exit(0);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    colorLog('yellow', '\n\n⚠️  Test interrupted by user');
    process.exit(0);
});

// Start testing
console.clear();
runAllTests().catch(error => {
    colorLog('red', '❌ Fatal error during testing:');
    console.error(error);
    process.exit(1);
});
