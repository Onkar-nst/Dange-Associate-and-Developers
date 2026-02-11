const JournalVoucher = require('../models/JournalVoucher');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

/**
 * @desc    Create a new Journal Voucher (JV)
 * @route   POST /api/jv
 * @access  Private
 */
exports.createJV = asyncHandler(async (req, res, next) => {
    let { branch, transactionDate, debitAccount, creditAccount, amount, narration } = req.body;
    amount = Number(amount);

    if (!debitAccount || !creditAccount || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Please provide debit account, credit account and amount'
        });
    }

    // Generate JV Number (simple implementation: JV-timestamp)
    const count = await JournalVoucher.countDocuments();
    const jvNumber = `JV-${1000 + count + 1}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create Journal Voucher Entry
        const jv = await JournalVoucher.create([{
            jvNumber,
            branch,
            transactionDate: transactionDate || Date.now(),
            debitAccount,
            creditAccount,
            amount,
            narration,
            enteredBy: req.user.id
        }], { session });

        // 2. Create Ledger Entry for Debit side
        // Balance = previous + (debit - credit)
        const lastDebitLedger = await Ledger.findOne({
            partyType: debitAccount.partyType,
            partyId: debitAccount.partyId,
            active: true
        }).sort({ transactionDate: -1, createdAt: -1 }).session(session);

        const prevDebitBalance = lastDebitLedger ? lastDebitLedger.balance : 0;

        await Ledger.create([{
            partyType: debitAccount.partyType,
            partyId: debitAccount.partyId,
            debit: amount,
            credit: 0,
            balance: prevDebitBalance + amount, // Debit increases balance (asset/exp)
            description: `JV Entry: ${jvNumber} - ${narration}`,
            referenceType: 'other',
            referenceId: jv[0]._id,
            transactionDate: transactionDate || Date.now(),
            enteredBy: req.user.id
        }], { session });

        // 3. Create Ledger Entry for Credit side
        const lastCreditLedger = await Ledger.findOne({
            partyType: creditAccount.partyType,
            partyId: creditAccount.partyId,
            active: true
        }).sort({ transactionDate: -1, createdAt: -1 }).session(session);

        const prevCreditBalance = lastCreditLedger ? lastCreditLedger.balance : 0;

        await Ledger.create([{
            partyType: creditAccount.partyType,
            partyId: creditAccount.partyId,
            debit: 0,
            credit: amount,
            balance: prevCreditBalance - amount, // Credit decreases balance
            description: `JV Entry: ${jvNumber} - ${narration}`,
            referenceType: 'other',
            referenceId: jv[0]._id,
            transactionDate: transactionDate || Date.now(),
            enteredBy: req.user.id
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            data: jv[0]
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @desc    Get all Journal Vouchers
 * @route   GET /api/jv
 * @access  Private
 */
exports.getJVs = asyncHandler(async (req, res, next) => {
    const jvs = await JournalVoucher.find({ active: true })
        .sort({ transactionDate: -1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: jvs.length,
        data: jvs
    });
});

/**
 * @desc    Deactivate a JV (Soft delete)
 * @route   DELETE /api/jv/:id
 * @access  Private
 */
exports.deleteJV = asyncHandler(async (req, res, next) => {
    const jv = await JournalVoucher.findById(req.params.id);

    if (!jv) {
        return res.status(404).json({
            success: false,
            error: 'JV not found'
        });
    }

    // Soft delete JV and related ledger entries
    await JournalVoucher.findByIdAndUpdate(req.params.id, { active: false });
    await Ledger.updateMany({ referenceId: req.params.id }, { active: false });

    res.status(200).json({
        success: true,
        message: 'JV deactivated'
    });
});
