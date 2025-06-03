const fs = require('fs');
const path = require('path');

// Load the set data files
const pokemonTcgSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokemon-tcg-sets.json'), 'utf8'));
const pokeDataSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokedata-sets.json'), 'utf8'));

console.log('🔍 Analyzing set data...');
console.log(`Pokemon TCG API: ${pokemonTcgSets.data.length} sets`);
console.log(`PokeData API: ${pokeDataSets.length} sets`);

// Create mapping based on improved logic
const mapping = {};
const unmappedTcg = [];
const unmappedPokeData = [];

// Helper function to normalize dates for comparison
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

// Helper function to calculate date difference in days
function dateDiffInDays(date1, date2) {
    if (!date1 || !date2) return Infinity;
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to normalize set names for comparison
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
}

// Manual mappings for known cases where automatic matching fails
const manualMappings = {
    // Recent sets with confirmed mappings
    'sv8pt5': 'PRE',  // Prismatic Evolutions
    'sv8': 'SSP',     // Surging Sparks  
    'sv7': 'SCR',     // Stellar Crown (no code in PokeData, but ID 549)
    'sv6pt5': 'SFA',  // Shrouded Fable (no code in PokeData, but ID 548)
    'sv6': 'TWM',     // Twilight Masquerade
    'sv5': 'TEF',     // Temporal Forces (no code in PokeData, but ID 542)
    'sv4pt5': 'PAF',  // Paldean Fates (no code in PokeData, but ID 539)
    'sv4': 'PAR',     // Paradox Rift (no code in PokeData, but ID 536)
    'sv3pt5': 'MEW',  // 151 (no code in PokeData, but ID 532)
    'sv3': 'OBF',     // Obsidian Flames (no code in PokeData, but ID 517)
    'sv2': 'PAL',     // Paldea Evolved (no code in PokeData, but ID 513)
    'sv1': 'SVI',     // Scarlet & Violet (no code in PokeData, but ID 510)
    'sv9': 'JTG',     // Journey Together
    
    // Add more manual mappings as needed
};

console.log('\n🔧 Processing manual mappings...');
// Apply manual mappings first
for (const [tcgId, pokeDataCode] of Object.entries(manualMappings)) {
    const tcgSet = pokemonTcgSets.data.find(set => set.id === tcgId);
    const pokeDataSet = pokeDataSets.find(set => 
        set.code === pokeDataCode && set.language === 'ENGLISH'
    );
    
    if (tcgSet && pokeDataSet) {
        mapping[tcgId] = {
            pokeDataCode: pokeDataCode,
            pokeDataId: pokeDataSet.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataSet.name,
            matchType: 'manual'
        };
        console.log(`✅ Manual: ${tcgId} (${tcgSet.name}) → ${pokeDataCode} (${pokeDataSet.name})`);
    } else {
        console.log(`❌ Manual mapping failed: ${tcgId} → ${pokeDataCode}`);
        if (!tcgSet) console.log(`   - TCG set not found: ${tcgId}`);
        if (!pokeDataSet) console.log(`   - PokeData set not found: ${pokeDataCode}`);
    }
}

