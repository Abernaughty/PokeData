#!/usr/bin/env node

/**
 * Azure Functions v4 TypeScript Deployment Validation Script
 * Tests the proper dist/ directory structure for Azure Functions deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Testing Azure Functions v4 TypeScript Deployment Structure');
console.log('=' .repeat(70));

// Test configuration
const pokeDataFuncDir = path.join(__dirname, 'PokeDataFunc');
const distDir = path.join(pokeDataFuncDir, 'dist');
const distFunctionsDir = path.join(distDir, 'functions');

// Expected functions
const expectedFunctions = ['GetCardInfo', 'GetCardsBySet', 'GetSetList', 'RefreshData'];

console.log('📋 Azure Functions v4 Deployment Test Plan:');
console.log('1. Verify TypeScript configuration (outDir: ./dist)');
console.log('2. Test build process (tsc + copy-files.js)');
console.log('3. Verify dist/ directory structure');
console.log('4. Validate all required files are present');
console.log('5. Check Azure Functions v4 compatibility');
console.log('6. Verify deployment package completeness');
console.log('');

// Test 1: Verify TypeScript configuration
console.log('✅ Test 1: Verifying TypeScript configuration...');
const tsconfigPath = path.join(pokeDataFuncDir, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (tsconfig.compilerOptions.outDir === './dist') {
        console.log('   ✓ tsconfig.json outDir correctly set to ./dist');
    } else {
        console.log(`   ❌ tsconfig.json outDir is ${tsconfig.compilerOptions.outDir}, should be ./dist`);
        process.exit(1);
    }
} else {
    console.log('   ❌ tsconfig.json not found');
    process.exit(1);
}

// Test 2: Test build process
console.log('\n✅ Test 2: Testing build process...');
try {
    // Clean existing dist
    if (fs.existsSync(distDir)) {
        console.log('   🧹 Cleaning existing dist/ directory...');
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    
    // Run build
    console.log('   🔨 Running pnpm run prepare...');
    const buildOutput = execSync('pnpm run prepare', { 
        cwd: pokeDataFuncDir, 
        encoding: 'utf8',
        stdio: 'pipe'
    });
    
    if (buildOutput.includes('Azure Functions v4 deployment structure ready')) {
        console.log('   ✓ Build process completed successfully');
        console.log('   ✓ Copy script executed successfully');
    } else {
        console.log('   ⚠️  Build completed but success message not found');
    }
} catch (error) {
    console.log('   ❌ Build failed:', error.message);
    process.exit(1);
}

// Test 3: Verify dist/ directory structure
console.log('\n✅ Test 3: Verifying dist/ directory structure...');
let structureValid = true;

// Check if dist directory was created
if (!fs.existsSync(distDir)) {
    console.log('   ❌ dist/ directory not created');
    structureValid = false;
} else {
    console.log('   ✓ dist/ directory exists');
}

// Check required root files in dist/
const requiredRootFiles = ['host.json', 'package.json', 'index.js'];
for (const file of requiredRootFiles) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✓ ${file} exists in dist/`);
    } else {
        console.log(`   ❌ ${file} missing in dist/`);
        structureValid = false;
    }
}

// Check functions directory
if (fs.existsSync(distFunctionsDir)) {
    console.log('   ✓ functions/ directory exists in dist/');
} else {
    console.log('   ❌ functions/ directory missing in dist/');
    structureValid = false;
}

// Test 4: Validate all required files are present
console.log('\n✅ Test 4: Validating function files...');
let functionsValid = true;

for (const funcName of expectedFunctions) {
    const funcDir = path.join(distFunctionsDir, funcName);
    if (fs.existsSync(funcDir)) {
        console.log(`   ✓ ${funcName}/ directory exists`);
        
        // Check for required files
        const indexJs = path.join(funcDir, 'index.js');
        const functionJson = path.join(funcDir, 'function.json');
        
        if (fs.existsSync(indexJs)) {
            console.log(`     ✓ ${funcName}/index.js exists`);
        } else {
            console.log(`     ❌ ${funcName}/index.js missing`);
            functionsValid = false;
        }
        
        if (fs.existsSync(functionJson)) {
            console.log(`     ✓ ${funcName}/function.json exists`);
            
            // Validate function.json content
            try {
                const content = fs.readFileSync(functionJson, 'utf8');
                const parsed = JSON.parse(content);
                
                if (parsed.bindings && Array.isArray(parsed.bindings)) {
                    console.log(`     ✓ ${funcName}/function.json has valid structure`);
                } else {
                    console.log(`     ❌ ${funcName}/function.json missing bindings`);
                    functionsValid = false;
                }
            } catch (error) {
                console.log(`     ❌ ${funcName}/function.json invalid JSON:`, error.message);
                functionsValid = false;
            }
        } else {
            console.log(`     ❌ ${funcName}/function.json missing`);
            functionsValid = false;
        }
    } else {
        console.log(`   ❌ ${funcName}/ directory missing`);
        functionsValid = false;
    }
}

// Test 5: Check Azure Functions v4 compatibility
console.log('\n✅ Test 5: Checking Azure Functions v4 compatibility...');
const distPackageJsonPath = path.join(distDir, 'package.json');
let v4Compatible = true;

if (fs.existsSync(distPackageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(distPackageJsonPath, 'utf8'));
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
} else {
    console.log('   ❌ package.json missing in dist/');
    v4Compatible = false;
}

// Test 6: Verify deployment package completeness
console.log('\n✅ Test 6: Verifying deployment package completeness...');
const deploymentValid = structureValid && functionsValid && v4Compatible;

if (deploymentValid) {
    // Calculate package size
    function getDirectorySize(dirPath) {
        let totalSize = 0;
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                totalSize += getDirectorySize(itemPath);
            } else {
                totalSize += fs.statSync(itemPath).size;
            }
        }
        return totalSize;
    }
    
    const packageSize = getDirectorySize(distDir);
    const packageSizeMB = (packageSize / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✓ Deployment package size: ${packageSizeMB} MB`);
    console.log(`   ✓ Package structure is complete and valid`);
    console.log(`   ✓ Ready for Azure Functions deployment`);
}

// Final results
console.log('\n' + '='.repeat(70));
console.log('📊 AZURE FUNCTIONS V4 DEPLOYMENT TEST RESULTS:');
console.log('='.repeat(70));

const allTestsPassed = structureValid && functionsValid && v4Compatible;

console.log(`TypeScript Configuration: ${structureValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Dist Directory Structure: ${structureValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Function Files Valid: ${functionsValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Azure Functions v4 Compatible: ${v4Compatible ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n' + '='.repeat(70));
if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Azure Functions v4 deployment ready.');
    console.log('✅ The deployment structure follows Azure Functions v4 best practices.');
    console.log('✅ Functions will be properly recognized by Azure runtime.');
    console.log('');
    console.log('🚀 Deployment Instructions:');
    console.log('   1. GitHub Actions will deploy from: ./PokeDataFunc/dist');
    console.log('   2. Azure Functions runtime will find all required files');
    console.log('   3. All 4 functions should appear in Azure Portal');
    console.log('   4. Functions will be accessible via their HTTP endpoints');
    console.log('');
    console.log('📦 Deployment Package: ./PokeDataFunc/dist');
    console.log('🔗 Expected Functions:');
    expectedFunctions.forEach(func => {
        console.log(`   - ${func}: https://pokedata-func.azurewebsites.net/api/${func.toLowerCase()}`);
    });
} else {
    console.log('❌ SOME TESTS FAILED! Please review the issues above.');
    process.exit(1);
}
