const { findUserByQueryService } = require("../services/userService");
const AppError = require("../utils/AppError");
const logError = require("../utils/logError");

async function validateUserExistsMiddleware(req, res, next) {
    try {
        const user = await findUserByQueryService({ _id: req.params.id });

        if (!user) throw new AppError('User not found.', 404);
        req.user = user;

        next();
    } catch (error) {
        logError('Error Validating user existence', error);
        next(error);
    }
}

module.exports = validateUserExistsMiddleware;