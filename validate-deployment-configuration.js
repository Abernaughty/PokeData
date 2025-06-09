/**
 * Azure Functions Deployment Configuration Validation Script
 * 
 * This script validates the current deployment configuration against the proven
 * methodology that successfully resolved the Azure Functions deployment crisis.
 * 
 * Based on: AZURE-FUNCTIONS-DEPLOYMENT-VALIDATION-AND-FIXES.md
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Azure Functions Deployment Configuration Validation');
console.log('=' .repeat(60));

let validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
};

function logResult(test, status, message, severity = 'error') {
    const symbols = { pass: '✅', fail: '❌', warn: '⚠️' };
    const symbol = symbols[status] || '❓';
    
    console.log(`${symbol} ${test}: ${message}`);
    
    if (status === 'pass') {
        validationResults.passed++;
    } else if (status === 'fail') {
        validationResults.failed++;
        validationResults.issues.push({ test, message, severity });
    } else if (status === 'warn') {
        validationResults.warnings++;
        validationResults.issues.push({ test, message, severity: 'warning' });
    }
}

// Test 1: Node.js Version in GitHub Actions
console.log('\n📋 Testing GitHub Actions Configuration...');
try {
    const workflowPath = '.github/workflows/azure-functions.yml';
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    if (workflowContent.includes("NODE_VERSION: '20.x'")) {
        logResult('Node.js Version', 'pass', 'GitHub Actions uses Node.js 20.x (correct)');
    } else if (workflowContent.includes("NODE_VERSION: '18.x'")) {
        logResult('Node.js Version', 'fail', 'GitHub Actions uses Node.js 18.x - should be 20.x for compatibility');
    } else {
        logResult('Node.js Version', 'warn', 'Node.js version not found or in unexpected format');
    }
    
    // Test deployment method
    if (workflowContent.includes('Azure/functions-action@v1')) {
        logResult('Deployment Method', 'warn', 'Uses Azure Functions Core Tools - consider manual zip deployment for reliability');
    } else if (workflowContent.includes('az functionapp deployment source config-zip')) {
        logResult('Deployment Method', 'pass', 'Uses manual zip deployment (proven method)');
    } else {
        logResult('Deployment Method', 'warn', 'Deployment method unclear');
    }
    
} catch (error) {
    logResult('GitHub Actions File', 'fail', `Cannot read workflow file: ${error.message}`);
}

// Test 2: Package.json Configuration
console.log('\n📦 Testing Package.json Configuration...');
try {
    const packagePath = 'PokeDataFunc/package.json';
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Test main field
    if (packageContent.main === 'index.js') {
        logResult('Package Main Field', 'pass', 'Main field points to index.js (correct for v4)');
    } else if (packageContent.main === 'dist/index.js') {
        logResult('Package Main Field', 'fail', 'Main field points to dist/index.js - should be index.js for Azure Functions v4');
    } else {
        logResult('Package Main Field', 'warn', `Unexpected main field: ${packageContent.main}`);
    }
    
    // Test scripts for pnpm usage
    const scripts = packageContent.scripts || {};
    let npmUsage = 0;
    let pnpmUsage = 0;
    
    Object.entries(scripts).forEach(([name, script]) => {
        // Check for npm usage (but not pnpm which contains npm)
        if (script.includes('npm ') && !script.includes('pnpm ')) npmUsage++;
        if (script.includes('pnpm ')) pnpmUsage++;
    });
    
    if (npmUsage === 0 && pnpmUsage > 0) {
        logResult('Package Manager Consistency', 'pass', 'All scripts use pnpm (consistent)');
    } else if (npmUsage > 0 && pnpmUsage === 0) {
        logResult('Package Manager Consistency', 'warn', 'Scripts use npm - consider pnpm for consistency');
    } else if (npmUsage > 0 && pnpmUsage > 0) {
        logResult('Package Manager Consistency', 'fail', 'Mixed npm/pnpm usage in scripts - should be consistent');
    } else {
        logResult('Package Manager Consistency', 'pass', 'No explicit package manager usage in scripts');
    }
    
    // Test Node.js version requirement
    const nodeVersion = packageContent.engines?.node;
    if (nodeVersion && nodeVersion.includes('20')) {
        logResult('Node.js Engine Requirement', 'pass', `Node.js version requirement includes 20: ${nodeVersion}`);
    } else if (nodeVersion && nodeVersion.includes('18')) {
        logResult('Node.js Engine Requirement', 'warn', `Node.js version requirement: ${nodeVersion} - consider updating to 20+`);
    } else {
        logResult('Node.js Engine Requirement', 'warn', `Node.js version requirement unclear: ${nodeVersion}`);
    }
    
} catch (error) {
    logResult('Package.json File', 'fail', `Cannot read package.json: ${error.message}`);
}

// Test 3: TypeScript Configuration
console.log('\n🔧 Testing TypeScript Configuration...');
try {
    const tsconfigPath = 'PokeDataFunc/tsconfig.json';
    const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    const outDir = tsconfigContent.compilerOptions?.outDir;
    if (outDir === './') {
        logResult('TypeScript Output Directory', 'pass', 'Output directory is ./ (correct for v4)');
    } else if (outDir === './dist') {
        logResult('TypeScript Output Directory', 'fail', 'Output directory is ./dist - should be ./ for Azure Functions v4');
    } else {
        logResult('TypeScript Output Directory', 'warn', `Unexpected output directory: ${outDir}`);
    }
    
} catch (error) {
    logResult('TypeScript Config', 'fail', `Cannot read tsconfig.json: ${error.message}`);
}

// Test 4: .funcignore Configuration
console.log('\n🚫 Testing .funcignore Configuration...');
try {
    const funcignorePath = 'PokeDataFunc/.funcignore';
    const funcignoreContent = fs.readFileSync(funcignorePath, 'utf8');
    
    if (funcignoreContent.includes('node_modules/')) {
        logResult('.funcignore node_modules', 'fail', 'node_modules/ is in .funcignore - this prevents dependency deployment');
    } else {
        logResult('.funcignore node_modules', 'pass', 'node_modules/ is NOT in .funcignore (correct for dependency inclusion)');
    }
    
} catch (error) {
    logResult('.funcignore File', 'warn', `Cannot read .funcignore: ${error.message}`);
}

// Test 5: Check for compiled output structure
console.log('\n🏗️ Testing Build Output Structure...');
try {
    const distExists = fs.existsSync('PokeDataFunc/dist');
    const rootIndexExists = fs.existsSync('PokeDataFunc/index.js');
    
    if (rootIndexExists) {
        logResult('Compiled Output Location', 'pass', 'index.js exists in root (correct for v4)');
    } else if (distExists) {
        logResult('Compiled Output Location', 'warn', 'dist/ directory exists but no root index.js - may need to rebuild');
    } else {
        logResult('Compiled Output Location', 'warn', 'No compiled output found - run build to test');
    }
    
} catch (error) {
    logResult('Build Output Check', 'warn', `Cannot check build output: ${error.message}`);
}

// Test 6: Deployment script validation
console.log('\n🚀 Testing Deployment Scripts...');
try {
    const packagePath = 'PokeDataFunc/package.json';
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deployScript = packageContent.scripts?.deploy;
    
    if (deployScript && deployScript.includes('az functionapp deployment source config-zip')) {
        logResult('Manual Zip Deployment Script', 'pass', 'Deploy script uses manual zip deployment (proven method)');
    } else if (deployScript && deployScript.includes('func azure functionapp publish')) {
        logResult('Manual Zip Deployment Script', 'warn', 'Deploy script uses func publish - consider manual zip for reliability');
    } else {
        logResult('Manual Zip Deployment Script', 'warn', 'No deploy script found or method unclear');
    }
    
} catch (error) {
    logResult('Deployment Script Check', 'warn', `Cannot check deployment scripts: ${error.message}`);
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('=' .repeat(60));
console.log(`✅ Passed: ${validationResults.passed}`);
console.log(`❌ Failed: ${validationResults.failed}`);
console.log(`⚠️  Warnings: ${validationResults.warnings}`);

if (validationResults.issues.length > 0) {
    console.log('\n🔧 ISSUES TO ADDRESS:');
    validationResults.issues.forEach((issue, index) => {
        const symbol = issue.severity === 'warning' ? '⚠️' : '❌';
        console.log(`${index + 1}. ${symbol} ${issue.test}: ${issue.message}`);
    });
}

console.log('\n📋 RECOMMENDATIONS:');
if (validationResults.failed > 0) {
    console.log('❌ CRITICAL: Address failed validations before deploying');
    console.log('   These issues may cause deployment failures similar to the original crisis');
}
if (validationResults.warnings > 0) {
    console.log('⚠️  IMPORTANT: Review warnings for potential improvements');
    console.log('   These may not cause immediate failures but could impact reliability');
}
if (validationResults.failed === 0 && validationResults.warnings === 0) {
    console.log('✅ EXCELLENT: Configuration aligns with proven deployment methodology');
    console.log('   Deployments should succeed using the validated approach');
}

console.log('\n📖 For detailed fixes, see: AZURE-FUNCTIONS-DEPLOYMENT-VALIDATION-AND-FIXES.md');
console.log('🔗 Based on successful deployment resolution methodology');

// Exit with appropriate code
process.exit(validationResults.failed > 0 ? 1 : 0);
