/**
 * Azure Functions Deployment Simulation & Validation
 * 
 * This script simulates the exact Azure Functions deployment process
 * and validates function discovery the same way Azure would do it.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Azure Functions Deployment Simulation');
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
    } else {
        logError(`${description || filePath} missing`);
    }
    return exists;
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
    
    if (allFilesExist) {
        logSuccess('All required files present in dist directory');
    } else {
        logError('Missing required files in dist directory');
        return false;
    }
    
    // Validate package.json content
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'package.json'), 'utf8'));
        logInfo(`Entry point: "${packageJson.main}"`);
        
        if (packageJson.main === 'index.js') {
            logSuccess('Entry point correctly set to "index.js"');
        } else {
            logError(`Entry point should be "index.js", found "${packageJson.main}"`);
            return false;
        }
    } catch (error) {
        logError(`Failed to read package.json: ${error.message}`);
        return false;
    }
    
    // Validate host.json content
    try {
        const hostJson = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'host.json'), 'utf8'));
        
        if (hostJson.extensionBundle) {
            logSuccess('Extension bundle found in host.json');
            logInfo(`Bundle ID: ${hostJson.extensionBundle.id}`);
            logInfo(`Bundle Version: ${hostJson.extensionBundle.version}`);
        } else {
            logError('Extension bundle missing from host.json');
            return false;
        }
    } catch (error) {
        logError(`Failed to read host.json: ${error.message}`);
        return false;
    }
    
    return true;
}

function simulateAzureBuildProcess() {
    logStep(2, 'Simulating Azure Build Process');
    
    // Step 1: Clean install (simulate fresh Azure environment)
    logInfo('Simulating fresh Azure environment...');
    
    // Step 2: Install dependencies (exactly like Azure workflow)
    const installResult = runCommand(
        'pnpm install --frozen-lockfile', 
        POKEDATA_FUNC_DIR,
        'Installing dependencies (Azure workflow step)'
    );
    
    if (!installResult.success) {
        logError('Failed to install dependencies');
        return false;
    }
    
    // Step 3: Build and copy (exactly like Azure workflow)
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

function testFunctionDiscoveryLocal() {
    logStep(3, 'Testing Function Discovery - Local Method');
    
    return new Promise((resolve) => {
        logInfo('Testing with --script-root dist (our current local method)');
        
        const funcProcess = spawn('func', ['start', '--script-root', 'dist', '--port', '7074'], {
            cwd: POKEDATA_FUNC_DIR,
            stdio: 'pipe'
        });
        
        let output = '';
        let foundFunctions = [];
        let extensionBundleLoaded = false;
        let entryPointLoaded = false;
        
        funcProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            
            // Check for extension bundle loading
            if (text.includes('Loading extension bundle')) {
                extensionBundleLoaded = true;
                logSuccess('Extension bundle loading detected');
            }
            
            // Check for entry point loading
            if (text.includes('Loading entry point file "index.js"')) {
                entryPointLoaded = true;
                logSuccess('Entry point loading detected');
            }
            
            // Check for function discovery
            if (text.includes('Host.Functions.')) {
                const matches = text.match(/Host\.Functions\.(\w+)/g);
                if (matches) {
                    matches.forEach(match => {
                        const funcName = match.replace('Host.Functions.', '');
                        if (!foundFunctions.includes(funcName)) {
                            foundFunctions.push(funcName);
                            logSuccess(`Function discovered: ${funcName}`);
                        }
                    });
                }
            }
            
            // Check for HTTP route mapping
            if (text.includes('Functions:') || text.includes('http://localhost:7074')) {
                setTimeout(() => {
                    funcProcess.kill();
                }, 2000); // Give it time to finish startup
            }
        });
        
        funcProcess.stderr.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (text.includes('Error') || text.includes('Failed')) {
                logError(`Function startup error: ${text}`);
            }
        });
        
        funcProcess.on('close', (code) => {
            logInfo(`Function host exited with code ${code}`);
            
            const results = {
                extensionBundleLoaded,
                entryPointLoaded,
                functionsFound: foundFunctions.length,
                functionNames: foundFunctions,
                output: output
            };
            
            logInfo(`Functions found: ${foundFunctions.length}/4`);
            logInfo(`Function names: ${foundFunctions.join(', ')}`);
            
            resolve(results);
        });
        
        // Kill after 15 seconds if it doesn't exit naturally
        setTimeout(() => {
            if (!funcProcess.killed) {
                funcProcess.kill();
            }
        }, 15000);
    });
}

function testFunctionDiscoveryAzure() {
    logStep(4, 'Testing Function Discovery - Azure Method');
    
    return new Promise((resolve) => {
        logInfo('Testing from within dist directory (Azure deployment method)');
        
        const funcProcess = spawn('func', ['start', '--port', '7075'], {
            cwd: DIST_DIR,
            stdio: 'pipe'
        });
        
        let output = '';
        let foundFunctions = [];
        let extensionBundleLoaded = false;
        let entryPointLoaded = false;
        
        funcProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            
            // Check for extension bundle loading
            if (text.includes('Loading extension bundle')) {
                extensionBundleLoaded = true;
                logSuccess('Extension bundle loading detected');
            }
            
            // Check for entry point loading
            if (text.includes('Loading entry point file "index.js"')) {
                entryPointLoaded = true;
                logSuccess('Entry point loading detected');
            }
            
            // Check for function discovery
            if (text.includes('Host.Functions.')) {
                const matches = text.match(/Host\.Functions\.(\w+)/g);
                if (matches) {
                    matches.forEach(match => {
                        const funcName = match.replace('Host.Functions.', '');
                        if (!foundFunctions.includes(funcName)) {
                            foundFunctions.push(funcName);
                            logSuccess(`Function discovered: ${funcName}`);
                        }
                    });
                }
            }
            
            // Check for HTTP route mapping
            if (text.includes('Functions:') || text.includes('http://localhost:7075')) {
                setTimeout(() => {
                    funcProcess.kill();
                }, 2000); // Give it time to finish startup
            }
        });
        
        funcProcess.stderr.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (text.includes('Error') || text.includes('Failed')) {
                logError(`Function startup error: ${text}`);
            }
        });
        
        funcProcess.on('close', (code) => {
            logInfo(`Function host exited with code ${code}`);
            
            const results = {
                extensionBundleLoaded,
                entryPointLoaded,
                functionsFound: foundFunctions.length,
                functionNames: foundFunctions,
                output: output
            };
            
            logInfo(`Functions found: ${foundFunctions.length}/4`);
            logInfo(`Function names: ${foundFunctions.join(', ')}`);
            
            resolve(results);
        });
        
        // Kill after 15 seconds if it doesn't exit exit naturally
        setTimeout(() => {
            if (!funcProcess.killed) {
                funcProcess.kill();
            }
        }, 15000);
    });
}

function compareResults(localResults, azureResults) {
    logStep(5, 'Comparing Results');
    
    log('\n📊 COMPARISON RESULTS:', 'bold');
    log('=' .repeat(50), 'cyan');
    
    // Extension Bundle
    log('\n🔧 Extension Bundle Loading:');
    log(`  Local Method:  ${localResults.extensionBundleLoaded ? '✅ Success' : '❌ Failed'}`, localResults.extensionBundleLoaded ? 'green' : 'red');
    log(`  Azure Method:  ${azureResults.extensionBundleLoaded ? '✅ Success' : '❌ Failed'}`, azureResults.extensionBundleLoaded ? 'green' : 'red');
    
    // Entry Point
    log('\n📁 Entry Point Loading:');
    log(`  Local Method:  ${localResults.entryPointLoaded ? '✅ Success' : '❌ Failed'}`, localResults.entryPointLoaded ? 'green' : 'red');
    log(`  Azure Method:  ${azureResults.entryPointLoaded ? '✅ Success' : '❌ Failed'}`, azureResults.entryPointLoaded ? 'green' : 'red');
    
    // Function Discovery
    log('\n🔍 Function Discovery:');
    log(`  Local Method:  ${localResults.functionsFound}/4 functions found`, localResults.functionsFound === 4 ? 'green' : 'red');
    log(`  Azure Method:  ${azureResults.functionsFound}/4 functions found`, azureResults.functionsFound === 4 ? 'green' : 'red');
    
    // Function Names
    log('\n📋 Functions Found:');
    log(`  Local Method:  ${localResults.functionNames.join(', ') || 'None'}`);
    log(`  Azure Method:  ${azureResults.functionNames.join(', ') || 'None'}`);
    
    // Overall Assessment
    log('\n🎯 OVERALL ASSESSMENT:', 'bold');
    log('=' .repeat(30), 'cyan');
    
    const localSuccess = localResults.extensionBundleLoaded && localResults.entryPointLoaded && localResults.functionsFound === 4;
    const azureSuccess = azureResults.extensionBundleLoaded && azureResults.entryPointLoaded && azureResults.functionsFound === 4;
    
    if (localSuccess && azureSuccess) {
        logSuccess('Both methods working perfectly! Functions should deploy successfully.');
    } else if (localSuccess && !azureSuccess) {
        logError('Local method works but Azure method fails. Deployment structure issue.');
        logWarning('The functions work locally but would fail in Azure deployment.');
    } else if (!localSuccess && azureSuccess) {
        logWarning('Azure method works but local method fails. Local configuration issue.');
    } else {
        logError('Both methods failing. Fundamental configuration issue.');
    }
    
    return { localSuccess, azureSuccess };
}

async function main() {
    try {
        // Step 1: Validate current package structure
        if (!validatePackageStructure()) {
            logError('Package structure validation failed. Building first...');
        }
        
        // Step 2: Simulate Azure build process
        if (!simulateAzureBuildProcess()) {
            logError('Azure build simulation failed');
            return;
        }
        
        // Step 3: Re-validate package structure after build
        if (!validatePackageStructure()) {
            logError('Package structure still invalid after build');
            return;
        }
        
        // Step 4: Test function discovery - Local method
        const localResults = await testFunctionDiscoveryLocal();
        
        // Step 5: Test function discovery - Azure method
        const azureResults = await testFunctionDiscoveryAzure();
        
        // Step 6: Compare and analyze results
        const { localSuccess, azureSuccess } = compareResults(localResults, azureResults);
        
        // Final recommendations
        log('\n🚀 RECOMMENDATIONS:', 'bold');
        log('=' .repeat(30), 'cyan');
        
        if (localSuccess && azureSuccess) {
            logSuccess('✅ Functions are ready for deployment!');
            logInfo('Both local and Azure deployment methods work correctly.');
            logInfo('The issue might be with the deployment pipeline or Azure configuration.');
        } else if (localSuccess && !azureSuccess) {
            logError('❌ Deployment structure issue detected!');
            logWarning('Functions work locally but would fail in Azure.');
            logInfo('Need to fix the package structure for Azure deployment.');
        } else {
            logError('❌ Function configuration issues detected!');
            logInfo('Need to fix the function registration and configuration.');
        }
        
        log('\n📝 NEXT STEPS:', 'bold');
        if (azureSuccess) {
            log('1. Check Azure deployment logs for specific errors');
            log('2. Verify Azure Function App configuration');
            log('3. Check if deployment is actually reaching the Function App');
        } else {
            log('1. Fix the identified configuration issues');
            log('2. Re-run this validation script');
            log('3. Test deployment after fixes');
        }
        
    } catch (error) {
        logError(`Validation script failed: ${error.message}`);
        console.error(error);
    }
}

// Run the validation
main().catch(console.error);
