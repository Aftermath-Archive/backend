
/**
 * A middleware function that calculates pagination parameters based on the request query parameters 'page' and 'limit'. It assigns the calculated 'page', 'limit', and 'skip' values to the request object and proceeds to the next middleware in the chain.
 * @author Xander
 *
 * @param {*} req The request object
 * @param {*} res The response object
 * @param {*} next The next function to be called in the middleware chain
 */
function paginationMiddleware(req, res, next) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    req.pagination = { page, limit, skip };
    next();
}

module.exports = paginationMiddleware;
