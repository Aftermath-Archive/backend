jest.mock('mongoose', () => ({
    set: jest.fn(),
    connect: jest.fn(),
    connection: { close: jest.fn() },
}));
const {
    runtimeConfig,
    corsOrigins,
    trustedProxies,
} = require('../config/runtime');
const { startServer } = require('../index');
const { dbConnect } = require('../db/dbFunctions');
const mongoose = require('mongoose');
const env = {
    NODE_ENV: 'production',
    DATABASE_URL: 'mongodb://localhost:27017/aftermath_test',
    JWT_SECRET_KEY: 'a-strong-test-secret-with-at-least-32-bytes',
    CORS_ORIGINS: 'https://aftermath-archive.xyz',
};

test('production configuration validates without exposing secrets', () => {
    expect(runtimeConfig(env)).toEqual({
        port: 8080,
        databaseUrl: env.DATABASE_URL,
    });
    expect(trustedProxies({})).toBe(false);
    expect(corsOrigins(env)).toEqual(['https://aftermath-archive.xyz']);
});
test.each([
    { JWT_SECRET_KEY: '' },
    { JWT_SECRET_KEY: 'short' },
    { DATABASE_URL: '' },
    { DATABASE_URL: 'https://user:PRIVATE@example.com' },
    { CORS_ORIGINS: '' },
    { CORS_ORIGINS: '*' },
    { CORS_ORIGINS: 'https://site.example/path' },
    { CORS_ORIGINS: 'http://site.example' },
    { PORT: '0' },
    { PORT: '65536' },
    { TRUST_PROXY_CIDRS: '0.0.0.0/0' },
    { TRUST_PROXY_CIDRS: 'true' },
    { TRUST_PROXY_CIDRS: '10.0.0.0/33' },
])('invalid production configuration %# fails safely', (override) => {
    expect(() => runtimeConfig({ ...env, ...override })).toThrow();
    expect(() => runtimeConfig({ ...env, ...override })).not.toThrow(/PRIVATE/);
});
test('trusted proxies accept only explicit IP/CIDR configuration', () => {
    expect(
        trustedProxies({ TRUST_PROXY_CIDRS: '127.0.0.1,10.20.0.0/24,::1' })
    ).toEqual(['127.0.0.1', '10.20.0.0/24', '::1']);
});
test('database failure propagates safely and never starts listening', async () => {
    mongoose.connect.mockRejectedValue(
        new Error('mongodb://user:PRIVATE@db.example')
    );
    await expect(dbConnect(env.DATABASE_URL)).rejects.toThrow(
        'Failed to connect to MongoDB.'
    );
    const getApp = jest.fn();
    const connect = jest.fn().mockRejectedValue(new Error('DB unavailable'));
    await expect(
        startServer({ config: runtimeConfig(env), connect, getApp })
    ).rejects.toThrow('DB unavailable');
    expect(getApp).not.toHaveBeenCalled();
});
test('startup waits for the connection before listening', async () => {
    const events = [];
    const server = { once: jest.fn() };
    const listen = jest.fn((port, callback) => {
        events.push('listen');
        queueMicrotask(callback);
        return server;
    });
    const connect = jest.fn(async () => {
        await Promise.resolve();
        events.push('connected');
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
        await expect(
            startServer({
                config: runtimeConfig(env),
                connect,
                getApp: () => ({ listen }),
            })
        ).resolves.toBe(server);
        expect(events).toEqual(['connected', 'listen']);
        expect(listen).toHaveBeenCalledWith(8080, expect.any(Function));
    } finally {
        log.mockRestore();
    }
});
