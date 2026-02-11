const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Customer = require('./models/Customer');

const migrateDocuments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers. Checking for document migration...`);

        for (let customer of customers) {
            // Check if documents is an object (old format) or array (new format)
            // Note: Mongoose might return the underlying data.
            // If it's already an array, skip.
            // In MongoDB shell it would look like an object { agreement: ... }

            // We use lean() or access the raw object to be sure
            const rawCustomer = await Customer.findById(customer._id).lean();
            const oldDocs = rawCustomer.documents;

            if (oldDocs && !Array.isArray(oldDocs)) {
                console.log(`Migrating documents for customer: ${customer.name}`);
                const newDocsArray = [];

                if (oldDocs.agreement) newDocsArray.push({ name: 'Agreement', path: oldDocs.agreement });
                if (oldDocs.nmrda) newDocsArray.push({ name: 'NMRDA', path: oldDocs.nmrda });
                if (oldDocs.deed) newDocsArray.push({ name: 'Deed', path: oldDocs.deed });
                if (oldDocs.farm) newDocsArray.push({ name: 'Farm', path: oldDocs.farm });

                await Customer.updateOne(
                    { _id: customer._id },
                    { $set: { documents: newDocsArray } }
                );
                console.log(`Migrated ${newDocsArray.length} documents.`);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateDocuments();
