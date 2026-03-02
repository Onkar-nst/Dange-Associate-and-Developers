const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
const LedgerAccount = require('../models/LedgerAccount');
const asyncHandler = require('../middleware/asyncHandler');
const { PARTY_TYPES, COMMISSION_TRIGGERS } = require('../utils/constants');
const { processCommission } = require('./commissionController');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create a new transaction (payment received)
 * @route   POST /api/transactions
 * @access  Private
 * @business Updates customer paidAmount and balance, creates ledger entry
 */
exports.createTransaction = asyncHandler(async (req, res, next) => {
    const {
        customerId,
        amount,
        paymentMode,
        referenceNumber,
        bankName,
        remarks,
        entryType,
        transactionType,
        narration,
        receiptNumber,
        transactionDate,
        accountType,
        projectId
    } = req.body;

    // Check if account exists (Customer or LedgerAccount)
    let account = null;
    if (accountType === 'LedgerAccount') {
        account = await LedgerAccount.findById(customerId);
    } else {
        account = await Customer.findById(customerId);
    }

    if (!account) {
        return res.status(404).json({
            success: false,
            error: `${accountType || 'Customer'} not found`
        });
    }

    // BUSINESS RULE: Update balances if it's a customer
    let newPaidAmount = account.paidAmount || 0;
    let newBalanceAmount = account.balanceAmount || 0;

    if (accountType !== 'LedgerAccount') {
        if (entryType === 'Receipt') {
            newPaidAmount += Number(amount);
        } else if (entryType === 'Payment') {
            newPaidAmount -= Number(amount);
        } else {
            newPaidAmount += Number(amount); // Default to Receipt behavior
        }
        newBalanceAmount = account.dealValue - newPaidAmount;
    }

    // Create transaction
    const transaction = await Transaction.create({
        customerId,
        accountType: accountType || 'Customer',
        projectId: projectId || account.projectId,
        amount,
        paymentMode,
        referenceNumber,
        bankName,
        remarks,
        entryType: entryType || 'Receipt',
        transactionType: transactionType || 'Select Type',
        narration,
        receiptNumber,
        balanceAtTime: accountType !== 'LedgerAccount' ? newBalanceAmount : undefined,
        transactionDate: transactionDate || Date.now(),
        enteredBy: req.user.id
    });

    if (accountType !== 'LedgerAccount') {
        await Customer.findByIdAndUpdate(customerId, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount
        });
    }

    // BUSINESS RULE: Create ledger entry
    await Ledger.create({
        partyType: accountType === 'LedgerAccount' ? PARTY_TYPES.LEDGER_ACCOUNT : PARTY_TYPES.CUSTOMER,
        partyId: customerId,
        credit: entryType === 'Receipt' ? amount : 0,
        debit: entryType === 'Payment' ? amount : 0,
        balance: accountType !== 'LedgerAccount' ? newBalanceAmount : 0,
        description: narration || `${transactionType} via ${paymentMode}`,
        referenceType: 'transaction',
        referenceId: transaction._id,
        transactionDate: transactionDate || Date.now(),
        enteredBy: req.user.id
    });

    // BUSINESS RULE: Process commissions only for CUSTOMERS and only for receipts
    if (accountType !== 'LedgerAccount' && entryType === 'Receipt') {
        await processCommission(COMMISSION_TRIGGERS.PAYMENT_RECEIVED, {
            executiveId: account.assignedExecutive,
            projectId: account.projectId,
            plotId: account.plotId,
            customerId: account._id,
            amount: amount,
            transactionId: transaction._id,
            paymentMode: transaction.paymentMode
        });
    }

    // Populate and return transaction
    const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('customerId', 'name phone')
        .populate('projectId', 'projectName')
        .populate('enteredBy', 'name');

    // Send notification
    await createNotification({
        type: 'payment_received',
        title: `${entryType || 'Receipt'} Recorded`,
        message: `₹${amount.toLocaleString('en-IN')} ${entryType || 'Receipt'} from ${account.name || 'Account'} via ${paymentMode}`,
        icon: entryType === 'Payment' ? '💸' : '💰',
        referenceId: transaction._id.toString(),
        referenceType: 'transaction'
    });

    res.status(201).json({
        success: true,
        message: 'Transaction recorded successfully',
        data: {
            transaction: populatedTransaction,
            customerBalance: {
                paidAmount: newPaidAmount,
                balanceAmount: newBalanceAmount
            }
        }
    });
});

/**
 * @desc    Get transactions for a customer
 * @route   GET /api/transactions/:customerId
 * @access  Private
 */
