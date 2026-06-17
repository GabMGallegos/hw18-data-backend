const mongoose = require('mongoose');

async function connectDatabase() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is not configured. Configure it only in the hw18-data-be VM.');
    }

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error.message);
    });

    mongoose.connection.once('open', () => {
        console.log('Connected to MongoDB successfully from data backend.');
    });

    await mongoose.connect(mongoUri);
}

module.exports = connectDatabase;
