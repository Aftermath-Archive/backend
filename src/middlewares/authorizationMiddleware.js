const AppError = require('../utils/AppError');
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'Admin')
        return next(new AppError('Forbidden.', 403));
    next();
}
function requireSelfOrAdmin(req, res, next) {
    if (
        req.user?.role !== 'Admin' &&
        req.userId !== req.params.id.toLowerCase()
    ) {
        return next(new AppError('Forbidden.', 403));
    }
    next();
}
module.exports = { requireAdmin, requireSelfOrAdmin };
