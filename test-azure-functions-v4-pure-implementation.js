/**
 * Azure Functions v4 Pure Implementation Validation Test
 * 
 * This script validates that we have successfully implemented a pure Azure Functions v4
 * programming model without any conflicting function.json files.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Azure Functions v4 Pure Implementation Validation');
console.log('=' .repeat(60));

let allTestsPassed = true;
const issues = [];

// Test 1: Verify no function.json files exist in the project
console.log('\n📋 Test 1: Checking for conflicting function.json files...');

const searchDirs = [
    'PokeDataFunc/src/functions',
    'PokeDataFunc/functions', 
    'PokeDataFunc/dist'
];

function findFunctionJsonFiles(dir) {
    const found = [];
    if (!fs.existsSync(dir)) {
        return found;
    }
    
    function searchRecursive(currentDir) {
        const items = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);
            if (item.isDirectory()) {
                searchRecursive(fullPath);
            } else if (item.name === 'function.json') {
                found.push(fullPath);
            }
        }
    }
    
    searchRecursive(dir);
    return found;
}

let foundFunctionJsonFiles = [];
for (const dir of searchDirs) {
    const files = findFunctionJsonFiles(dir);
    foundFunctionJsonFiles = foundFunctionJsonFiles.concat(files);
}

if (foundFunctionJsonFiles.length === 0) {
    console.log('✅ No conflicting function.json files found');
} else {
    console.log('❌ Found conflicting function.json files:');
    foundFunctionJsonFiles.forEach(file => console.log(`   - ${file}`));
    issues.push('Conflicting function.json files still exist');
    allTestsPassed = false;
}

// Test 2: Verify v4 registrations exist in src/index.ts
console.log('\n📋 Test 2: Checking v4 function registrations...');

const indexTsPath = 'PokeDataFunc/src/index.ts';
if (fs.existsSync(indexTsPath)) {
    const indexContent = fs.readFileSync(indexTsPath, 'utf8');
    
    const expectedRegistrations = [
        "app.http('getCardInfo'",
        "app.http('getCardsBySet'",
        "app.http('getSetList'",
        "app.timer('refreshData'"
    ];
    
    let registrationsFound = 0;
    for (const registration of expectedRegistrations) {
        if (indexContent.includes(registration)) {
            console.log(`✅ Found: ${registration}`);
            registrationsFound++;
        } else {
            console.log(`❌ Missing: ${registration}`);
            issues.push(`Missing v4 registration: ${registration}`);
            allTestsPassed = false;
        }
    }
    
    if (registrationsFound === expectedRegistrations.length) {
        console.log('✅ All v4 function registrations found');
    }
} else {
    console.log('❌ src/index.ts not found');
    issues.push('Main entry point src/index.ts missing');
    allTestsPassed = false;
}

// Test 3: Verify compiled output structure
console.log('\n📋 Test 3: Checking compiled output structure...');

const distPath = 'PokeDataFunc/dist';
const requiredFiles = [
    'index.js',
    'host.json',
    'package.json',
    'functions/getCardInfo.js',
    'functions/getCardsBySet.js',
    'functions/getSetList.js',
    'functions/refreshData.js'
];

for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        issues.push(`Required file missing: ${file}`);
        allTestsPassed = false;
    }
}

// Test 4: Verify package.json main field
console.log('\n📋 Test 4: Checking package.json configuration...');

const packageJsonPath = 'PokeDataFunc/package.json';
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.main === 'dist/index.js') {
        console.log('✅ package.json main field correctly set to "dist/index.js"');
    } else {
        console.log(`❌ package.json main field is "${packageJson.main}", should be "dist/index.js"`);
        issues.push('Incorrect package.json main field');
        allTestsPassed = false;
    }
    
    if (packageJson.dependencies && packageJson.dependencies['@azure/functions']) {
        const version = packageJson.dependencies['@azure/functions'];
        console.log(`✅ @azure/functions dependency found: ${version}`);
        
        // Check if it's v4+
        const majorVersion = parseInt(version.replace(/[^\d]/g, ''));
        if (majorVersion >= 4) {
            console.log('✅ Using Azure Functions v4+ package');
        } else {
            console.log(`❌ Using old Azure Functions package: ${version}`);
            issues.push('Old Azure Functions package version');
            allTestsPassed = false;
        }
    } else {
        console.log('❌ @azure/functions dependency not found');
        issues.push('@azure/functions dependency missing');
        allTestsPassed = false;
    }
} else {
    console.log('❌ package.json not found');
    issues.push('package.json missing');
    allTestsPassed = false;
}

// Test 5: Verify TypeScript configuration
console.log('\n📋 Test 5: Checking TypeScript configuration...');

const tsconfigPath = 'PokeDataFunc/tsconfig.json';
if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir === './dist') {
        console.log('✅ TypeScript outDir correctly set to "./dist"');
    } else {
        console.log(`❌ TypeScript outDir is "${tsconfig.compilerOptions?.outDir}", should be "./dist"`);
        issues.push('Incorrect TypeScript outDir');
        allTestsPassed = false;
    }
} else {
    console.log('❌ tsconfig.json not found');
    issues.push('tsconfig.json missing');
    allTestsPassed = false;
}

// Test 6: Check for obsolete scripts
console.log('\n📋 Test 6: Checking for obsolete files...');

const obsoleteFiles = [
    'PokeDataFunc/copy-function-json.js'
];

for (const file of obsoleteFiles) {
    if (!fs.existsSync(file)) {
        console.log(`✅ Obsolete file removed: ${file}`);
    } else {
        console.log(`❌ Obsolete file still exists: ${file}`);
        issues.push(`Obsolete file should be removed: ${file}`);
        allTestsPassed = false;
    }
}

// Final Results
console.log('\n' + '=' .repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('=' .repeat(60));

if (allTestsPassed) {
    console.log('🎉 SUCCESS! Pure Azure Functions v4 implementation validated');
    console.log('✅ All tests passed');
    console.log('✅ No conflicting function.json files');
    console.log('✅ Proper v4 registrations in place');
    console.log('✅ Correct build output structure');
    console.log('✅ Ready for Azure deployment');
    
    console.log('\n🚀 DEPLOYMENT READY');
    console.log('📦 Deploy from: ./PokeDataFunc/dist');
    console.log('🔧 Entry point: dist/index.js');
    console.log('📋 Programming model: Azure Functions v4 (pure)');
    console.log('🎯 Expected result: Functions should appear in Azure Portal');
    
} else {
    console.log('❌ VALIDATION FAILED');
    console.log(`Found ${issues.length} issue(s):`);
    issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log('\n🔧 REQUIRED ACTIONS:');
    console.log('1. Fix the issues listed above');
    console.log('2. Re-run this validation script');
    console.log('3. Only deploy after all tests pass');
}

console.log('\n📝 NEXT STEPS:');
if (allTestsPassed) {
    console.log('1. Commit these changes to git');
    console.log('2. Push to trigger GitHub Actions deployment');
    console.log('3. Verify functions appear in Azure Portal');
    console.log('4. Test API endpoints for functionality');
} else {
    console.log('1. Address the validation failures above');
    console.log('2. Re-run: node test-azure-functions-v4-pure-implementation.js');
    console.log('3. Only proceed with deployment after validation passes');
}

process.exit(allTestsPassed ? 0 : 1);
