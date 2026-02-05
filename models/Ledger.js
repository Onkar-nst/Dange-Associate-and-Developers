const mongoose = require('mongoose');
const { ALL_PARTY_TYPES } = require('../utils/constants');

/**
 * Ledger Model
 * Tracks credit/debit transactions for customers and executives
 * Maintains running balance
 */
const LedgerSchema = new mongoose.Schema({
    partyType: {
        type: String,
        enum: {
            values: ALL_PARTY_TYPES,
            message: `Party type must be one of: ${ALL_PARTY_TYPES.join(', ')}`
        },
        required: [true, 'Please add party type']
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please add party reference'],
        refPath: 'partyType' // Dynamic reference based on partyType
    },
    credit: {
        type: Number,
        default: 0
    },
    debit: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        trim: true
    },
    referenceType: {
        type: String,
        enum: ['transaction', 'customer', 'adjustment', 'other'],
        default: 'other'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

// Index for faster party ledger lookups
LedgerSchema.index({ partyType: 1, partyId: 1, transactionDate: -1 });

module.exports = mongoose.model('Ledger', LedgerSchema);
