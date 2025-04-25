/**
 * Expansion Mapper Service
 * Maps set codes to their respective expansions for grouping in the UI
 */

// Define expansion patterns based on set codes
const EXPANSION_PATTERNS = [
  { pattern: /^sv|^JTG|^PRE|^SSP/, expansion: "Scarlet & Violet" },
  { pattern: /^sm|^SMP/, expansion: "Sun & Moon" },
  { pattern: /^xy|^XYP/, expansion: "XY" },
  { pattern: /^bw|^BWP/, expansion: "Black & White" },
  { pattern: /^hs|^HSP/, expansion: "HeartGold & SoulSilver" },
  { pattern: /^dp|^DPP/, expansion: "Diamond & Pearl" },
  { pattern: /^ex/, expansion: "EX" },
  { pattern: /^PL|^SV|^RR|^SF|^LA|^MD/, expansion: "Platinum" },
  { pattern: /^CL|^TM|^UD|^UL/, expansion: "Call of Legends" },
  { pattern: /^N\d/, expansion: "Neo" },
  { pattern: /^G\d/, expansion: "Gym" },
  { pattern: /^BS|^B2|^JU|^FO|^RO/, expansion: "Base Set" },
];

// Special cases for sets that don't follow the pattern
const SPECIAL_CASES = {
  "CRZ": "Sword & Shield",
  "SIT": "Sword & Shield",
  "LOR": "Sword & Shield",
  "ASR": "Sword & Shield",
  "BRS": "Sword & Shield",
  "FST": "Sword & Shield",
  "CEL": "Sword & Shield",
  "EVS": "Sword & Shield",
  "CRE": "Sword & Shield",
  "BST": "Sword & Shield",
  "SHF": "Sword & Shield",
  "VIV": "Sword & Shield",
  "CPA": "Sword & Shield",
  "DAA": "Sword & Shield",
  "RCL": "Sword & Shield",
  "SSH": "Sword & Shield",
  "SWSHP": "Sword & Shield",
  "TWM": "Scarlet & Violet",
  "TEF": "Scarlet & Violet",
  "PAF": "Scarlet & Violet",
  "PAR": "Scarlet & Violet",
  "MEW": "Scarlet & Violet",
  "OBF": "Scarlet & Violet",
  "PAL": "Scarlet & Violet",
  "SVE": "Scarlet & Violet",
  "SVI": "Scarlet & Violet",
  "SVP": "Scarlet & Violet",
};

// Fallback expansion for sets that don't match any pattern
const FALLBACK_EXPANSION = "Other";

/**
 * Determine the expansion for a set based on its code or name
 * @param {Object} set - The set object
 * @returns {string} The expansion name
 */
function getExpansionForSet(set) {
  // If the set doesn't have a code, try to determine from the name
  if (!set.code) {
    // Check if the name contains an expansion name
    for (const { expansion } of EXPANSION_PATTERNS) {
      if (set.name && set.name.includes(expansion)) {
        return expansion;
      }
    }
    return FALLBACK_EXPANSION;
  }

  // Check special cases first
  if (SPECIAL_CASES[set.code]) {
    return SPECIAL_CASES[set.code];
  }

  // Check patterns
  for (const { pattern, expansion } of EXPANSION_PATTERNS) {
    if (pattern.test(set.code)) {
      return expansion;
    }
  }

  // If no match found, use the fallback
  return FALLBACK_EXPANSION;
}

/**
 * Group sets by their expansion
 * @param {Array} sets - Array of set objects
 * @returns {Object} Object with expansion names as keys and arrays of sets as values
 */
function groupSetsByExpansion(sets) {
  const groupedSets = {};

  // First pass: group sets by expansion
  sets.forEach(set => {
    const expansion = getExpansionForSet(set);
    if (!groupedSets[expansion]) {
      groupedSets[expansion] = [];
    }
    groupedSets[expansion].push(set);
  });

  // Second pass: sort sets within each expansion by release date (newest first)
  Object.keys(groupedSets).forEach(expansion => {
    groupedSets[expansion].sort((a, b) => {
      // Compare release dates in descending order (newest first)
      const dateA = new Date(a.release_date || 0);
      const dateB = new Date(b.release_date || 0);
      return dateB - dateA;
    });
  });

  return groupedSets;
}

/**
 * Convert grouped sets to a format suitable for the dropdown
 * @param {Object} groupedSets - Object with expansion names as keys and arrays of sets as values
 * @returns {Array} Array of objects with type, label, and items properties
 */
function prepareGroupedSetsForDropdown(groupedSets) {
  // Sort expansions by priority (newest first)
  const expansionPriority = [
    "Scarlet & Violet",
    "Sword & Shield",
    "Sun & Moon",
    "XY",
    "Black & White",
    "HeartGold & SoulSilver",
    "Call of Legends",
    "Platinum",
    "Diamond & Pearl",
    "EX",
    "Neo",
    "Gym",
    "Base Set",
    "Other"
  ];

  // Create an array of group objects
  const result = [];

  // Add groups in priority order
  expansionPriority.forEach(expansion => {
    if (groupedSets[expansion] && groupedSets[expansion].length > 0) {
      result.push({
        type: 'group',
        label: expansion,
        items: groupedSets[expansion]
      });
    }
  });

  // Add any remaining groups not in the priority list
  Object.keys(groupedSets).forEach(expansion => {
    if (!expansionPriority.includes(expansion) && groupedSets[expansion].length > 0) {
      result.push({
        type: 'group',
        label: expansion,
        items: groupedSets[expansion]
      });
    }
  });

  return result;
}

export const expansionMapper = {
  getExpansionForSet,
  groupSetsByExpansion,
  prepareGroupedSetsForDropdown
};
