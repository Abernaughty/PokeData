/**
 * Frontend Deployment Wrapper
 * 
 * This script provides an interactive menu for frontend deployment
 * and handles the SWA deployment with token from .env file
 */

const { spawn, spawnSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from .env file
dotenv.config();

// Check if SWA_DEPLOYMENT_TOKEN is set
if (!process.env.SWA_DEPLOYMENT_TOKEN) {
    console.error('\n❌ ERROR: SWA_DEPLOYMENT_TOKEN not found in .env file');
    console.error('Please add SWA_DEPLOYMENT_TOKEN to your .env file');
    console.error('You can find this token in Azure Portal under your Static Web App\'s "Manage deployment token"\n');
    process.exit(1);
}

console.log('✅ SWA_DEPLOYMENT_TOKEN loaded from .env file\n');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });
        
        child.on('exit', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', reject);
    });
}

function checkBuildExists() {
    return fs.existsSync(path.join('public', 'build', 'main.js'));
}

async function buildFrontend() {
    console.log('Building frontend...');
    try {
        await runCommand('npm', ['run', 'build']);
        console.log('[OK] Build completed successfully\n');
        return true;
    } catch (error) {
        console.error('[ERROR] Build failed:', error.message);
        return false;
    }
}

async function deployToSWA() {
    console.log('Deploying to Azure Static Web Apps...');
    console.log('[INFO] Starting deployment...\n');
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        let progressInterval;
        let lastOutputTime = Date.now();
        
        // Start progress indicator
        const startProgressIndicator = () => {
            const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let spinnerIndex = 0;
            
            progressInterval = setInterval(() => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const spinner = spinnerChars[spinnerIndex % spinnerChars.length];
                
                // Clear the current line and write the progress
                process.stdout.write(`\r${spinner} Deploying... Time: ${elapsed}s`);
                spinnerIndex++;
                
                // Check if we haven't received output for a while (might be stuck)
                if (Date.now() - lastOutputTime > 60000) {
                    process.stdout.write('\n[WARNING] Deployment is taking longer than expected...\n');
                    lastOutputTime = Date.now();
                }
            }, 100);
        };
        
        const child = spawn('swa', [
            'deploy',
            './public',
            '--deployment-token',
            process.env.SWA_DEPLOYMENT_TOKEN,
            '--env',
            'production'
        ], {
            shell: true
        });
        
        let outputBuffer = '';
        let errorBuffer = '';
        
        // Start the progress indicator
        startProgressIndicator();
        
        // Capture stdout
        child.stdout.on('data', (data) => {
            lastOutputTime = Date.now();
            outputBuffer += data.toString();
            
            // Parse for specific status messages from SWA CLI
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.includes('Status:') || line.includes('Uploading') || line.includes('Deploying')) {
                    // Clear the progress line and show the status
                    process.stdout.write('\r' + ' '.repeat(50) + '\r');
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    console.log(`[${elapsed}s] ${line.trim()}`);
                }
            }
        });
        
        // Capture stderr
        child.stderr.on('data', (data) => {
            lastOutputTime = Date.now();
            errorBuffer += data.toString();
        });
        
        child.on('exit', (code) => {
            // Stop the progress indicator
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            
            // Clear the progress line
            process.stdout.write('\r' + ' '.repeat(50) + '\r');
            
            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            if (code === 0) {
                console.log('\n========================================');
                console.log(' Deployment Success! [DONE]');
                console.log('========================================\n');
                console.log(`[OK] Frontend deployed successfully to Azure Static Web Apps!`);
                console.log(`[OK] Total deployment time: ${totalTime}s`);
                console.log('[OK] Changes should be live in a few moments.\n');
                console.log('Your app URL: https://pokedata.maber.io\n');
                resolve(true);
            } else {
                console.error('\n========================================');
                console.error(' Deployment Failed [ERROR]');
                console.error('========================================\n');
                console.error('[ERROR] Deployment failed with exit code:', code);
                console.error(`[ERROR] Total time: ${totalTime}s`);
                
                if (errorBuffer) {
                    console.error('[ERROR] Error details:', errorBuffer);
                } else if (outputBuffer.includes('error') || outputBuffer.includes('Error')) {
                    // Try to extract error from output
                    const errorLines = outputBuffer.split('\n').filter(line => 
                        line.toLowerCase().includes('error') || line.includes('failed')
                    );
                    if (errorLines.length > 0) {
                        console.error('[ERROR] Error details:', errorLines.join('\n'));
                    }
                }
                
                console.error('Check your deployment token and network connection.\n');
                resolve(false);
            }
        });
        
        child.on('error', (error) => {
            // Stop the progress indicator
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            
            // Clear the progress line
            process.stdout.write('\r' + ' '.repeat(50) + '\r');
            
            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            console.error('\n========================================');
            console.error(' Deployment Failed [ERROR]');
            console.error('========================================\n');
            console.error('[ERROR] Failed to start deployment process:', error.message);
            console.error(`[ERROR] Total time: ${totalTime}s`);
            console.error('Check that SWA CLI is installed and accessible.\n');
            resolve(false);
        });
    });
}

