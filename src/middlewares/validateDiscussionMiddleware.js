const { check, validationResult } = require('express-validator');

// Middleware to validate discussion input
const validateDiscussionMiddleware = [
    check('message').notEmpty().withMessage('Message is required.'),
    check('author').notEmpty().withMessage('Author is required.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = validateDiscussionMiddleware;
