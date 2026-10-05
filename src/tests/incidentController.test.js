// Imports
const {
    handleCreateIncident,
    handleGetIncidentById,
    handleGetAllIncidents,
    handleSearchIncidents,
    handleUpdateIncident,
    handleDeleteIncident,
} = require('../controllers/incidentController');

const {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
} = require('../services/incidentService');

// Mock dependencies
jest.mock('../services/incidentService');

jest.mock('../utils/logError');

describe('Incident Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            validatedBody: {},
            userId: '507f1f77bcf86cd799439013',
            params: {},
            query: {},
            pagination: { page: 1, limit: 10 },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('handleCreateIncident should create a new incident and return 201', async () => {
        const mockIncident = { id: '123', title: 'New Incident' };
        createNewIncidentService.mockResolvedValue(mockIncident);

        mockReq.validatedBody = {
            title: 'New Incident',
            description: 'Test description',
        };

        await handleCreateIncident(mockReq, mockRes);

        expect(createNewIncidentService).toHaveBeenCalledWith({
            ...mockReq.validatedBody,
            createdBy: mockReq.userId,
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(mockIncident);
    });

    test('handleGetIncidentById should return an incident and 200', async () => {
        const mockIncident = { id: '123', title: 'Found Incident' };
        findIncidentByQueryService.mockResolvedValue(mockIncident);

        mockReq.params.id = '123';

        await handleGetIncidentById(mockReq, mockRes);

        expect(findIncidentByQueryService).toHaveBeenCalledWith({
            _id: mockReq.params.id,
        });
        expect(mockRes.json).toHaveBeenCalledWith(mockIncident);
    });

    test('handleGetAllIncidents should return all incidents with pagination and 200', async () => {
        const mockIncidents = [
            { id: '123', title: 'Incident 1' },
            { id: '124', title: 'Incident 2' },
        ];
        findIncidentsByQueryService.mockResolvedValue(mockIncidents);

        await handleGetAllIncidents(mockReq, mockRes);

        expect(findIncidentsByQueryService).toHaveBeenCalledWith(
            {},
            mockReq.pagination
        );
        expect(mockRes.json).toHaveBeenCalledWith(mockIncidents);
    });

    test('handleSearchIncidents should return incidents based on query and 200', async () => {
        const mockIncidents = [
            { id: '123', title: 'Search Result 1' },
            { id: '124', title: 'Search Result 2' },
        ];
        findIncidentsByQueryService.mockResolvedValue(mockIncidents);

        mockReq.query = { title: 'Search' };

        await handleSearchIncidents(mockReq, mockRes);

        expect(findIncidentsByQueryService).toHaveBeenCalledWith(
            mockReq.query,
            mockReq.pagination
        );
        expect(mockRes.json).toHaveBeenCalledWith({
            incidentsQuery: mockIncidents,
        });
    });

    test('handleUpdateIncident should update an incident and return 200', async () => {
        const mockIncident = { id: '123', title: 'Updated Incident' };
        updateIncidentByQueryService.mockResolvedValue(mockIncident);

        mockReq.params.id = '123';
        mockReq.validatedBody = { title: 'Updated Incident' };

        await handleUpdateIncident(mockReq, mockRes);

        expect(updateIncidentByQueryService).toHaveBeenCalledWith(
            { _id: mockReq.params.id },
            mockReq.validatedBody,
            mockReq.userId
        );

        expect(mockRes.json).toHaveBeenCalledWith(mockIncident);
    });

    test('handleDeleteIncident should delete an incident and return 200', async () => {
        const mockIncident = { id: '123', title: 'Deleted Incident' };
        deleteIncidentByQueryService.mockResolvedValue(mockIncident);

        mockReq.params.id = '123';

        await handleDeleteIncident(mockReq, mockRes);

        expect(deleteIncidentByQueryService).toHaveBeenCalledWith({
            _id: mockReq.params.id,
        });

        expect(mockRes.json).toHaveBeenCalledWith(mockIncident);
    });
});
