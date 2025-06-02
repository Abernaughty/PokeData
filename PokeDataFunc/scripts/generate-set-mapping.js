const fs = require('fs');
const path = require('path');

// Load the set data files
const pokemonTcgSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokemon-tcg-sets.json'), 'utf8'));
const pokeDataSets = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokedata-sets.json'), 'utf8'));

console.log('🔍 Analyzing set data...');
console.log(`Pokemon TCG API: ${pokemonTcgSets.data.length} sets`);
console.log(`PokeData API: ${pokeDataSets.length} sets`);

// Create mapping based on name matching and manual overrides
const mapping = {};
const unmappedTcg = [];
const unmappedPokeData = [];

// Manual mappings for known mismatches
const manualMappings = {
    // Prismatic Evolutions
    'sv8pt5': 'PRE',
    // Add more manual mappings as needed
    'sv8': 'SSP', // Surging Sparks
    'sv7': 'SCR', // Stellar Crown  
    'sv6pt5': 'SFA', // Shrouded Fable
    'sv6': 'TWM', // Twilight Masquerade
    'sv5': 'TEF', // Temporal Forces
    'sv4pt5': 'PAF', // Paldean Fates
    'sv4': 'PAR', // Paradox Rift
    'sv3pt5': 'MEW', // 151
    'sv3': 'OBF', // Obsidian Flames
    'sv2': 'PAL', // Paldea Evolved
    'sv1': 'SVI', // Scarlet & Violet
};

// Apply manual mappings first
for (const [tcgId, pokeDataCode] of Object.entries(manualMappings)) {
    const tcgSet = pokemonTcgSets.data.find(set => set.id === tcgId);
    const pokeDataSet = pokeDataSets.find(set => set.code === pokeDataCode);
    
    if (tcgSet && pokeDataSet) {
        mapping[tcgId] = {
            pokeDataCode: pokeDataCode,
            pokeDataId: pokeDataSet.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataSet.name,
            matchType: 'manual'
        };
        console.log(`✅ Manual: ${tcgId} (${tcgSet.name}) → ${pokeDataCode} (${pokeDataSet.name})`);
    }
}

// Try to match remaining sets by name similarity
for (const tcgSet of pokemonTcgSets.data) {
    if (mapping[tcgSet.id]) continue; // Already mapped manually
    
    // Try exact name match first
    let pokeDataMatch = pokeDataSets.find(set => 
        set.name.toLowerCase() === tcgSet.name.toLowerCase() && 
        set.language === 'ENGLISH'
    );
    
    // Try PTCGO code match
    if (!pokeDataMatch && tcgSet.ptcgoCode) {
        pokeDataMatch = pokeDataSets.find(set => 
            set.code === tcgSet.ptcgoCode && 
            set.language === 'ENGLISH'
        );
    }
    
    // Try partial name match (remove common suffixes/prefixes)
    if (!pokeDataMatch) {
        const cleanTcgName = tcgSet.name
            .replace(/\s+(Base|Set)$/i, '')
            .replace(/^(EX\s+|XY\s+|SM\s+|SWSH\s+|SV\s+)/i, '')
            .toLowerCase();
            
        pokeDataMatch = pokeDataSets.find(set => {
            const cleanPokeDataName = set.name
                .replace(/\s+(Base|Set)$/i, '')
                .replace(/^(EX\s+|XY\s+|SM\s+|SWSH\s+|SV\s+)/i, '')
                .toLowerCase();
            return cleanPokeDataName === cleanTcgName && set.language === 'ENGLISH';
        });
    }
    
    if (pokeDataMatch) {
        mapping[tcgSet.id] = {
            pokeDataCode: pokeDataMatch.code,
            pokeDataId: pokeDataMatch.id,
            tcgName: tcgSet.name,
            pokeDataName: pokeDataMatch.name,
            matchType: 'automatic'
        };
        console.log(`🔄 Auto: ${tcgSet.id} (${tcgSet.name}) → ${pokeDataMatch.code} (${pokeDataMatch.name})`);
    } else {
        unmappedTcg.push({
            id: tcgSet.id,
            name: tcgSet.name,
            ptcgoCode: tcgSet.ptcgoCode
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
            name: pokeDataSet.name
        });
    }
}

// Generate the final mapping file
const mappingResult = {
    metadata: {
        generated: new Date().toISOString(),
        totalMappings: Object.keys(mapping).length,
        unmappedTcg: unmappedTcg.length,
        unmappedPokeData: unmappedPokeData.length
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

if (unmappedTcg.length > 0) {
    console.log('\n🔍 Unmapped Pokemon TCG sets (first 10):');
    unmappedTcg.slice(0, 10).forEach(set => {
        console.log(`  - ${set.id}: ${set.name} (PTCGO: ${set.ptcgoCode || 'N/A'})`);
    });
}

if (unmappedPokeData.length > 0) {
    console.log('\n🔍 Unmapped PokeData sets (first 10):');
    unmappedPokeData.slice(0, 10).forEach(set => {
        console.log(`  - ${set.code || 'N/A'}: ${set.name} (ID: ${set.id})`);
    });
}

console.log(`\n💾 Mapping saved to: ${outputPath}`);
