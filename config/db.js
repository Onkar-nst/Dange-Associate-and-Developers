const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the URI provided in environment variables.
 * This is a singleton-like setup that can be reused across the application.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4 // Force IPv4 to prevent SSL Alert 80 on Mac
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
