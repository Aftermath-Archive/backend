// Provide CRUD operations for Users
const AppError = require('../utils/AppError'); // if not otherwise specified returns 400 status code

const { User } = require('../models/userModel');

const bcrypt = require('bcrypt');

// createNewUserService
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

// findUserByQueryService
async function findUserByQueryService(query) {
    try {
        const result = await User.findOne(query);

        if (!result) {
            throw new AppError('User not found');
        }

        return result;
    } catch (error) {
        console.error('Error finding user:', error);
        throw new AppError('Error finding user');
    }
}

// TODO

// findUsersByQueryService

// updateUserByQueryService

// deleteUserByQueryService

module.exports = {
    createNewUserService,
    findUserByQueryService,
    // findUsersByQueryService,
    // updateUserByQueryService,
    // deleteUserByQueryService,
};
