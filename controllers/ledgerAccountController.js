const LedgerAccount = require('../models/LedgerAccount');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../middleware/asyncHandler');
const { PARTY_TYPES } = require('../utils/constants');

/**
 * @desc    Get all ledger accounts
 * @route   GET /api/ledger-accounts
 * @access  Private
 */
exports.getLedgerAccounts = asyncHandler(async (req, res, next) => {
    const accounts = await LedgerAccount.find({ active: true }).sort({ accountName: 1 });

    res.status(200).json({
        success: true,
        count: accounts.length,
        data: accounts
    });
});

/**
 * @desc    Create new ledger account
 * @route   POST /api/ledger-accounts
 * @access  Private
 */
exports.createLedgerAccount = asyncHandler(async (req, res, next) => {
    req.body.enteredBy = req.user.id;

    // Check if account already exists
    const existing = await LedgerAccount.findOne({ accountName: req.body.accountName });
    if (existing) {
        return res.status(400).json({
            success: false,
            error: 'Account name already exists'
        });
    }

    const account = await LedgerAccount.create(req.body);

    // Create initial ledger entry if opening balance > 0
    if (account.openingBalance > 0) {
        await Ledger.create({
            partyType: PARTY_TYPES.LEDGER_ACCOUNT,
            partyId: account._id,
            credit: account.balanceType === 'Cr' ? account.openingBalance : 0,
            debit: account.balanceType === 'Dr' ? account.openingBalance : 0,
            balance: account.balanceType === 'Dr' ? account.openingBalance : -account.openingBalance,
            description: 'Opening Balance',
            referenceType: 'adjustment',
            enteredBy: req.user.id
        });
    }

    res.status(201).json({
        success: true,
        data: account
    });
});

/**
 * @desc    Update ledger account
 * @route   PUT /api/ledger-accounts/:id
 * @access  Private
 */
exports.updateLedgerAccount = asyncHandler(async (req, res, next) => {
    let account = await LedgerAccount.findById(req.params.id);

    if (!account) {
        return res.status(404).json({
            success: false,
            error: 'Account not found'
        });
    }

    account = await LedgerAccount.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: account
    });
});

/**
 * @desc    Get ledger transactions for an account
 * @route   GET /api/ledger-accounts/:id/transactions
 * @access  Private
 */
exports.getAccountTransactions = asyncHandler(async (req, res, next) => {
    const account = await LedgerAccount.findById(req.params.id);
    if (!account) {
        return res.status(404).json({
            success: false,
            error: 'Account not found'
        });
    }

    const transactions = await Ledger.find({
        partyType: PARTY_TYPES.LEDGER_ACCOUNT,
        partyId: req.params.id,
        active: true
    }).sort({ transactionDate: 1 });

    res.status(200).json({
        success: true,
        data: transactions
    });
});
