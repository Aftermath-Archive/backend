const checkIncidentPresence = require('../utils/checkIncidentPresence');
const logError = require('../utils/logError');
// const AppError = require('../utils/AppError');

jest.mock('../utils/logError');

describe('checkIncidentPresence', () => {
    const mockServiceFunction = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return the document if it exists', async () => {
        const mockIncident = { id: '123', title: 'Test Incident' };
        mockServiceFunction.mockResolvedValue(mockIncident);

        const result = await checkIncidentPresence(mockServiceFunction, {
            id: '123',
        });

        expect(result).toBe(mockIncident);
        expect(logError).not.toHaveBeenCalled();
    });

    test('should throw an error if the document does not exist', async () => {
        mockServiceFunction.mockResolvedValue(null);

        await expect(
            checkIncidentPresence(mockServiceFunction, { id: '123' })
        ).rejects.toThrow('Incident not found.');

        expect(logError).toHaveBeenCalled();
    });

    test('should log error and throw custom error message if the service throws an error', async () => {
        const mockError = new Error('Database connection failed');
        mockServiceFunction.mockRejectedValue(mockError);

        await expect(
            checkIncidentPresence(
                mockServiceFunction,
                { id: '123' },
                'Custom error message'
            )
        ).rejects.toThrow('Custom error message');

        expect(logError).toHaveBeenCalledWith(
            'Checking incident presence',
            mockError
        );
    });
});
