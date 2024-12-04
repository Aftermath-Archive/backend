function logError(action, error) {
    console.error(`[ERROR] - ${action}: ${error.message}`);
    if (error.stack) {
        console.error(error.stack);
    }
}

module.exports = logError;
