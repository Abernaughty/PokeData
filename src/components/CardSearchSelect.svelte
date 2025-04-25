<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  // Props
  export let cards = [];  // This will be the list of cards from the selected set
  export let placeholder = 'Search for a card...';
  export let selectedCard = null;  // Two-way binding
  
  // Local state
  let searchText = '';
  let showDropdown = false;
  let filteredCards = [];
  let highlightedIndex = -1;
  let inputElement;
  let dropdownElement;
  
  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Function to generate display text for a card (with number if available)
  function getCardDisplayText(card) {
    if (!card) return '';
    return card.num ? `${card.name} (${card.num})` : card.name;
  }
  
  // Watch for changes to selectedCard and update searchText only when input doesn't have focus
  $: if (selectedCard && selectedCard.name && inputElement && !inputElement.matches(':focus')) {
    searchText = getCardDisplayText(selectedCard);
  }
  
  // Update filtered cards when cards or searchText changes
  $: {
    console.log(`Filtering ${cards.length} cards with search: "${searchText}"`);
    
    if (searchText && searchText.trim() !== '') {
      const search = searchText.toLowerCase().trim();
      
      filteredCards = cards.filter(card => {
        // Skip cards without a name
        if (!card || !card.name) return false;
        
        // Match on name
        const nameMatch = card.name.toLowerCase().includes(search);
        
        // Also match on card number if available
        const numMatch = card.num && card.num.toLowerCase().includes(search);
        
        return nameMatch || numMatch;
      });
      
      // Always show dropdown when searching
      if (inputElement && inputElement.matches(':focus')) {
        showDropdown = true;
      }
    } else {
      // When empty, show all cards (up to a reasonable limit)
      filteredCards = [...cards].slice(0, 100);
    }
    
    // Reset highlight when results change
    highlightedIndex = -1;
    
    console.log(`Filtered to ${filteredCards.length} cards`);
  }
  
  // Handle input changes
  function handleInput() {
    console.log("Input changed:", searchText);
    showDropdown = true;
    
    // If text no longer matches the selected card, clear the selection immediately
    if (selectedCard && searchText !== getCardDisplayText(selectedCard)) {
      console.log("Text doesn't match selected card, clearing selection");
      selectedCard = null;
      dispatch('select', null);
    }
  }
  
  // Handle focus on the input
  function handleFocus() {
    console.log("Input focused");
    showDropdown = true;
  }
  
  // Handle selection of a card
  function handleSelect(card) {
    console.log("Card selected:", card?.name);
    
    if (!card) return;
    
    selectedCard = card;
    searchText = getCardDisplayText(card);
    
    // Close dropdown
    closeDropdown();
    dispatch('select', card);
  }
  
  // Close the dropdown
  function closeDropdown() {
    showDropdown = false;
  }
  
  // Handle keyboard navigation
  function handleKeydown(event) {
    if (!showDropdown) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, filteredCards.length - 1);
        scrollToHighlighted();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        scrollToHighlighted();
        break;
        
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredCards.length) {
          handleSelect(filteredCards[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        closeDropdown();
        break;
        
      case 'Backspace':
        // Special case for backspace - ensure dropdown stays open
        if (searchText.length <= 1) {
          setTimeout(() => {
            showDropdown = true;
          }, 0);
        }
        break;
    }
  }
  
  // Scroll to highlighted item in the dropdown
  function scrollToHighlighted() {
    if (highlightedIndex >= 0 && dropdownElement) {
      const highlightedEl = dropdownElement.querySelector(`.card-item-${highlightedIndex}`);
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  // Function to clear the current selection (to be called from parent)
  export function clearSelection() {
    console.log("Clearing card selection");
    selectedCard = null;
    searchText = '';
    dispatch('select', null);
    
    // Keep dropdown closed after clear unless user focuses the input
    showDropdown = false;
    
    // Optional: focus the input after clearing
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  // Focus the input after clearing and show dropdown
  export function clearAndFocus() {
    clearSelection();
    
    // Focus the input
    if (inputElement) {
      inputElement.focus();
      
      // Ensure dropdown is shown
      setTimeout(() => {
        showDropdown = true;
        
        // Force refilter with empty search
        searchText = '';
        filteredCards = [...cards].slice(0, 100);
      }, 10);
    }
  }
  
  // Handle clicks outside the component to close the dropdown
  function handleOutsideClick(event) {
    if (showDropdown && inputElement && !dropdownElement.contains(event.target) && !inputElement.contains(event.target)) {
      closeDropdown();
    }
  }
  
  // Set up event listeners on mount
  onMount(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  });
</script>

<div class="card-search">
  <div class="input-wrapper">
    <input
      type="text"
      bind:this={inputElement}
      bind:value={searchText}
      on:input={handleInput}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
      placeholder={placeholder}
      autocomplete="off"
    />
    <span class="icon">{showDropdown ? '▲' : '▼'}</span>
  </div>
  
  {#if showDropdown}
    <div class="dropdown" bind:this={dropdownElement}>
      {#if filteredCards.length === 0}
        <div class="no-results">No matching cards found</div>
      {:else}
        {#each filteredCards as card, index}
          <div
            class="card-item card-item-{index} {highlightedIndex === index ? 'highlighted' : ''}"
            on:click={() => handleSelect(card)}
            on:mouseover={() => highlightedIndex = index}
          >
            <div class="card-info">
              <span class="card-name">
                {card.name}
                {#if card.num}
                  <span class="card-num">({card.num})</span>
                {/if}
              </span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .card-search {
    position: relative;
    width: 100%;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    padding-right: 2rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  input:focus {
    outline: none;
    border-color: #3c5aa6;
    box-shadow: 0 0 0 2px rgba(60, 90, 166, 0.2);
  }
  
  .icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 300px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    margin-top: -1px;
  }
  
  .card-item {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.15s ease;
    color: #333;
  }
  
  .card-item:last-child {
    border-bottom: none;
  }
  
  .card-item:hover, .highlighted {
    background-color: #f0f0f0;
    color: #3c5aa6;
  }
  
  .card-info {
    display: flex;
    width: 100%;
  }
  
  .card-name {
    font-weight: 500;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .card-num {
    font-weight: normal;
    color: #666;
    font-size: 0.9rem;
    margin-left: 4px;
  }
  
  .no-results {
    padding: 0.75rem;
    color: #666;
    font-style: italic;
    text-align: center;
  }
</style>