"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugPokeData = debugPokeData;
const index_1 = require("../../index");
const axios_1 = __importDefault(require("axios"));
async function debugPokeData(request, context) {
    var _a, _b, _c, _d, _e, _f;
    const correlationId = `[debug-${Date.now()}]`;
    try {
        context.log(`${correlationId} Starting PokeData debug diagnostics`);
        const diagnostics = {
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            environmentVariables: {
                POKEDATA_API_KEY: process.env.POKEDATA_API_KEY ? {
                    exists: true,
                    length: process.env.POKEDATA_API_KEY.length,
                    firstChars: process.env.POKEDATA_API_KEY.substring(0, 20),
                    lastChars: process.env.POKEDATA_API_KEY.substring(process.env.POKEDATA_API_KEY.length - 10)
                } : { exists: false },
                POKEDATA_API_BASE_URL: process.env.POKEDATA_API_BASE_URL || 'NOT SET (using default)',
                ENABLE_REDIS_CACHE: process.env.ENABLE_REDIS_CACHE || 'NOT SET',
                CACHE_TTL_SETS: process.env.CACHE_TTL_SETS || 'NOT SET'
            },
            tests: []
        };
        // Test 1: Direct axios call to PokeData API
        context.log(`${correlationId} Test 1: Direct axios call`);
        try {
            const apiKey = process.env.POKEDATA_API_KEY || "";
            const baseUrl = process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
            const url = `${baseUrl}/sets`;
            const headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            const startTime = Date.now();
            const response = await axios_1.default.get(url, { headers, timeout: 30000 });
            const duration = Date.now() - startTime;
            diagnostics.tests.push({
                name: "Direct Axios Call",
                status: "SUCCESS",
                duration: `${duration}ms`,
                url: url,
                responseStatus: response.status,
                dataType: Array.isArray(response.data) ? 'Array' : typeof response.data,
                dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
                sampleData: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
            });
        }
        catch (error) {
            diagnostics.tests.push({
                name: "Direct Axios Call",
                status: "FAILED",
                error: error.message,
                responseStatus: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                responseData: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
                stack: (_c = error.stack) === null || _c === void 0 ? void 0 : _c.split('\n').slice(0, 5)
            });
        }
        // Test 2: PokeDataApiService call
        context.log(`${correlationId} Test 2: PokeDataApiService call`);
        try {
            const startTime = Date.now();
            const sets = await index_1.pokeDataApiService.getAllSets();
            const duration = Date.now() - startTime;
            diagnostics.tests.push({
                name: "PokeDataApiService.getAllSets()",
                status: "SUCCESS",
                duration: `${duration}ms`,
                dataType: Array.isArray(sets) ? 'Array' : typeof sets,
                dataLength: Array.isArray(sets) ? sets.length : 'N/A',
                sampleData: Array.isArray(sets) && sets.length > 0 ? sets[0] : null
            });
        }
        catch (error) {
            diagnostics.tests.push({
                name: "PokeDataApiService.getAllSets()",
                status: "FAILED",
                error: error.message,
                stack: (_d = error.stack) === null || _d === void 0 ? void 0 : _d.split('\n').slice(0, 5)
            });
        }
        // Test 3: Network connectivity test
        context.log(`${correlationId} Test 3: Network connectivity`);
        try {
            const startTime = Date.now();
            const response = await axios_1.default.get('https://httpbin.org/get', { timeout: 10000 });
            const duration = Date.now() - startTime;
            diagnostics.tests.push({
                name: "Network Connectivity (httpbin.org)",
                status: "SUCCESS",
                duration: `${duration}ms`,
                responseStatus: response.status
            });
        }
        catch (error) {
            diagnostics.tests.push({
                name: "Network Connectivity (httpbin.org)",
                status: "FAILED",
                error: error.message
            });
        }
        // Test 4: PokeData API base connectivity
        context.log(`${correlationId} Test 4: PokeData API base connectivity`);
        try {
            const baseUrl = process.env.POKEDATA_API_BASE_URL || 'https://www.pokedata.io/v0';
            const startTime = Date.now();
            const response = await axios_1.default.get(baseUrl, { timeout: 10000 });
            const duration = Date.now() - startTime;
            diagnostics.tests.push({
                name: "PokeData API Base URL",
                status: "SUCCESS",
                duration: `${duration}ms`,
                url: baseUrl,
                responseStatus: response.status
            });
        }
        catch (error) {
            diagnostics.tests.push({
                name: "PokeData API Base URL",
                status: "FAILED",
                error: error.message,
                responseStatus: (_e = error.response) === null || _e === void 0 ? void 0 : _e.status,
                responseData: (_f = error.response) === null || _f === void 0 ? void 0 : _f.data
            });
        }
        // Test 5: Service instantiation check
        context.log(`${correlationId} Test 5: Service instantiation`);
        try {
            diagnostics.tests.push({
                name: "Service Instantiation",
                status: "SUCCESS",
                serviceExists: !!index_1.pokeDataApiService,
                serviceType: typeof index_1.pokeDataApiService,
                serviceMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(index_1.pokeDataApiService))
            });
        }
        catch (error) {
            diagnostics.tests.push({
                name: "Service Instantiation",
                status: "FAILED",
                error: error.message
            });
        }
        context.log(`${correlationId} Debug diagnostics completed`);
        return {
            jsonBody: {
                status: 200,
                message: "PokeData Debug Diagnostics",
                diagnostics: diagnostics
            },
            status: 200
        };
    }
    catch (error) {
        context.log(`${correlationId} Error in debug function: ${error.message}`);
        return {
            jsonBody: {
                status: 500,
                error: "Debug function failed",
                message: error.message,
                stack: error.stack
            },
            status: 500
        };
    }
}
//# sourceMappingURL=index.js.map