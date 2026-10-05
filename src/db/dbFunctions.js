const mongoose = require('mongoose');
const { databaseUrl } = require('../config/runtime');
require('dotenv').config({ quiet: true });
async function dbConnect(url = databaseUrl()) {
    try {
        mongoose.set('maxTimeMS', 5000);
        mongoose.set('bufferTimeoutMS', 5000);
        await mongoose.connect(url, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
    } catch {
        throw new Error(
            'Failed to connect to MongoDB. Check database configuration and availability.'
        );
    }
}
async function dbDisconnect() {
    await mongoose.connection.close();
}
async function dbDrop() {
    await mongoose.connection.db.dropDatabase();
}
module.exports = { dbConnect, dbDisconnect, dbDrop };
