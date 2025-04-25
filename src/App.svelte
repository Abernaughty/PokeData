<script>
  import { onMount } from 'svelte';
  import { API_CONFIG } from './data/apiConfig';
  import { pokeDataService } from './services/pokeDataService';
  import { dbService } from './services/storage/db';
  import SearchableSelect from './components/SearchableSelect.svelte';
  import CardSearchSelect from './components/CardSearchSelect.svelte';
  import CardVariantSelector from './components/CardVariantSelector.svelte';
  
  // Reference to CardSearchSelect component
  let cardSearchComponent;
  
  let selectedSet = null;
  let cardName = '';
  let priceData = null;
  let isLoading = false;
  let error = null;
  let availableSets = [];
  
  // New state variables for cards
  let cardsInSet = [];
  let isLoadingCards = false;
  let selectedCard = null;
  
  // Variables for handling card variants
  let cardVariants = [];
  let showVariantSelector = false;
  let selectedVariant = null;
  
  // Format price to always show 2 decimal places
  function formatPrice(value) {
    if (value === undefined || value === null) return "0.00";
    return parseFloat(value).toFixed(2);
  }

  // Handle set selection
  async function handleSetSelect(event) {
    selectedSet = event.detail;
    console.log('Selected set:', selectedSet);
    // Verify we have the set ID before loading cards
    if (selectedSet && selectedSet.id) {
      loadCardsForSet(selectedSet);
    } else {
      console.error('Selected set does not have an ID property:', selectedSet);
      error = 'Invalid set data. Please select a different set.';
    }
  }
  
  // Load cards for a selected set
  async function loadCardsForSet(set) {
    if (!set) return;
    if (!set.id) {
      console.error('Set ID is required but not available:', set);
      error = "Selected set is missing required data.";
      return;
    }
    
    try {
      // Clear all card-related state first
      priceData = null;
      selectedCard = null;
      cardName = '';
      cardsInSet = [];
      
      // Show loading state
      isLoadingCards = true;
      error = null;
      
      console.log(`Loading cards for set ${set.name} (code: ${set.code}, id: ${set.id})...`);
      
      // Get cards for the selected set using the pokeDataService
      let cards = await pokeDataService.getCardsForSet(set.code, set.id);
      
      // If no cards returned, try to use fallback data for certain sets
      if (!cards || cards.length === 0) {
        console.log(`No cards returned from API for set ${set.code}, trying fallback data`);
        
        // Use fallback data for Prismatic Evolutions set
        if (set.code === 'PRE') {
          console.log('Using fallback data for Prismatic Evolutions');
          cards = prismaticEvolutionsCards;
        } else {
          // Generate some dummy cards for other sets
          console.log(`Generating dummy cards for set ${set.code}`);
          cards = Array.from({ length: 20 }, (_, i) => ({
            id: `dummy-${set.code}-${i+1}`,
            name: `${set.name} Card ${i+1}`,
            num: `${i+1}/${100}`,
            set_code: set.code,
            set_name: set.name
          }));
        }
      }
      
      console.log(`Received ${cards ? cards.length : 0} cards from API/cache`);
      
      if (!cards || cards.length === 0) {
        console.log('No cards returned for this set');
        isLoadingCards = false;
        return;
      }
      
      // Check if cards have the expected properties
      const sampleCard = cards[0];
      console.log('Sample card structure:', sampleCard);
      
      console.log(`Received ${cards.length} cards for set ${set.name}`);
      
      // Transform the cards into a format suitable for the SearchableSelect component
      cardsInSet = cards.map(card => ({
        id: card.id || `fallback-${card.num || Math.random()}`,
        name: card.name || 'Unknown Card',
        num: card.num || '',
        rarity: card.rarity || '',
        variant: card.variant || '',
        image_url: card.image_url || ''
      }));
      
      console.log(`Transformed ${cardsInSet.length} cards for display`);
      
      // Check if any cards lack name property
      const invalidCards = cards.filter(card => !card.name);
      if (invalidCards.length > 0) {
        console.warn(`Found ${invalidCards.length} cards without names!`);
        console.warn('Sample invalid card:', invalidCards[0]);
      }
      
      isLoadingCards = false;
      
      isLoadingCards = false;
    } catch (err) {
      console.error('Error loading cards for set:', err);
      isLoadingCards = false;
      cardsInSet = []; // Reset to empty array in case of error
    }
  }
  
  // Function to handle card selection changes
  function handleCardSelect(event) {
    console.log('Card selection event:', event.detail);
    
    // Clear price data first to prevent reference errors
    priceData = null;
    
    // Update the selected card state
    selectedCard = event.detail;
    cardName = selectedCard ? selectedCard.name : '';
    
    // Clear any previous error
    error = null;
    
    // Validate the selection
    if (selectedCard && !selectedCard.id) {
      console.error('Selected card does not have an ID property:', selectedCard);
      error = 'Invalid card data. Please select a different card.';
    }
  }
  
  // Functions for handling variant selection
  function handleVariantSelect(event) {
    selectedVariant = event.detail;
  }
  
  function handleVariantConfirm(event) {
    selectedVariant = event.detail;
    loadPricingForVariant(selectedVariant);
  }
  
  function closeVariantSelector() {
    showVariantSelector = false;
  }
  
  // Get the selected card ID
  function getSelectedCardId() {
    return selectedCard ? selectedCard.id : null;
  }
  
  // Function to filter out zero or null price values with safety
  function filterValidPrices(pricing) {
    // Safety check for null/undefined input
    if (!pricing || typeof pricing !== 'object') return {};
    
    // Create a new object with only valid price entries
    const filteredPricing = {};
    
    try {
      Object.entries(pricing).forEach(([market, priceInfo]) => {
        // Skip null values entirely
        if (priceInfo === null || priceInfo === undefined) return;
        
        // Handle different pricing formats
        if (typeof priceInfo === 'object' && 
            priceInfo.value !== undefined && 
            priceInfo.value !== null && 
            parseFloat(priceInfo.value) > 0) {
          // Object format with value property
          filteredPricing[market] = priceInfo;
        } else if (typeof priceInfo === 'number' && priceInfo > 0) {
          // Direct number format
          filteredPricing[market] = { value: priceInfo, currency: 'USD' };
        } else if (typeof priceInfo === 'string' && parseFloat(priceInfo) > 0) {
          // String that can be parsed as a number
          filteredPricing[market] = { value: parseFloat(priceInfo), currency: 'USD' };
        }
      });
    } catch (err) {
      console.error('Error filtering prices:', err);
      return {}; // Return empty object on error
    }
    
    return filteredPricing;
  }
  
  // Load pricing data for a specific variant
  async function loadPricingForVariant(variant) {
    try {
      if (!variant || !variant.id) {
        throw new Error('Invalid card variant');
      }
      
      isLoading = true;
      error = null;
      
      // Get pricing data for the selected variant
      const rawPriceData = await pokeDataService.getCardPricing(variant.id);
      
      // Filter out zero or null price values
      if (rawPriceData && rawPriceData.pricing) {
        rawPriceData.pricing = filterValidPrices(rawPriceData.pricing);
      }
      
      priceData = rawPriceData;
      isLoading = false;
    } catch (err) {
      console.error('Error loading pricing for variant:', err);
      error = err.message;
      isLoading = false;
      
      // For development: Use mock data if API fails
      try {
        console.log('Attempting to load mock data for variant...');
        const mockData = await pokeDataService.loadMockData(selectedSet.name, cardName);
        
        // Filter the mock data too
        if (mockData && mockData.pricing) {
          mockData.pricing = filterValidPrices(mockData.pricing);
        }
        
        if (variant) {
          // Update mock data to match the selected variant
          mockData.name = variant.name;
          mockData.num = variant.num;
          if (variant.rarity) {
            mockData.rarity = variant.rarity;
          }
        }
        
        priceData = mockData;
        error = "Using mock data (API unavailable). This is for demonstration purposes only.";
      } catch (mockErr) {
        console.error('Failed to load mock data:', mockErr);
      }
    }
  }

  async function fetchCardPrice() {
    if (!selectedSet) {
      error = "Please select a set";
      return;
    }
    
    if (!selectedCard) {
      error = "Please select a card";
      return;
    }
    
    isLoading = true;
    error = null;
    
    try {
      // Get the card ID from the selected card
      const cardId = getSelectedCardId();
      if (!cardId) {
        throw new Error('Invalid card selection - missing ID');
      }
      
      console.log(`Fetching price data for card ID: ${cardId}`);
      
      // Load pricing data directly using the card ID
      const rawPriceData = await pokeDataService.getCardPricing(cardId);
      
      console.log('Received price data:', rawPriceData);
      
      // Filter out zero or null price values
      if (rawPriceData && rawPriceData.pricing) {
        rawPriceData.pricing = filterValidPrices(rawPriceData.pricing);
        console.log('Filtered pricing data:', rawPriceData.pricing);
      } else {
        console.warn('No pricing data found in the response:', rawPriceData);
      }
      
      priceData = rawPriceData;
      
    } catch (err) {
      console.error('API Error:', err);
      error = err.message;
      
      // For development: Use mock data if API fails
      try {
        console.log('Attempting to load mock data...');
        const mockData = await pokeDataService.loadMockData(selectedSet.name, cardName);
        
        // Filter the mock data too
        if (mockData && mockData.pricing) {
          mockData.pricing = filterValidPrices(mockData.pricing);
        }
        
        priceData = mockData;
        error = "Using mock data (API unavailable). This is for demonstration purposes only.";
      } catch (mockErr) {
        console.error('Failed to load mock data:', mockErr);
      }
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    try {
      console.log('Initializing app and loading set list...');
      // Get the set list with caching
      const sets = await pokeDataService.getSetList();
      console.log(`Loaded ${sets.length} sets`);
      
      // Verify all sets have an ID property
      const setsWithoutIds = sets.filter(set => !set.id);
      if (setsWithoutIds.length > 0) {
        console.warn(`Found ${setsWithoutIds.length} sets without IDs`);
        // Add IDs to the sets that don't have them
        let maxId = Math.max(...sets.filter(set => set.id).map(set => set.id), 0);
        setsWithoutIds.forEach(set => {
          maxId++;
          set.id = maxId;
        });
        console.log('Added IDs to sets that were missing them');
      }
      
      // Check for any missing set codes
      const setsWithoutCodes = sets.filter(set => !set.code);
      if (setsWithoutCodes.length > 0) {
        console.warn(`Found ${setsWithoutCodes.length} sets without codes`);
      }
      
      availableSets = sets;
    } catch (error) {
      console.error('Error loading set list:', error);
      // Fallback to imported data
      console.log('Using fallback set list');
      const { setList } = await import('./data/setList.js');
      availableSets = setList;
    }
    
    // Add debugging log to verify sets are loaded
    console.log(`Available sets: ${availableSets.length}`);
    if (availableSets.length > 0) {
      console.log('First few sets:', availableSets.slice(0, 3));
    }
  });
