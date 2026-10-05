const { validateBody, incidentInput } = require('../utils/inputValidation');
module.exports = validateBody((data) => incidentInput(data));
module.exports.validateUpdateIncidentMiddleware = validateBody((data) =>
    incidentInput(data, true)
);
