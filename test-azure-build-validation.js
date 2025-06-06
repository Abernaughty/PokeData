/**
 * Azure Functions Build Validation
 * 
 * This script validates the Azure Functions build process and package structure
 * without requiring Azure Functions Core Tools to be installed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Azure Functions Build Validation');
console.log('=' .repeat(70));

const POKEDATA_FUNC_DIR = './PokeDataFunc';
const DIST_DIR = path.join(POKEDATA_FUNC_DIR, 'dist');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n📋 STEP ${step}: ${message}`, 'bold');
    log('=' .repeat(50), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function runCommand(command, cwd = process.cwd(), description = '') {
    try {
        if (description) {
            logInfo(`Running: ${description}`);
        }
        logInfo(`Command: ${command}`);
        
        const result = execSync(command, { 
            cwd, 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        if (result.trim()) {
            console.log(result);
        }
        return { success: true, output: result };
    } catch (error) {
        logError(`Command failed: ${command}`);
        logError(`Error: ${error.message}`);
        if (error.stdout) {
            console.log('STDOUT:', error.stdout);
        }
        if (error.stderr) {
            console.log('STDERR:', error.stderr);
        }
        return { success: false, error: error.message };
    }
}

function checkFileExists(filePath, description = '') {
    const exists = fs.existsSync(filePath);
    if (exists) {
        logSuccess(`${description || filePath} exists`);
        return true;
    } else {
        logError(`${description || filePath} missing`);
        return false;
    }
}

function validateFileContent(filePath, description, validator) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = validator(content);
        if (result.valid) {
            logSuccess(`${description}: ${result.message}`);
            if (result.details) {
                result.details.forEach(detail => logInfo(`  ${detail}`));
            }
        } else {
            logError(`${description}: ${result.message}`);
            if (result.details) {
                result.details.forEach(detail => logError(`  ${detail}`));
            }
        }
        return result.valid;
    } catch (error) {
        logError(`Failed to read ${description}: ${error.message}`);
        return false;
    }
}

function validatePackageStructure() {
    logStep(1, 'Validating Package Structure');
    
    const requiredFiles = [
        { path: path.join(DIST_DIR, 'package.json'), desc: 'package.json' },
        { path: path.join(DIST_DIR, 'host.json'), desc: 'host.json' },
        { path: path.join(DIST_DIR, 'index.js'), desc: 'index.js (entry point)' },
        { path: path.join(DIST_DIR, 'functions', 'getCardInfo.js'), desc: 'getCardInfo.js' },
        { path: path.join(DIST_DIR, 'functions', 'getCardsBySet.js'), desc: 'getCardsBySet.js' },
        { path: path.join(DIST_DIR, 'functions', 'getSetList.js'), desc: 'getSetList.js' },
        { path: path.join(DIST_DIR, 'functions', 'refreshData.js'), desc: 'refreshData.js' }
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
        if (!checkFileExists(file.path, file.desc)) {
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

function validatePackageJson() {
    logStep(2, 'Validating package.json Configuration');
    
    return validateFileContent(
        path.join(DIST_DIR, 'package.json'),
        'package.json validation',
        (content) => {
            try {
                const packageJson = JSON.parse(content);
                const details = [];
                let valid = true;
                
                // Check main field
                if (packageJson.main === 'index.js') {
                    details.push('✅ Entry point correctly set to "index.js"');
                } else {
                    details.push(`❌ Entry point should be "index.js", found "${packageJson.main}"`);
                    valid = false;
                }
                
                // Check dependencies
                if (packageJson.dependencies && packageJson.dependencies['@azure/functions']) {
                    details.push(`✅ Azure Functions dependency: ${packageJson.dependencies['@azure/functions']}`);
                } else {
                    details.push('❌ Missing @azure/functions dependency');
                    valid = false;
                }
                
                // Check scripts
                if (packageJson.scripts) {
                    details.push(`✅ Scripts defined: ${Object.keys(packageJson.scripts).join(', ')}`);
                } else {
                    details.push('⚠️  No scripts defined');
                }
                
                return {
                    valid,
                    message: valid ? 'All checks passed' : 'Some checks failed',
                    details
                };
            } catch (error) {
                return {
                    valid: false,
                    message: `Invalid JSON: ${error.message}`,
                    details: []
                };
            }
        }
    );
}

function validateHostJson() {
    logStep(3, 'Validating host.json Configuration');
    
    return validateFileContent(
        path.join(DIST_DIR, 'host.json'),
        'host.json validation',
        (content) => {
            try {
                const hostJson = JSON.parse(content);
                const details = [];
                let valid = true;
                
                // Check version
                if (hostJson.version === '2.0') {
                    details.push('✅ Version correctly set to "2.0"');
                } else {
                    details.push(`❌ Version should be "2.0", found "${hostJson.version}"`);
                    valid = false;
                }
                
                // Check extension bundle
                if (hostJson.extensionBundle) {
                    if (hostJson.extensionBundle.id === 'Microsoft.Azure.Functions.ExtensionBundle') {
                        details.push('✅ Extension bundle ID correct');
                    } else {
                        details.push(`❌ Wrong extension bundle ID: ${hostJson.extensionBundle.id}`);
                        valid = false;
                    }
                    
                    if (hostJson.extensionBundle.version) {
                        details.push(`✅ Extension bundle version: ${hostJson.extensionBundle.version}`);
                    } else {
                        details.push('❌ Extension bundle version missing');
                        valid = false;
                    }
                } else {
                    details.push('❌ Extension bundle missing (critical for v4)');
                    valid = false;
                }
                
                // Check logging configuration
                if (hostJson.logging) {
                    details.push('✅ Logging configuration present');
                } else {
                    details.push('⚠️  No logging configuration');
                }
                
                return {
                    valid,
                    message: valid ? 'All checks passed' : 'Some checks failed',
                    details
                };
            } catch (error) {
                return {
                    valid: false,
                    message: `Invalid JSON: ${error.message}`,
                    details: []
                };
            }
        }
    );
}

function validateIndexJs() {
    logStep(4, 'Validating index.js Entry Point');
    
    return validateFileContent(
        path.join(DIST_DIR, 'index.js'),
        'index.js validation',
        (content) => {
            const details = [];
            let valid = true;
            
            // Check for Azure Functions import
            if (content.includes('@azure/functions')) {
                details.push('✅ Azure Functions import found');
            } else {
                details.push('❌ Missing @azure/functions import');
                valid = false;
            }
            
            // Check for function registrations
            const httpRegistrations = (content.match(/app\.http\(/g) || []).length;
            const timerRegistrations = (content.match(/app\.timer\(/g) || []).length;
            
            details.push(`✅ HTTP function registrations: ${httpRegistrations}`);
            details.push(`✅ Timer function registrations: ${timerRegistrations}`);
            
            if (httpRegistrations >= 3 && timerRegistrations >= 1) {
                details.push('✅ Expected function registrations found');
            } else {
                details.push('❌ Missing expected function registrations');
                valid = false;
            }
            
            // Check for function imports
            const functionNames = ['getCardInfo', 'getCardsBySet', 'getSetList', 'refreshData'];
            const missingImports = [];
            
            functionNames.forEach(funcName => {
                if (content.includes(funcName)) {
                    details.push(`✅ ${funcName} import/reference found`);
                } else {
                    details.push(`❌ ${funcName} import/reference missing`);
                    missingImports.push(funcName);
                    valid = false;
                }
            });
            
            return {
                valid,
                message: valid ? 'All checks passed' : `Issues found: ${missingImports.length > 0 ? 'missing imports' : 'configuration errors'}`,
                details
            };
        }
    );
}

function validateFunctionFiles() {
    logStep(5, 'Validating Individual Function Files');
    
    const functionFiles = [
        'getCardInfo.js',
        'getCardsBySet.js', 
        'getSetList.js',
        'refreshData.js'
    ];
    
    let allValid = true;
    
    functionFiles.forEach(fileName => {
        const filePath = path.join(DIST_DIR, 'functions', fileName);
        const valid = validateFileContent(
            filePath,
            `${fileName} validation`,
            (content) => {
                const details = [];
                let valid = true;
                
                // Check for Azure Functions import
                if (content.includes('@azure/functions')) {
                    details.push('✅ Azure Functions import found');
                } else {
                    details.push('❌ Missing @azure/functions import');
                    valid = false;
                }
                
                // Check for function export
                const funcName = fileName.replace('.js', '');
                if (content.includes(`function ${funcName}`) || content.includes(`${funcName} =`)) {
                    details.push(`✅ ${funcName} function definition found`);
                } else {
                    details.push(`❌ ${funcName} function definition missing`);
                    valid = false;
                }
                
                // Check for export
                if (content.includes(`exports.${funcName}`) || content.includes(`module.exports`)) {
                    details.push('✅ Function export found');
                } else {
                    details.push('❌ Function export missing');
                    valid = false;
                }
                
                // Check that it's NOT self-registering (should be centralized)
                if (content.includes('app.http(') || content.includes('app.timer(')) {
                    details.push('⚠️  Function appears to be self-registering (should be centralized)');
                } else {
                    details.push('✅ Function is not self-registering (correct for centralized approach)');
                }
                
                return {
                    valid,
                    message: valid ? 'Function file looks good' : 'Function file has issues',
                    details
                };
            }
        );
        
        if (!valid) {
            allValid = false;
        }
    });
    
    return allValid;
}

function simulateAzureBuildProcess() {
    logStep(6, 'Simulating Azure Build Process');
    
    // Step 1: Install dependencies (exactly like Azure workflow)
    const installResult = runCommand(
        'pnpm install --frozen-lockfile', 
        POKEDATA_FUNC_DIR,
        'Installing dependencies (Azure workflow step)'
    );
    
    if (!installResult.success) {
        logError('Failed to install dependencies');
        return false;
    }
    
    // Step 2: Build and copy (exactly like Azure workflow)
    const buildResult = runCommand(
        'pnpm run prepare', 
        POKEDATA_FUNC_DIR,
        'Building TypeScript and copying files (Azure workflow step)'
    );
    
    if (!buildResult.success) {
        logError('Failed to build and copy files');
        return false;
    }
    
    logSuccess('Azure build process simulation completed');
    return true;
}

function generateReport(results) {
    logStep(7, 'Final Assessment Report');
    
    log('\n📊 VALIDATION RESULTS:', 'bold');
    log('=' .repeat(50), 'cyan');
    
    const checks = [
        { name: 'Package Structure', result: results.packageStructure },
        { name: 'package.json Configuration', result: results.packageJson },
        { name: 'host.json Configuration', result: results.hostJson },
        { name: 'index.js Entry Point', result: results.indexJs },
        { name: 'Function Files', result: results.functionFiles },
        { name: 'Azure Build Process', result: results.buildProcess }
    ];
    
    checks.forEach(check => {
        const status = check.result ? '✅ PASS' : '❌ FAIL';
        const color = check.result ? 'green' : 'red';
        log(`  ${check.name}: ${status}`, color);
    });
    
    const allPassed = checks.every(check => check.result);
    
    log('\n🎯 OVERALL ASSESSMENT:', 'bold');
    log('=' .repeat(30), 'cyan');
    
    if (allPassed) {
        logSuccess('🎉 ALL VALIDATIONS PASSED!');
        logInfo('Your Azure Functions are properly configured and should deploy successfully.');
        logInfo('If functions still don\'t appear in Azure, the issue is likely:');
        logInfo('  1. Azure deployment pipeline configuration');
        logInfo('  2. Azure Function App settings');
        logInfo('  3. Azure resource configuration');
    } else {
        logError('❌ SOME VALIDATIONS FAILED');
        logWarning('Your functions have configuration issues that need to be fixed.');
        logInfo('Review the failed checks above and fix the identified issues.');
    }
    
    log('\n📝 NEXT STEPS:', 'bold');
    if (allPassed) {
        log('1. ✅ Functions are ready - check Azure deployment logs');
        log('2. ✅ Verify Azure Function App is receiving the deployment');
        log('3. ✅ Check Azure Portal for any deployment errors');
        log('4. ✅ Verify Azure Function App runtime version (should be ~4)');
    } else {
        log('1. ❌ Fix the failed validation checks above');
        log('2. ❌ Re-run this validation script');
        log('3. ❌ Test locally with Azure Functions Core Tools');
        log('4. ❌ Deploy after all validations pass');
    }
    
    return allPassed;
}

async function main() {
    try {
        const results = {};
        
        // Run all validations
        results.packageStructure = validatePackageStructure();
        results.packageJson = validatePackageJson();
        results.hostJson = validateHostJson();
        results.indexJs = validateIndexJs();
        results.functionFiles = validateFunctionFiles();
        results.buildProcess = simulateAzureBuildProcess();
        
        // Re-validate after build
        logInfo('Re-validating after build...');
        results.packageStructure = validatePackageStructure() && results.packageStructure;
        results.packageJson = validatePackageJson() && results.packageJson;
        results.hostJson = validateHostJson() && results.hostJson;
        results.indexJs = validateIndexJs() && results.indexJs;
        results.functionFiles = validateFunctionFiles() && results.functionFiles;
        
        // Generate final report
        const allPassed = generateReport(results);
        
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        logError(`Validation script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the validation
main().catch(console.error);
