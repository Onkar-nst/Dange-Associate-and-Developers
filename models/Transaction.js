const mongoose = require('mongoose');
const { ALL_PAYMENT_MODES, PAYMENT_MODES } = require('../utils/constants');

/**
 * Transaction Model
 * Records customer payments and transactions
 * Updates ledger balance on creation
 */
const TransactionSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Please add customer reference']
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    entryType: {
        type: String,
        enum: ['Receipt', 'Payment'],
        default: 'Receipt'
    },
    transactionType: {
        type: String,
        enum: ['Select Type', 'down payment', 'EMI', 'Token', 'Cash to bank', 'other transaction'],
        default: 'Select Type'
    },
    amount: {
        type: Number,
        required: [true, 'Please add transaction amount'],
        min: [0, 'Amount must be positive']
    },
    paymentMode: {
        type: String,
        enum: ['Bank', 'Cash', 'bank', 'cash', 'upi'], // Keeping lowercase for backward compatibility
        required: [true, 'Please add payment mode']
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    receiptNumber: {
        type: String,
        trim: true
    },
    balanceAtTime: {
        type: Number
    },
    narration: {
        type: String,
        trim: true
    },
    bankName: {
        type: String,
        trim: true
    },
    referenceNumber: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster customer transaction lookups
TransactionSchema.index({ customerId: 1, transactionDate: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
