function assertDemoDatabaseTarget(databaseUrl, expectedName) {
    if (
        typeof expectedName !== 'string' ||
        !/^[a-zA-Z0-9_-]+_demo$/.test(expectedName)
    ) {
        throw new Error(
            'DEMO_DATABASE_NAME must identify a database ending in _demo.'
        );
    }

    let parsed;
    let databaseName;
    try {
        parsed = new URL(databaseUrl);
        databaseName = decodeURIComponent(parsed.pathname.slice(1));
    } catch {
        throw new Error('A valid dedicated demo database URL is required.');
    }
    if (
        !['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) ||
        databaseName !== expectedName
    ) {
        throw new Error(
            'Database reset target does not match the dedicated demo database.'
        );
    }
}

if (require.main === module) {
    try {
        assertDemoDatabaseTarget(
            process.env.DATABASE_URL,
            process.env.DEMO_DATABASE_NAME
        );
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { assertDemoDatabaseTarget };
