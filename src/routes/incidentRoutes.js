const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incidentController');

const validateIncidentMiddleware = require('../middlewares/validateIncidentMiddleware');
const validateDiscussionMiddleware = require('../middlewares/validateDiscussionMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// Create a new incident
router.post('/', validateIncidentMiddleware, incidentController.createIncident);

// Get Incident by ID
router.get('/:id', validateObjectId, incidentController.getIncidentById);

// Get all incidents with pagination
router.get('/', paginationMiddleware, incidentController.getAllIncidents);

// Search and filter incidents
router.get(
    '/search',
    paginationMiddleware,
    incidentController.getFilteredIncidents
);

// Update incident by ID
router.patch(
    '/:id',
    validateObjectId,
    validateIncidentMiddleware,
    incidentController.updateIncident
);

// Delete incident by ID
router.delete('/:id', validateObjectId, incidentController.deleteIncident);

// Add case discussion to incident
router.post(
    '/:id/discussion',
    validateObjectId,
    validateDiscussionMiddleware,
    incidentController.addDiscussion
);

module.exports = router;
