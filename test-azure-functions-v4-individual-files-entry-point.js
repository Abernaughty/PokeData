/**
 * Azure Functions v4 Individual Files Entry Point Validation Test
 * 
 * This script validates that we have successfully implemented the individual function files
 * entry point pattern as specified in Azure Functions v4 documentation.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Azure Functions v4 Individual Files Entry Point Validation');
console.log('=' .repeat(70));

let allTestsPassed = true;
const issues = [];

// Test 1: Verify package.json main field uses glob pattern
console.log('\n📋 Test 1: Checking package.json main field...');

const packageJsonPath = 'PokeDataFunc/package.json';
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.main === 'dist/functions/*.js') {
        console.log('✅ package.json main field correctly set to "dist/functions/*.js"');
    } else {
        console.log(`❌ package.json main field is "${packageJson.main}", should be "dist/functions/*.js"`);
        issues.push('Incorrect package.json main field for individual files pattern');
        allTestsPassed = false;
    }
} else {
    console.log('❌ package.json not found');
    issues.push('package.json missing');
    allTestsPassed = false;
}

// Test 2: Verify individual function files are self-registering
console.log('\n📋 Test 2: Checking individual function files are self-registering...');

const functionFiles = [
    'PokeDataFunc/dist/functions/getCardInfo.js',
    'PokeDataFunc/dist/functions/getCardsBySet.js',
    'PokeDataFunc/dist/functions/getSetList.js',
    'PokeDataFunc/dist/functions/refreshData.js'
];

const expectedRegistrations = [
    { file: 'getCardInfo.js', pattern: "app.http('getCardInfo'" },
    { file: 'getCardsBySet.js', pattern: "app.http('getCardsBySet'" },
    { file: 'getSetList.js', pattern: "app.http('getSetList'" },
    { file: 'refreshData.js', pattern: "app.timer('refreshData'" }
];

for (const registration of expectedRegistrations) {
    const filePath = `PokeDataFunc/dist/functions/${registration.file}`;
    
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        if (fileContent.includes(registration.pattern)) {
            console.log(`✅ ${registration.file} contains self-registration: ${registration.pattern}`);
        } else {
            console.log(`❌ ${registration.file} missing self-registration: ${registration.pattern}`);
            issues.push(`${registration.file} not self-registering`);
            allTestsPassed = false;
        }
        
        // Check for app import
        if (fileContent.includes('require("@azure/functions")') || fileContent.includes('from "@azure/functions"')) {
            console.log(`✅ ${registration.file} imports Azure Functions app`);
        } else {
            console.log(`❌ ${registration.file} missing Azure Functions app import`);
            issues.push(`${registration.file} missing app import`);
            allTestsPassed = false;
        }
    } else {
        console.log(`❌ ${registration.file} not found`);
        issues.push(`${registration.file} missing`);
        allTestsPassed = false;
    }
}

// Test 3: Verify dist directory structure for individual files pattern
console.log('\n📋 Test 3: Checking dist directory structure...');

const distPath = 'PokeDataFunc/dist';
const requiredFiles = [
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

// Test 4: Verify no central index.js is required (but may exist)
console.log('\n📋 Test 4: Checking entry point configuration...');

const centralIndexPath = 'PokeDataFunc/dist/index.js';
if (fs.existsSync(centralIndexPath)) {
    console.log('ℹ️  Central index.js exists (not required for individual files pattern)');
    
    // If it exists, it should NOT be the main entry point anymore
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.main !== 'dist/index.js') {
        console.log('✅ Central index.js not used as main entry point');
    } else {
        console.log('❌ Central index.js still configured as main entry point');
        issues.push('Central index.js should not be main entry point for individual files pattern');
        allTestsPassed = false;
    }
} else {
    console.log('✅ No central index.js (correct for individual files pattern)');
}

// Test 5: Verify Azure Functions v4 package version
console.log('\n📋 Test 5: Checking Azure Functions package version...');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
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

// Test 6: Verify no function.json files exist (v4 doesn't need them)
console.log('\n📋 Test 6: Checking for conflicting function.json files...');

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

const searchDirs = ['PokeDataFunc/dist'];
let foundFunctionJsonFiles = [];
for (const dir of searchDirs) {
    const files = findFunctionJsonFiles(dir);
    foundFunctionJsonFiles = foundFunctionJsonFiles.concat(files);
}

if (foundFunctionJsonFiles.length === 0) {
    console.log('✅ No conflicting function.json files found in dist/');
} else {
    console.log('❌ Found conflicting function.json files in dist/:');
    foundFunctionJsonFiles.forEach(file => console.log(`   - ${file}`));
    issues.push('Conflicting function.json files in dist/');
    allTestsPassed = false;
}

// Final Results
console.log('\n' + '=' .repeat(70));
console.log('📊 VALIDATION RESULTS');
console.log('=' .repeat(70));

if (allTestsPassed) {
    console.log('🎉 SUCCESS! Azure Functions v4 individual files entry point validated');
    console.log('✅ All tests passed');
    console.log('✅ Package.json uses glob pattern: "dist/functions/*.js"');
    console.log('✅ All function files are self-registering');
    console.log('✅ Correct dist/ structure for individual files pattern');
    console.log('✅ No conflicting function.json files');
    console.log('✅ Ready for Azure deployment');
    
    console.log('\n🚀 DEPLOYMENT READY');
    console.log('📦 Deploy from: ./PokeDataFunc/dist');
    console.log('🔧 Entry point: dist/functions/*.js (glob pattern)');
    console.log('📋 Programming model: Azure Functions v4 (individual files)');
    console.log('🎯 Expected result: Functions should appear in Azure Portal');
    
    console.log('\n📝 ENTRY POINT PATTERN USED:');
    console.log('Pattern: Individual Function Files');
    console.log('Main field: "dist/functions/*.js"');
    console.log('Description: Each function registers itself independently');
    console.log('Benefits: Self-contained functions, easier debugging, better isolation');
    
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
    console.log('2. Re-run: node test-azure-functions-v4-individual-files-entry-point.js');
    console.log('3. Only proceed with deployment after validation passes');
}

process.exit(allTestsPassed ? 0 : 1);
