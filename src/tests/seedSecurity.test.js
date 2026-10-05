jest.mock('../models/userModel', () => ({ User: { insertMany: jest.fn() } }));
jest.mock('../db/dbFunctions', () => ({
    dbConnect: jest.fn(),
    dbDisconnect: jest.fn(),
    dbDrop: jest.fn(),
}));
jest.mock('../db/seeds/incidentsSeed', () => jest.fn());
jest.mock('../db/seeds/postMortemsSeed', () => jest.fn());
const { User } = require('../models/userModel');
const bcrypt = require('bcrypt');
const seedUsers = require('../db/seeds/usersSeed');
const runSeeds = require('../db/seeds/seed');
const drop = require('../db/drop');
const { dbConnect, dbDisconnect, dbDrop } = require('../db/dbFunctions');
const guardDatabaseTooling = require('../utils/guardDatabaseTooling');
beforeEach(() => {
    jest.resetAllMocks();
    dbConnect.mockResolvedValue(undefined);
    dbDisconnect.mockResolvedValue(undefined);
});
test('production seed/drop tooling refuses general application databases', () => {
    expect(() =>
        guardDatabaseTooling({
            NODE_ENV: 'production',
            DATABASE_URL: 'mongodb://localhost/production',
        })
    ).toThrow();
    expect(() =>
        guardDatabaseTooling({
            NODE_ENV: 'production',
            DATABASE_URL: 'mongodb://localhost/aftermath_demo',
            DEMO_DATABASE_NAME: 'aftermath_demo',
        })
    ).not.toThrow();
});
test('seed passwords are bcrypt hashes rather than plaintext', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
        await seedUsers();
        const users = User.insertMany.mock.calls[0][0];
        for (const user of users) {
            expect(user.password).not.toBe('Pass123!');
            expect(await bcrypt.compare('Pass123!', user.password)).toBe(true);
        }
    } finally {
        log.mockRestore();
    }
});
test.each([runSeeds, drop])(
    'database tooling failure sets a nonzero exit status and disconnects %#',
    async (run) => {
        const originalExit = process.exitCode;
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        dbConnect.mockRejectedValue(new Error('PRIVATE database credentials'));
        try {
            await run();
            expect(process.exitCode).toBe(1);
            expect(dbDisconnect).toHaveBeenCalled();
            expect(dbDrop).not.toHaveBeenCalled();
            expect(log.mock.calls.flat().join(' ')).not.toContain('PRIVATE');
        } finally {
            process.exitCode = originalExit;
            log.mockRestore();
        }
    }
);
