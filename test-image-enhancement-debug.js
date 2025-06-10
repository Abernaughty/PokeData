/**
 * Debug script for image enhancement issue
 * Tests the specific case: Ortega #141 from Prismatic Evolutions (PokeData ID 73101)
 */

const fs = require('fs');
const path = require('path');

// Test the mapping data directly
function testSetMapping() {
    console.log('=== TESTING SET MAPPING DATA ===');
    
    try {
        const mappingPath = path.join(__dirname, 'PokeDataFunc/data/set-mapping.json');
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        console.log('✅ Set mapping file loaded successfully');
        console.log(`📊 Total mappings: ${mappingData.metadata.totalMappings}`);
        
        // Test the specific mapping for Prismatic Evolutions
        const preMappingKey = 'sv8pt5';
        const preMapping = mappingData.mappings[preMappingKey];
        
        if (preMapping) {
            console.log('\n🎯 PRISMATIC EVOLUTIONS MAPPING FOUND:');
            console.log(`   Pokemon TCG Set ID: ${preMappingKey}`);
            console.log(`   PokeData Set ID: ${preMapping.pokeDataId}`);
            console.log(`   PokeData Code: ${preMapping.pokeDataCode}`);
            console.log(`   Set Name: ${preMapping.tcgName}`);
            console.log(`   Match Type: ${preMapping.matchType}`);
            
            // Create reverse mapping to test PokeData ID -> TCG Set ID lookup
            const reverseMapping = {};
            Object.entries(mappingData.mappings).forEach(([tcgSetId, mapping]) => {
                reverseMapping[mapping.pokeDataId] = tcgSetId;
            });
            
            const pokeDataSetId = 557; // Prismatic Evolutions
            const tcgSetId = reverseMapping[pokeDataSetId];
            
            if (tcgSetId) {
                console.log(`\n✅ REVERSE MAPPING TEST PASSED:`);
                console.log(`   PokeData Set ID ${pokeDataSetId} → Pokemon TCG Set ID ${tcgSetId}`);
                
                // Test the specific card ID construction
                const cardNumber = '141'; // Ortega's card number
                const expectedTcgCardId = `${tcgSetId}-${cardNumber}`;
                console.log(`   Expected TCG Card ID: ${expectedTcgCardId}`);
                
                return {
                    success: true,
                    pokeDataSetId,
                    tcgSetId,
                    expectedTcgCardId
                };
            } else {
                console.log(`❌ REVERSE MAPPING FAILED: No TCG set ID found for PokeData set ID ${pokeDataSetId}`);
                return { success: false, error: 'Reverse mapping failed' };
            }
        } else {
            console.log(`❌ MAPPING NOT FOUND: No mapping found for ${preMappingKey}`);
            return { success: false, error: 'Mapping not found' };
        }
        
    } catch (error) {
        console.log(`❌ ERROR loading mapping data: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test the PokeDataToTcgMappingService logic
function testMappingServiceLogic() {
    console.log('\n=== TESTING MAPPING SERVICE LOGIC ===');
    
    try {
        // Simulate the service logic
        const mappingPath = path.join(__dirname, 'PokeDataFunc/data/set-mapping.json');
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        // Generate reverse mapping (same as PokeDataToTcgMappingService)
        const reverseMapping = {};
        Object.entries(mappingData.mappings).forEach(([tcgSetId, mapping]) => {
            reverseMapping[mapping.pokeDataId] = tcgSetId;
        });
        
        console.log(`📊 Generated reverse mapping for ${Object.keys(reverseMapping).length} sets`);
        
        // Test the specific case from the logs
        const testPokeDataSetId = 557; // Prismatic Evolutions
        const tcgSetId = reverseMapping[testPokeDataSetId];
        
        if (tcgSetId) {
            console.log(`✅ MAPPING SERVICE TEST PASSED:`);
            console.log(`   PokeData Set ID ${testPokeDataSetId} → TCG Set ID ${tcgSetId}`);
            
            // Test card number normalization
            const testCardNumbers = ['141', '002', '047', '247'];
            console.log('\n🔢 CARD NUMBER NORMALIZATION TEST:');
            
            testCardNumbers.forEach(cardNum => {
                const normalized = parseInt(cardNum, 10).toString();
                const tcgCardId = `${tcgSetId}-${normalized}`;
                console.log(`   "${cardNum}" → "${normalized}" → TCG Card ID: ${tcgCardId}`);
            });
            
            return { success: true, tcgSetId, reverseMapping };
        } else {
            console.log(`❌ MAPPING SERVICE TEST FAILED: No TCG set ID found for PokeData set ID ${testPokeDataSetId}`);
            return { success: false, error: 'No mapping found' };
        }
        
    } catch (error) {
        console.log(`❌ ERROR in mapping service logic: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test the specific case from the logs
function testSpecificCase() {
    console.log('\n=== TESTING SPECIFIC CASE: ORTEGA #141 ===');
    
    const testCard = {
        id: 73101,
        name: 'Ortega',
        num: '141',
        set_id: 557,
        set_name: 'Prismatic Evolutions'
    };
    
    console.log('🃏 Test Card Details:');
    console.log(`   PokeData ID: ${testCard.id}`);
    console.log(`   Name: ${testCard.name}`);
    console.log(`   Card Number: ${testCard.num}`);
    console.log(`   Set ID: ${testCard.set_id}`);
    console.log(`   Set Name: ${testCard.set_name}`);
    
    // Test the mapping lookup
    const mappingResult = testMappingServiceLogic();
    if (mappingResult.success) {
        const normalizedCardNumber = parseInt(testCard.num, 10).toString();
        const expectedTcgCardId = `${mappingResult.tcgSetId}-${normalizedCardNumber}`;
        
        console.log('\n🎯 EXPECTED ENHANCEMENT RESULT:');
        console.log(`   TCG Set ID: ${mappingResult.tcgSetId}`);
        console.log(`   Normalized Card Number: ${normalizedCardNumber}`);
        console.log(`   Expected TCG Card ID: ${expectedTcgCardId}`);
        console.log(`   Expected Image URLs:`);
        console.log(`     Small: https://images.pokemontcg.io/${expectedTcgCardId}.png`);
        console.log(`     Large: https://images.pokemontcg.io/${expectedTcgCardId}_hires.png`);
        
        return { success: true, expectedTcgCardId };
    } else {
        console.log(`❌ SPECIFIC CASE TEST FAILED: ${mappingResult.error}`);
        return { success: false, error: mappingResult.error };
    }
}

// Check if the compiled JavaScript files exist
function checkCompiledFiles() {
    console.log('\n=== CHECKING COMPILED FILES ===');
    
    const filesToCheck = [
        'PokeDataFunc/services/PokeDataToTcgMappingService.js',
        'PokeDataFunc/services/ImageEnhancementService.js',
        'PokeDataFunc/functions/GetCardInfo/index.js'
    ];
    
    filesToCheck.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            console.log(`✅ ${file} exists (${Math.round(stats.size / 1024)}KB, modified: ${stats.mtime.toISOString()})`);
        } else {
            console.log(`❌ ${file} MISSING - needs TypeScript compilation`);
        }
    });
}

