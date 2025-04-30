"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetListCacheKey = getSetListCacheKey;
exports.getCardsForSetCacheKey = getCardsForSetCacheKey;
exports.getCardCacheKey = getCardCacheKey;
exports.getCardPricingCacheKey = getCardPricingCacheKey;
exports.getCurrentSetsCacheKey = getCurrentSetsCacheKey;
exports.isCacheExpired = isCacheExpired;
exports.getCacheAge = getCacheAge;
exports.formatCacheEntry = formatCacheEntry;
exports.parseCacheEntry = parseCacheEntry;
/**
 * Generate a cache key for a set list
 * @returns The cache key for the set list
 */
function getSetListCacheKey() {
    return 'sets:list';
}
/**
 * Generate a cache key for cards in a set
 * @param setCode The set code
 * @returns The cache key for cards in the set
 */
function getCardsForSetCacheKey(setCode) {
    return `cards:set:${setCode.toLowerCase()}`;
}
/**
 * Generate a cache key for a card
 * @param cardId The card ID
 * @returns The cache key for the card
 */
function getCardCacheKey(cardId) {
    return `card:${cardId.toLowerCase()}`;
}
/**
 * Generate a cache key for card pricing
 * @param cardId The card ID
 * @returns The cache key for card pricing
 */
function getCardPricingCacheKey(cardId) {
    return `pricing:${cardId.toLowerCase()}`;
}
/**
 * Generate a cache key for current sets
 * @returns The cache key for current sets
 */
function getCurrentSetsCacheKey() {
    return 'sets:current';
}
/**
 * Check if a cache entry is expired
 * @param timestamp The timestamp of the cache entry
 * @param ttlSeconds The TTL in seconds
 * @returns Whether the cache entry is expired
 */
function isCacheExpired(timestamp, ttlSeconds) {
    const now = Date.now();
    const expiryTime = timestamp + (ttlSeconds * 1000);
    return now > expiryTime;
}
/**
 * Calculate the age of a cache entry in seconds
 * @param timestamp The timestamp of the cache entry
 * @returns The age of the cache entry in seconds
 */
function getCacheAge(timestamp) {
    const now = Date.now();
    const ageMs = now - timestamp;
    return Math.floor(ageMs / 1000);
}
/**
 * Format a cache entry with timestamp and TTL information
 * @param data The data to cache
 * @param ttlSeconds The TTL in seconds
 * @returns The formatted cache entry
 */
function formatCacheEntry(data, ttlSeconds) {
    return {
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds
    };
}
/**
 * Parse a cache entry and check if it's expired
 * @param cacheEntry The cache entry
 * @returns The data if not expired, null otherwise
 */
function parseCacheEntry(cacheEntry) {
    if (!cacheEntry) {
        return null;
    }
    if (isCacheExpired(cacheEntry.timestamp, cacheEntry.ttl)) {
        return null;
    }
    return cacheEntry.data;
}
//# sourceMappingURL=cacheUtils.js.map