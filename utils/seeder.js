/**
 * Database Seeder
 * Creates initial data including The Boss user
 * Run: node utils/seeder.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Currency = require('../models/Currency');
const { ROLES } = require('./constants');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, { family: 4 });

// Initial The Boss user
const bossUser = {
    name: 'Administrator',
    userId: 'theboss',
    password: 'Admin@123',
    role: ROLES.THE_BOSS,
    active: true
};

// Initial currencies
const currencies = [
    { currencyName: 'Indian Rupee', symbol: '₹', code: 'INR', active: true },
    { currencyName: 'US Dollar', symbol: '$', code: 'USD', active: true }
];

// Import data
const importData = async () => {
    try {
        // Check if boss user exists
        const existingBoss = await User.findOne({ userId: 'theboss' });
        if (!existingBoss) {
            await User.create(bossUser);
            console.log('✅ The Boss user created');
            console.log('   UserId: theboss');
            console.log('   Password: Admin@123');
        } else {
            console.log('ℹ️  The Boss user already exists');
        }

        // Create currencies if not exist
        for (const curr of currencies) {
            const existing = await Currency.findOne({ currencyName: curr.currencyName });
            if (!existing) {
                await Currency.create(curr);
                console.log(`✅ Currency created: ${curr.currencyName}`);
            }
        }

        console.log('\n🎉 Seeding complete!');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await User.deleteMany();
        await Currency.deleteMany();
        console.log('🗑️  Data destroyed');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

// Run based on flag
if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
