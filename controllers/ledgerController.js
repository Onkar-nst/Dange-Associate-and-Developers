const Ledger = require('../models/Ledger');
const Customer = require('../models/Customer');
const Executive = require('../models/Executive');
const asyncHandler = require('../middleware/asyncHandler');
const { PARTY_TYPES } = require('../utils/constants');

/**
 * @desc    Get ledger entries for a party (customer or executive)
 * @route   GET /api/ledger/:partyId
 * @query   partyType (customer|executive)
 * @access  Private
 */
exports.getPartyLedger = asyncHandler(async (req, res, next) => {
    const { partyId } = req.params;
    const { partyType } = req.query;

    // Validate partyType
    if (!partyType || !Object.values(PARTY_TYPES).includes(partyType)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide valid partyType (customer or executive)'
        });
    }

    // Verify party exists
    let party;
    if (partyType === PARTY_TYPES.CUSTOMER) {
        party = await Customer.findById(partyId);
    } else {
        party = await Executive.findById(partyId);
    }

    if (!party) {
        return res.status(404).json({
            success: false,
            error: `${partyType} not found`
        });
    }

    // Get ledger entries
    const ledgerEntries = await Ledger.find({
        partyType,
        partyId,
        active: true
    })
        .populate('enteredBy', 'name')
        .sort({ transactionDate: 1 });

    // Calculate totals
    const totals = ledgerEntries.reduce((acc, entry) => {
        acc.totalCredit += entry.credit || 0;
        acc.totalDebit += entry.debit || 0;
        return acc;
    }, { totalCredit: 0, totalDebit: 0 });

    totals.currentBalance = totals.totalDebit - totals.totalCredit;

    res.status(200).json({
        success: true,
        party: { name: party.name, type: partyType },
        count: ledgerEntries.length,
        totals,
        data: ledgerEntries
    });
});

/**
 * @desc    Create manual ledger entry
 * @route   POST /api/ledger
 * @access  Private
 */
exports.createLedgerEntry = asyncHandler(async (req, res, next) => {
    const { partyType, partyId, credit, debit, description } = req.body;

    if (!partyType || !partyId) {
        return res.status(400).json({
            success: false,
            error: 'Please provide partyType and partyId'
        });
    }

    if (!credit && !debit) {
        return res.status(400).json({
            success: false,
            error: 'Please provide credit or debit amount'
        });
    }

    // Get last balance for this party
    const lastEntry = await Ledger.findOne({ partyType, partyId, active: true })
        .sort({ transactionDate: -1 });

    const previousBalance = lastEntry ? lastEntry.balance : 0;
    const numCredit = Number(credit) || 0;
    const numDebit = Number(debit) || 0;
    const newBalance = previousBalance + numDebit - numCredit;

    const ledgerEntry = await Ledger.create({
        partyType,
        partyId,
        credit: numCredit,
        debit: numDebit,
        balance: newBalance,
        description,
        referenceType: 'other',
        enteredBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'Ledger entry created',
        data: ledgerEntry
    });
});

/**
 * @desc    Soft delete a ledger entry
 * @route   DELETE /api/ledger/:id
 * @access  Private
 */
exports.deleteLedgerEntry = asyncHandler(async (req, res, next) => {
    const entry = await Ledger.findById(req.params.id);

    if (!entry) {
        return res.status(404).json({
            success: false,
            error: 'Entry not found'
        });
    }

    // Soft delete
    entry.active = false;
    await entry.save();

    res.status(200).json({
        success: true,
        message: 'Entry removed from ledger balance'
    });
});
