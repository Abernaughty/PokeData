"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = createErrorResponse;
exports.createNotFoundError = createNotFoundError;
exports.createBadRequestError = createBadRequestError;
exports.createServerError = createServerError;
exports.handleError = handleError;
exports.logError = logError;
/**
 * Create a standardized error response
 * @param message The error message
 * @param status The HTTP status code
 * @param path The request path
 * @param details Additional error details
 * @returns The error response
 */
function createErrorResponse(message, status = 500, path, details) {
    return {
        error: message,
        status,
        timestamp: new Date().toISOString(),
        path,
        details
    };
}
/**
 * Create a not found error response
 * @param resourceType The type of resource that was not found
 * @param resourceId The ID of the resource that was not found
 * @param path The request path
 * @returns The error response
 */
function createNotFoundError(resourceType, resourceId, path) {
    return createErrorResponse(`${resourceType} not found: ${resourceId}`, 404, path);
}
/**
 * Create a bad request error response
 * @param message The error message
 * @param path The request path
 * @param details Additional error details
 * @returns The error response
 */
function createBadRequestError(message, path, details) {
    return createErrorResponse(message, 400, path, details);
}
/**
 * Create a server error response
 * @param message The error message
 * @param path The request path
 * @param details Additional error details
 * @returns The error response
 */
function createServerError(message, path, details) {
    return createErrorResponse(message, 500, path, details);
}
/**
 * Handle an error and return a standardized error response
 * @param error The error to handle
 * @param path The request path
 * @returns The error response
 */
function handleError(error, path) {
    console.error(`Error in request to ${path || 'unknown path'}:`, error);
    // If it's already an ErrorResponse, return it
    if (error && typeof error === 'object' && 'error' in error && 'status' in error) {
        return error;
    }
    // Handle specific error types
    if (error instanceof SyntaxError) {
        return createBadRequestError('Invalid JSON in request', path);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return createServerError('Unable to connect to external service', path, {
            code: error.code,
            service: error.address
        });
    }
    // Default error handling
    return createServerError(error.message || 'An unexpected error occurred', path, process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined);
}
/**
 * Log an error with context information
 * @param error The error to log
 * @param context Additional context information
 */
function logError(error, context = {}) {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=errorUtils.js.map