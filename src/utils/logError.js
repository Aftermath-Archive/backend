
/**
 * Logs an error message to the console including the action and error message. If the error includes a stack trace, it will also log the stack trace.
 * @author Xander
 *
 * @param {*} action The action that resulted in the error
 * @param {*} error The error object containing details about the error
 */
function logError(action, error) {
    console.error(`[ERROR] - ${action}: ${error.message}`);
    if (error.stack) {
        console.error(error.stack);
    }

    // TODO - Log the error to a file or external logging service (Sentry)
}

module.exports = logError;
