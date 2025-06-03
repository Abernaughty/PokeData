const fs = require('fs');
const path = require('path');

// Load the set data files
const pokemonTcgSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokemon-tcg-sets.json'), 'utf8'));
const pokeDataSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokedata-sets.json'), 'utf8'));

console.log('🔍 Analyzing PTCGO Code vs PokeData Code Mapping');
console.log('=' .repeat(60));
console.log(`Pokemon TCG API: ${pokemonTcgSets.data.length} sets`);
console.log(`PokeData API: ${pokeDataSets.length} sets`);

// Filter English PokeData sets only
const englishPokeDataSets = pokeDataSets.filter(set => set.language === 'ENGLISH');
console.log(`PokeData API (English only): ${englishPokeDataSets.length} sets`);

// Create maps for quick lookup
const pokeDataByCode = {};
englishPokeDataSets.forEach(set => {
    if (set.code) {
        pokeDataByCode[set.code] = set;
    }
});

const tcgByPtcgoCode = {};
pokemonTcgSets.data.forEach(set => {
    if (set.ptcgoCode) {
        tcgByPtcgoCode[set.ptcgoCode] = set;
    }
});

console.log(`\nPokeData sets with codes: ${Object.keys(pokeDataByCode).length}`);
console.log(`Pokemon TCG sets with PTCGO codes: ${Object.keys(tcgByPtcgoCode).length}`);

// Find exact matches
const exactMatches = [];
const tcgWithoutPtcgo = [];
const pokeDataWithoutCode = [];
const unmatchedTcg = [];
const unmatchedPokeData = [];

console.log('\n🎯 Exact PTCGO Code Matches:');
console.log('-'.repeat(40));

for (const tcgSet of pokemonTcgSets.data) {
    if (!tcgSet.ptcgoCode) {
        tcgWithoutPtcgo.push(tcgSet);
        continue;
    }
    
    const matchingPokeDataSet = pokeDataByCode[tcgSet.ptcgoCode];
    if (matchingPokeDataSet) {
        exactMatches.push({
            tcgId: tcgSet.id,
            tcgName: tcgSet.name,
            ptcgoCode: tcgSet.ptcgoCode,
            pokeDataId: matchingPokeDataSet.id,
            pokeDataName: matchingPokeDataSet.name,
            tcgReleaseDate: tcgSet.releaseDate,
            pokeDataReleaseDate: matchingPokeDataSet.release_date
        });
        console.log(`✅ ${tcgSet.ptcgoCode}: ${tcgSet.name} → ${matchingPokeDataSet.name}`);
    } else {
        unmatchedTcg.push(tcgSet);
    }
}

// Find PokeData sets without matches
for (const pokeDataSet of englishPokeDataSets) {
    if (!pokeDataSet.code) {
        pokeDataWithoutCode.push(pokeDataSet);
        continue;
    }
    
    const matchingTcgSet = tcgByPtcgoCode[pokeDataSet.code];
    if (!matchingTcgSet) {
        unmatchedPokeData.push(pokeDataSet);
    }
}

console.log('\n📊 Analysis Results:');
console.log('=' .repeat(40));
console.log(`✅ Exact PTCGO → PokeData matches: ${exactMatches.length}`);
console.log(`❌ TCG sets without PTCGO codes: ${tcgWithoutPtcgo.length}`);
console.log(`❌ TCG sets with unmatched PTCGO codes: ${unmatchedTcg.length}`);
console.log(`❌ PokeData sets without codes: ${pokeDataWithoutCode.length}`);
console.log(`❌ PokeData sets with unmatched codes: ${unmatchedPokeData.length}`);

// Calculate coverage
const tcgSetsWithPtcgo = pokemonTcgSets.data.filter(set => set.ptcgoCode).length;
const coveragePercentage = ((exactMatches.length / tcgSetsWithPtcgo) * 100).toFixed(1);
console.log(`\n📈 Coverage: ${exactMatches.length}/${tcgSetsWithPtcgo} (${coveragePercentage}%) of TCG sets with PTCGO codes have matching PokeData codes`);

// Show some examples of unmatched sets
if (unmatchedTcg.length > 0) {
    console.log('\n❌ TCG sets with unmatched PTCGO codes (first 10):');
    unmatchedTcg.slice(0, 10).forEach(set => {
        console.log(`   ${set.ptcgoCode}: ${set.name} (${set.id})`);
    });
}

if (unmatchedPokeData.length > 0) {
    console.log('\n❌ PokeData sets with unmatched codes (first 10):');
    unmatchedPokeData.slice(0, 10).forEach(set => {
        console.log(`   ${set.code}: ${set.name} (ID: ${set.id})`);
    });
}

if (tcgWithoutPtcgo.length > 0) {
    console.log('\n⚠️  TCG sets without PTCGO codes (first 10):');
    tcgWithoutPtcgo.slice(0, 10).forEach(set => {
        console.log(`   ${set.id}: ${set.name}`);
    });
}

if (pokeDataWithoutCode.length > 0) {
    console.log('\n⚠️  PokeData sets without codes (first 10):');
    pokeDataWithoutCode.slice(0, 10).forEach(set => {
        console.log(`   ID ${set.id}: ${set.name}`);
    });
}

// Check specific recent sets
console.log('\n🎯 Recent Scarlet & Violet Sets Analysis:');
console.log('-'.repeat(40));
const recentSets = ['sv8pt5', 'sv8', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3', 'sv2', 'sv1'];
recentSets.forEach(setId => {
    const tcgSet = pokemonTcgSets.data.find(set => set.id === setId);
    if (tcgSet) {
        const ptcgoCode = tcgSet.ptcgoCode;
        const pokeDataMatch = ptcgoCode ? pokeDataByCode[ptcgoCode] : null;
        
        if (pokeDataMatch) {
            console.log(`✅ ${setId} (${tcgSet.name}) → PTCGO: ${ptcgoCode} → PokeData: ${pokeDataMatch.name}`);
        } else if (ptcgoCode) {
            console.log(`❌ ${setId} (${tcgSet.name}) → PTCGO: ${ptcgoCode} → No PokeData match`);
        } else {
            console.log(`⚠️  ${setId} (${tcgSet.name}) → No PTCGO code`);
        }
    }
});

// Generate summary
console.log('\n📋 Summary:');
console.log('=' .repeat(40));
if (coveragePercentage > 80) {
    console.log('🎉 EXCELLENT: PTCGO codes provide very good coverage for set mapping!');
} else if (coveragePercentage > 60) {
    console.log('👍 GOOD: PTCGO codes provide decent coverage, but may need supplementation.');
} else {
    console.log('⚠️  LIMITED: PTCGO codes provide limited coverage, need alternative strategies.');
}

console.log(`\nRecommendation: ${coveragePercentage > 70 ? 'Use PTCGO codes as primary mapping strategy' : 'Use PTCGO codes as one of multiple mapping strategies'}`);
