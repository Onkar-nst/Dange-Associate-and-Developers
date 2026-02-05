const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const CommissionLedger = require('../models/CommissionLedger');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

/**
 * @desc    Sales Report - Project-wise sales summary
 * @route   GET /api/reports/sales
 * @access  Private (Boss, Head Executive)
 */
exports.getSalesReport = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, projectId } = req.query;

    const query = { active: true };

    if (startDate || endDate) {
        query.bookingDate = {};
        if (startDate) query.bookingDate.$gte = new Date(startDate);
        if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    if (projectId) {
        query.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const sales = await Customer.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$projectId',
                totalDeals: { $sum: 1 },
                totalValue: { $sum: '$dealValue' }
            }
        },
        {
            $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: '_id',
                as: 'project'
            }
        },
        { $unwind: '$project' },
        {
            $project: {
                _id: 1,
                projectName: '$project.projectName',
                totalDeals: 1,
                totalValue: 1
            }
        },
        { $sort: { totalValue: -1 } }
    ]);

    const overall = sales.reduce((acc, curr) => {
        acc.deals += curr.totalDeals;
        acc.value += curr.totalValue;
        return acc;
    }, { deals: 0, value: 0 });

    res.status(200).json({
        success: true,
        summary: overall,
        data: sales
    });
});

/**
 * @desc    Collection Report - Payment mode breakup and total collection
 * @route   GET /api/reports/collection
 * @access  Private (Boss, Head Executive)
 */
exports.getCollectionReport = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, projectId } = req.query;

    const query = { active: true };

    if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) query.transactionDate.$gte = new Date(startDate);
        if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    // If projectId filter is applied, we need to filter transactions by customers of that project
    if (projectId) {
        const customersInProject = await Customer.find({ projectId }).select('_id');
        const customerIds = customersInProject.map(c => c._id);
        query.customerId = { $in: customerIds };
    }

    const collection = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$paymentMode',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                mode: '$_id',
                amount: '$totalAmount',
                count: 1,
                _id: 0
            }
        }
    ]);

    const totalCollected = collection.reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
        success: true,
        totalCollected,
        breakup: collection
    });
});

/**
 * @desc    Customer Outstanding Report - Pending dues summary
 * @route   GET /api/reports/outstanding
 * @access  Private (Boss, Head Executive)
 */
exports.getOutstandingReport = asyncHandler(async (req, res, next) => {
    const { projectId } = req.query;

    const query = { active: true, balanceAmount: { $gt: 0 } };

    if (projectId) {
        query.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const outstanding = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber')
        .select('name phone dealValue paidAmount balanceAmount projectId plotId bookingDate')
        .sort({ balanceAmount: -1 });

    const totalOutstanding = outstanding.reduce((sum, item) => sum + item.balanceAmount, 0);

    res.status(200).json({
        success: true,
        totalOutstanding,
        count: outstanding.length,
        data: outstanding
    });
});

/**
 * @desc    Executive Performance Report - Sales and collection by executive
 * @route   GET /api/reports/executive-performance
 * @access  Private (Boss, Head Executive)
 */
exports.getExecutivePerformanceReport = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, executiveId } = req.query;

    // Filters for Customer (Sales)
    const salesQuery = { active: true };
    if (executiveId) salesQuery.assignedExecutive = new mongoose.Types.ObjectId(executiveId);
    if (startDate || endDate) {
        salesQuery.bookingDate = {};
        if (startDate) salesQuery.bookingDate.$gte = new Date(startDate);
        if (endDate) salesQuery.bookingDate.$lte = new Date(endDate);
    }

    // Aggregate Sales by Executive
    const salesData = await Customer.aggregate([
        { $match: salesQuery },
        {
            $group: {
                _id: '$assignedExecutive',
                totalSalesCount: { $sum: 1 },
                totalSalesValue: { $sum: '$dealValue' },
                totalCollected: { $sum: '$paidAmount' }
            }
        }
    ]);

    // Aggregate Commission by Executive
    const commQuery = {};
    if (executiveId) commQuery.executiveId = new mongoose.Types.ObjectId(executiveId);
    if (startDate || endDate) {
        commQuery.generatedAt = {};
        if (startDate) commQuery.generatedAt.$gte = new Date(startDate);
        if (endDate) commQuery.generatedAt.$lte = new Date(endDate);
    }

    const commissionData = await CommissionLedger.aggregate([
        { $match: commQuery },
        {
            $group: {
                _id: '$executiveId',
                totalEarned: {
                    $sum: { $cond: [{ $in: ['$status', ['earned', 'paid']] }, '$amount', 0] }
                },
                totalPaid: {
                    $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
                }
            }
        },
        {
            $project: {
                totalEarned: 1,
                totalPaid: 1,
                pending: 1,
                balance: { $subtract: ['$totalEarned', '$totalPaid'] }
            }
        }
    ]);

    // Merge Data
    const executives = await User.find({ role: { $in: ['Executive', 'Head Executive'] }, active: true }).select('name userId');

    const report = executives.map(exec => {
        const sales = salesData.find(s => s._id?.toString() === exec._id.toString()) || { totalSalesCount: 0, totalSalesValue: 0, totalCollected: 0 };
        const comm = commissionData.find(c => c._id?.toString() === exec._id.toString()) || { totalEarned: 0, totalPaid: 0, pending: 0, balance: 0 };

        return {
            executiveId: exec._id,
            name: exec.name,
            userId: exec.userId,
            salesCount: sales.totalSalesCount,
            salesValue: sales.totalSalesValue,
            collectionDone: sales.totalCollected,
            commissions: {
                totalEarned: comm.totalEarned,
                paid: comm.totalPaid,
                pending: comm.pending,
                balance: comm.balance
            }
        };
    }).filter(r => {
        if (executiveId) return r.executiveId.toString() === executiveId;
        return r.salesCount > 0 || r.commissions.totalEarned > 0;
    });

    res.status(200).json({
        success: true,
        data: report
    });
});

