const { Incident } = require('../models/incidentModel');
const AppError = require('../utils/AppError');
const { deletePostMortemByIncidentId } = require('./postMortemService');
const { incidentInput, escapeSearchText } = require('../utils/inputValidation');
async function createNewIncidentService(data) {
    const { createdBy, ...body } = data;
    const input = incidentInput(body);
    const now = new Date();
    const datePrefix = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
    const count = await Incident.countDocuments({
        incidentAutoId: { $regex: `^${datePrefix}-INC` },
    });
    return Incident.create({
        ...input,
        createdBy,
        incidentAutoId: `${datePrefix}-INC${String(count + 1).padStart(3, '0')}`,
        resolvedAt: ['Resolved', 'Closed'].includes(input.status) ? now : null,
    });
}
async function findIncidentByQueryService(query) {
    const incident = await Incident.findOne(query);
    if (!incident) throw new AppError('Incident not found.', 404);
    return incident;
}
async function findIncidentsByQueryService(
    query,
    { page = 1, limit = 10 } = {}
) {
    const filter = {};
    for (const field of ['title', 'description']) {
        if (query[field])
            filter[field] = {
                $regex: escapeSearchText(query[field]),
                $options: 'i',
            };
    }
    for (const field of ['status', 'environment', 'severity'])
        if (query[field]) filter[field] = query[field];
    if (query.tags)
        filter.tags = {
            $in: query.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .slice(0, 10),
        };
    if (query.search) {
        const search = {
            $regex: escapeSearchText(query.search),
            $options: 'i',
        };
        filter.$or = [
            'title',
            'description',
            'tags',
            'severity',
            'environment',
        ].map((field) => ({ [field]: search }));
    }
    return Incident.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
}
async function updateIncidentByQueryService(query, data, actorId) {
    const input = incidentInput(data, true);
    if (actorId) input.updatedBy = actorId;
    if (input.status !== undefined)
        input.resolvedAt = ['Resolved', 'Closed'].includes(input.status)
            ? new Date()
            : null;
    const incident = await Incident.findOneAndUpdate(
        query,
        { $set: input },
        { new: true, runValidators: true }
    );
    if (!incident) throw new AppError('Incident not found.', 404);
    return incident;
}
async function addDiscussionService(id, message, author) {
    const incident = await Incident.findOneAndUpdate(
        { _id: id },
        { $push: { caseDiscussion: { message, author } } },
        { new: true, runValidators: true }
    );
    if (!incident) throw new AppError('Incident not found.', 404);
    return incident;
}
async function deleteIncidentByQueryService(query) {
    const incident = await Incident.findOneAndDelete(query);
    if (!incident) throw new AppError('Incident not found.', 404);
    await deletePostMortemByIncidentId(incident._id);
    return incident;
}
module.exports = {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
    addDiscussionService,
};
