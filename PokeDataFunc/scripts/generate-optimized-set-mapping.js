const fs = require('fs');
const path = require('path');

// Load the set data files
const pokemonTcgSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokemon-tcg-sets.json'), 'utf8'));
const pokeDataSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokedata-sets.json'), 'utf8'));

console.log('🔍 Optimized Set Mapping Generation');
console.log('=' .repeat(50));
console.log(`Pokemon TCG API: ${pokemonTcgSets.data.length} sets`);
console.log(`PokeData API: ${pokeDataSets.length} sets`);

// Filter English PokeData sets only
const englishPokeDataSets = pokeDataSets.filter(set => set.language === 'ENGLISH');
console.log(`PokeData API (English only): ${englishPokeDataSets.length} sets`);

// Create mapping
const mapping = {};
const unmappedTcg = [];
const unmappedPokeData = [];

// Helper functions
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

function dateDiffInDays(date1, date2) {
    if (!date1 || !date2) return Infinity;
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

console.log('\n🎯 Strategy 1: PTCGO Code Matching');
console.log('-'.repeat(40));

// Strategy 1: PTCGO Code matching (only works for newest sets)
for (const tcgSet of pokemonTcgSets.data) {
    if (!tcgSet.ptcgoCode) continue;
    
    const pokeDataMatch = englishPokeDataSets.find(set => 
        set.code === tcgSet.ptcgoCode
    );
    
    if (pokeDataMatch) {
        mapping[tcgSet.id] = {
            pokeDataCode: pokeDataMatch.code,
            pokeDataId: pokeDataMatch.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataMatch.name,
            matchType: 'ptcgo_code'
        };
        console.log(`✅ ${tcgSet.id} (${tcgSet.name}) → ${pokeDataMatch.code} (${pokeDataMatch.name})`);
    }
}

console.log('\n🎯 Strategy 2: Exact Name Matching');
console.log('-'.repeat(40));

// Strategy 2: Exact name matching
for (const tcgSet of pokemonTcgSets.data) {
    if (mapping[tcgSet.id]) continue; // Already mapped
    
    const pokeDataMatch = englishPokeDataSets.find(set => 
        normalizeName(set.name) === normalizeName(tcgSet.name)
    );
    
    if (pokeDataMatch) {
        mapping[tcgSet.id] = {
            pokeDataCode: pokeDataMatch.code,
            pokeDataId: pokeDataMatch.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataMatch.name,
            matchType: 'exact_name'
        };
        console.log(`✅ ${tcgSet.id} (${tcgSet.name}) → ${pokeDataMatch.code || 'null'} (${pokeDataMatch.name})`);
    }
}

console.log('\n🎯 Strategy 3: Name + Date Similarity');
console.log('-'.repeat(40));

// Strategy 3: Name similarity with date proximity
for (const tcgSet of pokemonTcgSets.data) {
    if (mapping[tcgSet.id]) continue; // Already mapped
    
    const tcgDate = normalizeDate(tcgSet.releaseDate);
    const tcgNameNorm = normalizeName(tcgSet.name);
    
    if (!tcgDate) continue;
    
    // Find sets with similar names
    const candidates = englishPokeDataSets.filter(set => {
        const pokeDataNameNorm = normalizeName(set.name);
        
        // Check for partial name matches or common words
        return tcgNameNorm.includes(pokeDataNameNorm) || 
               pokeDataNameNorm.includes(tcgNameNorm) ||
               tcgNameNorm.split(' ').filter(word => 
                   word.length > 2 && pokeDataNameNorm.includes(word)
               ).length >= 2;
    });
    
    if (candidates.length > 0) {
        // Find the candidate with the closest release date
        let bestMatch = null;
        let bestDateDiff = Infinity;
        
        for (const candidate of candidates) {
            const pokeDataDate = normalizeDate(candidate.release_date);
            if (pokeDataDate) {
                const dateDiff = dateDiffInDays(tcgDate, pokeDataDate);
                if (dateDiff < bestDateDiff && dateDiff <= 90) { // Within 90 days
                    bestDateDiff = dateDiff;
                    bestMatch = candidate;
                }
            }
        }
        
        if (bestMatch) {
            mapping[tcgSet.id] = {
                pokeDataCode: bestMatch.code,
                pokeDataId: bestMatch.id,
                tcgName: tcgSet.name,
                pokeDataName: bestMatch.name,
                matchType: 'name_date_similarity',
                dateDiff: bestDateDiff
            };
            console.log(`✅ ${tcgSet.id} (${tcgSet.name}) → ${bestMatch.code || 'null'} (${bestMatch.name}) [${bestDateDiff} days diff]`);
        }
    }
}

console.log('\n🎯 Strategy 4: Cleaned Name Matching');
console.log('-'.repeat(40));

// Strategy 4: Cleaned name matching (remove common prefixes/suffixes)
for (const tcgSet of pokemonTcgSets.data) {
    if (mapping[tcgSet.id]) continue; // Already mapped
    
    const cleanTcgName = normalizeName(tcgSet.name)
        .replace(/^(ex\s+|xy\s+|sm\s+|swsh\s+|sv\s+)/i, '')
        .replace(/\s+(base|set)$/i, '');
    
    const pokeDataMatch = englishPokeDataSets.find(set => {
        const cleanPokeDataName = normalizeName(set.name)
            .replace(/^(ex\s+|xy\s+|sm\s+|swsh\s+|sv\s+)/i, '')
            .replace(/\s+(base|set)$/i, '');
        
        return cleanPokeDataName === cleanTcgName;
    });
    
    if (pokeDataMatch) {
        mapping[tcgSet.id] = {
            pokeDataCode: pokeDataMatch.code,
            pokeDataId: pokeDataMatch.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataMatch.name,
            matchType: 'cleaned_name'
        };
        console.log(`✅ ${tcgSet.id} (${tcgSet.name}) → ${pokeDataMatch.code || 'null'} (${pokeDataMatch.name})`);
    }
}

// Find unmapped sets
for (const tcgSet of pokemonTcgSets.data) {
    if (!mapping[tcgSet.id]) {
        unmappedTcg.push({
            id: tcgSet.id,
            name: tcgSet.name,
            ptcgoCode: tcgSet.ptcgoCode,
            releaseDate: tcgSet.releaseDate
        });
    }
}

for (const pokeDataSet of englishPokeDataSets) {
    const isMapped = Object.values(mapping).some(m => m.pokeDataId === pokeDataSet.id);
    if (!isMapped) {
        unmappedPokeData.push({
            id: pokeDataSet.id,
            code: pokeDataSet.code,
            name: pokeDataSet.name,
            releaseDate: pokeDataSet.release_date
        });
    }
}

// Generate the final mapping file
const mappingResult = {
    metadata: {
        generated: new Date().toISOString(),
        totalMappings: Object.keys(mapping).length,
        unmappedTcg: unmappedTcg.length,
        unmappedPokeData: unmappedPokeData.length,
        mappingStrategies: {
            ptcgo_code: Object.values(mapping).filter(m => m.matchType === 'ptcgo_code').length,
            exact_name: Object.values(mapping).filter(m => m.matchType === 'exact_name').length,
            name_date_similarity: Object.values(mapping).filter(m => m.matchType === 'name_date_similarity').length,
            cleaned_name: Object.values(mapping).filter(m => m.matchType === 'cleaned_name').length
        },
        notes: [
            "Most PokeData sets have null codes, so we map by ID instead",
            "PTCGO codes only work for newest sets (TWM, SSP, PRE, JTG)",
            "Name matching is the primary strategy for older sets"
        ]
    },
    mappings: mapping,
    unmapped: {
        pokemonTcg: unmappedTcg,
        pokeData: unmappedPokeData
    }
};

// Write the mapping file
const outputPath = path.join(__dirname, '../data/set-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(mappingResult, null, 2));

console.log('\n📊 Final Results:');
console.log('=' .repeat(40));
console.log(`✅ Successfully mapped: ${Object.keys(mapping).length} sets`);
console.log(`❌ Unmapped Pokemon TCG sets: ${unmappedTcg.length}`);
console.log(`❌ Unmapped PokeData sets: ${unmappedPokeData.length}`);

console.log('\n📈 Mapping Strategy Breakdown:');
Object.entries(mappingResult.metadata.mappingStrategies).forEach(([strategy, count]) => {
    console.log(`   ${strategy}: ${count} sets`);
});

// Check critical recent sets
const criticalSets = ['sv8pt5', 'sv8', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3', 'sv2', 'sv1'];
console.log('\n🎯 Critical Set Verification:');
console.log('-'.repeat(40));
criticalSets.forEach(setId => {
    if (mapping[setId]) {
        const m = mapping[setId];
        console.log(`✅ ${setId} → ${m.pokeDataCode || 'null'} (ID: ${m.pokeDataId}) [${m.matchType}]`);
    } else {
        console.log(`❌ ${setId} → NOT MAPPED`);
    }
});

console.log(`\n💾 Mapping saved to: ${outputPath}`);
console.log('\n💡 Key Insight: PTCGO codes work perfectly when available, but most PokeData sets lack codes.');
console.log('   We use PokeData numeric IDs as the primary identifier instead.');
