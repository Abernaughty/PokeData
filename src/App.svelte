<script>
  import { onMount, onDestroy } from 'svelte';
  
  // Import stores
  import { availableSets, groupedSetsForDropdown, selectedSet, isLoadingSets, loadSets, selectSet } from './stores/setStore';
  import { cardsInSet, selectedCard, isLoadingCards, cardName, selectCard } from './stores/cardStore';
  import { priceData, isLoading, pricingTimestamp, pricingFromCache, pricingIsStale, fetchCardPrice, formatPrice, loadPricingForVariant } from './stores/priceStore';
  import { error, isOnline, initNetworkListeners, startBackgroundTasks } from './stores/uiStore';
  
  // Import components
  import SearchableSelect from './components/SearchableSelect.svelte';
  import CardSearchSelect from './components/CardSearchSelect.svelte';
  import CardVariantSelector from './components/CardVariantSelector.svelte';
  
  // Reference to CardSearchSelect component
  let cardSearchComponent;
  
  // Variables for handling card variants
  let cardVariants = [];
  let showVariantSelector = false;
  let selectedVariant = null;
  
  // Event handlers
  function handleSetSelect(event) {
    selectSet(event.detail);
  }
  
  function handleCardSelect(event) {
    selectCard(event.detail);
  }
  
  function handleGetPrice() {
    if ($selectedCard) {
      fetchCardPrice($selectedCard.id);
    }
  }
  
  // Variant handlers
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

  // Lifecycle hooks
  onMount(() => {
    // Load sets when the component mounts
    loadSets();
    
    // Set up network listeners and background tasks
    const cleanupNetworkListeners = initNetworkListeners();
    const cleanupBackgroundTasks = startBackgroundTasks();
    
    // Return a cleanup function
    return () => {
      cleanupNetworkListeners();
      cleanupBackgroundTasks();
    };
  });
</script>

<main>
  <header>
    <h1>Pokémon Card Price Checker</h1>
  </header>
  <div class="form-container">
    <div class="form-group">
      <label for="setSelect">Select Set:</label>
      
      {#if $isLoadingSets}
        <div class="loading-select">
          <input disabled placeholder="Loading sets...">
          <div class="loading-spinner"></div>
        </div>
      {:else}
  <SearchableSelect
          items={$groupedSetsForDropdown}
          labelField="name"
          secondaryField="code"
          placeholder="Search for a set..."
          value={$selectedSet}
          on:select={handleSetSelect}
        />
      {/if}
    </div>

    <div class="form-group">
      <label for="cardName">Card Name:</label>
      
      <!-- Replace the input field with SearchableSelect -->
      {#if !$selectedSet}
        <div class="disabled-select">
          <input disabled placeholder="Select a set first">
        </div>
      {:else if $isLoadingCards}
        <div class="loading-select">
          <input disabled placeholder="Loading cards...">
        </div>
      {:else if $cardsInSet.length === 0}
        <div class="error-select">
          <input disabled placeholder="No cards found for this set">
        </div>
      {:else}
        <CardSearchSelect
          bind:this={cardSearchComponent}
          cards={$cardsInSet}
          selectedCard={$selectedCard}
          on:select={handleCardSelect}
        />
      {/if}
    </div>

    <button on:click={handleGetPrice} disabled={$isLoading || !$selectedCard}>
      {$isLoading ? 'Loading...' : 'Get Price'}
    </button>

    {#if $error}
      <p class="error">{$error}</p>
    {/if}

    <!-- Safely display results only if the price data exists -->
    {#if $priceData !== null && $priceData !== undefined && typeof $priceData === 'object'}
      <div class="results">
        <!-- Always use safe property access to avoid null references -->
        <h2>{$priceData?.name || ($selectedCard && $selectedCard.name) || 'Card'}</h2>
        <p><strong>Set:</strong> {$priceData?.set_name || ($selectedSet && $selectedSet.name) || 'Unknown'}</p>
        <p><strong>Number:</strong> {$priceData?.num || ($selectedCard && $selectedCard.num) || 'Unknown'}</p>
        
        <!-- Only display rarity if we have it -->
        {#if ($priceData && $priceData.rarity) || ($selectedCard && $selectedCard.rarity)}
          <p><strong>Rarity:</strong> {($priceData && $priceData.rarity) || ($selectedCard && $selectedCard.rarity) || 'Unknown'}</p>
        {/if}
        
        <h3>Prices:</h3>
        <!-- Check if we have any valid pricing data -->
        {#if !$priceData?.pricing || Object.keys($priceData.pricing || {}).length === 0}
          <p class="no-prices">No pricing data available for this card.</p>
        {:else}
          <ul>
            {#each Object.entries($priceData.pricing || {}) as [market, price]}
              <li>
                <span class="market">{market}:</span> 
                <span class="price">${formatPrice(price?.value)}</span> 
                <span class="currency">{price?.currency || 'USD'}</span>
              </li>
            {/each}
          </ul>
          
          <!-- Add pricing timestamp display -->
          {#if $pricingTimestamp}
            <div class="pricing-timestamp">
              <small>
                Pricing data as of: {new Date($pricingTimestamp).toLocaleString()}
                {#if $pricingFromCache}
                  <span class="cached-indicator">(Cached)</span>
                {/if}
                {#if $pricingIsStale}
                  <span class="stale-indicator">(Stale data - using best available)</span>
                {/if}
              </small>
            </div>
          {/if}
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

<!-- Feature flags are now integrated into the main debug panel -->

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
  
  .loading-select {
    position: relative;
  }
  
  .loading-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border: 2px solid rgba(60, 90, 166, 0.2);
    border-top: 2px solid #3c5aa6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
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
  
  .pricing-timestamp {
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #ddd;
    font-size: 0.85rem;
    color: #666;
  }
  
  .cached-indicator {
    color: #3c5aa6;
    font-weight: 500;
    margin-left: 0.5rem;
  }
  
  .stale-indicator {
    color: #ee1515;
    font-weight: 500;
    margin-left: 0.5rem;
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
