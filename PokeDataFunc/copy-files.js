const fs = require('fs');
const path = require('path');

/**
 * Comprehensive file copy script for Azure Functions v4 TypeScript deployment
 * Copies all required files to the dist/ directory for proper deployment structure
 */

console.log('🔧 Starting Azure Functions v4 file copy process...');

// Directories
const distDir = path.join(__dirname, 'dist');
const srcFunctionsDir = path.join(__dirname, 'src', 'functions');
const distFunctionsDir = path.join(distDir, 'functions');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Created dist/ directory');
}

// Azure Functions v4 doesn't need function.json files - they're defined in src/index.ts
// This function is kept for compatibility but does nothing
function copyFunctionJsonFiles(sourceDir, targetDir) {
    console.log('ℹ️  Azure Functions v4: function.json files not needed (defined in src/index.ts)');
    // No-op: Azure Functions v4 uses programmatic registration in index.ts
}

// Function to copy a single file
function copyFile(source, target, description) {
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
        console.log(`✅ Copied ${description}: ${source} → ${target}`);
    } else {
        console.log(`⚠️  ${description} not found: ${source}`);
    }
}

try {
    // 1. Copy function.json files from src/functions to dist/functions
    console.log('\n📁 Step 1: Copying function.json files...');
    copyFunctionJsonFiles(srcFunctionsDir, distFunctionsDir);

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

    // 5. Verify the structure (Azure Functions v4)
    console.log('\n🔍 Step 5: Verifying Azure Functions v4 dist/ structure...');
    
    // Check for required files
    const requiredFiles = ['host.json', 'package.json', 'index.js'];
    const requiredDirs = ['functions'];
    
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
    
    for (const dir of requiredDirs) {
        const dirPath = path.join(distDir, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`✅ ${dir}/ directory exists in dist/`);
            
            // Check function directories
            const functionDirs = fs.readdirSync(dirPath, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name);
            
            console.log(`   📂 Functions found: ${functionDirs.join(', ')}`);
            
            // Azure Functions v4: Only verify index.js exists (no function.json needed)
            for (const funcDir of functionDirs) {
                const funcPath = path.join(dirPath, funcDir);
                const hasIndexJs = fs.existsSync(path.join(funcPath, 'index.js'));
                
                if (hasIndexJs) {
                    console.log(`   ✅ ${funcDir}: index.js (v4 - no function.json needed)`);
                } else {
                    console.log(`   ❌ ${funcDir}: missing index.js`);
                    allGood = false;
                }
            }
        } else {
            console.log(`❌ ${dir}/ directory missing in dist/`);
            allGood = false;
        }
    }

    console.log('\n' + '='.repeat(60));
    if (allGood) {
        console.log('🎉 SUCCESS! Azure Functions v4 deployment structure ready');
        console.log('✅ dist/ directory contains all required files');
        console.log('✅ Ready for Azure deployment');
        console.log('\n📦 Deploy from: ./PokeDataFunc/dist');
    } else {
        console.log('❌ ISSUES FOUND! Please check the errors above');
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ ERROR during file copy process:', error.message);
    process.exit(1);
}

console.log('\n🚀 File copy process completed successfully!');
