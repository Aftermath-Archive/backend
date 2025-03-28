const { PostMortem } = require('../models/postmortemModel');
const AppError = require('../utils/AppError');

/**
 * Asynchronously creates a post mortem based on the provided data. Handles any errors that occur during the creation process.
 * @author Xander
 *
 * @async
 * @param {*} data Data to create a post mortem
 * @returns {unknown} Creates a post mortem entry using the provided data.
 */
async function createPostMortem(data) {
    try {
        return await PostMortem.create(data);
    } catch (error) {
        console.error('Error creating Post Mortem:', error);
        throw new AppError('Failed to create incident.', 500);
    }
}

/**
 * Function to delete a post mortem entry by incident ID
 * @author Xander
 *
 * @async
 * @param {*} incidentId The unique identifier of the incident for which the post-mortem is being deleted.
 * @returns {unknown} Delete a post mortem by incident ID
 */
async function deletePostMortemByIncidentId(incidentId) {
    try {
        return await PostMortem.findOneAndDelete({ incidentId });
    } catch (error) {
        console.error('Error creating Post Mortem:', error);
        throw new AppError('Failed to create incident.', 500);
    }
}

module.exports = {
    createPostMortem,
    deletePostMortemByIncidentId,
};
