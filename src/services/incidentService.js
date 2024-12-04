// Provide CRUD operations for incidents

const { Incident } = require('../models/incident');

// Create a new incident
async function createIncident(incidentData) {
    try {
        const result = await Incident.create({
            title: incidentData.title,
            description: incidentData.description,
            environment: incidentData.environment,
            createdBy: incidentData.createdBy,

            // Optional fields with defaults
            status: incidentData.status || 'Open',
            assignedTo: incidentData.assignedTo || null,
            updatedBy: incidentData.updatedBy || null,
            resolvedAt: incidentData.resolvedAt || null,
            tags: incidentData.tags || [],
            resolutionDetails: incidentData.resolutionDetails || '',
            severity: incidentData.severity || 'Low',
            relatedLinks: incidentData.relatedLinks || [],
            relatedIncidents: incidentData.relatedIncidents || [],
            caseDiscussion: incidentData.caseDiscussion || [],
        });

        return result;
    } catch (error) {
        console.error('Error creating incident:', error);
        throw new Error('Failed to create incident.');
    }
}

// Find a single incident by query
async function findOneIncident(query) {
    try {
        const result = await Incident.findOne(query);

        if (!result) {
            throw new Error('No incident found matching the query.');
        }

        return result;
    } catch (error) {
        console.error('Error finding incident:', error);
        throw new Error('Failed to find incident.');
    }
}

// Find multiple incidents by query
async function findManyIncidents(query) {
    try {
        const result = await Incident.find(query);
        return result;
    } catch (error) {
        console.error('Error finding incidents:', error);
        throw new Error('Failed to find incidents.');
    }
}

// Update a single incident by query
async function updateOneIncident(query, updateData) {
    try {
        const result = await Incident.findOneAndUpdate(query, updateData, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        if (!result) {
            throw new Error('No incident found to update.');
        }

        return result;
    } catch (error) {
        console.error('Error updating incident:', error);
        throw new Error('Failed to update incident.');
    }
}

// Update multiple incidents by query
async function updateManyIncidents(query, updateData) {
    try {
        const result = await Incident.updateMany(query, updateData, {
            runValidators: true,
        });
        return result;
    } catch (error) {
        console.error('Error updating multiple incidents:', error);
        throw new Error('Failed to update incidents.');
    }
}

// Delete a single incident by query
async function deleteOneIncident(query) {
    try {
        const result = await Incident.findOneAndDelete(query);

        if (!result) {
            throw new Error('No incident found to delete.');
        }

        return result;
    } catch (error) {
        console.error('Error deleting incident:', error);
        throw new Error('Failed to delete incident.');
    }
}

// Delete multiple incidents by query
async function deleteManyIncidents(query) {
    try {
        const result = await Incident.deleteMany(query);
        return result;
    } catch (error) {
        console.error('Error deleting multiple incidents:', error);
        throw new Error('Failed to delete incidents.');
    }
}

// Export CRUD operations
module.exports = {
    createIncident,
    findOneIncident,
    findManyIncidents,
    updateOneIncident,
    updateManyIncidents,
    deleteOneIncident,
    deleteManyIncidents,
};
