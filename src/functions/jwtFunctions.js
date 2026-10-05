const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const JWT_LIFETIME_SECONDS = 24 * 60 * 60;

function getJwtSecretKey() {
    const secret = process.env.JWT_SECRET_KEY;
    if (typeof secret !== 'string' || !secret.trim()) {
        throw new Error('JWT_SECRET_KEY must be configured.');
    }
    return secret;
}

function getJwtUserId(payload) {
    if (
        !payload ||
        typeof payload !== 'object' ||
        typeof payload.id !== 'string' ||
        !/^[a-fA-F0-9]{24}$/.test(payload.id) ||
        typeof payload.exp !== 'number' ||
        !Number.isFinite(payload.exp) ||
        (payload.version !== undefined &&
            (!Number.isSafeInteger(payload.version) || payload.version < 0))
    ) {
        throw new jwt.JsonWebTokenError('Invalid access token claims.');
    }
    return payload.id;
}

/** Issue the id claim and 24-hour lifetime used by /auth/login. */
function generateJWT(userId, version = 0) {
    const id = String(userId);
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        throw new TypeError('A valid user ID is required.');
    }
    if (!Number.isSafeInteger(version) || version < 0)
        throw new TypeError('Invalid token version.');
    return jwt.sign({ id, version }, getJwtSecretKey(), {
        algorithm: JWT_ALGORITHM,
        expiresIn: JWT_LIFETIME_SECONDS,
    });
}

/** Verify signature and expiry before reading identity claims. */
function verifyJWT(token) {
    const payload = jwt.verify(token, getJwtSecretKey(), {
        algorithms: [JWT_ALGORITHM],
    });
    getJwtUserId(payload);
    return payload;
}

function extractBearerToken(authHeader) {
    if (typeof authHeader !== 'string') return null;
    const match = /^Bearer[ \t]+([^\s]+)$/i.exec(authHeader.trim());
    return match ? match[1] : null;
}

module.exports = {
    JWT_ALGORITHM,
    getJwtSecretKey,
    getJwtUserId,
    generateJWT,
    verifyJWT,
    extractBearerToken,
};
