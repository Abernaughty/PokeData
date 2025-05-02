import { writable, derived } from 'svelte/store';
import { pokeDataService } from '../services/pokeDataService';
import { expansionMapper } from '../services/expansionMapper';
import { error } from './uiStore';

// Create stores for state
export const availableSets = writable([]);
export const groupedSetsForDropdown = writable([]);
export const selectedSet = writable(null);
export const isLoadingSets = writable(true);

// Actions
export async function loadSets() {
    isLoadingSets.set(true);
    
    try {
        console.log('Loading set list...');
        const sets = await pokeDataService.getSetList();
        console.log(`Loaded ${sets.length} sets`);
        
        // Group sets by expansion
        const groupedSets = expansionMapper.groupSetsByExpansion(sets);
        const formattedGroupedSets = expansionMapper.prepareGroupedSetsForDropdown(groupedSets);
        
        groupedSetsForDropdown.set(formattedGroupedSets);
        console.log(`Grouped sets into ${formattedGroupedSets.length} expansions`);
        
        // Set flat list for other operations
        availableSets.set(sets);

        // Verify all sets have an ID property
        const setsWithoutIds = sets.filter(set => !set.id);
        if (setsWithoutIds.length > 0) {
            console.warn(`Found ${setsWithoutIds.length} sets without IDs`);
            // Add IDs to the sets that don't have them
            let setsCopy = [...sets];
            let maxId = Math.max(...setsCopy.filter(set => set.id).map(set => set.id), 0);
            setsWithoutIds.forEach(set => {
                const index = setsCopy.indexOf(set);
                if (index !== -1) {
                    maxId++;
                    setsCopy[index] = { ...set, id: maxId };
                }
            });
            availableSets.set(setsCopy);
            console.log('Added IDs to sets that were missing them');
        }
    } catch (err) {
        console.error('Error loading set list:', err);
        error.set('Failed to load set list. ' + err.message);
        
        // Fallback to imported data
        console.log('Using fallback set list');
        const { setList } = await import('../data/setList.js');
        availableSets.set(setList);
        
        // Also update grouped sets with fallback data
        const groupedSets = expansionMapper.groupSetsByExpansion(setList);
        groupedSetsForDropdown.set(expansionMapper.prepareGroupedSetsForDropdown(groupedSets));
    } finally {
        isLoadingSets.set(false);
        console.log('Set list loading complete');
    }
}

export function selectSet(set) {
    console.log('Set selection changed:', set);
    selectedSet.set(set);
    
    // Clear error when set changes
    error.set(null);
}