</script>

<main>
  <header>
    <h1>Pokémon Card Price Checker</h1>
  </header>
  <div class="form-container">
    <div class="form-group">
      <label for="setSelect">Select Set:</label>
      <SearchableSelect
        items={availableSets}
        labelField="name"
        secondaryField="code"
        placeholder="Search for a set..."
        bind:value={selectedSet}
        on:select={handleSetSelect}
      />
    </div>

    <div class="form-group">
      <label for="cardName">Card Name:</label>
      
      <!-- Replace the input field with SearchableSelect -->
      {#if !selectedSet}
        <div class="disabled-select">
          <input disabled placeholder="Select a set first">
        </div>
      {:else if isLoadingCards}
        <div class="loading-select">
          <input disabled placeholder="Loading cards...">
        </div>
      {:else if cardsInSet.length === 0}
        <div class="error-select">
          <input disabled placeholder="No cards found for this set">
        </div>
      {:else}
        <CardSearchSelect
          bind:this={cardSearchComponent}
          cards={cardsInSet}
          bind:selectedCard={selectedCard}
          on:select={handleCardSelect}
        />
      {/if}
    </div>

    <button on:click={fetchCardPrice} disabled={isLoading || !selectedCard}>
      {isLoading ? 'Loading...' : 'Get Price'}
    </button>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <!-- Safely display results only if the price data exists -->
    {#if priceData !== null && priceData !== undefined && typeof priceData === 'object'}
      <div class="results">
        <!-- Always use safe property access to avoid null references -->
        <h2>{priceData?.name || (selectedCard && selectedCard.name) || 'Card'}</h2>
        <p><strong>Set:</strong> {priceData?.set_name || (selectedSet && selectedSet.name) || 'Unknown'}</p>
        <p><strong>Number:</strong> {priceData?.num || (selectedCard && selectedCard.num) || 'Unknown'}</p>
        
        <!-- Only display rarity if we have it -->
        {#if (priceData && priceData.rarity) || (selectedCard && selectedCard.rarity)}
          <p><strong>Rarity:</strong> {(priceData && priceData.rarity) || (selectedCard && selectedCard.rarity) || 'Unknown'}</p>
        {/if}
        
        <h3>Prices:</h3>
        <!-- Check if we have any valid pricing data -->
        {#if !priceData?.pricing || Object.keys(priceData.pricing || {}).length === 0}
          <p class="no-prices">No pricing data available for this card.</p>
        {:else}
          <ul>
            {#each Object.entries(priceData.pricing || {}) as [market, price]}
              <li>
                <span class="market">{market}:</span> 
                <span class="price">${formatPrice(price?.value)}</span> 
                <span class="currency">{price?.currency || 'USD'}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
  

  
  <!-- Card Variant Selector Modal -->
  <CardVariantSelector
    variants={cardVariants}
    isVisible={showVariantSelector}
    on:select={handleVariantSelect}
    on:confirm={handleVariantConfirm}
    on:close={closeVariantSelector}
  />
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }
  
  header {
    background-color: #3c5aa6; /* Pokemon blue */
    padding: 1rem;
    border-radius: 8px 8px 0 0;
    margin-bottom: 1.5rem;
  }
  
  h1 {
    color: white;
    font-size: 1.8rem;
    margin: 0;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .form-container {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    margin-bottom: 1rem;
    backdrop-filter: blur(5px);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group:last-of-type {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.75rem;
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
  
  button {
    width: 100%;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: #ee1515; /* Pokemon red */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }
  
  button:hover {
    background-color: #cc0000;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .disabled-select input, .loading-select input {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }
  
  .error-select input {
    background-color: #fff8f8;
    color: #cc0000;
    cursor: not-allowed;
    border: 1px solid #ffcccc;
  }

  

  .error {
    color: #ee1515;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(238, 21, 21, 0.1);
    border-radius: 4px;
    text-align: center;
  }
  
  .results {
    margin-top: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    background-color: rgba(249, 249, 249, 0.9);
    backdrop-filter: blur(5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .results h2 {
    color: #3c5aa6;
    margin-top: 0;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
  }
  
  .results h3 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #ee1515;
  }
  
  .results ul {
    list-style-type: none;
    padding: 0;
  }
  
  .results li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .results li:last-child {
    border-bottom: none;
  }
  
  .market {
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .price {
    font-weight: 700;
    color: #ee1515;
  }
  
  .currency {
    color: #666;
    font-size: 0.9rem;
  }
  
  .no-prices {
    color: #6c757d;
    font-style: italic;
    padding: 0.5rem 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 600px) {
    main {
      padding: 0.5rem;
    }
    
    .form-container {
      padding: 1rem;
    }
    
    h1 {
      font-size: 1.5rem;
    }
  }
</style>