const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { registerNewUserService } = require('../services/authService');
const logError = require('../utils/logError');
const { User } = require('../models/userModel');

dotenv.config();

/**
 * Handles the registration of a new user. It calls the registerNewUserService function with the request body to register the user. If successful, it responds with status 201 and the user data in JSON format. If an error occurs during registration, it logs the error and responds with status 400 along with an error message in JSON format.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing the user data
 * @param {*} res The response object to send back the user data or error message
 * @returns {*} Handles registering a new user by calling the registerNewUserService with the request body. Responds with the user data if successful, or an error message if there is an error.
 */
async function handleRegisterUser(req, res) {
    try {
        const user = await registerNewUserService(req.body);
        res.status(201).json(user);
    } catch (error) {
        logError('Registering User', error);
        res.status(400).json({ message: error.message });
    }
}

/**
 * Handles the login process for a user.
 * - Retrieves the user object from the request.
 * - Generates a JWT token with the user's ID using the provided secret key.
 * - Sends a success response with a message and the generated token if successful.
 * - Logs any errors encountered during the process and sends an error response with the error message if there is an exception.
 * @author Xander
 *
 * @async
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns {*} Handles the login process for a user by generating a JWT token and responding with a success message or an error message
 */
async function handleLoginUser(req, res) {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '24h',
        });

        res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
        logError('Logging in user', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Handles the logout action for the user. It logs out the user by calling req.logout and sends a success or failure message based on the result.
 * @author Xander
 *
 * @async
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns {*} Handles user logout by calling req.logout and responds with success or error messages
 */
async function handleLogoutUser(req, res) {
    res.status(200).json({ message: 'Logged out successfully' });   
}

module.exports = {
    handleRegisterUser,
    handleLoginUser,
    handleLogoutUser,
};
