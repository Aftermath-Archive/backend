const express = require('express');
const router = express.Router();

const verifyTokenMiddleware = require('../middlewares/verifyTokenMiddleware');
const validateObjectIdMiddleware = require('../middlewares/validateObjectIdMiddleware');
const {
    requireAdmin,
    requireSelfOrAdmin,
} = require('../middlewares/authorizationMiddleware');
const { validateBody, userUpdateInput } = require('../utils/inputValidation');
router.use(verifyTokenMiddleware);

const userController = require('../controllers/userController');
const paginationMiddleware = require('../middlewares/paginationMiddleware');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Admin-only account directory with safe responses and bounded pagination.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: A list of users.
 *       400:
 *         description: Bad request.
 */
router.get(
    '/',
    requireAdmin,
    paginationMiddleware,
    userController.handleGetAllUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Requires login. Self/admin receive safe account fields; other members receive display profile fields only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user.
 *     responses:
 *       200:
 *         description: The user data.
 *       404:
 *         description: User not found.
 *       400:
 *         description: Bad request.
 */
router.get(
    '/:id',
    validateObjectIdMiddleware,
    userController.handleGetUserById
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user by ID
 *     description: Self or admin may edit username, email and profile. Password changes require the current password and are self-only; role and lifecycle fields cannot be changed.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Updated username.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password; requires currentPassword on your own account.
 *               currentPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       404:
 *         description: User not found.
 *       400:
 *         description: Bad request.
 */

router.patch(
    '/:id',
    validateObjectIdMiddleware,
    requireSelfOrAdmin,
    validateBody(userUpdateInput),
    userController.handleUpdateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Self or admin may deactivate an account. Tokens are immediately invalidated.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       400:
 *         description: Bad request.
 */
router.delete(
    '/:id',
    validateObjectIdMiddleware,
    requireSelfOrAdmin,
    userController.handleDeleteUser
);

module.exports = router;
