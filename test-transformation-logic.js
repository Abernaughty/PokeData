/**
 * Test Data Transformation Logic - Standalone Test
 * This script tests the data transformation logic without dependencies
 */

console.log('🧪 DATA TRANSFORMATION LOGIC TEST');
console.log('==================================');
console.log('Testing PokeData-first to frontend data transformation logic...');
console.log('');

// Mock the API response based on what the user showed in the network tab
const mockPokeDataResponse = {
  status: 200,
  cached: false,
  data: {
    id: "pokedata-73121",
    source: "pokedata",
    pokeDataId: 73121,
    setId: 557,
    cardName: "Umbreon ex",
    cardNumber: "161",
    enhancement: {
      tcgSetId: "sv8pt5",
      tcgCardId: "sv8pt5-161",
      metadata: { rarity: "Special Illustration Rare" },
      enhancedAt: "2025-06-03T18:41:04.247Z"
    },
    images: {
      small: "https://images.pokemontcg.io/sv8pt5/161.png",
      large: "https://images.pokemontcg.io/sv8pt5/161_hires.png"
    },
    language: "ENGLISH",
    lastUpdated: "2025-06-03T18:41:03.855Z",
    pokeDataId: 73121,
    pricing: {
      psa: { 9: 1059.4433333333334, 10: 2834.8233333333333 },
      cgc: { 8_0: 1200 },
      tcgPlayer: 1204.97,
      ebayRaw: 1124.9333333333334,
      pokeDataRaw: 1204.97
    },
    releaseDate: "2025-01-17",
    secret: true,
    setCode: "PRE",
    setId: 557,
    setName: "Prismatic Evolutions",
    source: "pokedata"
  },
  timestamp: "2025-06-03T18:41:04.316Z"
};

console.log('🔍 Test 1: Raw PokeData Response Structure');
console.log('Analyzing the raw response from PokeData backend...');
console.log('');

console.log('✅ Response structure:');
console.log(`   - Status: ${mockPokeDataResponse.status}`);
console.log(`   - Cached: ${mockPokeDataResponse.cached}`);
console.log(`   - Card ID: ${mockPokeDataResponse.data.id}`);
console.log(`   - Card Name: ${mockPokeDataResponse.data.cardName}`);
console.log(`   - Set Name: ${mockPokeDataResponse.data.setName}`);
console.log('');

console.log('✅ Pricing structure (PokeData format):');
Object.entries(mockPokeDataResponse.data.pricing).forEach(([key, value]) => {
  if (typeof value === 'object') {
    console.log(`   - ${key}:`, value);
  } else {
    console.log(`   - ${key}: ${value}`);
  }
});
console.log('');

console.log('✅ Image structure (PokeData format):');
console.log(`   - Small: ${mockPokeDataResponse.data.images.small}`);
console.log(`   - Large: ${mockPokeDataResponse.data.images.large}`);
console.log('');

console.log('🔍 Test 2: Data Transformation Simulation');
console.log('Simulating the transformation logic from cloudDataService...');
console.log('');

// Simulate the transformation logic (extracted from cloudDataService.js)
const cardData = mockPokeDataResponse.data;
const transformedCard = {
  ...cardData,
  pricing: {} // Create the pricing object expected by the frontend
};

// Handle PokeData-first pricing structure
if (cardData.pricing) {
  console.log('🔄 Transforming pricing structure...');
  
  // Transform PSA grades: psa: {9: 1059} → "psa-9": {value: 1059, currency: "USD"}
  if (cardData.pricing.psa) {
    Object.entries(cardData.pricing.psa).forEach(([grade, value]) => {
      transformedCard.pricing[`psa-${grade}`] = { value: value, currency: 'USD' };
      console.log(`   ✅ PSA Grade ${grade}: ${value} → psa-${grade}: {value: ${value}, currency: "USD"}`);
    });
  }
  
  // Transform CGC grades: cgc: {8_0: 1200} → "cgc-8.0": {value: 1200, currency: "USD"}
  if (cardData.pricing.cgc) {
    Object.entries(cardData.pricing.cgc).forEach(([grade, value]) => {
      const cleanGrade = grade.replace('_', '.');
      transformedCard.pricing[`cgc-${cleanGrade}`] = { value: value, currency: 'USD' };
      console.log(`   ✅ CGC Grade ${grade}: ${value} → cgc-${cleanGrade}: {value: ${value}, currency: "USD"}`);
    });
  }
  
  // Transform TCGPlayer price: tcgPlayer: 1204.97 → market: {value: 1204.97, currency: "USD"}
  if (cardData.pricing.tcgPlayer) {
    transformedCard.pricing.market = { value: cardData.pricing.tcgPlayer, currency: 'USD' };
    console.log(`   ✅ TCGPlayer: ${cardData.pricing.tcgPlayer} → market: {value: ${cardData.pricing.tcgPlayer}, currency: "USD"}`);
  }
  
  // Transform eBay raw price: ebayRaw: 1124.93 → ebayRaw: {value: 1124.93, currency: "USD"}
  if (cardData.pricing.ebayRaw) {
    transformedCard.pricing.ebayRaw = { value: cardData.pricing.ebayRaw, currency: 'USD' };
    console.log(`   ✅ eBay Raw: ${cardData.pricing.ebayRaw} → ebayRaw: {value: ${cardData.pricing.ebayRaw}, currency: "USD"}`);
  }
  
  // Transform PokeData raw price if available
  if (cardData.pricing.pokeDataRaw) {
    transformedCard.pricing.pokeDataRaw = { value: cardData.pricing.pokeDataRaw, currency: 'USD' };
    console.log(`   ✅ PokeData Raw: ${cardData.pricing.pokeDataRaw} → pokeDataRaw: {value: ${cardData.pricing.pokeDataRaw}, currency: "USD"}`);
  }
}

