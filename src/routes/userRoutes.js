const express = require('express');
const router = express.Router();

const validateUserExistsMiddleware = require('../middlewares/validateUserExistsMiddleware');

const userController = require('../controllers/userController');
const paginationMiddleware = require('../middlewares/paginationMiddleware');


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Fetch a paginated list of all users.
 *     tags: [Users]
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
router.get('/', paginationMiddleware, userController.handleGetAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve a user by their unique ID.
 *     tags: [Users]
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
    validateUserExistsMiddleware,
    userController.handleGetUserById
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user by ID
 *     description: Update a user's information by their unique ID.
 *     tags: [Users]
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
 *                 description: Updated password.
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
    validateUserExistsMiddleware,
    userController.handleUpdateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Soft delete a user by marking them as inactive.
 *     tags: [Users]
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
    validateUserExistsMiddleware,
    userController.handleDeleteUser
);

module.exports = router;
