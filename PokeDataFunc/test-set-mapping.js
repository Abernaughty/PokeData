const { setMappingService } = require('./src/services/SetMappingService');

console.log('🧪 Testing Set Mapping Service...\n');

// Test cases for our key mappings
const testCases = [
    {
        tcgSetCode: 'sv8pt5',
        expectedPokeDataCode: 'PRE',
        expectedPokeDataId: 557,
        description: 'Prismatic Evolutions'
    },
    {
        tcgSetCode: 'sv8',
        expectedPokeDataCode: 'SSP',
        expectedPokeDataId: 555,
        description: 'Surging Sparks'
    },
    {
        tcgSetCode: 'sv6',
        expectedPokeDataCode: 'TWM',
        expectedPokeDataId: 545,
        description: 'Twilight Masquerade'
    },
    {
        tcgSetCode: 'sv9',
        expectedPokeDataCode: 'JTG',
        expectedPokeDataId: 562,
        description: 'Journey Together'
    },
    {
        tcgSetCode: 'nonexistent',
        expectedPokeDataCode: null,
        expectedPokeDataId: null,
        description: 'Non-existent set (should return null)'
    }
];

console.log('📊 Mapping Statistics:');
const stats = setMappingService.getMappingStats();
console.log(`- Total mappings: ${stats.totalMappings}`);
console.log(`- Unmapped TCG sets: ${stats.unmappedTcg}`);
console.log(`- Unmapped PokeData sets: ${stats.unmappedPokeData}`);
console.log(`- Generated: ${stats.generated}\n`);

console.log('🔍 Testing individual mappings:\n');

let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
    console.log(`Testing: ${testCase.tcgSetCode} (${testCase.description})`);
    
    // Test getPokeDataSetId
    const actualSetId = setMappingService.getPokeDataSetId(testCase.tcgSetCode);
    const setIdMatch = actualSetId === testCase.expectedPokeDataId;
    
    // Test getPokeDataSetCode
    const actualSetCode = setMappingService.getPokeDataSetCode(testCase.tcgSetCode);
    const setCodeMatch = actualSetCode === testCase.expectedPokeDataCode;
    
    // Test hasMapping
    const hasMapping = setMappingService.hasMapping(testCase.tcgSetCode);
    const expectedHasMapping = testCase.expectedPokeDataId !== null;
    const hasMappingMatch = hasMapping === expectedHasMapping;
    
    // Test getSetMapping
    const fullMapping = setMappingService.getSetMapping(testCase.tcgSetCode);
    const fullMappingMatch = testCase.expectedPokeDataId !== null ? 
        (fullMapping !== null && fullMapping.pokeDataId === testCase.expectedPokeDataId) :
        (fullMapping === null);
    
    const allTestsPassed = setIdMatch && setCodeMatch && hasMappingMatch && fullMappingMatch;
    
    if (allTestsPassed) {
        console.log(`  ✅ PASS - Set ID: ${actualSetId}, Set Code: ${actualSetCode}, Has Mapping: ${hasMapping}`);
        passedTests++;
    } else {
        console.log(`  ❌ FAIL`);
        console.log(`    Expected Set ID: ${testCase.expectedPokeDataId}, Got: ${actualSetId} (${setIdMatch ? 'PASS' : 'FAIL'})`);
        console.log(`    Expected Set Code: ${testCase.expectedPokeDataCode}, Got: ${actualSetCode} (${setCodeMatch ? 'PASS' : 'FAIL'})`);
        console.log(`    Expected Has Mapping: ${expectedHasMapping}, Got: ${hasMapping} (${hasMappingMatch ? 'PASS' : 'FAIL'})`);
        console.log(`    Full Mapping Test: ${fullMappingMatch ? 'PASS' : 'FAIL'}`);
    }
    console.log('');
}

console.log(`🎯 Test Results: ${passedTests}/${totalTests} tests passed\n`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Set mapping service is working correctly.');
    
    // Show some example mappings
    console.log('\n📋 Sample mappings:');
    const sampleMappings = ['sv8pt5', 'sv8', 'sv7', 'sv6', 'sv5'];
    
    for (const setCode of sampleMappings) {
        const mapping = setMappingService.getSetMapping(setCode);
        if (mapping) {
            console.log(`  ${setCode} → ${mapping.pokeDataCode || 'N/A'} (ID: ${mapping.pokeDataId}) - ${mapping.tcgName}`);
        }
    }
} else {
    console.log('❌ Some tests failed. Please check the mapping configuration.');
    process.exit(1);
}
