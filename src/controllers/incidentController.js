const logError = require('../utils/logError');

const {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
} = require('../services/incidentService');

const checkIncidentPresence = require('../utils/checkIncidentPresence');
const { decodeJWT } = require('../functions/jwtFunctions');

/**
 * Handle creation of a new incident function. It receives a request object and a response object. It tries to create a new incident using the createNewIncidentService function with the request body. If successful, it responds with status code 201 and the incident object in JSON format. If an error occurs, it logs the error and responds with status code 400 and an error message in JSON format.
 * @author Xander
 *
 * @async
 * @param {*} req Request object containing the incident data
 * @param {*} res Response object for sending the created incident or error message
 * @returns {*} Handles the creation of a new incident and sends a response with the created incident data or an error message in case of failure.
 */
async function handleCreateIncident(req, res) {
    try {
        const incidentData = {
            ...req.body,
            createdBy: req.userId, // Set the createdBy field using the user ID from the token
        };
        const incident = await createNewIncidentService(incidentData);
        res.status(201).json(incident);
    } catch (error) {
        logError('Creating incident', error);
        res.status(400).json({ message: error.message });
    }
}

/**
 * Handles a GET request to retrieve an incident by its ID. If the incident is found, it sends a 200 status response with the incident data. If the incident is not found, it sends a 404 status response. If there is an error, it logs the error and sends a 400 status response with an error message.
 * @author Xander
 *
 * @async
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns {*} Handles the GET request to retrieve an incident by ID. It queries the database using the ID provided in the request parameters and returns the incident details in the response. If the incident is not found, it returns a 404 status code; otherwise, it returns a 400 status code with an error message.
 */
async function handleGetIncidentById(req, res) {
    try {
        const incident = await findIncidentByQueryService({
            _id: req.params.id,
        });
        res.status(200).json(incident);
    } catch (error) {
        logError('Finding incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

/**
 * Handles the retrieving of all incidents with pagination. It extracts the page and limit from the request's pagination object and uses them to query for incidents. If successful, it responds with a status 200 JSON containing the retrieved incidents. If an error occurs during the process, it logs the error and responds with a status 400 JSON containing the error message.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing pagination information.
 * @param {*} res The response object for sending back the result or error message.
 * @returns {*} Handles the GET request to retrieve all incidents with pagination. Fetches incidents based on the pagination parameters provided in the request object. Responds with the fetched incidents or an error message accordingly.
 */
async function handleGetAllIncidents(req, res) {
    try {
        const { page, limit } = req.pagination;

        const incidents = await findIncidentsByQueryService(
            {}, // empty query to get all incidents
            { page, limit }
        );

        res.status(200).json(incidents);
    } catch (error) {
        logError('Fetching all incidents with pagination', error);
        res.status(400).json({ message: error.message });
    }
}

/**
 * Async function that handles searching for incidents based on the request query parameters. It retrieves incidents using a service function, and returns a JSON response with the queried incidents. If an error occurs during the process, it logs the error and sends a JSON response with a message containing the error's message.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing query data
 * @param {*} res The response object
 * @returns {*} Handles searching incidents based on the provided request query parameters. Returns a JSON response with the incidents retrieved from the database, or an error message if an error occurs during the search.
 */
async function handleSearchIncidents(req, res) {
    try {
        const incidentsQuery = await findIncidentsByQueryService(req.query);

        res.status(200).json({
            incidentsQuery,
        });
    } catch (error) {
        logError('Finding incidents by query', error);
        res.status(400).json({ message: error.message });
    }
}

/**
 * Handles the updating of an incident based on the request and response provided. This function first checks the presence of the incident by querying with the ID from the request parameters. If the incident is found, it updates the incident with the data from the request body. Finally, it sends a JSON response with the updated incident. If an error occurs during the process, it logs the error, determines the status code based on the error message, and sends an appropriate JSON response with the error message.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing parameters
 * @param {*} res The response object
 * @returns {*} Handles the update of an incident based on the request parameters and body. Returns the updated incident object as a JSON response or an error message with appropriate status code.
 */
async function handleUpdateIncident(req, res) {
    try {
        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );
        const updatedIncident = await updateIncidentByQueryService(
            { _id: incident._id },
            req.body
        );
        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Updating incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

/**
 * Handles the deletion of an incident based on the ID provided in the request. Upon receiving a request, this function checks for the presence of the incident, deletes it, and returns the deleted incident in JSON format. If the incident is not found, it returns a specific error message with the appropriate status code. In case of any errors during the deletion process, it logs the error and returns an error message with the corresponding status code in the response.
 * @author Xander
 *
 * @async
 * @param {*} req The request object
 * @param {*} res The response object
 * @returns {*} An asynchronous function to handle the deletion of an incident based on the provided request and response objects. It first checks the presence of the incident by ID, deletes the incident using the ID if found, and returns the deleted incident in the response. If the incident is not found, it logs an error and sends an appropriate response status code with a message.
 */
async function handleDeleteIncident(req, res) {
    try {
        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );
        const deletedIncident = await deleteIncidentByQueryService({
            _id: incident._id,
        });
        res.status(200).json(deletedIncident);
    } catch (error) {
        logError('Deleting incident by ID', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
}

/**
 * Handles the addition of a discussion to a case incident. Validates the request body for required fields. Retrieves the incident by ID and updates it by adding the new discussion message and author. Handles errors by logging and returning appropriate status codes and error messages.
 * @author Xander
 *
 * @async
 * @param {*} req The request object containing the request body and parameters
 * @param {*} res The response object for sending responses back to the client
 * @returns {unknown} Handles the addition of a discussion message to a specified incident. Validates the request body for required fields (message and author). Retrieves the incident by ID and updates it by adding a new discussion entry. Responds with the updated incident details. If an error occurs, logs the error message, determines the status code based on the error message, and sends an appropriate JSON response with the error message.
 */
async function handleAddDiscussion(req, res) {
    try {
        const { message } = req.body;

        // Decode the JWT from the authorization header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: 'Authorization token missing.' });
        }

        const decoded = decodeJWT(token);
        const id = decoded.id; // Extract user ID from the token

        if (!message || !id) {
            return res
                .status(400)
                .json({ message: 'Message and valid token are required.' });
        }

        // Check if the incident exists
        const incident = await checkIncidentPresence(
            findIncidentByQueryService,
            {
                _id: req.params.id,
            }
        );

        // Add the case discussion
        const updatedIncident = await updateIncidentByQueryService(
            { _id: incident._id },
            { $push: { caseDiscussion: { message, author: id } } }
        );
        res.status(200).json(updatedIncident);
    } catch (error) {
        logError('Adding case discussion to incident', error);
        const statusCode = error.message === 'Incident not found.' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
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
