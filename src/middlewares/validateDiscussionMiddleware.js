const { body, validationResult } = require('express-validator');

/**
 * Validate the discussion message. Its author comes from authentication.
 * @author Xander
 *
 * @type {{}}
 */
const validateDiscussionMiddleware = [
    body('message')
        .isString()
        .bail()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be 1–2000 characters.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(400)
                .json({
                    errors: errors
                        .array()
                        .map((error) => ({
                            msg: error.msg,
                            path: error.path,
                            location: error.location,
                        })),
                });
        }
        next();
    },
];

module.exports = validateDiscussionMiddleware;
