const logError = require('../utils/logError');
function errorHandlerMiddleware(error, req, res, next) {
    if (res.headersSent) return next(error);
    let status = error.isOperational ? error.statusCode || 400 : 500;
    let message = error.isOperational ? error.message : 'Internal server error';
    if (error.type === 'entity.parse.failed') {
        status = 400;
        message = 'Invalid JSON body.';
    }
    if (error.type === 'entity.too.large') {
        status = 413;
        message = 'Request body is too large.';
    }
    if (
        ['ValidationError', 'CastError', 'StrictModeError'].includes(error.name)
    ) {
        status = 400;
        message = 'Invalid request data.';
    }
    if (error.code === 11000) {
        status = 409;
        message = 'A record with those details already exists.';
    }
    if (status >= 500)
        logError(
            'Request failed',
            new Error('Unexpected server or database failure.')
        );
    res.status(status).json({ message });
}
module.exports = errorHandlerMiddleware;