/**
 * @desc    Detailed Customer Statement (Project & Status wise)
 * @route   GET /api/reports/customer-statement
 */
exports.getDetailedCustomerStatement = asyncHandler(async (req, res, next) => {
    const { status, projectId } = req.query;

    let query = { active: true };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);

    // Status filter: all, token, agreement, cancelled, registered
    if (status && status !== 'all') {
        if (status === 'token') query.transactionStatus = 'Token';
        else if (status === 'registered') query.transactionStatus = 'Registered';
        else if (status === 'cancelled') query.transactionStatus = 'Cancelled';
        // Handle 'agreement' or other custom statuses if they exist
    }

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber')
        .sort({ createdAt: -1 });

    const data = customers.map((c, index) => ({
        sr: index + 1,
        id: c._id,
        name: c.name || `${c.firstName} ${c.lastName}`,
        plotNo: c.plotId?.plotNumber || 'N/A',
        cost: c.dealValue,
        received: c.paidAmount,
        balance: c.balanceAmount,
        status: c.transactionStatus,
        bookingDate: c.bookingDate
    }));

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

/**
 * @desc    Customer Dues Report (Project & Executive wise)
 * @route   GET /api/reports/dues
 */
exports.getCustomerDuesReport = asyncHandler(async (req, res, next) => {
    const { projectId, executiveId } = req.query;

    let query = { active: true, balanceAmount: { $gt: 0 } };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);
    if (executiveId) query.assignedExecutive = new mongoose.Types.ObjectId(executiveId);

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber totalValue size')
        .populate('assignedExecutive', 'name')
        .sort({ balanceAmount: -1 });

    const data = customers.map((c, index) => {
        // Simplified EMI calculations for now
        const totalEMI = c.tenure || 0;
        const paidEMI = Math.floor(c.paidAmount / (c.emiAmount || 1));
        const balanceEMI = totalEMI - paidEMI;

        return {
            sr: index + 1,
            name: c.name,
            plotNo: c.plotId?.plotNumber || 'N/A',
            area: c.plotId?.size || c.sqFt || 0,
            emiAmt: c.emiAmount || 0,
            cost: c.dealValue,
            paidAmt: c.paidAmount,
            balance: c.balanceAmount,
            dpPaid: c.paidAmount, // Assuming first payments are DP
            noEMI: totalEMI,
            beAmt: balanceEMI * (c.emiAmount || 0),
            interest: 0, // Not tracked yet
            totalBal: c.balanceAmount,
            contactNo: c.phone,
            agent: c.assignedExecutive?.name || 'N/A',
            emiDate: c.emiStartDate
        };
    });

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

/**
 * @desc    Ledger Report - Detailed historical ledger for a party
 * @route   GET /api/reports/ledger
 * @access  Private (Boss, Head Executive)
 */
exports.getLedgerReport = asyncHandler(async (req, res, next) => {
    const { partyId, startDate, endDate, partyType } = req.query;

    if (!partyId || !partyType) {
        return res.status(400).json({
            success: false,
            error: 'Please provide partyId and partyType (customer/executive)'
        });
    }

    const query = {
        partyId: new mongoose.Types.ObjectId(partyId),
        partyType,
        active: true
    };

    // 1. Calculate Opening Balance (sum of all entries before startDate)
    let openingBalance = 0;
    if (startDate) {
        const historicalEntries = await Ledger.aggregate([
            {
                $match: {
                    partyId: new mongoose.Types.ObjectId(partyId),
                    partyType,
                    active: true,
                    transactionDate: { $lt: new Date(startDate) }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: '$debit' },
                    totalCredit: { $sum: '$credit' }
                }
            }
        ]);

        if (historicalEntries.length > 0) {
            // Balance = Debits - Credits
            openingBalance = historicalEntries[0].totalDebit - historicalEntries[0].totalCredit;
        }
    }

    // 2. Get period entries
    const periodQuery = { ...query };
    if (startDate || endDate) {
        periodQuery.transactionDate = {};
        if (startDate) periodQuery.transactionDate.$gte = new Date(startDate);
        if (endDate) periodQuery.transactionDate.$lte = new Date(endDate);
    }

    const entries = await Ledger.find(periodQuery).sort({ transactionDate: 1 });

    // 3. Calculate running balance starting from opening
    let runningBalance = openingBalance;
    const dataWithRunningBalance = entries.map(entry => {
        runningBalance += (entry.debit - entry.credit);
        return {
            ...entry.toObject(),
            runningBalance
        };
    });

    res.status(200).json({
        success: true,
        openingBalance,
        closingBalance: runningBalance,
        count: entries.length,
        data: dataWithRunningBalance
    });
});

/**
 * @desc    Cash Book Report - Daily Receipts and Payments
 * @route   GET /api/reports/cash-book
 */
exports.getCashBook = asyncHandler(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    // 1. Calculate combined opening balance before startDate
    // For Cash Book, we typically look at Cash/Bank ledger accounts
    const historical = await Ledger.aggregate([
        {
            $match: {
                active: true,
                transactionDate: { $lt: start }
            }
        },
        {
            $group: {
                _id: null,
                totalDebit: { $sum: '$debit' },
                totalCredit: { $sum: '$credit' }
            }
        }
    ]);

    let runningBalance = historical.length > 0 ? (historical[0].totalDebit - historical[0].totalCredit) : 0;

    // 2. Get all transactions in range
    const transactions = await Ledger.find({
        active: true,
        transactionDate: { $gte: start, $lte: end }
    }).sort({ transactionDate: 1, createdAt: 1 });

    // 3. Group by Date
    const grouped = {};
    let tempBalance = runningBalance;

    transactions.forEach(t => {
        const dateStr = t.transactionDate.toISOString().split('T')[0];
        if (!grouped[dateStr]) {
            grouped[dateStr] = {
                date: dateStr,
                openingBalance: tempBalance,
                items: [],
                totalReceipt: 0,
                totalPayment: 0,
                closingBalance: 0
            };
        }

        grouped[dateStr].items.push(t);
        grouped[dateStr].totalReceipt += t.debit;
        grouped[dateStr].totalPayment += t.credit;
        tempBalance += (t.debit - t.credit);
        grouped[dateStr].closingBalance = tempBalance;
    });

    res.status(200).json({
        success: true,
        openingBalance: runningBalance,
        data: Object.values(grouped)
    });
});

