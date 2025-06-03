const dotenv = require('dotenv');
const { PokeDataApiService } = require('./src/services/PokeDataApiService');

// Load environment variables
dotenv.config();

async function testPokeDataFirstGetSetListStandalone() {
    console.log('🧪 Testing PokeData-First GetSetList (Standalone)');
    console.log('=' .repeat(60));
    
    try {
        // Initialize PokeDataApiService
        const apiKey = process.env.POKEDATA_API_KEY;
        const baseUrl = process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
        
        if (!apiKey) {
            throw new Error('POKEDATA_API_KEY not found in environment variables');
        }
        
        console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`🌐 Base URL: ${baseUrl}`);
        
        const pokeDataApiService = new PokeDataApiService(apiKey, baseUrl);
        
        // Test 1: Get all sets
        console.log('\n📋 Test 1: Getting all sets from PokeData API');
        const startTime = Date.now();
        
        const allSets = await pokeDataApiService.getAllSets();
        const apiTime = Date.now() - startTime;
        
        console.log(`✅ Retrieved ${allSets.length} total sets in ${apiTime}ms`);
        
        if (allSets.length === 0) {
            console.log('❌ No sets returned from API');
            return;
        }
        
        // Test 2: Filter by language
        const englishSets = allSets.filter(set => set.language === 'ENGLISH');
        const japaneseSets = allSets.filter(set => set.language === 'JAPANESE');
        
        console.log(`📊 Language breakdown:`);
        console.log(`   - English sets: ${englishSets.length}`);
        console.log(`   - Japanese sets: ${japaneseSets.length}`);
        
        // Test 3: Analyze set structure
        console.log('\n🔍 Test 3: Analyzing set structure');
        const sampleSets = englishSets.slice(0, 5);
        
        sampleSets.forEach((set, index) => {
            console.log(`\n📦 Sample Set ${index + 1}:`);
            console.log(`   - ID: ${set.id}`);
            console.log(`   - Code: ${set.code || 'null'}`);
            console.log(`   - Name: ${set.name}`);
            console.log(`   - Language: ${set.language}`);
            console.log(`   - Release Date: ${set.release_date}`);
        });
        
        // Test 4: Check for recent sets
        console.log('\n📅 Test 4: Checking for recent sets');
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        const recentSets = englishSets.filter(set => {
            if (!set.release_date) return false;
            return new Date(set.release_date) > twoYearsAgo;
        });
        
        console.log(`🆕 Found ${recentSets.length} recent sets (last 2 years)`);
        
        if (recentSets.length > 0) {
            console.log('Recent sets:');
            recentSets.slice(0, 10).forEach(set => {
                console.log(`   - ${set.name} (${set.code || 'no code'}) - ${set.release_date}`);
            });
        }
        
        // Test 5: Validate data quality
        console.log('\n✅ Test 5: Data quality validation');
        
        const setsWithCodes = englishSets.filter(set => set.code && set.code !== null);
        const setsWithoutCodes = englishSets.filter(set => !set.code || set.code === null);
        
        console.log(`📊 Code availability:`);
        console.log(`   - Sets with codes: ${setsWithCodes.length} (${((setsWithCodes.length / englishSets.length) * 100).toFixed(1)}%)`);
        console.log(`   - Sets without codes: ${setsWithoutCodes.length} (${((setsWithoutCodes.length / englishSets.length) * 100).toFixed(1)}%)`);
        
        // Test 6: Pagination simulation
        console.log('\n📄 Test 6: Pagination simulation');
        const pageSize = 20;
        const totalPages = Math.ceil(englishSets.length / pageSize);
        
        console.log(`📊 Pagination info:`);
        console.log(`   - Total sets: ${englishSets.length}`);
        console.log(`   - Page size: ${pageSize}`);
        console.log(`   - Total pages: ${totalPages}`);
        
        // Simulate first page
        const firstPage = englishSets.slice(0, pageSize);
        console.log(`   - First page: ${firstPage.length} sets`);
        console.log(`   - First set: ${firstPage[0]?.name}`);
        console.log(`   - Last set: ${firstPage[firstPage.length - 1]?.name}`);
        
        // Test 7: Performance metrics
        console.log('\n⚡ Test 7: Performance summary');
        console.log(`📊 Performance metrics:`);
        console.log(`   - API response time: ${apiTime}ms`);
        console.log(`   - Sets per second: ${(allSets.length / (apiTime / 1000)).toFixed(1)}`);
        console.log(`   - Average time per set: ${(apiTime / allSets.length).toFixed(2)}ms`);
        
        // Test 8: Validation results
        console.log('\n🎯 Test 8: Validation results');
        
        const validationResults = {
            totalSets: allSets.length > 0,
            hasEnglishSets: englishSets.length > 0,
            hasValidStructure: sampleSets.every(set => 
                typeof set.id === 'number' && 
                typeof set.name === 'string' && 
                typeof set.language === 'string'
            ),
            hasRecentSets: recentSets.length > 0,
            reasonableResponseTime: apiTime < 5000, // Less than 5 seconds
        };
        
        const passedTests = Object.values(validationResults).filter(Boolean).length;
        const totalTests = Object.keys(validationResults).length;
        
        console.log(`✅ Validation Summary: ${passedTests}/${totalTests} tests passed`);
        
        Object.entries(validationResults).forEach(([test, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
        });
        
        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! PokeData-first GetSetList is ready for implementation.');
        } else {
            console.log('\n⚠️  Some tests failed. Review the issues before proceeding.');
        }
        
    } catch (error) {
        console.error('❌ Error in standalone test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetSetListStandalone();
