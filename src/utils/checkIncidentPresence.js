const logError = require('../utils/logError');

/**
 * Checks if a document exists in the database based on a provided query.
 * Throws an error if the document is not found.
 *
 * @param {Function} serviceFunction - The service function to fetch the document.
 * @param {Object} query - The query to find the document.
 * @param {String} errorMessage - Custom error message to throw if not found.
 * @returns {Object} - The document found in the database.
 */
async function checkIncidentPresence(
    serviceFunction,
    query,
    errorMessage = 'Incident not found.'
) {
    try {
        const incident = await serviceFunction(query);
        if (!incident) {
            throw new Error(errorMessage);
        }
        return incident;
    } catch (error) {
        logError('Checking incident presence', error);
        throw new Error(errorMessage);
    }
}

module.exports = checkIncidentPresence;
