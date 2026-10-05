const { check, validationResult } = require('express-validator');


/**
 * Validate the discussion message. Its author comes from authentication.
 * @author Xander
 *
 * @type {{}}
 */
const validateDiscussionMiddleware = [
    check('message').isString().bail().trim().notEmpty().withMessage('Message is required.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = validateDiscussionMiddleware;
