const AppError = require('../utils/AppError');

function paginationMiddleware(req, res, next) {
    const { page = '1', limit = '10' } = req.query;
    if (
        typeof page !== 'string' ||
        !/^[1-9]\d*$/.test(page) ||
        typeof limit !== 'string' ||
        !/^[1-9]\d*$/.test(limit) ||
        Number(page) > 10000 ||
        Number(limit) > 100
    ) {
        return next(
            new AppError('Page must be 1–10000 and limit must be 1–100.', 400)
        );
    }
    req.pagination = {
        page: Number(page),
        limit: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
    };
    next();
}
module.exports = paginationMiddleware;
