/**
 * Debug GetSetList response structure
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read function key from environment
let functionKey = '';
try {
    const envPath = path.join(__dirname, 'PokeDataFunc', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
        if (line.startsWith('AZURE_FUNCTION_KEY_STAGING=')) {
            functionKey = line.substring('AZURE_FUNCTION_KEY_STAGING='.length).trim();
            break;
        }
    }
} catch (error) {
    console.error('❌ Could not read function key');
    process.exit(1);
}

const STAGING_URL = 'https://pokedata-func-staging.azurewebsites.net';

async function debugGetSetList() {
    return new Promise((resolve) => {
        const encodedFunctionKey = encodeURIComponent(functionKey);
        const url = `${STAGING_URL}/api/sets?code=${encodedFunctionKey}`;
        
        console.log('🔍 Debugging GetSetList Response Structure');
        console.log('==========================================');
        console.log(`URL: ${url.substring(0, 80)}...`);
        
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Size: ${data.length} bytes`);
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log('\n📋 Response Structure:');
                    console.log('======================');
                    console.log('Top-level keys:', Object.keys(jsonData));
                    
                    if (jsonData.data) {
                        console.log('jsonData.data type:', typeof jsonData.data);
                        console.log('jsonData.data is array:', Array.isArray(jsonData.data));
                        if (Array.isArray(jsonData.data)) {
                            console.log('jsonData.data length:', jsonData.data.length);
                            if (jsonData.data.length > 0) {
                                console.log('First item keys:', Object.keys(jsonData.data[0]));
                                console.log('First item sample:', JSON.stringify(jsonData.data[0], null, 2));
                            }
                        } else {
                            console.log('jsonData.data keys:', Object.keys(jsonData.data));
                            console.log('jsonData.data content:', JSON.stringify(jsonData.data, null, 2));
                        }
                    }
                    
                    console.log('\n🔍 Full Response (first 1000 chars):');
                    console.log('====================================');
                    console.log(JSON.stringify(jsonData, null, 2).substring(0, 1000) + '...');
                    
                } catch (error) {
                    console.log('❌ JSON Parse Error:', error.message);
                    console.log('Raw response:', data.substring(0, 1000));
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });
        
        req.setTimeout(30000, () => {
            console.log('⏰ Timeout');
            req.destroy();
            resolve();
        });
        
        req.end();
    });
}

debugGetSetList();
