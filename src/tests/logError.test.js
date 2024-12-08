const logError = require('../utils/logError');

describe('logError', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {}); // mock console.error
    });

    afterEach(() => {
        console.error.mockRestore(); // restore console.error
    });

    test('logs the action and error message', () => {
        const action = 'Test action';
        const error = new Error('Test error message');

        logError(action, error);

        expect(console.error).toHaveBeenCalledWith(
            '[ERROR] - Test action: Test error message'
        );
    });

    test('logs the error stack if present', () => {
        const action = 'Test action';
        const error = new Error('Test error message');
        error.stack = 'Test error stack';

        logError(action, error);

        expect(console.error).toHaveBeenCalledWith('Test error stack');
    });
});
