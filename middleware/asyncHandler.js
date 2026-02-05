/**
 * Async Handler Wrapper
 * Wraps async functions to automatically catch errors
 * Eliminates the need for try-catch blocks in every controller
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
