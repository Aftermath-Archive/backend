const logError = require('./logError');

describe('logError', () => {
    let consoleSpy;
    
    beforeEach(() => {
        // Setup console.error spy before each test
        consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        // Clean up after each test
        consoleSpy.mockRestore();
    });

    it('should log error message with action', () => {
        const action = 'Test Action';
        const error = new Error('Test Error');
        
        logError(action, error);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ERROR] - Test Action: Test Error'
        );
    });

    it('should log both error message and stack trace when stack is present', () => {
        const action = 'Test Action';
        const error = new Error('Test Error');
        error.stack = 'Mock Stack Trace';

        logError(action, error);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ERROR] - Test Action: Test Error'
        );
        expect(consoleSpy).toHaveBeenCalledWith('Mock Stack Trace');
        expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle different action messages', () => {
        const actions = ['Create', 'Update', 'Delete'];
        const error = new Error('Operation Failed');

        actions.forEach(action => {
            logError(action, error);
            expect(consoleSpy).toHaveBeenCalledWith(
                `[ERROR] - ${action}: Operation Failed`
            );
        });
    });

    it('should handle errors without stack traces', () => {
        const action = 'Test Action';
        const error = { message: 'Custom Error' }; // Error without stack

        logError(action, error);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ERROR] - Test Action: Custom Error'
        );
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});