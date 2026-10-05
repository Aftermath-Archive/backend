const { verifyJWT, extractBearerToken } = require('../functions/jwtFunctions');
const { User } = require('../models/userModel');

const verifyTokenMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'No token provided' });

    const token = extractBearerToken(authHeader);
    let payload;
    try {
        payload = verifyJWT(token);
    } catch {
        return res
            .status(403)
            .json({ message: 'Failed to authenticate token' });
    }

    try {
        const user = await User.findById(payload.id, '+tokenVersion');
        if (
            !user ||
            user.isActive !== true ||
            (payload.version ?? 0) !== (user.tokenVersion ?? 0)
        ) {
            return res
                .status(403)
                .json({ message: 'Failed to authenticate token' });
        }
        req.user = user;
        req.userId = String(user._id);
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = verifyTokenMiddleware;
