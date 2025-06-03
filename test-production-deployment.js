const https = require('https');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './PokeDataFunc/.env' });

// Production configuration
const PRODUCTION_CONFIG = {
  baseUrl: 'https://pokedata-func.azurewebsites.net',
  functionKey: process.env.PRODUCTION_FUNCTION_KEY || process.env.AZURE_FUNCTION_KEY,
  endpoints: {
    sets: '/api/sets',
    cardsBySet: '/api/sets/PRE/cards',
    cardInfo: '/api/cards/sv8pt5-161'
  }
};

console.log('🚀 Production Deployment Testing');
console.log('================================');
console.log(`Base URL: ${PRODUCTION_CONFIG.baseUrl}`);
console.log(`Function Key: ${PRODUCTION_CONFIG.functionKey ? 'Loaded' : 'MISSING'}`);
console.log('');

async function makeRequest(url, description) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    console.log(`📡 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`   ✅ Status: ${res.statusCode} (${duration}ms)`);
          
          if (jsonData.items && Array.isArray(jsonData.items)) {
            console.log(`   📊 Items: ${jsonData.items.length}`);
            if (jsonData.totalCount) {
              console.log(`   📈 Total: ${jsonData.totalCount}`);
            }
          } else if (jsonData.cardName) {
            console.log(`   🎴 Card: ${jsonData.cardName}`);
            if (jsonData.enhancedPricing) {
              const pricingSources = Object.keys(jsonData.enhancedPricing).length;
              console.log(`   💰 Pricing Sources: ${pricingSources}`);
            }
          }
          
          resolve({ success: true, data: jsonData, duration, status: res.statusCode });
        } catch (error) {
          console.log(`   ❌ JSON Parse Error: ${error.message}`);
          console.log(`   📄 Raw Response: ${data.substring(0, 200)}...`);
          resolve({ success: false, error: error.message, duration, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`   ❌ Request Error: ${error.message} (${duration}ms)`);
      resolve({ success: false, error: error.message, duration });
    });
    
    req.setTimeout(30000, () => {
      console.log(`   ⏰ Request Timeout (30s)`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration: 30000 });
    });
    
    req.end();
  });
}

async function testProductionEndpoints() {
  const results = [];
  
  // Test 1: GetSetList (PokeData-first)
  console.log('🎯 Test 1: GetSetList (PokeData-first)');
  const setsUrl = `${PRODUCTION_CONFIG.baseUrl}${PRODUCTION_CONFIG.endpoints.sets}?code=${PRODUCTION_CONFIG.functionKey}`;
  const setsResult = await makeRequest(setsUrl, 'Get Sets List');
  results.push({ test: 'GetSetList', ...setsResult });
  console.log('');
  
  // Test 2: GetCardsBySet (On-demand strategy)
  console.log('🎯 Test 2: GetCardsBySet (On-demand strategy)');
  const cardsUrl = `${PRODUCTION_CONFIG.baseUrl}${PRODUCTION_CONFIG.endpoints.cardsBySet}?code=${PRODUCTION_CONFIG.functionKey}`;
  const cardsResult = await makeRequest(cardsUrl, 'Get Cards by Set (PRE)');
  results.push({ test: 'GetCardsBySet', ...cardsResult });
  console.log('');
  
  // Test 3: GetCardInfo (Enhanced pricing)
  console.log('🎯 Test 3: GetCardInfo (Enhanced pricing)');
  const cardInfoUrl = `${PRODUCTION_CONFIG.baseUrl}${PRODUCTION_CONFIG.endpoints.cardInfo}?code=${PRODUCTION_CONFIG.functionKey}`;
  const cardInfoResult = await makeRequest(cardInfoUrl, 'Get Card Info (Umbreon ex)');
  results.push({ test: 'GetCardInfo', ...cardInfoResult });
  console.log('');
  
  return results;
}

async function validatePerformance(results) {
  console.log('📊 Performance Validation');
  console.log('=========================');
  
  const performanceTargets = {
    GetSetList: 2000,    // < 2 seconds
    GetCardsBySet: 5000, // < 5 seconds  
    GetCardInfo: 3000    // < 3 seconds
  };
  
  let allPassed = true;
  
  results.forEach(result => {
    const target = performanceTargets[result.test];
    const passed = result.duration < target;
    const status = passed ? '✅' : '❌';
    
    console.log(`${status} ${result.test}: ${result.duration}ms (target: <${target}ms)`);
    
    if (!passed) {
      allPassed = false;
    }
  });
  
  console.log('');
  console.log(`🎯 Overall Performance: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allPassed;
}

