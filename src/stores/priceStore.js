import { writable } from 'svelte/store';
import { hybridDataService } from '../services/hybridDataService';
import { error, isOnline } from './uiStore';

// Create stores for state
export const priceData = writable(null);
export const isLoading = writable(false);
export const pricingTimestamp = writable(null);
export const pricingFromCache = writable(false);
export const pricingIsStale = writable(false);

// Helper function to filter out zero or null price values
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

// Format price to always show 2 decimal places
export function formatPrice(value) {
    if (value === undefined || value === null) return "0.00";
    return parseFloat(value).toFixed(2);
}

// Actions
/**
 * Fetch price data for a card
 * @param {string} cardId - The card ID
 * @param {boolean} forceRefresh - Whether to force a refresh from the API
 * @returns {Promise<void>}
 */
export async function fetchCardPrice(cardId, forceRefresh = false) {
    let online;
    isOnline.subscribe(value => { online = value; })();
    
    if (!online) {
        error.set("You are offline. Please connect to the internet to get pricing data.");
        return;
    }
    
    if (!cardId) {
        error.set("Invalid card selection - missing ID");
        return;
    }
    
    // Reset pricing related state
    isLoading.set(true);
    error.set(null);
    pricingTimestamp.set(null);
    pricingFromCache.set(false);
    pricingIsStale.set(false);
    priceData.set(null);
    
    try {
        console.log(`Fetching price data for card ID: ${cardId}${forceRefresh ? ' (force refresh)' : ''}`);
        
        // Load pricing data with metadata using the card ID
        const result = await hybridDataService.getCardPricingWithMetadata(cardId, forceRefresh);
        const rawPriceData = result.data;
        
        pricingTimestamp.set(result.timestamp);
        pricingFromCache.set(result.fromCache || false);
        pricingIsStale.set(result.isStale || false);
        
        console.log('Received price data:', rawPriceData);
        console.log('Pricing timestamp:', result.timestamp ? new Date(result.timestamp).toLocaleString() : 'none');
        console.log('From cache:', result.fromCache || false);
        
        // Filter out zero or null price values
        if (rawPriceData && rawPriceData.pricing) {
            rawPriceData.pricing = filterValidPrices(rawPriceData.pricing);
            console.log('Filtered pricing data:', rawPriceData.pricing);
        } else {
            console.warn('No pricing data found in the response:', rawPriceData);
        }
        
        priceData.set(rawPriceData);
    } catch (err) {
        console.error('API Error:', err);
        error.set(err.message);
    } finally {
        isLoading.set(false);
    }
}

// Load pricing data for a specific variant
export async function loadPricingForVariant(variant) {
    if (!variant || !variant.id) {
        error.set('Invalid card variant');
        return;
    }
    
    // Just use the regular fetch function with the variant ID
    await fetchCardPrice(variant.id);
}
