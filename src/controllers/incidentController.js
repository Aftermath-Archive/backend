const { Incident } = require('../models/incidentModel');

// const {
//     createIncident,
//     findOneIncident,
//     findManyIncidents,
//     updateOneIncident,
//     updateManyIncidents,
//     deleteOneIncident,
//     deleteManyIncidents,
// } = require('../services/incidentService');

// Create a new incident
async function incidentCreate(req, res) {
    try {
        const incident = await Incident.createIncident(req.body);
        res.status(201).json(incident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Get Incident by ID

// Get all incidents

// update incident by ID

// delete incident by ID

// add Case Discussion to incident

module.exports = {
    incidentCreate,
};
