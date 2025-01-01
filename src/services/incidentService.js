// Provide CRUD operations for incidents

const { Incident } = require('../models/incidentModel');
const AppError = require('../utils/AppError');

/**
 * Asynchronous function that creates a new incident with the provided incident data. It awaits the creation in the Incident model and returns the result. If an error occurs during the creation process, it logs the error and throws an error message indicating the failure to create the incident.
 * @author Xander
 *
 * @async
 * @param {*} incidentData Data object containing information for creating a new incident
 * @returns {unknown} Creates a new incident service using the provided incident data. It creates an incident with the provided title, description, environment, createdBy, and optional fields with default values. Returns the created incident.
 */
async function createNewIncidentService(incidentData) {
    try {
        // For incidentAutoId
        // Generate date prefix (e.g., '121123' for December 11, 2023)
        const now = new Date();
        const datePrefix = `${String(now.getMonth() + 1).padStart(
            2,
            '0'
        )}${String(now.getDate()).padStart(2, '0')}${String(
            now.getFullYear()
        ).slice(-2)}`;

        // Count the incidents created today to determine the next number
        const count = await Incident.countDocuments({
            incidentAutoId: { $regex: `^${datePrefix}-INC` },
        });

        // Create the new incident ID (e.g., '121123-INC001')
        const incidentAutoId = `${datePrefix}-INC${String(count + 1).padStart(
            3,
            '0'
        )}`;

        // Create the new incident with the generated incidentAutoId
        const newIncident = await Incident.create({
            title: incidentData.title,
            incidentAutoId,
            description: incidentData.description,
            severity: incidentData.severity || 'Low',
            environment: incidentData.environment,
            createdBy: incidentData.createdBy,

            affectedSystems: incidentData.affectedSystems || '',
            impactSummary: incidentData.impactSummary || '',
            stepsToReproduce: incidentData.stepsToReproduce || '',

            // Optional fields with defaults
            status: incidentData.status || 'Open',
            assignedTo: incidentData.assignedTo || null,
            updatedBy: incidentData.updatedBy || null,
            resolvedAt: incidentData.resolvedAt || null,
            tags: incidentData.tags || [],
            resolutionDetails: incidentData.resolutionDetails || '',
            relatedLinks: incidentData.relatedLinks || [],
            relatedIncidents: incidentData.relatedIncidents || [],
            caseDiscussion: incidentData.caseDiscussion || [],
        });

        return newIncident;
    } catch (error) {
        console.error('Error creating incident:', error);
        throw new AppError('Failed to create incident.', 500);
    }
}

/**
 * Asynchronous function that finds an incident by a provided query. It tries to find an incident in the database based on the provided query. If no incident is found matching the query, it throws an error. If there is an error during the process, it logs the error and throws a 'Failed to find incident' error.
 * @author Xander
 *
 * @async
 * @param {*} query The query to search for the incident by
 * @returns {unknown} Asynchronously finds an incident by a specified query. If no incident is found matching the query, an error is thrown. Returns the found incident if successful.
 */
async function findIncidentByQueryService(query) {
    try {
        const result = await Incident.findOne(query);

        if (!result) {
            throw new AppError('No incident found matching the query.');
        }

        return result;
    } catch (error) {
        console.error('Error finding incident:', error);
        throw new AppError('Failed to find incident.');
    }
}

/**
 * Asynchronous function that searches for incidents based on the provided query parameters. The function constructs a valid query object by checking for specific fields in the query object such as title, description, status, environment, tags, severity, and global search criteria. It then uses the constructed query object to find and return incidents using the Incident model. If an error occurs during the search process, it logs the error and throws an error message indicating the failure to find incidents.
 * @author Xander
 *
 * @async
 * @param {*} query Object containing query parameters for searching incidents
 * @returns {unknown} Asynchronous function that finds incidents based on the provided query parameters. Supports searching by title, description, status, environment, tags, or severity. The search can be partial, case-insensitive, exact match, or match any tag in the array. Returns an array of Incidents based on the constructed query.
 */
