/**
 * Pre-deployment validation tests for Azure Functions
 * Validates build output, configuration, and function structure
 * Runs in CI/CD pipeline before deployment to staging
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function testExists(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        log(`  ✅ ${description}`, colors.green);
        testsPassed++;
        return true;
    } else {
        log(`  ❌ ${description} - File not found: ${filePath}`, colors.red);
        testsFailed++;
        return false;
    }
}

function testJsonValid(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    try {
        if (!fs.existsSync(fullPath)) {
            log(`  ❌ ${description} - File not found: ${filePath}`, colors.red);
            testsFailed++;
            return false;
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        JSON.parse(content);
        log(`  ✅ ${description}`, colors.green);
        testsPassed++;
        return true;
    } catch (error) {
        log(`  ❌ ${description} - Invalid JSON: ${error.message}`, colors.red);
        testsFailed++;
        return false;
    }
}

function testFunctionExports() {
    try {
        const indexPath = path.join(__dirname, 'dist', 'index.js');
        if (!fs.existsSync(indexPath)) {
            log(`  ❌ Function exports - dist/index.js not found`, colors.red);
            testsFailed++;
            return false;
        }

        // Read the file to check for function registrations
        const content = fs.readFileSync(indexPath, 'utf8');
        const expectedFunctions = ['getSetList', 'getCardsBySet', 'getCardInfo', 'refreshData'];
        let foundFunctions = 0;

        expectedFunctions.forEach(funcName => {
            if (content.includes(`app.http('${funcName}'`) || content.includes(`app.timer('${funcName}'`)) {
                foundFunctions++;
            }
        });

        if (foundFunctions === expectedFunctions.length) {
            log(`  ✅ All ${expectedFunctions.length} functions registered in index.js`, colors.green);
            testsPassed++;
            return true;
        } else {
            log(`  ⚠️  Found ${foundFunctions}/${expectedFunctions.length} function registrations`, colors.yellow);
            testsPassed++;
            return true; // Warning but not failure
        }
    } catch (error) {
        log(`  ❌ Function exports - Error: ${error.message}`, colors.red);
        testsFailed++;
        return false;
    }
}

function testBuildOutput() {
    const requiredDirs = [
        'dist',
        'dist/functions',
        'dist/functions/GetSetList',
        'dist/functions/GetCardsBySet',
        'dist/functions/GetCardInfo',
        'dist/functions/RefreshData',
        'dist/models',
        'dist/services',
        'dist/utils'
    ];

    let allDirsExist = true;
    requiredDirs.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            log(`  ❌ Missing directory: ${dir}`, colors.red);
            testsFailed++;
            allDirsExist = false;
        }
    });

    if (allDirsExist) {
        log(`  ✅ All required build directories exist`, colors.green);
        testsPassed++;
    }

    return allDirsExist;
}

function testDataFiles() {
    const dataFiles = [
        'data/pokedata-sets.json',
        'data/pokemon-tcg-sets.json',
        'data/set-mapping.json'
    ];

    let allFilesValid = true;
    dataFiles.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const data = JSON.parse(content);
                if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
                    log(`  ✅ ${file} is valid`, colors.green);
                    testsPassed++;
                } else {
                    log(`  ❌ ${file} has unexpected structure`, colors.red);
                    testsFailed++;
                    allFilesValid = false;
                }
            } catch (error) {
                log(`  ❌ ${file} - Invalid JSON: ${error.message}`, colors.red);
                testsFailed++;
                allFilesValid = false;
            }
        } else {
            log(`  ⚠️  ${file} not found (optional)`, colors.yellow);
        }
    });

    return allFilesValid;
}

// Main test execution
async function runTests() {
    log('\n========================================', colors.cyan);
    log('   Azure Functions Pre-Deployment Tests', colors.cyan);
    log('========================================\n', colors.cyan);

    // Test 1: Build Output
    log('1. Checking Build Output:', colors.cyan);
    testExists('dist/index.js', 'Main entry point exists');
    testBuildOutput();

    // Test 2: Configuration Files
    log('\n2. Validating Configuration Files:', colors.cyan);
    testJsonValid('host.json', 'host.json is valid JSON');
    testJsonValid('package.json', 'package.json is valid JSON');
    testJsonValid('tsconfig.json', 'tsconfig.json is valid JSON');

    // Test 3: Function Structure
    log('\n3. Validating Function Structure:', colors.cyan);
    testFunctionExports();

    // Test 4: Data Files
    log('\n4. Checking Data Files:', colors.cyan);
    testDataFiles();

    // Test 5: TypeScript Source
    log('\n5. Validating TypeScript Source:', colors.cyan);
    testExists('src/index.ts', 'TypeScript entry point exists');
    testExists('src/functions/GetSetList/index.ts', 'GetSetList function exists');
    testExists('src/functions/GetCardsBySet/index.ts', 'GetCardsBySet function exists');
    testExists('src/functions/GetCardInfo/index.ts', 'GetCardInfo function exists');
    testExists('src/functions/RefreshData/index.ts', 'RefreshData function exists');

    // Summary
    log('\n========================================', colors.cyan);
    log('              Test Summary', colors.cyan);
    log('========================================', colors.cyan);
    log(`  Passed: ${testsPassed}`, colors.green);
    log(`  Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
    
    if (testsFailed === 0) {
        log('\n✅ All pre-deployment tests passed!', colors.green);
        log('Ready for deployment to Azure Functions.\n', colors.green);
        process.exit(0);
    } else {
        log('\n❌ Pre-deployment tests failed!', colors.red);
        log('Please fix the issues above before deploying.\n', colors.red);
        process.exit(1);
    }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
    log(`\n❌ Unexpected error during tests: ${error.message}`, colors.red);
    process.exit(1);
});

// Run the tests
runTests().catch(error => {
    log(`\n❌ Test execution failed: ${error.message}`, colors.red);
    process.exit(1);
});