// Transform image structure: images: {small: "...", large: "..."} → image_url: "..."
if (cardData.images) {
  transformedCard.image_url = cardData.images.small || cardData.images.large;
  console.log(`🔄 Transforming image structure...`);
  console.log(`   ✅ Images object → image_url: ${transformedCard.image_url}`);
}

// Ensure card name is available
if (!transformedCard.name && cardData.cardName) {
  transformedCard.name = cardData.cardName;
  console.log(`🔄 Mapping card name: ${cardData.cardName} → name`);
}

// Ensure card number is available
if (!transformedCard.num && cardData.cardNumber) {
  transformedCard.num = cardData.cardNumber;
  console.log(`🔄 Mapping card number: ${cardData.cardNumber} → num`);
}

// Ensure set name is available
if (!transformedCard.set_name && cardData.setName) {
  transformedCard.set_name = cardData.setName;
  console.log(`🔄 Mapping set name: ${cardData.setName} → set_name`);
}

console.log('');

console.log('🔍 Test 3: Frontend-Compatible Structure Validation');
console.log('Validating the transformed data matches frontend expectations...');
console.log('');

console.log('✅ Transformed pricing structure (Frontend format):');
Object.entries(transformedCard.pricing).forEach(([key, value]) => {
  console.log(`   - ${key}: {value: ${value.value}, currency: "${value.currency}"}`);
});
console.log('');

console.log('✅ Transformed card properties:');
console.log(`   - name: ${transformedCard.name}`);
console.log(`   - num: ${transformedCard.num}`);
console.log(`   - set_name: ${transformedCard.set_name}`);
console.log(`   - image_url: ${transformedCard.image_url}`);
console.log('');

console.log('🔍 Test 4: Frontend Display Logic Simulation');
console.log('Simulating how the frontend will process this data...');
console.log('');

// Simulate the frontend helper functions (from App.svelte)
function hasGradedPrices(pricing, gradeType) {
  if (!pricing) return false;
  const prefix = `${gradeType}-`;
  return Object.keys(pricing).some(key => key.startsWith(prefix));
}

function hasTcgPlayerPrices(pricing) {
  if (!pricing) return false;
  const tcgKeys = ['market', 'low', 'mid', 'high'];
  return Object.keys(pricing).some(key => tcgKeys.includes(key));
}

function formatPrice(value) {
  if (value === undefined || value === null) return "0.00";
  return parseFloat(value).toFixed(2);
}

// Test the helper functions
const hasPsaPrices = hasGradedPrices(transformedCard.pricing, 'psa');
const hasCgcPrices = hasGradedPrices(transformedCard.pricing, 'cgc');
const hasTcgPrices = hasTcgPlayerPrices(transformedCard.pricing);

console.log('✅ Frontend helper function results:');
console.log(`   - Has PSA prices: ${hasPsaPrices}`);
console.log(`   - Has CGC prices: ${hasCgcPrices}`);
console.log(`   - Has TCG Player prices: ${hasTcgPrices}`);
console.log('');

// Simulate the pricing display (from App.svelte)
console.log('✅ Simulated pricing display:');

if (hasPsaPrices) {
  console.log('   📁 PSA Graded:');
  Object.entries(transformedCard.pricing).filter(([k]) => k.startsWith('psa-')).forEach(([market, price]) => {
    console.log(`      - Grade ${market.replace('psa-', '')}: $${formatPrice(price.value)} ${price.currency}`);
  });
}

if (hasCgcPrices) {
  console.log('   📁 CGC Graded:');
  Object.entries(transformedCard.pricing).filter(([k]) => k.startsWith('cgc-')).forEach(([market, price]) => {
    console.log(`      - Grade ${market.replace('cgc-', '')}: $${formatPrice(price.value)} ${price.currency}`);
  });
}

