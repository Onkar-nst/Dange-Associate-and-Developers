const mongoose = require('mongoose');
const { COMMISSION_STATUS } = require('../utils/constants');

/**
 * CommissionLedger Model
 * Records individual commission earnings and payouts
 */
const CommissionLedgerSchema = new mongoose.Schema({
    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please add executive reference']
    },
    commissionRuleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommissionRule',
        required: false // Optional for manual adjustments or payouts
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false // Optional for payouts
    },
    // The credit (earned) or debit (paid) amount
    amount: {
        type: Number,
        required: [true, 'Please add amount']
    },
    // EARNED = Positive (Credit), PAID = Negative (Debit) logic can be used, 
    // OR we can just track status. 
    // For a ledger, it's better to have Credit/Debit or just signed Amount.
    // Let's stick to the prompt: "Commission matches: earned, paid, pending".
    // We will use 'status' to track state.
    status: {
        type: String,
        enum: Object.values(COMMISSION_STATUS),
        default: COMMISSION_STATUS.EARNED
    },
    // Reference to the payment transaction that triggered this (if applicable)
    referenceTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'Please add description']
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    paidAt: {
        type: Date
    }
});

// Index for quick lookup of executive's ledger
CommissionLedgerSchema.index({ executiveId: 1, status: 1 });
CommissionLedgerSchema.index({ customerId: 1 });

module.exports = mongoose.model('CommissionLedger', CommissionLedgerSchema);
