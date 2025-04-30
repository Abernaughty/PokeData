"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
class RedisCacheService {
    constructor(connectionString, enabled = true) {
        this.connectionString = connectionString;
        this.enabled = enabled;
    }
    async get(key) {
        if (!this.enabled) {
            console.log(`[RedisCacheService] Cache disabled, skipping get for key: ${key}`);
            return null;
        }
        console.log(`[RedisCacheService] Getting key: ${key}`);
        // Mock implementation for local testing
        return null;
    }
    async set(key, value, ttlSeconds) {
        if (!this.enabled) {
            console.log(`[RedisCacheService] Cache disabled, skipping set for key: ${key}`);
            return;
        }
        console.log(`[RedisCacheService] Setting key: ${key} with TTL: ${ttlSeconds}s`);
        // Mock implementation for local testing
    }
    async delete(key) {
        if (!this.enabled) {
            console.log(`[RedisCacheService] Cache disabled, skipping delete for key: ${key}`);
            return;
        }
        console.log(`[RedisCacheService] Deleting key: ${key}`);
        // Mock implementation for local testing
    }
    async exists(key) {
        if (!this.enabled) {
            console.log(`[RedisCacheService] Cache disabled, skipping exists check for key: ${key}`);
            return false;
        }
        console.log(`[RedisCacheService] Checking if key exists: ${key}`);
        // Mock implementation for local testing
        return false;
    }
    async clear(pattern) {
        if (!this.enabled) {
            console.log(`[RedisCacheService] Cache disabled, skipping clear for pattern: ${pattern}`);
            return 0;
        }
        console.log(`[RedisCacheService] Clearing keys matching pattern: ${pattern}`);
        // Mock implementation for local testing
        return 0;
    }
}
exports.RedisCacheService = RedisCacheService;
//# sourceMappingURL=RedisCacheService.js.map