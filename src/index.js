require('dotenv').config({ quiet: true });
const { runtimeConfig } = require('./config/runtime');
const { dbConnect } = require('./db/dbFunctions');
async function startServer({
    config = runtimeConfig(),
    connect = dbConnect,
    getApp = () => require('./server').app,
} = {}) {
    await connect(config.databaseUrl);
    const app = getApp();
    return new Promise((resolve, reject) => {
        const server = app.listen(config.port, () => {
            console.log(`Server is listening on port ${config.port}`);
            resolve(server);
        });
        server.once('error', reject);
    });
}
if (require.main === module) {
    startServer().catch(() => {
        console.error(
            'Startup failed. Check required configuration and database availability.'
        );
        process.exitCode = 1;
        require('mongoose')
            .disconnect()
            .catch(() => {});
    });
}
module.exports = { startServer };
