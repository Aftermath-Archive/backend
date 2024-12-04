const checkIncidentPresence = require('./checkIncidentPresence');
const logError = require('../functions/logError');

jest.mock('../functions/logError');

describe('checkIncidentPresence', () => {
    let mockServiceFunction;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return incident when found', async () => {
        const mockIncident = { _id: '123', title: 'Test Incident' };
        mockServiceFunction = jest.fn().mockResolvedValue(mockIncident);

        const result = await checkIncidentPresence(mockServiceFunction, {
            _id: '123',
        });

        expect(result).toEqual(mockIncident);
        expect(mockServiceFunction).toHaveBeenCalledWith({ _id: '123' });
        expect(logError).not.toHaveBeenCalled();
    });

    it('should throw error when incident not found', async () => {
        mockServiceFunction = jest.fn().mockResolvedValue(null);

        await expect(
            checkIncidentPresence(mockServiceFunction, { _id: '123' })
        ).rejects.toThrow('Incident not found.');

        expect(mockServiceFunction).toHaveBeenCalledWith({ _id: '123' });
        expect(logError).toHaveBeenCalled();
    });

    it('should throw custom error message when provided', async () => {
        mockServiceFunction = jest.fn().mockResolvedValue(null);
        const customError = 'Custom error message';

        await expect(
            checkIncidentPresence(
                mockServiceFunction,
                { _id: '123' },
                customError
            )
        ).rejects.toThrow(customError);
    });

    it('should handle service function errors', async () => {
        mockServiceFunction = jest
            .fn()
            .mockRejectedValue(new Error('Database error'));

        await expect(
            checkIncidentPresence(mockServiceFunction, { _id: '123' })
        ).rejects.toThrow('Incident not found.');

        expect(logError).toHaveBeenCalledWith(
            'Checking incident presence',
            expect.any(Error)
        );
    });
});