console.log('\n🤖 Processing automatic mappings...');
// Try to match remaining sets automatically
for (const tcgSet of pokemonTcgSets.data) {
    if (mapping[tcgSet.id]) continue; // Already mapped manually
    
    let pokeDataMatch = null;
    let matchType = 'none';
    
    // Strategy 1: PTCGO Code match (most reliable)
    if (tcgSet.ptcgoCode) {
        pokeDataMatch = pokeDataSets.find(set => 
            set.code === tcgSet.ptcgoCode && set.language === 'ENGLISH'
        );
        if (pokeDataMatch) {
            matchType = 'ptcgo_code';
        }
    }
    
    // Strategy 2: Exact name match
    if (!pokeDataMatch) {
        pokeDataMatch = pokeDataSets.find(set => 
            normalizeName(set.name) === normalizeName(tcgSet.name) && 
            set.language === 'ENGLISH'
        );
        if (pokeDataMatch) {
            matchType = 'exact_name';
        }
    }
    
    // Strategy 3: Name similarity + date proximity
    if (!pokeDataMatch) {
        const tcgDate = normalizeDate(tcgSet.releaseDate);
        const tcgNameNorm = normalizeName(tcgSet.name);
        
        // Find sets with similar names
        const similarSets = pokeDataSets.filter(set => {
            if (set.language !== 'ENGLISH') return false;
            
            const pokeDataNameNorm = normalizeName(set.name);
            
            // Check for partial name matches
            return tcgNameNorm.includes(pokeDataNameNorm) || 
                   pokeDataNameNorm.includes(tcgNameNorm) ||
                   // Check for common words (at least 2 words in common)
                   tcgNameNorm.split(' ').filter(word => 
                       word.length > 2 && pokeDataNameNorm.includes(word)
                   ).length >= 2;
        });
        
        if (similarSets.length > 0 && tcgDate) {
            // Find the set with the closest release date
            let bestMatch = null;
            let bestDateDiff = Infinity;
            
            for (const candidate of similarSets) {
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
                pokeDataMatch = bestMatch;
                matchType = 'name_date_similarity';
            }
        }
    }
    
    // Strategy 4: Fallback name matching with relaxed rules
    if (!pokeDataMatch) {
        const tcgNameNorm = normalizeName(tcgSet.name);
        
        // Remove common prefixes/suffixes for better matching
        const cleanTcgName = tcgNameNorm
            .replace(/^(ex\s+|xy\s+|sm\s+|swsh\s+|sv\s+)/i, '')
            .replace(/\s+(base|set)$/i, '');
            
        pokeDataMatch = pokeDataSets.find(set => {
            if (set.language !== 'ENGLISH') return false;
            
            const cleanPokeDataName = normalizeName(set.name)
                .replace(/^(ex\s+|xy\s+|sm\s+|swsh\s+|sv\s+)/i, '')
                .replace(/\s+(base|set)$/i, '');
                
            return cleanPokeDataName === cleanTcgName;
        });
        
        if (pokeDataMatch) {
            matchType = 'cleaned_name';
        }
    }
    
    if (pokeDataMatch) {
        mapping[tcgSet.id] = {
            pokeDataCode: pokeDataMatch.code,
            pokeDataId: pokeDataMatch.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataMatch.name,
            matchType: matchType
        };
        console.log(`🔄 Auto (${matchType}): ${tcgSet.id} (${tcgSet.name}) → ${pokeDataMatch.code || 'null'} (${pokeDataMatch.name})`);
    } else {
        unmappedTcg.push({
            id: tcgSet.id,
            name: tcgSet.name,
            ptcgoCode: tcgSet.ptcgoCode,
            releaseDate: tcgSet.releaseDate
        });
    }
}

// Find unmapped PokeData sets
for (const pokeDataSet of pokeDataSets) {
    if (pokeDataSet.language !== 'ENGLISH') continue;
    
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
            manual: Object.values(mapping).filter(m => m.matchType === 'manual').length,
            ptcgo_code: Object.values(mapping).filter(m => m.matchType === 'ptcgo_code').length,
            exact_name: Object.values(mapping).filter(m => m.matchType === 'exact_name').length,
            name_date_similarity: Object.values(mapping).filter(m => m.matchType === 'name_date_similarity').length,
            cleaned_name: Object.values(mapping).filter(m => m.matchType === 'cleaned_name').length
        }
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

console.log('\n📊 Mapping Results:');
console.log(`✅ Successfully mapped: ${Object.keys(mapping).length} sets`);
console.log(`❌ Unmapped Pokemon TCG sets: ${unmappedTcg.length}`);
console.log(`❌ Unmapped PokeData sets: ${unmappedPokeData.length}`);

console.log('\n📈 Mapping Strategy Breakdown:');
Object.entries(mappingResult.metadata.mappingStrategies).forEach(([strategy, count]) => {
    console.log(`   ${strategy}: ${count} sets`);
});

if (unmappedTcg.length > 0) {
    console.log('\n🔍 Unmapped Pokemon TCG sets (first 10):');
    unmappedTcg.slice(0, 10).forEach(set => {
        console.log(`  - ${set.id}: ${set.name} (PTCGO: ${set.ptcgoCode || 'N/A'}) [${set.releaseDate}]`);
    });
}

if (unmappedPokeData.length > 0) {
    console.log('\n🔍 Unmapped PokeData sets (first 10):');
    unmappedPokeData.slice(0, 10).forEach(set => {
        console.log(`  - ${set.code || 'N/A'}: ${set.name} (ID: ${set.id}) [${set.releaseDate}]`);
    });
}

// Check for critical mappings
const criticalMappings = ['sv8pt5', 'sv8', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3', 'sv2', 'sv1'];
console.log('\n🎯 Critical Mapping Verification:');
criticalMappings.forEach(setId => {
    if (mapping[setId]) {
        console.log(`✅ ${setId} → ${mapping[setId].pokeDataCode} (${mapping[setId].matchType})`);
    } else {
        console.log(`❌ ${setId} → NOT MAPPED`);
    }
});

console.log(`\n💾 Mapping saved to: ${outputPath}`);
