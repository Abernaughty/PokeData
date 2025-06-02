/**
 * Comprehensive test script for the enhanced GetCardInfo function on Azure
 * This tests the new logging and enrichment logic against deployed Azure Function App
 */

const axios = require('axios');

// Azure Environment Configuration
const ENVIRONMENTS = {
    staging: {
        name: 'Staging',
        baseUrl: 'https://pokedata-func-staging.azurewebsites.net/api/cards',
        functionKey: 'Uo4vpqa7si7iR1T3LpQfJScDpbIdQ473kbPjlmV-YJgCAzFur2lsFg==', // Add your staging function key here
        description: 'Testing against staging slot (auto-deployed from main branch)'
    },
    production: {
        name: 'Production', 
        baseUrl: 'https://pokedata-func.azurewebsites.net/api/cards',
        functionKey: '', // Add your production function key here
        description: 'Testing against production slot (manually deployed)'
    }
};

// Environment selection (can be overridden with AZURE_ENV environment variable)
const TARGET_ENV = process.env.AZURE_ENV || 'staging'; // Default to staging for safety
const CURRENT_ENV = ENVIRONMENTS[TARGET_ENV];

if (!CURRENT_ENV) {
    console.error(`❌ Invalid environment: ${TARGET_ENV}. Use 'staging' or 'production'`);
    process.exit(1);
}

if (!CURRENT_ENV.functionKey) {
    console.error(`❌ Function key not configured for ${TARGET_ENV} environment`);
    console.error('Please set the functionKey in the ENVIRONMENTS configuration');
    process.exit(1);
}

// Test cases - same as local tests but adapted for Azure
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

function buildAzureUrl(cardId, forceRefresh = false) {
    let url = `${CURRENT_ENV.baseUrl}/${cardId}`;
    const params = new URLSearchParams();
    
    // Add function key for authentication
    params.append('code', CURRENT_ENV.functionKey);
    
    // Add forceRefresh if needed
    if (forceRefresh) {
        params.append('forceRefresh', 'true');
    }
    
    return `${url}?${params.toString()}`;
}

async function testCardInfo(testCase) {
    logSectionHeader(`Testing: ${testCase.name}`);
    
    const url = buildAzureUrl(testCase.cardId, testCase.forceRefresh);
    // Don't log the full URL with function key for security
    const safeUrl = url.replace(/code=[^&]+/, 'code=***');
    colorLog('blue', `Request URL: ${safeUrl}`);
    colorLog('yellow', `Description: ${testCase.description}`);
    
    const startTime = Date.now();
    
    try {
        const response = await axios.get(url, {
            timeout: 30000, // 30 second timeout for Azure calls
            headers: {
                'User-Agent': 'PokeData-Azure-Test-Script/1.0'
            }
        });
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
            
            logSubSection('Azure-Specific Validation');
            console.log(`- Environment: ${CURRENT_ENV.name}`);
            console.log(`- Response Headers Present: ${Object.keys(response.headers).length}`);
            
            // Check for Azure Function execution info in headers
            if (response.headers['x-azure-functions-request-id']) {
                colorLog('green', `✅ Azure Functions Request ID: ${response.headers['x-azure-functions-request-id']}`);
            }
            
            logSubSection('Response Metadata');
            console.log(`- Status: ${response.data.status}`);
            console.log(`- Timestamp: ${response.data.timestamp}`);
            console.log(`- Response Size: ${JSON.stringify(response.data).length} bytes`);
            
            // Azure-specific success indicators
            logSubSection('Enhanced Logging Validation');
            colorLog('cyan', '📋 Check Azure Portal → Function App → Monitor → Logs for detailed execution logs');
            colorLog('cyan', '🔍 Look for correlation IDs and enrichment condition evaluations in Azure logs');
            
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
            
            // Azure-specific error guidance
            if (error.response.status === 401) {
                colorLog('yellow', '⚠️  Authentication failed - check function key');
            } else if (error.response.status === 404) {
                colorLog('yellow', '⚠️  Function not found - check deployment status');
            } else if (error.response.status === 500) {
                colorLog('yellow', '⚠️  Server error - check Azure Function logs for details');
            }
        }
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            colorLog('yellow', '⚠️  Cannot connect to Azure Function App - check URL and network connection');
        }
        
        if (error.code === 'ECONNABORTED') {
            colorLog('yellow', '⚠️  Request timeout - Azure Function may be cold starting or overloaded');
        }
    }
}

async function runAllTests() {
    logSectionHeader('Enhanced GetCardInfo Azure Function Testing');
    colorLog('cyan', 'This script tests the enhanced logging and enrichment logic on Azure');
    
    console.log('\nAzure Environment Configuration:');
    console.log(`- Target Environment: ${CURRENT_ENV.name}`);
    console.log(`- Description: ${CURRENT_ENV.description}`);
    console.log(`- Base URL: ${CURRENT_ENV.baseUrl}`);
    console.log(`- Function Key: ${CURRENT_ENV.functionKey ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`- Number of test cases: ${TEST_CASES.length}`);
    
    logSubSection('Environment Variables');
    console.log('You can override the environment with:');
    colorLog('yellow', 'AZURE_ENV=staging node test-azure-enhanced-getCardInfo.js');
    colorLog('yellow', 'AZURE_ENV=production node test-azure-enhanced-getCardInfo.js');
    
    logSubSection('Azure Portal Monitoring');
    colorLog('cyan', '📊 Monitor Azure Function execution:');
    console.log('1. Go to Azure Portal → pokedata-func Function App');
    console.log('2. Navigate to Functions → GetCardInfo → Monitor');
    console.log('3. View Logs for detailed execution traces');
    console.log('4. Look for correlation IDs like [card-sv3pt5-172-timestamp]');
    
    // Wait a moment for user to read
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    
    logSectionHeader('Azure Testing Complete');
    colorLog('green', '✅ All Azure tests completed');
    colorLog('cyan', '📋 Check Azure Portal Function App logs for enhanced logging details');
    colorLog('yellow', '🔍 Verify correlation IDs and enrichment condition evaluations in Azure logs');
    
    logSubSection('Next Steps');
    console.log('1. Review Azure Function logs in Azure Portal');
    console.log('2. Verify enhanced logging appears with correlation IDs');
    console.log('3. Check that RefreshData shows daily schedule in logs');
    console.log('4. Validate all three enrichment conditions work correctly');
    
    process.exit(0);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    colorLog('yellow', '\n\n⚠️  Azure test interrupted by user');
    process.exit(0);
});

// Display usage information if no function key is configured
if (!CURRENT_ENV.functionKey) {
    console.log('\n' + '='.repeat(80));
    colorLog('red', '❌ Function key configuration required');
    console.log('='.repeat(80));
    console.log('\nTo configure function keys:');
    console.log('1. Go to Azure Portal → pokedata-func Function App');
    console.log('2. Navigate to Functions → GetCardInfo → Function Keys');
    console.log('3. Copy the "default" function key');
    console.log('4. Update the functionKey in ENVIRONMENTS configuration');
    console.log('\nFor staging: ENVIRONMENTS.staging.functionKey = "your-key-here"');
    console.log('For production: ENVIRONMENTS.production.functionKey = "your-key-here"');
    process.exit(1);
}

// Start testing
console.clear();
runAllTests().catch(error => {
    colorLog('red', '❌ Fatal error during Azure testing:');
    console.error(error);
    process.exit(1);
});
