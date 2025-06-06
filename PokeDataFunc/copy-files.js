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

// Function to copy function.json files
function copyFunctionJsonFiles(sourceDir, targetDir) {
    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️  Source directory not found: ${sourceDir}`);
        return;
    }

    // Create the target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Read the source directory
    const items = fs.readdirSync(sourceDir, { withFileTypes: true });

    // Process each item in the directory
    for (const item of items) {
        const sourcePath = path.join(sourceDir, item.name);
        const targetPath = path.join(targetDir, item.name);

        if (item.isDirectory()) {
            // Recursively copy directories
            copyFunctionJsonFiles(sourcePath, targetPath);
        } else if (item.name === 'function.json') {
            // Copy function.json files
            console.log(`📄 Copying ${sourcePath} to ${targetPath}`);
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
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

    // 5. Verify the structure
    console.log('\n🔍 Step 5: Verifying dist/ structure...');
    
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
            
            // Verify each function has both index.js and function.json
            for (const funcDir of functionDirs) {
                const funcPath = path.join(dirPath, funcDir);
                const hasIndexJs = fs.existsSync(path.join(funcPath, 'index.js'));
                const hasFunctionJson = fs.existsSync(path.join(funcPath, 'function.json'));
                
                if (hasIndexJs && hasFunctionJson) {
                    console.log(`   ✅ ${funcDir}: index.js + function.json`);
                } else {
                    console.log(`   ❌ ${funcDir}: missing ${!hasIndexJs ? 'index.js' : ''} ${!hasFunctionJson ? 'function.json' : ''}`);
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
