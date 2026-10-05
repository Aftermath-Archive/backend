const { dbConnect, dbDisconnect, dbDrop } = require('./dbFunctions');
const guardDatabaseTooling = require('../utils/guardDatabaseTooling');
async function drop() {
    try {
        guardDatabaseTooling();
        await dbConnect();
        await dbDrop();
        console.log('Dropping complete.');
    } catch {
        console.error(
            'Database drop failed. Check database configuration and availability.'
        );
        process.exitCode = 1;
    } finally {
        await dbDisconnect().catch(() => {
            process.exitCode = 1;
        });
    }
}
if (require.main === module) drop();
module.exports = drop;
