const CommissionRule = require('../models/CommissionRule');
const CommissionLedger = require('../models/CommissionLedger');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Plot = require('../models/Plot');
const {
    COMMISSION_TYPES,
    COMMISSION_TRIGGERS,
    COMMISSION_BASIS,
    COMMISSION_STATUS,
    ROLES,
    TDS_RATE,
    PAYMENT_MODES
} = require('../utils/constants');

// @desc    Create a new commission rule
// @route   POST /api/commission/rules
// @access  Private (Boss only)
exports.createRule = async (req, res) => {
    try {
        const rule = await CommissionRule.create(req.body);
        res.status(201).json({
            success: true,
            data: rule
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get all commission rules
// @route   GET /api/commission/rules
// @access  Private (Boss only)
exports.getRules = async (req, res) => {
    try {
        const rules = await CommissionRule.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: rules.length,
            data: rules
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete a commission rule
// @route   DELETE /api/commission/rules/:id
// @access  Private (Boss only)
exports.deleteRule = async (req, res) => {
    try {
        const rule = await CommissionRule.findByIdAndDelete(req.params.id);
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
        }
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get commission ledger for an executive
// @route   GET /api/commission/executive/:id
// @access  Private (Boss & Owner Executive)
exports.getExecutiveLedger = async (req, res) => {
    try {
        const ledger = await CommissionLedger.find({ executiveId: req.params.id })
            .populate('customerId', 'name dealValue')
            .populate('commissionRuleId', 'name type value')
            .sort({ generatedAt: -1 });

        // Calculate totals
        const totalEarned = ledger
            .filter(item => item.status === COMMISSION_STATUS.EARNED)
            .reduce((acc, item) => acc + item.amount, 0);

        const totalPaid = ledger
            .filter(item => item.status === COMMISSION_STATUS.PAID)
            .reduce((acc, item) => acc + item.amount, 0);

        const pendingBalance = totalEarned - totalPaid; // Simplified; logic may vary if PAID entries are distinct records

        // NOTE: In this design, if we pay, do we update the status of 'EARNED' records to 'PAID', 
        // OR do we create a new negative 'PAID' record?
        // Prompt says "CommissionLedger fields: ... status (earned | paid)". 
        // Usually, you update the status of the specific commission entry to 'PAID' when it is paid.
        // OR you create a payout record.
        // For "pay" API, we likely group unpaid earned commissions and mark them as paid.

        let balance = 0;
        const unpaidCommissions = await CommissionLedger.find({
            executiveId: req.params.id,
            status: COMMISSION_STATUS.EARNED
        });

        balance = unpaidCommissions.reduce((acc, item) => acc + item.amount, 0);

        res.status(200).json({
            success: true,
            summary: {
                totalEarned,
                totalPaid, // This metric depends on if we track paid amounts separately or just change status
                balance
            },
            data: ledger
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Pay commission to active executive
// @route   POST /api/commission/pay
// @access  Private (Boss only)
exports.payCommission = async (req, res) => {
    const { executiveId, amount, remarks } = req.body;

    // This is a simple payout which might not link to specific ledger entries, 
    // OR it marks oldest entries as paid.
    // For simplicity and robustness, we will create a "PAYOUT" record
    // AND mostly likely we should mark existing 'EARNED' records as 'PAID'.

    // Strategy: 
    // 1. Find all EARNED records.
    // 2. Iterate and mark as PAID until amount is covered? 
    // OR
    // 3. Just create a debit entry.

    // The prompt implies "CommissionLedger fields: status (earned | paid)".
    // This suggests individual commission records change status.

    try {
        // Find unpaid commissions
        const unpaid = await CommissionLedger.find({
            executiveId,
            status: COMMISSION_STATUS.EARNED
        }).sort({ generatedAt: 1 }); // Oldest first

        let remainingPay = amount;
        let paidIds = [];

        if (remainingPay <= 0) {
            throw new Error('Invalid payment amount');
        }

        // Check if enough balance
        const totalUnpaid = unpaid.reduce((sum, item) => sum + item.amount, 0);
        if (amount > totalUnpaid) {
            throw new Error(`Amount exceeds pending balance of ${totalUnpaid}`);
        }

        for (const record of unpaid) {
            if (remainingPay <= 0) break;

            // If we can pay this record fully
            if (remainingPay >= record.amount) {
                record.status = COMMISSION_STATUS.PAID;
                record.paidAt = Date.now();
                record.description += ` (Paid via standard payout)`;
                await record.save();

                remainingPay -= record.amount;
                paidIds.push(record._id);
            } else {
                // Partial payment is complex in this model. 
                // We will skip strict partial support for individual records to keep it clean,
                // or split the record. Splitting is better for accounting.

                const unpaidPortion = record.amount - remainingPay;

                // Update current record to be the PAID portion
                record.amount = remainingPay;
                record.status = COMMISSION_STATUS.PAID;
                record.paidAt = Date.now();
                record.description += ` (Partially Paid)`;
                await record.save();

                // Create new record for the remainder
                await CommissionLedger.create({
                    executiveId,
                    commissionRuleId: record.commissionRuleId,
                    customerId: record.customerId,
                    amount: unpaidPortion,
                    status: COMMISSION_STATUS.EARNED, // Still earned/pending
                    referenceTransactionId: record.referenceTransactionId,
                    description: record.description.replace('(Partially Paid)', '(Remaining Balance)'),
                    generatedAt: record.generatedAt // Keep original date
                });

                paidIds.push(record._id);
                remainingPay = 0;
            }
        }

        res.status(200).json({
            success: true,
            message: `Paid ${amount} to executive`,
            paidRecordIds: paidIds
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// ==========================================
// INTERNAL LOGIC (To be called by other controllers)
// ==========================================

/**
 * Calculate and record commission
 * @param {string} triggerEvent - DEAL_CLOSED or PAYMENT_RECEIVED
 * @param {Object} data - Context data
 * @param {Object} data.executiveId - The executive (if applicable)
 * @param {Object} data.projectId - The project
 * @param {Object} data.plotId - The plot
 * @param {Object} data.customerId - The customer
 * @param {number} data.amount - The amount to base calc on (Deal Value or Paid Amount)
 * @param {Object} data.transactionId - (Optional)
 */
exports.processCommission = async (triggerEvent, data) => {
    try {
        const { executiveId, projectId, customerId, amount, transactionId, paymentMode } = data;

        const customer = await Customer.findById(customerId).populate('assignedExecutives.executiveId');
        if (!customer) return;

        const plot = await Plot.findById(customer.plotId);
        if (!plot) return;

        // RATE VARIANCE DEDUCTION: If sold below standard rate, deduct from commission
        const plotStandardRate = plot.rate || 0;
        const customerSoldRate = customer.rate || 0;
        const shortagePerUnit = plotStandardRate - customerSoldRate;

        if (triggerEvent === COMMISSION_TRIGGERS.DEAL_CLOSED && shortagePerUnit > 0) {
            const totalShortage = shortagePerUnit * (customer.sqFt || customer.size || 0);

            if (totalShortage > 0 && customer.assignedExecutives && customer.assignedExecutives.length > 0) {
                const totalCommPercentage = customer.assignedExecutives.reduce((sum, item) => sum + (item.percentage || 0), 0);

                for (const item of customer.assignedExecutives) {
                    const exec = item.executiveId;
                    if (!exec || !item.percentage) continue;

                    // Executive's share of the shortage based on their commission share
                    const execShortageShare = (totalShortage * item.percentage) / (totalCommPercentage || 100);

                    await CommissionLedger.create({
                        executiveId: exec._id,
                        customerId,
                        amount: -execShortageShare, // Negative amount for deduction
                        status: COMMISSION_STATUS.EARNED,
                        description: `Rate Shortage Deduction: Sold at ${customerSoldRate} (Std: ${plotStandardRate}) [Loss: ₹${totalShortage.toFixed(2)}]`
                    });
                }
            }
        }

        // NEW LOGIC: Check for customer-specific executive percentages first
        if (customer.assignedExecutives && customer.assignedExecutives.length > 0) {
            for (const item of customer.assignedExecutives) {
                const exec = item.executiveId;
                if (!exec) continue;

                let commissionAmount = (amount * item.percentage) / 100;

                if (commissionAmount > 0) {
                    let description = `Customer Specific Commission (${item.percentage}%)`;

                    // TDS Logic: Deduct if not cash
                    if (paymentMode && paymentMode.toLowerCase() !== PAYMENT_MODES.CASH.toLowerCase()) {
                        const tds = (commissionAmount * TDS_RATE) / 100;
                        commissionAmount -= tds;
                        description += ` [Less ${TDS_RATE}% TDS: ₹${tds.toFixed(2)}]`;
                    }

                    await CommissionLedger.create({
                        executiveId: exec._id,
                        customerId,
                        amount: commissionAmount,
                        status: COMMISSION_STATUS.EARNED,
                        referenceTransactionId: transactionId,
                        description
                    });
                }
            }
            return; // Exit after processing specific assignments
        }

        if (!executiveId) return;

        const user = await User.findById(executiveId);
        if (!user) return;

        // 1. Find Rules for Executive/User role
        const execRules = await CommissionRule.findApplicableRules(user.role, projectId);

        // 2. Filter by Trigger Event
        const applicableRules = execRules.filter(r => r.triggerEvent === triggerEvent);

        for (const rule of applicableRules) {
            let commissionAmount = 0;

            if (triggerEvent === COMMISSION_TRIGGERS.DEAL_CLOSED && rule.basis === COMMISSION_BASIS.FULL_DEAL_VALUE) {
                commissionAmount = calculateAmount(rule, amount);
            } else if (triggerEvent === COMMISSION_TRIGGERS.PAYMENT_RECEIVED && rule.basis === COMMISSION_BASIS.RECEIVED_AMOUNT) {
                commissionAmount = calculateAmount(rule, amount);
            }

            // Generate Ledger Entry
            if (commissionAmount > 0) {
                let description = `Commission for ${rule.name} (${rule.type}: ${rule.value})`;

                // TDS Logic: Deduct if not cash
                if (paymentMode && paymentMode.toLowerCase() !== PAYMENT_MODES.CASH.toLowerCase()) {
                    const tds = (commissionAmount * TDS_RATE) / 100;
                    commissionAmount -= tds;
                    description += ` [Less ${TDS_RATE}% TDS: ₹${tds.toFixed(2)}]`;
                }

                await CommissionLedger.create({
                    executiveId: user._id,
                    commissionRuleId: rule._id,
                    customerId,
                    amount: commissionAmount,
                    status: COMMISSION_STATUS.EARNED, // Default to earned
                    referenceTransactionId: transactionId,
                    description
                });
            }
        }

    } catch (err) {
        console.error('Commission Calculation Error:', err);
    }
};

const calculateAmount = (rule, baseAmount) => {
    if (rule.type === COMMISSION_TYPES.PERCENTAGE) {
        return (baseAmount * rule.value) / 100;
    } else {
        return rule.value; // Fixed amount
    }
};
