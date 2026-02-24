const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const CommissionLedger = require('../models/CommissionLedger');
const Project = require('../models/Project');
const User = require('../models/User');
const Executive = require('../models/Executive');
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
        else if (status === 'agreement') query.transactionStatus = 'Agreement';
        else if (status === 'registered') query.transactionStatus = 'Registered';
        else if (status === 'cancelled') query.transactionStatus = 'Cancelled';
        else if (status === 'booked') query.transactionStatus = 'Booked';
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

    let partyInfo = null;
    if (partyType === 'customer') {
        const customer = await Customer.findById(partyId)
            .populate('projectId')
            .populate('plotId');
        if (customer) {
            partyInfo = {
                plotNo: customer.plotId?.plotNumber,
                areaSqMtr: customer.sqMtr || customer.plotId?.sqMtr,
                areaSqFt: customer.sqFt || customer.plotId?.size,
                emiAmount: customer.emiAmount,
                taluka: customer.projectId?.taluka,
                district: customer.projectId?.district,
                phn: customer.projectId?.phn,
                khasara: customer.projectId?.khasara
            };
        }
    }

    res.status(200).json({
        success: true,
        openingBalance,
        closingBalance: runningBalance,
        count: entries.length,
        partyInfo,
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
    const { startDate, endDate, projectId } = req.query;

    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date(new Date().setHours(23, 59, 59, 999));

    // Build transaction query
    let txQuery = {
        active: true,
        transactionDate: { $gte: start, $lte: end }
    };

    // Filter by project — find customers of that project first
    if (projectId) {
        const projectCustomers = await Customer.find({ projectId, active: true }).select('_id');
        txQuery.customerId = { $in: projectCustomers.map(c => c._id) };
    }

    // Fetch all transactions (both Cash and Bank) from Transaction model
    const transactions = await Transaction.find(txQuery)
        .populate('customerId', 'name phone')
        .populate('projectId', 'projectName')
        .sort({ transactionDate: 1 });

    const grouped = {
        cash: [],
        bank: [],
        summary: {
            cashRec: 0, cashPay: 0,
            bankRec: 0, bankPay: 0
        }
    };

    transactions.forEach(t => {
        const item = {
            date: t.transactionDate,
            recNo: t.receiptNumber || t._id.toString().slice(-4).toUpperCase(),
            customerName: t.customerId?.name || 'N/A',
            recType: t.transactionType || 'General',
            particular: t.narration || t.transactionType || '-',
            received: t.entryType === 'Receipt' ? (t.amount || 0) : 0,
            payment: t.entryType === 'Payment' ? (t.amount || 0) : 0,
        };

        // Categorize by paymentMode field (Cash / Bank)
        if ((t.paymentMode || '').toLowerCase() === 'cash') {
            grouped.cash.push(item);
            grouped.summary.cashRec += item.received;
            grouped.summary.cashPay += item.payment;
        } else {
            // Bank or any other mode
            grouped.bank.push(item);
            grouped.summary.bankRec += item.received;
            grouped.summary.bankPay += item.payment;
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
        })),
        agreements: (await Customer.find({
            active: true,
            transactionStatus: 'Agreement',
            bookingDate: { $gte: start, $lte: end },
            ...(projectId && { projectId })
        }).populate('projectId', 'projectName').populate('plotId', 'plotNumber')).map((t, idx) => ({
            sr: idx + 1,
            name: t.name || `${t.firstName} ${t.lastName}`,
            project: t.projectId?.projectName,
            plotNo: t.plotId?.plotNumber,
            status: t.transactionStatus
        })),
        cancelled: (await Customer.find({
            active: true,
            transactionStatus: 'Cancelled',
            bookingDate: { $gte: start, $lte: end },
            ...(projectId && { projectId })
        }).populate('projectId', 'projectName').populate('plotId', 'plotNumber')).map((t, idx) => ({
            sr: idx + 1,
            name: t.name || `${t.firstName} ${t.lastName}`,
            project: t.projectId?.projectName,
            plotNo: t.plotId?.plotNumber,
            status: t.transactionStatus
        }))
    });
});

/**
 * @desc    Monthly EMI Reminder - Customers whose EMI is due in the selected month
 * @route   GET /api/reports/monthly-emi-reminder
 */
