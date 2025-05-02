import { writable } from 'svelte/store';
import { pokeDataService } from '../services/pokeDataService';
import { dbService } from '../services/storage/db';

// Create stores for state
export const error = writable(null);
export const isOnline = writable(navigator.onLine);

// Background tasks state
let syncInterval;
let cleanupInterval;
let configUpdateInterval;

// Check if the browser is online
export function initNetworkListeners() {
    const updateOnlineStatus = () => {
        const status = navigator.onLine;
        isOnline.set(status);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
    };
}

// Background tasks
export function startBackgroundTasks() {
    startBackgroundSync();
    startCleanupInterval();
    startConfigUpdateInterval();
    
    return () => {
        if (syncInterval) clearInterval(syncInterval);
        if (cleanupInterval) clearInterval(cleanupInterval);
        if (configUpdateInterval) clearInterval(configUpdateInterval);
    };
}

function startBackgroundSync() {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(async () => {
        if (navigator.onLine) {
            console.log('Running background sync for current sets...');
            await pokeDataService.preloadCurrentSets();
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    if (navigator.onLine) {
        setTimeout(async () => {
            console.log('Running initial background sync for current sets...');
            await pokeDataService.preloadCurrentSets();
        }, 5000);
    }
}

function startCleanupInterval() {
    if (cleanupInterval) clearInterval(cleanupInterval);
    
    cleanupInterval = setInterval(async () => {
        console.log('Running cleanup for expired pricing data...');
        await dbService.cleanupExpiredPricingData();
    }, 12 * 60 * 60 * 1000); // 12 hours
    
    setTimeout(async () => {
        console.log('Running initial cleanup for expired pricing data...');
        await dbService.cleanupExpiredPricingData();
    }, 10000);
}

function startConfigUpdateInterval() {
    if (configUpdateInterval) clearInterval(configUpdateInterval);
    
    configUpdateInterval = setInterval(async () => {
        if (navigator.onLine) {
            console.log('Running scheduled update of current sets configuration...');
            await pokeDataService.updateCurrentSetsConfiguration();
        }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (navigator.onLine) {
        setTimeout(async () => {
            console.log('Running initial update of current sets configuration...');
            await pokeDataService.updateCurrentSetsConfiguration();
        }, 15000);
    }
}
