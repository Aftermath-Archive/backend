const AppError = require('../utils/AppError');
const { enums } = require('../utils/inputValidation');
function validateQueryMiddleware(req, res, next) {
    for (const [key, value] of Object.entries(req.query)) {
        if (
            /[[\].$]/.test(key) ||
            ['__proto__', 'constructor', 'prototype'].includes(key) ||
            typeof value !== 'string' ||
            value.length > 200
        ) {
            return next(
                new AppError(
                    'Query parameters must be bounded scalar values with plain field names.',
                    400
                )
            );
        }
        if (Object.hasOwn(enums, key) && !enums[key].includes(value))
            return next(new AppError('Invalid filter value.', 400));
    }
    next();
}
module.exports = validateQueryMiddleware;
