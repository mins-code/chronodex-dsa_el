/**
 * Utility wrapper to measure execution time of functions.
 * @param {Function} fn - The function to be wrapped.
 * @param {string} operationName - The label for console.time.
 * @returns {Function} - The wrapped function.
 */
const performanceLogger = (fn, operationName) => {
  return function (...args) {
    console.time(operationName);
    try {
      const result = fn.apply(this, args);
      return result;
    } finally {
      console.timeEnd(operationName);
    }
  };
};

module.exports = performanceLogger;
