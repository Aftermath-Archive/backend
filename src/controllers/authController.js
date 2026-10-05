const bcrypt = require('bcrypt');
const { generateJWT } = require('../functions/jwtFunctions');
const { registerNewUserService } = require('../services/authService');
const { User } = require('../models/userModel');
// Equal-cost verification for absent accounts avoids a fast username oracle.
const DUMMY_PASSWORD_HASH =
    '$2b$12$XUO6B92JIKZHJmzczgoMNOWhKi/Gf3mZtv9U6Fc.5ZAM9O5ozkLEC';
async function handleRegisterUser(req, res) {
    res.status(201).json(await registerNewUserService(req.validatedBody));
}
async function handleLoginUser(req, res) {
    const { username, password } = req.body || {};
    if (
        typeof username !== 'string' ||
        !username.trim() ||
        username.length > 64 ||
        typeof password !== 'string' ||
        !password ||
        Buffer.byteLength(password) > 72
    ) {
        return res
            .status(400)
            .json({ message: 'Invalid username or password' });
    }
    const user = await User.findOne(
        { username: username.trim() },
        '+password +tokenVersion'
    );
    const matches = await bcrypt.compare(
        password,
        user?.password || DUMMY_PASSWORD_HASH
    );
    if (!user || user.isActive !== true || !matches) {
        return res
            .status(400)
            .json({ message: 'Invalid username or password' });
    }
    user.lastLogin = new Date();
    await user.save();
    res.json({
        message: 'Logged in successfully',
        token: generateJWT(user._id, user.tokenVersion || 0),
    });
}
async function handleLogoutUser(req, res) {
    res.json({ message: 'Logged out successfully' });
}
module.exports = { handleRegisterUser, handleLoginUser, handleLogoutUser };