/**
 * @desc    Dashboard Project Summary
 * @route   GET /api/reports/dashboard-project-summary
 */
exports.getProjectSummary = asyncHandler(async (req, res, next) => {
    const summary = await Project.aggregate([
        { $match: { active: true } },
        {
            $lookup: {
                from: 'customers',
                localField: '_id',
                foreignField: 'projectId',
                as: 'customers'
            }
        },
        {
            $project: {
                projectName: 1,
                totalSale: { $sum: '$customers.dealValue' },
                totalReceived: { $sum: '$customers.paidAmount' },
                balance: { $subtract: [{ $sum: '$customers.dealValue' }, { $sum: '$customers.paidAmount' }] }
            }
        }
    ]);

    res.status(200).json({ success: true, data: summary });
});

/**
 * @desc    Dashboard Sales Position Summary
 * @route   GET /api/reports/dashboard-sales-position
 */
exports.getSalesPositionSummary = asyncHandler(async (req, res, next) => {
    const summary = await Project.aggregate([
        { $match: { active: true } },
        {
            $lookup: {
                from: 'plots',
                localField: '_id',
                foreignField: 'projectId',
                as: 'plots'
            }
        },
        {
            $project: {
                projectName: 1,
                totalPlots: { $size: '$plots' },
                booked: {
                    $size: {
                        $filter: {
                            input: '$plots',
                            as: 'plot',
                            cond: { $eq: ['$$plot.status', 'booked'] }
                        }
                    }
                },
                sold: {
                    $size: {
                        $filter: {
                            input: '$plots',
                            as: 'plot',
                            cond: { $eq: ['$$plot.status', 'sold'] }
                        }
                    }
                },
                available: {
                    $size: {
                        $filter: {
                            input: '$plots',
                            as: 'plot',
                            cond: { $eq: ['$$plot.status', 'available'] }
                        }
                    }
                }
            }
        }
    ]);

    res.status(200).json({ success: true, data: summary });
});

