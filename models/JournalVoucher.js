const mongoose = require('mongoose');

/**
 * JournalVoucher Model
 * Records accounting journal entries (JV)
 * Each JV has a debit side and a credit side
 */
const JournalVoucherSchema = new mongoose.Schema({
    jvNumber: {
        type: String,
        unique: true,
        required: true
    },
    branch: {
        type: String,
        default: 'MAIN BRANCH'
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    narration: {
        type: String,
        trim: true
    },
    debitAccount: {
        partyType: {
            type: String,
            enum: ['customer', 'executive', 'ledger_account'],
            required: true
        },
        partyId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        accountName: String // Denormalized for easy display
    },
    creditAccount: {
        partyType: {
            type: String,
            enum: ['customer', 'executive', 'ledger_account'],
            required: true
        },
        partyId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        accountName: String // Denormalized for easy display
    },
    amount: {
        type: Number,
        required: [true, 'Please add transaction amount'],
        min: [0, 'Amount must be positive']
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

// Index for faster lookups
JournalVoucherSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('JournalVoucher', JournalVoucherSchema);
