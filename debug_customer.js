const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const customer = await Customer.findOne().populate('assignedExecutive');
        console.log('--- Customer Check ---');
        if (customer) {
            console.log(`Customer: ${customer.name}`);
            console.log(`Assigned Executive Raw Value: ${customer.assignedExecutive}`);
        } else {
            console.log('No customers found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
check();
