const mongoose = require('mongoose');

/**
 * LedgerAccount Model
 * Represents a standard ledger account (e.g. Office Expenses, Bank Accounts)
 * Used for general bookkeeping beyond specific customer/executive transactions.
 */
const LedgerAccountSchema = new mongoose.Schema({
    branch: {
        type: String,
        default: 'MAIN BRANCH'
    },
    accountName: {
        type: String,
        required: [true, 'Please add account name'],
        unique: true,
        trim: true
    },
    accountNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    balanceType: {
        type: String,
        enum: ['Dr', 'Cr'],
        default: 'Dr'
    },
    type: {
        type: String,
        default: 'OTHER LEGERS'
    },
    group: {
        type: String,
        required: [true, 'Please add account group'],
        // Examples: INDIRECT EXPENSES, BANK ACCOUNTS, CAPITAL ACCOUNT, INDIRECT INCOMES, SUNDRY CREDITORS
    },
    mode: {
        type: String,
        default: 'Ledger'
    },
    active: {
        type: Boolean,
        default: true
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LedgerAccount', LedgerAccountSchema);
