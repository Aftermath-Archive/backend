const AppError = require('../utils/AppError'); // if not otherwise specified returns 400 status code

const { User } = require('../models/userModel');

const bcrypt = require('bcrypt');
const validatePassword = require('../utils/validatePassword');

/**
 * Asynchronously creates a new user service. Validates the input user object to ensure it contains required fields (username, email, and password). Checks if the email or username already exists in the database. Hashes the user's password using bcrypt. Creates a new user in the database with the hashed password. Removes sensitive fields from the user object before returning. Handles any errors that occur during the process and logs them. Throws an AppError if there are missing required fields, user already exists, or any other error during user creation.
 * @author Xander
 *
 * @async
 * @param {*} user async function to create a new user service
 * @returns {unknown} Creates a new user service asynchronously. Validates the input user object for required fields (username, email, password). Checks if the user with the provided email or username already exists. Hashes the password using bcrypt. Creates a new user with the provided username, email, and hashed password. Removes sensitive fields from the user object before returning. Throws an error if any validation or creation step fails.
 */
async function registerNewUserService(user) {
    try {
        // Validate input
        if (!user.username || !user.email || !user.password) {
            throw new AppError('Missing required fields');
        }

        // Validate the password before hashing
        if (!validatePassword(user.password)) {
            throw new AppError(
                'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.'
            );
        }

        // Check if email or username already exists
        const existingUser = await User.findOne({
            $or: [{ email: user.email }, { username: user.username }],
        });

        if (existingUser) {
            const errorMessage =
                existingUser.email === user.email
                    ? 'User already exists'
                    : 'Username already taken';
            throw new AppError(errorMessage);
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Create user
        const newUser = await User.create({
            username: user.username,
            email: user.email,
            password: hashedPassword,
        });

        // Remove sensitive fields before returning
        const safeUser = newUser.toObject();
        delete safeUser.password;
        return safeUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new AppError('Error creating user', error.statusCode || 500);
    }
}

module.exports = {
    registerNewUserService,
};