async function quickDeploy() {
    console.log('\n========================================');
    console.log(' Quick Frontend Deployment');
    console.log('========================================\n');
    
    console.log('Step 1: Checking for existing build...');
    
    if (checkBuildExists()) {
        console.log('[OK] Build exists. Using existing build.');
        const rebuild = await question('Do you want to rebuild? (y/n): ');
        
        if (rebuild.toLowerCase() === 'y') {
            console.log('\nStep 2: Building frontend...');
            const buildSuccess = await buildFrontend();
            if (!buildSuccess) return false;
        } else {
            console.log('[OK] Skipping build, using existing files\n');
        }
    } else {
        console.log('[INFO] No existing build found. Building frontend...');
        const buildSuccess = await buildFrontend();
        if (!buildSuccess) return false;
    }
    
    console.log('Step 3: Deploying to Azure Static Web Apps...');
    return await deployToSWA();
}

async function cleanDeploy() {
    console.log('\n========================================');
    console.log(' Clean Frontend Deployment (Production)');
    console.log('========================================\n');
    
    console.log('Step 1: Cleaning previous build artifacts...');
    const buildPath = path.join('public', 'build');
    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true, force: true });
        console.log('[OK] Cleaned existing build directory\n');
    }
    
    console.log('Step 2: Installing dependencies...');
    try {
        await runCommand('npm', ['install']);
        console.log('[OK] Dependencies installed\n');
    } catch (error) {
        console.error('[ERROR] Failed to install dependencies:', error.message);
        return false;
    }
    
    console.log('Step 3: Building frontend with production optimizations...');
    const buildSuccess = await buildFrontend();
    if (!buildSuccess) return false;
    
    console.log('Step 4: Verifying build output...');
    if (!checkBuildExists()) {
        console.error('[ERROR] Build verification failed - main.js not found');
        return false;
    }
    console.log('[OK] Build output verified\n');
    
    console.log('Step 5: Deploying to Azure Static Web Apps...');
    return await deployToSWA();
}

async function buildOnly() {
    console.log('\n========================================');
    console.log(' Building Frontend Only');
    console.log('========================================\n');
    
    console.log('Step 1: Cleaning previous build...');
    const buildPath = path.join('public', 'build');
    if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true, force: true });
        console.log('[OK] Cleaned existing build directory\n');
    }
    
    console.log('Step 2: Building frontend...');
    const buildSuccess = await buildFrontend();
    if (!buildSuccess) return false;
    
    console.log('Step 3: Verifying build output...');
    if (!checkBuildExists()) {
        console.error('[ERROR] Build verification failed - main.js not found');
        return false;
    }
    
    console.log('\n========================================');
    console.log(' Build Complete! [DONE]');
    console.log('========================================\n');
    console.log('[OK] Frontend built successfully');
    console.log('[OK] Output location: public/build/\n');
    console.log('To test locally, run: npm start');
    console.log('To deploy, run this script again and choose option 1 or 2\n');
    return true;
}

async function showMenu() {
    console.log('========================================');
    console.log(' PokeData Frontend Deployment (SWA)');
    console.log('========================================\n');
    console.log('Select deployment method:\n');
    console.log('1. Quick Deploy (Development/Testing)');
    console.log('   - Builds and deploys directly');
    console.log('   - Uses existing build if available');
    console.log('   - Faster deployment\n');
    console.log('2. Clean Deploy (Production)');
    console.log('   - Clean build from scratch');
    console.log('   - Removes old build artifacts');
    console.log('   - Ensures fresh deployment\n');
    console.log('3. Build Only (No Deploy)');
    console.log('   - Just builds the frontend');
    console.log('   - Useful for testing build\n');
    console.log('4. Exit\n');
    
    const choice = await question('Enter your choice (1-4): ');
    
    let success = false;
    
    switch (choice) {
        case '1':
            success = await quickDeploy();
            break;
        case '2':
            success = await cleanDeploy();
            break;
        case '3':
            success = await buildOnly();
            break;
        case '4':
            console.log('Exiting...');
            rl.close();
            process.exit(0);
        default:
            console.log('Invalid choice. Please try again.\n');
            return showMenu();
    }
    
    if (!success) {
        console.error('Operation failed. Please check the errors above.\n');
    }
    
    await question('Press Enter to continue...');
    rl.close();
    process.exit(success ? 0 : 1);
}

// Start the interactive menu
showMenu().catch((error) => {
    console.error('Unexpected error:', error);
    rl.close();
    process.exit(1);
});