/**
 * @desc    Dashboard Project Receipts & Payments Summary
 */
exports.getProjectReceiptPaymentSummary = asyncHandler(async (req, res, next) => {
    // This requires complex aggregation to link Ledger/Transaction to Projects via Customers
    // For now, simpler: Group Ledger by Project (if reference is to customer)
    const summary = await Customer.aggregate([
        { $match: { active: true } },
        {
            $lookup: {
                from: 'projects',
                localField: 'projectId',
                foreignField: '_id',
                as: 'project'
            }
        },
        { $unwind: '$project' },
        {
            $group: {
                _id: '$projectId',
                projectName: { $first: '$project.projectName' },
                totalReceipt: { $sum: '$paidAmount' },
                // Payment would come from expenses linked to project - placeholder for now
                totalPayment: { $sum: 0 }
            }
        }
    ]);

    res.status(200).json({ success: true, data: summary });
});

/**
 * @desc    Daily Collection Register
 * @route   GET /api/reports/daily-collection
 */
exports.getDailyCollectionRegister = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, projectId, partnerId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    let query = {
        active: true,
        transactionDate: { $gte: start, $lte: end }
    };

    // Filter by project if provided (Ledger has partyId which could be Customer, and Customer has projectId)
    // A more direct way is to find customers of that project first
    let customerIds = [];
    if (projectId) {
        const customers = await Customer.find({ projectId, active: true }).select('_id');
        customerIds = customers.map(c => c._id);
        query.partyId = { $in: customerIds };
    }

    // Fetch transactions
    const ledgers = await Ledger.find(query)
        .populate('partyId', 'name firstName lastName')
        .sort({ transactionDate: 1 });

    // Group by Cash/Bank (Simplified: if debit > 0 it's receipt, if credit > 0 it's payment)
    // We'll categorize based on the account type or description for now as per image
    const grouped = {
        cash: [],
        bank: [],
        summary: {
            cashRec: 0, cashPay: 0,
            bankRec: 0, bankPay: 0
        }
    };

    ledgers.forEach(l => {
        const item = {
            date: l.transactionDate,
            recNo: l._id.toString().slice(-4).toUpperCase(),
            customerName: l.partyId?.name || (l.partyId ? `${l.partyId.firstName} ${l.partyId.lastName}` : 'N/A'),
            recType: l.referenceType || 'General',
            particular: l.description,
            received: l.debit,
            payment: l.credit
        };

        // Categorize by "Cash" or "Bank" based on description or account name in a real app
        // Here we assume if debit is present it's a receipt
        if (l.description.toLowerCase().includes('cash')) {
            grouped.cash.push(item);
            grouped.summary.cashRec += l.debit;
            grouped.summary.cashPay += l.credit;
        } else {
            grouped.bank.push(item);
            grouped.summary.bankRec += l.debit;
            grouped.summary.bankPay += l.credit;
        }
    });

    // Fetch Tokens (Customers with status Token in that range)
    let tokenQuery = {
        active: true,
        transactionStatus: 'Token',
        bookingDate: { $gte: start, $lte: end }
    };
    if (projectId) tokenQuery.projectId = projectId;

    const tokens = await Customer.find(tokenQuery)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber');

    res.status(200).json({
        success: true,
        data: grouped,
        tokens: tokens.map((t, idx) => ({
            sr: idx + 1,
            name: t.name || `${t.firstName} ${t.lastName}`,
            project: t.projectId?.projectName,
            plotNo: t.plotId?.plotNumber,
            status: t.transactionStatus
        }))
    });
});
