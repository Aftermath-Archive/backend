const logError = require('../functions/logError');

const {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
} = require('../services/incidentService');

const checkIncidentPresence = require('../utils/checkIncidentPresence');

// Handle creation of a new incident
async function handleCreateIncident(req, res) {
    try {
        const incident = await createNewIncidentService(req.body);
        res.status(201).json(incident);
    } catch (error) {
        logError('Creating incident', error);
        res.status(400).json({ message: error.message });
    }
}

// Handle fetching an incident by ID
async function handleGetIncidentById(req, res) {
    try {
        const incident = await findIncidentByQueryService({
            _id: req.params.id,
        });
        res.status(200).json(incident);
    } catch (error) {
        logError('Finding incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// Handle fetching all incidents with pagination
async function handleGetAllIncidents(req, res) {
    try {
        const { page, limit } = req.pagination;

        // Use the pagination parameters directly in the service call
        const incidents = await findIncidentsByQueryService(
            {}, // empty query to get all incidents
            { page, limit }
        );

        res.status(200).json(incidents);
    } catch (error) {
        logError('Fetching all incidents with pagination', error);
        res.status(400).json({ message: error.message });
    }
}

// Handle searching incidents by query
async function handleSearchIncidents(req, res) {
    try {
        const incidentsQuery = await findIncidentsByQueryService(req.query);

        res.status(200).json({
            incidentsQuery,
        });
    } catch (error) {
        logError('Finding incidents by query', error);
        res.status(400).json({ message: error.message });
    }
}

// Handle updating an incident by ID
async function handleUpdateIncident(req, res) {
    try {
        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );
        const updatedIncident = await updateIncidentByQueryService(
            { _id: incident._id },
            req.body
        );
        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Updating incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// Handle deleting an incident by ID
async function handleDeleteIncident(req, res) {
    try {
        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );
        const deletedIncident = await deleteIncidentByQueryService({
            _id: incident._id,
        });
        res.status(200).json(deletedIncident);
    } catch (error) {
        logError('Deleting incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// Handle adding a case discussion to an incident
async function handleAddDiscussion(req, res) {
    try {
        const { message, author } = req.body;

        if (!message || !author) {
            return res
                .status(400)
                .json({ message: 'Message and author are required.' });
        }

        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );

        const updatedIncident = await updateIncidentByQueryService(
            { _id: incident._id },
            { $push: { caseDiscussion: { message, author } } }
        );

        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Adding case discussion to incident', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

module.exports = {
    handleCreateIncident,
    handleGetIncidentById,
    handleGetAllIncidents,
    handleSearchIncidents,
    handleUpdateIncident,
    handleDeleteIncident,
    handleAddDiscussion,
};