async function validateFunctionality(results) {
  console.log('🔍 Functionality Validation');
  console.log('===========================');
  
  let allPassed = true;
  
  // Validate GetSetList
  const setsResult = results.find(r => r.test === 'GetSetList');
  if (setsResult && setsResult.success && setsResult.data.items) {
    const setCount = setsResult.data.items.length;
    const hasEnglishSets = setCount > 100; // Should have 170+ English sets
    console.log(`✅ GetSetList: ${setCount} sets returned (${hasEnglishSets ? 'PASS' : 'FAIL'})`);
    if (!hasEnglishSets) allPassed = false;
  } else {
    console.log(`❌ GetSetList: Failed to return valid data`);
    allPassed = false;
  }
  
  // Validate GetCardsBySet
  const cardsResult = results.find(r => r.test === 'GetCardsBySet');
  if (cardsResult && cardsResult.success && cardsResult.data.items) {
    const cardCount = cardsResult.data.items.length;
    const hasPrismaticCards = cardCount > 400; // PRE has 447 cards
    console.log(`✅ GetCardsBySet: ${cardCount} cards returned (${hasPrismaticCards ? 'PASS' : 'FAIL'})`);
    if (!hasPrismaticCards) allPassed = false;
  } else {
    console.log(`❌ GetCardsBySet: Failed to return valid data`);
    allPassed = false;
  }
  
  // Validate GetCardInfo
  const cardInfoResult = results.find(r => r.test === 'GetCardInfo');
  if (cardInfoResult && cardInfoResult.success && cardInfoResult.data.cardName) {
    const hasEnhancedPricing = cardInfoResult.data.enhancedPricing && 
                              Object.keys(cardInfoResult.data.enhancedPricing).length > 0;
    console.log(`✅ GetCardInfo: ${cardInfoResult.data.cardName} (${hasEnhancedPricing ? 'Enhanced pricing: PASS' : 'No enhanced pricing: FAIL'})`);
    if (!hasEnhancedPricing) allPassed = false;
  } else {
    console.log(`❌ GetCardInfo: Failed to return valid data`);
    allPassed = false;
  }
  
  console.log('');
  console.log(`🎯 Overall Functionality: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allPassed;
}

async function main() {
  try {
    if (!PRODUCTION_CONFIG.functionKey) {
      console.log('❌ ERROR: Production function key not found in environment variables');
      console.log('   Please set PRODUCTION_FUNCTION_KEY or AZURE_FUNCTION_KEY in PokeDataFunc/.env');
      process.exit(1);
    }
    
    console.log('🚀 Starting Production Deployment Tests...');
    console.log('');
    
    const results = await testProductionEndpoints();
    
    console.log('📋 Test Summary');
    console.log('===============');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.duration}ms (Status: ${result.status || 'Error'})`);
    });
    console.log('');
    
    const performancePassed = await validatePerformance(results);
    const functionalityPassed = await validateFunctionality(results);
    
    console.log('🎯 Final Results');
    console.log('================');
    console.log(`Performance: ${performancePassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Functionality: ${functionalityPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall: ${performancePassed && functionalityPassed ? '🎉 SUCCESS' : '💥 FAILED'}`);
    
    if (performancePassed && functionalityPassed) {
      console.log('');
      console.log('🎉 Production deployment validation SUCCESSFUL!');
      console.log('   Ready for frontend integration.');
    } else {
      console.log('');
      console.log('💥 Production deployment validation FAILED!');
      console.log('   Please check the issues above before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
main();
