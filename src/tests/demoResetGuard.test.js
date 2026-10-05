const { spawnSync } = require('node:child_process');
const path = require('node:path');
const {
    assertDemoDatabaseTarget,
} = require('../../scripts/check-demo-database');

describe('demo database reset guard', () => {
    test.each([
        'mongodb://localhost:27017/aftermath_demo',
        'mongodb+srv://demo-user:password@cluster.example.com/aftermath_demo?retryWrites=true',
    ])('accepts a matching dedicated demo target', (url) => {
        expect(() =>
            assertDemoDatabaseTarget(url, 'aftermath_demo')
        ).not.toThrow();
    });

    test.each([
        [undefined, 'aftermath_demo'],
        ['not a URL', 'aftermath_demo'],
        ['mongodb://localhost/aftermath_demo', undefined],
        ['mongodb://localhost/production', 'production'],
        ['mongodb://localhost/aftermath_demo', 'demo'],
        ['https://localhost/aftermath_demo', 'aftermath_demo'],
        ['mongodb://localhost/production', 'aftermath_demo'],
        ['mongodb://localhost/admin', 'aftermath_demo'],
        ['mongodb://localhost/', 'aftermath_demo'],
        ['mongodb://localhost/aftermath_demo/extra', 'aftermath_demo'],
    ])('rejects an unapproved target', (url, name) => {
        expect(() => assertDemoDatabaseTarget(url, name)).toThrow();
    });

    test('CLI fails without exposing credentials or connecting to the database', () => {
        const result = spawnSync(
            process.execPath,
            [path.resolve(__dirname, '../../scripts/check-demo-database.js')],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    DATABASE_URL:
                        'mongodb://tester:DO_NOT_LOG_PASSWORD@localhost/production',
                    DEMO_DATABASE_NAME: 'aftermath_demo',
                },
            }
        );
        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('does not match');
        expect(result.stderr).not.toContain('DO_NOT_LOG_PASSWORD');
    });
});
