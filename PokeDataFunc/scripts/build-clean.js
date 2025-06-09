const fs = require('fs');
const path = require('path');

console.log('🚀 Creating clean deployment package...');

// Clean dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Cleaned existing dist directory');
}

// Create dist directory
fs.mkdirSync(distDir, { recursive: true });
console.log('✅ Created dist directory');

// Step 1: Build TypeScript
console.log('📦 Building TypeScript...');
const { execSync } = require('child_process');
try {
    execSync('pnpm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ TypeScript build completed');
} catch (error) {
    console.error('❌ TypeScript build failed:', error.message);
    process.exit(1);
}

// Step 2: Copy essential files to dist
console.log('📋 Copying essential files...');

const filesToCopy = [
    'host.json',
    'local.settings.json'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`⚠️  ${file} not found, skipping`);
    }
});

// Step 3: Create production package.json in dist
console.log('📄 Creating production package.json...');

const productionPackageJson = {
    "name": "pokedatafunc",
    "version": "1.0.0",
    "main": "index.js",
    "engines": {
        "node": ">=20.0.0"
    },
    "dependencies": {
        "@azure/cosmos": "^4.3.0",
        "@azure/functions": "^4.7.2",
        "@azure/storage-blob": "^12.27.0",
        "@typespec/ts-http-runtime": "^0.2.2",
        "axios": "^1.9.0",
        "cookie": "^0.6.0",
        "dotenv": "^16.5.0",
        "redis": "^4.7.0"
    }
};

fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(productionPackageJson, null, 2)
);
console.log('✅ Created production package.json');

// Step 4: Install production dependencies
console.log('📦 Installing production dependencies...');
try {
    execSync('npm install --production', { stdio: 'inherit', cwd: distDir });
    console.log('✅ Production dependencies installed');
} catch (error) {
    console.error('❌ Failed to install production dependencies:', error.message);
    process.exit(1);
}

console.log('🎉 Clean deployment package created successfully!');
console.log(`📁 Deployment package location: ${distDir}`);
console.log('');
console.log('Contents of dist directory:');
const distContents = fs.readdirSync(distDir);
distContents.forEach(item => {
    const itemPath = path.join(distDir, item);
    const isDir = fs.statSync(itemPath).isDirectory();
    console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
});
