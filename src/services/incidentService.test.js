// Mock model to prevent the actual MongoDB connection from being used
jest.mock('../models/incidentModel');

// Import the mocked model for reference
const { Incident } = require('../models/incidentModel');

// Import the service
const {
    createNewIncidentService,
    findIncidentByQueryService,
    findIncidentsByQueryService,
    updateIncidentByQueryService,
    deleteIncidentByQueryService,
} = require('./incidentService');

// Before tests, set up the mocks
beforeEach(() => {
    jest.clearAllMocks();
    Incident.create = jest.fn();
    Incident.findOne = jest.fn();
    Incident.find = jest.fn();
    Incident.findOneAndUpdate = jest.fn();
    Incident.updateMany = jest.fn();
    Incident.findOneAndDelete = jest.fn();
    Incident.deleteMany = jest.fn();
});

// Unit Test suite for the Incident Service
describe('Incident Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('createNewIncidentService creates a new incident', async () => {
        const mockIncident = { title: 'Test', description: 'Test desc' };
        Incident.create.mockResolvedValue(mockIncident);

        const result = await createNewIncidentService(mockIncident);
        expect(result).toEqual(mockIncident);
    });

    test('findIncidentByQueryService finds an incident by query', async () => {
        const mockIncident = { title: 'Test Incident' };
        Incident.findOne.mockResolvedValue(mockIncident);

        const result = await findIncidentByQueryService({
            title: 'Test Incident',
        });
        expect(Incident.findOne).toHaveBeenCalledWith({
            title: 'Test Incident',
        });
        expect(result).toEqual(mockIncident);
    });

    test('findIncidentsByQueryService returns incidents based on query', async () => {
        const mockIncidents = [
            { title: 'Incident 1' },
            { title: 'Incident 2' },
        ];
        Incident.find.mockResolvedValue(mockIncidents);

        const result = await findIncidentsByQueryService({ severity: 'High' });
        expect(Incident.find).toHaveBeenCalledWith({ severity: 'High' });
        expect(result).toEqual(mockIncidents);
    });

    test('updateIncidentByQueryService updates an incident by query', async () => {
        const mockUpdatedIncident = { title: 'Updated Incident' };
        Incident.findOneAndUpdate.mockResolvedValue(mockUpdatedIncident);

        const result = await updateIncidentByQueryService(
            { title: 'Incident 1' },
            { title: 'Updated Incident' }
        );
        expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
            { title: 'Incident 1' },
            { title: 'Updated Incident' },
            { new: true, runValidators: true }
        );
        expect(result).toEqual(mockUpdatedIncident);
    });

    test('deleteIncidentByQueryService deletes an incident by query', async () => {
        const mockIncident = { title: 'Deleted Incident' };
        Incident.findOneAndDelete.mockResolvedValue(mockIncident);

        const result = await deleteIncidentByQueryService({
            title: 'Deleted Incident',
        });
        expect(Incident.findOneAndDelete).toHaveBeenCalledWith({
            title: 'Deleted Incident',
        });
        expect(result).toEqual(mockIncident);
    });
});
