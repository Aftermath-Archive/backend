// Provide CRUD operations for Users
const AppError = require('../utils/AppError'); // if not otherwise specified returns 400 status code

const { User } = require('../models/userModel');

const bcrypt = require('bcrypt');

/**
 * Asynchronously creates a new user service. Validates the input user object to ensure it contains required fields (username, email, and password). Checks if the email or username already exists in the database. Hashes the user's password using bcrypt. Creates a new user in the database with the hashed password. Removes sensitive fields from the user object before returning. Handles any errors that occur during the process and logs them. Throws an AppError if there are missing required fields, user already exists, or any other error during user creation.
 * @author Xander
 *
 * @async
 * @param {*} user async function to create a new user service
 * @returns {unknown} Creates a new user service asynchronously. Validates the input user object for required fields (username, email, password). Checks if the user with the provided email or username already exists. Hashes the password using bcrypt. Creates a new user with the provided username, email, and hashed password. Removes sensitive fields from the user object before returning. Throws an error if any validation or creation step fails.
 */
async function createNewUserService(user) {
    try {
        // Validate input
        if (!user.username || !user.email || !user.password) {
            throw new AppError('Missing required fields');
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

/**
 * Asynchronous function that finds a user by the provided query. It uses the User model to perform the search and throws an error if the user is not found or if an error occurs. Returns the found user if successful.
 * @author Xander
 *
 * @async
 * @param {*} query
 * @returns {unknown} Asynchronously finds a user based on the provided query. If the user is not found, it throws an 'AppError'. If an error occurs during the process, it logs the error and throws an 'AppError' as well.
 */
async function findUserByQueryService(query, projection = { password: 0 }) {
    try {
        const result = await User.findOne(query, projection);

        if (!result) {
            throw new AppError('User not found', 404);
        }

        return result;
    } catch (error) {
        console.error(
            `Error finding user with query: ${JSON.stringify(query)}`,
            error
        );
        throw new AppError('Error finding user', 500);
    }
}

/**
 * Updates a user based on the provided query by sanitizing the update data, excluding sensitive fields such as _id and password. Returns the updated user object. Throws an error if no user is found to update or if the update fails.
 * @param query The query to find the user to update.
 * @param updateData The data to update the user with.
 * @returns The updated user object.
 * @throws {AppError} If no user is found or if the update fails.
 * @author Xander
 *
 * @async
 * @param {*} query The query to find and update the user
 * @param {*} updateData The data to update the user
 * @returns {unknown} Updates a user in the database by the provided query and sanitized update data. Removes sensitive fields like '_id' and 'password' from the update data. Returns the updated user object. Throws an error if no user is found to update or if the update operation fails.
 */
async function updateUserByQueryService(query, updateData) {
    try {
        // Remove sensitive fields from the updateData
        const sanitizedUpdateData = { ...updateData };
        delete sanitizedUpdateData._id;
        delete sanitizedUpdateData.password;

        const result = await User.findOneAndUpdate(query, sanitizedUpdateData, {
            new: true,
            runValidators: true,
            projection: { password: 0 }, // Exclude sensitive fields from the result
        });

        if (!result) {
            throw new AppError('No User found to update.', 404);
        }

        return result;
    } catch (error) {
        console.error(
            `Error updating user with query: ${JSON.stringify(query)}`,
            error
        );
        throw new AppError('Failed to update User.', 500);
    }
}

/**
 * Deletes a user from the database based on the provided query. If the user is found, it is updated to set isActive to false and deletedAt to the current date. If no user is found, an AppError with status code 404 is thrown. If an error occurs during the deletion process, an AppError with status code 500 is thrown.
 * @author Xander
 *
 * @async
 * @param {*} query The query to find and delete the user
 * @returns {unknown} Deletes a user in the database based on the provided query. Sets the 'isActive' field to false and 'deletedAt' field to the current date for the deleted user. Throws an AppError with status code 404 if no user is found for the given query. Throws an AppError with status code 500 if there is an error while deleting the user.
 */
async function deleteUserByQueryService(query) {
    try {
        const result = await User.findOne(query);

        if (!result) {
            throw new AppError('No User found to delete.', 404);
        }

        if (!result.isActive) {
            throw new AppError('User is already deactivated.');
        }

        // Soft delete user
        result.isActive = false;
        result.deletedAt = new Date();
        await result.save();

        // Remove sensitive fields before returning
        const safeUser = result.toObject();
        delete safeUser.password;
        return safeUser;
    } catch (error) {
        console.error(
            `Error deleting user with query: ${JSON.stringify(query)}`,
            error
        );
        throw new AppError('Failed to delete User.', 500);
    }
}

module.exports = {
    createNewUserService,
    findUserByQueryService,
    updateUserByQueryService,
    deleteUserByQueryService,
};
