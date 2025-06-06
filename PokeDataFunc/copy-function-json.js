const fs = require('fs');
const path = require('path');

// Function to copy function.json files
function copyFunctionJsonFiles(sourceDir, targetDir) {
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
            console.log(`Copying ${sourcePath} to ${targetPath}`);
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

// Source and target directories
const sourceDir = path.join(__dirname, 'src', 'functions');
const targetDir = path.join(__dirname, 'functions');

// Copy function.json files
copyFunctionJsonFiles(sourceDir, targetDir);

console.log('Function.json files copied successfully!');
