import { writable, derived } from 'svelte/store';
import { pokeDataService } from '../services/pokeDataService';
import { selectedSet } from './setStore';
import { error } from './uiStore';

// Create stores for state
export const cardsInSet = writable([]);
export const selectedCard = writable(null);
export const isLoadingCards = writable(false);

// Derived store
export const cardName = derived(
    selectedCard,
    $selectedCard => $selectedCard ? $selectedCard.name : ''
);

// Actions
export function selectCard(card) {
    console.log('Card selection changed:', card);
    selectedCard.set(card);
    error.set(null); // Clear any errors when a new card is selected
}

export async function loadCardsForSet(set) {
    if (!set) return;
    if (!set.id) {
        console.error('Set ID is required but not available:', set);
        error.set("Selected set is missing required data.");
        return;
    }
    
    try {
        // Reset card-related state
        selectedCard.set(null);
        cardsInSet.set([]);
        
        // Show loading state
        isLoadingCards.set(true);
        error.set(null);
        
        console.log(`Loading cards for set ${set.name} (code: ${set.code}, id: ${set.id})...`);
        
        // Get cards for the selected set using the pokeDataService
        let cards = await pokeDataService.getCardsForSet(set.code, set.id);
        
        console.log(`Received ${cards ? cards.length : 0} cards from API/cache`);
        
        if (!cards || cards.length === 0) {
            console.log('No cards returned for this set');
            error.set(`No cards found for set "${set.name}". Please try another set or check your connection.`);
            return;
        }
        
        // Check if cards have the expected properties
        const sampleCard = cards[0];
        console.log('Sample card structure:', sampleCard);
        
        // Transform the cards into a format suitable for the SearchableSelect component
        const transformedCards = cards.map(card => ({
            id: card.id || `fallback-${card.num || Math.random()}`,
            name: card.name || 'Unknown Card',
            num: card.num || '',
            rarity: card.rarity || '',
            variant: card.variant || '',
            image_url: card.image_url || ''
        }));
        
        cardsInSet.set(transformedCards);
        console.log(`Transformed ${transformedCards.length} cards for display`);
        
        // Check if any cards lack name property
        const invalidCards = cards.filter(card => !card.name);
        if (invalidCards.length > 0) {
            console.warn(`Found ${invalidCards.length} cards without names!`);
            console.warn('Sample invalid card:', invalidCards[0]);
        }
    } catch (err) {
        console.error('Error loading cards for set:', err);
        error.set(`Failed to load cards: ${err.message}`);
        cardsInSet.set([]); // Reset to empty array in case of error
    } finally {
        isLoadingCards.set(false);
    }
}

// Handle set selection changes
selectedSet.subscribe(set => {
    if (!set) {
        // User cleared the selection - this is valid, just clear card-related state
        console.log('Set selection cleared, resetting card state');
        selectedCard.set(null);
        cardsInSet.set([]);
    } else if (set.id) {
        // Valid set with ID - load cards
        loadCardsForSet(set);
    } else {
        // Set selected but missing ID - show error
        console.error('Selected set does not have an ID property:', set);
        error.set('Invalid set data. Please select a different set.');
    }
});
