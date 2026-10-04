const { PostMortem } = require('../models/postmortemModel');
const { Incident } = require('../models/incidentModel');
const AppError = require('../utils/AppError');

/**
 * Preserve expected API errors and translate database errors into safe responses.
 */
function handlePostMortemError(error, message) {
    if (error.isOperational) throw error;
    if (error.code === 11000) {
        throw new AppError(
            'A post-mortem already exists for this incident.',
            409
        );
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new AppError('Invalid post-mortem data.', 400);
    }
    throw new AppError(message, 500);
}

/** Only allow report fields to change; identifiers and attribution are immutable. */
function getReportFields(data) {
    const fields = {};
    for (const field of ['rootCause', 'impact', 'lessonsLearned']) {
        if (data[field] !== undefined) fields[field] = data[field];
    }
    if (data.actionItems !== undefined) {
        fields.actionItems = data.actionItems.map(
            ({ description, status }) => ({
                description,
                ...(status !== undefined ? { status } : {}),
            })
        );
    }
    return fields;
}

/** Create one post-mortem for an existing incident, attributed to the caller. */
async function createPostMortem(data) {
    try {
        if (!(await Incident.exists({ _id: data.incidentId }))) {
            throw new AppError('Incident not found.', 404);
        }
        if (await PostMortem.exists({ incidentId: data.incidentId })) {
            throw new AppError(
                'A post-mortem already exists for this incident.',
                409
            );
        }
        return await PostMortem.create({
            ...getReportFields(data),
            incidentId: data.incidentId,
            createdBy: data.createdBy,
        });
    } catch (error) {
        handlePostMortemError(error, 'Failed to create post-mortem.');
    }
}

/** Retrieve a post-mortem by its MongoDB ID or incident reference. */
async function findPostMortemByQueryService(query) {
    try {
        const postMortem = await PostMortem.findOne(query);
        if (!postMortem) throw new AppError('Post-mortem not found.', 404);
        return postMortem;
    } catch (error) {
        handlePostMortemError(error, 'Failed to find post-mortem.');
    }
}

/** Escape search text so user input is treated as a literal substring. */
function escapeSearchText(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Search and paginate reports, using the same envelope as the users endpoint. */
async function findPostMortemsByQueryService(query, { page, limit }) {
    try {
        const filter = {};
        for (const field of ['incidentId', 'createdBy']) {
            if (query[field]) filter[field] = query[field];
        }
        for (const field of ['rootCause', 'impact', 'lessonsLearned']) {
            if (query[field]) {
                filter[field] = {
                    $regex: escapeSearchText(query[field]),
                    $options: 'i',
                };
            }
        }
        if (query.actionItemStatus) {
            filter['actionItems.status'] = query.actionItemStatus;
        }
        if (query.search) {
            const search = {
                $regex: escapeSearchText(query.search),
                $options: 'i',
            };
            filter.$or = [
                'rootCause',
                'impact',
                'lessonsLearned',
                'actionItems.description',
            ].map((field) => ({ [field]: search }));
        }

        const postMortems = await PostMortem.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await PostMortem.countDocuments(filter);
        return { total, page, limit, postMortems };
    } catch (error) {
        handlePostMortemError(error, 'Failed to fetch post-mortems.');
    }
}

/** Partially update a report; an actionItems array replaces the entire array. */
async function updatePostMortemByQueryService(query, data) {
    try {
        const postMortem = await PostMortem.findOneAndUpdate(
            query,
            { $set: getReportFields(data) },
            { new: true, runValidators: true }
        );
        if (!postMortem) throw new AppError('Post-mortem not found.', 404);
        return postMortem;
    } catch (error) {
        handlePostMortemError(error, 'Failed to update post-mortem.');
    }
}

/** Delete a report and return it, matching the incident deletion response. */
async function deletePostMortemByQueryService(query) {
    try {
        const postMortem = await PostMortem.findOneAndDelete(query);
        if (!postMortem) throw new AppError('Post-mortem not found.', 404);
        return postMortem;
    } catch (error) {
        handlePostMortemError(error, 'Failed to delete post-mortem.');
    }
}

/** Clean up an incident's report; absence is allowed during incident deletion. */
async function deletePostMortemByIncidentId(incidentId) {
    try {
        return await PostMortem.findOneAndDelete({ incidentId });
    } catch (error) {
        handlePostMortemError(error, 'Failed to delete post-mortem.');
    }
}

module.exports = {
    createPostMortem,
    findPostMortemByQueryService,
    findPostMortemsByQueryService,
    updatePostMortemByQueryService,
    deletePostMortemByQueryService,
    deletePostMortemByIncidentId,
};