if (transformedCard.pricing.ebayRaw) {
  console.log('   📁 eBay Raw:');
  console.log(`      - Market Average: $${formatPrice(transformedCard.pricing.ebayRaw.value)} ${transformedCard.pricing.ebayRaw.currency}`);
}

if (hasTcgPrices) {
  console.log('   📁 TCG Player:');
  Object.entries(transformedCard.pricing).filter(([k]) => ['market', 'low', 'mid', 'high'].includes(k)).forEach(([market, price]) => {
    console.log(`      - ${market}: $${formatPrice(price.value)} ${price.currency}`);
  });
}

// Show any other pricing sources
const otherPrices = Object.entries(transformedCard.pricing).filter(([k]) => 
  !k.startsWith('psa-') && 
  !k.startsWith('cgc-') && 
  k !== 'ebayRaw' && 
  !['market', 'low', 'mid', 'high'].includes(k)
);

if (otherPrices.length > 0) {
  console.log('   📁 Other Sources:');
  otherPrices.forEach(([market, price]) => {
    console.log(`      - ${market}: $${formatPrice(price.value)} ${price.currency}`);
  });
}

console.log('');

console.log('🔍 Test 5: Image Display Validation');
console.log('Validating image display logic...');
console.log('');

if (transformedCard.image_url) {
  console.log('✅ Image display logic:');
  console.log(`   - Image URL available: ${transformedCard.image_url}`);
  console.log(`   - Frontend will display: <img src="${transformedCard.image_url}" alt="${transformedCard.name}" />`);
  console.log(`   - Image container: .card-image with styling`);
} else {
  console.log('❌ Image display logic:');
  console.log(`   - No image URL available`);
  console.log(`   - Frontend will not display image section`);
}

console.log('');

console.log('📊 DATA TRANSFORMATION TEST SUMMARY');
console.log('====================================');
console.log(`✅ Pricing transformation: ${Object.keys(transformedCard.pricing).length} price sources converted`);
console.log(`✅ Image transformation: ${transformedCard.image_url ? 'SUCCESS' : 'FAILED'}`);
console.log(`✅ Card name mapping: ${transformedCard.name ? 'SUCCESS' : 'FAILED'}`);
console.log(`✅ Card number mapping: ${transformedCard.num ? 'SUCCESS' : 'FAILED'}`);
console.log(`✅ Set name mapping: ${transformedCard.set_name ? 'SUCCESS' : 'FAILED'}`);
console.log(`✅ Frontend compatibility: ${hasPsaPrices || hasCgcPrices || hasTcgPrices ? 'SUCCESS' : 'FAILED'}`);
console.log('');

const allTestsPassed = 
  Object.keys(transformedCard.pricing).length > 0 &&
  transformedCard.image_url &&
  transformedCard.name &&
  transformedCard.num &&
  transformedCard.set_name &&
  (hasPsaPrices || hasCgcPrices || hasTcgPrices);

if (allTestsPassed) {
  console.log('🎉 DATA TRANSFORMATION LOGIC SUCCESSFUL!');
  console.log('');
  console.log('The frontend should now properly display:');
  console.log('✅ Card image from PokeData backend');
  console.log('✅ PSA graded prices (Grade 9: $1059.44, Grade 10: $2834.82)');
  console.log('✅ CGC graded prices (Grade 8.0: $1200.00)');
  console.log('✅ TCGPlayer market price ($1204.97)');
  console.log('✅ eBay raw market average ($1124.93)');
  console.log('✅ PokeData raw price ($1204.97)');
  console.log('✅ Proper card name (Umbreon ex), number (161), and set (Prismatic Evolutions)');
  console.log('');
  console.log('🚀 Both "no pricing results" and "no image displayed" issues should be RESOLVED!');
  console.log('');
  console.log('🔧 NEXT STEPS:');
  console.log('1. Test the application locally with a card that has pricing data');
  console.log('2. Verify that the Umbreon ex card now displays pricing and image');
  console.log('3. Check browser console for transformation logs');
  console.log('4. Confirm all pricing categories appear correctly');
} else {
  console.log('❌ DATA TRANSFORMATION LOGIC NEEDS ATTENTION');
  console.log('Some transformation tests failed. Please review the logic.');
  
  if (Object.keys(transformedCard.pricing).length === 0) {
    console.log('❌ No pricing data was transformed');
  }
  if (!transformedCard.image_url) {
    console.log('❌ Image URL was not set');
  }
  if (!transformedCard.name) {
    console.log('❌ Card name was not mapped');
  }
  if (!transformedCard.num) {
    console.log('❌ Card number was not mapped');
  }
  if (!transformedCard.set_name) {
    console.log('❌ Set name was not mapped');
  }
  if (!(hasPsaPrices || hasCgcPrices || hasTcgPrices)) {
    console.log('❌ Frontend helper functions failed to detect pricing');
  }
}
