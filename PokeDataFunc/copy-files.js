const fs = require('fs');
const path = require('path');

/**
 * File copy script for traditional Azure Functions structure
 * Copies function.json files to the corresponding dist directories
 */

console.log('🔧 Starting traditional Azure Functions file copy process...');

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

// Function to copy function.json files for traditional Azure Functions
function copyFunctionJsonFiles() {
    console.log('\n📁 Step 1: Copying function.json files...');
    
    // Get all function directories at root level
    const functionDirs = fs.readdirSync(__dirname, { withFileTypes: true })
        .filter(item => item.isDirectory() && 
                item.name !== 'node_modules' && 
                item.name !== 'dist' && 
                item.name !== 'data' && 
                item.name !== 'docs' && 
                item.name !== 'functions' &&
                item.name !== 'models' &&
                item.name !== 'services' &&
                item.name !== 'utils' &&
                item.name !== 'scripts')
        .map(item => item.name);
    
    console.log(`   📂 Found function directories: ${functionDirs.join(', ')}`);
    
    let copiedCount = 0;
    for (const funcDir of functionDirs) {
        const sourceFunctionJson = path.join(__dirname, funcDir, 'function.json');
        const targetFunctionJson = path.join(distDir, funcDir, 'function.json');
        
        if (copyFile(sourceFunctionJson, targetFunctionJson, `${funcDir}/function.json`)) {
            copiedCount++;
        }
    }
    
    console.log(`   ✅ Copied ${copiedCount} function.json files`);
    return copiedCount > 0;
}

try {
    // 1. Copy function.json files
    const functionJsonCopied = copyFunctionJsonFiles();

    // 2. Copy host.json to dist/
    console.log('\n📁 Step 2: Copying host.json...');
    const hostJsonSource = path.join(__dirname, 'host.json');
    const hostJsonTarget = path.join(distDir, 'host.json');
    copyFile(hostJsonSource, hostJsonTarget, 'host.json');

    // 3. Copy package.json to dist/
    console.log('\n📁 Step 3: Copying package.json...');
    const packageJsonSource = path.join(__dirname, 'package.json');
    const packageJsonTarget = path.join(distDir, 'package.json');
    copyFile(packageJsonSource, packageJsonTarget, 'package.json');

    // 4. Copy .env file if it exists (for local development)
    console.log('\n📁 Step 4: Copying .env file (if exists)...');
    const envSource = path.join(__dirname, '.env');
    const envTarget = path.join(distDir, '.env');
    if (fs.existsSync(envSource)) {
        copyFile(envSource, envTarget, '.env file');
    } else {
        console.log('ℹ️  No .env file found (this is normal for production)');
    }

    // 5. Verify the structure
    console.log('\n🔍 Step 5: Verifying traditional Azure Functions structure...');
    
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
    
    // Check function directories in dist
    if (fs.existsSync(distDir)) {
        const distItems = fs.readdirSync(distDir, { withFileTypes: true })
            .filter(item => item.isDirectory() && 
                    item.name !== 'functions' && 
                    item.name !== 'models' && 
                    item.name !== 'services' && 
                    item.name !== 'utils')
            .map(item => item.name);
        
        console.log(`✅ Function directories in dist/: ${distItems.join(', ')}`);
        
        // Verify each function has both index.js and function.json
        for (const funcDir of distItems) {
            const funcPath = path.join(distDir, funcDir);
            const hasIndexJs = fs.existsSync(path.join(funcPath, 'index.js'));
            const hasFunctionJson = fs.existsSync(path.join(funcPath, 'function.json'));
            
            if (hasIndexJs && hasFunctionJson) {
                console.log(`   ✅ ${funcDir}: index.js + function.json`);
            } else {
                console.log(`   ❌ ${funcDir}: missing ${!hasIndexJs ? 'index.js' : ''} ${!hasFunctionJson ? 'function.json' : ''}`);
                allGood = false;
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    if (allGood && functionJsonCopied) {
        console.log('🎉 SUCCESS! Traditional Azure Functions deployment structure ready');
        console.log('✅ dist/ directory contains all required files');
        console.log('✅ Ready for Azure deployment');
        console.log('\n📦 Deploy from: ./PokeDataFunc/dist');
    } else {
        console.log('❌ ISSUES FOUND! Please check the errors above');
        if (!functionJsonCopied) {
            console.log('❌ No function.json files were copied');
        }
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ ERROR during file copy process:', error.message);
    process.exit(1);
}

console.log('\n🚀 File copy process completed successfully!');