// Main test execution
function runAllTests() {
    console.log('🔍 IMAGE ENHANCEMENT DEBUG SCRIPT');
    console.log('=====================================');
    
    const results = {
        setMapping: testSetMapping(),
        mappingService: testMappingServiceLogic(),
        specificCase: testSpecificCase()
    };
    
    checkCompiledFiles();
    
    console.log('\n📋 SUMMARY:');
    console.log(`   Set Mapping Data: ${results.setMapping.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Mapping Service Logic: ${results.mappingService.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Specific Case (Ortega): ${results.specificCase.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.setMapping.success && results.mappingService.success && results.specificCase.success) {
        console.log('\n🎉 ALL TESTS PASSED - Image enhancement should work!');
        console.log('💡 If still failing, check:');
        console.log('   1. TypeScript compilation (run: cd PokeDataFunc && pnpm run build)');
        console.log('   2. Deployment status (compiled JS files deployed to Azure)');
        console.log('   3. Pokemon TCG API key configuration');
        console.log('   4. Network connectivity from Azure to Pokemon TCG API');
    } else {
        console.log('\n❌ TESTS FAILED - Image enhancement will not work');
        console.log('🔧 Issues to fix:');
        Object.entries(results).forEach(([test, result]) => {
            if (!result.success) {
                console.log(`   - ${test}: ${result.error}`);
            }
        });
    }
}

// Run the tests
runAllTests();
