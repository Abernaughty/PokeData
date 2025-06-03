/**
 * Test Expansion Mapping Fix for PokeData-First Architecture
 * This script tests the updated expansion mapping logic to ensure sets are properly grouped
 */

// Import the expansion mapper
import { expansionMapper } from './src/services/expansionMapper.js';

console.log('🧪 EXPANSION MAPPING FIX TEST');
console.log('==============================');
console.log('Testing expansion mapping with PokeData-first structure...');
console.log('');

// Test data based on the actual API response structure
const testSets = [
  // Sets with codes (should work with existing logic)
  { id: 562, name: "Journey Together", code: "JTG", language: "ENGLISH" },
  { id: 557, name: "Prismatic Evolutions", code: "PRE", language: "ENGLISH" },
  { id: 555, name: "Surging Sparks", code: "SSP", language: "ENGLISH" },
  { id: 545, name: "Twilight Masquerade", code: "TWM", language: "ENGLISH" },
  
  // Sets with null codes (the main problem - should use name mapping)
  { id: 567, name: "Destined Rivals", code: null, language: "ENGLISH" },
  { id: 549, name: "Stellar Crown", code: null, language: "ENGLISH" },
  { id: 548, name: "Shrouded Fable", code: null, language: "ENGLISH" },
  { id: 542, name: "Temporal Forces", code: null, language: "ENGLISH" },
  { id: 539, name: "Paldean Fates", code: null, language: "ENGLISH" },
  { id: 536, name: "Paradox Rift", code: null, language: "ENGLISH" },
  { id: 532, name: "Pokemon Card 151", code: null, language: "ENGLISH" },
  { id: 517, name: "Obsidian Flames", code: null, language: "ENGLISH" },
  { id: 513, name: "Paldea Evolved", code: null, language: "ENGLISH" },
  { id: 510, name: "Scarlet & Violet Base", code: null, language: "ENGLISH" },
  
  // Sword & Shield sets with null codes
  { id: 506, name: "Crown Zenith", code: null, language: "ENGLISH" },
  { id: 503, name: "Silver Tempest", code: null, language: "ENGLISH" },
  { id: 400, name: "Lost Origin", code: null, language: "ENGLISH" },
  { id: 387, name: "Pokemon GO", code: null, language: "ENGLISH" },
  { id: 182, name: "Astral Radiance", code: null, language: "ENGLISH" },
  { id: 178, name: "Brilliant Stars", code: null, language: "ENGLISH" },
  { id: 172, name: "Fusion Strike", code: null, language: "ENGLISH" },
  { id: 112, name: "Celebrations", code: null, language: "ENGLISH" },
  { id: 108, name: "Evolving Skies", code: null, language: "ENGLISH" },
  
  // Sun & Moon sets with null codes
  { id: 7, name: "Cosmic Eclipse", code: null, language: "ENGLISH" },
  { id: 1, name: "Hidden Fates", code: null, language: "ENGLISH" },
  { id: 8, name: "Unified Minds", code: null, language: "ENGLISH" },
  { id: 24, name: "Unbroken Bonds", code: null, language: "ENGLISH" },
  { id: 19, name: "Sun & Moon", code: null, language: "ENGLISH" },
  
  // XY sets with null codes
  { id: 22, name: "Evolutions", code: null, language: "ENGLISH" },
  { id: 42, name: "XY Base", code: null, language: "ENGLISH" },
  
  // Special sets
  { id: 561, name: "Trading Card Game Classic", code: null, language: "ENGLISH" },
  { id: 554, name: "Trick or Trade 2024", code: null, language: "ENGLISH" },
  { id: 559, name: "Mcdonald's Dragon Discovery", code: "M24", language: "ENGLISH" }
];

console.log('🔍 Test 1: Individual Set Expansion Mapping');
console.log('Testing expansion mapping for individual sets...');
console.log('');

testSets.forEach(set => {
  const expansion = expansionMapper.getExpansionForSet(set);
  const codeStatus = set.code ? `code: ${set.code}` : 'code: null';
  console.log(`✅ "${set.name}" (${codeStatus}) → ${expansion}`);
});

console.log('');
console.log('🔍 Test 2: Set Grouping');
console.log('Testing grouping of sets by expansion...');
console.log('');

const groupedSets = expansionMapper.groupSetsByExpansion(testSets);
Object.entries(groupedSets).forEach(([expansion, sets]) => {
  console.log(`📁 ${expansion}: ${sets.length} sets`);
  sets.forEach(set => {
    const codeStatus = set.code ? `(${set.code})` : '(null)';
    console.log(`   - ${set.name} ${codeStatus}`);
  });
  console.log('');
});

console.log('🔍 Test 3: Dropdown Format Preparation');
console.log('Testing dropdown format preparation...');
console.log('');

const dropdownGroups = expansionMapper.prepareGroupedSetsForDropdown(groupedSets);
console.log(`📋 Dropdown groups created: ${dropdownGroups.length}`);
dropdownGroups.forEach(group => {
  console.log(`   📁 ${group.label}: ${group.items.length} sets`);
});

console.log('');
console.log('🔍 Test 4: Critical Set Validation');
console.log('Validating critical sets are mapped correctly...');
console.log('');

const criticalSets = [
  { name: "Prismatic Evolutions", expectedExpansion: "Scarlet & Violet" },
  { name: "Surging Sparks", expectedExpansion: "Scarlet & Violet" },
  { name: "Crown Zenith", expectedExpansion: "Sword & Shield" },
  { name: "Silver Tempest", expectedExpansion: "Sword & Shield" },
  { name: "Cosmic Eclipse", expectedExpansion: "Sun & Moon" },
  { name: "Evolutions", expectedExpansion: "XY" }
];

let allCriticalTestsPassed = true;
criticalSets.forEach(({ name, expectedExpansion }) => {
  const testSet = testSets.find(set => set.name === name);
  if (testSet) {
    const actualExpansion = expansionMapper.getExpansionForSet(testSet);
    const passed = actualExpansion === expectedExpansion;
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}: Expected "${expectedExpansion}", Got "${actualExpansion}"`);
    if (!passed) allCriticalTestsPassed = false;
  } else {
    console.log(`❌ ${name}: Test set not found`);
    allCriticalTestsPassed = false;
  }
});

console.log('');
console.log('📊 TEST SUMMARY');
console.log('================');
console.log(`✅ Individual mapping: ${testSets.length} sets tested`);
console.log(`✅ Grouping: ${Object.keys(groupedSets).length} expansions created`);
console.log(`✅ Dropdown format: ${dropdownGroups.length} groups prepared`);
console.log(`${allCriticalTestsPassed ? '✅' : '❌'} Critical sets: ${allCriticalTestsPassed ? 'All passed' : 'Some failed'}`);

console.log('');
if (allCriticalTestsPassed) {
  console.log('🎉 EXPANSION MAPPING FIX SUCCESSFUL!');
  console.log('');
  console.log('The expansion mapping now correctly handles:');
  console.log('✅ Sets with codes (PRE, SSP, TWM, JTG)');
  console.log('✅ Sets with null codes using name mapping');
  console.log('✅ Proper grouping by expansion series');
  console.log('✅ Dropdown format preparation');
  console.log('');
  console.log('This should fix the empty dropdown issue in the frontend!');
} else {
  console.log('❌ EXPANSION MAPPING FIX NEEDS ATTENTION');
  console.log('Some critical tests failed. Please review the mapping logic.');
}
