// Provide RUD operations for Users
// Creation for User handled by Auth

const AppError = require('../utils/AppError'); // if not otherwise specified returns 400 status code

const { User } = require('../models/userModel');

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
 * Asynchronously finds all users with pagination support. It retrieves a specified page of users with a specified limit per page. If successful, it returns an object containing the total number of users, the current page number, the limit per page, and the array of users. If an error occurs during the process, it logs an error message and throws an AppError with a 500 status code.
 * @author Xander
 *
 * @async
 * @param {{ page: any; limit: any; }} param0 An object containing parameters for finding all users
 * @param {*} param0.page The page number for pagination
 * @param {*} param0.limit The maximum number of users to return per page
 * @returns {unknown} This asynchronous function fetches all users based on the provided page and limit parameters. It returns an object containing the total number of users, the current page number, the limit of users per page, and an array of user objects. In case of an error, it logs the error message and throws an AppError with a 500 status code.
 */
async function findAllUsersService({ page, limit }) {
    try {
        const skip = (page - 1) * limit;
        const users = await User.find().skip(skip).limit(limit);
        const total = await User.countDocuments();

        return {
            total,
            page,
            limit,
            users,
        };
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw new AppError('Failed to fetch users.', 500);
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
    findUserByQueryService,
    findAllUsersService,
    updateUserByQueryService,
    deleteUserByQueryService,
};