exports.getMonthlyEMIReminder = asyncHandler(async (req, res, next) => {
    const { date, projectId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const targetDay = targetDate.getDate();

    let query = { active: true, balanceAmount: { $gt: 0 }, emiStartDate: { $exists: true, $ne: null } };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber size')
        .populate('assignedExecutive', 'name')
        .sort({ name: 1 });

    const data = customers.filter(c => {
        if (!c.emiStartDate) return false;
        // Check if the EMI falls on the target day of the month
        return c.emiStartDate.getDate() === targetDay;
    }).map((c, index) => ({
        sr: index + 1,
        name: c.name,
        phone: c.phone || 'N/A',
        project: c.projectId?.projectName || 'N/A',
        plotNo: c.plotId?.plotNumber || 'N/A',
        emiAmount: c.emiAmount || 0,
        emiDate: c.emiStartDate,
        emiDay: c.emiStartDate ? c.emiStartDate.getDate() : 'N/A',
        dealValue: c.dealValue,
        paidAmount: c.paidAmount,
        balanceAmount: c.balanceAmount,
        tenure: c.tenure || 0,
        agent: c.assignedExecutive?.name || 'N/A',
        status: c.transactionStatus,
        month: targetMonth,
        year: targetYear
    }));

    res.status(200).json({
        success: true,
        count: data.length,
        month: targetMonth,
        year: targetYear,
        data
    });
});

/**
 * @desc    Customers Token by Executive - Token customers grouped by executive
 * @route   GET /api/reports/token-by-executive
 */
exports.getTokenByExecutive = asyncHandler(async (req, res, next) => {
    const { projectId, executiveId, startDate, endDate } = req.query;

    let query = { active: true, transactionStatus: 'Token' };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);
    if (executiveId) query.assignedExecutive = new mongoose.Types.ObjectId(executiveId);
    if (startDate || endDate) {
        query.bookingDate = {};
        if (startDate) query.bookingDate.$gte = new Date(startDate);
        if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber')
        .populate('assignedExecutive', 'name userId')
        .sort({ assignedExecutive: 1, bookingDate: -1 });

    // Group by executive
    const grouped = {};
    customers.forEach(c => {
        const exeName = c.assignedExecutive?.name || 'Unassigned';
        const exeId = c.assignedExecutive?._id?.toString() || 'unassigned';
        if (!grouped[exeId]) {
            grouped[exeId] = { executiveName: exeName, customers: [], totalTokenValue: 0, totalPaid: 0 };
        }
        grouped[exeId].customers.push({
            name: c.name,
            phone: c.phone,
            project: c.projectId?.projectName || 'N/A',
            plotNo: c.plotId?.plotNumber || 'N/A',
            dealValue: c.dealValue,
            paidAmount: c.paidAmount,
            balanceAmount: c.balanceAmount,
            bookingDate: c.bookingDate
        });
        grouped[exeId].totalTokenValue += c.dealValue;
        grouped[exeId].totalPaid += c.paidAmount;
    });

    res.status(200).json({
        success: true,
        totalTokens: customers.length,
        data: Object.values(grouped)
    });
});

/**
 * @desc    Executive/Customer Reminder - Upcoming EMIs & follow-ups
 * @route   GET /api/reports/executive-reminder
 */
exports.getExecutiveCustomerReminder = asyncHandler(async (req, res, next) => {
    const { executiveId, days } = req.query;
    const reminderDays = days ? parseInt(days) : 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + reminderDays);

    let query = { active: true, balanceAmount: { $gt: 0 } };
    if (executiveId) query.assignedExecutive = new mongoose.Types.ObjectId(executiveId);

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber')
        .populate('assignedExecutive', 'name userId')
        .sort({ emiStartDate: 1 });

    // Find customers whose EMI day falls within the reminder window
    const reminders = customers.filter(c => {
        if (!c.emiStartDate) return false;
        const emiDay = c.emiStartDate.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const nextEmiDate = new Date(currentYear, currentMonth, emiDay);
        if (nextEmiDate < today) nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
        return nextEmiDate >= today && nextEmiDate <= futureDate;
    }).map((c, index) => {
        const emiDay = c.emiStartDate.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const nextEmiDate = new Date(currentYear, currentMonth, emiDay);
        if (nextEmiDate < today) nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);

        return {
            sr: index + 1,
            name: c.name,
            phone: c.phone,
            project: c.projectId?.projectName || 'N/A',
            plotNo: c.plotId?.plotNumber || 'N/A',
            emiAmount: c.emiAmount || 0,
            nextEmiDate,
            daysLeft: Math.ceil((nextEmiDate - today) / (1000 * 60 * 60 * 24)),
            balanceAmount: c.balanceAmount,
            agent: c.assignedExecutive?.name || 'N/A',
            agentId: c.assignedExecutive?.userId || 'N/A',
            status: c.transactionStatus
        };
    });

    // Group by executive
    const grouped = {};
    reminders.forEach(r => {
        const key = r.agent;
        if (!grouped[key]) grouped[key] = { executiveName: key, reminders: [], count: 0 };
        grouped[key].reminders.push(r);
        grouped[key].count++;
    });

    res.status(200).json({
        success: true,
        totalReminders: reminders.length,
        reminderDays,
        data: Object.values(grouped),
        flat: reminders
    });
});

