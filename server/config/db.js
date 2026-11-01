const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGOOSE_URI = process.env.MONGOOSE_URI;
let connectionPromise = null;

const mongooseConnection = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

    connectionPromise = mongoose.connect(MONGOOSE_URI, {
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
        console.info({
            name: mongoose.connection.name,
            connection: true
        });
        return mongoose.connection;
    })
    .catch((err) => {
        connectionPromise = null;
        console.error('Error connecting to MongoDB');
        throw err;
    });

    return connectionPromise;
};


module.exports = mongooseConnection;
