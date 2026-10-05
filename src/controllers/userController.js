const logError = require('../utils/logError');

const {
    updateUserByQueryService,
    deleteUserByQueryService,
    findAllUsersService,
} = require('../services/userService');

/**
 * Handles the GET request to retrieve all users with pagination. Retrieves the page and limit from the request pagination object. Calls the findAllUsersService function with an empty query to get all users based on the given page and limit. If successful, responds with status 200 and returns the users in JSON format. If an error occurs, logs the error message and responds with status 400 along with an error message in JSON format.
 * @author Xander
 *
 * @async
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns {*} Handles an asynchronous request to get all users with pagination. Paginates through the list of users based on the provided page and limit parameters in the request object, and responds with a JSON object containing the users. If an error occurs during the process, logs the error and responds with a JSON object indicating the error status and message.
 */
async function handleGetAllUsers(req, res) {
    try {
        const { page, limit } = req.pagination;

        const users = await findAllUsersService(
            {}, // empty query to get all Users
            { page, limit }
        );

        res.status(200).json(users);
    } catch (error) {
        logError('Fetching all users with pagination', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
}

/**
 * Asynchronously handles the GET request to retrieve a user by their ID. The user must be validated and already added to the request object by the validateUserExists middleware. If successful, responds with status code 200 and the user data in JSON format. If an error occurs, logs the error as 'Finding user by ID', sets the response status to 500, and returns a JSON object with an error message 'Internal server error'.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing user ID
 * @param {*} res The response object used to send user data or error message
 * @returns {*} Handles the request to get a user by ID. The user is already validated and added to the request object. Returns the user data in the response with status code 200 if successful. If an error occurs, logs the error and sends a status code of 500 with an error message in the response.
 */
async function handleGetUserById(req, res) {
    try {
        // The user is already validated and added to req.user by validateUserExists middleware
        res.status(200).json(req.user);
    } catch (error) {
        logError('Finding user by ID', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
}

/**
 * Asynchronous function that handles updating a user. The user to be updated is already validated and added to the request object in the validateUserExists middleware. It updates the user by querying the database using the user's ID from the request object. If successful, it responds with the updated user data in JSON format with status code 200. If an error occurs during the update process, it logs the error using the logError function and responds with a status code of 500 along with an error message in JSON format.
 * @author Xander
 *
 * @async
 * @param {*} req The HTTP request object containing user information
 * @param {*} res The HTTP response object for sending the response to the client
 * @returns {*} A function that handles updating a user based on the request body and the user ID stored in the request object. Returns the updated user as a JSON response. Handles errors by logging and sending a 500 status with an error message.
 */
async function handleUpdateUser(req, res) {
    try {
        // The user is already validated and added to req.user by validateUserExists middleware
        const updatedUser = await updateUserByQueryService(
            { _id: req.user._id },
            req.body
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        logError('Updating User by ID', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
}

/**
 * Handles the deletion of a user by ID. The user to be deleted is already validated and added to the request object (req) by the validateUserExists middleware. If successful, responds with a status of 200 and JSON data of the deleted user. If an error occurs during the deletion process, logs the error and responds with a status of 500 along with an error message.
 * @author Xander
 *
 * @async
 * @param {*} req Request object containing user information
 * @param {*} res Response object for sending the result
 * @returns {*} A function that handles the deletion of a user by ID. The user must be validated and added to the request object by the validateUserExists middleware. It uses the deleteUserByQueryService function to delete the user based on the provided ID. Returns a JSON response with the deleted user data if successful, or an error message with status code 500 if an error occurs.
 */
async function handleDeleteUser(req, res) {
    try {
        // The user is already validated and added to req.user by validateUserExists middleware
        const deletedUser = await deleteUserByQueryService({
            _id: req.user._id,
        });
        res.status(200).json(deletedUser);
    } catch (error) {
        logError('Deleting user by ID', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
}

module.exports = {
    handleGetAllUsers,
    handleGetUserById,
    handleUpdateUser,
    handleDeleteUser,
};