/**
 * @desc    Unit Calculation - Project-wise plot/unit statistics with area & value
 * @route   GET /api/reports/unit-calculation
 */
exports.getUnitCalculation = asyncHandler(async (req, res, next) => {
    const { projectId } = req.query;

    let matchStage = { active: true };
    if (projectId) matchStage._id = new mongoose.Types.ObjectId(projectId);

    const data = await Project.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'plots',
                localField: '_id',
                foreignField: 'projectId',
                as: 'plots'
            }
        },
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
                totalPlots: { $size: '$plots' },
                totalArea: { $sum: '$plots.size' },
                soldPlots: {
                    $size: {
                        $filter: { input: '$plots', as: 'p', cond: { $eq: ['$$p.status', 'sold'] } }
                    }
                },
                bookedPlots: {
                    $size: {
                        $filter: { input: '$plots', as: 'p', cond: { $eq: ['$$p.status', 'booked'] } }
                    }
                },
                availablePlots: {
                    $size: {
                        $filter: { input: '$plots', as: 'p', cond: { $eq: ['$$p.status', 'available'] } }
                    }
                },
                soldArea: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$plots', as: 'p', cond: { $ne: ['$$p.status', 'available'] } } },
                            as: 'sp',
                            in: '$$sp.size'
                        }
                    }
                },
                availableArea: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$plots', as: 'p', cond: { $eq: ['$$p.status', 'available'] } } },
                            as: 'ap',
                            in: '$$ap.size'
                        }
                    }
                },
                totalValue: { $sum: '$plots.totalValue' },
                totalDealValue: { $sum: '$customers.dealValue' },
                totalReceived: { $sum: '$customers.paidAmount' },
                totalOutstanding: { $sum: '$customers.balanceAmount' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

/**
 * @desc    User Daily Collection - Collection by individual user/executive on a date
 * @route   GET /api/reports/user-daily-collection
 */
exports.getUserDailyCollection = asyncHandler(async (req, res, next) => {
    const { date, executiveId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Get all transactions for the date
    let txQuery = { active: true, transactionDate: { $gte: start, $lte: end } };

    const transactions = await Transaction.find(txQuery)
        .populate('customerId', 'name phone projectId assignedExecutive')
        .populate({ path: 'customerId', populate: [{ path: 'projectId', select: 'projectName' }, { path: 'assignedExecutive', select: 'name userId' }] })
        .sort({ transactionDate: 1 });

    // Group by executive (via customer's assignedExecutive)
    const grouped = {};
    transactions.forEach(t => {
        const exec = t.customerId?.assignedExecutive;
        const exeName = exec?.name || 'Unassigned';
        const exeId = exec?._id?.toString() || 'unassigned';

        if (executiveId && exeId !== executiveId) return;

        if (!grouped[exeId]) {
            grouped[exeId] = { executiveName: exeName, collections: [], totalAmount: 0 };
        }
        grouped[exeId].collections.push({
            customerName: t.customerId?.name || 'N/A',
            phone: t.customerId?.phone || 'N/A',
            project: t.customerId?.projectId?.projectName || 'N/A',
            amount: t.amount,
            paymentMode: t.paymentMode,
            receiptNo: t.receiptNo || 'N/A',
            time: t.transactionDate
        });
        grouped[exeId].totalAmount += t.amount;
    });

    const grandTotal = Object.values(grouped).reduce((sum, g) => sum + g.totalAmount, 0);

    res.status(200).json({
        success: true,
        date: targetDate.toISOString().split('T')[0],
        grandTotal,
        data: Object.values(grouped)
    });
});

/**
 * @desc    Customer EMI Dues - Customers with overdue EMIs
 * @route   GET /api/reports/customer-emi-dues
 */
exports.getCustomerEMIDues = asyncHandler(async (req, res, next) => {
    const { projectId, executiveId, searchDate, monthsEnter } = req.query;

    const reportDate = searchDate ? new Date(searchDate) : new Date();
    reportDate.setHours(23, 59, 59, 999);

    const minMonths = monthsEnter ? parseInt(monthsEnter) : 0;

    let query = { active: true, balanceAmount: { $gt: 0 }, emiStartDate: { $exists: true, $ne: null } };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);
    if (executiveId) query.assignedExecutive = new mongoose.Types.ObjectId(executiveId);

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber size')
        .populate('assignedExecutive', 'name')
        .sort({ name: 1 });

    const data = customers.map((c, index) => {
        const emiStart = new Date(c.emiStartDate);
        // Calculate months between emiStart and reportDate
        const monthsSinceStart = Math.max(0, (reportDate.getFullYear() - emiStart.getFullYear()) * 12 + (reportDate.getMonth() - emiStart.getMonth()));
        const expectedPaid = Math.min(monthsSinceStart + 1, c.tenure || 0) * (c.emiAmount || 0); // +1 because first month is usually due at start
        const actualPaid = c.paidAmount;
        const overdue = Math.max(0, expectedPaid - actualPaid);
        const overdueMonths = c.emiAmount > 0 ? Math.floor(overdue / c.emiAmount) : 0;

        return {
            sr: index + 1,
            name: c.name,
            phone: c.phone,
            project: c.projectId?.projectName || 'N/A',
            plotNo: c.plotId?.plotNumber || 'N/A',
            area: c.plotId?.size || c.sqFt || 0,
            emiAmount: c.emiAmount || 0,
            cost: c.dealValue || 0,
            paidAmount: c.paidAmount || 0,
            balance: c.balanceAmount || 0,
            dpPaid: c.paidAmount || 0, // In this context, it might be the total paid towards the plot
            agreementDate: c.agreementDate,
            noEmi: c.tenure || 0,
            overdue,
            overdueMonths,
            agent: c.assignedExecutive?.name || 'N/A',
            id: c._id
        };
    }).filter(c => c.overdueMonths >= minMonths);

    const totalOverdue = data.reduce((sum, d) => sum + d.overdue, 0);

    res.status(200).json({
        success: true,
        count: data.length,
        totalOverdue,
        data
    });
});
/**
 * @desc    Get Detailed Customer Ledger for Individual Statement
 * @route   GET /api/reports/customer-ledger/:id
 */
exports.getCustomerDetailedLedger = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id)
        .populate('projectId')
        .populate('plotId')
        .populate('assignedExecutive', 'name userId');

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // Get all ledger entries for this customer
    const ledgerEntries = await Ledger.find({
        partyId: customer._id,
        partyType: 'customer',
        active: true
    }).sort({ transactionDate: 1 });

    // Format the data as requested
    const formattedLedger = ledgerEntries.map(entry => ({
        date: entry.transactionDate,
        trNo: entry.voucherNo || 'N/A',
        particular: entry.particulars,
        debit: entry.debit,
        credit: entry.credit
    }));

    // Calculate running balance
    let balance = 0;
    const dataWithBalance = formattedLedger.map(item => {
        balance += (item.debit - item.credit);
        return {
            ...item,
            balance: balance
        };
    });

    res.status(200).json({
        success: true,
        customerInfo: {
            name: customer.name,
            address: customer.address,
            phone: customer.phone,
            project: customer.projectId?.projectName,
            mauza: customer.projectId?.mauza,
            phn: customer.projectId?.phn,
            taluka: customer.projectId?.taluka,
            district: customer.projectId?.district,
            khasara: customer.projectId?.khasara,
            plotNo: customer.plotId?.plotNumber,
            area: customer.plotId?.size || customer.sqFt,
            rate: customer.rate,
            dealValue: customer.dealValue,
            emiAmount: customer.emiAmount,
            emiStartDate: customer.emiStartDate,
            agreementDate: customer.agreementDate,
            lastDate: customer.emiStartDate ? new Date(new Date(customer.emiStartDate).setMonth(new Date(customer.emiStartDate).getMonth() + (customer.tenure || 0))) : null,
            executive: customer.assignedExecutive?.name || 'N/A',
            executiveId: customer.assignedExecutive?.userId || 'N/A',
            remark: customer.remarks
        },
        ledger: dataWithBalance,
        totalDebit: dataWithBalance.reduce((acc, curr) => acc + curr.debit, 0),
        totalCredit: dataWithBalance.reduce((acc, curr) => acc + curr.credit, 0)
    });
});

