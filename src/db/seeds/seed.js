const { dbConnect, dbDisconnect } = require('../dbFunctions');
const seedUsers = require('./usersSeed');
const seedIncidents = require('./incidentsSeed');
const seedPostMortems = require('./postMortemsSeed');
const guardDatabaseTooling = require('../../utils/guardDatabaseTooling');
async function runSeeds() {
    try {
        guardDatabaseTooling();
        await dbConnect();
        await seedUsers();
        await seedIncidents();
        await seedPostMortems();
        console.log('All seeds completed successfully.');
    } catch {
        console.error(
            'Seeding failed. Check database configuration and seed data.'
        );
        process.exitCode = 1;
    } finally {
        await dbDisconnect().catch(() => {
            process.exitCode = 1;
        });
    }
}
if (require.main === module) runSeeds();
module.exports = runSeeds;
