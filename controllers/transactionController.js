const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
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
    let {
        customerId, amount, paymentMode,
        referenceNumber, bankName, remarks, transactionDate,
        entryType, transactionType, projectId, narration, receiptNumber
    } = req.body;
    amount = Number(amount);

    // Validate required fields
    if (!customerId || amount === undefined || !paymentMode) {
        return res.status(400).json({
            success: false,
            error: 'Please provide customerId, amount, and paymentMode'
        });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // BUSINESS RULE: Update customer paidAmount and balanceAmount
    // If Receipt: paidAmount increases, balanceAmount decreases
    // If Payment: paidAmount decreases, balanceAmount increases (unlikely for customer but handled)
    let newPaidAmount = customer.paidAmount;
    if (entryType === 'Receipt') {
        newPaidAmount += Number(amount);
    } else if (entryType === 'Payment') {
        newPaidAmount -= Number(amount);
    } else {
        newPaidAmount += Number(amount); // Default to Receipt behavior
    }

    const newBalanceAmount = customer.dealValue - newPaidAmount;

    // Create transaction
    const transaction = await Transaction.create({
        customerId,
        projectId: projectId || customer.projectId,
        amount,
        paymentMode,
        referenceNumber,
        bankName,
        remarks,
        entryType: entryType || 'Receipt',
        transactionType: transactionType || 'Select Type',
        narration,
        receiptNumber,
        balanceAtTime: newBalanceAmount,
        transactionDate: transactionDate || Date.now(),
        enteredBy: req.user.id
    });

    await Customer.findByIdAndUpdate(customerId, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount
    });

    // BUSINESS RULE: Create ledger entry
    await Ledger.create({
        partyType: PARTY_TYPES.CUSTOMER,
        partyId: customerId,
        credit: entryType === 'Receipt' ? amount : 0,
        debit: entryType === 'Payment' ? amount : 0,
        balance: newBalanceAmount,
        description: narration || `${transactionType} via ${paymentMode}`,
        referenceType: 'transaction',
        referenceId: transaction._id,
        transactionDate: transactionDate || Date.now(),
        enteredBy: req.user.id
    });

    // BUSINESS RULE: Process commissions if it's a receipt
    if (entryType === 'Receipt') {
        await processCommission(COMMISSION_TRIGGERS.PAYMENT_RECEIVED, {
            executiveId: customer.assignedExecutive,
            projectId: customer.projectId,
            plotId: customer.plotId,
            customerId: customer._id,
            amount: amount,
            transactionId: transaction._id
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
        message: `₹${amount.toLocaleString('en-IN')} ${entryType || 'Receipt'} from ${customer.firstName} ${customer.lastName} via ${paymentMode}`,
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

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    const transactions = await Transaction.find({
        customerId,
        active: true
    })
        .populate('enteredBy', 'name')
        .sort({ transactionDate: -1 });

    // Calculate totals
    const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
        success: true,
        count: transactions.length,
        customer: {
            name: customer.name,
            phone: customer.phone,
            dealValue: customer.dealValue,
            paidAmount: customer.paidAmount,
            balanceAmount: customer.balanceAmount
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
        .sort({ transactionDate: -1 });

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
