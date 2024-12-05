const { check, validationResult } = require('express-validator');


/**
 * Middleware function to validate discussion message and author before proceeding further. It checks if the message and author fields are not empty, and returns an error response with an array of validation errors if either of them is empty. It calls the next function if validation passes.
 * @author Xander
 *
 * @type {{}}
 */
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
