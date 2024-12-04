const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incidentController');

const validateIncidentMiddleware = require('../middlewares/validateIncidentMiddleware');
const validateDiscussionMiddleware = require('../middlewares/validateDiscussionMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectIdMiddleware = require('../middlewares/validateObjectIdMiddleware');

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Create a new incident
 *     description: Add a new incident to the system.
 *     tags: [Incidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               environment:
 *                 type: string
 *                 enum: [Production, Staging, Development]
 *               createdBy:
 *                 type: string
 *                 description: User ID of the creator
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Bad request, invalid input data
 */
router.post(
    '/',
    validateIncidentMiddleware,
    incidentController.handleCreateIncident
);

/**
 * @swagger
 * /incidents:
 *   get:
 *     summary: Get all incidents
 *     description: Fetch a paginated list of all incidents.
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: A list of incidents
 *       400:
 *         description: Bad request
 */
router.get('/', paginationMiddleware, incidentController.handleGetAllIncidents);

/**
 * @swagger
 * /incidents/search:
 *   get:
 *     summary: Search incidents
 *     description: Search and filter incidents by fields like title, severity, and more.
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Search by title (case-insensitive)
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity (e.g., Low, Medium, High, Critical)
 *     responses:
 *       200:
 *         description: A list of filtered incidents
 *       400:
 *         description: Bad request
 */
router.get('/search', incidentController.handleSearchIncidents);

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     description: Fetch a specific incident by its unique ID.
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the incident
 *     responses:
 *       200:
 *         description: Incident details
 *       404:
 *         description: Incident not found
 */
router.get(
    '/:id',
    validateObjectIdMiddleware,
    incidentController.handleGetIncidentById
);

/**
 * @swagger
 * /incidents/{id}:
 *   patch:
 *     summary: Update an incident
 *     description: Modify the details of an existing incident.
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Incident not found
 */
router.patch(
    '/:id',
    validateObjectIdMiddleware,
    incidentController.handleUpdateIncident
);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     description: Remove an incident from the system by its unique ID.
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the incident
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *       404:
 *         description: Incident not found
 */
router.delete(
    '/:id',
    validateObjectIdMiddleware,
    incidentController.handleDeleteIncident
);

/**
 * @swagger
 * /incidents/{id}/discussion:
 *   post:
 *     summary: Add discussion to an incident
 *     description: Add a case discussion (comment) to an incident.
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The discussion message
 *               author:
 *                 type: string
 *                 description: The user ID of the author
 *     responses:
 *       200:
 *         description: Discussion added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Incident not found
 */
router.post(
    '/:id/discussion',
    validateObjectIdMiddleware,
    validateDiscussionMiddleware,
    incidentController.handleAddDiscussion
);

module.exports = router;
