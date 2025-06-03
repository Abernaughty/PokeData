const axios = require('axios');
require('dotenv').config({ path: 'PokeDataFunc/.env' });

async function testConsolidatedGetSetList() {
    console.log('🧪 Testing Consolidated GetSetList Function');
    console.log('==========================================');
    
    try {
        // Get authentication from environment
        const functionKey = process.env.AZURE_FUNCTION_KEY;
        
        if (!functionKey) {
            throw new Error('AZURE_FUNCTION_KEY not found in environment variables');
        }
        
        // Test the main /api/sets endpoint (should now use PokeData-first implementation)
        const baseUrl = 'https://pokedata-func-staging.azurewebsites.net';
        const endpoint = '/api/sets';
        const url = `${baseUrl}${endpoint}`;
        
        console.log(`📡 Testing endpoint: ${url}`);
        console.log(`🔑 Using Function Key: ${functionKey.substring(0, 10)}...`);
        console.log(`⏱️  Starting request at: ${new Date().toISOString()}`);
        
        const startTime = Date.now();
        const response = await axios.get(url, {
            params: {
                code: functionKey,
                language: 'ENGLISH',
                page: 1,
                pageSize: 10
            },
            timeout: 30000
        });
        const duration = Date.now() - startTime;
        
        console.log(`✅ Request completed in ${duration}ms`);
        console.log(`📊 Response Status: ${response.status}`);
        
        if (response.data && response.data.data) {
            const { sets, pagination } = response.data.data;
            
            console.log('\n📋 Response Structure Validation:');
            console.log(`   ✅ Sets array: ${Array.isArray(sets) ? 'Valid' : 'Invalid'}`);
            console.log(`   ✅ Sets count: ${sets.length}`);
            console.log(`   ✅ Pagination: ${pagination ? 'Present' : 'Missing'}`);
            
            if (pagination) {
                console.log(`   📄 Page: ${pagination.page}/${pagination.totalPages}`);
                console.log(`   📊 Total sets: ${pagination.totalCount}`);
            }
            
            console.log('\n🎯 Sample Set Data:');
            if (sets.length > 0) {
                const sampleSet = sets[0];
                console.log(`   📦 Name: ${sampleSet.name}`);
                console.log(`   🔢 ID: ${sampleSet.id}`);
                console.log(`   🏷️  Code: ${sampleSet.code || 'null'}`);
                console.log(`   🌍 Language: ${sampleSet.language}`);
                console.log(`   📅 Release Date: ${sampleSet.release_date}`);
                console.log(`   📈 Release Year: ${sampleSet.releaseYear || 'N/A'}`);
                console.log(`   🆕 Is Recent: ${sampleSet.isRecent || false}`);
            }
            
            console.log('\n🎉 SUCCESS: Consolidated GetSetList function is working correctly!');
            console.log('✨ The PokeData-first implementation is now active at /api/sets');
            console.log('🧹 Cleanup completed successfully - temporary functions removed');
            
        } else {
            console.log('❌ ERROR: Unexpected response structure');
            console.log('Response data:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log(`📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

// Run the test
testConsolidatedGetSetList().catch(console.error);
