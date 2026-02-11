const Customer = require('../models/Customer');
const Plot = require('../models/Plot');
const Project = require('../models/Project');
const Ledger = require('../models/Ledger');
const asyncHandler = require('../middleware/asyncHandler');
const { PLOT_STATUS, PARTY_TYPES, COMMISSION_TRIGGERS } = require('../utils/constants');
const { processCommission } = require('./commissionController');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private
 * @business When customer is created, plot status changes to 'sold'
 */
exports.createCustomer = asyncHandler(async (req, res, next) => {
    // Check if project exists
    const project = await Project.findById(req.body.projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    // Check if plot exists and is available
    const plot = await Plot.findById(req.body.plotId);
    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found'
        });
    }

    // Check if plot belongs to the project
    if (plot.projectId.toString() !== req.body.projectId) {
        return res.status(400).json({
            success: false,
            error: 'Plot does not belong to the specified project'
        });
    }

    // Check if plot is available
    if (plot.status === PLOT_STATUS.SOLD) {
        return res.status(400).json({
            success: false,
            error: 'This plot is already sold'
        });
    }

    // Check if plot is already assigned to another customer
    const existingCustomer = await Customer.findOne({ plotId: req.body.plotId, active: true });
    if (existingCustomer) {
        return res.status(400).json({
            success: false,
            error: 'This plot is already assigned to another customer'
        });
    }

    // Create customer with all fields from body
    const customer = await Customer.create({
        ...req.body,
        createdBy: req.user.id
    });

    // BUSINESS RULE: Update plot status to 'sold'
    await Plot.findByIdAndUpdate(req.body.plotId, { status: PLOT_STATUS.SOLD });

    // BUSINESS RULE: Create initial ledger entry (debit - customer owes money)
    await Ledger.create({
        partyType: PARTY_TYPES.CUSTOMER,
        partyId: customer._id,
        debit: customer.dealValue,
        credit: 0,
        balance: customer.dealValue, // Customer owes full amount
        description: 'Initial booking - Deal value',
        referenceType: 'customer',
        referenceId: customer._id,
        enteredBy: req.user.id
    });

    // BUSINESS RULE: Process any applicable commissions
    await processCommission(COMMISSION_TRIGGERS.DEAL_CLOSED, {
        executiveId: customer.assignedExecutive,
        projectId: customer.projectId,
        plotId: customer.plotId,
        customerId: customer._id,
        amount: customer.dealValue
    });

    // Populate and return customer
    const populatedCustomer = await Customer.findById(customer._id)
        .populate('projectId', 'projectName location')
        .populate('plotId', 'plotNumber size rate')
        .populate('assignedExecutive', 'name phone')
        .populate('createdBy', 'name');

    // Send notification
    await createNotification({
        type: 'customer_added',
        title: 'New Customer Added',
        message: `${customer.firstName} ${customer.lastName} booked Plot ${plot.plotNumber} in ${project.projectName}`,
        icon: '👤',
        referenceId: customer._id.toString(),
        referenceType: 'customer'
    });

    res.status(201).json({
        success: true,
        message: 'Customer created successfully. Plot marked as sold.',
        data: populatedCustomer
    });
});

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @query   projectId, plotId, assignedExecutive, active
 * @access  Private
 */
exports.getCustomers = asyncHandler(async (req, res, next) => {
    const { projectId, plotId, assignedExecutive, active, phone } = req.query;

    // Build query
    let query = {};

    if (projectId) query.projectId = projectId;
    if (plotId) query.plotId = plotId;
    if (assignedExecutive) query.assignedExecutive = assignedExecutive;
    if (phone) query.phone = phone;

    if (active !== undefined) {
        query.active = active === 'true';
    } else {
        query.active = true;
    }

    const customers = await Customer.find(query)
        .populate('projectId', 'projectName location')
        .populate('plotId', 'plotNumber size rate status')
        .populate('assignedExecutive', 'name phone')
        .populate('assignedExecutives.executiveId', 'name phone role userId')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: customers.length,
        data: customers
    });
});

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
exports.getCustomer = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id)
        .populate('projectId', 'projectName location')
        .populate('plotId', 'plotNumber size rate status totalValue')
        .populate('assignedExecutive', 'name phone')
        .populate('assignedExecutives.executiveId', 'name phone role userId')
        .populate('createdBy', 'name');

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    res.status(200).json({
        success: true,
        data: customer
    });
});

/**
 * @desc    Update customer (Customer Entry Modify)
 * @route   PUT /api/customers/:id
 * @access  Private
 * @business CANNOT change plotId once customer is created (sold)
 */
exports.updateCustomer = asyncHandler(async (req, res, next) => {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // BUSINESS RULE: Cannot change plotId once customer is assigned
    if (req.body.plotId && req.body.plotId !== customer.plotId.toString()) {
        return res.status(400).json({
            success: false,
            error: 'Cannot change plot once a customer is assigned. Plot is already sold.'
        });
    }

    // BUSINESS RULE: Cannot change projectId
    if (req.body.projectId && req.body.projectId !== customer.projectId.toString()) {
        return res.status(400).json({
            success: false,
            error: 'Cannot change project once a customer is assigned'
        });
    }

    // Prepare update object from body
    const updateData = { ...req.body };

    // Handle deal value change with ledger adjustment
    if (req.body.dealValue && req.body.dealValue !== customer.dealValue) {
        const difference = req.body.dealValue - customer.dealValue;

        updateData.balanceAmount = req.body.dealValue - customer.paidAmount;

        // Create adjustment ledger entry
        if (difference !== 0) {
            await Ledger.create({
                partyType: PARTY_TYPES.CUSTOMER,
                partyId: customer._id,
                debit: difference > 0 ? difference : 0,
                credit: difference < 0 ? Math.abs(difference) : 0,
                balance: updateData.balanceAmount,
                description: `Deal value adjustment: ${difference > 0 ? '+' : ''}${difference}`,
                referenceType: 'adjustment',
                referenceId: customer._id,
                enteredBy: req.user.id
            });
        }
    }

    customer = await Customer.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate('projectId', 'projectName location')
        .populate('plotId', 'plotNumber size rate status')
        .populate('assignedExecutive', 'name phone');

    res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
    });
});

/**
 * @desc    Deactivate customer (soft delete)
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
exports.deactivateCustomer = asyncHandler(async (req, res, next) => {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // Soft delete
    customer = await Customer.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    // Note: We do NOT change plot status back to available
    // This is a business decision - sold plots remain sold

    res.status(200).json({
        success: true,
        message: 'Customer deactivated successfully',
        data: customer
    });
});

/**
 * @desc    Get customer payment summary
 * @route   GET /api/customers/:id/summary
 * @access  Private
 */
exports.getCustomerSummary = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id)
        .populate('projectId', 'projectName')
        .populate('plotId', 'plotNumber size rate');

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // Get ledger entries for this customer
    const ledgerEntries = await Ledger.find({
        partyType: PARTY_TYPES.CUSTOMER,
        partyId: customer._id,
        active: true
    }).sort({ transactionDate: 1 });

    res.status(200).json({
        success: true,
        data: {
            customer: {
                name: customer.name,
                phone: customer.phone,
                project: customer.projectId.projectName,
                plot: customer.plotId.plotNumber
            },
            financials: {
                dealValue: customer.dealValue,
                paidAmount: customer.paidAmount,
                balanceAmount: customer.balanceAmount
            },
            ledger: ledgerEntries
        }
    });
});
