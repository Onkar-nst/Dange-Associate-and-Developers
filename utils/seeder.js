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

// ================================
// Initial The Boss user
// ================================
const bossUser = {
    firstName: 'Admin',
    surname: 'Boss',
    userId: 'theboss',
    password: 'Admin@123',
    role: ROLES.THE_BOSS,
    active: true
};

// ================================
// Initial currencies
// ================================
const currencies = [
    { currencyName: 'Indian Rupee', symbol: '₹', code: 'INR', active: true },
    { currencyName: 'US Dollar', symbol: '$', code: 'USD', active: true }
];

// ================================
// Import Data
// ================================
const importData = async () => {
    try {
        console.log('🚀 Seeding started...\n');

        // Check if boss user exists
        const existingBoss = await User.findOne({ userId: 'theboss' });

        if (!existingBoss) {
            await User.create(bossUser);
            console.log('✅ The Boss user created');
            console.log('   UserId: theboss');
            console.log('   Password: Admin@123\n');
        } else {
            console.log('ℹ️  The Boss user already exists\n');
        }

        // Create currencies if not exist
        for (const curr of currencies) {
            const existingCurrency = await Currency.findOne({
                currencyName: curr.currencyName
            });

            if (!existingCurrency) {
                await Currency.create(curr);
                console.log(`✅ Currency created: ${curr.currencyName}`);
            } else {
                console.log(`ℹ️  Currency already exists: ${curr.currencyName}`);
            }
        }

        console.log('\n🎉 Seeding complete!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Seeder Error:', err);
        process.exit(1);
    }
};

// ================================
// Delete Data
// ================================
const deleteData = async () => {
    try {
        await User.deleteMany();
        await Currency.deleteMany();

        console.log('🗑️  All data destroyed');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error deleting data:', err);
        process.exit(1);
    }
};

// ================================
// Run based on flag
// ================================
if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
