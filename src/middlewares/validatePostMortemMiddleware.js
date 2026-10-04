const { body, query, validationResult } = require('express-validator');

const reportFields = ['rootCause', 'impact', 'actionItems', 'lessonsLearned'];
const actionItemStatuses = ['Pending', 'In Progress', 'Completed'];

function returnValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

/** Validate the report body for either creation or a partial update. */
function reportValidation(isUpdate) {
    return [
        ...['rootCause', 'impact'].map((field) => {
            const validator = body(field);
            if (isUpdate) validator.optional();
            return validator
                .isString()
                .bail()
                .trim()
                .notEmpty()
                .withMessage(`${field} must be a non-empty string.`);
        }),
        body('lessonsLearned').optional().isString().bail().trim(),
        body('actionItems')
            .optional()
            .isArray()
            .withMessage('Action items must be an array.'),
        body('actionItems.*')
            .isObject({ strict: true })
            .withMessage('Each action item must be an object.'),
        body('actionItems.*.description')
            .isString()
            .bail()
            .trim()
            .notEmpty()
            .withMessage('Each action item requires a description.'),
        body('actionItems.*.status')
            .optional()
            .isString()
            .bail()
            .isIn(actionItemStatuses)
            .withMessage(
                'Action item status must be Pending, In Progress, or Completed.'
            ),
    ];
}

const validateCreatePostMortemMiddleware = [
    body('incidentId')
        .isString()
        .bail()
        .isMongoId()
        .withMessage('A valid incident ID is required.'),
    ...reportValidation(false),
    returnValidationErrors,
];

const validateUpdatePostMortemMiddleware = [
    body()
        .custom(
            (data) =>
                data && reportFields.some((field) => data[field] !== undefined)
        )
        .withMessage('At least one editable post-mortem field is required.'),
    ...reportValidation(true),
    returnValidationErrors,
];

/** Validate filters before pagination; ignore unsupported query parameters. */
const validatePostMortemQueryMiddleware = [
    query('page')
        .optional()
        .isString()
        .bail()
        .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
        .withMessage('Page must be a positive integer.'),
    query('limit')
        .optional()
        .isString()
        .bail()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100.'),
    ...['incidentId', 'createdBy'].map((field) =>
        query(field).optional().isString().bail().isMongoId()
    ),
    ...['search', 'rootCause', 'impact', 'lessonsLearned'].map((field) =>
        query(field).optional().isString().bail().trim()
    ),
    query('actionItemStatus')
        .optional()
        .isString()
        .bail()
        .isIn(actionItemStatuses),
    returnValidationErrors,
];

module.exports = {
    validateCreatePostMortemMiddleware,
    validateUpdatePostMortemMiddleware,
    validatePostMortemQueryMiddleware,
};