/**
 * @desc    Executive Business Statement - Personal and Group sales
 * @route   GET /api/reports/executive-business
 */
exports.getExecutiveBusinessReport = asyncHandler(async (req, res, next) => {
    const { executiveId, startDate, endDate } = req.query;

    if (!executiveId) {
        return res.status(400).json({ success: false, error: 'Please provide executive ID' });
    }

    const executive = await Executive.findById(executiveId);
    if (!executive) {
        return res.status(404).json({ success: false, error: 'Executive not found' });
    }

    // Filters
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    // 1. Personal Business
    const personalQuery = { assignedExecutive: executive._id, active: true };
    if (startDate || endDate) personalQuery.bookingDate = dateQuery;

    const personalCustomers = await Customer.find(personalQuery)
        .select('name dealValue paidAmount')
        .sort({ name: 1 });

    const personalBusiness = personalCustomers.map(c => ({
        name: c.name,
        saleAmount: c.dealValue || 0,
        recAmount: c.paidAmount || 0
    }));

    // 2. Group Business (Direct subordinates)
    const subordinates = await Executive.find({ senior: executive._id, active: true });

    const groupBusinessPromises = subordinates.map(async (sub) => {
        const subQuery = { assignedExecutive: sub._id, active: true };
        if (startDate || endDate) subQuery.bookingDate = dateQuery;

        const results = await Customer.aggregate([
            { $match: subQuery },
            {
                $group: {
                    _id: null,
                    totalSale: { $sum: '$dealValue' },
                    totalRec: { $sum: '$paidAmount' }
                }
            }
        ]);

        return {
            name: sub.name,
            saleAmount: results.length > 0 ? results[0].totalSale : 0,
            recAmount: results.length > 0 ? results[0].totalRec : 0
        };
    });

    const groupBusiness = await Promise.all(groupBusinessPromises);

    res.status(200).json({
        success: true,
        executiveInfo: {
            name: executive.name,
            phone: executive.phone,
            pan: executive.panCard
        },
        personalBusiness,
        groupBusiness,
        personalTotal: {
            sale: personalBusiness.reduce((sum, item) => sum + item.saleAmount, 0),
            rec: personalBusiness.reduce((sum, item) => sum + item.recAmount, 0)
        },
        groupTotal: {
            sale: groupBusiness.reduce((sum, item) => sum + item.saleAmount, 0),
            rec: groupBusiness.reduce((sum, item) => sum + item.recAmount, 0)
        }
    });
});
/**
 * @desc    Get Birthday/Anniversary Reminders
 * @route   GET /api/reports/birthday-reminders
 */
