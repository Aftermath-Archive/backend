const { dbConnect } = require('../dbFunctions');

const seedUsers = require('./usersSeed');
const seedIncidents = require('./incidentsSeed');
const seedPostMortems = require('./postMortemsSeed');

async function runSeeds() {
    try {
        await dbConnect();
        await seedUsers();
        await seedIncidents();
        await seedPostMortems();
        console.log('All seeds completed successfully.');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        process.exit();
    }
}

runSeeds();
