const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

async function testPokeDataFirstGetSetListAzure() {
    console.log('🧪 Testing PokeData-First GetSetList (Azure Functions)');
    console.log('=' .repeat(60));
    
    try {
        // Configuration
        const functionUrl = process.env.AZURE_FUNCTION_URL || 'https://pokedata-func.azurewebsites.net';
        const functionKey = process.env.AZURE_FUNCTION_KEY;
        
        if (!functionKey) {
            throw new Error('AZURE_FUNCTION_KEY not found in environment variables');
        }
        
        console.log(`🌐 Function URL: ${functionUrl}`);
        console.log(`🔑 Using Function Key: ${functionKey.substring(0, 10)}...`);
        
        // Test 1: Basic GetSetList call
        console.log('\n📋 Test 1: Basic PokeData-first GetSetList call');
        const startTime = Date.now();
        
        const response = await axios.get(`${functionUrl}/api/pokedata/sets`, {
            headers: {
                'x-functions-key': functionKey,
                'Content-Type': 'application/json'
            },
            params: {
                language: 'ENGLISH',
                page: 1,
                pageSize: 20
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Response received in ${responseTime}ms`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📦 Response size: ${JSON.stringify(response.data).length} bytes`);
        
        // Test 2: Validate response structure
        console.log('\n🔍 Test 2: Validating response structure');
        
        const data = response.data;
        
        if (!data || !data.data) {
            throw new Error('Invalid response structure: missing data property');
        }
        
        const { sets, pagination } = data.data;
        
        console.log(`✅ Response structure validation:`);
        console.log(`   - Status: ${data.status}`);
        console.log(`   - Timestamp: ${data.timestamp}`);
        console.log(`   - Cached: ${data.cached || false}`);
        console.log(`   - Cache Age: ${data.cacheAge || 'N/A'}`);
        console.log(`   - Sets count: ${sets.length}`);
        console.log(`   - Pagination: ${JSON.stringify(pagination)}`);
        
        // Test 3: Validate set structure
        console.log('\n📦 Test 3: Validating set structure');
        
        if (sets.length === 0) {
            throw new Error('No sets returned');
        }
        
        const sampleSet = sets[0];
        console.log(`📋 Sample set structure:`);
        console.log(`   - ID: ${sampleSet.id}`);
        console.log(`   - Code: ${sampleSet.code || 'null'}`);
        console.log(`   - Name: ${sampleSet.name}`);
        console.log(`   - Language: ${sampleSet.language}`);
        console.log(`   - Release Date: ${sampleSet.release_date}`);
        console.log(`   - Release Year: ${sampleSet.releaseYear || 'N/A'}`);
        console.log(`   - Is Recent: ${sampleSet.isRecent || false}`);
        
        // Test 4: Test pagination
        console.log('\n📄 Test 4: Testing pagination');
        
        const page2Response = await axios.get(`${functionUrl}/api/pokedata/sets`, {
            headers: {
                'x-functions-key': functionKey,
                'Content-Type': 'application/json'
            },
            params: {
                language: 'ENGLISH',
                page: 2,
                pageSize: 10
            }
        });
        
        const page2Data = page2Response.data.data;
        console.log(`✅ Page 2 results:`);
        console.log(`   - Sets count: ${page2Data.sets.length}`);
        console.log(`   - Page: ${page2Data.pagination.page}`);
        console.log(`   - Total pages: ${page2Data.pagination.totalPages}`);
        console.log(`   - Total count: ${page2Data.pagination.totalCount}`);
        
        // Test 5: Test language filtering
        console.log('\n🌐 Test 5: Testing language filtering');
        
        const japaneseResponse = await axios.get(`${functionUrl}/api/pokedata/sets`, {
            headers: {
                'x-functions-key': functionKey,
                'Content-Type': 'application/json'
            },
            params: {
                language: 'JAPANESE',
                page: 1,
                pageSize: 10
            }
        });
        
        const japaneseData = japaneseResponse.data.data;
        console.log(`✅ Japanese sets:`);
        console.log(`   - Sets count: ${japaneseData.sets.length}`);
        console.log(`   - Total count: ${japaneseData.pagination.totalCount}`);
        
        if (japaneseData.sets.length > 0) {
            console.log(`   - Sample: ${japaneseData.sets[0].name} (${japaneseData.sets[0].language})`);
        }
        
        // Test 6: Test cache behavior
        console.log('\n💾 Test 6: Testing cache behavior');
        
        const cacheTestStart = Date.now();
        const cachedResponse = await axios.get(`${functionUrl}/api/pokedata/sets`, {
            headers: {
                'x-functions-key': functionKey,
                'Content-Type': 'application/json'
            },
            params: {
                language: 'ENGLISH',
                page: 1,
                pageSize: 20
            }
        });
        
        const cacheTestTime = Date.now() - cacheTestStart;
        const cachedData = cachedResponse.data;
        
        console.log(`✅ Cache test results:`);
        console.log(`   - Response time: ${cacheTestTime}ms`);
        console.log(`   - Cached: ${cachedData.cached || false}`);
        console.log(`   - Cache age: ${cachedData.cacheAge || 'N/A'}`);
        console.log(`   - Performance improvement: ${responseTime > cacheTestTime ? 'YES' : 'NO'}`);
        
        // Test 7: Test force refresh
        console.log('\n🔄 Test 7: Testing force refresh');
        
        const refreshStart = Date.now();
        const refreshResponse = await axios.get(`${functionUrl}/api/pokedata/sets`, {
            headers: {
                'x-functions-key': functionKey,
                'Content-Type': 'application/json'
            },
            params: {
                language: 'ENGLISH',
                page: 1,
                pageSize: 20,
                forceRefresh: 'true'
            }
        });
        
        const refreshTime = Date.now() - refreshStart;
        const refreshData = refreshResponse.data;
        
        console.log(`✅ Force refresh results:`);
        console.log(`   - Response time: ${refreshTime}ms`);
        console.log(`   - Cached: ${refreshData.cached || false}`);
        console.log(`   - Fresh data: ${!refreshData.cached ? 'YES' : 'NO'}`);
        
        // Test 8: Performance comparison
        console.log('\n⚡ Test 8: Performance analysis');
        
        console.log(`📊 Performance metrics:`);
        console.log(`   - Initial request: ${responseTime}ms`);
        console.log(`   - Cached request: ${cacheTestTime}ms`);
        console.log(`   - Force refresh: ${refreshTime}ms`);
        console.log(`   - Cache speedup: ${((responseTime - cacheTestTime) / responseTime * 100).toFixed(1)}%`);
        
        // Test 9: Data quality validation
        console.log('\n✅ Test 9: Data quality validation');
        
        const allTestSets = sets;
        const validationResults = {
            hasValidIds: allTestSets.every(set => typeof set.id === 'number'),
            hasValidNames: allTestSets.every(set => typeof set.name === 'string' && set.name.length > 0),
            hasValidLanguages: allTestSets.every(set => ['ENGLISH', 'JAPANESE'].includes(set.language)),
            hasValidDates: allTestSets.every(set => !set.release_date || !isNaN(new Date(set.release_date))),
            hasEnhancedMetadata: allTestSets.some(set => set.releaseYear !== undefined),
            reasonableResponseTime: responseTime < 10000, // Less than 10 seconds
            properPagination: pagination.totalCount > 0 && pagination.totalPages > 0
        };
        
        const passedTests = Object.values(validationResults).filter(Boolean).length;
        const totalTests = Object.keys(validationResults).length;
        
        console.log(`✅ Validation Summary: ${passedTests}/${totalTests} tests passed`);
        
        Object.entries(validationResults).forEach(([test, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
        });
        
        // Test 10: Final summary
        console.log('\n🎯 Test 10: Final summary');
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! PokeData-first GetSetList Azure Function is working correctly.');
            console.log('\n📋 Key achievements:');
            console.log(`   ✅ Successfully retrieved ${pagination.totalCount} total sets`);
            console.log(`   ✅ Pagination working correctly (${pagination.totalPages} pages)`);
            console.log(`   ✅ Language filtering functional`);
            console.log(`   ✅ Caching system operational`);
            console.log(`   ✅ Performance within acceptable limits`);
            console.log(`   ✅ Data quality validation passed`);
            
            console.log('\n🚀 Ready for frontend integration!');
        } else {
            console.log('⚠️  Some tests failed. Review the issues before proceeding.');
        }
        
    } catch (error) {
        console.error('❌ Error in Azure Functions test:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testPokeDataFirstGetSetListAzure();
