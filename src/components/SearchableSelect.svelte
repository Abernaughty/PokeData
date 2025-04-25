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
  let flattenedItems = []; // Flattened list of all items for keyboard navigation
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
  
  // Check if items are grouped (contains objects with type: 'group')
  $: isGroupedItems = items.some(item => item.type === 'group');
  
  // Flatten grouped items for easier filtering and navigation
  $: {
    if (isGroupedItems) {
      flattenedItems = [];
      items.forEach(group => {
        if (group.type === 'group' && Array.isArray(group.items)) {
          group.items.forEach(item => {
            flattenedItems.push({
              ...item,
              _groupLabel: group.label // Store the group label for reference
            });
          });
        }
      });
    } else {
      flattenedItems = [...items];
    }
  }
  
  // Update filtered items when items or searchText changes
  $: {
    console.log('Filtering items with searchText:', searchText);
    
    if (searchText && searchText.trim() !== '' && (!value || searchText !== getDisplayText(value))) {
      const searchLower = searchText.toLowerCase();
      
      if (isGroupedItems) {
        // Filter the flattened items first
        const filteredFlat = flattenedItems.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                               item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        });
        
        // Group the filtered items back into their expansions
        const groupedFiltered = {};
        filteredFlat.forEach(item => {
          const groupLabel = item._groupLabel || 'Other';
          if (!groupedFiltered[groupLabel]) {
            groupedFiltered[groupLabel] = [];
          }
          groupedFiltered[groupLabel].push(item);
        });
        
        // Convert back to the group format
        filteredItems = Object.keys(groupedFiltered).map(label => ({
          type: 'group',
          label,
          items: groupedFiltered[label]
        }));
      } else {
        // Regular filtering for non-grouped items
        filteredItems = items.filter(item => {
          if (!item || !item[labelField]) return false;
          
          const primaryMatch = item[labelField].toLowerCase().includes(searchLower);
          const secondaryMatch = secondaryField && item[secondaryField] && 
                               item[secondaryField].toLowerCase().includes(searchLower);
          return primaryMatch || secondaryMatch;
        });
      }
    } else {
      // No search text, show all items
      filteredItems = [...items];
    }
    
    console.log(`Filtered to ${isGroupedItems ? 
      filteredItems.reduce((count, group) => count + (group.items?.length || 0), 0) : 
      filteredItems.length} items`);
    
    // Reset highlighted index whenever items change
    highlightedIndex = -1;
  }
  
  // Get all selectable items in a flat array for keyboard navigation
  $: allSelectableItems = isGroupedItems ? 
    filteredItems.flatMap(group => group.items || []) : 
    filteredItems;
  
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
        highlightedIndex = Math.min(highlightedIndex + 1, allSelectableItems.length - 1);
        scrollToHighlighted();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!showDropdown) showDropdown = true;
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        scrollToHighlighted();
        break;
      case 'Enter':
        if (showDropdown && highlightedIndex >= 0 && highlightedIndex < allSelectableItems.length) {
          handleItemSelect(allSelectableItems[highlightedIndex]);
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
      {#if isGroupedItems}
        {#if filteredItems.length === 0}
          <div class="no-results">No results found</div>
        {:else}
          {#each filteredItems as group, groupIndex}
            {#if group.type === 'group' && group.items && group.items.length > 0}
              <div class="group-header">{group.label}</div>
              {#each group.items as item, itemIndex}
                <!-- Calculate the global index for this item -->
                <div
                  class="item item-{allSelectableItems.indexOf(item)} indented {highlightedIndex === allSelectableItems.indexOf(item) ? 'highlighted' : ''}"
                  on:click={() => handleItemSelect(item)}
                  on:mouseover={() => highlightedIndex = allSelectableItems.indexOf(item)}
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
          {/each}
        {/if}
      {:else}
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
    max-height: 400px; /* Increased max-height */
    overflow-y: auto;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 0 0 4px 4px;
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .group-header {
    padding: 0.5rem;
    font-weight: bold;
    background-color: #f0f0f0;
    color: #3c5aa6; /* Pokemon blue */
    border-bottom: 1px solid #ddd;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  .item {
    padding: 0.5rem;
    cursor: pointer;
    color: #333; /* Added explicit text color */
    border-bottom: 1px solid #f5f5f5;
  }
  
  .indented {
    padding-left: 1.5rem;
    position: relative;
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
