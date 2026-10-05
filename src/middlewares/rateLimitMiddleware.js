const { rateLimit } = require('express-rate-limit');

function createRateLimits(overrides = {}) {
    const options = {
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message: 'Too many requests. Please try again later.' },
    };
    return {
        api: rateLimit({
            ...options,
            windowMs: 5 * 60 * 1000,
            limit: 300,
            ...overrides.api,
        }),
        login: rateLimit({
            ...options,
            windowMs: 15 * 60 * 1000,
            limit: 20,
            ...overrides.login,
        }),
        register: rateLimit({
            ...options,
            windowMs: 60 * 60 * 1000,
            limit: 5,
            ...overrides.register,
        }),
        password: rateLimit({
            ...options,
            windowMs: 60 * 60 * 1000,
            limit: 10,
            ...overrides.password,
        }),
    };
}
module.exports = createRateLimits;