exports.getCustomerTransactions = asyncHandler(async (req, res, next) => {
    const { customerId } = req.params;

    // Check if account exists (Customer or LedgerAccount)
    let account = await Customer.findById(customerId);
    if (!account) {
        account = await LedgerAccount.findById(customerId);
    }

    if (!account) {
        return res.status(404).json({
            success: false,
            error: 'Account not found'
        });
    }

    const transactions = await Transaction.find({
        customerId,
        active: true
    })
        .populate('enteredBy', 'name')
        .sort({ transactionDate: 1, createdAt: 1 }); // ASCENDING order with creation sequence for history

    // Calculate totals
    const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
        success: true,
        count: transactions.length,
        customer: {
            name: account.name || account.accountName,
            phone: account.phone || '-',
            dealValue: account.dealValue || 0,
            paidAmount: account.paidAmount || 0,
            balanceAmount: account.balanceAmount || 0
        },
        totalPaid,
        data: transactions
    });
});

/**
 * @desc    Get all transactions with optional filters
 * @route   GET /api/transactions
 * @query   paymentMode, startDate, endDate
 * @access  Private
 */
exports.getAllTransactions = asyncHandler(async (req, res, next) => {
    const { paymentMode, startDate, endDate, active } = req.query;

    // Build query
    let query = {};

    if (paymentMode) {
        query.paymentMode = paymentMode;
    }

    if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) {
            query.transactionDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.transactionDate.$lte = new Date(endDate);
        }
    }

    if (active !== undefined) {
        query.active = active === 'true';
    } else {
        query.active = true;
    }

    const transactions = await Transaction.find(query)
        .populate('customerId', 'name phone')
        .populate('enteredBy', 'name')
        .sort({ transactionDate: -1, createdAt: -1 });

    // Calculate totals by payment mode
    const totals = await Transaction.aggregate([
        { $match: { active: true } },
        {
            $group: {
                _id: '$paymentMode',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: transactions.length,
        totals,
        data: transactions
    });
});

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/single/:id
 * @access  Private
 */
exports.getTransaction = asyncHandler(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id)
        .populate('customerId', 'name phone dealValue paidAmount balanceAmount')
        .populate('enteredBy', 'name');

    if (!transaction) {
        return res.status(404).json({
            success: false,
            error: 'Transaction not found'
        });
    }

    res.status(200).json({
        success: true,
        data: transaction
    });
});

/**
 * @desc    Update transaction (editable fields only)
 * @route   PUT /api/transactions/single/:id
 * @access  Private
 */
exports.updateTransaction = asyncHandler(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (!transaction.active) {
        return res.status(400).json({ success: false, error: 'Cannot edit a deleted transaction' });
    }

    // Only allow editing these safe fields (amount changes would break balance)
    const { transactionDate, receiptNumber, narration, remarks, paymentMode, bankName, referenceNumber, transactionType } = req.body;
    const updateData = {};
    if (transactionDate !== undefined) updateData.transactionDate = transactionDate;
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber;
    if (narration !== undefined) updateData.narration = narration;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber;
    if (transactionType !== undefined) updateData.transactionType = transactionType;

    const updated = await Transaction.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Transaction updated successfully', data: updated });
});

/**
 * @desc    Deactivate transaction (soft delete) - reverses ledger
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
exports.deactivateTransaction = asyncHandler(async (req, res, next) => {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            error: 'Transaction not found'
        });
    }

    if (!transaction.active) {
        return res.status(400).json({
            success: false,
            error: 'Transaction is already deactivated'
        });
    }

    // Get customer
    const customer = await Customer.findById(transaction.customerId);
    if (customer) {
        // Reverse the payment
        const newPaidAmount = customer.paidAmount - transaction.amount;
        const newBalanceAmount = customer.dealValue - newPaidAmount;

        await Customer.findByIdAndUpdate(transaction.customerId, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount
        });

        // Create reversal ledger entry
        await Ledger.create({
            partyType: PARTY_TYPES.CUSTOMER,
            partyId: transaction.customerId,
            credit: 0,
            debit: transaction.amount,
            balance: newBalanceAmount,
            description: `Transaction reversed (Original: ${transaction.paymentMode}${transaction.referenceNumber ? ` - ${transaction.referenceNumber}` : ''})`,
            referenceType: 'adjustment',
            referenceId: transaction._id,
            enteredBy: req.user.id
        });
    }

    // Soft delete transaction
    transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    // Also deactivate the related ledger entry
    await Ledger.updateOne(
        { referenceType: 'transaction', referenceId: req.params.id },
        { active: false }
    );

    res.status(200).json({
        success: true,
        message: 'Transaction deactivated and reversed successfully',
        data: transaction
    });
});
