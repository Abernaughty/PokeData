// Test script to verify our paginated card fetching solution
const { default: fetch } = require('node-fetch');

// API configuration
const API_BASE_URL = 'https://maber-apim-test.azure-api.net/pokedata-api';
const API_KEY = '1c3e73f4352b415c98eb89f91541c4e4';
const SET_CODE = 'PRE'; // Prismatic Evolutions set code

// Headers
const headers = {
  'Ocp-Apim-Subscription-Key': API_KEY,
  'Content-Type': 'application/json'
};

async function testCloudPagination() {
  console.log('Testing paginated card fetching for set:', SET_CODE);
  
  try {
    // 1. First try with regular page size (100) to confirm pagination is needed
    const url1 = `${API_BASE_URL}/sets/${SET_CODE}/cards?pageSize=100&page=1`;
    console.log(`\nFetching page 1 with page size 100: ${url1}`);
    
    const response1 = await fetch(url1, { headers });
    
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log(`❌ ERROR: Status: ${response1.status} ${response1.statusText}`);
      console.log(`Error details: ${errorText}`);
      return;
    }
    
    const data1 = await response1.json();
    const pageData1 = data1.data || {};
    const items1 = pageData1.items || [];
    const totalCount = pageData1.totalCount || 0;
    const totalPages = pageData1.totalPages || 0;
    
    console.log(`Page 1 results: ${items1.length} cards (${totalCount} total cards across ${totalPages} pages)`);
    
    if (totalPages <= 1) {
      console.log('⚠️ This set only has one page of cards. Choose a larger set for testing pagination.');
      return;
    }
    
    // 2. Now try with a large page size to get all cards at once
    const url2 = `${API_BASE_URL}/sets/${SET_CODE}/cards?pageSize=500`;
    console.log(`\nFetching all cards with page size 500: ${url2}`);
    
    const response2 = await fetch(url2, { headers });
    
    if (!response2.ok) {
      const errorText = await response2.text();
      console.log(`❌ ERROR: Status: ${response2.status} ${response2.statusText}`);
      console.log(`Error details: ${errorText}`);
      return;
    }
    
    const data2 = await response2.json();
    const pageData2 = data2.data || {};
    const items2 = pageData2.items || [];
    
    console.log(`Large page size results: ${items2.length} cards`);
    
    // 3. Now fetch all pages manually to verify our pagination logic
    console.log('\nFetching all pages manually:');
    let allCards = [];
    for (let page = 1; page <= totalPages; page++) {
      const pageUrl = `${API_BASE_URL}/sets/${SET_CODE}/cards?pageSize=100&page=${page}`;
      console.log(`  Fetching page ${page}/${totalPages}: ${pageUrl}`);
      
      const pageResponse = await fetch(pageUrl, { headers });
      
      if (!pageResponse.ok) {
        console.log(`❌ ERROR on page ${page}: ${pageResponse.status} ${pageResponse.statusText}`);
        continue;
      }
      
      const pageData = await pageResponse.json();
      const pageItems = (pageData.data && pageData.data.items) ? pageData.data.items : [];
      allCards = [...allCards, ...pageItems];
      
      console.log(`  Page ${page} returned ${pageItems.length} cards. Running total: ${allCards.length}`);
    }
    
    // 4. Compare the results
    console.log('\nResults:');
    console.log(`- Single page (100): ${items1.length} cards`);
    console.log(`- Large page (500): ${items2.length} cards`);
    console.log(`- Manual pagination: ${allCards.length} cards`);
    
    if (items2.length === allCards.length) {
      console.log('\n✅ SUCCESS: Large page size retrieves all cards correctly!');
    } else {
      console.log('\n⚠️ WARNING: Large page size did not retrieve the same number of cards as manual pagination!');
    }
    
    if (allCards.length === totalCount) {
      console.log('✅ SUCCESS: Manual pagination retrieved all cards!');
    } else {
      console.log(`⚠️ WARNING: Manual pagination retrieved ${allCards.length} cards, but totalCount is ${totalCount}!`);
    }
    
  } catch (error) {
    console.log(`❌ NETWORK ERROR: ${error.message}`);
  }
}

// Run the test
testCloudPagination();
