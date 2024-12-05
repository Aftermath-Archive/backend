const { check, validationResult } = require('express-validator');


/**
 * Middleware function to validate an incident. It checks if the incident title and description are not empty, and the environment is one of Production, Staging, or Development. If validation fails, it returns a 400 error with the validation errors. If validation passes, it calls the next middleware function.
 * @author Xander
 *
 * @type {{}}
 */
const validateIncidentMiddleware = [
    check('title').notEmpty().withMessage('Title is required.'),
    check('description').notEmpty().withMessage('Description is required.'),
    check('environment')
        .isIn(['Production', 'Staging', 'Development'])
        .withMessage(
            'Environment must be one of Production, Staging, or Development.'
        ),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = validateIncidentMiddleware;
