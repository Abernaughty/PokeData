/**
 * GitHub Actions Workflow Validation Test
 * 
 * This script validates that the GitHub Actions workflow files are properly configured
 * and ready for deployment to fix the package manager conflicts.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 GITHUB ACTIONS WORKFLOW VALIDATION TEST');
console.log('=' .repeat(60));

/**
 * Test workflow file existence and basic structure
 */
function testWorkflowFiles() {
    console.log('\n📁 TESTING WORKFLOW FILES EXISTENCE');
    console.log('-'.repeat(40));
    
    const workflowDir = '.github/workflows';
    const expectedFiles = [
        'azure-static-web-apps.yml',
        'azure-functions.yml'
    ];
    
    let allFilesExist = true;
    
    // Check if workflow directory exists
    if (!fs.existsSync(workflowDir)) {
        console.log('❌ ERROR: .github/workflows directory does not exist');
        return false;
    }
    
    console.log('✅ .github/workflows directory exists');
    
    // Check each expected workflow file
    for (const file of expectedFiles) {
        const filePath = path.join(workflowDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
            
            // Check file size (should not be empty)
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                console.log(`   📊 File size: ${stats.size} bytes`);
            } else {
                console.log(`❌ ${file} is empty`);
                allFilesExist = false;
            }
        } else {
            console.log(`❌ ${file} is missing`);
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

/**
 * Test Static Web Apps workflow configuration
 */
function testStaticWebAppsWorkflow() {
    console.log('\n🌐 TESTING STATIC WEB APPS WORKFLOW');
    console.log('-'.repeat(40));
    
    const filePath = '.github/workflows/azure-static-web-apps.yml';
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ azure-static-web-apps.yml not found');
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test for key pnpm configuration
    const tests = [
        {
            name: 'pnpm setup action',
            pattern: /pnpm\/action-setup@v2/,
            description: 'Uses pnpm action setup'
        },
        {
            name: 'pnpm version specification',
            pattern: /version:\s*10\.9\.0/,
            description: 'Specifies correct pnpm version'
        },
        {
            name: 'pnpm cache configuration',
            pattern: /cache:\s*['"]pnpm['"]/, 
            description: 'Uses pnpm for caching'
        },
        {
            name: 'pnpm install command',
            pattern: /pnpm install --frozen-lockfile/,
            description: 'Uses pnpm install with frozen lockfile'
        },
        {
            name: 'pnpm build command',
            pattern: /pnpm run build/,
            description: 'Uses pnpm for building'
        },
        {
            name: 'skip app build',
            pattern: /skip_app_build:\s*true/,
            description: 'Skips Azure build (uses custom pnpm build)'
        }
    ];
    
    let allTestsPassed = true;
    
    for (const test of tests) {
        if (test.pattern.test(content)) {
            console.log(`✅ ${test.name}: ${test.description}`);
        } else {
            console.log(`❌ ${test.name}: Missing - ${test.description}`);
            allTestsPassed = false;
        }
    }
    
    return allTestsPassed;
}

/**
 * Test Azure Functions workflow configuration
 */
function testAzureFunctionsWorkflow() {
    console.log('\n⚡ TESTING AZURE FUNCTIONS WORKFLOW');
    console.log('-'.repeat(40));
    
    const filePath = '.github/workflows/azure-functions.yml';
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ azure-functions.yml not found');
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test for key npm configuration
    const tests = [
        {
            name: 'npm ci command',
            pattern: /npm ci/,
            description: 'Uses npm ci for clean install'
        },
        {
            name: 'npm build command',
            pattern: /npm run build --if-present/,
            description: 'Uses npm for building'
        },
        {
            name: 'staging deployment',
            pattern: /slot-name:\s*['"]staging['"]/, 
            description: 'Deploys to staging slot first'
        },
        {
            name: 'production slot swap',
            pattern: /slot swap/,
            description: 'Uses slot swapping for production'
        },
        {
            name: 'path filtering',
            pattern: /paths:\s*-\s*['"]PokeDataFunc\/\*\*['"]/, 
            description: 'Only triggers on PokeDataFunc changes'
        },
        {
            name: 'manual trigger',
            pattern: /workflow_dispatch/,
            description: 'Supports manual triggering'
        }
    ];
    
    let allTestsPassed = true;
    
    for (const test of tests) {
        if (test.pattern.test(content)) {
            console.log(`✅ ${test.name}: ${test.description}`);
        } else {
            console.log(`❌ ${test.name}: Missing - ${test.description}`);
            allTestsPassed = false;
        }
    }
    
    return allTestsPassed;
}

/**
 * Test package.json configurations
 */
function testPackageConfigurations() {
    console.log('\n📦 TESTING PACKAGE CONFIGURATIONS');
    console.log('-'.repeat(40));
    
    // Test root package.json (frontend)
    console.log('\n🎨 Frontend package.json:');
    const frontendPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (frontendPackage.packageManager && frontendPackage.packageManager.includes('pnpm')) {
        console.log(`✅ Package manager: ${frontendPackage.packageManager}`);
    } else {
        console.log('❌ Package manager not set to pnpm');
        return false;
    }
    
    // Test PokeDataFunc package.json (backend)
    console.log('\n⚡ Backend package.json:');
    const backendPackage = JSON.parse(fs.readFileSync('PokeDataFunc/package.json', 'utf8'));
    
    if (backendPackage.scripts && backendPackage.scripts.build) {
        console.log(`✅ Build script: ${backendPackage.scripts.build}`);
    } else {
        console.log('❌ Build script not found');
        return false;
    }
    
    // Check for pnpm-lock.yaml in root
    if (fs.existsSync('pnpm-lock.yaml')) {
        console.log('✅ pnpm-lock.yaml exists in root');
    } else {
        console.log('❌ pnpm-lock.yaml missing in root');
        return false;
    }
    
    // Check for package-lock.json in PokeDataFunc (should not exist for npm ci to work)
    if (!fs.existsSync('PokeDataFunc/package-lock.json')) {
        console.log('✅ No package-lock.json in PokeDataFunc (npm ci will create it)');
    } else {
        console.log('⚠️  package-lock.json exists in PokeDataFunc (may cause conflicts)');
    }
    
    return true;
}

/**
 * Test documentation
 */
function testDocumentation() {
    console.log('\n📚 TESTING DOCUMENTATION');
    console.log('-'.repeat(40));
    
    const docPath = 'docs/github-actions-workflow-fix.md';
    
    if (fs.existsSync(docPath)) {
        console.log('✅ Workflow fix documentation exists');
        
        const content = fs.readFileSync(docPath, 'utf8');
        const sections = [
            'Problem Summary',
            'Root Cause', 
            'Solution Implemented',
            'Required GitHub Secrets',
            'How to Configure Secrets',
            'Testing the Fix'
        ];
        
        let allSectionsPresent = true;
        for (const section of sections) {
            if (content.includes(section)) {
                console.log(`✅ Section: ${section}`);
            } else {
                console.log(`❌ Missing section: ${section}`);
                allSectionsPresent = false;
            }
        }
        
        return allSectionsPresent;
    } else {
        console.log('❌ Workflow fix documentation missing');
        return false;
    }
}

/**
 * Main test execution
 */
async function main() {
    console.log('Testing GitHub Actions workflow configuration fixes...\n');
    
    const tests = [
        { name: 'Workflow Files', test: testWorkflowFiles },
        { name: 'Static Web Apps Workflow', test: testStaticWebAppsWorkflow },
        { name: 'Azure Functions Workflow', test: testAzureFunctionsWorkflow },
        { name: 'Package Configurations', test: testPackageConfigurations },
        { name: 'Documentation', test: testDocumentation }
    ];
    
    let allTestsPassed = true;
    const results = [];
    
    for (const { name, test } of tests) {
        try {
            const passed = test();
            results.push({ name, passed });
            if (!passed) allTestsPassed = false;
        } catch (error) {
            console.log(`❌ ERROR in ${name}: ${error.message}`);
            results.push({ name, passed: false });
            allTestsPassed = false;
        }
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    for (const { name, passed } of results) {
        console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASS' : 'FAIL'}`);
    }
    
    console.log('\n🎯 OVERALL RESULT:');
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('🚀 Workflows are ready for deployment');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Commit and push these workflow files to GitHub');
        console.log('2. Configure required secrets in GitHub repository settings');
        console.log('3. Test deployments by making small changes');
        console.log('4. Monitor workflow execution in GitHub Actions tab');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('⚠️  Please review the failed tests above and fix issues before deployment');
    }
    
    console.log('\n📖 For detailed setup instructions, see:');
    console.log('   docs/github-actions-workflow-fix.md');
}

// Run the test
if (require.main === module) {
    main();
}

module.exports = {
    testWorkflowFiles,
    testStaticWebAppsWorkflow,
    testAzureFunctionsWorkflow,
    testPackageConfigurations,
    testDocumentation
};
