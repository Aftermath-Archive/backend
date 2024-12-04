async function checkIncidentPresence(model, query) {
    const incident = await model.findOne(query);
    if (!incident) {
        throw new Error('Incident not found.');
    }
    return incident;
}

module.exports = checkIncidentPresence;