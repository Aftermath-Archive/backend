const express = require('express');
const router = express.Router();
const postMortemController = require('../controllers/postMortemController');
const verifyTokenMiddleware = require('../middlewares/verifyTokenMiddleware');
const validateObjectIdMiddleware = require('../middlewares/validateObjectIdMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const {
    validateCreatePostMortemMiddleware,
    validateUpdatePostMortemMiddleware,
    validatePostMortemQueryMiddleware,
} = require('../middlewares/validatePostMortemMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PostMortemFields:
 *       type: object
 *       properties:
 *         rootCause:
 *           type: string
 *           minLength: 1
 *         impact:
 *           type: string
 *           minLength: 1
 *         lessonsLearned:
 *           type: string
 *           default: ''
 *         actionItems:
 *           type: array
 *           description: Replaces the entire array on update; omitted fields are unchanged. Replacement items receive new IDs.
 *           default: []
 *           items:
 *             type: object
 *             required: [description]
 *             properties:
 *               _id:
 *                 type: string
 *                 readOnly: true
 *               description:
 *                 type: string
 *                 minLength: 1
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed]
 *                 default: Pending
 *     CreatePostMortem:
 *       allOf:
 *         - $ref: '#/components/schemas/PostMortemFields'
 *         - type: object
 *           required: [incidentId, rootCause, impact]
 *           properties:
 *             incidentId:
 *               type: string
 *               pattern: '^[a-fA-F0-9]{24}$'
 *               description: MongoDB ID of an existing incident, regardless of status.
 *     PostMortem:
 *       allOf:
 *         - $ref: '#/components/schemas/CreatePostMortem'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               readOnly: true
 *             createdBy:
 *               type: string
 *               readOnly: true
 *               description: User ID from the JWT used to create the report. Never populated with user details.
 *             createdAt:
 *               type: string
 *               format: date-time
 *               readOnly: true
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               readOnly: true
 *             __v:
 *               type: integer
 *               readOnly: true
 *     PostMortemPage:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         postMortems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PostMortem'
 *     PostMortemError:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *     PostMortemValidationError:
 *       type: object
 *       required: [errors]
 *       properties:
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               value: {}
 *               msg:
 *                 type: string
 *               path:
 *                 type: string
 *               location:
 *                 type: string
 *   parameters:
 *     PostMortemId:
 *       in: path
 *       name: id
 *       required: true
 *       description: MongoDB ID of the post-mortem, not the incident.
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *     PostMortemPage:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 9007199254740991
 *         default: 1
 *     PostMortemLimit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *     PostMortemIncident:
 *       in: query
 *       name: incidentId
 *       description: Exact incident MongoDB ID; an absent report returns an empty page.
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *     PostMortemCreator:
 *       in: query
 *       name: createdBy
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *     PostMortemSearch:
 *       in: query
 *       name: search
 *       description: Case-insensitive literal substring across root cause, impact, lessons learned, and action item descriptions.
 *       schema:
 *         type: string
 *     PostMortemRootCause:
 *       in: query
 *       name: rootCause
 *       description: Case-insensitive literal substring.
 *       schema:
 *         type: string
 *     PostMortemImpact:
 *       in: query
 *       name: impact
 *       description: Case-insensitive literal substring.
 *       schema:
 *         type: string
 *     PostMortemLessons:
 *       in: query
 *       name: lessonsLearned
 *       description: Case-insensitive literal substring.
 *       schema:
 *         type: string
 *     PostMortemActionStatus:
 *       in: query
 *       name: actionItemStatus
 *       description: Matches reports with at least one action item in this status.
 *       schema:
 *         type: string
 *         enum: [Pending, In Progress, Completed]
 *   responses:
 *     PostMortemSuccess:
 *       description: Post-mortem document.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortem'
 *     PostMortemPageSuccess:
 *       description: A page sorted by createdAt descending, then _id descending. Filters are combined with AND.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemPage'
 *     PostMortemBadRequest:
 *       description: Invalid body, query, or ID. Validation errors use an errors array; invalid path IDs use a message.
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PostMortemError'
 *               - $ref: '#/components/schemas/PostMortemValidationError'
 *     PostMortemUnauthorized:
 *       description: No authorization token provided.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemError'
 *     PostMortemForbidden:
 *       description: Invalid or expired authorization token.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemError'
 *     PostMortemNotFound:
 *       description: Post-mortem or referenced incident not found.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemError'
 *     PostMortemConflict:
 *       description: A post-mortem already exists for this incident.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemError'
 *     PostMortemServerError:
 *       description: Database or unexpected server failure.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMortemError'
 * /post-mortems:
 *   post:
 *     summary: Create a post-mortem
 *     description: One report per existing incident. createdBy comes from the JWT; unsupported fields are ignored.
 *     tags: [Post-mortems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostMortem'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/PostMortemSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       401:
 *         $ref: '#/components/responses/PostMortemUnauthorized'
 *       403:
 *         $ref: '#/components/responses/PostMortemForbidden'
 *       404:
 *         $ref: '#/components/responses/PostMortemNotFound'
 *       409:
 *         $ref: '#/components/responses/PostMortemConflict'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 *   get:
 *     summary: List and filter post-mortems
 *     tags: [Post-mortems]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PostMortemPage'
 *       - $ref: '#/components/parameters/PostMortemLimit'
 *       - $ref: '#/components/parameters/PostMortemIncident'
 *       - $ref: '#/components/parameters/PostMortemCreator'
 *       - $ref: '#/components/parameters/PostMortemSearch'
 *       - $ref: '#/components/parameters/PostMortemRootCause'
 *       - $ref: '#/components/parameters/PostMortemImpact'
 *       - $ref: '#/components/parameters/PostMortemLessons'
 *       - $ref: '#/components/parameters/PostMortemActionStatus'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/PostMortemPageSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 */
router.post(
    '/',
    verifyTokenMiddleware,
    validateCreatePostMortemMiddleware,
    postMortemController.handleCreatePostMortem
);

router.get(
    '/',
    validatePostMortemQueryMiddleware,
    paginationMiddleware,
    postMortemController.handleGetAllPostMortems
);

/**
 * @swagger
 * /post-mortems/search:
 *   get:
 *     summary: Search post-mortems
 *     description: Alias of GET /post-mortems with the same filters and response shape.
 *     tags: [Post-mortems]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PostMortemPage'
 *       - $ref: '#/components/parameters/PostMortemLimit'
 *       - $ref: '#/components/parameters/PostMortemIncident'
 *       - $ref: '#/components/parameters/PostMortemCreator'
 *       - $ref: '#/components/parameters/PostMortemSearch'
 *       - $ref: '#/components/parameters/PostMortemRootCause'
 *       - $ref: '#/components/parameters/PostMortemImpact'
 *       - $ref: '#/components/parameters/PostMortemLessons'
 *       - $ref: '#/components/parameters/PostMortemActionStatus'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/PostMortemPageSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 */
// Keep /search before /:id so it is not interpreted as a MongoDB ID.
router.get(
    '/search',
    validatePostMortemQueryMiddleware,
    paginationMiddleware,
    postMortemController.handleGetAllPostMortems
);

/**
 * @swagger
 * /post-mortems/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/PostMortemId'
 *   get:
 *     summary: Get a post-mortem by ID
 *     tags: [Post-mortems]
 *     security: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/PostMortemSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       404:
 *         $ref: '#/components/responses/PostMortemNotFound'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 *   patch:
 *     summary: Update a post-mortem
 *     description: At least one report field is required. incidentId, createdBy, IDs, timestamps, and unsupported fields are ignored. Any authenticated user can update a report.
 *     tags: [Post-mortems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/PostMortemFields'
 *               - type: object
 *                 anyOf:
 *                   - required: [rootCause]
 *                   - required: [impact]
 *                   - required: [actionItems]
 *                   - required: [lessonsLearned]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/PostMortemSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       401:
 *         $ref: '#/components/responses/PostMortemUnauthorized'
 *       403:
 *         $ref: '#/components/responses/PostMortemForbidden'
 *       404:
 *         $ref: '#/components/responses/PostMortemNotFound'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 *   delete:
 *     summary: Delete a post-mortem
 *     description: Returns the deleted report and leaves its incident intact. Any authenticated user can delete a report.
 *     tags: [Post-mortems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/PostMortemSuccess'
 *       400:
 *         $ref: '#/components/responses/PostMortemBadRequest'
 *       401:
 *         $ref: '#/components/responses/PostMortemUnauthorized'
 *       403:
 *         $ref: '#/components/responses/PostMortemForbidden'
 *       404:
 *         $ref: '#/components/responses/PostMortemNotFound'
 *       500:
 *         $ref: '#/components/responses/PostMortemServerError'
 */
router.get(
    '/:id',
    validateObjectIdMiddleware,
    postMortemController.handleGetPostMortemById
);
router.patch(
    '/:id',
    verifyTokenMiddleware,
    validateObjectIdMiddleware,
    validateUpdatePostMortemMiddleware,
    postMortemController.handleUpdatePostMortem
);
router.delete(
    '/:id',
    verifyTokenMiddleware,
    validateObjectIdMiddleware,
    postMortemController.handleDeletePostMortem
);

module.exports = router;