exports.getBirthdayAnniversaryReminders = asyncHandler(async (req, res, next) => {
    const { date, type, reminderType } = req.query;

    const searchDate = date ? new Date(date) : new Date();
    const day = searchDate.getDate();
    const month = searchDate.getMonth() + 1;

    let results = [];

    if (type === 'Customer') {
        const queryField = reminderType === 'Marriage Anniversary' ? 'marriageDate' : 'birthDate';

        results = await Customer.aggregate([
            {
                $project: {
                    name: 1,
                    phone: 1,
                    birthDate: 1,
                    marriageDate: 1,
                    plotId: 1,
                    assignedExecutive: 1,
                    day: { $dayOfMonth: `$${queryField}` },
                    month: { $month: `$${queryField}` }
                }
            },
            {
                $match: {
                    day: day,
                    month: month
                }
            },
            {
                $lookup: {
                    from: 'plots',
                    localField: 'plotId',
                    foreignField: '_id',
                    as: 'plotInfo'
                }
            },
            {
                $lookup: {
                    from: 'executives',
                    localField: 'assignedExecutive',
                    foreignField: '_id',
                    as: 'exeInfo'
                }
            },
            {
                $unwind: { path: '$plotInfo', preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: '$exeInfo', preserveNullAndEmptyArrays: true }
            }
        ]);

        results = results.map(r => ({
            name: r.name,
            phone: r.phone,
            plotNo: r.plotInfo?.plotNumber || 'N/A',
            exeCode: r.exeInfo?.code || 'N/A',
            dob: r[queryField] ? new Date(r[queryField]).toLocaleDateString('en-GB') : 'N/A'
        }));

    } else {
        results = await Executive.aggregate([
            {
                $project: {
                    name: 1,
                    phone: 1,
                    birthDate: 1,
                    code: 1,
                    day: { $dayOfMonth: '$birthDate' },
                    month: { $month: '$birthDate' }
                }
            },
            {
                $match: {
                    day: day,
                    month: month
                }
            }
        ]);

        results = results.map(r => ({
            name: r.name,
            phone: r.phone,
            plotNo: 'N/A',
            exeCode: r.code,
            dob: r.birthDate ? new Date(r.birthDate).toLocaleDateString('en-GB') : 'N/A'
        }));
    }

    res.status(200).json({
        success: true,
        data: results
    });
});
