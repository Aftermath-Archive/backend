const {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
    addDiscussionService,
} = require('../services/incidentService');
async function handleCreateIncident(req, res) {
    res.status(201).json(
        await createNewIncidentService({
            ...req.validatedBody,
            createdBy: req.userId,
        })
    );
}
async function handleGetIncidentById(req, res) {
    res.json(await findIncidentByQueryService({ _id: req.params.id }));
}
async function handleGetAllIncidents(req, res) {
    res.json(await findIncidentsByQueryService({}, req.pagination));
}
async function handleSearchIncidents(req, res) {
    res.json({
        incidentsQuery: await findIncidentsByQueryService(
            req.query,
            req.pagination
        ),
    });
}
async function handleUpdateIncident(req, res) {
    res.json(
        await updateIncidentByQueryService(
            { _id: req.params.id },
            req.validatedBody,
            req.userId
        )
    );
}
async function handleDeleteIncident(req, res) {
    res.json(await deleteIncidentByQueryService({ _id: req.params.id }));
}
async function handleAddDiscussion(req, res) {
    res.json(
        await addDiscussionService(req.params.id, req.body.message, req.userId)
    );
}
module.exports = {
    handleCreateIncident,
    handleGetIncidentById,
    handleGetAllIncidents,
    handleSearchIncidents,
    handleUpdateIncident,
    handleDeleteIncident,
    handleAddDiscussion,
};
