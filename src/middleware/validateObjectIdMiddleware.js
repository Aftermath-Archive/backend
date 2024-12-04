const mongoose = require('mongoose');

// Middleware to validate MongoDB ObjectId
function validateObjectIdMiddleware(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }
    next();
}

module.exports = validateObjectIdMiddleware;
