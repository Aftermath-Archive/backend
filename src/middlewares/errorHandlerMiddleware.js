const logError = require('../utils/logError');

function errorHandlerMiddleware(err, req, res ) {
    logError(err.message, err);

    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            status: 'error',
            message: err.message,
        });
    }

    // Catch all for unknown or unexpected errors
    console.error('Unexpected Error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong.',
    });
}

module.exports = errorHandlerMiddleware;
