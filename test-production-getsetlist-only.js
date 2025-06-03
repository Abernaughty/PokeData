const https = require('https');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './PokeDataFunc/.env' });

const PRODUCTION_CONFIG = {
  baseUrl: 'https://pokedata-func.azurewebsites.net',
  functionKey: process.env.PRODUCTION_FUNCTION_KEY || process.env.AZURE_FUNCTION_KEY,
};

console.log('🎯 Testing GetSetList Only');
console.log('===========================');

async function testGetSetList() {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_CONFIG.baseUrl}/api/sets?code=${PRODUCTION_CONFIG.functionKey}`;
    
    console.log(`📡 Testing: ${url}`);
    
    const req = https.request(url, { method: 'GET' }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`📊 Response structure:`);
          console.log(`   - Has items: ${jsonData.items ? 'Yes' : 'No'}`);
          if (jsonData.items) {
            console.log(`   - Items count: ${jsonData.items.length}`);
            console.log(`   - Total count: ${jsonData.totalCount || 'Not specified'}`);
            console.log(`   - Sample item:`, JSON.stringify(jsonData.items[0], null, 2));
          }
          
          resolve({ success: true, data: jsonData });
        } catch (error) {
          console.log(`❌ JSON Parse Error: ${error.message}`);
          console.log(`📄 Raw Response (first 500 chars): ${data.substring(0, 500)}`);
          resolve({ success: false, error: error.message, rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ Request Timeout (10s)`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    req.end();
  });
}

async function main() {
  const result = await testGetSetList();
  
  if (result.success) {
    console.log('\n🎉 GetSetList is working in production!');
    console.log('   This confirms the slot swap was successful.');
    console.log('   The PokeData-first architecture is deployed and functional.');
  } else {
    console.log('\n💥 GetSetList failed in production.');
    console.log('   Error:', result.error);
  }
}

main();
