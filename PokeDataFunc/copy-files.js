const fs = require('fs');
const path = require('path');

/**
 * File copy script for Azure Functions v3 programming model
 * Copies function.json files for each function (required in v3!)
 */

console.log('🔧 Starting Azure Functions v3 programming model file copy process...');

// Directories
const distDir = path.join(__dirname, 'dist');

// Function to copy a single file
function copyFile(source, target, description) {
    if (fs.existsSync(source)) {
        // Ensure target directory exists
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(source, target);
        console.log(`✅ Copied ${description}: ${source} → ${target}`);
        return true;
    } else {
        console.log(`⚠️  ${description} not found: ${source}`);
        return false;
    }
}

try {
    // 1. Copy host.json to dist/
    console.log('\n📁 Step 1: Copying host.json...');
    const hostJsonSource = path.join(__dirname, 'host.json');
    const hostJsonTarget = path.join(distDir, 'host.json');
    copyFile(hostJsonSource, hostJsonTarget, 'host.json');

    // 2. Copy package.json to dist/
    console.log('\n📁 Step 2: Copying package.json...');
    const packageJsonSource = path.join(__dirname, 'package.json');
    const packageJsonTarget = path.join(distDir, 'package.json');
    copyFile(packageJsonSource, packageJsonTarget, 'package.json');

    // 3. Copy function.json files for each function (v3 requirement)
    console.log('\n📁 Step 3: Copying function.json files...');
    const functions = [
        { name: 'getCardInfo', sourceDir: 'src/functions/GetCardInfo' },
        { name: 'getCardsBySet', sourceDir: 'src/functions/GetCardsBySet' },
        { name: 'getSetList', sourceDir: 'src/functions/GetSetList' },
        { name: 'refreshData', sourceDir: 'src/functions/RefreshData' }
    ];

    for (const func of functions) {
        const functionJsonSource = path.join(__dirname, func.sourceDir, 'function.json');
        const functionJsonTarget = path.join(distDir, func.name, 'function.json');
        copyFile(functionJsonSource, functionJsonTarget, `${func.name}/function.json`);
    }

    // 4. Copy .env file if it exists (for local development)
    console.log('\n📁 Step 4: Copying .env file (if exists)...');
    const envSource = path.join(__dirname, '.env');
    const envTarget = path.join(distDir, '.env');
    if (fs.existsSync(envSource)) {
        copyFile(envSource, envTarget, '.env file');
    } else {
        console.log('ℹ️  No .env file found (this is normal for production)');
    }

    // 5. Verify the Azure Functions v3 structure
    console.log('\n🔍 Step 5: Verifying Azure Functions v3 structure...');
    
    // Check for required files
    const requiredFiles = ['host.json', 'package.json'];
    let allGood = true;
    
    for (const file of requiredFiles) {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists in dist/`);
        } else {
            console.log(`❌ ${file} missing in dist/`);
            allGood = false;
        }
    }
    
    // Check for individual function files and their function.json
    for (const func of functions) {
        const funcDir = path.join(distDir, func.name);
        const funcJs = path.join(distDir, 'functions', `${func.name}.js`);
        const funcJson = path.join(funcDir, 'function.json');
        
        if (fs.existsSync(funcJs)) {
            console.log(`✅ ${func.name}.js (compiled)`);
        } else {
            console.log(`❌ ${func.name}.js missing`);
            allGood = false;
        }
        
        if (fs.existsSync(funcJson)) {
            console.log(`✅ ${func.name}/function.json`);
        } else {
            console.log(`❌ ${func.name}/function.json missing`);
            allGood = false;
        }
    }

    console.log('\n' + '='.repeat(60));
    if (allGood) {
        console.log('🎉 SUCCESS! Azure Functions v3 programming model deployment ready');
        console.log('✅ dist/ directory contains all required files');
        console.log('✅ function.json files copied for each function (v3 requirement)');
        console.log('✅ Functions use traditional v3 model with individual function.json');
        console.log('✅ Ready for Azure deployment');
        console.log('\n📦 Deploy from: ./PokeDataFunc/dist');
        console.log('\n🔧 Entry point: dist/src/functions/*.js (as specified in package.json main field)');
    } else {
        console.log('❌ ISSUES FOUND! Please check the errors above');
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ ERROR during file copy process:', error.message);
    process.exit(1);
}

console.log('\n🚀 Azure Functions v3 file copy process completed successfully!');
