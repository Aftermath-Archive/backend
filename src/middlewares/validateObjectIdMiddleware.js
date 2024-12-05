const mongoose = require('mongoose');


/**
 * Middleware function that validates if the provided object ID in the request parameters is in a valid format. If the ID is not valid, it returns a response with a status code of 400 and a message indicating that the ID format is invalid. Otherwise, it calls the next middleware function in the chain.
 * @author Xander
 *
 * @param {*} req The request object
 * @param {*} res The response object
 * @param {*} next The next function to call
 * @returns {*} Validates if the request parameter 'id' is in a valid ObjectId format using mongoose. If not valid, returns a 400 status with a message 'Invalid ID format' in JSON format. Calls the next middleware function if the ID is valid.
 */
function validateObjectIdMiddleware(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }
    next();
}

module.exports = validateObjectIdMiddleware;
