const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incidentController');

const validateIncidentMiddleware = require('../middlewares/validateIncidentMiddleware');
const validateDiscussionMiddleware = require('../middlewares/validateDiscussionMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectIdMiddleware = require('../middlewares/validateObjectIdMiddleware');

// Create a new incident
router.post(
    '/',
    validateIncidentMiddleware,
    incidentController.handleCreateIncident
);

// Get all incidents with pagination
router.get('/', paginationMiddleware, incidentController.handleGetAllIncidents);

// Search and filter incidents
router.get(
    '/search',
    // paginationMiddleware,
    incidentController.handleSearchIncidents
);

// Get Incident by ID
router.get(
    '/:id',
    validateObjectIdMiddleware,
    incidentController.handleGetIncidentById
);

// Update incident by ID
router.patch(
    '/:id',
    validateObjectIdMiddleware,
    // validateIncidentMiddleware,
    incidentController.handleUpdateIncident
);

// Delete incident by ID
router.delete(
    '/:id',
    validateObjectIdMiddleware,
    incidentController.handleDeleteIncident
);

// Add case discussion to incident
router.post(
    '/:id/discussion',
    validateObjectIdMiddleware,
    validateDiscussionMiddleware,
    incidentController.handleAddDiscussion
);

module.exports = router;
