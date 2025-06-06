#!/usr/bin/env node

/**
 * Test script to validate the Azure Functions build fix
 * This simulates the CI/CD environment to ensure the build process works correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Testing Azure Functions Build Fix Validation');
console.log('=' .repeat(60));

// Test configuration
const pokeDataFuncDir = path.join(__dirname, 'PokeDataFunc');
const functionsDir = path.join(pokeDataFuncDir, 'functions');
const srcFunctionsDir = path.join(pokeDataFuncDir, 'src', 'functions');

// Expected functions
const expectedFunctions = ['GetCardInfo', 'GetCardsBySet', 'GetSetList', 'RefreshData'];

console.log('📋 Test Plan:');
console.log('1. Verify source function.json files exist');
console.log('2. Run clean build process');
console.log('3. Verify compiled output structure');
console.log('4. Validate function.json files are copied correctly');
console.log('5. Check Azure Functions v4 compatibility');
console.log('');

// Test 1: Verify source function.json files exist
console.log('✅ Test 1: Verifying source function.json files...');
let sourceFilesValid = true;
for (const funcName of expectedFunctions) {
    const functionJsonPath = path.join(srcFunctionsDir, funcName, 'function.json');
    if (fs.existsSync(functionJsonPath)) {
        console.log(`   ✓ ${funcName}/function.json exists in source`);
    } else {
        console.log(`   ❌ ${funcName}/function.json missing in source`);
        sourceFilesValid = false;
    }
}

if (!sourceFilesValid) {
    console.log('❌ Source validation failed - aborting test');
    process.exit(1);
}

// Test 2: Run clean build process
console.log('\n✅ Test 2: Running clean build process...');
try {
    // Clean existing build output
    if (fs.existsSync(functionsDir)) {
        console.log('   🧹 Cleaning existing functions directory...');
        fs.rmSync(functionsDir, { recursive: true, force: true });
    }
    
    // Run build
    console.log('   🔨 Running pnpm run build...');
    const buildOutput = execSync('pnpm run build', { 
        cwd: pokeDataFuncDir, 
        encoding: 'utf8',
        stdio: 'pipe'
    });
    
    if (buildOutput.includes('Function.json files copied successfully!')) {
        console.log('   ✓ Build completed successfully');
        console.log('   ✓ Copy script executed successfully');
    } else {
        console.log('   ⚠️  Build completed but copy message not found');
        console.log('   Build output:', buildOutput);
    }
} catch (error) {
    console.log('   ❌ Build failed:', error.message);
    process.exit(1);
}

// Test 3: Verify compiled output structure
console.log('\n✅ Test 3: Verifying compiled output structure...');
let outputStructureValid = true;

// Check if functions directory was created
if (!fs.existsSync(functionsDir)) {
    console.log('   ❌ Functions directory not created');
    outputStructureValid = false;
} else {
    console.log('   ✓ Functions directory created');
}

// Check each function directory
for (const funcName of expectedFunctions) {
    const funcDir = path.join(functionsDir, funcName);
    if (fs.existsSync(funcDir)) {
        console.log(`   ✓ ${funcName} directory exists`);
        
        // Check for required files
        const indexJs = path.join(funcDir, 'index.js');
        const functionJson = path.join(funcDir, 'function.json');
        
        if (fs.existsSync(indexJs)) {
            console.log(`     ✓ ${funcName}/index.js exists`);
        } else {
            console.log(`     ❌ ${funcName}/index.js missing`);
            outputStructureValid = false;
        }
        
        if (fs.existsSync(functionJson)) {
            console.log(`     ✓ ${funcName}/function.json exists`);
        } else {
            console.log(`     ❌ ${funcName}/function.json missing`);
            outputStructureValid = false;
        }
    } else {
        console.log(`   ❌ ${funcName} directory missing`);
        outputStructureValid = false;
    }
}

// Test 4: Validate function.json content
console.log('\n✅ Test 4: Validating function.json content...');
let contentValid = true;

for (const funcName of expectedFunctions) {
    const functionJsonPath = path.join(functionsDir, funcName, 'function.json');
    if (fs.existsSync(functionJsonPath)) {
        try {
            const content = fs.readFileSync(functionJsonPath, 'utf8');
            const parsed = JSON.parse(content);
            
            if (parsed.bindings && Array.isArray(parsed.bindings)) {
                console.log(`   ✓ ${funcName}/function.json has valid structure`);
            } else {
                console.log(`   ❌ ${funcName}/function.json missing bindings`);
                contentValid = false;
            }
        } catch (error) {
            console.log(`   ❌ ${funcName}/function.json invalid JSON:`, error.message);
            contentValid = false;
        }
    }
}

// Test 5: Check Azure Functions v4 compatibility
console.log('\n✅ Test 5: Checking Azure Functions v4 compatibility...');
const packageJsonPath = path.join(pokeDataFuncDir, 'package.json');
const indexJsPath = path.join(pokeDataFuncDir, 'index.js');

let v4Compatible = true;

// Check package.json for Azure Functions v4
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const azureFunctionsVersion = packageJson.dependencies['@azure/functions'];
    
    if (azureFunctionsVersion && azureFunctionsVersion.includes('4.')) {
        console.log(`   ✓ Azure Functions v4 dependency found: ${azureFunctionsVersion}`);
    } else {
        console.log(`   ⚠️  Azure Functions version: ${azureFunctionsVersion || 'not found'}`);
    }
    
    // Check main entry point
    if (packageJson.main === 'index.js') {
        console.log('   ✓ Main entry point correctly set to index.js');
    } else {
        console.log(`   ⚠️  Main entry point: ${packageJson.main}`);
    }
}

// Check if main index.js exists
if (fs.existsSync(indexJsPath)) {
    console.log('   ✓ Main index.js exists in root');
} else {
    console.log('   ❌ Main index.js missing in root');
    v4Compatible = false;
}

// Final results
console.log('\n' + '=' .repeat(60));
console.log('📊 TEST RESULTS SUMMARY:');
console.log('=' .repeat(60));

const allTestsPassed = sourceFilesValid && outputStructureValid && contentValid && v4Compatible;

console.log(`Source Files Valid: ${sourceFilesValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Output Structure Valid: ${outputStructureValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Function.json Content Valid: ${contentValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Azure Functions v4 Compatible: ${v4Compatible ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n' + '=' .repeat(60));
if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Build fix is working correctly.');
    console.log('✅ The Azure Functions deployment should now work in CI/CD.');
    console.log('');
    console.log('🚀 Ready for deployment:');
    console.log('   - function.json files are correctly copied from src/ to functions/');
    console.log('   - TypeScript compilation outputs to correct location');
    console.log('   - Azure Functions v4 structure is maintained');
    console.log('   - CI/CD pipeline should no longer fail with ENOENT errors');
} else {
    console.log('❌ SOME TESTS FAILED! Please review the issues above.');
    process.exit(1);
}
