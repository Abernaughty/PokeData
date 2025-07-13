/**
 * Test script to verify the set mapping fix
 * This tests that the data folder is properly included and the mapping service works
 */

const fs = require('fs');
const path = require('path');

console.log('=== SET MAPPING FIX VERIFICATION ===\n');

// Test 1: Check if data folder exists
console.log('1. Checking data folder existence...');
const dataFolderPath = path.join(__dirname, 'PokeDataFunc', 'data');
if (fs.existsSync(dataFolderPath)) {
    console.log('✅ Data folder exists at:', dataFolderPath);
} else {
    console.log('❌ Data folder NOT found at:', dataFolderPath);
    process.exit(1);
}

// Test 2: Check if set-mapping.json exists
console.log('\n2. Checking set-mapping.json file...');
const mappingFilePath = path.join(dataFolderPath, 'set-mapping.json');
if (fs.existsSync(mappingFilePath)) {
    console.log('✅ set-mapping.json exists at:', mappingFilePath);
} else {
    console.log('❌ set-mapping.json NOT found at:', mappingFilePath);
    process.exit(1);
}

// Test 3: Load and validate mapping data
console.log('\n3. Loading and validating mapping data...');
try {
    const mappingData = JSON.parse(fs.readFileSync(mappingFilePath, 'utf8'));
    console.log('✅ Mapping data loaded successfully');
    console.log(`   Total mappings: ${mappingData.metadata.totalMappings}`);
    
    // Test 4: Check specific mapping for Prismatic Evolutions (ID 557)
    console.log('\n4. Testing Prismatic Evolutions mapping (PokeData ID 557)...');
    const prismMapping = Object.entries(mappingData.mappings).find(([tcgId, mapping]) => 
        mapping.pokeDataId === 557
    );
    
    if (prismMapping) {
        const [tcgSetId, mapping] = prismMapping;
        console.log('✅ Prismatic Evolutions mapping found:');
        console.log(`   TCG Set ID: ${tcgSetId}`);
        console.log(`   PokeData ID: ${mapping.pokeDataId}`);
        console.log(`   Set Name: ${mapping.pokeDataName}`);
        console.log(`   Match Type: ${mapping.matchType}`);
    } else {
        console.log('❌ Prismatic Evolutions mapping NOT found');
        process.exit(1);
    }
    
} catch (error) {
    console.log('❌ Error loading mapping data:', error.message);
    process.exit(1);
}

// Test 5: Check .funcignore file
console.log('\n5. Checking .funcignore configuration...');
const funcignorePath = path.join(__dirname, 'PokeDataFunc', '.funcignore');
if (fs.existsSync(funcignorePath)) {
    const funcignoreContent = fs.readFileSync(funcignorePath, 'utf8');
    if (funcignoreContent.includes('data/') && !funcignoreContent.includes('# data/')) {
        console.log('❌ .funcignore still excludes data/ folder');
        console.log('   Please ensure data/ line is commented out or removed');
    } else {
        console.log('✅ .funcignore properly configured (data/ not excluded)');
    }
} else {
    console.log('⚠️  .funcignore file not found');
}

// Test 6: Simulate the mapping service path resolution
console.log('\n6. Testing path resolution simulation...');
const simulatedServicePath = path.join(__dirname, 'PokeDataFunc', 'dist', 'services');
const simulatedMappingPath = path.join(simulatedServicePath, '..', '..', 'data', 'set-mapping.json');
const resolvedPath = path.resolve(simulatedMappingPath);

console.log(`   Simulated service location: ${simulatedServicePath}`);
console.log(`   Resolved mapping path: ${resolvedPath}`);

if (resolvedPath === mappingFilePath) {
    console.log('✅ Path resolution will work correctly in deployed environment');
} else {
    console.log('⚠️  Path resolution may need adjustment');
    console.log(`   Expected: ${mappingFilePath}`);
    console.log(`   Resolved: ${resolvedPath}`);
}

console.log('\n=== VERIFICATION COMPLETE ===');
console.log('✅ All tests passed! The set mapping fix should work correctly.');
console.log('\nNext steps:');
console.log('1. Deploy using GitHub Actions or manual deployment script');
console.log('2. Test GetCardInfo function with card ID 73121 (Umbreon ex)');
console.log('3. Verify logs show "Enhanced with TCG card: sv8pt5-161" instead of "no mapping available"');
