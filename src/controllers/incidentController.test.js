const { createNewIncidentService } = require('../services/incidentService');
const logError = require('../functions/logError');

const { handleCreateIncident } = require('./incidentController');

// Mock dependencies
jest.mock('../services/incidentService');
jest.mock('../functions/logError');

describe('handleCreateIncident', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock request and response
        mockReq = {
            body: {
                title: 'Test Incident',
                description: 'Test Description',
                environment: 'Production',
                createdBy: '123456',
            },
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should create incident successfully and return 201 status', async () => {
        // Mock successful incident creation
        const mockIncident = {
            _id: '123',
            ...mockReq.body,
        };
        createNewIncidentService.mockResolvedValue(mockIncident);

        // Execute test
        await handleCreateIncident(mockReq, mockRes);

        // Assertions
        expect(createNewIncidentService).toHaveBeenCalledWith(mockReq.body);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(mockIncident);
        expect(logError).not.toHaveBeenCalled();
    });

    it('should handle errors and return 400 status', async () => {
        // Mock service error
        const errorMessage = 'Failed to create incident';
        createNewIncidentService.mockRejectedValue(new Error(errorMessage));

        // Execute test
        await handleCreateIncident(mockReq, mockRes);

        // Assertions
        expect(createNewIncidentService).toHaveBeenCalledWith(mockReq.body);
        expect(logError).toHaveBeenCalledWith(
            'Creating incident',
            expect.any(Error)
        );
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
});
