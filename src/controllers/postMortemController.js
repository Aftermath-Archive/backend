const { matchedData } = require('express-validator');
const logError = require('../utils/logError');
const {
    createPostMortem,
    findPostMortemByQueryService,
    findPostMortemsByQueryService,
    updatePostMortemByQueryService,
    deletePostMortemByQueryService,
} = require('../services/postMortemService');

function respondWithError(res, action, error) {
    logError(action, error);
    res.status(error.statusCode || 500).json({
        message: error.isOperational ? error.message : 'Something went wrong.',
    });
}

/** Create a report using the authenticated user's ID for attribution. */
async function handleCreatePostMortem(req, res) {
    try {
        const postMortem = await createPostMortem({
            ...matchedData(req, { locations: ['body'] }),
            createdBy: req.userId,
        });
        res.status(201).json(postMortem);
    } catch (error) {
        respondWithError(res, 'Creating post-mortem', error);
    }
}

/** Both list and search return a paginated collection of reports. */
async function handleGetAllPostMortems(req, res) {
    try {
        const postMortems = await findPostMortemsByQueryService(
            matchedData(req, { locations: ['query'] }),
            req.pagination
        );
        res.status(200).json(postMortems);
    } catch (error) {
        respondWithError(res, 'Fetching post-mortems', error);
    }
}

async function handleGetPostMortemById(req, res) {
    try {
        const postMortem = await findPostMortemByQueryService({
            _id: req.params.id,
        });
        res.status(200).json(postMortem);
    } catch (error) {
        respondWithError(res, 'Finding post-mortem by ID', error);
    }
}

async function handleUpdatePostMortem(req, res) {
    try {
        const postMortem = await updatePostMortemByQueryService(
            { _id: req.params.id },
            matchedData(req, { locations: ['body'] })
        );
        res.status(200).json(postMortem);
    } catch (error) {
        respondWithError(res, 'Updating post-mortem', error);
    }
}

async function handleDeletePostMortem(req, res) {
    try {
        const postMortem = await deletePostMortemByQueryService({
            _id: req.params.id,
        });
        res.status(200).json(postMortem);
    } catch (error) {
        respondWithError(res, 'Deleting post-mortem', error);
    }
}

module.exports = {
    handleCreatePostMortem,
    handleGetAllPostMortems,
    handleGetPostMortemById,
    handleUpdatePostMortem,
    handleDeletePostMortem,
};
