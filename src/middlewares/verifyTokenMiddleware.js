const { verifyJWT, extractBearerToken } = require('../functions/jwtFunctions');
const { User } = require('../models/userModel');
const logError = require('../utils/logError');

const verifyTokenMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = extractBearerToken(authHeader);
    let payload;
    try {
        payload = verifyJWT(token);
    } catch {
        return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    try {
        const user = await User.findById(payload.id);
        if (!user || user.isActive !== true) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = user;
        req.userId = String(user._id);
        next();
    } catch (error) {
        logError('Authenticating user', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = verifyTokenMiddleware;
