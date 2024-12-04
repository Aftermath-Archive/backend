const { check, validationResult } = require('express-validator');

const validateIncident = [
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

module.exports = validateIncident;
