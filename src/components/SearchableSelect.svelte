<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  // Props
  export let items = [];
  export let placeholder = 'Search...';
  export let labelField = 'name';
  export let secondaryField = null;
  export let value = null;
  
  // State
  let searchText = '';
  let showDropdown = false;
  let filteredItems = [];
  let highlightedIndex = -1;
  let inputElement;
  let dropdownElement;
  
  const dispatch = createEventDispatcher();
  
  // Update searchText when value changes and user is not typing
  $: if (value) {
    if (!inputElement || !inputElement.matches(':focus')) {
      searchText = getDisplayText(value);
    }
  }
  
  // Update filtered items when items or searchText changes
  $: {
    console.log('Filtering items with searchText:', searchText);
    
    if (items && Array.isArray(items)) {
      // Only filter if there's search text, otherwise show all items
      if (searchText && searchText.trim() !== '' && (!value || searchText !== getDisplayText(value))) {
        const searchLower = searchText.toLowerCase();
        filteredItems = items.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                                 item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        });
      } else {
        filteredItems = [...items];
      }
      
      console.log(`Filtered to ${filteredItems.length} items`);
    } else {
      filteredItems = [];
    }
    
    // Reset highlighted index whenever items change
    highlightedIndex = -1;
  }
  
  function handleFocus() {
    console.log('Input focused');
    showDropdown = true;
  }
  
  function closeDropdown() {
    showDropdown = false;
  }
  
  function handleKeydown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!showDropdown) showDropdown = true;
        highlightedIndex = Math.min(highlightedIndex + 1, filteredItems.length - 1);
        scrollToHighlighted();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!showDropdown) showDropdown = true;
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        scrollToHighlighted();
        break;
      case 'Enter':
        if (showDropdown && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          handleItemSelect(filteredItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        closeDropdown();
        break;
    }
  }
  
  function scrollToHighlighted() {
    if (highlightedIndex >= 0 && dropdownElement) {
      const highlightedEl = dropdownElement.querySelector(`.item-${highlightedIndex}`);
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  function handleItemSelect(item) {
    if (!item) return;
    
    // Update the internal value and search text
    value = item;
    searchText = getDisplayText(item);
    
    // Close dropdown
    closeDropdown();
    
    // Dispatch the select event
    dispatch('select', item);
  }
  
  function getDisplayText(item) {
    if (!item) return '';
    if (secondaryField && item[secondaryField]) {
      return `${item[labelField]} (${item[secondaryField]})`;
    }
    return item[labelField];
  }
  
  function handleInput() {
    // Open dropdown when typing
    showDropdown = true;
    
    // If text changed and user had a selection, clear it
    if (value && searchText !== getDisplayText(value)) {
      console.log('Text changed, clearing selection');
      value = null;
      dispatch('select', null);
    }
  }
  
  // Function to be called from outside to clear selection
  export function clearSelection() {
    console.log('Clearing selection programmatically');
    value = null;
    searchText = '';
    showDropdown = true;
    filteredItems = [...items];
    dispatch('select', null);
    
    // Focus the input
    if (inputElement) {
      inputElement.focus();
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

<div class="searchable-select">
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
    <span class="dropdown-icon">{showDropdown ? '▲' : '▼'}</span>
  </div>
  
  {#if showDropdown}
    <div class="dropdown" bind:this={dropdownElement}>
      {#if filteredItems.length === 0}
        <div class="no-results">No results found</div>
      {:else}
        {#each filteredItems as item, index}
          <div
            class="item item-{index} {highlightedIndex === index ? 'highlighted' : ''}"
            on:click={() => handleItemSelect(item)}
            on:mouseover={() => highlightedIndex = index}
          >
            <span class="label">
              {item[labelField]}
              {#if secondaryField && item[secondaryField]}
                <span class="secondary">({item[secondaryField]})</span>
              {/if}
            </span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .searchable-select {
    position: relative;
    width: 100%;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    padding-right: 2rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .dropdown-icon {
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
    border-radius: 0 0 4px 4px;
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .item {
    padding: 0.5rem;
    cursor: pointer;
    color: #333; /* Added explicit text color */
    border-bottom: 1px solid #f5f5f5;
  }
  
  .item:last-child {
    border-bottom: none;
  }
  
  .item:hover, .highlighted {
    background-color: #f5f5f5;
    color: #3c5aa6; /* Blue color on hover */
  }
  
  .label {
    color: inherit; /* Use the parent element's color */
  }
  
  .secondary {
    color: #666;
    font-size: 0.9rem;
    margin-left: 0.25rem;
  }
  
  .no-results {
    padding: 0.5rem;
    color: #666;
    font-style: italic;
    text-align: center;
  }
</style>