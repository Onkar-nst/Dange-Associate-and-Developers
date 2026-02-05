const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config();

const Executive = require('./models/Executive');
const User = require('./models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/land-developer');
        const execCount = await Executive.countDocuments();
        const userCount = await User.countDocuments();
        const users = await User.find({ role: { $in: ['Executive', 'Head Executive'] } }).limit(5);

        console.log('--- DB Check ---');
        console.log(`Total Executives in collection: ${execCount}`);
        console.log(`Total Users in collection: ${userCount}`);
        console.log('Sample Users with Executive roles:');
        users.forEach(u => console.log(`- ${u.name} (${u.role}) ID: ${u._id}`));

        const execs = await Executive.find().limit(5);
        console.log('Sample Executives in collection:');
        execs.forEach(e => console.log(`- ${e.name} ID: ${e._id} linked to User ID: ${e.userId}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
