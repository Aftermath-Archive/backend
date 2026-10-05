const {
    assertDemoDatabaseTarget,
} = require('../../scripts/check-demo-database');
function guardDatabaseTooling(env = process.env) {
    if (env.NODE_ENV === 'production') {
        assertDemoDatabaseTarget(env.DATABASE_URL, env.DEMO_DATABASE_NAME);
    }
}
module.exports = guardDatabaseTooling;
