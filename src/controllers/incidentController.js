const { Incident } = require('../models/incidentModel');

const { logError } = require('../functions/logError');
const { checkIncidentPresence } = require('../utils/checkIncidentPresence');

// Create a new incident
async function incidentCreate(req, res) {
    try {
        const incident = await Incident.createIncident(req.body);
        res.status(201).json(incident);
    } catch (error) {
        logError('Creating incident', error);
        res.status(400).json({ message: error.message });
    }
}

// Get Incident by ID
async function incidentFindOne(req, res) {
    try {
        const incident = await checkIncidentPresence(Incident, {
            _id: req.params.id,
        });
        res.status(200).json(incident);
    } catch (error) {
        logError('Finding incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// Get all incidents with pagination
async function incidentFindAll(req, res) {
    try {
        const { page, limit, skip } = req.pagination;
        const incidents = await Incident.find().skip(skip).limit(limit);
        const total = await Incident.countDocuments();

        res.status(200).json({
            total,
            page,
            limit,
            incidents,
        });
    } catch (error) {
        logError('Fetching all incidents with pagination', error);
        res.status(400).json({ message: error.message });
    }
}

// Find Many Incidents by query
async function incidentFindMany(req, res) {
    try {
        const incidents = await Incident.findManyIncidents(req.query);
        res.status(200).json(incidents);
    } catch (error) {
        logError('Finding incidents by query', error);
        res.status(400).json({ message: error.message });
    }
}

// update incident by ID
async function incidentUpdateOne(req, res) {
    try {
        const incident = await checkIncidentPresence(Incident, {
            _id: req.params.id,
        });
        const updatedIncident = await Incident.findOneAndUpdate(
            { _id: incident._id },
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Updating incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// delete incident by ID
async function incidentDeleteOne(req, res) {
    try {
        const incident = await checkIncidentPresence(Incident, {
            _id: req.params.id,
        });
        const deletedIncident = await Incident.findOneAndDelete({
            _id: incident._id,
        });
        res.status(200).json(deletedIncident);
    } catch (error) {
        logError('Deleting incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

// add Case Discussion to incident
async function incidentAddDiscussion(req, res) {
    try {
        const { message, author } = req.body;

        if (!message || !author) {
            return res
                .status(400)
                .json({ message: 'Message and author are required.' });
        }

        const incident = await checkIncidentPresence(Incident, {
            _id: req.params.id,
        });

        const updatedIncident = await Incident.findByIdAndUpdate(
            incident._id,
            { $push: { caseDiscussion: { message, author } } },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Adding case discussion to incident', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

module.exports = {
    incidentCreate,
    incidentFindOne,
    incidentFindAll,
    incidentFindMany,
    incidentUpdateOne,
    incidentDeleteOne,
    incidentAddDiscussion,
};
