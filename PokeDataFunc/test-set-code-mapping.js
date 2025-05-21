// test-set-code-mapping.js
// This script tests the set code mapping between our system and the PokeData API

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read settings from local.settings.json
const localSettingsPath = path.join(__dirname, 'local.settings.json');
let localSettings;
try {
    localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
    console.log('Successfully loaded local.settings.json');
} catch (error) {
    console.error('Error loading local.settings.json:', error.message);
    console.log('Trying local.settings.sample.json instead...');
    
    // Try to load from sample file
    const sampleSettingsPath = path.join(__dirname, 'local.settings.sample.json');
    try {
        localSettings = JSON.parse(fs.readFileSync(sampleSettingsPath, 'utf8'));
        console.log('Successfully loaded local.settings.sample.json');
        console.log('WARNING: Using sample settings. API calls may fail without valid API keys.');
    } catch (sampleError) {
        console.error('Error loading local.settings.sample.json:', sampleError.message);
        process.exit(1);
    }
}

// Get API key from settings
const apiKey = localSettings.Values.POKEDATA_API_KEY;
const baseUrl = localSettings.Values.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';

// Set codes we want to check
const ourSetCodes = [
    'PRE', // Prismatic Evolutions
    'SV8PT5', // Prismatic Evolutions (alternative code)
    'sv8pt5', // Prismatic Evolutions (lowercase)
    'SV8', // Paradox Rift
    'OBF', // Obsidian Flames
    'PAL', // Paldea Evolved
    'SVI', // Scarlet & Violet
    'CRZ', // Crown Zenith
    'SIT', // Silver Tempest
    'LOR', // Lost Origin
    'ASR', // Astral Radiance
    'BRS', // Brilliant Stars
    'FST', // Fusion Strike
    'EVS', // Evolving Skies
    'CRE', // Chilling Reign
    'BST', // Battle Styles
    'SHF', // Shining Fates
    'VIV', // Vivid Voltage
    'DAA', // Darkness Ablaze
    'RCL', // Rebel Clash
    'SSH', // Sword & Shield
    'CPA', // Champion's Path
    'HIF', // Hidden Fates
];

// Function to get all sets from PokeData API
async function getAllSets() {
    try {
        console.log(`Getting all sets from PokeData API...`);
        console.log(`Using API key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'undefined'}`);
        console.log(`Using base URL: ${baseUrl}`);
        
        const url = `${baseUrl}/sets`;
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url, { headers });
        
        if (Array.isArray(response.data)) {
            const sets = response.data;
            console.log(`Retrieved ${sets.length} sets from PokeData API`);
            return sets;
        }
        
        console.log(`Unexpected response format for sets:`, response.data);
        return [];
    } catch (error) {
        console.error(`Error getting sets: ${error.message}`);
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        }
        return [];
    }
}

// Function to create a set code mapping
async function createSetCodeMapping() {
    const sets = await getAllSets();
    
    if (sets.length === 0) {
        console.log('No sets returned from API');
        return;
    }
    
    // Log all sets for reference
    console.log('\nAll sets from PokeData API:');
    sets.forEach(set => {
        console.log(`- ${set.name} (Code: ${set.code || 'null'}, ID: ${set.id})`);
    });
    
    // Check our set codes against PokeData API set codes
    console.log('\nChecking our set codes against PokeData API set codes:');
    
    const mapping = {};
    const unmappedCodes = [];
    
    ourSetCodes.forEach(ourCode => {
        // Try exact match first
        let match = sets.find(set => set.code && set.code.toUpperCase() === ourCode.toUpperCase());
        
        // If no exact match, try to find by name
        if (!match) {
            // Try to find by name for common sets
            if (ourCode === 'PRE' || ourCode === 'SV8PT5' || ourCode === 'sv8pt5') {
                match = sets.find(set => set.name.includes('Prismatic') || set.name.includes('Evolutions'));
            } else if (ourCode === 'SV8') {
                match = sets.find(set => set.name.includes('Paradox') || set.name.includes('Rift'));
            } else if (ourCode === 'OBF') {
                match = sets.find(set => set.name.includes('Obsidian') || set.name.includes('Flames'));
            }
            // Add more name-based matches as needed
        }
        
        if (match) {
            mapping[ourCode] = match.code || String(match.id);
            console.log(`✅ ${ourCode} -> ${match.code || match.id} (${match.name})`);
        } else {
            unmappedCodes.push(ourCode);
            console.log(`❌ ${ourCode} -> No match found`);
        }
    });
    
    // Generate mapping code
    console.log('\nGenerated Set Code Mapping:');
    console.log('const SET_CODE_MAPPING = {');
    Object.entries(mapping).forEach(([ourCode, pokeDataCode]) => {
        console.log(`    '${ourCode.toLowerCase()}': '${pokeDataCode.toLowerCase()}', // ${ourCode}`);
    });
    console.log('};');
    
    // List unmapped codes
    if (unmappedCodes.length > 0) {
        console.log('\nUnmapped Set Codes:');
        unmappedCodes.forEach(code => {
            console.log(`- ${code}`);
        });
    }
}

// Run the script
createSetCodeMapping().catch(error => {
    console.error('Unhandled error:', error);
});
