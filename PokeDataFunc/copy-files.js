const fs = require('fs');
const path = require('path');

/**
 * File copy script for Azure Functions v4 programming model
 * Only copies essential files - NO function.json files needed in v4!
 */

console.log('🔧 Starting Azure Functions v4 programming model file copy process...');

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

    // 3. Copy .env file if it exists (for local development)
    console.log('\n📁 Step 3: Copying .env file (if exists)...');
    const envSource = path.join(__dirname, '.env');
    const envTarget = path.join(distDir, '.env');
    if (fs.existsSync(envSource)) {
        copyFile(envSource, envTarget, '.env file');
    } else {
        console.log('ℹ️  No .env file found (this is normal for production)');
    }

    // 4. Verify the Azure Functions v4 structure
    console.log('\n🔍 Step 4: Verifying Azure Functions v4 structure...');
    
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
    
    // Check for main entry point
    const mainEntryPoint = path.join(distDir, 'index.js');
    if (fs.existsSync(mainEntryPoint)) {
        console.log(`✅ Main entry point exists: index.js`);
    } else {
        console.log(`❌ Main entry point missing: index.js`);
        allGood = false;
    }
    
    // Check for individual function files
    const functionFiles = ['getCardInfo.js', 'getCardsBySet.js', 'getSetList.js', 'refreshData.js'];
    const functionsDir = path.join(distDir, 'functions');
    
    if (fs.existsSync(functionsDir)) {
        console.log(`✅ Functions directory exists: functions/`);
        
        for (const funcFile of functionFiles) {
            const funcPath = path.join(functionsDir, funcFile);
            if (fs.existsSync(funcPath)) {
                console.log(`   ✅ ${funcFile} (compiled)`);
            } else {
                console.log(`   ❌ ${funcFile} missing`);
                allGood = false;
            }
        }
    } else {
        console.log(`❌ Functions directory missing: src/functions/`);
        allGood = false;
    }

    console.log('\n' + '='.repeat(60));
    if (allGood) {
        console.log('🎉 SUCCESS! Azure Functions v4 programming model deployment ready');
        console.log('✅ dist/ directory contains all required files');
        console.log('✅ NO function.json files needed (v4 programming model)');
        console.log('✅ Functions registered in index.js using app.http() and app.timer()');
        console.log('✅ Ready for Azure deployment');
        console.log('\n📦 Deploy from: ./PokeDataFunc/dist');
        console.log('\n🔧 Entry point: dist/index.js (as specified in package.json main field)');
    } else {
        console.log('❌ ISSUES FOUND! Please check the errors above');
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ ERROR during file copy process:', error.message);
    process.exit(1);
}

console.log('\n🚀 Azure Functions v4 file copy process completed successfully!');