async function findIncidentsByQueryService(query) {
    try {
        const validQuery = {};

        // search by title, description, status, environment, tags, or severity
        if (query.title) {
            validQuery.title = { $regex: query.title, $options: 'i' }; // Partial, case-insensitive match
        }

        if (query.description) {
            validQuery.description = {
                $regex: query.description,
                $options: 'i',
            }; // Partial, case-insensitive match
        }

        if (query.status) {
            validQuery.status = query.status; // Exact match
        }

        if (query.environment) {
            validQuery.environment = query.environment; // Exact match
        }

        if (query.tags) {
            validQuery.tags = { $in: query.tags.split(',') }; // Match any tag in the array
        }

        if (query.severity) {
            validQuery.severity = query.severity; // Exact match
        }

        // global search
        if (query.search) {
            const searchRegex = { $regex: query.search, $options: 'i' };
            validQuery.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex },
                { severity: searchRegex },
                { environment: searchRegex },
            ];
        }

        return Incident.find(validQuery);
    } catch (error) {
        console.error('Error finding incidents:', error);
        throw new AppError('Failed to find incidents.');
    }
}

/**
 * Updates an incident in the database based on the provided query and update data. If no incident is found to update, an error is thrown. Returns the updated incident after successful update.
 * @author Xander
 *
 * @async
 * @param {*} query The query used to find the incident to update.
 * @param {*} updateData The data used to update the incident.
 * @returns {unknown} Updates an incident in the database based on the provided query and update data. Returns the updated incident document if successful or throws an error if the incident is not found or updating fails.
 */
async function updateIncidentByQueryService(query, updateData) {
    try {
        const result = await Incident.findOneAndUpdate(query, updateData, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        if (!result) {
            throw new AppError('No incident found to update.');
        }

        return result;
    } catch (error) {
        console.error('Error updating incident:', error);
        throw new AppError('Failed to update incident.');
    }
}

/**
 * Updates multiple incidents in the database based on the provided query and update data. Runs validation on the updated data.
 * @param query The query to filter incidents to be updated.
 * @param updateData The data to update the incidents with.
 * @returns A promise that resolves to the result of the update operation.
 * @throws Error if there is a failure while updating multiple incidents.
 * @author Xander
 *
 * @async
 * @param {*} query The query to filter the incidents to be updated
 * @param {*} updateData The data to update the filtered incidents with
 * @returns {unknown} Updates multiple incidents in the database based on a specified query and update data. This function returns the result of the update operation.
 */
async function updateManyIncidentsByQueryService(query, updateData) {
    try {
        const result = await Incident.updateMany(query, updateData, {
            runValidators: true,
        });
        return result;
    } catch (error) {
        console.error('Error updating multiple incidents:', error);
        throw new AppError('Failed to update incidents.');
    }
}

/**
 * Asynchronously deletes an incident by querying the database. If the incident is found and deleted successfully, the deleted incident is returned. If no incident is found to delete, an error is thrown. If an error occurs during the deletion process, an error is thrown with a message indicating the failure to delete the incident.
 * @author Xander
 *
 * @async
 * @param {*} query The query to find and delete the incident
 * @returns {unknown} Deletes an incident from the database based on the provided query object. If no incident is found to delete, an error is thrown. Returns the deleted incident if successful.
 */
async function deleteIncidentByQueryService(query) {
    try {
        const result = await Incident.findOneAndDelete(query);

        if (!result) {
            throw new AppError('No incident found to delete.');
        }

        return result;
    } catch (error) {
        console.error('Error deleting incident:', error);
        throw new AppError('Failed to delete incident.');
    }
}

/**
 * A function that deletes multiple incidents based on a query. It uses the Incident model to delete many incidents that match the provided query. Returns the result of the delete operation. If an error occurs during the deletion process, it logs the error and throws an error with the message 'Failed to delete incidents'.
 * @author Xander
 *
 * @async
 * @param {*} query The query object used to filter incidents to be deleted
 * @returns {unknown} Deletes multiple incidents based on the provided query and returns the result of the deletion operation. If an error occurs during the deletion process, an error message is logged and an error is thrown.
 */
async function deleteManyIncidentsByQueryService(query) {
    try {
        const result = await Incident.deleteMany(query);
        return result;
    } catch (error) {
        console.error('Error deleting multiple incidents:', error);
        throw new AppError('Failed to delete incidents.');
    }
}

// Export CRUD operations
module.exports = {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    updateManyIncidentsByQueryService,
    deleteIncidentByQueryService,
    deleteManyIncidentsByQueryService,
};
