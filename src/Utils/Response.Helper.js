// Standardized response helper to keep contract outputs consistent across controllers/services.
// (Non-functional comment added per request.)
module.exports = {
  success(data) { return { success: true, data }; },
  error(error) { return { success: false, error }; }
};
