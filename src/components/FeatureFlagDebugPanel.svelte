<script>
  import { featureFlagService } from '../services/featureFlagService';
  import { onMount } from 'svelte';
  
  // State
  let useCloudApi = false;
  let useCloudImages = false;
  let useCloudCaching = false;
  let showPanel = false;
  
  // Load initial values
  onMount(() => {
    useCloudApi = featureFlagService.useCloudApi();
    useCloudImages = featureFlagService.useCloudImages();
    useCloudCaching = featureFlagService.useCloudCaching();
  });
  
  // Toggle panel visibility
  function togglePanel() {
    showPanel = !showPanel;
  }
  
  // Update feature flags
  function updateFlags() {
    featureFlagService.setFlag('useCloudApi', useCloudApi);
    featureFlagService.setFlag('useCloudImages', useCloudImages);
    featureFlagService.setFlag('useCloudCaching', useCloudCaching);
    
    // Reload the page to apply changes
    window.location.reload();
  }
  
  // Reset all flags
  function resetFlags() {
    featureFlagService.resetAllFlags();
    window.location.reload();
  }
</script>

<div class="feature-flag-debug">
  <button class="toggle-button" on:click={togglePanel}>
    {showPanel ? 'Hide' : 'Show'} Feature Flags
  </button>
  
  {#if showPanel}
    <div class="panel">
      <h3>Feature Flags</h3>
      
      <div class="flag-item">
        <label>
          <input type="checkbox" bind:checked={useCloudApi}>
          Use Cloud API
        </label>
      </div>
      
      <div class="flag-item">
        <label>
          <input type="checkbox" bind:checked={useCloudImages}>
          Use Cloud Images
        </label>
      </div>
      
      <div class="flag-item">
        <label>
          <input type="checkbox" bind:checked={useCloudCaching}>
          Use Cloud Caching
        </label>
      </div>
      
      <div class="button-group">
        <button class="apply-button" on:click={updateFlags}>
          Apply Changes
        </button>
        
        <button class="reset-button" on:click={resetFlags}>
          Reset All
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .feature-flag-debug {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 1000;
    font-family: Arial, sans-serif;
  }
  
  .toggle-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .panel {
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    margin-top: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    width: 200px;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 14px;
    color: #333;
  }
  
  .flag-item {
    margin-bottom: 8px;
    font-size: 12px;
  }
  
  .button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .apply-button {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .reset-button {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
</style>
